# =============================================================================
# contract-provider.Tests.ps1 — Provider-side contract tests
# Each provider's output is validated against the contract it must satisfy.
# Tag: Contract
# =============================================================================

BeforeAll {
    function Invoke-Claude { }
    function Write-PipelineLog { }
    function Write-StatusNote { }
    function Write-TaskLog { }

    . "$PSScriptRoot/../utils/config.ps1"
    # Stub: pipeline-state.ps1 was removed in code-simplify
    function global:New-PipelineState {
        return @{
            pipelineState      = 'idle'
            lockHolder         = $null
            reviewRound        = [int]0
            keepGoingResets    = [int]0
            tddKeepGoingCount = [int]0
            verdict            = $null
            tasksDone          = [int]0
            gateTimedOut       = $false
            globalTimedOut     = $false
            reviewGateType     = 'none'
        }
    }
    . "$PSScriptRoot/../utils/review-verdict.ps1"
    . "$PSScriptRoot/../utils/review-gate.ps1"
    . "$PSScriptRoot/../utils/review-fix.ps1"
    . "$PSScriptRoot/../utils/result-contracts.ps1"

    # Re-define Read-Escalation AFTER loading review-gate.ps1 (which overwrites it)
    function Read-Escalation {
        return @{ Decision = 'KeepGoing'; Source = 'task' }
    }

    . "$PSScriptRoot/contracts/contract-engine.ps1"
    . "$PSScriptRoot/contracts/definitions/verdict-contract.ps1"
    . "$PSScriptRoot/contracts/definitions/task-result-contract.ps1"
    . "$PSScriptRoot/contracts/definitions/merge-result-contract.ps1"
    . "$PSScriptRoot/contracts/definitions/escalation-result-contract.ps1"
    . "$PSScriptRoot/contracts/definitions/review-fix-input-contract.ps1"
}

# =============================================================================
# New-ReviewVerdict satisfies VerdictContract
# =============================================================================

Describe 'Provider: New-ReviewVerdict satisfies Verdict contract' -Tag 'Contract' {
    It 'pass verdict satisfies contract' {
        $moderator = @{
            verdict           = 'pass'
            blockers          = @()
            notes             = @()
            selectedReviewers = @('security')
            excludedReviewers = @(@{ reviewer = 'perf'; reason = 'no perf changes' })
        }
        $verdict = New-ReviewVerdict -ModeratorResponse $moderator
        $asHash = @{
            Verdict           = $verdict.Verdict
            Blockers          = @($verdict.Blockers)
            Notes             = @($verdict.Notes)
            SelectedReviewers = @($verdict.SelectedReviewers)
            ExcludedReviewers = @($verdict.ExcludedReviewers)
        }
        $result = Test-Contract -Schema $script:VerdictContract -Data $asHash
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'VerdictContract')
    }

    It 'fail verdict with blockers satisfies contract' {
        $moderator = @{
            verdict           = 'fail'
            blockers          = @(@{
                reviewer = 'security'; severity = 'critical'
                description = 'SQL injection'; files = @('db.ts'); suggestion = 'Parameterize'
            })
            notes             = @()
            selectedReviewers = @('security', 'compliance')
            excludedReviewers = @()
        }
        $verdict = New-ReviewVerdict -ModeratorResponse $moderator
        $asHash = @{
            Verdict           = $verdict.Verdict
            Blockers          = @($verdict.Blockers)
            Notes             = @($verdict.Notes)
            SelectedReviewers = @($verdict.SelectedReviewers)
            ExcludedReviewers = @($verdict.ExcludedReviewers)
        }
        $result = Test-Contract -Schema $script:VerdictContract -Data $asHash
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'VerdictContract')
    }

    It 'New-RetryVerdict satisfies contract' {
        $verdict = New-RetryVerdict -Reason 'test'
        $asHash = @{
            Verdict           = $verdict.Verdict
            Blockers          = @($verdict.Blockers)
            Notes             = @($verdict.Notes)
            SelectedReviewers = @($verdict.SelectedReviewers)
            ExcludedReviewers = @($verdict.ExcludedReviewers)
        }
        $result = Test-Contract -Schema $script:VerdictContract -Data $asHash
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'VerdictContract')
    }
}

# =============================================================================
# ConvertTo-TaskResult satisfies TaskResultContract
# =============================================================================

