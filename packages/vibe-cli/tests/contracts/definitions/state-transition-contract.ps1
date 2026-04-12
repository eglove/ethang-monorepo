# =============================================================================
# state-transition-contract.ps1 — Pre/post state contracts for transitions
# Each entry defines the required pipelineState before and after a transition.
# =============================================================================

. "$PSScriptRoot/../contract-engine.ps1"

$script:StateTransitionContracts = @{
    'Enter-ReviewGate:preMerge' = @{
        Pre  = @{ pipelineState = 'running' }
        Post = @{ pipelineState = 'preMergeReview'; reviewGateType = 'preMerge'; reviewRound = 0; keepGoingResets = 0; tddKeepGoingCount = 0; gateTimedOut = $false }
    }
    'Enter-ReviewGate:final' = @{
        Pre  = @{ pipelineState = 'running' }
        Post = @{ pipelineState = 'finalReview'; reviewGateType = 'final'; reviewRound = 0; keepGoingResets = 0; tddKeepGoingCount = 0; gateTimedOut = $false }
    }
    'Resolve-PreMergeVerdict:pass' = @{
        Pre  = @{ pipelineState = 'preMergeReview' }
        Post = @{ pipelineState = 'mergeQueue'; reviewGateType = 'none' }
    }
    'Resolve-PreMergeVerdict:fail' = @{
        Pre  = @{ pipelineState = 'preMergeReview' }
        Post = @{ pipelineState = 'reviewFix' }
    }
    'Complete-ReviewFix:preMerge' = @{
        Pre  = @{ pipelineState = 'reviewFix' }
        Post = @{ pipelineState = 'preMergeReview' }
    }
    'Complete-ReviewFix:final' = @{
        Pre  = @{ pipelineState = 'finalReviewFix' }
        Post = @{ pipelineState = 'finalReview' }
    }
    'Resolve-FinalMergeVerdict:pass' = @{
        Pre  = @{ pipelineState = 'finalReview' }
        Post = @{ pipelineState = 'COMPLETE'; lockHolder = $null }
    }
    'Resolve-FinalMergeVerdict:fail' = @{
        Pre  = @{ pipelineState = 'finalReview' }
        Post = @{ pipelineState = 'finalReviewFix' }
    }
    'Invoke-ReviewEscalation:keepGoing' = @{
        Pre  = @{}
        Post = @{ reviewRound = 0; tddKeepGoingCount = 0 }
    }
    'Invoke-ReviewEscalation:stop' = @{
        Pre  = @{}
        Post = @{ pipelineState = 'HALTED'; lockHolder = $null }
    }
}

function Test-StateTransitionContract {
    <#
    .SYNOPSIS
        Validates that a state transition produced the expected post-state fields.
    .PARAMETER TransitionName
        Key into $StateTransitionContracts (e.g., 'Enter-ReviewGate:preMerge').
    .PARAMETER PreState
        State before transition (validated against Pre contract).
    .PARAMETER PostState
        State after transition (validated against Post contract).
    .OUTPUTS
        Hashtable with Valid (bool) and Violations (string array).
    #>
    param(
        [Parameter(Mandatory)][string]$TransitionName,
        [Parameter(Mandatory)][hashtable]$PreState,
        [Parameter(Mandatory)][hashtable]$PostState
    )

    $contract = $script:StateTransitionContracts[$TransitionName]
    if (-not $contract) {
        return @{ Valid = $false; Violations = @("Unknown transition: $TransitionName") }
    }

    $violations = [System.Collections.ArrayList]::new()

    # Validate pre-state
    foreach ($key in $contract.Pre.Keys) {
        if ($PreState[$key] -ne $contract.Pre[$key]) {
            $null = $violations.Add("Pre-state '$key': expected '$($contract.Pre[$key])', got '$($PreState[$key])'")
        }
    }

    # Validate post-state
    foreach ($key in $contract.Post.Keys) {
        if ($PostState[$key] -ne $contract.Post[$key]) {
            $null = $violations.Add("Post-state '$key': expected '$($contract.Post[$key])', got '$($PostState[$key])'")
        }
    }

    return @{
        Valid      = ($violations.Count -eq 0)
        Violations = $violations.ToArray()
    }
}
