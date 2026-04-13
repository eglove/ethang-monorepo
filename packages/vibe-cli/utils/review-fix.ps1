# =============================================================================
# review-fix.ps1 — Review-fix cycle
# TLA+ action: ReviewFixComplete
# Depends on: review-verdict.ps1
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
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config,
        [string]$FeatureName
    )

    $validFixStates = @('reviewFix', 'finalReviewFix')
    if ($State.pipelineState -notin $validFixStates) {
        throw "Invoke-TddKeepGoing requires pipelineState in ($($validFixStates -join ', ')), got '$($State.pipelineState)'."
    }

    $State.tddKeepGoingCount = $State.tddKeepGoingCount + 1

    if ($FeatureName -and (Get-Command Update-PipelineState -ErrorAction SilentlyContinue)) {
        Update-PipelineState -FeatureName $FeatureName -TddKeepGoingCount $State.tddKeepGoingCount
    }

    Write-PipelineLog "TDD Keep Going: tddKeepGoingCount=$($State.tddKeepGoingCount)"
}

function Invoke-TddKeepGoingExhausted {
    <#
    .SYNOPSIS
        TLA+ TddKeepGoingExhausted — TDD cap reached, escalate back to review gate.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config,
        [string]$FeatureName
    )

    $validFixStates = @('reviewFix', 'finalReviewFix')
    if ($State.pipelineState -notin $validFixStates) {
        throw "Invoke-TddKeepGoingExhausted requires pipelineState in ($($validFixStates -join ', ')), got '$($State.pipelineState)'."
    }

    $State.pipelineState = if ($State.pipelineState -eq 'reviewFix') { 'preMergeReview' } else { 'finalReview' }
    $State.verdict       = 'fail'
    $State.reviewRound   = $State.reviewRound + 1

    if ($FeatureName -and (Get-Command Update-PipelineState -ErrorAction SilentlyContinue)) {
        Update-PipelineState -FeatureName $FeatureName -PipelineState $State.pipelineState -Verdict 'fail' -ReviewRound $State.reviewRound
    }

    Write-PipelineLog "TDD Keep Going exhausted: escalating to $($State.pipelineState) with verdict=fail, round=$($State.reviewRound)"
}

function Invoke-TddStopInFix {
    <#
    .SYNOPSIS
        TLA+ TddStopInFix — user voluntary stop during a TDD fix cycle.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config,
        [string]$FeatureName
    )

    $validFixStates = @('reviewFix', 'finalReviewFix')
    if ($State.pipelineState -notin $validFixStates) {
        throw "Invoke-TddStopInFix requires pipelineState in ($($validFixStates -join ', ')), got '$($State.pipelineState)'."
    }

    $State.pipelineState = 'HALTED'
    $State.lockHolder    = $null

    if ($FeatureName -and (Get-Command Update-PipelineState -ErrorAction SilentlyContinue)) {
        Update-PipelineState -FeatureName $FeatureName -PipelineState 'HALTED' -LockHolder 0 -FeatureStatus 'halted'
    }

    Write-PipelineLog "TDD Stop in fix: pipeline HALTED"
}

function Complete-ReviewFix {
    <#
    .SYNOPSIS
        TLA+ ReviewFixComplete — transitions pipeline from reviewFix back to
        preMergeReview (or finalReview) after a successful fix cycle.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config,
        [string]$FeatureName
    )

    $validFixStates = @('reviewFix', 'finalReviewFix')
    if ($State.pipelineState -notin $validFixStates) {
        throw "Complete-ReviewFix requires pipelineState in ($($validFixStates -join ', ')), got '$($State.pipelineState)'."
    }

    $State.pipelineState = if ($State.pipelineState -eq 'reviewFix') { 'preMergeReview' } else { 'finalReview' }
    $State.reviewRound   = $State.reviewRound + 1
    $State.verdict       = $null

    if ($FeatureName -and (Get-Command Update-PipelineState -ErrorAction SilentlyContinue)) {
        Update-PipelineState -FeatureName $FeatureName -PipelineState $State.pipelineState -ReviewRound $State.reviewRound -Verdict $null
    }
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
