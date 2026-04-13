Describe 'Module Loading' {
    It 'state-repository module loads without errors' {
        $manifestPath = Join-Path $PSScriptRoot '../../state/state-repository.psd1'
        { Import-Module $manifestPath -Force } | Should -Not -Throw
    }

    It 'all 35 exported functions are available' {
        $manifestPath = Join-Path $PSScriptRoot '../../state/state-repository.psd1'
        Import-Module $manifestPath -Force
        $exported = (Get-Module state-repository).ExportedFunctions.Keys

        $expected = @(
            'Open-StateDatabase', 'Close-StateDatabase', 'Reset-StateDatabase',
            'New-Feature', 'Get-Feature', 'Get-AllFeature',
            'Set-ActiveFeature', 'Get-ActiveFeature', 'Clear-ActiveFeature',
            'Set-StageComplete', 'Get-LastCompletedStage',
            'Register-Artifact', 'Get-Artifact',
            'Lock-PipelineState', 'Unlock-PipelineState', 'Get-PipelineLockState', 'Add-CrashCount',
            'Update-PipelineState', 'Get-PipelineState',
            'Set-StageOutput', 'Get-StageOutput',
            'Update-DebateState', 'Get-DebateState', 'Get-DebateHistory',
            'Set-TierStatus', 'Get-TierProgress', 'Get-AllTierProgress',
            'Set-TaskResult', 'Get-TaskResult', 'Get-TierTaskResult',
            'Set-MergeResult', 'Get-MergeResult',
            'Set-GateResult', 'Get-GateResult', 'Get-GateResults'
        )

        foreach ($fn in $expected) {
            $exported | Should -Contain $fn
        }
    }

    It 'schema.sql exists and is non-empty' {
        $schemaPath = Join-Path $PSScriptRoot '../../state/schema.sql'
        Test-Path $schemaPath | Should -BeTrue
        (Get-Content $schemaPath -Raw).Length | Should -BeGreaterThan 100
    }

    It 'vibe-state.db is gitignored' {
        $gitignorePath = Join-Path $PSScriptRoot '../../.gitignore'
        $content = Get-Content $gitignorePath -Raw
        $content | Should -Match 'vibe-state\.db'
    }
}
