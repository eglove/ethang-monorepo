# =============================================================================
# contract-alignment.Tests.ps1 — Drift detection between
# utils/result-contracts.ps1 ConvertTo-* functions and contract definitions.
# Ensures both accept/reject the same inputs.
# Tag: Contract
# =============================================================================

BeforeAll {
    function Invoke-Claude { }
    function Write-PipelineLog { }

    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/result-contracts.ps1"

    . "$PSScriptRoot/contracts/contract-engine.ps1"
    . "$PSScriptRoot/contracts/definitions/task-result-contract.ps1"
    . "$PSScriptRoot/contracts/definitions/merge-result-contract.ps1"
    . "$PSScriptRoot/contracts/definitions/escalation-result-contract.ps1"
}

# =============================================================================
# TaskResult alignment
# =============================================================================

Describe 'Alignment: ConvertTo-TaskResult vs TaskResultContract' -Tag 'Contract' {
    It 'both accept valid completed task' {
        $d = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }
        $convertResult = ConvertTo-TaskResult -Input_ $d
        $convertResult | Should -Not -BeNullOrEmpty
        $contractResult = Test-Contract -Schema $script:TaskResultContract -Data $d
        $contractResult.Valid | Should -BeTrue
    }

    It 'both accept valid running task' {
        $d = @{ TaskId = 'T2'; Phase = 'red'; Status = 'running'; Counters = @{ redAttempts = 1 }; Escalated = $false }
        $convertResult = ConvertTo-TaskResult -Input_ $d
        $convertResult | Should -Not -BeNullOrEmpty
        $contractResult = Test-Contract -Schema $script:TaskResultContract -Data $d
        $contractResult.Valid | Should -BeTrue
    }

    It 'both accept valid escalated task' {
        $d = @{ TaskId = 'T3'; Phase = 'cleanup'; Status = 'escalated'; Counters = @{}; Escalated = $true }
        $convertResult = ConvertTo-TaskResult -Input_ $d
        $convertResult | Should -Not -BeNullOrEmpty
        $contractResult = Test-Contract -Schema $script:TaskResultContract -Data $d
        $contractResult.Valid | Should -BeTrue
    }

    It 'both reject invalid phase' {
        $d = @{ TaskId = 'T1'; Phase = 'invalid'; Status = 'completed'; Counters = @{}; Escalated = $false }
        { ConvertTo-TaskResult -Input_ $d } | Should -Throw
        $contractResult = Test-Contract -Schema $script:TaskResultContract -Data $d
        $contractResult.Valid | Should -BeFalse
    }

    It 'both reject missing TaskId' {
        $d = @{ Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }
        { ConvertTo-TaskResult -Input_ $d } | Should -Throw
        $contractResult = Test-Contract -Schema $script:TaskResultContract -Data $d
        $contractResult.Valid | Should -BeFalse
    }

    It 'both reject invalid status' {
        $d = @{ TaskId = 'T1'; Phase = 'done'; Status = 'bogus'; Counters = @{}; Escalated = $false }
        { ConvertTo-TaskResult -Input_ $d } | Should -Throw
        $contractResult = Test-Contract -Schema $script:TaskResultContract -Data $d
        $contractResult.Valid | Should -BeFalse
    }
}

# =============================================================================
# MergeResult alignment
# =============================================================================

Describe 'Alignment: ConvertTo-MergeResult vs MergeResultContract' -Tag 'Contract' {
    It 'both accept valid success merge' {
        $d = @{ TaskId = 'T1'; Success = $true; Conflict = $false; RetryCount = 0; AbortedClean = $false }
        $convertResult = ConvertTo-MergeResult -Input_ $d
        $convertResult | Should -Not -BeNullOrEmpty
        $contractResult = Test-Contract -Schema $script:MergeResultContract -Data $d
        $contractResult.Valid | Should -BeTrue
    }

    It 'both accept valid conflict merge' {
        $d = @{ TaskId = 'T1'; Success = $false; Conflict = $true; RetryCount = 2; AbortedClean = $true }
        $convertResult = ConvertTo-MergeResult -Input_ $d
        $convertResult | Should -Not -BeNullOrEmpty
        $contractResult = Test-Contract -Schema $script:MergeResultContract -Data $d
        $contractResult.Valid | Should -BeTrue
    }

    It 'both reject missing TaskId' {
        $d = @{ Success = $true; Conflict = $false; RetryCount = 0; AbortedClean = $false }
        { ConvertTo-MergeResult -Input_ $d } | Should -Throw
        $contractResult = Test-Contract -Schema $script:MergeResultContract -Data $d
        $contractResult.Valid | Should -BeFalse
    }

    It 'both reject missing Success' {
        $d = @{ TaskId = 'T1'; Conflict = $false; RetryCount = 0; AbortedClean = $false }
        { ConvertTo-MergeResult -Input_ $d } | Should -Throw
        $contractResult = Test-Contract -Schema $script:MergeResultContract -Data $d
        $contractResult.Valid | Should -BeFalse
    }
}

# =============================================================================
# EscalationResult alignment
# =============================================================================

Describe 'Alignment: ConvertTo-EscalationResult vs EscalationResultContract' -Tag 'Contract' {
    It 'both accept KeepGoing from task' {
        $d = @{ Decision = 'KeepGoing'; Source = 'task' }
        $convertResult = ConvertTo-EscalationResult -Input_ $d
        $convertResult | Should -Not -BeNullOrEmpty
        $contractResult = Test-Contract -Schema $script:EscalationResultContract -Data $d
        $contractResult.Valid | Should -BeTrue
    }

    It 'both accept Stop from merge' {
        $d = @{ Decision = 'Stop'; Source = 'merge'; Reason = 'user abort' }
        $convertResult = ConvertTo-EscalationResult -Input_ $d
        $convertResult | Should -Not -BeNullOrEmpty
        $contractResult = Test-Contract -Schema $script:EscalationResultContract -Data $d
        $contractResult.Valid | Should -BeTrue
    }

    It 'both accept NoOp from final' {
        $d = @{ Decision = 'NoOp'; Source = 'final' }
        $convertResult = ConvertTo-EscalationResult -Input_ $d
        $convertResult | Should -Not -BeNullOrEmpty
        $contractResult = Test-Contract -Schema $script:EscalationResultContract -Data $d
        $contractResult.Valid | Should -BeTrue
    }

    It 'both reject invalid decision' {
        $d = @{ Decision = 'Retry'; Source = 'task' }
        { ConvertTo-EscalationResult -Input_ $d } | Should -Throw
        $contractResult = Test-Contract -Schema $script:EscalationResultContract -Data $d
        $contractResult.Valid | Should -BeFalse
    }

    It 'both reject invalid source' {
        $d = @{ Decision = 'KeepGoing'; Source = 'other' }
        { ConvertTo-EscalationResult -Input_ $d } | Should -Throw
        $contractResult = Test-Contract -Schema $script:EscalationResultContract -Data $d
        $contractResult.Valid | Should -BeFalse
    }
}
