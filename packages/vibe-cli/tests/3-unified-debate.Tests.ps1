BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    . "$root/utils/pipeline-log.ps1"
    . "$root/utils/invoke-claude.ps1"
    . "$root/utils/resolve-pipeline-state.ps1"
    . "$root/bus/router/send-bus-event.ps1"
    . "$root/bus/router/agent-lifecycle.ps1"
    . "$root/bus/router/wait-bus-group.ps1"
    . "$root/bus/schema/open-bus-database.ps1"
    . "$root/bus/infra/stage-feature-flag.ps1"
    . "$root/bus/domain/stage.ps1"
    . "$root/stages/3-unified-debate.ps1"
}

Describe 'Invoke-UnifiedDebateStage (Stage 3 — bus path)' {
    BeforeEach {
        $testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s3-test-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
        $featureDir = Join-Path $testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content -Path (Join-Path $featureDir 'bdd.feature') -Value 'Feature: test'
        $tlaDir = Join-Path $featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        New-Item -ItemType Directory -Path "$testRoot/agents" -Force | Out-Null
        Set-Content -Path "$testRoot/agents/unified-debate-moderator.md" -Value '# Moderator'
        New-Item -ItemType Directory -Path "$testRoot/agents/doc-writers" -Force | Out-Null
        Set-Content -Path "$testRoot/agents/doc-writers/bdd-writer.md" -Value '# BDD'
        Set-Content -Path "$testRoot/agents/doc-writers/tla-writer.md" -Value '# TLA'

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

    It 'calls Start-BusAgent with unified-moderator agent id' {
        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        Should -Invoke Start-BusAgent -ParameterFilter { $AgentId -match 'unified-moderator' } -Times 1
    }

    It 'writes STAGE_COMPLETE:3 on bus dispatch' {
        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        $logPath = Join-Path $testRoot 'pipeline.log'
        $content = Get-Content $logPath -Raw
        $content | Should -Match 'STAGE_COMPLETE:3:test-feature'
    }

    It 'returns Success=$true on bus dispatch' {
        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        $result = Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        $result.Success | Should -BeTrue
    }

    It 'returns result with Success and Result keys' {
        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        $result = Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        $result.ContainsKey('Success') | Should -BeTrue
        $result.ContainsKey('Result')  | Should -BeTrue
    }

    It 'calls New-BusGroup with ExpectedCount=1' {
        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        Should -Invoke New-BusGroup -ParameterFilter { $ExpectedCount -eq 1 } -Times 1
    }

    It 'calls Wait-BusGroup once' {
        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        Should -Invoke Wait-BusGroup -Times 1
    }

    It 'emits stage_started event' {
        $script:_s3Captured = [System.Collections.Generic.List[hashtable]]::new()
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_s3Captured.Add($Event)
        }

        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        $started = $script:_s3Captured | Where-Object { $_.EventType -eq 'stage_started' }
        $started | Should -Not -BeNullOrEmpty
    }

    It 'emits stage_completed event' {
        $script:_s3CapturedC = [System.Collections.Generic.List[hashtable]]::new()
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_s3CapturedC.Add($Event)
        }

        $dbPath = Join-Path $testRoot 'vibe-bus.db'
        Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot -DbPath $dbPath

        $completed = $script:_s3CapturedC | Where-Object { $_.EventType -eq 'stage_completed' }
        $completed | Should -Not -BeNullOrEmpty
    }
}
