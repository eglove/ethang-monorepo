# =============================================================================
# action-dispatcher.ps1 — Maps TLA+ action names to PowerShell function calls
# =============================================================================

$ErrorActionPreference = 'Stop'

function Invoke-TlaAction {
    <#
    .SYNOPSIS
        Dispatches a TLA+ PipelineReviewers action against the PowerShell state.
        The action name + previous state determine which function to call.
    #>
    param(
        [Parameter(Mandatory)][string]$ActionName,
        [Parameter(Mandatory)][hashtable]$State,
        [Parameter(Mandatory)]$Config,
        [hashtable]$StepState = @{}
    )

    switch ($ActionName) {
        'Init' {
            # No-op: state already initialized
        }
        'AcquireLock' {
            $State.pipelineState = 'locked'
            $State.lockHolder = 1
        }
        'StartRunning' {
            $State.pipelineState = 'running'
        }
        'EnterPreMergeReview' {
            Enter-ReviewGate -State $State -Config $Config -GateType 'preMerge'
        }
        'EnterFinalReview' {
            Enter-ReviewGate -State $State -Config $Config -GateType 'final'
        }
        'HandlePassPreMerge' {
            $verdict = [PSCustomObject]@{
                Verdict = 'pass'; Blockers = @(); Notes = @()
                SelectedReviewers = @('trace'); ExcludedReviewers = @()
            }
            $null = Resolve-PreMergeVerdict -State $State -Config $Config -Verdict $verdict
        }
        'HandleFailPreMerge' {
            $verdict = [PSCustomObject]@{
                Verdict = 'fail'
                Blockers = @([PSCustomObject]@{
                    Reviewer = 'trace'; Severity = 'high'
                    Description = 'Trace blocker'; Files = @('f.ts'); Suggestion = 'Fix'
                })
                Notes = @(); SelectedReviewers = @('trace'); ExcludedReviewers = @()
            }
            $null = Resolve-PreMergeVerdict -State $State -Config $Config -Verdict $verdict
        }
        'HandleRetryPreMerge' {
            $verdict = [PSCustomObject]@{
                Verdict = 'retry'; Blockers = @(); Notes = @()
                SelectedReviewers = @(); ExcludedReviewers = @()
            }
            $null = Resolve-PreMergeVerdict -State $State -Config $Config -Verdict $verdict
        }
        'ReviewFixComplete' {
            Complete-ReviewFix -State $State -Config $Config
        }
        'FinalReviewFixComplete' {
            Complete-ReviewFix -State $State -Config $Config
        }
        'TddKeepGoingInFix' {
            Invoke-TddKeepGoing -State $State -Config $Config
        }
        'TddKeepGoingExhausted' {
            Invoke-TddKeepGoingExhausted -State $State -Config $Config
        }
        'TddStopInFix' {
            Invoke-TddStopInFix -State $State -Config $Config
        }
        'ReviewKeepGoing' {
            Mock Read-Escalation { return @{ Decision = 'KeepGoing'; Source = 'task' } }
            $null = Invoke-ReviewEscalation -State $State -Config $Config
        }
        'ReviewForcedStop' {
            # Forced stop: keepGoingResets >= MaxKeepGoingResets
            $null = Invoke-ReviewEscalation -State $State -Config $Config
        }
        'ReviewStop' {
            Mock Read-Escalation { return @{ Decision = 'Stop'; Source = 'task' } }
            $null = Invoke-ReviewEscalation -State $State -Config $Config
        }
        'TaskMerged' {
            $State.tasksDone++
            $State.pipelineState = 'running'
            $State.reviewGateType = 'none'
        }
        'HandlePassFinal' {
            $verdict = [PSCustomObject]@{
                Verdict = 'pass'; Blockers = @(); Notes = @()
                SelectedReviewers = @('trace'); ExcludedReviewers = @()
            }
            $null = Resolve-FinalMergeVerdict -State $State -Config $Config -Verdict $verdict
        }
        'HandleFailFinal' {
            $verdict = [PSCustomObject]@{
                Verdict = 'fail'
                Blockers = @([PSCustomObject]@{
                    Reviewer = 'trace'; Severity = 'high'
                    Description = 'Trace blocker'; Files = @('f.ts'); Suggestion = 'Fix'
                })
                Notes = @(); SelectedReviewers = @('trace'); ExcludedReviewers = @()
            }
            $null = Resolve-FinalMergeVerdict -State $State -Config $Config -Verdict $verdict
        }
        'HandleRetryFinal' {
            $verdict = [PSCustomObject]@{
                Verdict = 'retry'; Blockers = @(); Notes = @()
                SelectedReviewers = @(); ExcludedReviewers = @()
            }
            $null = Resolve-FinalMergeVerdict -State $State -Config $Config -Verdict $verdict
        }
        'ReviewGateTimeout' {
            $State.gateTimedOut = $true
        }
        'GateTimeoutKeepGoing' {
            $State.gateTimedOut = $false
            $State.keepGoingResets++
            $State.reviewRound = 0
            $State.tddKeepGoingCount = 0
            $State.verdict = $null
            $State.pipelineState = if ($State.reviewGateType -eq 'preMerge') { 'preMergeReview' } else { 'finalReview' }
        }
        'GateTimeoutStop' {
            $State.pipelineState = 'HALTED'
            $State.lockHolder = $null
        }
        'GlobalTimeout' {
            $State.globalTimedOut = $true
            $State.pipelineState = 'HALTED'
            $State.lockHolder = $null
        }
        'DiffBaseStale' {
            # Re-review: increment round, stay in preMergeReview
            $State.reviewRound++
            $State.pipelineState = 'preMergeReview'
        }
        'DiffBaseStaleExhausted' {
            $State.pipelineState = 'HALTED'
            $State.lockHolder = $null
        }
        'Done' {
            # Terminal stuttering — no-op
        }
        default {
            throw "Unknown TLA+ action: $ActionName"
        }
    }
}
