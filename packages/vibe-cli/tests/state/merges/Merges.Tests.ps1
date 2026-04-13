BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Merge Results' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'sets a merge result' {
        Set-MergeResult -FeatureName 'auth-flow' -TaskId 'T1' -Status 'merged'
        $results = @(Get-MergeResult -FeatureName 'auth-flow')
        $results.Count | Should -Be 1
        $results[0].status | Should -BeExactly 'merged'
    }

    It 'upserts existing merge' {
        Set-MergeResult -FeatureName 'auth-flow' -TaskId 'T1' -Status 'pending'
        Set-MergeResult -FeatureName 'auth-flow' -TaskId 'T1' -Status 'merged'
        $results = @(Get-MergeResult -FeatureName 'auth-flow')
        $results.Count | Should -Be 1
        $results[0].status | Should -BeExactly 'merged'
    }

    It 'tracks conflict flag' {
        Set-MergeResult -FeatureName 'auth-flow' -TaskId 'T1' -Status 'conflict' -Conflict 1
        $results = @(Get-MergeResult -FeatureName 'auth-flow')
        $results[0].conflict | Should -Be 1
    }

    It 'returns empty when none' {
        $results = Get-MergeResult -FeatureName 'auth-flow'
        $results | Should -BeNullOrEmpty
    }
}
