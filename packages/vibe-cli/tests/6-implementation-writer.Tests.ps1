BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-log.ps1"
    . "$PSScriptRoot/../utils/resolve-pipeline-state.ps1"
    . "$PSScriptRoot/../stages/5-implementation-writer.ps1"
}

Describe 'Invoke-ImplementationWriterStage explicit paths' {
    BeforeAll {
        Mock Invoke-Claude { return '{"tasks":[]}' }
        Mock Write-PipelineLog {}
        Mock Write-Host {}
    }

    It 'accepts -BddFeaturePath parameter' {
        $cmd = Get-Command Invoke-ImplementationWriterStage
        $cmd.Parameters.ContainsKey('BddFeaturePath') | Should -BeTrue
    }

    It 'accepts -TlaSpecPath parameter' {
        $cmd = Get-Command Invoke-ImplementationWriterStage
        $cmd.Parameters.ContainsKey('TlaSpecPath') | Should -BeTrue
    }

    It 'works without BddFeaturePath (optional param)' {
        $cmd = Get-Command Invoke-ImplementationWriterStage
        $attr = $cmd.Parameters['BddFeaturePath'].Attributes | Where-Object { $_ -is [System.Management.Automation.ParameterAttribute] }
        $attr.Mandatory | Should -BeFalse
    }

    It 'works without TlaSpecPath (optional param)' {
        $cmd = Get-Command Invoke-ImplementationWriterStage
        $attr = $cmd.Parameters['TlaSpecPath'].Attributes | Where-Object { $_ -is [System.Management.Automation.ParameterAttribute] }
        $attr.Mandatory | Should -BeFalse
    }
}

Describe 'Invoke-ImplementationWriterStage execution' {
    BeforeEach {
        $testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s5-test-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
        $featureDir = Join-Path $testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null

        # Create cumulative artifacts required through stage 5
        Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content -Path (Join-Path $featureDir 'bdd.feature') -Value "Feature: Test`n  Scenario: S1`n    Given x`n    When y`n    Then z"
        $tlaDir = Join-Path $featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content -Path (Join-Path $featureDir 'unified-debate.md') -Value '# Debate'
        Set-Content -Path (Join-Path $featureDir 'bdd-fixture.json') -Value '{"schemaVersion":1,"features":[]}'

        Mock Write-Host {}
    }

    AfterEach {
        Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'writes STAGE_COMPLETE:5 marker and returns Success on happy path' {
        Mock Invoke-Claude {
            $implFile = Join-Path $featureDir 'implementation-plan.md'
            $implJson = Join-Path $featureDir 'implementation-plan.json'
            Set-Content -Path $implFile -Value '# Plan'
            Set-Content -Path $implJson -Value '{"tasks":[]}'
        }

        $bddPath = Join-Path $featureDir 'bdd.feature'
        $tlaPath = Join-Path $featureDir 'tla/Spec.tla'

        $result = Invoke-ImplementationWriterStage -FeatureDir $featureDir -Root $testRoot -BddFeaturePath $bddPath -TlaSpecPath $tlaPath

        $result.Success | Should -BeTrue
        $result.ImplFile | Should -BeLike '*implementation-plan.md'
        $result.ImplJson | Should -BeLike '*implementation-plan.json'

        $logContent = Get-Content (Join-Path $testRoot 'pipeline.log') -Raw
        $logContent | Should -Match 'STAGE_COMPLETE:5:test-feature'
    }

    It 'throws when Invoke-Claude does not produce implementation-plan.md' {
        Mock Invoke-Claude {}

        $bddPath = Join-Path $featureDir 'bdd.feature'

        { Invoke-ImplementationWriterStage -FeatureDir $featureDir -Root $testRoot -BddFeaturePath $bddPath } |
            Should -Throw '*did not produce*implementation-plan.md*'
    }

    It 'returns Success=$false when validation fails (missing elicitor.md)' {
        Remove-Item (Join-Path $featureDir 'elicitor.md')

        $result = Invoke-ImplementationWriterStage -FeatureDir $featureDir -Root $testRoot

        $result.Success | Should -BeFalse
    }

    It 'reads unified debate content when present' {
        Mock Invoke-Claude {
            Set-Content -Path (Join-Path $featureDir 'implementation-plan.md') -Value '# Plan'
            Set-Content -Path (Join-Path $featureDir 'implementation-plan.json') -Value '{"tasks":[]}'
        } -Verifiable

        $result = Invoke-ImplementationWriterStage -FeatureDir $featureDir -Root $testRoot

        $result.Success | Should -BeTrue
        Should -InvokeVerifiable
    }
}
