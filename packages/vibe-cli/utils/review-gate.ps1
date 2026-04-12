# =============================================================================
# review-gate.ps1 — Review gate engine (core loop)
# TLA+ actions: EnterPreMergeReview, ReviewVerdict, KeepGoingReview, StopReview
# Depends on: config.ps1, pipeline-state.ps1, review-verdict.ps1, read-escalation.ps1
# =============================================================================

$ErrorActionPreference = 'Stop'

. "$PSScriptRoot/read-escalation.ps1"

function Enter-ReviewGate {
    <#
    .SYNOPSIS
        TLA+ EnterPreMergeReview / EnterFinalReview — transitions pipeline into a review gate.
    .DESCRIPTION
        Validates guard conditions, transitions pipelineState, sets reviewGateType,
        and resets all review-specific counters. Preserves lockHolder, tasksDone,
        and globalTimedOut (TLA+ UNCHANGED).
    .PARAMETER State
        Mutable pipeline state hashtable from New-PipelineState.
    .PARAMETER Config
        Read-only config dictionary from Get-PipelineConfig.
    .PARAMETER GateType
        Either 'preMerge' or 'final'.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config,
        [Parameter(Mandatory)]
        [ValidateSet('preMerge', 'final')]
        [string]$GateType
    )

    # ── Guard conditions ──

    if ($State.pipelineState -ne 'running') {
        throw "Enter-ReviewGate requires pipelineState 'running', got '$($State.pipelineState)'."
    }

    if ($GateType -eq 'preMerge' -and $State.tasksDone -ge $Config['NumTasks']) {
        throw "Enter-ReviewGate: all tasks done ($($State.tasksDone) >= $($Config['NumTasks'])) — use GateType 'final' for final review."
    }

    if ($GateType -eq 'final' -and $State.tasksDone -ne $Config['NumTasks']) {
        throw "Enter-ReviewGate: final review requires all tasks done (tasksDone=$($State.tasksDone), NumTasks=$($Config['NumTasks']))."
    }

    # ── State transition ──

    $State.pipelineState    = if ($GateType -eq 'preMerge') { 'preMergeReview' } else { 'finalReview' }
    $State.reviewGateType   = $GateType
    $State.reviewRound      = 0
    $State.keepGoingResets   = 0
    $State.tddKeepGoingCount = 0
    $State.verdict          = $null
    $State.gateTimedOut     = $false

    # lockHolder, tasksDone, globalTimedOut are UNCHANGED
}

function Invoke-ReviewGate {
    <#
    .SYNOPSIS
        TLA+ ReviewVerdict — calls the review moderator and returns a normalized verdict.
    .DESCRIPTION
        Core review loop: invokes Invoke-Claude with the diff content, parses the
        JSON response, validates schema via Test-ReviewVerdict, and returns a
        normalized verdict object. On parse/schema failure, returns a synthetic
        retry verdict. Does NOT mutate pipeline state (verdict handling is T6).
    .PARAMETER State
        Pipeline state hashtable (read for guard checks, not mutated).
    .PARAMETER Config
        Read-only config dictionary from Get-PipelineConfig.
    .PARAMETER DiffContent
        The git diff content to send to the review moderator.
    .OUTPUTS
        PSCustomObject with Verdict, Blockers, Notes, SelectedReviewers, ExcludedReviewers.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config,
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [string]$DiffContent
    )

    # ── Guard conditions (TLA+ ReviewVerdict preconditions) ──

    $validReviewStates = @('preMergeReview', 'finalReview')
    if ($State.pipelineState -notin $validReviewStates) {
        throw "Invoke-ReviewGate requires pipelineState in ($($validReviewStates -join ', ')), got '$($State.pipelineState)'."
    }

    if ($null -ne $State.verdict) {
        throw "Invoke-ReviewGate: verdict already set to '$($State.verdict)'. Clear before re-invoking."
    }

    if ($State.gateTimedOut) {
        throw "Invoke-ReviewGate: gate has timed out. Cannot invoke review."
    }

    if ($State.globalTimedOut) {
        throw "Invoke-ReviewGate: global timeout reached. Cannot invoke review."
    }

    # ── Call moderator via Invoke-Claude ──

    $rawResponse = Invoke-Claude -DiffContent $DiffContent

    # ── Parse and validate response ──

    if ([string]::IsNullOrWhiteSpace($rawResponse)) {
        Write-PipelineLog "Review moderator returned empty/null output — treating as retry"
        return New-RetryVerdict -Reason 'Moderator returned empty/null output'
    }

    # Attempt JSON parse
    try {
        $parsed = $rawResponse | ConvertFrom-Json -AsHashtable
    }
    catch {
        Write-PipelineLog "Review moderator parse failure: not valid JSON — treating as retry"
        return New-RetryVerdict -Reason 'Moderator returned non-JSON output'
    }

    # Schema validation via review-verdict.ps1
    if (-not (Test-ReviewVerdict -ModeratorResponse $parsed)) {
        Write-PipelineLog "Review moderator schema violation — treating as retry"
        return New-RetryVerdict -Reason 'Moderator response failed schema validation'
    }

    # ── Build normalized verdict ──

    return New-ReviewVerdict -ModeratorResponse $parsed
}

