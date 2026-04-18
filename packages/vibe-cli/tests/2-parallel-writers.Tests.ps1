BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    . "$root/utils/pipeline-log.ps1"
    . "$root/bus/router/send-bus-event.ps1"
    . "$root/bus/router/agent-lifecycle.ps1"
    . "$root/bus/router/wait-bus-group.ps1"
    . "$root/bus/schema/open-bus-database.ps1"
    . "$root/bus/infra/stage-feature-flag.ps1"
    . "$root/bus/domain/stage.ps1"
    . "$root/stages/2-parallel-writers.ps1"
}

Describe 'Invoke-ParallelWriter (Stage 2 — bus path)' {
    BeforeEach {
        $testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s2-test-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
        $featureDir = Join-Path $testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing for test feature'
        New-Item -ItemType Directory -Path "$testRoot/agents/doc-writers" -Force | Out-Null
        Set-Content -Path "$testRoot/agents/doc-writers/bdd-writer.md" -Value '# BDD Writer'
        Set-Content -Path "$testRoot/agents/doc-writers/tla-writer.md" -Value '# TLA Writer'

        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }
    }

    AfterEach {
        Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Start-BusAgent for bdd and tla writers' {
        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        Should -Invoke Start-BusAgent -ParameterFilter { $AgentId -match 'bdd' } -Times 1
        Should -Invoke Start-BusAgent -ParameterFilter { $AgentId -match 'tla' } -Times 1
    }

    It 'writes STAGE_COMPLETE:2 marker on success' {
        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        $logPath = Join-Path $testRoot 'pipeline.log'
        $logPath | Should -Exist
        $content = Get-Content $logPath -Raw
        $content | Should -Match 'STAGE_COMPLETE:2:test-feature'
    }

    It 'returns Success=$true on group completion' {
        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        $result = Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        $result.Success | Should -BeTrue
    }

    It 'returns result shape with Success, GherkinFile, TlaFile, TlaDir keys' {
        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        $result = Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        $result.ContainsKey('Success')     | Should -BeTrue
        $result.ContainsKey('GherkinFile') | Should -BeTrue
        $result.ContainsKey('TlaFile')     | Should -BeTrue
        $result.ContainsKey('TlaDir')      | Should -BeTrue
    }

    It 'throws when elicitor.md does not exist (#23)' {
        Remove-Item (Join-Path $featureDir 'elicitor.md') -ErrorAction SilentlyContinue

        { Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot } | Should -Throw '*Elicitor briefing not found*'
    }

    It 'returns GherkinFile path when bdd.feature exists' {
        $bddFile = Join-Path $featureDir 'bdd.feature'
        Set-Content -Path $bddFile -Value 'Feature: test'
        $tlaDir = Join-Path $featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'

        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        $result = Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        $result.GherkinFile | Should -Not -BeNullOrEmpty
    }

    It 'returns null GherkinFile when bdd.feature absent' {
        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        $result = Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        $result.GherkinFile | Should -BeNullOrEmpty
    }

    It 'calls New-BusGroup with ExpectedCount=2' {
        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        Should -Invoke New-BusGroup -ParameterFilter { $ExpectedCount -eq 2 } -Times 1
    }

    It 'calls Wait-BusGroup once' {
        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        Should -Invoke Wait-BusGroup -Times 1
    }
}
