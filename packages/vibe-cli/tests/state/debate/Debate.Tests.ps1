BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Debate State' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'writes first debate round' {
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 1 -ConsensusStatus 'pending' -ModeratorJson '{"v":"test"}'
        $state = Get-DebateState -FeatureName 'auth-flow' -Stage 4
        $state.round | Should -Be 1
        $state.consensus_status | Should -BeExactly 'pending'
    }

    It 'advances a debate round' {
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 1 -ConsensusStatus 'pending'
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 2 -ConsensusStatus 'pending'
        $state = Get-DebateState -FeatureName 'auth-flow' -Stage 4
        $state.round | Should -Be 2
        $history = @(Get-DebateHistory -FeatureName 'auth-flow' -Stage 4)
        $history.Count | Should -Be 2
    }

    It 'culminates in consensus reached' {
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 1 -ConsensusStatus 'pending'
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 2 -ConsensusStatus 'pending'
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 3 -ConsensusStatus 'reached'
        $state = Get-DebateState -FeatureName 'auth-flow' -Stage 4
        $state.consensus_status | Should -BeExactly 'reached'
    }

    It 'returns history in order' {
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 1 -ConsensusStatus 'pending'
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 2 -ConsensusStatus 'pending'
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 3 -ConsensusStatus 'reached'
        $history = @(Get-DebateHistory -FeatureName 'auth-flow' -Stage 4)
        $history.Count | Should -Be 3
        $history[0].round | Should -Be 1
        $history[2].round | Should -Be 3
    }

    It 'returns null when no rounds exist' {
        $state = Get-DebateState -FeatureName 'auth-flow' -Stage 5
        $state | Should -BeNullOrEmpty
    }

    It 'stores moderator JSON' {
        $json = '{"verdict": "continue", "scores": [3, 4, 2]}'
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 1 -ConsensusStatus 'pending' -ModeratorJson $json
        $state = Get-DebateState -FeatureName 'auth-flow' -Stage 4
        $state.moderator_json | Should -Not -BeNullOrEmpty
    }

    It 'rejects debate on non-debate stage (stage 1)' {
        { Update-DebateState -FeatureName 'auth-flow' -Stage 1 -Round 1 -ConsensusStatus 'pending' } | Should -Throw '*does not support*'
    }

    It 'rejects debate on stage 7' {
        { Update-DebateState -FeatureName 'auth-flow' -Stage 7 -Round 1 -ConsensusStatus 'pending' } | Should -Throw '*does not support*'
    }

    It 'rejects round beyond MaxDebateRound' {
        1..5 | ForEach-Object { Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round $_ -ConsensusStatus 'pending' }
        { Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 6 -ConsensusStatus 'pending' } | Should -Throw '*exceeds*'
    }

    It 'rejects premature failure before MaxDebateRound' {
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 1 -ConsensusStatus 'pending'
        { Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 1 -ConsensusStatus 'failed' } | Should -Throw '*only be set to*'
    }

    It 'failure at MaxDebateRound halts feature' {
        Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE features SET status = 'running' WHERE name = 'auth-flow'"
        Update-PipelineState -FeatureName 'auth-flow' -PipelineState 'running'
        1..5 | ForEach-Object { Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round $_ -ConsensusStatus 'pending' }
        Update-DebateState -FeatureName 'auth-flow' -Stage 4 -Round 5 -ConsensusStatus 'failed'
        $f = Get-Feature -Name 'auth-flow'
        $f.status | Should -BeExactly 'halted'
    }
}