function Resolve-PreMergeVerdict {
    <#
    .SYNOPSIS
        TLA+ HandlePassPreMerge / HandleFailPreMerge / HandleRetryPreMerge —
        routes a pre-merge verdict to the correct state transition.
    .DESCRIPTION
        Validates guard conditions (pipelineState must be 'preMergeReview',
        verdict must be pass/fail/retry), then mutates State according to the
        TLA+ action for that verdict branch.
    .PARAMETER State
        Mutable pipeline state hashtable from New-PipelineState.
    .PARAMETER Config
        Read-only config dictionary from Get-PipelineConfig.
    .PARAMETER Verdict
        Normalized verdict object (from Invoke-ReviewGate or test fixture).
    .OUTPUTS
        PSCustomObject with Action (and Blockers for fail).
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config,
        [Parameter(Mandatory)]$Verdict
    )

    # ── Guard: pipelineState must be preMergeReview ──
    if ($State.pipelineState -ne 'preMergeReview') {
        throw "Resolve-PreMergeVerdict requires pipelineState 'preMergeReview', got '$($State.pipelineState)'."
    }

    # ── Guard: verdict value must be pass, fail, or retry ──
    $validVerdicts = @('pass', 'fail', 'retry')
    if ($null -eq $Verdict.Verdict -or $Verdict.Verdict -notin $validVerdicts) {
        throw "Resolve-PreMergeVerdict: invalid verdict '$($Verdict.Verdict)'. Expected one of: $($validVerdicts -join ', ')."
    }

    switch ($Verdict.Verdict) {
        'pass' {
            # TLA+ HandlePassPreMerge: transition to mergeQueue, clear gate
            $State.pipelineState  = 'mergeQueue'
            $State.reviewGateType = 'none'
            $State.verdict        = $null

            return [PSCustomObject]@{ Action = 'mergeQueue' }
        }

        'fail' {
            # ── Round guard: fail is only permitted when reviewRound < MaxReviewRounds ──
            if ($State.reviewRound -ge $Config['MaxReviewRounds']) {
                throw "Resolve-PreMergeVerdict: review round exhausted ($($State.reviewRound) >= $($Config['MaxReviewRounds']))."
            }

            # TLA+ HandleFailPreMerge: transition to reviewFix, keep gate type
            $State.pipelineState = 'reviewFix'
            $State.verdict       = $null

            return [PSCustomObject]@{
                Action   = 'reviewFix'
                Blockers = @($Verdict.Blockers)
            }
        }

        'retry' {
            # ── Round guard: retry is only permitted when reviewRound < MaxReviewRounds ──
            if ($State.reviewRound -ge $Config['MaxReviewRounds']) {
                throw "Resolve-PreMergeVerdict: review round exhausted ($($State.reviewRound) >= $($Config['MaxReviewRounds']))."
            }

            # TLA+ HandleRetryPreMerge: increment round, stay in preMergeReview
            $State.reviewRound = $State.reviewRound + 1
            $State.verdict     = $null

            return [PSCustomObject]@{ Action = 'retry' }
        }
    }
}

