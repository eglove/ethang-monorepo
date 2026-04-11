# =============================================================================
# coding-stage-model.ps1 — Pure CodingStage state machine model
# Mirrors CodingStage.tla faithfully. No I/O, no side effects.
# Each action has a guard function + mutation function.
# =============================================================================

$ErrorActionPreference = 'Stop'

# ── Constant sets ──
$script:PhaseSet = @('idle', 'red', 'red_retry', 'green', 'green_retry',
                     'cleanup', 'cleanup_remed', 'agent_call', 'done')
$script:StatusSet = @('pending', 'running', 'completed', 'escalated', 'skipped')
$script:FinalVerifPhaseSet = @('idle', 'running', 'remediating', 'completed', 'escalated')

function New-CodingStageState {
    <#
    .SYNOPSIS
        TLA+ Init — creates mutable state for the CodingStage model.
    .PARAMETER Tasks
        Array of task ID strings (e.g., @('T1','T2','T3')).
    .PARAMETER Tiers
        Hashtable mapping task ID -> tier number (e.g., @{T1=1; T2=1; T3=2}).
    .PARAMETER WriterTypes
        Hashtable mapping task ID -> 'tdd' or 'agent'.
    .PARAMETER Constants
        Hashtable with MaxRedRetries, MaxTddCycles, MaxFixRounds, MaxMergeRetries, CleanupPasses.
    #>
    param(
        [Parameter(Mandatory)][string[]]$Tasks,
        [Parameter(Mandatory)][hashtable]$Tiers,
        [Parameter(Mandatory)][hashtable]$WriterTypes,
        [Parameter(Mandatory)][hashtable]$Constants
    )

    $numTiers = ($Tiers.Values | Sort-Object -Unique | Measure-Object -Maximum).Maximum
    if ($null -eq $numTiers) { $numTiers = 0 }

    $taskPhase = @{}; $taskStatus = @{}
    $workspaceExists = @{}; $workspaceMerged = @{}
    $redRetries = @{}; $greenAttempts = @{}
    $cleanupRemediations = @{}; $cleanupCleanPasses = @{}
    $mergeRetries = @{}

    foreach ($t in $Tasks) {
        $taskPhase[$t] = 'idle'
        $taskStatus[$t] = 'pending'
        $workspaceExists[$t] = $false
        $workspaceMerged[$t] = $false
        $redRetries[$t] = 0
        $greenAttempts[$t] = 0
        $cleanupRemediations[$t] = 0
        $cleanupCleanPasses[$t] = 0
        $mergeRetries[$t] = 0
    }

    return @{
        # Pipeline-level
        currentTier       = 0
        pipelineStatus    = 'running'
        escalationActive  = $false
        validationStatus  = 'pending'
        wsCreationFailed  = $false
        # Per-task
        taskPhase         = $taskPhase
        taskStatus        = $taskStatus
        # Workspace
        workspaceExists   = $workspaceExists
        workspaceMerged   = $workspaceMerged
        # TDD counters
        redRetries        = $redRetries
        greenAttempts     = $greenAttempts
        cleanupRemediations = $cleanupRemediations
        cleanupCleanPasses = $cleanupCleanPasses
        # Merge
        mergeQueue        = [System.Collections.ArrayList]::new()
        mergeRetries      = $mergeRetries
        mergeInProgress   = $null
        # Final verification
        finalVerifPhase   = 'idle'
        finalCleanPasses  = 0
        finalRemediations = 0
        # Constants (immutable reference)
        _Tasks            = $Tasks
        _Tiers            = $Tiers
        _WriterTypes      = $WriterTypes
        _NumTiers         = $numTiers
        _MaxRedRetries    = $Constants.MaxRedRetries
        _MaxTddCycles     = $Constants.MaxTddCycles
        _MaxFixRounds     = $Constants.MaxFixRounds
        _MaxMergeRetries  = $Constants.MaxMergeRetries
        _CleanupPasses    = $Constants.CleanupPasses
    }
}

# ── Helpers ──

function _TasksInTier([hashtable]$S, [int]$tier) {
    $S._Tasks | Where-Object { $S._Tiers[$_] -eq $tier }
}

