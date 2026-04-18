BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    . "$root/utils/pipeline-log.ps1"
    . "$root/utils/invoke-claude.ps1"
    . "$root/utils/invoke-parallel.ps1"
    . "$root/utils/unified-debate-loop.ps1"

    function Update-DebateState { [CmdletBinding()] param([string]$FeatureName, [int]$Stage, [int]$Round, [string]$ConsensusStatus, [int]$MaxDebateRound = 10) }
    Mock Update-DebateState {}
}

Describe 'Invoke-UnifiedDebateLoop' {
    BeforeEach {
        $testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "udl-test-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
        $featureDir = Join-Path $testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $featureDir 'bdd.feature') -Value 'Feature: test'
        $tlaDir = Join-Path $featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        New-Item -ItemType Directory -Path "$testRoot/agents" -Force | Out-Null
        Set-Content -Path "$testRoot/agents/unified-debate-moderator.md" -Value '# Moderator'
        New-Item -ItemType Directory -Path "$testRoot/agents/doc-writers" -Force | Out-Null
        Set-Content -Path "$testRoot/agents/doc-writers/bdd-writer.md" -Value '# BDD Writer'
        Set-Content -Path "$testRoot/agents/doc-writers/tla-writer.md" -Value '# TLA Writer'
    }

    AfterEach {
        Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    Context 'Consensus path' {
        It 'returns CONSENSUS_REACHED when moderator finds no objections' {
            Mock Invoke-Claude {
                return '{"result":"CONSENSUS_REACHED","objections":[],"experts":["expert-bdd"],"recommendation":{"bdd":"looks good","tla":"looks good"},"sessionFile":"unified-debate.md"}'
            }
            # Mock the revision calls too (for consensus recommendations)
            Mock Invoke-Parallel {
                return @{
                    bdd = @{ Success = $true; Output = $null; Error = $null }
                    tla = @{ Success = $true; Output = $null; Error = $null }
                }
            }

            $result = Invoke-UnifiedDebateLoop `
                -GherkinFile (Join-Path $featureDir 'bdd.feature') `
                -TlaDir $tlaDir `
                -FeatureDir $featureDir `
                -Root $testRoot `
                -MaxRounds 3

            $result.Result | Should -Be 'CONSENSUS_REACHED'
            $result.UnresolvedObjections | Should -HaveCount 0
            (Join-Path $featureDir 'unified-debate.md') | Should -Exist
        }
    }

    Context 'Partial consensus with single-writer objections' {
        It 'routes BDD-only objections to BDD writer only' {
            $callCount = 0
            Mock Invoke-Claude {
                $script:callCount++
                if ($script:callCount -eq 1) {
                    return '{"result":"PARTIAL_CONSENSUS","objections":[{"target":"bdd","objection":"missing edge case"}],"experts":["expert-bdd"],"recommendation":{"bdd":"","tla":""},"sessionFile":"unified-debate.md"}'
                }
                # Round 2 — consensus
                return '{"result":"CONSENSUS_REACHED","objections":[],"experts":["expert-bdd"],"recommendation":{"bdd":"final fix","tla":"final fix"},"sessionFile":"unified-debate.md"}'
            }

            Mock Invoke-Parallel {
                param($Jobs)
                $result = @{}
                foreach ($key in $Jobs.Keys) {
                    $result[$key] = @{ Success = $true; Output = $null; Error = $null }
                }
                return $result
            }

            $result = Invoke-UnifiedDebateLoop `
                -GherkinFile (Join-Path $featureDir 'bdd.feature') `
                -TlaDir $tlaDir `
                -FeatureDir $featureDir `
                -Root $testRoot `
                -MaxRounds 10

            $result.Result | Should -Be 'CONSENSUS_REACHED'
            $result.RoundsCompleted | Should -BeGreaterOrEqual 2
        }
    }

    Context 'Max rounds exit' {
        It 'exits with MAX_ROUNDS_REACHED and writes unified-debate.md' {
            Mock Invoke-Claude {
                return '{"result":"PARTIAL_CONSENSUS","objections":[{"target":"bdd","objection":"still bad"}],"experts":["expert-bdd"],"recommendation":{"bdd":"","tla":""},"sessionFile":"unified-debate.md"}'
            }
            Mock Invoke-Parallel {
                param($Jobs)
                $result = @{}
                foreach ($key in $Jobs.Keys) {
                    $result[$key] = @{ Success = $true; Output = $null; Error = $null }
                }
                return $result
            }

            $result = Invoke-UnifiedDebateLoop `
                -GherkinFile (Join-Path $featureDir 'bdd.feature') `
                -TlaDir $tlaDir `
                -FeatureDir $featureDir `
                -Root $testRoot `
                -MaxRounds 2

            $result.Result | Should -Be 'MAX_ROUNDS_REACHED'
            $result.UnresolvedObjections | Should -Not -BeNullOrEmpty
            (Join-Path $featureDir 'unified-debate.md') | Should -Exist
        }
    }

    Context 'Revision failure' {
        It 'exits with error when a revision fails' {
            Mock Invoke-Claude {
                return '{"result":"PARTIAL_CONSENSUS","objections":[{"target":"bdd","objection":"fix it"}],"experts":["expert-bdd"],"recommendation":{"bdd":"","tla":""},"sessionFile":"unified-debate.md"}'
            }
            Mock Invoke-Parallel {
                return @{
                    bdd = @{ Success = $false; Output = $null; Error = "revision crashed" }
                }
            }

            $result = Invoke-UnifiedDebateLoop `
                -GherkinFile (Join-Path $featureDir 'bdd.feature') `
                -TlaDir $tlaDir `
                -FeatureDir $featureDir `
                -Root $testRoot `
                -MaxRounds 3

            $result.Result | Should -Be 'REVISION_FAILED'
            $result.Error | Should -Match 'revision'
        }
    }

    Context 'Consensus revision failure (Amendment 5)' {
        It 'returns CONSENSUS_REVISION_FAILED when one consensus revision fails' {
            Mock Invoke-Claude {
                return '{"result":"CONSENSUS_REACHED","objections":[],"experts":["expert-bdd"],"recommendation":{"bdd":"improve this","tla":"improve that"},"sessionFile":"unified-debate.md"}'
            }
            Mock Invoke-Parallel {
                return @{
                    bdd = @{ Success = $true; Output = $null; Error = $null }
                    tla = @{ Success = $false; Output = $null; Error = "tla revision failed" }
                }
            }

            $result = Invoke-UnifiedDebateLoop `
                -GherkinFile (Join-Path $featureDir 'bdd.feature') `
                -TlaDir $tlaDir `
                -FeatureDir $featureDir `
                -Root $testRoot `
                -MaxRounds 3

            $result.Result | Should -Be 'CONSENSUS_REVISION_FAILED'
            $result.Error | Should -Match 'tla'
            # unified-debate.md should still be written
            (Join-Path $featureDir 'unified-debate.md') | Should -Exist
        }
    }

    Context 'S12: Consensus revision targets all writers' {
        It 'dispatches revisions to both writers at consensus' {
            Mock Invoke-Claude {
                return '{"result":"CONSENSUS_REACHED","objections":[],"experts":["expert-bdd"],"recommendation":{"bdd":"fix bdd","tla":"fix tla"},"sessionFile":"unified-debate.md"}'
            }

            $capturedJobs = $null
            Mock Invoke-Parallel {
                param($Jobs)
                $script:capturedJobs = $Jobs
                $result = @{}
                foreach ($key in $Jobs.Keys) {
                    $result[$key] = @{ Success = $true; Output = $null; Error = $null }
                }
                return $result
            }

            Invoke-UnifiedDebateLoop `
                -GherkinFile (Join-Path $featureDir 'bdd.feature') `
                -TlaDir $tlaDir `
                -FeatureDir $featureDir `
                -Root $testRoot `
                -MaxRounds 3

            # Both writers should be in the consensus revision dispatch
            $script:capturedJobs.Keys | Should -Contain 'bdd'
            $script:capturedJobs.Keys | Should -Contain 'tla'
        }
    }

    Context 'Malformed moderator JSON (#8, #13)' {
        It 'returns ALL_ROUNDS_FAILED when moderator returns invalid JSON every round' {
            Mock Invoke-Claude { return 'not valid json at all' }
            Mock Invoke-Parallel {
                param($Jobs)
                $result = @{}
                foreach ($key in $Jobs.Keys) {
                    $result[$key] = @{ Success = $true; Output = $null; Error = $null }
                }
                return $result
            }

            $result = Invoke-UnifiedDebateLoop `
                -GherkinFile (Join-Path $featureDir 'bdd.feature') `
                -TlaDir $tlaDir `
                -FeatureDir $featureDir `
                -Root $testRoot `
                -MaxRounds 2

            $result | Should -Not -BeNullOrEmpty
            $result.Result | Should -Be 'ALL_ROUNDS_FAILED'
            $result.Error | Should -Match 'invalid'
        }

        It 'exits early after 3 consecutive moderator JSON failures (circuit breaker)' {
            $script:claudeCallCount = 0
            Mock Invoke-Claude {
                $script:claudeCallCount++
                return 'garbage'
            }
            Mock Invoke-Parallel {
                param($Jobs)
                $result = @{}
                foreach ($key in $Jobs.Keys) {
                    $result[$key] = @{ Success = $true; Output = $null; Error = $null }
                }
                return $result
            }

            $result = Invoke-UnifiedDebateLoop `
                -GherkinFile (Join-Path $featureDir 'bdd.feature') `
                -TlaDir $tlaDir `
                -FeatureDir $featureDir `
                -Root $testRoot `
                -MaxRounds 10

            $result.Result | Should -Be 'ALL_ROUNDS_FAILED'
            # Should have stopped at 3, not burned through all 10
            $script:claudeCallCount | Should -BeLessOrEqual 3
        }
    }

    Context 'BDD-only objection routing (#24)' {
        It 'dispatches revision to BDD writer only and excludes TLA writer' {
            $script:claudeCallCount24 = 0
            Mock Invoke-Claude {
                $script:claudeCallCount24++
                if ($script:claudeCallCount24 -eq 1) {
                    return '{"result":"PARTIAL_CONSENSUS","objections":[{"target":"bdd","objection":"missing edge case"}],"experts":["expert-bdd"],"recommendation":{"bdd":"","tla":""},"sessionFile":"unified-debate.md"}'
                }
                return '{"result":"CONSENSUS_REACHED","objections":[],"experts":["expert-bdd"],"recommendation":{"bdd":"final fix","tla":"final fix"},"sessionFile":"unified-debate.md"}'
            }

            $script:capturedRevisionJobs = $null
            $script:parallelCallCount24 = 0
            Mock Invoke-Parallel {
                param($Jobs)
                $script:parallelCallCount24++
                if ($script:parallelCallCount24 -eq 1) {
                    # First call is the partial consensus revision — should only have bdd
                    $script:capturedRevisionJobs = $Jobs
                }
                $result = @{}
                foreach ($key in $Jobs.Keys) {
                    $result[$key] = @{ Success = $true; Output = $null; Error = $null }
                }
                return $result
            }

            Invoke-UnifiedDebateLoop `
                -GherkinFile (Join-Path $featureDir 'bdd.feature') `
                -TlaDir $tlaDir `
                -FeatureDir $featureDir `
                -Root $testRoot `
                -MaxRounds 10

            $script:capturedRevisionJobs.Keys | Should -Contain 'bdd'
            $script:capturedRevisionJobs.Keys | Should -Not -Contain 'tla'
        }
    }

    Context 'Update-DebateState failure is silently swallowed' {
        It 'returns CONSENSUS_REACHED even when Update-DebateState throws' {
            Mock Invoke-Claude {
                return '{"result":"CONSENSUS_REACHED","objections":[],"experts":["a"],"recommendation":{"bdd":"ok","tla":"ok"},"sessionFile":"unified-debate.md"}'
            }
            Mock Invoke-Parallel {
                param($Jobs)
                $result = @{}
                foreach ($key in $Jobs.Keys) { $result[$key] = @{ Success = $true; Output = $null; Error = $null } }
                return $result
            }
            Mock Update-DebateState { throw 'db unavailable' }

            $result = Invoke-UnifiedDebateLoop `
                -GherkinFile (Join-Path $featureDir 'bdd.feature') `
                -TlaDir $tlaDir `
                -FeatureDir $featureDir `
                -Root $testRoot `
                -MaxRounds 3

            $result.Result | Should -Be 'CONSENSUS_REACHED'
        }
    }

    Context 'Return contract' {
        It 'returns expected shape with all fields' {
            Mock Invoke-Claude {
                return '{"result":"CONSENSUS_REACHED","objections":[],"experts":["expert-bdd"],"recommendation":{"bdd":"ok","tla":"ok"},"sessionFile":"unified-debate.md"}'
            }
            Mock Invoke-Parallel {
                param($Jobs)
                $result = @{}
                foreach ($key in $Jobs.Keys) {
                    $result[$key] = @{ Success = $true; Output = $null; Error = $null }
                }
                return $result
            }

            $result = Invoke-UnifiedDebateLoop `
                -GherkinFile (Join-Path $featureDir 'bdd.feature') `
                -TlaDir $tlaDir `
                -FeatureDir $featureDir `
                -Root $testRoot `
                -MaxRounds 3

            $result.Keys | Should -Contain 'Result'
            $result.Keys | Should -Contain 'RoundsCompleted'
            $result.Keys | Should -Contain 'FinalGherkinPath'
            $result.Keys | Should -Contain 'FinalTlaDir'
            $result.Keys | Should -Contain 'SessionFile'
            $result.Keys | Should -Contain 'UnresolvedObjections'
        }
    }
}
