BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../state/state-repository.psd1') -Force
}

Describe 'Halt Cascade Integration' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
        Set-ActiveFeature -Name 'auth-flow'
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'HaltPipeline sets feature halted, pipelineState halted' {
        Update-PipelineState -FeatureName 'auth-flow' -PipelineState 'halted' -FeatureStatus 'halted'
        (Get-Feature -Name 'auth-flow').status | Should -BeExactly 'halted'
        (Get-PipelineState -FeatureName 'auth-flow').pipeline_state | Should -BeExactly 'halted'
    }

    It 'ForceUnlock on feature with debate AND tiers performs full cleanup' {
        # Set up debates
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 1 -ConsensusStatus 'pending'
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 2 -ConsensusStatus 'pending'

        # Set up tiers
        Set-TierStatus -FeatureName 'auth-flow' -Tier 1 -Status 'passed'
        Set-MergeResult -FeatureName 'auth-flow' -TaskId 'tier1-merge' -Status 'merged'
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'running'
        Set-TaskResult -FeatureName 'auth-flow' -TaskId 'T1' -Tier 2 -Status 'pass'
        Set-MergeResult -FeatureName 'auth-flow' -TaskId 'tier2-merge' -Status 'pending'
        Set-TierStatus -FeatureName 'auth-flow' -Tier 3 -Status 'pending'

        # Set up gate
        Set-GateResult -FeatureName 'auth-flow' -GateType 'code-quality' -Status 'pass'

        # Force unlock
        Unlock-PipelineState -FeatureName 'auth-flow' -Force

        # Verify full cleanup
        (Get-Feature -Name 'auth-flow').status | Should -BeExactly 'halted'
        (Get-PipelineState -FeatureName 'auth-flow').pipeline_state | Should -BeExactly 'halted'
        Get-PipelineLockState -FeatureName 'auth-flow' | Should -BeNullOrEmpty

        # Debates failed
        (Get-DebateState -FeatureName 'auth-flow' -Stage 4).consensus_status | Should -BeExactly 'failed'

        # Tier 1 preserved
        (Get-TierProgress -FeatureName 'auth-flow' -Tier 1).status | Should -BeExactly 'passed'
        $merges = @(Get-MergeResult -FeatureName 'auth-flow')
        ($merges | Where-Object { $_.task_id -eq 'tier1-merge' }).status | Should -BeExactly 'merged'

        # Tier 2 failed, merge reset
        (Get-TierProgress -FeatureName 'auth-flow' -Tier 2).status | Should -BeExactly 'failed'
        ($merges | Where-Object { $_.task_id -eq 'tier2-merge' }).status | Should -BeExactly 'none'

        # Tier 3 reset
        (Get-TierProgress -FeatureName 'auth-flow' -Tier 3).status | Should -BeExactly 'none'

        # Session cleared
        Get-ActiveFeature | Should -BeNullOrEmpty

        # Gates deleted
        Get-GateResult -FeatureName 'auth-flow' -GateType 'code-quality' | Should -BeNullOrEmpty
    }

    It 'full crash recovery restores all invariants' {
        # Set up rich state
        1..6 | ForEach-Object { Set-StageComplete -FeatureName 'auth-flow' -Stage $_ }
        Set-TierStatus -FeatureName 'auth-flow' -Tier 1 -Status 'passed'
        Set-MergeResult -FeatureName 'auth-flow' -TaskId 'tier1-merge' -Status 'merged'
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'running'
        Set-TaskResult -FeatureName 'auth-flow' -TaskId 'T1' -Tier 2 -Status 'pass'
        Set-TaskResult -FeatureName 'auth-flow' -TaskId 'T2' -Tier 2 -Status 'pass'
        Set-MergeResult -FeatureName 'auth-flow' -TaskId 'tier2-merge' -Status 'merged'
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 1 -ConsensusStatus 'pending'
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 2 -ConsensusStatus 'reached'

        # Simulate crash: increment crash count, reset feature to idle, reset running tiers
        Add-CrashCount -FeatureName 'auth-flow'
        Update-PipelineState -FeatureName 'auth-flow' -PipelineState 'none' -FeatureStatus 'idle'
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'pending'
        Set-MergeResult -FeatureName 'auth-flow' -TaskId 'tier2-merge' -Status 'none'
        # Release lock
        Invoke-SqliteQuery -DataSource $script:testDb -Query "DELETE FROM pipeline_lock WHERE feature_name = 'auth-flow'"

        # Verify invariants
        $lock = Get-PipelineLockState -FeatureName 'auth-flow'
        $lock | Should -BeNullOrEmpty
        (Get-Feature -Name 'auth-flow').status | Should -BeExactly 'idle'
        (Get-PipelineState -FeatureName 'auth-flow').pipeline_state | Should -BeExactly 'none'
        (Get-TierProgress -FeatureName 'auth-flow' -Tier 1).status | Should -BeExactly 'passed'
        (Get-TierProgress -FeatureName 'auth-flow' -Tier 2).status | Should -BeExactly 'pending'
        $merges = @(Get-MergeResult -FeatureName 'auth-flow')
        ($merges | Where-Object { $_.task_id -eq 'tier1-merge' }).status | Should -BeExactly 'merged'
        ($merges | Where-Object { $_.task_id -eq 'tier2-merge' }).status | Should -BeExactly 'none'
        $tasks = @(Get-TierTaskResult -FeatureName 'auth-flow' -Tier 2)
        $tasks.Count | Should -Be 2
        Get-LastCompletedStage -FeatureName 'auth-flow' | Should -Be 6
        $history = @(Get-DebateHistory -FeatureName 'auth-flow' -Stage 4)
        $history.Count | Should -Be 2
    }
}
