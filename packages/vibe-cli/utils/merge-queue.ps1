. "$PSScriptRoot/result-contracts.ps1"
. "$PSScriptRoot/task-log.ps1"
. "$PSScriptRoot/git-retry.ps1"

$script:MergeQueue = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()
$script:MergeTracker = [System.Collections.Concurrent.ConcurrentDictionary[string,bool]]::new()
$script:MergeInProgress = $null

function Add-MergeQueue {
    param(
        [Parameter(Mandatory)][string]$TaskId,
        [bool]$EscalationActive = $false
    )

    # Defense-in-depth: reject enqueue during active escalation
    if ($EscalationActive) { return $false }

    # Atomic duplicate prevention via TryAdd (never use ContainsKey)
    if ($script:MergeTracker.TryAdd($TaskId, $true)) {
        $script:MergeQueue.Enqueue($TaskId)
        return $true
    }

    return $false
}

function Start-NextMerge {
    if ($script:MergeInProgress) { return $null }

    $taskId = $null
    if ($script:MergeQueue.TryDequeue([ref]$taskId)) {
        $script:MergeInProgress = $taskId
        return $taskId
    }

    return $null
}

function Get-MergeInProgress { return $script:MergeInProgress }

function Get-MergeQueueCount { return $script:MergeQueue.Count }

function Test-MergeQueueEmpty {
    return ($script:MergeQueue.Count -eq 0 -and -not $script:MergeInProgress)
}

