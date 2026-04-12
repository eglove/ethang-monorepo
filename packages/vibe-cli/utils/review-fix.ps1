# =============================================================================
# review-fix.ps1 — Review-fix cycle
# TLA+ action: ReviewFixComplete
# Depends on: config.ps1, pipeline-state.ps1, review-verdict.ps1
# =============================================================================

$ErrorActionPreference = 'Stop'

# ── Phase function declarations ──────────────────────────────────────────────
# These declare parameter signatures for TDD phase functions so that callers
# (and Pester ParameterFilter) can bind named parameters. The actual
# implementations live in external files; these are overridden at load time.
# ─────────────────────────────────────────────────────────────────────────────

function Invoke-RedPhase {
    param($State, $Config, $Task, $Blockers, $Counters, $Root, $FeatureDir)
    throw "Invoke-RedPhase: no implementation loaded."
}

function Invoke-GreenPhase {
    param($State, $Config, $Task, $Blockers, $TestFiles, $Counters, $Root, $FeatureDir)
    throw "Invoke-GreenPhase: no implementation loaded."
}

function Invoke-CleanupPhase {
    param($State, $Config, $Task, $Counters, $Root, $FeatureDir)
    throw "Invoke-CleanupPhase: no implementation loaded."
}

function Invoke-TddKeepGoing {
    <#
    .SYNOPSIS
        TLA+ TddKeepGoingInFix — increments tddKeepGoingCount within a review-fix cycle.
    .DESCRIPTION
        When TDD exhausts its cycles within a fix, the user can choose "Keep Going"
        to retry. This increments tddKeepGoingCount up to MaxTddKeepGoingPerGate.
        The counter is sticky within a gate — only reset by gate-level events.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config
    )

    $validFixStates = @('reviewFix', 'finalReviewFix')
    if ($State.pipelineState -notin $validFixStates) {
        throw "Invoke-TddKeepGoing requires pipelineState in ($($validFixStates -join ', ')), got '$($State.pipelineState)'."
    }

    if ($State.tddKeepGoingCount -ge $Config['MaxTddKeepGoingPerGate']) {
        throw "Invoke-TddKeepGoing: TDD Keep Going exhausted ($($State.tddKeepGoingCount) >= $($Config['MaxTddKeepGoingPerGate']))."
    }

    $State.tddKeepGoingCount = $State.tddKeepGoingCount + 1
    Write-PipelineLog "TDD Keep Going: tddKeepGoingCount=$($State.tddKeepGoingCount)"

    # UNCHANGED: pipelineState, lockHolder, reviewRound, keepGoingResets,
    #            verdict, tasksDone, gateTimedOut, globalTimedOut, reviewGateType
}

function Invoke-TddKeepGoingExhausted {
    <#
    .SYNOPSIS
        TLA+ TddKeepGoingExhausted — TDD cap reached, escalate back to review gate.
    .DESCRIPTION
        When tddKeepGoingCount reaches MaxTddKeepGoingPerGate, the fix cycle
        cannot continue. State returns to the parent review state with
        verdict="fail" and reviewRound incremented.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config
    )

    $validFixStates = @('reviewFix', 'finalReviewFix')
    if ($State.pipelineState -notin $validFixStates) {
        throw "Invoke-TddKeepGoingExhausted requires pipelineState in ($($validFixStates -join ', ')), got '$($State.pipelineState)'."
    }

    $State.pipelineState = if ($State.pipelineState -eq 'reviewFix') { 'preMergeReview' } else { 'finalReview' }
    $State.verdict       = 'fail'
    $State.reviewRound   = $State.reviewRound + 1

    Write-PipelineLog "TDD Keep Going exhausted: escalating to $($State.pipelineState) with verdict=fail, round=$($State.reviewRound)"

    # UNCHANGED: lockHolder, keepGoingResets, tddKeepGoingCount,
    #            tasksDone, gateTimedOut, globalTimedOut, reviewGateType
}

function Invoke-TddStopInFix {
    <#
    .SYNOPSIS
        TLA+ TddStopInFix — user voluntary stop during a TDD fix cycle.
    .DESCRIPTION
        Transitions to HALTED and releases the lock. Works from both
        reviewFix and finalReviewFix states.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config
    )

    $validFixStates = @('reviewFix', 'finalReviewFix')
    if ($State.pipelineState -notin $validFixStates) {
        throw "Invoke-TddStopInFix requires pipelineState in ($($validFixStates -join ', ')), got '$($State.pipelineState)'."
    }

    $State.pipelineState = 'HALTED'
    $State.lockHolder    = $null

    Write-PipelineLog "TDD Stop in fix: pipeline HALTED"

    # UNCHANGED: reviewRound, keepGoingResets, tddKeepGoingCount,
    #            verdict, tasksDone, gateTimedOut, globalTimedOut, reviewGateType
}