function _TierSize([hashtable]$S, [int]$tier) {
    @(_TasksInTier $S $tier).Count
}

function _IsTdd([hashtable]$S, [string]$t) { $S._WriterTypes[$t] -eq 'tdd' }
function _IsAgent([hashtable]$S, [string]$t) { $S._WriterTypes[$t] -eq 'agent' }

function _AllTasksInTierDone([hashtable]$S, [int]$tier) {
    $tasks = @(_TasksInTier $S $tier)
    if ($tasks.Count -eq 0) { return $true }
    foreach ($t in $tasks) {
        if ($S.taskStatus[$t] -notin @('completed', 'skipped')) { return $false }
    }
    return $true
}

function _AllTasksInTierMerged([hashtable]$S, [int]$tier) {
    $tasks = @(_TasksInTier $S $tier)
    if ($tasks.Count -eq 0) { return $true }
    foreach ($t in $tasks) {
        if ($S.workspaceMerged[$t] -ne $true -and $S.workspaceExists[$t] -ne $false) { return $false }
    }
    return $true
}

function _MergeQueueEmpty([hashtable]$S) {
    $S.mergeQueue.Count -eq 0 -and $null -eq $S.mergeInProgress
}

function _TierFullyDone([hashtable]$S, [int]$tier) {
    (_AllTasksInTierDone $S $tier) -and (_AllTasksInTierMerged $S $tier) -and (_MergeQueueEmpty $S)
}

function _HasOtherEscalated([hashtable]$S, [string]$excludeTask) {
    foreach ($t in $S._Tasks) {
        if ($t -ne $excludeTask -and $S.taskStatus[$t] -eq 'escalated') { return $true }
    }
    if ($null -ne $S.mergeInProgress -and $S.mergeRetries[$S.mergeInProgress] -ge $S._MaxMergeRetries) { return $true }
    if ($S.finalVerifPhase -eq 'escalated') { return $true }
    if ($S.wsCreationFailed) { return $true }
    return $false
}

# =============================================================================
# Action guard + execute functions
# Each returns $true if guard passes and action executed, $false otherwise.
# =============================================================================

