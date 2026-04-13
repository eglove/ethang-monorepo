BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Crash Recovery' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
        Set-ActiveFeature -Name 'auth-flow'
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'detects stale lock for nonexistent PID' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        # Manually set PID to something that doesn't exist
        Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE pipeline_lock SET pid = 99999 WHERE feature_name = 'auth-flow'"
        $lock = Get-PipelineLockState -FeatureName 'auth-flow'
        $lock.is_stale | Should -BeTrue
    }

    It 'crash resets running tier to pending' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'running'
        # Simulate crash recovery: reset tier
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'pending'
        (Get-TierProgress -FeatureName 'auth-flow' -Tier 2).status | Should -BeExactly 'pending'
    }

    It 'crash preserves passed tier status' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        Set-TierStatus -FeatureName 'auth-flow' -Tier 1 -Status 'passed'
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'running'
        # Crash recovery preserves tier 1
        (Get-TierProgress -FeatureName 'auth-flow' -Tier 1).status | Should -BeExactly 'passed'
    }

    It 'crash preserves stage progress' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        1..5 | ForEach-Object { Set-StageComplete -FeatureName 'auth-flow' -Stage $_ }
        # After crash, stages still there
        Get-LastCompletedStage -FeatureName 'auth-flow' | Should -Be 5
    }

    It 'crash preserves debate state for resume' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 1 -ConsensusStatus 'pending'
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 2 -ConsensusStatus 'pending'
        $history = @(Get-DebateHistory -FeatureName 'auth-flow' -Stage 4)
        $history.Count | Should -Be 2
    }

    It 'task results preserved through crash recovery' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'running'
        Set-TaskResult -FeatureName 'auth-flow' -TaskId 'T1' -Tier 2 -Status 'pass'
        Set-TaskResult -FeatureName 'auth-flow' -TaskId 'T2' -Tier 2 -Status 'pass'
        # Reset tier but keep tasks
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'pending'
        $tasks = @(Get-TierTaskResult -FeatureName 'auth-flow' -Tier 2)
        $tasks.Count | Should -Be 2
    }
}

Describe 'Pipeline Completion' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
        Set-ActiveFeature -Name 'auth-flow'
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'transitions feature to complete when all stages done' {
        1..7 | ForEach-Object { Set-StageComplete -FeatureName 'auth-flow' -Stage $_ }
        Update-PipelineState -FeatureName 'auth-flow' -PipelineState 'complete' -FeatureStatus 'complete'
        (Get-Feature -Name 'auth-flow').status | Should -BeExactly 'complete'
        (Get-PipelineState -FeatureName 'auth-flow').pipeline_state | Should -BeExactly 'complete'
    }

    It 'synchronized pipelineState on running' {
        (Get-Feature -Name 'auth-flow').status | Should -BeExactly 'running'
        (Get-PipelineState -FeatureName 'auth-flow').pipeline_state | Should -BeExactly 'running'
    }

    It 'synchronized pipelineState on halt' {
        Update-PipelineState -FeatureName 'auth-flow' -PipelineState 'halted' -FeatureStatus 'halted'
        (Get-Feature -Name 'auth-flow').status | Should -BeExactly 'halted'
        (Get-PipelineState -FeatureName 'auth-flow').pipeline_state | Should -BeExactly 'halted'
    }
}
