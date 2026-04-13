BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Gate Results' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'sets a gate result' {
        Set-GateResult -FeatureName 'auth-flow' -GateType 'code-quality' -Status 'pass' -Round 1 -VerdictJson '{"ok":true}'
        $result = Get-GateResult -FeatureName 'auth-flow' -GateType 'code-quality'
        $result.status | Should -BeExactly 'pass'
        $result.round | Should -Be 1
    }

    It 'returns latest gate result' {
        Set-GateResult -FeatureName 'auth-flow' -GateType 'code-quality' -Status 'fail' -Round 1
        Set-GateResult -FeatureName 'auth-flow' -GateType 'code-quality' -Status 'pass' -Round 2
        $result = Get-GateResult -FeatureName 'auth-flow' -GateType 'code-quality'
        $result.status | Should -BeExactly 'pass'
        $result.round | Should -Be 2
    }

    It 'returns all gate results for a type' {
        Set-GateResult -FeatureName 'auth-flow' -GateType 'code-quality' -Status 'fail' -Round 1
        Set-GateResult -FeatureName 'auth-flow' -GateType 'code-quality' -Status 'pass' -Round 2
        $results = @(Get-GateResults -FeatureName 'auth-flow' -GateType 'code-quality')
        $results.Count | Should -Be 2
    }

    It 'returns all gate results across types' {
        Set-GateResult -FeatureName 'auth-flow' -GateType 'code-quality' -Status 'pass'
        Set-GateResult -FeatureName 'auth-flow' -GateType 'test-coverage' -Status 'pass'
        $results = @(Get-GateResults -FeatureName 'auth-flow')
        $results.Count | Should -Be 2
    }

    It 'returns null for nonexistent gate' {
        $result = Get-GateResult -FeatureName 'auth-flow' -GateType 'nonexistent'
        $result | Should -BeNullOrEmpty
    }

    It 'stores verdict JSON' {
        Set-GateResult -FeatureName 'auth-flow' -GateType 'code-quality' -Status 'pass' -VerdictJson '{"score": 95}'
        $result = Get-GateResult -FeatureName 'auth-flow' -GateType 'code-quality'
        $result.verdict_json | Should -BeExactly '{"score": 95}'
    }
}
