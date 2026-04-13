BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Task Results' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'sets a task result' {
        Set-TaskResult -FeatureName 'auth-flow' -TaskId 'T1' -Tier 1 -Status 'pass'
        $result = Get-TaskResult -FeatureName 'auth-flow' -TaskId 'T1'
        $result.status | Should -BeExactly 'pass'
        $result.tier | Should -Be 1
    }

    It 'upserts existing task' {
        Set-TaskResult -FeatureName 'auth-flow' -TaskId 'T1' -Tier 1 -Status 'running'
        Set-TaskResult -FeatureName 'auth-flow' -TaskId 'T1' -Tier 1 -Status 'pass'
        $result = Get-TaskResult -FeatureName 'auth-flow' -TaskId 'T1'
        $result.status | Should -BeExactly 'pass'
    }

    It 'returns all tasks in a tier' {
        Set-TaskResult -FeatureName 'auth-flow' -TaskId 'T1' -Tier 2 -Status 'pass'
        Set-TaskResult -FeatureName 'auth-flow' -TaskId 'T2' -Tier 2 -Status 'pass'
        Set-TaskResult -FeatureName 'auth-flow' -TaskId 'T3' -Tier 3 -Status 'running'
        $tier2 = @(Get-TierTaskResult -FeatureName 'auth-flow' -Tier 2)
        $tier2.Count | Should -Be 2
    }

    It 'returns null for nonexistent task' {
        $result = Get-TaskResult -FeatureName 'auth-flow' -TaskId 'ghost'
        $result | Should -BeNullOrEmpty
    }

    It 'stores counters_json and error' {
        Set-TaskResult -FeatureName 'auth-flow' -TaskId 'T1' -Tier 1 -Status 'fail' -CountersJson '{"red":3}' -ErrorMessage 'test failed'
        $result = Get-TaskResult -FeatureName 'auth-flow' -TaskId 'T1'
        $result.counters_json | Should -BeExactly '{"red":3}'
        $result.error | Should -BeExactly 'test failed'
    }
}