function Complete-ReviewFix {
    <#
    .SYNOPSIS
        TLA+ ReviewFixComplete — transitions pipeline from reviewFix back to
        preMergeReview after a successful fix cycle.
    .DESCRIPTION
        Validates guard conditions (pipelineState must be 'reviewFix', neither
        gate nor global timeout), then increments reviewRound, clears verdict,
        and transitions to 'preMergeReview'. Preserves all UNCHANGED fields.
    .PARAMETER State
        Mutable pipeline state hashtable from New-PipelineState.
    .PARAMETER Config
        Read-only config dictionary from Get-PipelineConfig.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config
    )

    # ── Guard: pipelineState must be 'reviewFix' or 'finalReviewFix' ──
    $validFixStates = @('reviewFix', 'finalReviewFix')
    if ($State.pipelineState -notin $validFixStates) {
        throw "Complete-ReviewFix requires pipelineState in ($($validFixStates -join ', ')), got '$($State.pipelineState)'."
    }

    # ── Guard: gate must not have timed out ──
    if ($State.gateTimedOut) {
        throw "Complete-ReviewFix: gate has timed out. Cannot complete review fix."
    }

    # ── Guard: global must not have timed out ──
    if ($State.globalTimedOut) {
        throw "Complete-ReviewFix: global has timed out. Cannot complete review fix."
    }

    # ── State transition — route based on current state ──
    $State.pipelineState = if ($State.pipelineState -eq 'reviewFix') { 'preMergeReview' } else { 'finalReview' }
    $State.reviewRound   = $State.reviewRound + 1
    $State.verdict       = $null

    # lockHolder, keepGoingResets, tddKeepGoingCount, tasksDone,
    # gateTimedOut, globalTimedOut, reviewGateType are UNCHANGED
}

function Invoke-ReviewFixCycle {
    <#
    .SYNOPSIS
        Orchestrates a RED → GREEN → Cleanup TDD cycle driven by review blockers.
    .DESCRIPTION
        Creates fresh TDD counters, passes blocker context to all phases,
        and short-circuits on escalation from any phase.
    .PARAMETER State
        Mutable pipeline state hashtable.
    .PARAMETER Config
        Read-only config dictionary.
    .PARAMETER Task
        Task descriptor hashtable (id, step, title, files, codeWriter, testWriter).
    .PARAMETER Blockers
        Non-empty array of blocker objects from a failed review verdict.
    .PARAMETER Root
        Repository root path.
    .PARAMETER FeatureDir
        Feature working directory path.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config,
        [Parameter(Mandatory)]$Task,
        [Parameter(Mandatory)][AllowNull()]$Blockers,
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$FeatureDir
    )

    # ── Guard: pipelineState must be 'reviewFix' or 'finalReviewFix' ──
    $validFixStates = @('reviewFix', 'finalReviewFix')
    if ($State.pipelineState -notin $validFixStates) {
        throw "Invoke-ReviewFixCycle requires pipelineState in ($($validFixStates -join ', ')), got '$($State.pipelineState)'."
    }

    # ── Guard: Blockers must be non-empty ──
    if ($null -eq $Blockers -or @($Blockers).Count -eq 0) {
        throw "Invoke-ReviewFixCycle: blocker list must be non-empty. Zero-blocker failures should use retry-review."
    }

    # ── Fresh TDD counters for this cycle ──
    $counters = @{
        redAttempts          = 0
        greenAttempts        = 0
        cleanupRemediations  = 0
        cleanupCleanPasses   = 0
    }

    Write-PipelineLog "Review-fix cycle: starting RED phase with $(@($Blockers).Count) blocker(s)"

    # ── RED phase ──
    $redResult = Invoke-RedPhase `
        -State $State -Config $Config -Task $Task `
        -Blockers $Blockers -Counters $counters `
        -Root $Root -FeatureDir $FeatureDir

    if ($redResult.Status -eq 'escalated') {
        return $redResult
    }

    $testFiles = @($redResult.TestFiles)

    # ── GREEN phase ──
    Write-PipelineLog "Review-fix cycle: starting GREEN phase"

    $greenResult = Invoke-GreenPhase `
        -State $State -Config $Config -Task $Task `
        -Blockers $Blockers -TestFiles $testFiles -Counters $counters `
        -Root $Root -FeatureDir $FeatureDir

    if ($greenResult.Status -eq 'escalated') {
        return $greenResult
    }

    # ── Cleanup phase ──
    Write-PipelineLog "Review-fix cycle: starting Cleanup phase"

    $cleanupResult = Invoke-CleanupPhase `
        -State $State -Config $Config -Task $Task `
        -Counters $counters `
        -Root $Root -FeatureDir $FeatureDir

    if ($cleanupResult.Status -eq 'escalated') {
        return $cleanupResult
    }

    Write-PipelineLog "Review-fix cycle: all phases passed"

    return @{
        Status = 'pass'
    }
}