function Invoke-Merge {
    param(
        [Parameter(Mandatory)][string]$TaskId,
        [Parameter(Mandatory)][string]$WorktreePath,
        [Parameter(Mandatory)][string]$BranchName,
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][hashtable]$Counters,
        [string]$FeatureDir,
        [string]$RunId
    )

    if (-not $Counters.ContainsKey('mergeRetries')) { $Counters.mergeRetries = 0 }
    Write-StatusNote -TaskId $TaskId -Status 'Merging' -Detail $BranchName

    while ($true) {
        Write-TaskLog -TaskId $TaskId -Phase 'done' -Message "Attempting merge of $BranchName (retry $($Counters.mergeRetries)/$($Config.MaxMergeRetries))" -FeatureDir $FeatureDir -RunId $RunId

        # Attempt merge
        $mergeOutput = $null
        $mergeExitCode = 0
        try {
            $mergeOutput = Invoke-GitWithRetry -Arguments @('merge', $BranchName, '--no-ff')
        }
        catch {
            $mergeOutput = $_.Exception.Message
            $mergeExitCode = 1
        }

        if ($mergeExitCode -eq 0 -and $mergeOutput -notmatch 'CONFLICT') {
            # Merge succeeded — run post-merge verification
            $verifyPassed = $true
            foreach ($cmd in @($Config.VerifyTest, $Config.VerifyLint, $Config.VerifyTsc)) {
                try {
                    $exitCode = Invoke-VerifyCommand -Command $cmd
                    if ($exitCode -ne 0) {
                        $verifyPassed = $false
                        break
                    }
                }
                catch {
                    $verifyPassed = $false
                    break
                }
            }

            if ($verifyPassed) {
                # Clean up workspace
                try {
                    Remove-TaskWorkspace -TaskId $TaskId -WorktreePath $WorktreePath -BranchName $BranchName -FeatureDir $FeatureDir -RunId $RunId
                }
                catch { }

                $script:MergeInProgress = $null
                $null = $script:MergeTracker.TryRemove($TaskId, [ref]$null)

                Write-TaskLog -TaskId $TaskId -Phase 'done' -Message "MERGED" -FeatureDir $FeatureDir -RunId $RunId

                return ConvertTo-MergeResult @{
                    TaskId = $TaskId; Success = $true; Conflict = $false
                    RetryCount = $Counters.mergeRetries; AbortedClean = $true; WorkspaceRemoved = $true
                }
            }

            # Post-merge verify failed — consume a merge retry
            $Counters.mergeRetries++
            Write-TaskLog -TaskId $TaskId -Phase 'done' -Message "Post-merge verification failed (retry $($Counters.mergeRetries)/$($Config.MaxMergeRetries))" -FeatureDir $FeatureDir -RunId $RunId

            if ($Counters.mergeRetries -ge $Config.MaxMergeRetries) {
                $script:MergeInProgress = $null
                return ConvertTo-MergeResult @{
                    TaskId = $TaskId; Success = $false; Conflict = $false
                    RetryCount = $Counters.mergeRetries; AbortedClean = $true; WorkspaceRemoved = $false
                }
            }

            # Revert merge for retry
            try { Invoke-GitWithRetry -Arguments @('reset', '--hard', 'HEAD~1') } catch { }
            continue
        }

        # Merge conflict detected
        Write-TaskLog -TaskId $TaskId -Phase 'done' -Message 'Merge conflict detected' -FeatureDir $FeatureDir -RunId $RunId

        # Abort BEFORE resolver dispatch (BLOCKING objection #14)
        $abortedClean = $true
        try {
            Invoke-GitWithRetry -Arguments @('merge', '--abort')
        }
        catch {
            $abortedClean = $false
        }

        # Boundary check BEFORE dispatching resolver
        if ($Counters.mergeRetries -ge $Config.MaxMergeRetries) {
            $script:MergeInProgress = $null
            return ConvertTo-MergeResult @{
                TaskId = $TaskId; Success = $false; Conflict = $true
                RetryCount = $Counters.mergeRetries; AbortedClean = $abortedClean; WorkspaceRemoved = $false
            }
        }

        $Counters.mergeRetries++

        # Dispatch merge resolver
        $resolverFile = Join-Path $Root 'agents/code-writers/merge-resolver.md'
        $conflictPrompt = "Resolve merge conflict for task $TaskId merging $BranchName"

        try {
            Invoke-Claude -SystemPromptFile $resolverFile -Prompt $conflictPrompt -TaskId $TaskId | Out-Null
        }
        catch {
            # Infrastructure failure during resolver — escalate without consuming retry
            $Counters.mergeRetries--
            $script:MergeInProgress = $null
            return ConvertTo-MergeResult @{
                TaskId = $TaskId; Success = $false; Conflict = $true
                RetryCount = $Counters.mergeRetries; AbortedClean = $abortedClean; WorkspaceRemoved = $false
            }
        }
    }
}

function Complete-TaskMerge {
    <#
    .SYNOPSIS
        TLA+ TaskMerged transition — increments tasksDone, transitions back to running.
    .DESCRIPTION
        Guards: pipeline must not be terminal, pipelineState must be 'mergeQueue',
        and tasksDone must be < NumTasks (boundary guard).
        Mutates: tasksDone' = tasksDone + 1, pipelineState' = 'running'.
        UNCHANGED: lockHolder, reviewRound, keepGoingResets, tddKeepGoingCount,
                   verdict, gateTimedOut, globalTimedOut, reviewGateType.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config
    )

    # ── Guard: terminal state absorption ──
    Assert-PipelineNotTerminal -State $State -CallerName 'Complete-TaskMerge'

    # ── Guard: must be in mergeQueue ──
    if ($State.pipelineState -ne 'mergeQueue') {
        throw "Complete-TaskMerge requires pipelineState 'mergeQueue', got '$($State.pipelineState)'."
    }

    # ── Guard: tasksDone boundary — never exceed NumTasks ──
    if ($State.tasksDone -eq $Config['NumTasks']) {
        throw "Complete-TaskMerge: tasksDone ($($State.tasksDone)) already equals NumTasks ($($Config['NumTasks'])) — cannot increment."
    }

    # ── State transition ──
    $State.tasksDone     = $State.tasksDone + 1
    $State.pipelineState = 'running'
}

