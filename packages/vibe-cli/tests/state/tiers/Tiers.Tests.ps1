BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Tier Progress' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'initializes tier to pending' {
        Set-TierStatus -FeatureName 'auth-flow' -Tier 1 -Status 'pending'
        $tp = Get-TierProgress -FeatureName 'auth-flow' -Tier 1
        $tp.status | Should -BeExactly 'pending'
    }

    It 'transitions tier to running' {
        Set-TierStatus -FeatureName 'auth-flow' -Tier 1 -Status 'pending'
        Set-TierStatus -FeatureName 'auth-flow' -Tier 1 -Status 'running'
        $tp = Get-TierProgress -FeatureName 'auth-flow' -Tier 1
        $tp.status | Should -BeExactly 'running'
    }

    It 'marks tier as passed with completed_at' {
        Set-TierStatus -FeatureName 'auth-flow' -Tier 1 -Status 'passed'
        $tp = Get-TierProgress -FeatureName 'auth-flow' -Tier 1
        $tp.status | Should -BeExactly 'passed'
        $tp.completed_at | Should -Not -BeNullOrEmpty
    }

    It 'marks tier as failed' {
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'failed'
        $tp = Get-TierProgress -FeatureName 'auth-flow' -Tier 2
        $tp.status | Should -BeExactly 'failed'
    }

    It 'returns null for nonexistent tier' {
        $tp = Get-TierProgress -FeatureName 'auth-flow' -Tier 99
        $tp | Should -BeNullOrEmpty
    }

    It 'returns all tier progress' {
        Set-TierStatus -FeatureName 'auth-flow' -Tier 1 -Status 'passed'
        Set-TierStatus -FeatureName 'auth-flow' -Tier 2 -Status 'running'
        Set-TierStatus -FeatureName 'auth-flow' -Tier 3 -Status 'pending'
        $all = @(Get-AllTierProgress -FeatureName 'auth-flow')
        $all.Count | Should -Be 3
        $all[0].tier | Should -Be 1
        $all[0].status | Should -BeExactly 'passed'
    }
}
