# =============================================================================
# contract-consumer.Tests.ps1 — Consumer-side contract tests
# Each consumer validates that mock provider output satisfies the contract.
# Tag: Contract
# =============================================================================

BeforeAll {
    . "$PSScriptRoot/contracts/contract-engine.ps1"
    . "$PSScriptRoot/contracts/definitions/verdict-contract.ps1"
    . "$PSScriptRoot/contracts/definitions/task-result-contract.ps1"
    . "$PSScriptRoot/contracts/definitions/merge-result-contract.ps1"
    . "$PSScriptRoot/contracts/definitions/escalation-result-contract.ps1"
    . "$PSScriptRoot/contracts/definitions/review-fix-input-contract.ps1"
    . "$PSScriptRoot/contracts/definitions/state-transition-contract.ps1"
}

# =============================================================================
# Verdict contract — consumer: review gate expects verdict shape
# =============================================================================

Describe 'Consumer: Review Gate expects Verdict contract' -Tag 'Contract' {
    It 'accepts a pass verdict with no blockers' {
        $data = @{
            Verdict           = 'pass'
            Blockers          = @()
            Notes             = @()
            SelectedReviewers = @('security')
            ExcludedReviewers = @()
        }
        $result = Test-Contract -Schema $script:VerdictContract -Data $data
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'VerdictContract')
    }

    It 'accepts a fail verdict with blockers' {
        $data = @{
            Verdict           = 'fail'
            Blockers          = @(@{ Reviewer = 'sec'; Severity = 'high'; Description = 'XSS'; Files = @('a.ts'); Suggestion = 'Fix' })
            Notes             = @()
            SelectedReviewers = @('security')
            ExcludedReviewers = @()
        }
        $result = Test-Contract -Schema $script:VerdictContract -Data $data
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'VerdictContract')
    }

    It 'rejects verdict with missing Verdict field' {
        $data = @{ Blockers = @(); Notes = @(); SelectedReviewers = @(); ExcludedReviewers = @() }
        $result = Test-Contract -Schema $script:VerdictContract -Data $data
        $result.Valid | Should -BeFalse
        $result.Violations | Should -Contain "Missing required field 'Verdict'"
    }

    It 'rejects fail verdict with empty blockers (BDD cross-field)' {
        $data = @{
            Verdict           = 'fail'
            Blockers          = @()
            Notes             = @()
            SelectedReviewers = @('security')
            ExcludedReviewers = @()
        }
        $result = Test-Contract -Schema $script:VerdictContract -Data $data
        $result.Valid | Should -BeFalse
    }

    It 'rejects pass verdict with blockers (BDD cross-field)' {
        $data = @{
            Verdict           = 'pass'
            Blockers          = @(@{ Reviewer = 'sec'; Severity = 'high'; Description = 'XSS'; Files = @('a.ts'); Suggestion = 'Fix' })
            Notes             = @()
            SelectedReviewers = @('security')
            ExcludedReviewers = @()
        }
        $result = Test-Contract -Schema $script:VerdictContract -Data $data
        $result.Valid | Should -BeFalse
    }

    It 'rejects invalid verdict value' {
        $data = @{
            Verdict           = 'maybe'
            Blockers          = @()
            Notes             = @()
            SelectedReviewers = @('security')
            ExcludedReviewers = @()
        }
        $result = Test-Contract -Schema $script:VerdictContract -Data $data
        $result.Valid | Should -BeFalse
    }
}

# =============================================================================
# TaskResult contract — consumer: orchestrator expects TaskResult shape
# =============================================================================

Describe 'Consumer: Orchestrator expects TaskResult contract' -Tag 'Contract' {
    It 'accepts valid completed task result' {
        $data = @{
            TaskId   = 'T1'
            Phase    = 'done'
            Status   = 'completed'
            Counters = @{ redAttempts = 1 }
            Escalated = $false
        }
        $result = Test-Contract -Schema $script:TaskResultContract -Data $data
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'TaskResultContract')
    }

    It 'rejects invalid phase' {
        $data = @{
            TaskId   = 'T1'
            Phase    = 'invalid_phase'
            Status   = 'completed'
            Counters = @{}
            Escalated = $false
        }
        $result = Test-Contract -Schema $script:TaskResultContract -Data $data
        $result.Valid | Should -BeFalse
    }

    It 'rejects phase=done with status=running (cross-field)' {
        $data = @{
            TaskId   = 'T1'
            Phase    = 'done'
            Status   = 'running'
            Counters = @{}
            Escalated = $false
        }
        $result = Test-Contract -Schema $script:TaskResultContract -Data $data
        $result.Valid | Should -BeFalse
    }
}

# =============================================================================
# MergeResult contract
# =============================================================================

Describe 'Consumer: Pipeline expects MergeResult contract' -Tag 'Contract' {
    It 'accepts valid merge result' {
        $data = @{
            TaskId       = 'T1'
            Success      = $true
            Conflict     = $false
            RetryCount   = 0
            AbortedClean = $false
        }
        $result = Test-Contract -Schema $script:MergeResultContract -Data $data
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'MergeResultContract')
    }

    It 'rejects missing Success field' {
        $data = @{ TaskId = 'T1'; Conflict = $false; RetryCount = 0; AbortedClean = $false }
        $result = Test-Contract -Schema $script:MergeResultContract -Data $data
        $result.Valid | Should -BeFalse
    }
}

# =============================================================================
# EscalationResult contract
# =============================================================================

