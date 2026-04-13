# =============================================================================
# diff-staleness.ps1 — Diff-base staleness detection for merge queue
# TLA+ actions: DiffBaseStale
# Depends on: pipeline-state.ps1
# =============================================================================

$ErrorActionPreference = 'Stop'

function Test-DiffStaleness {
    <#
    .SYNOPSIS
        Pure query: checks if the diff base is stale after a concurrent merge.
    .DESCRIPTION
        When NumTasks > 1, a task that passed review may have a stale diff if
        another task merged concurrently. Compares the review-time diff base SHA
        with the current HEAD. Single-task tiers always return $false (invariant S12).
        Does NOT mutate state.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config,
        [Parameter(Mandatory)][string]$ReviewTimeDiffBase,
        [Parameter(Mandatory)][string]$CurrentHead
    )

    if ($State.pipelineState -ne 'mergeQueue') {
        throw "Test-DiffStaleness requires pipelineState 'mergeQueue', got '$($State.pipelineState)'."
    }

    # S12: staleness only possible with NumTasks > 1
    if ($Config['NumTasks'] -le 1) {
        return $false
    }

    return $ReviewTimeDiffBase -ne $CurrentHead
}

function Resolve-DiffStaleness {
    <#
    .SYNOPSIS
        TLA+ DiffBaseStale — handles stale diff in merge queue.
    .DESCRIPTION
        When the diff is stale, always re-review (DiffBaseStale).
        Preserves keepGoingResets and tddKeepGoingCount (not reset on staleness).
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config
    )

    if ($State.pipelineState -ne 'mergeQueue') {
        throw "Resolve-DiffStaleness requires pipelineState 'mergeQueue', got '$($State.pipelineState)'."
    }

    # DiffBaseStale: re-review with incremented round
    $State.pipelineState  = 'preMergeReview'
    $State.reviewRound    = $State.reviewRound + 1
    $State.verdict        = $null
    $State.reviewGateType = 'preMerge'

    Write-PipelineLog "Diff base stale — re-review at round $($State.reviewRound)"

    # UNCHANGED: lockHolder, keepGoingResets, tddKeepGoingCount, tasksDone

    return [PSCustomObject]@{ Action = 'reReview' }
}
