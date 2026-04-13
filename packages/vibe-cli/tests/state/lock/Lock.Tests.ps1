BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Pipeline Lock' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
        Set-ActiveFeature -Name 'auth-flow'
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'acquires lock with PID' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        $lock = Get-PipelineLockState -FeatureName 'auth-flow'
        $lock | Should -Not -BeNullOrEmpty
        $lock.pid | Should -Be $PID
        $lock.locked_at | Should -Not -BeNullOrEmpty
    }

    It 'transitions feature to running on lock' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        $f = Get-Feature -Name 'auth-flow'
        $f.status | Should -BeExactly 'running'
    }

    It 'rejects lock when active feature does not match' {
        New-Feature -Name 'search-api'
        Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE session SET active_feature = 'search-api' WHERE id = 1"
        { Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID } | Should -Throw '*must match*'
    }

    It 'rejects concurrent lock' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        { Lock-PipelineState -FeatureName 'auth-flow' -ProcessId 99999 } | Should -Throw '*already held*'
    }

    It 'rejects lock on halted feature' {
        Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE features SET status = 'halted' WHERE name = 'auth-flow'"
        { Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID } | Should -Throw '*terminal*'
    }

    It 'returns null for no lock' {
        $lock = Get-PipelineLockState -FeatureName 'auth-flow'
        $lock | Should -BeNullOrEmpty
    }

    It 'increments crash count' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        Add-CrashCount -FeatureName 'auth-flow'
        $lock = Get-PipelineLockState -FeatureName 'auth-flow'
        $lock.crash_count | Should -Be 1
    }

    It 'increments crash count multiple times' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        Add-CrashCount -FeatureName 'auth-flow'
        Add-CrashCount -FeatureName 'auth-flow'
        Add-CrashCount -FeatureName 'auth-flow'
        $lock = Get-PipelineLockState -FeatureName 'auth-flow'
        $lock.crash_count | Should -Be 3
    }

    It 'unlocks on complete feature' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE features SET status = 'complete' WHERE name = 'auth-flow'"
        Unlock-PipelineState -FeatureName 'auth-flow'
        $lock = Get-PipelineLockState -FeatureName 'auth-flow'
        $lock | Should -BeNullOrEmpty
    }

    It 'rejects unlock on running without force' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        { Unlock-PipelineState -FeatureName 'auth-flow' } | Should -Throw '*terminal*'
    }

    It 'force unlock on running transitions to halted' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        Unlock-PipelineState -FeatureName 'auth-flow' -Force
        $f = Get-Feature -Name 'auth-flow'
        $f.status | Should -BeExactly 'halted'
        $lock = Get-PipelineLockState -FeatureName 'auth-flow'
        $lock | Should -BeNullOrEmpty
    }

    It 'force unlock clears active feature' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        Unlock-PipelineState -FeatureName 'auth-flow' -Force
        Get-ActiveFeature | Should -BeNullOrEmpty
    }

    It 'rejects unlock when no lock held' {
        { Unlock-PipelineState -FeatureName 'auth-flow' -Force } | Should -Throw '*No lock*'
    }
}