Describe 'Consumer: Escalation handler expects EscalationResult contract' -Tag 'Contract' {
    It 'accepts valid KeepGoing decision' {
        $data = @{ Decision = 'KeepGoing'; Source = 'task' }
        $result = Test-Contract -Schema $script:EscalationResultContract -Data $data
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'EscalationResultContract')
    }

    It 'accepts valid Stop decision with source' {
        $data = @{ Decision = 'Stop'; Source = 'task'; Reason = 'user chose stop' }
        $result = Test-Contract -Schema $script:EscalationResultContract -Data $data
        $result.Valid | Should -BeTrue
    }

    It 'rejects invalid decision' {
        $data = @{ Decision = 'Retry'; Source = 'task' }
        $result = Test-Contract -Schema $script:EscalationResultContract -Data $data
        $result.Valid | Should -BeFalse
    }
}

# =============================================================================
# ReviewFixInput contract
# =============================================================================

Describe 'Consumer: ReviewFixCycle expects ReviewFixInput contract' -Tag 'Contract' {
    It 'accepts valid fix input with blockers' {
        $data = @{
            Action   = 'reviewFix'
            Blockers = @(@{ Reviewer = 'sec'; Severity = 'high'; Description = 'XSS'; Files = @('a.ts'); Suggestion = 'Fix' })
        }
        $result = Test-Contract -Schema $script:ReviewFixInputContract -Data $data
        $result.Valid | Should -BeTrue -Because (Format-ContractViolation $result 'ReviewFixInputContract')
    }

    It 'rejects empty blockers (BDD cross-field)' {
        $data = @{ Action = 'reviewFix'; Blockers = @() }
        $result = Test-Contract -Schema $script:ReviewFixInputContract -Data $data
        $result.Valid | Should -BeFalse
    }
}

# =============================================================================
# State transition contracts
# =============================================================================

Describe 'Consumer: State transitions satisfy pre/post contracts' -Tag 'Contract' {
    BeforeAll {
        function Invoke-Claude { }
        function Write-PipelineLog { }
        function Write-StatusNote { }
        function Write-TaskLog { }
        function Read-Escalation { return @{ Decision = 'KeepGoing'; Source = 'task' } }

        . "$PSScriptRoot/helpers/test-config.ps1"
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
                reviewGateType     = 'none'
            }
        }
        . "$PSScriptRoot/../utils/review-verdict.ps1"
        . "$PSScriptRoot/../utils/review-gate.ps1"
        . "$PSScriptRoot/../utils/review-fix.ps1"

        # Re-define AFTER loading review-gate.ps1 (which dots read-escalation.ps1)
        function Read-Escalation { return @{ Decision = 'KeepGoing'; Source = 'task' } }
    }

    It 'Enter-ReviewGate:preMerge satisfies contract' {
        Mock Write-PipelineLog {}
        $cfg = Get-PipelineConfig
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder = 1
        $pre = $state.Clone()
        Enter-ReviewGate -State $state -Config $cfg -GateType 'preMerge'
        $result = Test-StateTransitionContract -TransitionName 'Enter-ReviewGate:preMerge' `
            -PreState $pre -PostState $state
        $result.Valid | Should -BeTrue -Because ($result.Violations -join '; ')
    }

    It 'Resolve-PreMergeVerdict:pass satisfies contract' {
        Mock Write-PipelineLog {}
        $cfg = Get-PipelineConfig
        $state = New-PipelineState
        $state.pipelineState = 'preMergeReview'
        $state.lockHolder = 1
        $state.reviewGateType = 'preMerge'
        $pre = $state.Clone()
        $verdict = [PSCustomObject]@{ Verdict = 'pass'; Blockers = @(); Notes = @(); SelectedReviewers = @(); ExcludedReviewers = @() }
        Resolve-PreMergeVerdict -State $state -Config $cfg -Verdict $verdict
        $result = Test-StateTransitionContract -TransitionName 'Resolve-PreMergeVerdict:pass' `
            -PreState $pre -PostState $state
        $result.Valid | Should -BeTrue -Because ($result.Violations -join '; ')
    }

    It 'Resolve-FinalMergeVerdict:pass satisfies contract' {
        Mock Write-PipelineLog {}
        $cfg = Get-PipelineConfig
        $state = New-PipelineState
        $state.pipelineState = 'finalReview'
        $state.lockHolder = 1
        $state.reviewGateType = 'final'
        $state.tasksDone = $cfg['NumTasks']
        $pre = $state.Clone()
        $verdict = [PSCustomObject]@{ Verdict = 'pass'; Blockers = @(); Notes = @(); SelectedReviewers = @(); ExcludedReviewers = @() }
        Resolve-FinalMergeVerdict -State $state -Config $cfg -Verdict $verdict
        $result = Test-StateTransitionContract -TransitionName 'Resolve-FinalMergeVerdict:pass' `
            -PreState $pre -PostState $state
        $result.Valid | Should -BeTrue -Because ($result.Violations -join '; ')
    }

    It 'Complete-ReviewFix:preMerge satisfies contract' {
        Mock Write-PipelineLog {}
        $cfg = Get-PipelineConfig
        $state = New-PipelineState
        $state.pipelineState = 'reviewFix'
        $state.lockHolder = 1
        $state.reviewGateType = 'preMerge'
        $pre = $state.Clone()
        Complete-ReviewFix -State $state -Config $cfg
        $result = Test-StateTransitionContract -TransitionName 'Complete-ReviewFix:preMerge' `
            -PreState $pre -PostState $state
        $result.Valid | Should -BeTrue -Because ($result.Violations -join '; ')
    }
}
