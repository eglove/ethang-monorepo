BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    . "$root/utils/pipeline-log.ps1"
    . "$root/utils/invoke-claude.ps1"
    . "$root/utils/invoke-parallel.ps1"
    . "$root/utils/resolve-pipeline-state.ps1"
    . "$root/utils/unified-debate-loop.ps1"
    . "$root/utils/debate-loop.ps1"
    . "$root/utils/gherkin-parser.ps1"
    . "$root/utils/fixture-gate.ps1"
    . "$root/utils/resume.ps1"
    . "$root/stages/1-elicitor.ps1"
    . "$root/stages/2-parallel-writers.ps1"
    . "$root/stages/3-unified-debate.ps1"
    . "$root/stages/4-post-debate.ps1"
    . "$root/stages/5-implementation-writer.ps1"
}

Describe 'Pipeline E2E (7-stage)' {
    BeforeEach {
        $testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "e2e-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
        $featureDir = Join-Path $testRoot 'docs/e2e-feature'
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null

        New-Item -ItemType Directory -Path "$testRoot/agents/doc-writers" -Force | Out-Null
        New-Item -ItemType Directory -Path "$testRoot/agents/experts" -Force | Out-Null
        Set-Content -Path "$testRoot/agents/doc-writers/elicitor.md" -Value '# Elicitor'
        Set-Content -Path "$testRoot/agents/doc-writers/bdd-writer.md" -Value '# BDD'
        Set-Content -Path "$testRoot/agents/doc-writers/tla-writer.md" -Value '# TLA'
        Set-Content -Path "$testRoot/agents/doc-writers/implementation-writer.md" -Value '# Impl'
        Set-Content -Path "$testRoot/agents/unified-debate-moderator.md" -Value '# Moderator'
        Set-Content -Path "$testRoot/agents/debate-moderator.md" -Value '# Debate'
    }

    AfterEach {
        Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    Context 'Artifact handoff chain' {
        It 'elicitor output flows into parallel writers' {
            Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Test briefing for e2e'

            Mock Invoke-Parallel {
                param($Jobs)
                $bddFile = Join-Path $featureDir 'bdd.feature'
                Set-Content -Path $bddFile -Value "Feature: E2E Test`n  Scenario: Basic`n    Given setup`n    When action`n    Then result"
                $tlaDir = Join-Path $featureDir 'tla'
                New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
                Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
                return @{
                    bdd = @{ Success = $true; Output = $bddFile; Error = $null }
                    tla = @{ Success = $true; Output = @{ TlaFile = (Get-Item "$tlaDir/Spec.tla"); TlaDir = $tlaDir }; Error = $null }
                }
            }

            $result = Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot

            $result.Success | Should -BeTrue
            (Join-Path $featureDir 'bdd.feature') | Should -Exist
            (Join-Path $featureDir 'tla/Spec.tla') | Should -Exist
        }

        It 'parallel writer output flows into unified debate' {
            Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
            Set-Content -Path (Join-Path $featureDir 'bdd.feature') -Value "Feature: test`n  Scenario: s1`n    Given g`n    When w`n    Then t"
            $tlaDir = Join-Path $featureDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'

            Mock Invoke-UnifiedDebateLoop {
                Set-Content -Path (Join-Path $FeatureDir 'unified-debate.md') -Value '# Debate'
                return @{
                    Result = 'CONSENSUS_REACHED'; RoundsCompleted = 1
                    FinalGherkinPath = (Join-Path $FeatureDir 'bdd.feature')
                    FinalTlaDir = (Join-Path $FeatureDir 'tla')
                    SessionFile = (Join-Path $FeatureDir 'unified-debate.md')
                    UnresolvedObjections = @()
                }
            }

            $result = Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot
            $result.Success | Should -BeTrue
            (Join-Path $featureDir 'unified-debate.md') | Should -Exist
        }

        It 'debate output flows into post-debate (fixture generated)' {
            Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
            Set-Content -Path (Join-Path $featureDir 'bdd.feature') -Value "Feature: test`n  Scenario: s1`n    Given g`n    When w`n    Then t"
            $tlaDir = Join-Path $featureDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
            Set-Content -Path (Join-Path $featureDir 'unified-debate.md') -Value '# Debate done'

            $result = Invoke-PostDebate -FeatureDir $featureDir -Root $testRoot -TargetRoot $testRoot
            $result.Success | Should -BeTrue
            $result.FixturePath | Should -Exist
        }
    }

    Context 'Resume at stage boundaries' {
        It 'resume at stage 3 validates bdd.feature and .tla exist' {
            Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
            Set-Content -Path (Join-Path $featureDir 'bdd.feature') -Value 'Feature: test'
            $tlaDir = Join-Path $featureDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE ----'

            $state = Resolve-PipelineState -FromStage 3 -Dir $featureDir
            $state.GherkinFile | Should -Not -BeNullOrEmpty
            $state.TlaFile | Should -Not -BeNullOrEmpty
        }

        It 'resume at stage 4 validates unified-debate.md exists' {
            Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
            Set-Content -Path (Join-Path $featureDir 'bdd.feature') -Value 'Feature: test'
            $tlaDir = Join-Path $featureDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE ----'
            Set-Content -Path (Join-Path $featureDir 'unified-debate.md') -Value '# Debate'

            $state = Resolve-PipelineState -FromStage 4 -Dir $featureDir
            $state.UnifiedDebateFile | Should -Not -BeNullOrEmpty
        }

        It 'resume at stage 5 validates fixture.json exists' {
            Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
            Set-Content -Path (Join-Path $featureDir 'bdd.feature') -Value 'Feature: test'
            $tlaDir = Join-Path $featureDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE ----'
            Set-Content -Path (Join-Path $featureDir 'unified-debate.md') -Value '# Debate'
            Set-Content -Path (Join-Path $featureDir 'bdd-fixture.json') -Value '{}'

            $state = Resolve-PipelineState -FromStage 5 -Dir $featureDir
            $state.FixtureJson | Should -Not -BeNullOrEmpty
        }
    }

    Context 'Inter-stage validation catches missing artifacts' {
        It 'stage 3 fails if bdd.feature is missing' {
            Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
            { Resolve-PipelineState -FromStage 3 -Dir $featureDir } | Should -Throw '*bdd.feature*'
        }
    }

    Context 'Full pipeline markers' {
        It 'stages produce STAGE_COMPLETE markers' {
            Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
            Write-PipelineLog -Message "STAGE_COMPLETE:1:e2e-feature" -Root $testRoot

            Mock Invoke-Parallel {
                $bddFile = Join-Path $featureDir 'bdd.feature'
                Set-Content -Path $bddFile -Value "Feature: test`n  Scenario: s`n    Given g`n    When w`n    Then t"
                $tlaDir = Join-Path $featureDir 'tla'
                New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
                Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE ----'
                return @{
                    bdd = @{ Success = $true; Output = $bddFile; Error = $null }
                    tla = @{ Success = $true; Output = @{ TlaFile = (Get-Item "$tlaDir/Spec.tla"); TlaDir = $tlaDir }; Error = $null }
                }
            }

            $s2 = Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot
            $s2.Success | Should -BeTrue

            $logContent = Get-Content (Join-Path $testRoot 'pipeline.log') -Raw
            $logContent | Should -Match 'STAGE_COMPLETE:1:e2e-feature'
            $logContent | Should -Match 'STAGE_COMPLETE:2:e2e-feature'
        }
    }

    Context 'Consensus revision failure (Amendment 5)' {
        It 'does not write STAGE_COMPLETE:3 on consensus revision failure' {
            Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
            Set-Content -Path (Join-Path $featureDir 'bdd.feature') -Value 'Feature: test'
            $tlaDir = Join-Path $featureDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE ----'

            Mock Invoke-UnifiedDebateLoop {
                Set-Content -Path (Join-Path $FeatureDir 'unified-debate.md') -Value '# Debate'
                return @{
                    Result = 'CONSENSUS_REVISION_FAILED'; RoundsCompleted = 1
                    FinalGherkinPath = (Join-Path $FeatureDir 'bdd.feature')
                    FinalTlaDir = (Join-Path $FeatureDir 'tla')
                    SessionFile = (Join-Path $FeatureDir 'unified-debate.md')
                    UnresolvedObjections = @(); Error = 'tla consensus revision failed'
                }
            }

            $result = Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot
            $result.Success | Should -BeFalse
            $logPath = Join-Path $testRoot 'pipeline.log'
            if (Test-Path $logPath) {
                Get-Content $logPath -Raw | Should -Not -Match 'STAGE_COMPLETE:3'
            }
        }
    }

    Context 'unified-debate.md on max-rounds exit (Amendment 6)' {
        It 'produces unified-debate.md after max-rounds' {
            Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
            Set-Content -Path (Join-Path $featureDir 'bdd.feature') -Value 'Feature: test'
            $tlaDir = Join-Path $featureDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE ----'

            Mock Invoke-UnifiedDebateLoop {
                Set-Content -Path (Join-Path $FeatureDir 'unified-debate.md') -Value '# Max rounds debate'
                return @{
                    Result = 'MAX_ROUNDS_REACHED'; RoundsCompleted = 10
                    FinalGherkinPath = (Join-Path $FeatureDir 'bdd.feature')
                    FinalTlaDir = (Join-Path $FeatureDir 'tla')
                    SessionFile = (Join-Path $FeatureDir 'unified-debate.md')
                    UnresolvedObjections = @('unresolved 1')
                }
            }

            Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot
            (Join-Path $featureDir 'unified-debate.md') | Should -Exist
        }
    }
}
