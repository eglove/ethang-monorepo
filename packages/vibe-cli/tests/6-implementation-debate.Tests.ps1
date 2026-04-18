BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
    . "$PSScriptRoot/../utils/pipeline-log.ps1"
    . "$PSScriptRoot/../utils/resolve-pipeline-state.ps1"
    . "$PSScriptRoot/../bus/router/send-bus-event.ps1"
    . "$PSScriptRoot/../bus/router/agent-lifecycle.ps1"
    . "$PSScriptRoot/../bus/router/wait-bus-group.ps1"
    . "$PSScriptRoot/../bus/schema/open-bus-database.ps1"
    . "$PSScriptRoot/../bus/infra/stage-feature-flag.ps1"
    . "$PSScriptRoot/../bus/domain/stage.ps1"
    . "$PSScriptRoot/../stages/6-implementation-debate.ps1"
}

Describe 'Invoke-ImplementationDebateStage (Stage 6 — bus path)' {
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

        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }
        Mock Write-Host {}
    }

    AfterEach {
        Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'writes STAGE_COMPLETE:6 marker on success' {
        $implFile = Join-Path $featureDir 'implementation-plan.md'
        $implJson = Join-Path $featureDir 'implementation-plan.json'
        $tlaFile = Join-Path $featureDir 'tla/Spec.tla'
        $dbPath = Join-Path $testRoot 'vibe-bus.db'

        Invoke-ImplementationDebateStage -ImplFile $implFile -ImplJson $implJson -TlaFile $tlaFile -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        $logPath = Join-Path $testRoot 'pipeline.log'
        $content = Get-Content $logPath -Raw
        $content | Should -Match 'STAGE_COMPLETE:6:test-feature'
    }

    It 'calls Start-BusAgent for moderator' {
        $implFile = Join-Path $featureDir 'implementation-plan.md'
        $implJson = Join-Path $featureDir 'implementation-plan.json'
        $tlaFile = Join-Path $featureDir 'tla/Spec.tla'
        $dbPath = Join-Path $testRoot 'vibe-bus.db'

        Invoke-ImplementationDebateStage -ImplFile $implFile -ImplJson $implJson -TlaFile $tlaFile -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        Should -Invoke Start-BusAgent -ParameterFilter { $AgentId -match 'impl-debate' } -Times 1
    }

    It 'returns Success=$true on completion' {
        $implFile = Join-Path $featureDir 'implementation-plan.md'
        $implJson = Join-Path $featureDir 'implementation-plan.json'
        $tlaFile = Join-Path $featureDir 'tla/Spec.tla'
        $dbPath = Join-Path $testRoot 'vibe-bus.db'

        $result = Invoke-ImplementationDebateStage -ImplFile $implFile -ImplJson $implJson -TlaFile $tlaFile -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        $result.Success | Should -BeTrue
    }

    It 'returns Success=$false when TlaFile is missing' {
        $implFile = Join-Path $featureDir 'implementation-plan.md'
        $implJson = Join-Path $featureDir 'implementation-plan.json'

        $result = Invoke-ImplementationDebateStage -ImplFile $implFile -ImplJson $implJson -FeatureDir $featureDir -Root $testRoot

        $result.Success | Should -BeFalse
        $result.Error | Should -Match 'TlaFile is required'
    }

    It 'calls Wait-BusGroup once' {
        $implFile = Join-Path $featureDir 'implementation-plan.md'
        $implJson = Join-Path $featureDir 'implementation-plan.json'
        $tlaFile = Join-Path $featureDir 'tla/Spec.tla'
        $dbPath = Join-Path $testRoot 'vibe-bus.db'

        Invoke-ImplementationDebateStage -ImplFile $implFile -ImplJson $implJson -TlaFile $tlaFile -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        Should -Invoke Wait-BusGroup -Times 1
    }
}
