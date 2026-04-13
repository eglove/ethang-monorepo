BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Pipeline Runtime State' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'updates verdict' {
        Update-PipelineState -FeatureName 'auth-flow' -Verdict 'approved'
        $ps = Get-PipelineState -FeatureName 'auth-flow'
        $ps.verdict | Should -BeExactly 'approved'
    }

    It 'updates multiple columns' {
        Update-PipelineState -FeatureName 'auth-flow' -ReviewRound 3 -Verdict 'needs-revision'
        $ps = Get-PipelineState -FeatureName 'auth-flow'
        $ps.review_round | Should -Be 3
        $ps.verdict | Should -BeExactly 'needs-revision'
    }

    It 'returns all columns' {
        Update-PipelineState -FeatureName 'auth-flow' -PipelineState 'running' -LockHolder 12345 -ReviewRound 2 -KeepGoingResets 1 -TddKeepGoingCount 0 -Verdict 'pending' -TasksDone 5 -ReviewGateType 'code-quality'
        $ps = Get-PipelineState -FeatureName 'auth-flow'
        $ps.pipeline_state | Should -BeExactly 'running'
        $ps.lock_holder | Should -Be 12345
        $ps.review_round | Should -Be 2
        $ps.keep_going_resets | Should -Be 1
        $ps.tasks_done | Should -Be 5
        $ps.review_gate_type | Should -BeExactly 'code-quality'
    }

    It 'returns null for no row' {
        $ps = Get-PipelineState -FeatureName 'ghost-feature'
        $ps | Should -BeNullOrEmpty
    }

    It 'preserves unmodified columns' {
        Update-PipelineState -FeatureName 'auth-flow' -ReviewRound 2 -Verdict 'pending'
        Update-PipelineState -FeatureName 'auth-flow' -Verdict 'approved'
        $ps = Get-PipelineState -FeatureName 'auth-flow'
        $ps.review_round | Should -Be 2
    }

    It 'syncs feature status' {
        Update-PipelineState -FeatureName 'auth-flow' -PipelineState 'halted' -FeatureStatus 'halted'
        $f = Get-Feature -Name 'auth-flow'
        $f.status | Should -BeExactly 'halted'
        $ps = Get-PipelineState -FeatureName 'auth-flow'
        $ps.pipeline_state | Should -BeExactly 'halted'
    }
}