function Test-AllTasksDone {
    <#
    .SYNOPSIS
        TLA+ guard: returns $true when tasksDone = NumTasks (all tasks complete).
    .DESCRIPTION
        Used to decide between EnterPreMergeReview (tasksDone < NumTasks)
        and EnterFinalReview (tasksDone = NumTasks).
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config
    )

    return ($State.tasksDone -eq $Config['NumTasks'])
}

function Complete-MergeRelease {
    <#
    .SYNOPSIS
        Releases the merge-in-progress lock for a given task, allowing the next
        queued task to dequeue via Start-NextMerge.
    .DESCRIPTION
        Idempotent — if TaskId is not the active merge, this is a no-op.
        Also removes from MergeTracker so the task can be re-enqueued (retry scenarios).
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$TaskId
    )

    if ($script:MergeInProgress -eq $TaskId) {
        $script:MergeInProgress = $null
        $null = $script:MergeTracker.TryRemove($TaskId, [ref]$null)
    }
}

function Reset-MergeCounter {
    param([Parameter(Mandatory)][hashtable]$State)
    $State.mergeRetries = 0
    $State.taskStatus = 'completed'
    $null = $script:MergeTracker.TryRemove($State.taskId, [ref]$null)
    if ($State.taskId) {
        $null = $script:MergeTracker.TryAdd($State.taskId, $true)
    }
    return $State
}

function Invoke-SerializedMerge {
    param(
        [Parameter(Mandatory)][string]$Feature,
        [Parameter(Mandatory)][string]$WorktreePath,
        [Parameter(Mandatory)][string]$TargetBranch,
        [Parameter(Mandatory)][hashtable]$TaskState,
        [string]$MutexName,
        [int]$MutexTimeoutMs = 300000,  # 5 min
        [int]$RebaseTimeoutMs = 60000,  # 60s
        [int]$MaxRetries = 3
    )

    if (-not $MutexName) { $MutexName = "Global\vibe-cli-merge-$Feature" }

    # Acquire merge mutex (serializes merges within feature)
    # pipeline lock BEFORE merge mutex — never reverse
    $mutex = [System.Threading.Mutex]::new($false, $MutexName)
    $acquired = $false

    try {
        try { $acquired = $mutex.WaitOne($MutexTimeoutMs) }
        catch [System.Threading.AbandonedMutexException] {
            Write-Warning "Merge mutex recovered from abandoned state"
            $acquired = $true
        }

        if (-not $acquired) {
            $TaskState.taskState = 'failed'
            $TaskState.failureReason = 'MergeMutexTimeout'
            return @{ success = $false; reason = 'MergeMutexTimeout' }
        }

        # Rebase INSIDE mutex (no TOCTOU gap)
        $TaskState.mergeState = 'merging'

        try {
            Push-Location $WorktreePath
            $rebaseResult = & git rebase $TargetBranch 2>&1
            if ($LASTEXITCODE -ne 0) {
                & git rebase --abort 2>$null
                return @{ success = $false; reason = 'RebaseConflict' }
            }

            # Merge into target
            Pop-Location
            $mergeResult = & git merge --no-ff $WorktreePath 2>&1
            if ($LASTEXITCODE -ne 0) {
                & git merge --abort 2>$null
                return @{ success = $false; reason = 'MergeConflict' }
            }

            $TaskState.mergeState = 'merged'
            $TaskState.taskState = 'merged'
            return @{ success = $true }
        }
        finally {
            if ((Get-Location).Path -ne $WorktreePath) { } else { Pop-Location }
        }
    }
    finally {
        if ($acquired) { $mutex.ReleaseMutex() }
        $mutex.Dispose()
    }
}

function Reset-MergeQueue {
    $script:MergeQueue = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()
    $script:MergeTracker = [System.Collections.Concurrent.ConcurrentDictionary[string,bool]]::new()
    $script:MergeInProgress = $null
}
