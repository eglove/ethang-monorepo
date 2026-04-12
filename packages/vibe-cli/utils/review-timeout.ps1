$ErrorActionPreference = 'Stop'

function Test-ReviewGateTimeout {
    <#
    .SYNOPSIS
        TLA+ ReviewGateTimeout action — detects whether the review gate has exceeded
        its wall-clock budget. Sets gateTimedOut = $true when elapsed >= threshold.
    .DESCRIPTION
        Guards:
          - pipelineState ∈ {preMergeReview, reviewFix, finalReview, finalReviewFix}
          - gateTimedOut must be $false (no double-fire)
          - globalTimedOut must be $false
          - ElapsedSeconds must be >= 0
        Effect:
          - If ElapsedSeconds >= ReviewGateTimeoutSeconds → gateTimedOut = $true, returns $true
          - Otherwise → gateTimedOut unchanged, returns $false
        UNCHANGED: pipelineState, lockHolder, reviewRound, keepGoingResets,
                   tddKeepGoingCount, verdict, tasksDone, globalTimedOut, reviewGateType
    .PARAMETER State
        The mutable pipeline state hashtable.
    .PARAMETER Config
        The read-only pipeline config from Get-PipelineConfig.
    .PARAMETER ElapsedSeconds
        Cumulative wall-clock seconds the current review gate has been running.
    .OUTPUTS
        [bool] $true if the timeout fired, $false otherwise.
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

    # ── Guard: pipelineState must be a review-related state ──
    $validReviewStates = @('preMergeReview', 'reviewFix', 'finalReview', 'finalReviewFix')
    if ($State.pipelineState -notin $validReviewStates) {
        throw [System.InvalidOperationException]::new(
            "Test-ReviewGateTimeout requires pipelineState in ($($validReviewStates -join ', ')), got '$($State.pipelineState)'."
        )
    }

    # ── Guard: gateTimedOut must be false (no double-fire) ──
    if ($State.gateTimedOut) {
        throw [System.InvalidOperationException]::new(
            "Test-ReviewGateTimeout: gateTimedOut is already true — cannot fire again."
        )
    }

    # ── Guard: globalTimedOut must be false ──
    if ($State.globalTimedOut) {
        throw [System.InvalidOperationException]::new(
            "Test-ReviewGateTimeout: globalTimedOut is already true — gate timeout cannot fire."
        )
    }

    # ── Timeout detection ──
    $threshold = $Config['ReviewGateTimeoutSeconds']

    if ($ElapsedSeconds -ge $threshold) {
        $State.gateTimedOut = $true
        Write-PipelineLog "Review gate timeout fired: ${ElapsedSeconds}s >= ${threshold}s threshold" -Color 'Yellow'
        return $true
    }

    return $false
}

function Invoke-GateTimeoutEscalation {
    <#
    .SYNOPSIS
        TLA+ GateTimeoutKeepGoing / GateTimeoutStop — escalation after a review gate
        timeout has fired. Calls Read-Escalation to decide Keep Going vs Stop.
    .DESCRIPTION
        Guards:
          - gateTimedOut must be $true
          - pipelineState ∈ {preMergeReview, reviewFix, finalReview, finalReviewFix}
          - globalTimedOut must be $false
        GateTimeoutKeepGoing (keepGoingResets < MaxKeepGoingResets):
          → gateTimedOut = $false, keepGoingResets + 1, reviewRound = 0,
            tddKeepGoingCount = 0, verdict = $null,
            pipelineState = preMergeReview | finalReview (based on reviewGateType)
          UNCHANGED: lockHolder, tasksDone, globalTimedOut, reviewGateType
        GateTimeoutStop:
          → pipelineState = HALTED, lockHolder = $null
          UNCHANGED: reviewRound, keepGoingResets, tddKeepGoingCount, verdict,
                     tasksDone, gateTimedOut, globalTimedOut, reviewGateType
    .PARAMETER State
        The mutable pipeline state hashtable.
    .PARAMETER Config
        The read-only pipeline config from Get-PipelineConfig.
    .OUTPUTS
        [hashtable] The escalation result from Read-Escalation (or a forced-stop result).
    #>
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config
    )

    # ── Guard: gateTimedOut must be true ──
    if (-not $State.gateTimedOut) {
        throw [System.InvalidOperationException]::new(
            "Invoke-GateTimeoutEscalation: gateTimedOut must be true to escalate."
        )
    }

    # ── Guard: pipelineState must be review-related ──
    $validReviewStates = @('preMergeReview', 'reviewFix', 'finalReview', 'finalReviewFix')
    if ($State.pipelineState -notin $validReviewStates) {
        throw [System.InvalidOperationException]::new(
            "Invoke-GateTimeoutEscalation requires pipelineState in ($($validReviewStates -join ', ')), got '$($State.pipelineState)'."
        )
    }

    # ── Guard: globalTimedOut must be false ──
    if ($State.globalTimedOut) {
        throw [System.InvalidOperationException]::new(
            "Invoke-GateTimeoutEscalation: globalTimedOut is already true — cannot escalate gate timeout."
        )
    }

    # ── Forced stop when Keep Going resets exhausted ──
    if ($State.keepGoingResets -ge $Config['MaxKeepGoingResets']) {
        Write-PipelineLog "Gate timeout escalation: keepGoingResets ($($State.keepGoingResets)) >= MaxKeepGoingResets ($($Config['MaxKeepGoingResets'])) — forced stop" -Color 'Red'
        $State.pipelineState = 'HALTED'
        $State.lockHolder    = $null
        return @{
            Decision        = 'Stop'
            Source           = 'forced'
            TaskId           = $null
            Phase            = $null
            Reason           = 'keepGoingResets exhausted'
            PreStopSnapshot  = $null
        }
    }

    # ── Call Read-Escalation with gate timeout context ──
    $errorContext = "Review gate timeout fired after round $($State.reviewRound). Gate timeout escalation required."
    $escalation = Read-Escalation `
        -Source 'gate-timeout' `
        -Error_ $errorContext

    # ── Apply escalation decision ──
    if ($escalation.Decision -eq 'KeepGoing') {
        # GateTimeoutKeepGoing: reset gate state for fresh review
        $State.gateTimedOut      = $false
        $State.keepGoingResets    = $State.keepGoingResets + 1
        $State.reviewRound       = 0
        $State.tddKeepGoingCount = 0
        $State.verdict           = $null

        # Route to the correct review state based on gate type
        if ($State.reviewGateType -eq 'final') {
            $State.pipelineState = 'finalReview'
        } else {
            $State.pipelineState = 'preMergeReview'
        }

        Write-PipelineLog "Gate timeout escalation: Keep Going — reset for fresh review (keepGoingResets=$($State.keepGoingResets))" -Color 'Yellow'
    } else {
        # GateTimeoutStop: halt with lock release
        $State.pipelineState = 'HALTED'
        $State.lockHolder    = $null

        Write-PipelineLog "Gate timeout escalation: Stop — pipeline HALTED" -Color 'Red'
    }

    return $escalation
}

function Get-ReviewGateElapsed {
    <#
    .SYNOPSIS
        Computes cumulative wall-clock seconds from a given start time to now.
    .PARAMETER StartTime
        The DateTime when the review gate started.
    .OUTPUTS
        [double] Elapsed seconds.
    #>
    param(
        [Parameter(Mandatory)][datetime]$StartTime
    )

    $elapsed = ((Get-Date) - $StartTime).TotalSeconds
    return [double]$elapsed
}
