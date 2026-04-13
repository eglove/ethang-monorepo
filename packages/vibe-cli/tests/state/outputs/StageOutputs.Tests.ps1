BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Stage Outputs' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'stores and retrieves a JSON output' {
        $json = '{"tiers": [1, 2, 3]}'
        Set-StageOutput -FeatureName 'auth-flow' -Stage 6 -OutputType 'implementation-plan' -JsonData $json
        $result = Get-StageOutput -FeatureName 'auth-flow' -OutputType 'implementation-plan'
        $result.tiers | Should -Be @(1, 2, 3)
    }

    It 'stores target root output' {
        Set-StageOutput -FeatureName 'auth-flow' -Stage 6 -OutputType 'target-root' -JsonData '{"root": "packages/auth"}'
        $result = Get-StageOutput -FeatureName 'auth-flow' -OutputType 'target-root'
        $result.root | Should -BeExactly 'packages/auth'
    }

    It 'overwrites existing output' {
        Set-StageOutput -FeatureName 'auth-flow' -Stage 6 -OutputType 'implementation-plan' -JsonData '{"v": 1}'
        Set-StageOutput -FeatureName 'auth-flow' -Stage 6 -OutputType 'implementation-plan' -JsonData '{"v": 2}'
        $result = Get-StageOutput -FeatureName 'auth-flow' -OutputType 'implementation-plan'
        $result.v | Should -Be 2
    }

    It 'returns null for nonexistent output' {
        $result = Get-StageOutput -FeatureName 'auth-flow' -OutputType 'debug-info'
        $result | Should -BeNullOrEmpty
    }

    It 'has created_at timestamp' {
        Set-StageOutput -FeatureName 'auth-flow' -Stage 3 -OutputType 'review-summary' -JsonData '{"ok": true}'
        $row = Invoke-SqliteQuery -DataSource $script:testDb -Query "SELECT created_at FROM stage_outputs WHERE feature_name = 'auth-flow' AND output_type = 'review-summary'"
        $row.created_at | Should -Not -BeNullOrEmpty
    }
}