Describe 'Provider: ConvertTo-TaskResult satisfies TaskResult contract' -Tag 'Contract' {
    It 'completed task result satisfies contract' {
        $testInput = @{
            TaskId    = 'T1'
            Phase     = 'done'
            Status    = 'completed'
            Counters  = @{ redAttempts = 1; greenAttempts = 1 }
            Escalated = $false
        }
        $taskResult = ConvertTo-TaskResult -Input_ $testInput
        $result = Test-Contract -Schema $script:TaskResultContract -Data $taskResult
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'TaskResultContract')
    }

    It 'escalated task result satisfies contract' {
        $testInput = @{
            TaskId    = 'T2'
            Phase     = 'red_retry'
            Status    = 'escalated'
            Counters  = @{ redAttempts = 3 }
            Escalated = $true
        }
        $taskResult = ConvertTo-TaskResult -Input_ $testInput
        $result = Test-Contract -Schema $script:TaskResultContract -Data $taskResult
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'TaskResultContract')
    }
}

# =============================================================================
# ConvertTo-MergeResult satisfies MergeResultContract
# =============================================================================

Describe 'Provider: ConvertTo-MergeResult satisfies MergeResult contract' -Tag 'Contract' {
    It 'success merge satisfies contract' {
        $testInput = @{
            TaskId       = 'T1'
            Success      = $true
            Conflict     = $false
            RetryCount   = 0
            AbortedClean = $false
        }
        $mergeResult = ConvertTo-MergeResult -Input_ $testInput
        $result = Test-Contract -Schema $script:MergeResultContract -Data $mergeResult
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'MergeResultContract')
    }

    It 'conflict merge satisfies contract' {
        $testInput = @{
            TaskId       = 'T1'
            Success      = $false
            Conflict     = $true
            RetryCount   = 2
            AbortedClean = $true
        }
        $mergeResult = ConvertTo-MergeResult -Input_ $testInput
        $result = Test-Contract -Schema $script:MergeResultContract -Data $mergeResult
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'MergeResultContract')
    }
}

# =============================================================================
# ConvertTo-EscalationResult satisfies EscalationResultContract
# =============================================================================

Describe 'Provider: ConvertTo-EscalationResult satisfies Escalation contract' -Tag 'Contract' {
    It 'KeepGoing escalation satisfies contract' {
        $testInput = @{ Decision = 'KeepGoing'; Source = 'task'; TaskId = 'T1' }
        $escResult = ConvertTo-EscalationResult -Input_ $testInput
        $result = Test-Contract -Schema $script:EscalationResultContract -Data $escResult
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'EscalationResultContract')
    }

    It 'Stop escalation satisfies contract' {
        $testInput = @{ Decision = 'Stop'; Source = 'merge'; Reason = 'user abort' }
        $escResult = ConvertTo-EscalationResult -Input_ $testInput
        $result = Test-Contract -Schema $script:EscalationResultContract -Data $escResult
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'EscalationResultContract')
    }
}

# =============================================================================
# Resolve-PreMergeVerdict:fail produces valid ReviewFixInput
# =============================================================================

Describe 'Provider: Resolve-PreMergeVerdict:fail produces valid ReviewFixInput' -Tag 'Contract' {
    It 'fail verdict produces fix input with blockers' {
        Mock Write-PipelineLog {}
        $cfg = Get-PipelineConfig
        $state = New-PipelineState
        $state.pipelineState = 'preMergeReview'
        $state.lockHolder = 1
        $state.reviewGateType = 'preMerge'

        $blocker = [PSCustomObject]@{
            Reviewer = 'sec'; Severity = 'high'
            Description = 'XSS'; Files = @('a.ts'); Suggestion = 'Fix'
        }
        $verdict = [PSCustomObject]@{
            Verdict = 'fail'; Blockers = @($blocker)
            Notes = @(); SelectedReviewers = @(); ExcludedReviewers = @()
        }
        $action = Resolve-PreMergeVerdict -State $state -Config $cfg -Verdict $verdict
        $fixInput = @{ Action = $action.Action; Blockers = $action.Blockers }
        $result = Test-Contract -Schema $script:ReviewFixInputContract -Data $fixInput
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'ReviewFixInputContract')
    }
}
