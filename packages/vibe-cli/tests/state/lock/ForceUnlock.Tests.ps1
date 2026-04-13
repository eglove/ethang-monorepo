BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'ForceUnlock performs HaltPipeline-style cleanup' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
        Set-ActiveFeature -Name 'auth-flow'
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'transitions running feature to halted and clears active feature' {
        Unlock-PipelineState -FeatureName 'auth-flow' -Force
        (Get-Feature -Name 'auth-flow').status | Should -BeExactly 'halted'
        (Get-PipelineState -FeatureName 'auth-flow').pipeline_state | Should -BeExactly 'halted'
        Get-PipelineLockState -FeatureName 'auth-flow' | Should -BeNullOrEmpty
        Get-ActiveFeature | Should -BeNullOrEmpty
    }

    It 'fails pending debates' {
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 1 -ConsensusStatus 'pending'
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 2 -ConsensusStatus 'pending'
        Unlock-PipelineState -FeatureName 'auth-flow' -Force
        $state = Get-DebateState -FeatureName 'auth-flow' -Stage 4
        $state.consensus_status | Should -BeExactly 'failed'
    }

    It 'fails running tier with tasks' {
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'running'
        Set-TaskResult -FeatureName 'auth-flow' -TaskId 'T1' -Tier 2 -Status 'pass'
        Unlock-PipelineState -FeatureName 'auth-flow' -Force
        (Get-TierProgress -FeatureName 'auth-flow' -Tier 2).status | Should -BeExactly 'failed'
    }

    It 'resets running tier without tasks to none' {
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'running'
        Unlock-PipelineState -FeatureName 'auth-flow' -Force
        (Get-TierProgress -FeatureName 'auth-flow' -Tier 2).status | Should -BeExactly 'none'
    }

    It 'resets pending tiers to none' {
        Set-TierStatus -FeatureName 'auth-flow' -Tier 1 -Status 'running'
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'pending'
        Set-TierStatus -FeatureName 'auth-flow' -Tier 3 -Status 'pending'
        Unlock-PipelineState -FeatureName 'auth-flow' -Force
        (Get-TierProgress -FeatureName 'auth-flow' -Tier 2).status | Should -BeExactly 'none'
        (Get-TierProgress -FeatureName 'auth-flow' -Tier 3).status | Should -BeExactly 'none'
    }

    It 'resets pending merges to none' {
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'running'
        Set-MergeResult -FeatureName 'auth-flow' -TaskId 'T1' -Status 'pending'
        Unlock-PipelineState -FeatureName 'auth-flow' -Force
        $merges = @(Get-MergeResult -FeatureName 'auth-flow')
        $merges[0].status | Should -BeExactly 'none'
    }

    It 'preserves passed tiers and completed merges' {
        Set-TierStatus -FeatureName 'auth-flow' -Tier 1 -Status 'passed'
        Set-MergeResult -FeatureName 'auth-flow' -TaskId 'tier1-merge' -Status 'merged'
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'running'
        Set-TaskResult -FeatureName 'auth-flow' -TaskId 'T1' -Tier 2 -Status 'pass'
        Set-MergeResult -FeatureName 'auth-flow' -TaskId 'tier2-merge' -Status 'pending'
        Set-TierStatus -FeatureName 'auth-flow' -Tier 3 -Status 'pending'

        Unlock-PipelineState -FeatureName 'auth-flow' -Force

        (Get-TierProgress -FeatureName 'auth-flow' -Tier 1).status | Should -BeExactly 'passed'
        $merges = @(Get-MergeResult -FeatureName 'auth-flow')
        ($merges | Where-Object { $_.task_id -eq 'tier1-merge' }).status | Should -BeExactly 'merged'
        (Get-TierProgress -FeatureName 'auth-flow' -Tier 2).status | Should -BeExactly 'failed'
        ($merges | Where-Object { $_.task_id -eq 'tier2-merge' }).status | Should -BeExactly 'none'
        (Get-TierProgress -FeatureName 'auth-flow' -Tier 3).status | Should -BeExactly 'none'
    }

    It 'deletes gate results' {
        Set-GateResult -FeatureName 'auth-flow' -GateType 'code-quality' -Status 'pass'
        Unlock-PipelineState -FeatureName 'auth-flow' -Force
        Get-GateResult -FeatureName 'auth-flow' -GateType 'code-quality' | Should -BeNullOrEmpty
    }

    It 'after ForceUnlock the pipeline cannot auto-resume' {
        Unlock-PipelineState -FeatureName 'auth-flow' -Force
        New-Feature -Name 'auth-flow-retry'
        Set-ActiveFeature -Name 'auth-flow-retry'
        # Original feature stays halted
        (Get-Feature -Name 'auth-flow').status | Should -BeExactly 'halted'
    }
}
