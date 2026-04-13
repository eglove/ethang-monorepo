BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../state/state-repository.psd1') -Force
}

Describe 'Invalid Transition Matrix' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
        Set-ActiveFeature -Name 'auth-flow'
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'cannot lock a completed feature' {
        Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE features SET status = 'complete' WHERE name = 'auth-flow'"
        { Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID } | Should -Throw '*terminal*'
    }

    It 'cannot lock a halted feature' {
        Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE features SET status = 'halted' WHERE name = 'auth-flow'"
        { Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID } | Should -Throw '*terminal*'
    }

    It 'cannot set active feature when current is running' {
        New-Feature -Name 'other'
        Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE features SET status = 'running' WHERE name = 'auth-flow'"
        { Set-ActiveFeature -Name 'other' } | Should -Throw '*terminal*'
    }

    It 'cannot clear active feature when feature is running' {
        Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE features SET status = 'running' WHERE name = 'auth-flow'"
        { Clear-ActiveFeature } | Should -Throw '*terminal*'
    }

    It 'cannot clear active feature when feature is idle' {
        { Clear-ActiveFeature } | Should -Throw '*terminal*'
    }

    It 'cannot unlock running feature without force' {
        Lock-PipelineState -FeatureName 'auth-flow' -ProcessId $PID
        { Unlock-PipelineState -FeatureName 'auth-flow' } | Should -Throw '*terminal*'
    }

    It 'cannot skip stages (sequential enforcement)' {
        Set-StageComplete -FeatureName 'auth-flow' -Stage 1
        { Set-StageComplete -FeatureName 'auth-flow' -Stage 3 } | Should -Throw '*not the next sequential*'
    }

    It 'cannot complete stage below last completed' {
        Set-StageComplete -FeatureName 'auth-flow' -Stage 1
        Set-StageComplete -FeatureName 'auth-flow' -Stage 2
        Set-StageComplete -FeatureName 'auth-flow' -Stage 3
        { Set-StageComplete -FeatureName 'auth-flow' -Stage 1 } | Should -Throw '*below*'
    }

    It 'cannot create debate round on non-debate stage' {
        { Update-DebateState -FeatureName 'auth-flow' -Stage 2 -Round 1 -ConsensusStatus 'pending' } | Should -Throw '*does not support*'
    }

    It 'cannot exceed MaxDebateRound' {
        1..5 | ForEach-Object { Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round $_ -ConsensusStatus 'pending' }
        { Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 6 -ConsensusStatus 'pending' } | Should -Throw '*exceeds*'
    }

    It 'duplicate feature name rejected' {
        { New-Feature -Name 'auth-flow' } | Should -Throw '*already exists*'
    }

    It 'repository calls fail when database not open' {
        & (Get-Module state-repository) { $script:StateDbPath = $null }
        { New-Feature -Name 'test' } | Should -Throw '*not open*'
    }
}