function Invoke-ModelAction {
    param(
        [Parameter(Mandatory)][hashtable]$S,
        [Parameter(Mandatory)][string]$Action,
        [string]$Task = $null
    )

    switch ($Action) {
        'ValidationPasses' {
            if ($S.validationStatus -ne 'pending' -or $S.pipelineStatus -ne 'running') { return $false }
            $S.validationStatus = 'valid'
            return $true
        }
        'ValidationFails' {
            if ($S.validationStatus -ne 'pending' -or $S.pipelineStatus -ne 'running') { return $false }
            $S.validationStatus = 'failed'
            $S.pipelineStatus = 'halted'
            return $true
        }
        'ZeroTierComplete' {
            if ($S.currentTier -ne 0 -or $S._NumTiers -ne 0 -or $S.pipelineStatus -ne 'running' -or $S.validationStatus -ne 'valid') { return $false }
            $S.pipelineStatus = 'completed'
            $S.currentTier = 1
            return $true
        }
        'StartNextTier' {
            if ($S.pipelineStatus -ne 'running' -or $S.escalationActive -or $S.validationStatus -ne 'valid') { return $false }
            $canAdvance = ($S.currentTier -eq 0 -and $S._NumTiers -gt 0) -or
                          ($S.currentTier -gt 0 -and $S.currentTier -le $S._NumTiers -and (_TierFullyDone $S $S.currentTier))
            if (-not $canAdvance) { return $false }
            $nextTier = $S.currentTier + 1
            if ($nextTier -gt $S._NumTiers) { return $false }
            $S.currentTier = $nextTier
            $tierTasks = @(_TasksInTier $S $nextTier)
            $multi = $tierTasks.Count -gt 1
            foreach ($t in $tierTasks) {
                $S.taskStatus[$t] = 'running'
                $S.taskPhase[$t] = if (_IsTdd $S $t) { 'red' } else { 'agent_call' }
                if ($multi) { $S.workspaceExists[$t] = $true }
            }
            return $true
        }
        'WorkspaceCreationFailure' {
            if ($S.pipelineStatus -ne 'running' -or $S.escalationActive -or $S.validationStatus -ne 'valid') { return $false }
            $canAdvance = ($S.currentTier -eq 0 -and $S._NumTiers -gt 0) -or
                          ($S.currentTier -gt 0 -and $S.currentTier -le $S._NumTiers -and (_TierFullyDone $S $S.currentTier))
            if (-not $canAdvance) { return $false }
            $nextTier = $S.currentTier + 1
            if ($nextTier -gt $S._NumTiers) { return $false }
            if ((_TierSize $S $nextTier) -le 1) { return $false }
            $S.wsCreationFailed = $true
            $S.escalationActive = $true
            return $true
        }
        'SkipEmptyTier' {
            if ($S.pipelineStatus -ne 'running' -or $S.escalationActive -or $S.validationStatus -ne 'valid') { return $false }
            if ($S.currentTier -le 0 -or $S.currentTier -gt $S._NumTiers) { return $false }
            if (@(_TasksInTier $S $S.currentTier).Count -ne 0) { return $false }
            $S.currentTier++
            return $true
        }

        # ── TDD RED ──
        'RedTestsFail' {
            if ($S.taskPhase[$Task] -ne 'red' -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            $S.taskPhase[$Task] = 'green'
            return $true
        }
        'RedTestsPassUnexpectedly' {
            if ($S.taskPhase[$Task] -ne 'red' -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            $S.taskPhase[$Task] = 'red_retry'
            return $true
        }
        'RedRetryRevised' {
            if ($S.taskPhase[$Task] -ne 'red_retry' -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.redRetries[$Task] -ge $S._MaxRedRetries) { return $false }
            $S.redRetries[$Task]++
            $S.taskPhase[$Task] = 'red'
            return $true
        }
        'RedRetryAlreadyImplemented' {
            if ($S.taskPhase[$Task] -ne 'red_retry' -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            $S.taskPhase[$Task] = 'cleanup'
            return $true
        }
        'RedRetryExhausted' {
            if ($S.taskPhase[$Task] -ne 'red_retry' -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.redRetries[$Task] -lt $S._MaxRedRetries) { return $false }
            $S.taskStatus[$Task] = 'escalated'
            $S.escalationActive = $true
            return $true
        }

        # ── TDD GREEN ──
        'GreenTestsPass' {
            if ($S.taskPhase[$Task] -ne 'green' -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            $S.taskPhase[$Task] = 'cleanup'
            return $true
        }
        'GreenTestsFail' {
            if ($S.taskPhase[$Task] -ne 'green' -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            $S.greenAttempts[$Task]++
            $S.taskPhase[$Task] = 'green_retry'
            return $true
        }
        'GreenRetry' {
            if ($S.taskPhase[$Task] -ne 'green_retry' -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.greenAttempts[$Task] -ge $S._MaxTddCycles) { return $false }
            $S.taskPhase[$Task] = 'green'
            return $true
        }
        'GreenRetryExhausted' {
            if ($S.taskPhase[$Task] -ne 'green_retry' -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.greenAttempts[$Task] -lt $S._MaxTddCycles) { return $false }
            $S.taskStatus[$Task] = 'escalated'
            $S.escalationActive = $true
            return $true
        }

        # ── Cleanup ──
        'CleanupPass' {
            if ($S.taskPhase[$Task] -ne 'cleanup' -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.cleanupCleanPasses[$Task] -ge $S._CleanupPasses) { return $false }
            $S.cleanupCleanPasses[$Task]++
            return $true
        }
        'CleanupComplete' {
            if ($S.taskPhase[$Task] -ne 'cleanup' -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.cleanupCleanPasses[$Task] -lt $S._CleanupPasses) { return $false }
            $S.taskPhase[$Task] = 'done'
            $S.taskStatus[$Task] = 'completed'
            return $true
        }
        'CleanupFail' {
            if ($S.taskPhase[$Task] -ne 'cleanup' -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.cleanupRemediations[$Task] -ge $S._MaxFixRounds) { return $false }
            $S.cleanupCleanPasses[$Task] = 0
            $S.taskPhase[$Task] = 'cleanup_remed'
            return $true
        }
        'CleanupRemediate' {
            if ($S.taskPhase[$Task] -ne 'cleanup_remed' -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.cleanupRemediations[$Task] -ge $S._MaxFixRounds) { return $false }
            $S.cleanupRemediations[$Task]++
            $S.taskPhase[$Task] = 'cleanup'
            return $true
        }
        'CleanupExhausted' {
            if ($S.taskPhase[$Task] -notin @('cleanup', 'cleanup_remed') -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.cleanupRemediations[$Task] -lt $S._MaxFixRounds) { return $false }
            $S.taskStatus[$Task] = 'escalated'
            $S.escalationActive = $true
            return $true
        }

        # ── Agent Writer ──
        'AgentWriterComplete' {
            if ($S.taskPhase[$Task] -ne 'agent_call' -or $S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            if (-not (_IsAgent $S $Task)) { return $false }
            $S.taskPhase[$Task] = 'done'
            $S.taskStatus[$Task] = 'completed'
            return $true
        }

        # ── Merge Queue ──
        'EnqueueForMerge' {
            if ($S.taskStatus[$Task] -ne 'completed' -or $S.workspaceExists[$Task] -ne $true -or $S.workspaceMerged[$Task] -ne $false) { return $false }
            if ($S.pipelineStatus -ne 'running' -or $S.escalationActive) { return $false }
            if ($S.mergeQueue -contains $Task -or $S.mergeInProgress -eq $Task) { return $false }
            $null = $S.mergeQueue.Add($Task)
            return $true
        }
        'StartMerge' {
            if ($S.mergeQueue.Count -eq 0 -or $null -ne $S.mergeInProgress) { return $false }
            if ($S.pipelineStatus -ne 'running' -or $S.escalationActive) { return $false }
            $S.mergeInProgress = $S.mergeQueue[0]
            $S.mergeQueue.RemoveAt(0)
            return $true
        }
        'MergeSuccess' {
            if ($null -eq $S.mergeInProgress -or $S.pipelineStatus -ne 'running') { return $false }
            $t = $S.mergeInProgress
            $S.workspaceMerged[$t] = $true
            $S.workspaceExists[$t] = $false
            $S.mergeInProgress = $null
            return $true
        }
        'MergeConflictResolve' {
            if ($null -eq $S.mergeInProgress -or $S.pipelineStatus -ne 'running') { return $false }
            $t = $S.mergeInProgress
            if ($S.mergeRetries[$t] -ge $S._MaxMergeRetries) { return $false }
            $S.mergeRetries[$t]++
            return $true
        }
        'MergeExhausted' {
            if ($null -eq $S.mergeInProgress -or $S.pipelineStatus -ne 'running') { return $false }
            $t = $S.mergeInProgress
            if ($S.mergeRetries[$t] -lt $S._MaxMergeRetries) { return $false }
            $S.taskStatus[$t] = 'escalated'
            $S.escalationActive = $true
            return $true
        }
        'SingleTaskTierComplete' {
            if ($S.taskStatus[$Task] -ne 'completed' -or $S.workspaceExists[$Task] -ne $false -or $S.workspaceMerged[$Task] -ne $false) { return $false }
            if ($S.pipelineStatus -ne 'running') { return $false }
            $S.workspaceMerged[$Task] = $true
            return $true
        }

        # ── Final Verification ──
        'StartFinalVerification' {
            if ($S.pipelineStatus -ne 'running' -or $S.escalationActive -or $S._NumTiers -eq 0 -or $S.finalVerifPhase -ne 'idle') { return $false }
            $canStart = ($S.currentTier -eq $S._NumTiers -and (_TierFullyDone $S $S.currentTier)) -or $S.currentTier -gt $S._NumTiers
            if (-not $canStart) { return $false }
            $S.currentTier = $S._NumTiers + 1
            $S.finalVerifPhase = 'running'
            return $true
        }
        'FinalVerifPass' {
            if ($S.finalVerifPhase -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.finalCleanPasses -ge $S._CleanupPasses) { return $false }
            $S.finalCleanPasses++
            return $true
        }
        'FinalVerifComplete' {
            if ($S.finalVerifPhase -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.finalCleanPasses -lt $S._CleanupPasses) { return $false }
            $S.finalVerifPhase = 'completed'
            $S.pipelineStatus = 'completed'
            return $true
        }
        'FinalVerifFail' {
            if ($S.finalVerifPhase -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.finalRemediations -ge $S._MaxFixRounds) { return $false }
            $S.finalCleanPasses = 0
            $S.finalVerifPhase = 'remediating'
            return $true
        }
        'FinalVerifRemediate' {
            if ($S.finalVerifPhase -ne 'remediating' -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.finalRemediations -ge $S._MaxFixRounds) { return $false }
            $S.finalRemediations++
            $S.finalVerifPhase = 'running'
            return $true
        }
        'FinalVerifExhausted' {
            if ($S.finalVerifPhase -notin @('running', 'remediating') -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.finalRemediations -lt $S._MaxFixRounds) { return $false }
            $S.finalVerifPhase = 'escalated'
            $S.escalationActive = $true
            return $true
        }

        # ── Escalation ──
        'EscalationKeepGoing' {
            if (-not $S.escalationActive -or $S.pipelineStatus -ne 'running') { return $false }
            if ($S.taskStatus[$Task] -ne 'escalated' -or $S.taskPhase[$Task] -eq 'done') { return $false }
            $S.taskStatus[$Task] = 'running'
            $S.escalationActive = _HasOtherEscalated $S $Task
            # Reset relevant counter based on phase
            switch ($S.taskPhase[$Task]) {
                'red_retry'     { $S.redRetries[$Task] = 0 }
                'green_retry'   { $S.greenAttempts[$Task] = 0 }
                { $_ -in @('cleanup', 'cleanup_remed') } {
                    $S.cleanupRemediations[$Task] = 0
                    $S.cleanupCleanPasses[$Task] = 0
                }
            }
            return $true
        }
        'EscalationKeepGoingMerge' {
            if (-not $S.escalationActive -or $S.pipelineStatus -ne 'running') { return $false }
            if ($null -eq $S.mergeInProgress) { return $false }
            $t = $S.mergeInProgress
            if ($S.mergeRetries[$t] -lt $S._MaxMergeRetries) { return $false }
            $S.taskStatus[$t] = 'completed'
            $S.mergeRetries[$t] = 0
            $S.escalationActive = _HasOtherEscalated $S $t
            return $true
        }
        'EscalationKeepGoingFinal' {
            if (-not $S.escalationActive -or $S.pipelineStatus -ne 'running' -or $S.finalVerifPhase -ne 'escalated') { return $false }
            $S.finalVerifPhase = 'running'
            $S.finalRemediations = 0
            $S.finalCleanPasses = 0
            # Check other escalations (no specific task to exclude)
            $hasOther = $false
            foreach ($t in $S._Tasks) { if ($S.taskStatus[$t] -eq 'escalated') { $hasOther = $true; break } }
            if ($null -ne $S.mergeInProgress -and $S.mergeRetries[$S.mergeInProgress] -ge $S._MaxMergeRetries) { $hasOther = $true }
            if ($S.wsCreationFailed) { $hasOther = $true }
            $S.escalationActive = $hasOther
            return $true
        }
        'EscalationKeepGoingWorkspace' {
            if (-not $S.escalationActive -or $S.pipelineStatus -ne 'running' -or -not $S.wsCreationFailed) { return $false }
            $S.wsCreationFailed = $false
            $hasOther = $false
            foreach ($t in $S._Tasks) { if ($S.taskStatus[$t] -eq 'escalated') { $hasOther = $true; break } }
            if ($null -ne $S.mergeInProgress -and $S.mergeRetries[$S.mergeInProgress] -ge $S._MaxMergeRetries) { $hasOther = $true }
            if ($S.finalVerifPhase -eq 'escalated') { $hasOther = $true }
            $S.escalationActive = $hasOther
            return $true
        }
        'EscalationStop' {
            if (-not $S.escalationActive -or $S.pipelineStatus -ne 'running') { return $false }
            $S.pipelineStatus = 'halted'
            $S.escalationActive = $false
            $S.wsCreationFailed = $false
            foreach ($t in $S._Tasks) {
                $preStatus = $S.taskStatus[$t]
                if ($preStatus -in @('running', 'pending')) { $S.taskStatus[$t] = 'skipped' }
                if ($preStatus -in @('escalated', 'running')) {
                    # Preserve workspace
                } else {
                    $S.workspaceExists[$t] = $false
                }
            }
            return $true
        }
        'InfrastructureFailure' {
            if ($S.taskStatus[$Task] -ne 'running' -or $S.pipelineStatus -ne 'running') { return $false }
            $S.taskStatus[$Task] = 'escalated'
            $S.escalationActive = $true
            return $true
        }

        default { return $false }
    }
}

# =============================================================================
# Invariant functions — mirror CodingStage.tla S1-S12
# =============================================================================

function Test-CodingStageTypeOK {
    param([Parameter(Mandatory)][hashtable]$S)
    if ($S.currentTier -lt 0 -or $S.currentTier -gt $S._NumTiers + 1) { return $false }
    if ($S.pipelineStatus -notin @('running', 'halted', 'completed')) { return $false }
    if ($S.escalationActive -isnot [bool]) { return $false }
    if ($S.validationStatus -notin @('pending', 'valid', 'failed')) { return $false }
    if ($S.wsCreationFailed -isnot [bool]) { return $false }
    foreach ($t in $S._Tasks) {
        if ($S.taskPhase[$t] -notin $script:PhaseSet) { return $false }
        if ($S.taskStatus[$t] -notin $script:StatusSet) { return $false }
        if ($S.workspaceExists[$t] -isnot [bool]) { return $false }
        if ($S.workspaceMerged[$t] -isnot [bool]) { return $false }
        if ($S.redRetries[$t] -lt 0 -or $S.redRetries[$t] -gt $S._MaxRedRetries) { return $false }
        if ($S.greenAttempts[$t] -lt 0 -or $S.greenAttempts[$t] -gt $S._MaxTddCycles) { return $false }
        if ($S.cleanupRemediations[$t] -lt 0 -or $S.cleanupRemediations[$t] -gt $S._MaxFixRounds) { return $false }
        if ($S.cleanupCleanPasses[$t] -lt 0 -or $S.cleanupCleanPasses[$t] -gt $S._CleanupPasses) { return $false }
        if ($S.mergeRetries[$t] -lt 0 -or $S.mergeRetries[$t] -gt $S._MaxMergeRetries) { return $false }
    }
    if ($null -ne $S.mergeInProgress -and $S.mergeInProgress -notin $S._Tasks) { return $false }
    if ($S.finalVerifPhase -notin $script:FinalVerifPhaseSet) { return $false }
    if ($S.finalCleanPasses -lt 0 -or $S.finalCleanPasses -gt $S._CleanupPasses) { return $false }
    if ($S.finalRemediations -lt 0 -or $S.finalRemediations -gt $S._MaxFixRounds) { return $false }
    return $true
}

function Test-TiersSequential {
    param([Parameter(Mandatory)][hashtable]$S)
    foreach ($t in $S._Tasks) {
        if ($S.taskStatus[$t] -eq 'running') {
            foreach ($earlier in $S._Tasks) {
                if ($S._Tiers[$earlier] -lt $S._Tiers[$t]) {
                    if ($S.taskStatus[$earlier] -notin @('completed', 'skipped')) { return $false }
                }
            }
        }
    }
    return $true
}

function Test-RetryBounds {
    param([Parameter(Mandatory)][hashtable]$S)
    foreach ($t in $S._Tasks) {
        if ($S.redRetries[$t] -gt $S._MaxRedRetries) { return $false }
        if ($S.greenAttempts[$t] -gt $S._MaxTddCycles) { return $false }
        if ($S.cleanupRemediations[$t] -gt $S._MaxFixRounds) { return $false }
        if ($S.mergeRetries[$t] -gt $S._MaxMergeRetries) { return $false }
    }
    if ($S.finalRemediations -gt $S._MaxFixRounds) { return $false }
    return $true
}

function Test-AgentWriterNoTdd {
    param([Parameter(Mandatory)][hashtable]$S)
    foreach ($t in $S._Tasks) {
        if (_IsAgent $S $t) {
            if ($S.taskPhase[$t] -notin @('idle', 'agent_call', 'done')) { return $false }
        }
    }
    return $true
}

function Test-MergeSerial {
    param([Parameter(Mandatory)][hashtable]$S)
    # No duplicates in queue
    $seen = @{}
    foreach ($item in $S.mergeQueue) {
        if ($seen.ContainsKey($item)) { return $false }
        $seen[$item] = $true
    }
    # In-progress not also queued
    if ($null -ne $S.mergeInProgress) {
        if ($S.mergeQueue -contains $S.mergeInProgress) { return $false }
    }
    return $true
}

function Test-NoOrphanedWorkspaces {
    param([Parameter(Mandatory)][hashtable]$S)
    if ($S.pipelineStatus -eq 'completed') {
        foreach ($t in $S._Tasks) {
            if ($S.workspaceExists[$t]) { return $false }
        }
    }
    return $true
}

function Test-SingleTaskNoWorkspace {
    param([Parameter(Mandatory)][hashtable]$S)
    foreach ($t in $S._Tasks) {
        if ($S._Tiers[$t] -le $S._NumTiers -and (_TierSize $S $S._Tiers[$t]) -eq 1) {
            if ($S.workspaceExists[$t]) { return $false }
        }
    }
    return $true
}

function Test-CompletionRequiresFinalVerif {
    param([Parameter(Mandatory)][hashtable]$S)
    if ($S.pipelineStatus -eq 'completed') {
        if ($S.finalVerifPhase -ne 'completed' -and $S._NumTiers -ne 0) { return $false }
    }
    return $true
}

function Test-EscalationBlocksProgress {
    param([Parameter(Mandatory)][hashtable]$S)
    if ($S.escalationActive) {
        if ($S.pipelineStatus -eq 'completed') { return $false }
    }
    return $true
}

function Test-GreenAfterRed {
    param([Parameter(Mandatory)][hashtable]$S)
    foreach ($t in $S._Tasks) {
        if ($S.taskPhase[$t] -in @('green', 'green_retry')) {
            if (-not (_IsTdd $S $t)) { return $false }
        }
    }
    return $true
}

function Test-CleanupOnlyForTdd {
    param([Parameter(Mandatory)][hashtable]$S)
    foreach ($t in $S._Tasks) {
        if ($S.taskPhase[$t] -in @('cleanup', 'cleanup_remed')) {
            if (-not (_IsTdd $S $t)) { return $false }
        }
    }
    return $true
}

function Test-ValidationGatesExecution {
    param([Parameter(Mandatory)][hashtable]$S)
    if ($S.validationStatus -ne 'valid') {
        foreach ($t in $S._Tasks) {
            if ($S.taskStatus[$t] -notin @('pending', 'skipped')) { return $false }
        }
    }
    return $true
}

function Test-WorkspaceCreationSafety {
    param([Parameter(Mandatory)][hashtable]$S)
    if ($S.wsCreationFailed) {
        if (-not $S.escalationActive) { return $false }
    }
    return $true
}

# =============================================================================
# Random walk driver for PBT
# =============================================================================

function Invoke-CodingStageRandomWalk {
    <#
    .SYNOPSIS
        Drives the CodingStage model through a random walk, checking invariants at every step.
    #>
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)][System.Random]$Rng,
        [int]$MaxSteps = 300,
        [Parameter(Mandatory)][hashtable]$Invariants
    )

    # Build action pool: non-task-specific + task-specific
    $globalActions = @(
        'ValidationPasses', 'ValidationFails', 'ZeroTierComplete',
        'StartNextTier', 'WorkspaceCreationFailure', 'SkipEmptyTier',
        'StartMerge', 'MergeSuccess', 'MergeConflictResolve', 'MergeExhausted',
        'EscalationKeepGoingMerge', 'StartFinalVerification',
        'FinalVerifPass', 'FinalVerifComplete', 'FinalVerifFail',
        'FinalVerifRemediate', 'FinalVerifExhausted',
        'EscalationKeepGoingFinal', 'EscalationKeepGoingWorkspace', 'EscalationStop'
    )
    $taskActions = @(
        'RedTestsFail', 'RedTestsPassUnexpectedly', 'RedRetryRevised',
        'RedRetryAlreadyImplemented', 'RedRetryExhausted',
        'GreenTestsPass', 'GreenTestsFail', 'GreenRetry', 'GreenRetryExhausted',
        'CleanupPass', 'CleanupComplete', 'CleanupFail', 'CleanupRemediate', 'CleanupExhausted',
        'AgentWriterComplete', 'EnqueueForMerge', 'SingleTaskTierComplete',
        'InfrastructureFailure', 'EscalationKeepGoing'
    )

    $trace = [System.Collections.ArrayList]::new()
    $idleSteps = 0

    for ($step = 0; $step -lt $MaxSteps; $step++) {
        # Terminal check
        if ($State.pipelineStatus -in @('completed', 'halted')) {
            return @{
                InvariantViolation = $null
                FailingStep = $null
                FailingState = $null
                Trace = $trace.ToArray()
                FinalStatus = $State.pipelineStatus
                Steps = $step
            }
        }

        # Try a random action
        $fired = $false
        # Pick from global or task-specific with equal probability
        if ($Rng.NextDouble() -lt 0.4 -or $State._Tasks.Count -eq 0) {
            $action = $globalActions[$Rng.Next(0, $globalActions.Count)]
            $fired = Invoke-ModelAction -S $State -Action $action
            if ($fired) { $null = $trace.Add($action); $idleSteps = 0 }
        } else {
            $task = $State._Tasks[$Rng.Next(0, $State._Tasks.Count)]
            $action = $taskActions[$Rng.Next(0, $taskActions.Count)]
            $fired = Invoke-ModelAction -S $State -Action $action -Task $task
            if ($fired) { $null = $trace.Add("$action($task)"); $idleSteps = 0 }
        }

        if (-not $fired) {
            $idleSteps++
            if ($idleSteps -gt 200) {
                # Stuck — try all enabled actions systematically
                $foundAny = $false
                foreach ($ga in $globalActions) {
                    if (Invoke-ModelAction -S $State -Action $ga) {
                        $null = $trace.Add($ga)
                        $foundAny = $true
                        $idleSteps = 0
                        break
                    }
                }
                if (-not $foundAny) {
                    foreach ($t in $State._Tasks) {
                        foreach ($ta in $taskActions) {
                            if (Invoke-ModelAction -S $State -Action $ta -Task $t) {
                                $null = $trace.Add("$ta($t)")
                                $foundAny = $true
                                $idleSteps = 0
                                break
                            }
                        }
                        if ($foundAny) { break }
                    }
                }
                if (-not $foundAny) {
                    # True deadlock (should not happen with terminal check above)
                    return @{
                        InvariantViolation = "Deadlock(no enabled actions)"
                        FailingStep = $step
                        FailingState = $State.Clone()
                        Trace = $trace.ToArray()
                        FinalStatus = $State.pipelineStatus
                        Steps = $step
                    }
                }
            }
            continue
        }

        # Check invariants after every fired action
        foreach ($invName in $Invariants.Keys) {
            $check = $Invariants[$invName]
            if (-not (& $check $State)) {
                return @{
                    InvariantViolation = $invName
                    FailingStep = $step
                    FailingState = $State.Clone()
                    Trace = $trace.ToArray()
                    FinalStatus = $State.pipelineStatus
                    Steps = $step
                }
            }
        }
    }

    # Did not terminate in MaxSteps (liveness concern, not safety violation)
    return @{
        InvariantViolation = $null
        FailingStep = $null
        FailingState = $null
        Trace = $trace.ToArray()
        FinalStatus = $State.pipelineStatus
        Steps = $MaxSteps
    }
}
