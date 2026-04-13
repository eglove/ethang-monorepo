Describe 'State Repository Module Manifest' {
    It 'manifest is valid' {
        $manifestPath = Join-Path $PSScriptRoot '../../../state/state-repository.psd1'
        { Test-ModuleManifest -Path $manifestPath } | Should -Not -Throw
    }

    It 'module can be imported' {
        $manifestPath = Join-Path $PSScriptRoot '../../../state/state-repository.psd1'
        { Import-Module $manifestPath -Force } | Should -Not -Throw
    }

    It 'exports expected core functions' {
        $manifestPath = Join-Path $PSScriptRoot '../../../state/state-repository.psd1'
        Import-Module $manifestPath -Force
        $exported = (Get-Module state-repository).ExportedFunctions.Keys
        $exported | Should -Contain 'Open-StateDatabase'
        $exported | Should -Contain 'Close-StateDatabase'
        $exported | Should -Contain 'Reset-StateDatabase'
        $exported | Should -Contain 'New-Feature'
        $exported | Should -Contain 'Get-Feature'
        $exported | Should -Contain 'Set-ActiveFeature'
        $exported | Should -Contain 'Get-ActiveFeature'
        $exported | Should -Contain 'Lock-PipelineState'
        $exported | Should -Contain 'Update-PipelineState'
        $exported | Should -Contain 'Set-TierStatus'
        $exported | Should -Contain 'Set-TaskResult'
        $exported | Should -Contain 'Set-MergeResult'
        $exported | Should -Contain 'Set-GateResult'
    }
}
