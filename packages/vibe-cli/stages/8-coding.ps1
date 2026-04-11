. "$PSScriptRoot/../utils/config.ps1"
. "$PSScriptRoot/../utils/task-log.ps1"
. "$PSScriptRoot/../utils/job-runner.ps1"
. "$PSScriptRoot/../utils/git-retry.ps1"
. "$PSScriptRoot/../utils/result-contracts.ps1"
. "$PSScriptRoot/../utils/validate-plan.ps1"
. "$PSScriptRoot/../utils/workspace.ps1"
. "$PSScriptRoot/../utils/read-escalation.ps1"
. "$PSScriptRoot/../utils/tdd-red.ps1"
. "$PSScriptRoot/../utils/tdd-green.ps1"
. "$PSScriptRoot/../utils/tdd-cleanup.ps1"
. "$PSScriptRoot/../utils/agent-writer.ps1"
. "$PSScriptRoot/../utils/merge-queue.ps1"
. "$PSScriptRoot/../utils/final-verification.ps1"

function Invoke-CodingStage {
    param(
        [Parameter(Mandatory)][string]$PlanJsonPath,
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$FeatureDir,
        [string]$FeatureName = (Split-Path $FeatureDir -Leaf),
        [hashtable]$ResumeState = $null
    )

    $PipelineRunId = [guid]::NewGuid().ToString()
    $pipelineStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $pipelineStatus = 'running'
    $escalationActive = $false

    Write-TaskLog -TaskId 'PIPELINE' -Phase 'init' -Message "Pipeline starting (RunId: $PipelineRunId)" -FeatureDir $FeatureDir -RunId $PipelineRunId

    # ── Step 1: Validate plan ──
    $validation = Test-ImplementationPlan -PlanJsonPath $PlanJsonPath -Root $Root -FeatureDir $FeatureDir -PipelineRunId $PipelineRunId

    if ($validation.Status -eq 'failed') {
        Write-TaskLog -TaskId 'PIPELINE' -Phase 'validation' -Message "HALTED: Validation failed" -Detail ($validation.Errors -join "`n") -FeatureDir $FeatureDir -RunId $PipelineRunId
        return @{ PipelineStatus = 'halted'; Reason = 'validation_failed'; Errors = $validation.Errors; RunId = $PipelineRunId }
    }

    if ($validation.Warnings.Count -gt 0) {
        foreach ($w in $validation.Warnings) {
            Write-TaskLog -TaskId 'PIPELINE' -Phase 'validation' -Message "WARNING: $w" -FeatureDir $FeatureDir -RunId $PipelineRunId
        }
    }

    # Create pipeline lock
    $lockPath = Join-Path $FeatureDir 'pipeline.lock'
    try {
        New-PipelineLock -LockPath $lockPath -PipelineRunId $PipelineRunId
    }
    catch {
        Write-TaskLog -TaskId 'PIPELINE' -Phase 'init' -Message "HALTED: $($_.Exception.Message)" -FeatureDir $FeatureDir -RunId $PipelineRunId
        return @{ PipelineStatus = 'halted'; Reason = 'lock_failed'; Error = $_.Exception.Message; RunId = $PipelineRunId }
    }

    try {
        # Parse plan
        $plan = Get-Content $PlanJsonPath -Raw | ConvertFrom-Json
        $numTiers = if ($plan.tiers) { $plan.tiers.Count } else { 0 }

        # ── Step 2: Zero-tier check ──
        if ($numTiers -eq 0) {
            Write-TaskLog -TaskId 'PIPELINE' -Phase 'complete' -Message 'Zero-tier plan — pipeline completed' -FeatureDir $FeatureDir -RunId $PipelineRunId
            return @{ PipelineStatus = 'completed'; CurrentTier = 1; RunId = $PipelineRunId }
        }

        # Resume state
        if ($ResumeState -and $ResumeState.CompletedTasks) { $completedTasks = $ResumeState.CompletedTasks } else { $completedTasks = [System.Collections.Generic.HashSet[string]]::new() }
        if ($ResumeState -and $ResumeState.MergedTasks) { $mergedTasks = $ResumeState.MergedTasks } else { $mergedTasks = [System.Collections.Generic.HashSet[string]]::new() }

        $taskStatuses = @{}
        $taskCounters = @{}
        $taskWorkspaces = @{}

        # Dispatch table for escalation counter resets
        $ResetDispatch = @{
            (Get-ResetDispatchKey 'task' 'red_retry')     = { param($s) Reset-RedCounters $s }
            (Get-ResetDispatchKey 'task' 'green_retry')   = { param($s) Reset-GreenCounters $s }
            (Get-ResetDispatchKey 'task' 'cleanup')       = { param($s) Reset-CleanupCounters $s }
            (Get-ResetDispatchKey 'task' 'cleanup_remed') = { param($s) Reset-CleanupCounters $s }
            (Get-ResetDispatchKey 'merge' '')              = { param($s) Reset-MergeCounters $s }
            (Get-ResetDispatchKey 'final' '')              = { param($s) Reset-FinalCounters $s }
        }

        # ── Step 3: Tier loop ──
        $currentTier = 1

        while ($currentTier -le $numTiers) {
            # Pipeline timeout check
            if ($pipelineStopwatch.Elapsed.TotalSeconds -gt $Config.PipelineTimeoutSeconds) {
                $pipelineStatus = 'halted'
                Write-TaskLog -TaskId 'PIPELINE' -Phase 'timeout' -Message "HALTED: Pipeline timeout ($($Config.PipelineTimeoutSeconds)s)" -FeatureDir $FeatureDir -RunId $PipelineRunId
                return @{ PipelineStatus = 'halted'; Reason = 'timeout'; RunId = $PipelineRunId }
            }

            # Skip empty tiers (bounded — objections #23, #66)
            $tierData = $plan.tiers | Where-Object { $_.tier -eq $currentTier }
            $tierTasks = if ($tierData) { @($tierData.tasks) } else { @() }

            if ($tierTasks.Count -eq 0) {
                Write-TaskLog -TaskId 'PIPELINE' -Phase 'tier' -Message "Skipping empty tier $currentTier" -FeatureDir $FeatureDir -RunId $PipelineRunId
                $currentTier++
                continue
            }

            # Filter out already-completed tasks (resume support)
            $pendingTasks = @($tierTasks | Where-Object { $_.id -notin $completedTasks })

            if ($pendingTasks.Count -eq 0) {
                Write-TaskLog -TaskId 'PIPELINE' -Phase 'tier' -Message "Tier $currentTier — all tasks already completed" -FeatureDir $FeatureDir -RunId $PipelineRunId
                $currentTier++
                continue
            }

            Write-TaskLog -TaskId 'PIPELINE' -Phase 'tier' -Message "Starting tier $currentTier ($($pendingTasks.Count) tasks)" -FeatureDir $FeatureDir -RunId $PipelineRunId

            # Create workspaces (multi-task tiers)
            $workspaces = $null
            try {
                $workspaces = New-TaskWorkspace -Tasks $pendingTasks -FeatureName $FeatureName -RunId $PipelineRunId -FeatureDir $FeatureDir
            }
            catch {
                $escalationActive = $true
                Write-TaskLog -TaskId 'PIPELINE' -Phase 'workspace' -Message "Workspace creation failed: $($_.Exception.Message)" -FeatureDir $FeatureDir -RunId $PipelineRunId

                $escResult = Read-Escalation -Source 'workspace' -Error_ $_.Exception.Message -TaskStatuses $taskStatuses -FeatureDir $FeatureDir -RunId $PipelineRunId
                $escalationActive = $false

                if ($escResult.Decision -eq 'Stop') {
                    return @{ PipelineStatus = 'halted'; Reason = 'workspace_failure'; RunId = $PipelineRunId }
                }
                continue  # Retry tier
            }

            # Initialize task state
            foreach ($task in $pendingTasks) {
                $taskStatuses[$task.id] = 'pending'
                $taskCounters[$task.id] = @{
                    redRetries = 0; greenAttempts = 0
                    cleanupRemediations = 0; cleanupCleanPasses = 0
                }
                if ($workspaces -and $workspaces.ContainsKey($task.id)) {
                    $taskWorkspaces[$task.id] = $workspaces[$task.id]
                }
            }

            # Dispatch tasks
            $tierResults = @{}
            Reset-MergeQueue

            foreach ($task in $pendingTasks) {
                $taskStatuses[$task.id] = 'running'
                $wsPath = if ($taskWorkspaces.ContainsKey($task.id)) { $taskWorkspaces[$task.id] } else { $null }

                $taskBlock = if ($task.testWriter) {
                    # TDD task: RED -> GREEN -> Cleanup
                    {
                        param($t, $r, $c, $wp, $fd, $rid, $pjp)
                        $redResult = Invoke-RedPhase -Task $t -Root $r -Counters $c -WorkspacePath $wp -FeatureDir $fd -RunId $rid -PlanJsonPath $pjp
                        if ($redResult.Status -eq 'escalated') { return $redResult }

                        $testFiles = if ($redResult.TestFiles) { $redResult.TestFiles } else { @() }

                        if ($redResult.Phase -eq 'green') {
                            $greenResult = Invoke-GreenPhase -Task $t -Root $r -Counters $c -WorkspacePath $wp -FeatureDir $fd -RunId $rid -TestFiles $testFiles -PlanJsonPath $pjp
                            if ($greenResult.Status -eq 'escalated') { return $greenResult }
                        }

                        $cleanupResult = Invoke-CleanupPhase -Task $t -Root $r -Counters $c -WorkspacePath $wp -FeatureDir $fd -RunId $rid -TestFiles $testFiles -PlanJsonPath $pjp
                        return $cleanupResult
                    }
                }
                else {
                    # Agent-writer task
                    {
                        param($t, $r, $c, $wp, $fd, $rid, $pjp)
                        return Invoke-AgentWriter -Task $t -Root $r -FeatureDir $fd -RunId $rid -PlanJsonPath $pjp
                    }
                }

                $jobResult = Invoke-WithTimeout -TaskId $task.id -WriterType ($task.codeWriter) -ScriptBlock $taskBlock `
                    -ArgumentList @{
                        t = $task; r = $Root; c = $taskCounters[$task.id]
                        wp = $wsPath; fd = $FeatureDir; rid = $PipelineRunId
                        pjp = $PlanJsonPath
                    }

                if ($jobResult.TimedOut) {
                    $taskStatuses[$task.id] = 'escalated'
                    $tierResults[$task.id] = @{ Escalated = $true; TimedOut = $true; Error = $jobResult.Error }
                }
                elseif ($jobResult.Error) {
                    $taskStatuses[$task.id] = 'escalated'
                    $tierResults[$task.id] = @{ Escalated = $true; Error = $jobResult.Error }
                }
                elseif ($jobResult.Result) {
                    $result = $jobResult.Result
                    $taskStatuses[$task.id] = $result.Status
                    $tierResults[$task.id] = $result

                    if ($result.Status -eq 'completed' -and $wsPath) {
                        Add-MergeQueue -TaskId $task.id -EscalationActive $escalationActive
                    }
                }
            }

            # Handle escalations
            $pendingEscalations = [System.Collections.ArrayList]::new()
            foreach ($tid in $tierResults.Keys) {
                if ($tierResults[$tid].Escalated) {
                    $null = $pendingEscalations.Add($tid)
                }
            }

            while ($pendingEscalations.Count -gt 0) {
                $escalationActive = $true
                $escTaskId = $pendingEscalations[0]
                $pendingEscalations.RemoveAt(0)

                $escPhase = if ($tierResults[$escTaskId].Phase) { $tierResults[$escTaskId].Phase } else { '' }
                $escSource = 'task'
                if ($escPhase -eq 'done') { $escSource = 'merge' }

                $escResult = Read-Escalation -Source $escSource -TaskId $escTaskId -Phase $escPhase `
                    -Error_ $tierResults[$escTaskId].Error -TaskStatuses $taskStatuses `
                    -FeatureDir $FeatureDir -RunId $PipelineRunId

                if ($escResult.Decision -eq 'Stop') {
                    $escalationActive = $false
                    return @{ PipelineStatus = 'halted'; Reason = 'user_stop'; PreStopSnapshot = $escResult.PreStopSnapshot; RunId = $PipelineRunId }
                }

                if ($escResult.Decision -eq 'KeepGoing') {
                    $taskStatuses[$escTaskId] = 'running'

                    # Dispatch to reset function if applicable
                    $dispatchKey = Get-ResetDispatchKey -Source $escResult.Source -Phase $escPhase
                    if ($ResetDispatch.ContainsKey($dispatchKey)) {
                        $resetFn = $ResetDispatch[$dispatchKey]
                        & $resetFn $taskCounters[$escTaskId]
                    }

                    # Reset worktree state before re-dispatch
                    if ($taskWorkspaces.ContainsKey($escTaskId)) {
                        try { Reset-WorktreeState -WorktreePath $taskWorkspaces[$escTaskId] -TaskId $escTaskId -FeatureDir $FeatureDir -RunId $PipelineRunId } catch { }
                    }
                }

                $escalationActive = $false
            }

            # Merge drain-loop
            while (-not (Test-MergeQueueEmpty)) {
                if ($pipelineStopwatch.Elapsed.TotalSeconds -gt $Config.PipelineTimeoutSeconds) {
                    return @{ PipelineStatus = 'halted'; Reason = 'timeout'; RunId = $PipelineRunId }
                }

                $mergeTaskId = Start-NextMerge
                if (-not $mergeTaskId) { break }

                $wsPath = $taskWorkspaces[$mergeTaskId]
                $branchName = "feature/$FeatureName-$mergeTaskId-$($PipelineRunId.Substring(0, 8))"
                $mergeCounters = @{ mergeRetries = 0 }

                $mergeResult = Invoke-Merge -TaskId $mergeTaskId -WorktreePath $wsPath -BranchName $branchName `
                    -Root $Root -Counters $mergeCounters -FeatureDir $FeatureDir -RunId $PipelineRunId

                if ($mergeResult.Success) {
                    $null = $mergedTasks.Add($mergeTaskId)
                    Write-TaskLog -TaskId $mergeTaskId -Phase 'done' -Message 'Merge complete' -FeatureDir $FeatureDir -RunId $PipelineRunId
                }
                else {
                    $taskStatuses[$mergeTaskId] = 'escalated'
                    $escalationActive = $true

                    $escResult = Read-Escalation -Source 'merge' -TaskId $mergeTaskId -Phase 'done' `
                        -Error_ "Merge failed after $($mergeCounters.mergeRetries) retries" `
                        -TaskStatuses $taskStatuses -FeatureDir $FeatureDir -RunId $PipelineRunId

                    $escalationActive = $false

                    if ($escResult.Decision -eq 'Stop') {
                        return @{ PipelineStatus = 'halted'; Reason = 'merge_exhausted'; RunId = $PipelineRunId }
                    }

                    if ($escResult.Decision -eq 'KeepGoing') {
                        $taskStatuses[$mergeTaskId] = 'completed'
                        Reset-MergeCounters @{ mergeRetries = 0; taskStatus = 'completed'; taskId = $mergeTaskId }
                    }
                }
            }

            # Flush fallback log after tier
            Sync-FallbackLog

            $currentTier++
        }

        # ── Step 4: Final verification ──
        Write-TaskLog -TaskId 'PIPELINE' -Phase 'final' -Message 'Starting final verification' -FeatureDir $FeatureDir -RunId $PipelineRunId

        $allWriters = @($plan.tiers.tasks | Where-Object { $_.codeWriter } | ForEach-Object { $_.codeWriter } | Select-Object -Unique)
        $finalCounters = @{ finalCleanPasses = 0; finalRemediations = 0; finalVerifPhase = 'idle' }

        $finalResult = Invoke-FinalVerification -Root $Root -Counters $finalCounters -TaskWriters $allWriters -FeatureDir $FeatureDir -RunId $PipelineRunId

        if ($finalResult.finalVerifPhase -eq 'escalated') {
            $escalationActive = $true
            $escResult = Read-Escalation -Source 'final' -Error_ 'Final verification exhausted' -TaskStatuses $taskStatuses -FeatureDir $FeatureDir -RunId $PipelineRunId
            $escalationActive = $false

            if ($escResult.Decision -eq 'Stop') {
                return @{ PipelineStatus = 'halted'; Reason = 'final_verification_exhausted'; RunId = $PipelineRunId }
            }

            if ($escResult.Decision -eq 'KeepGoing') {
                Reset-FinalCounters $finalCounters
                $finalResult = Invoke-FinalVerification -Root $Root -Counters $finalCounters -TaskWriters $allWriters -FeatureDir $FeatureDir -RunId $PipelineRunId
            }
        }

        if ($finalResult.finalVerifPhase -eq 'completed') {
            $pipelineStatus = 'completed'
            Write-TaskLog -TaskId 'PIPELINE' -Phase 'complete' -Message "Pipeline COMPLETED (RunId: $PipelineRunId)" -FeatureDir $FeatureDir -RunId $PipelineRunId
        }
        else {
            $pipelineStatus = 'halted'
            Write-TaskLog -TaskId 'PIPELINE' -Phase 'halted' -Message "Pipeline HALTED — final verification did not complete" -FeatureDir $FeatureDir -RunId $PipelineRunId
        }

        return @{ PipelineStatus = $pipelineStatus; RunId = $PipelineRunId }
    }
    finally {
        Remove-PipelineLock -LockPath $lockPath
    }
}
