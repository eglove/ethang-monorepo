function Test-GlobalPipelineTimeout {
    <#
    .SYNOPSIS
        TLA+ GlobalTimeout action — halts the pipeline when cumulative wall-clock
        exceeds PipelineTimeoutSeconds.
    .DESCRIPTION
        Guards:
          - pipelineState ∉ {idle, COMPLETE, HALTED}
          - globalTimedOut = $false (no double-fire)
        Effects (when elapsed >= threshold):
          - globalTimedOut  = $true
          - pipelineState   = 'HALTED'
          - lockHolder      = $null
        UNCHANGED: reviewRound, keepGoingResets, tddKeepGoingCount,
                   verdict, tasksDone, gateTimedOut, reviewGateType
    .PARAMETER State
        The mutable pipeline state hashtable.
    .PARAMETER Config
        The read-only pipeline config from Get-PipelineConfig.
    .PARAMETER ElapsedSeconds
        Cumulative wall-clock seconds since pipeline start. Must be >= 0.
    .OUTPUTS
        [bool] $true if timeout fired, $false if below threshold.
    #>
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config,
        [Parameter(Mandatory)][double]$ElapsedSeconds
    )

    # ── Parameter validation ──
    if ($ElapsedSeconds -lt 0) {
        throw [System.ArgumentException]::new(
            "ElapsedSeconds must be non-negative, got $ElapsedSeconds."
        )
    }

    # ── Guard: pipelineState ∉ {idle, COMPLETE, HALTED} ──
    $terminalStates = @('idle', 'COMPLETE', 'HALTED')
    if ($State.pipelineState -in $terminalStates) {
        throw [System.InvalidOperationException]::new(
            "pipelineState must not be idle or terminal, got '$($State.pipelineState)'."
        )
    }

    # ── Guard: globalTimedOut must be false (idempotency) ──
    if ($State.globalTimedOut) {
        throw [System.InvalidOperationException]::new(
            "globalTimedOut is already true — cannot fire twice."
        )
    }

    # ── Timeout check ──
    $threshold = $Config['PipelineTimeoutSeconds']

    if ($ElapsedSeconds -ge $threshold) {
        # Fire: transition to HALTED
        $State.globalTimedOut = $true
        $State.pipelineState  = 'HALTED'
        $State.lockHolder     = $null
        return $true
    }

    return $false
}

function Get-PipelineElapsed {
    <#
    .SYNOPSIS
        Computes elapsed wall-clock seconds from a given start time to now.
    .PARAMETER StartTime
        The pipeline start timestamp.
    .OUTPUTS
        [double] Elapsed seconds.
    #>
    param(
        [Parameter(Mandatory)][datetime]$StartTime
    )

    $elapsed = ((Get-Date) - $StartTime).TotalSeconds
    return [double]$elapsed
}

function Test-TaskTimeout {
    <#
    .SYNOPSIS
        Per-task watchdog — detects when a task has been stuck in an active
        state beyond the allowed timeout threshold.
    .DESCRIPTION
        Active states: executing, coverage_gate, review_gate, merge_waiting.
        Returns $true when the task has been in one of these states for
        >= TimeoutSeconds (default 1800 = 30 minutes).
        Returns $false for non-active states or missing stateStartTime.
    .PARAMETER TaskState
        A hashtable representing the task, with at minimum taskState and
        optionally stateStartTime keys.
    .PARAMETER TimeoutSeconds
        Seconds before an active task is considered timed out. Default 1800.
    .OUTPUTS
        [bool] $true if the task has timed out, $false otherwise.
    #>
    param(
        [Parameter(Mandatory)][hashtable]$TaskState,
        [int]$TimeoutSeconds = 1800  # 30 minutes
    )

    $activeStates = @('executing', 'coverage_gate', 'review_gate', 'merge_waiting')

    if ($TaskState.taskState -notin $activeStates) { return $false }

    if (-not $TaskState.stateStartTime) { return $false }

    $elapsed = ((Get-Date) - $TaskState.stateStartTime).TotalSeconds
    return $elapsed -ge $TimeoutSeconds
}