function New-RetryVerdict {
    <#
    .SYNOPSIS
        Factory for synthetic retry verdict on parse/schema/timeout failure.
    .DESCRIPTION
        Creates a verdict object with Verdict='retry', empty arrays for
        Blockers/Notes/SelectedReviewers, and the failure reason for audit.
    .PARAMETER Reason
        Human-readable reason for the retry (logged for audit).
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Reason
    )

    [PSCustomObject]@{
        Verdict           = 'retry'
        Blockers          = @()
        Notes             = @()
        SelectedReviewers = @()
        ExcludedReviewers = @()
        Reason            = $Reason
    }
}

function Invoke-ReviewEscalation {
    <#
    .SYNOPSIS
        TLA+ KeepGoingReview / StopReview — handles review round exhaustion escalation.
    .DESCRIPTION
        Called when reviewRound >= MaxReviewRounds. Three paths:
        1. keepGoingResets >= MaxKeepGoingResets → forced stop (no prompt)
        2. Read-Escalation returns 'KeepGoing' → reset counters, resume review
        3. Read-Escalation returns 'Stop' → halt pipeline
    .PARAMETER State
        Mutable pipeline state hashtable from New-PipelineState.
    .PARAMETER Config
        Read-only config dictionary from Get-PipelineConfig.
    .OUTPUTS
        PSCustomObject with Action: 'resumeReview', 'stopped', or 'forcedStop'.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config
    )

    # ── Guard: pipelineState must be a review state ──
    $validReviewStates = @('preMergeReview', 'finalReview')
    if ($State.pipelineState -notin $validReviewStates) {
        throw "Invoke-ReviewEscalation requires pipelineState in a review state ($($validReviewStates -join ', ')), got '$($State.pipelineState)'."
    }

    # ── Guard: reviewRound must be at exhaustion ──
    if ($State.reviewRound -lt $Config['MaxReviewRounds']) {
        throw "Invoke-ReviewEscalation: review rounds not yet exhausted ($($State.reviewRound) < $($Config['MaxReviewRounds']))."
    }

    # ── Forced stop: Keep Going itself is exhausted ──
    if ($State.keepGoingResets -ge $Config['MaxKeepGoingResets']) {
        Write-PipelineLog "Keep Going exhausted ($($State.keepGoingResets) >= $($Config['MaxKeepGoingResets'])) — forced stop"
        $State.pipelineState = 'HALTED'
        $State.lockHolder    = $null
        return [PSCustomObject]@{ Action = 'forcedStop' }
    }

    # ── Prompt user via Read-Escalation ──
    $escalation = Read-Escalation -Source 'task'

    switch ($escalation.Decision) {
        'KeepGoing' {
            # TLA+ KeepGoingReview: reset review round, increment meta-counter
            $State.reviewRound       = 0
            $State.keepGoingResets    = $State.keepGoingResets + 1
            $State.verdict           = $null
            $State.tddKeepGoingCount = 0
            # lockHolder, tasksDone, pipelineState are UNCHANGED
            Write-PipelineLog "Keep Going: review round reset (keepGoingResets=$($State.keepGoingResets))"
            return [PSCustomObject]@{ Action = 'resumeReview' }
        }

        'Stop' {
            # TLA+ StopReview: halt pipeline, release lock
            $State.pipelineState = 'HALTED'
            $State.lockHolder    = $null
            Write-PipelineLog "Review escalation: user chose Stop — pipeline HALTED"
            return [PSCustomObject]@{ Action = 'stopped' }
        }
    }
}

