BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-log.ps1"
    . "$PSScriptRoot/../utils/resolve-pipeline-state.ps1"
    . "$PSScriptRoot/../utils/debate-loop.ps1"
    . "$PSScriptRoot/../stages/6-implementation-debate.ps1"
}

Describe 'Invoke-ImplementationDebateStage (Stage 6)' {
    BeforeEach {
        $testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s6-test-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
        $featureDir = Join-Path $testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null

        # Create cumulative artifacts required through stage 6
        Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content -Path (Join-Path $featureDir 'bdd.feature') -Value "Feature: Test`n  Scenario: S1`n    Given x`n    When y`n    Then z"
        $tlaDir = Join-Path $featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content -Path (Join-Path $featureDir 'unified-debate.md') -Value '# Debate'
        Set-Content -Path (Join-Path $featureDir 'bdd-fixture.json') -Value '{"schemaVersion":1,"features":[]}'
        Set-Content -Path (Join-Path $featureDir 'implementation-plan.md') -Value '# Implementation Plan'
        Set-Content -Path (Join-Path $featureDir 'implementation-plan.json') -Value '{"tasks":[]}'

        Mock Invoke-DebateLoop {}
        Mock Write-Host {}
    }

    AfterEach {
        Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'writes STAGE_COMPLETE:6 marker on success' {
        $implFile = Join-Path $featureDir 'implementation-plan.md'
        $implJson = Join-Path $featureDir 'implementation-plan.json'
        $tlaFile = Join-Path $featureDir 'tla/Spec.tla'

        Invoke-ImplementationDebateStage -ImplFile $implFile -ImplJson $implJson -TlaFile $tlaFile -FeatureDir $featureDir -Root $testRoot

        $logPath = Join-Path $testRoot 'pipeline.log'
        $content = Get-Content $logPath -Raw
        $content | Should -Match 'STAGE_COMPLETE:6:test-feature'
    }

    It 'calls Invoke-DebateLoop with correct parameters' {
        $implFile = Join-Path $featureDir 'implementation-plan.md'
        $implJson = Join-Path $featureDir 'implementation-plan.json'
        $tlaFile = Join-Path $featureDir 'tla/Spec.tla'

        Invoke-ImplementationDebateStage -ImplFile $implFile -ImplJson $implJson -TlaFile $tlaFile -FeatureDir $featureDir -Root $testRoot

        Should -Invoke Invoke-DebateLoop -Times 1
    }

    It 'returns Success=$true on completion' {
        $implFile = Join-Path $featureDir 'implementation-plan.md'
        $implJson = Join-Path $featureDir 'implementation-plan.json'
        $tlaFile = Join-Path $featureDir 'tla/Spec.tla'

        $result = Invoke-ImplementationDebateStage -ImplFile $implFile -ImplJson $implJson -TlaFile $tlaFile -FeatureDir $featureDir -Root $testRoot

        $result.Success | Should -BeTrue
    }

    It 'returns Success=$false when validation fails (missing implementation-plan.md)' {
        Remove-Item (Join-Path $featureDir 'implementation-plan.md')

        $implFile = Join-Path $featureDir 'implementation-plan.md'
        $implJson = Join-Path $featureDir 'implementation-plan.json'
        $tlaFile = Join-Path $featureDir 'tla/Spec.tla'

        $result = Invoke-ImplementationDebateStage -ImplFile $implFile -ImplJson $implJson -TlaFile $tlaFile -FeatureDir $featureDir -Root $testRoot

        $result.Success | Should -BeFalse
    }

    It 'handles string TlaFile path' {
        $implFile = Join-Path $featureDir 'implementation-plan.md'
        $implJson = Join-Path $featureDir 'implementation-plan.json'
        $tlaFile = (Join-Path $featureDir 'tla/Spec.tla')

        $result = Invoke-ImplementationDebateStage -ImplFile $implFile -ImplJson $implJson -TlaFile $tlaFile -FeatureDir $featureDir -Root $testRoot

        $result.Success | Should -BeTrue
        Should -Invoke Invoke-DebateLoop -Times 1
    }
}
