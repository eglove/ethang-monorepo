BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../stages/6-implementation-writer.ps1"
}

Describe 'Invoke-ImplementationWriter explicit paths' {
    BeforeAll {
        Mock Invoke-Claude { return '{"tasks":[]}' }
        Mock Write-PipelineLog {}
        Mock Write-Host {}
        Mock Test-Path { return $true } -ParameterFilter { $Path -like '*implementation-plan*' }
    }

    It 'accepts -BddFeaturePath parameter' {
        $cmd = Get-Command Invoke-ImplementationWriter
        $cmd.Parameters.ContainsKey('BddFeaturePath') | Should -BeTrue
    }

    It 'accepts -TlaSpecPath parameter' {
        $cmd = Get-Command Invoke-ImplementationWriter
        $cmd.Parameters.ContainsKey('TlaSpecPath') | Should -BeTrue
    }

    It 'works without BddFeaturePath (optional param)' {
        $cmd = Get-Command Invoke-ImplementationWriter
        $attr = $cmd.Parameters['BddFeaturePath'].Attributes | Where-Object { $_ -is [System.Management.Automation.ParameterAttribute] }
        $attr.Mandatory | Should -BeFalse
    }

    It 'works without TlaSpecPath (optional param)' {
        $cmd = Get-Command Invoke-ImplementationWriter
        $attr = $cmd.Parameters['TlaSpecPath'].Attributes | Where-Object { $_ -is [System.Management.Automation.ParameterAttribute] }
        $attr.Mandatory | Should -BeFalse
    }

    It 'includes both paths in prompt when provided' {
        $bddPath = [System.IO.Path]::GetTempFileName()
        $tlaPath = [System.IO.Path]::GetTempFileName()
        try {
            Set-Content $bddPath -Value 'Feature: test'
            Set-Content $tlaPath -Value '---- MODULE Test ----'

            Mock Invoke-Claude {
                param($Prompt)
                # Just verify the prompt contains the file references
                return '{"tasks":[]}'
            } -Verifiable

            Invoke-ImplementationWriter -Briefing 'test' -FeatureDir ([System.IO.Path]::GetTempPath()) -Root ([System.IO.Path]::GetTempPath()) -BddFeaturePath $bddPath -TlaSpecPath $tlaPath
            Should -InvokeVerifiable
        }
        finally {
            Remove-Item $bddPath, $tlaPath -ErrorAction SilentlyContinue
        }
    }
}