function Invoke-ReviewGateFailure {
    <#
    .SYNOPSIS
        TLA+ ReviewGateFail — marks task as failed on review rejection.
        Increments completion counter exactly once.
    #>
    param(
        [Parameter(Mandatory)][hashtable]$TaskState,
        [Parameter(Mandatory)][hashtable]$TierState,
        [string]$Reason = 'review_rejected'
    )

    # Guard: must be in review_gate state
    if ($TaskState.taskState -ne 'review_gate') {
        throw "ReviewGateFail requires taskState 'review_gate', got '$($TaskState.taskState)'"
    }

    # Transition task to failed
    $TaskState.taskState = 'failed'
    $TaskState.failureReason = $Reason

    # Increment completion counter (exactly once per task failure)
    if (-not $TaskState._completionCounted) {
        $TierState.completionCounter++
        $TaskState._completionCounted = $true
    }

    return @{
        action = 'ReviewGateFail'
        taskId = $TaskState.taskId
        reason = $Reason
        tddIter = $TaskState.tddIter
        coverageIter = $TaskState.coverageIter
    }
}

function Resolve-FinalMergeVerdict {
    <#
    .SYNOPSIS
        TLA+ HandlePassFinal / HandleFailFinal / HandleRetryFinal —
        routes a final review verdict to the correct state transition.
    .DESCRIPTION
        Mirrors Resolve-PreMergeVerdict for the final review gate.
        Pass → COMPLETE (lock released). Fail → finalReviewFix.
        Retry → increment reviewRound, stay in finalReview.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config,
        [Parameter(Mandatory)]$Verdict
    )

    # ── Guard: pipelineState must be finalReview ──
    if ($State.pipelineState -ne 'finalReview') {
        throw "Resolve-FinalMergeVerdict requires pipelineState 'finalReview', got '$($State.pipelineState)'."
    }

    # ── Guard: verdict value must be pass, fail, or retry ──
    $validVerdicts = @('pass', 'fail', 'retry')
    if ($null -eq $Verdict.Verdict -or $Verdict.Verdict -notin $validVerdicts) {
        throw "Resolve-FinalMergeVerdict: invalid verdict '$($Verdict.Verdict)'. Expected one of: $($validVerdicts -join ', ')."
    }

    switch ($Verdict.Verdict) {
        'pass' {
            # TLA+ HandlePassFinal: transition to COMPLETE, release lock
            $State.pipelineState  = 'COMPLETE'
            $State.lockHolder     = $null
            $State.reviewGateType = 'none'
            $State.verdict        = $null

            Write-PipelineLog "Final review PASSED — pipeline COMPLETE"

            return [PSCustomObject]@{ Action = 'complete' }
        }

        'fail' {
            # ── Round guard ──
            if ($State.reviewRound -ge $Config['MaxReviewRounds']) {
                throw "Resolve-FinalMergeVerdict: review round exhausted ($($State.reviewRound) >= $($Config['MaxReviewRounds']))."
            }

            # TLA+ HandleFailFinal: transition to finalReviewFix
            $State.pipelineState = 'finalReviewFix'
            $State.verdict       = $null

            Write-PipelineLog "Final review FAILED at round $($State.reviewRound) — entering finalReviewFix"

            return [PSCustomObject]@{
                Action   = 'finalReviewFix'
                Blockers = @($Verdict.Blockers)
            }
        }

        'retry' {
            # ── Round guard ──
            if ($State.reviewRound -ge $Config['MaxReviewRounds']) {
                throw "Resolve-FinalMergeVerdict: review round exhausted ($($State.reviewRound) >= $($Config['MaxReviewRounds']))."
            }

            # TLA+ HandleRetryFinal: increment round, stay in finalReview
            $State.reviewRound = $State.reviewRound + 1
            $State.verdict     = $null

            Write-PipelineLog "Final review RETRY — round incremented to $($State.reviewRound)"

            return [PSCustomObject]@{ Action = 'retry' }
        }
    }
}
