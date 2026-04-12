BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    . "$root/utils/pipeline-log.ps1"
    . "$root/utils/invoke-claude.ps1"
    . "$root/utils/invoke-parallel.ps1"
    . "$root/utils/resolve-pipeline-state.ps1"
    . "$root/utils/unified-debate-loop.ps1"
    . "$root/stages/3-unified-debate.ps1"
}

Describe 'Invoke-UnifiedDebateStage (Stage 3)' {
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
    }

    AfterEach {
        Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Invoke-UnifiedDebateLoop (not Invoke-DebateLoop)' {
        Mock Invoke-UnifiedDebateLoop {
            Set-Content -Path (Join-Path $FeatureDir 'unified-debate.md') -Value '# Debate'
            return @{
                Result = 'CONSENSUS_REACHED'
                RoundsCompleted = 1
                FinalGherkinPath = (Join-Path $FeatureDir 'bdd.feature')
                FinalTlaDir = (Join-Path $FeatureDir 'tla')
                SessionFile = (Join-Path $FeatureDir 'unified-debate.md')
                UnresolvedObjections = @()
            }
        }

        $result = Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot

        Should -Invoke Invoke-UnifiedDebateLoop -Times 1
        $result.Success | Should -BeTrue
    }

    It 'writes STAGE_COMPLETE:3 on consensus success' {
        Mock Invoke-UnifiedDebateLoop {
            Set-Content -Path (Join-Path $FeatureDir 'unified-debate.md') -Value '# Debate'
            return @{
                Result = 'CONSENSUS_REACHED'
                RoundsCompleted = 1
                FinalGherkinPath = (Join-Path $FeatureDir 'bdd.feature')
                FinalTlaDir = (Join-Path $FeatureDir 'tla')
                SessionFile = (Join-Path $FeatureDir 'unified-debate.md')
                UnresolvedObjections = @()
            }
        }

        Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot

        $logPath = Join-Path $testRoot 'pipeline.log'
        $content = Get-Content $logPath -Raw
        $content | Should -Match 'STAGE_COMPLETE:3:test-feature'
    }

    It 'writes STAGE_COMPLETE:3 on max-rounds exit' {
        Mock Invoke-UnifiedDebateLoop {
            Set-Content -Path (Join-Path $FeatureDir 'unified-debate.md') -Value '# Debate'
            return @{
                Result = 'MAX_ROUNDS_REACHED'
                RoundsCompleted = 10
                FinalGherkinPath = (Join-Path $FeatureDir 'bdd.feature')
                FinalTlaDir = (Join-Path $FeatureDir 'tla')
                SessionFile = (Join-Path $FeatureDir 'unified-debate.md')
                UnresolvedObjections = @('objection 1')
            }
        }

        Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot

        $logPath = Join-Path $testRoot 'pipeline.log'
        $content = Get-Content $logPath -Raw
        $content | Should -Match 'STAGE_COMPLETE:3:test-feature'
    }

    It 'does NOT write STAGE_COMPLETE:3 on consensus revision failure (Amendment 5)' {
        Mock Invoke-UnifiedDebateLoop {
            Set-Content -Path (Join-Path $FeatureDir 'unified-debate.md') -Value '# Debate'
            return @{
                Result = 'CONSENSUS_REVISION_FAILED'
                RoundsCompleted = 1
                FinalGherkinPath = (Join-Path $FeatureDir 'bdd.feature')
                FinalTlaDir = (Join-Path $FeatureDir 'tla')
                SessionFile = (Join-Path $FeatureDir 'unified-debate.md')
                UnresolvedObjections = @()
                Error = 'tla consensus revision failed'
            }
        }

        $result = Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot

        $result.Success | Should -BeFalse
        $logPath = Join-Path $testRoot 'pipeline.log'
        if (Test-Path $logPath) {
            $content = Get-Content $logPath -Raw
            $content | Should -Not -Match 'STAGE_COMPLETE:3'
        }
    }

    It 'produces unified-debate.md on all exit paths' {
        Mock Invoke-UnifiedDebateLoop {
            Set-Content -Path (Join-Path $FeatureDir 'unified-debate.md') -Value '# Debate session'
            return @{
                Result = 'CONSENSUS_REACHED'
                RoundsCompleted = 1
                FinalGherkinPath = (Join-Path $FeatureDir 'bdd.feature')
                FinalTlaDir = (Join-Path $FeatureDir 'tla')
                SessionFile = (Join-Path $FeatureDir 'unified-debate.md')
                UnresolvedObjections = @()
            }
        }

        Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot

        (Join-Path $featureDir 'unified-debate.md') | Should -Exist
    }

    It 'delegates to unified-debate-loop which references unified-debate-moderator.md' {
        $loopContent = Get-Content "$root/utils/unified-debate-loop.ps1" -Raw
        $loopContent | Should -Match 'unified-debate-moderator\.md'
    }
}
