BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    . "$root/utils/pipeline-log.ps1"
    . "$root/utils/invoke-parallel.ps1"
    . "$root/utils/resolve-pipeline-state.ps1"
    . "$root/stages/2-parallel-writers.ps1"
}

Describe 'Invoke-ParallelWriter (Stage 2)' {
    BeforeEach {
        $testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s2-test-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
        $featureDir = Join-Path $testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing for test feature'
        # Create agents directory for writer scripts
        New-Item -ItemType Directory -Path "$testRoot/agents/doc-writers" -Force | Out-Null
        Set-Content -Path "$testRoot/agents/doc-writers/bdd-writer.md" -Value '# BDD Writer'
        Set-Content -Path "$testRoot/agents/doc-writers/tla-writer.md" -Value '# TLA Writer'
    }

    AfterEach {
        Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Invoke-Parallel with two jobs: bdd and tla' {
        Mock Invoke-Parallel {
            param($Jobs)
            # Simulate both succeeding
            $bddFile = Join-Path $featureDir 'bdd.feature'
            Set-Content -Path $bddFile -Value 'Feature: test'
            $tlaDir = Join-Path $featureDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
            return @{
                bdd = @{ Success = $true; Output = $bddFile; Error = $null }
                tla = @{ Success = $true; Output = @{ TlaFile = (Join-Path $tlaDir 'Spec.tla'); TlaDir = $tlaDir }; Error = $null }
            }
        }

        $result = Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot

        Should -Invoke Invoke-Parallel -Times 1
        $result.Success | Should -BeTrue
    }

    It 'writes STAGE_COMPLETE:2 marker on success' {
        Mock Invoke-Parallel {
            $bddFile = Join-Path $featureDir 'bdd.feature'
            Set-Content -Path $bddFile -Value 'Feature: test'
            $tlaDir = Join-Path $featureDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
            return @{
                bdd = @{ Success = $true; Output = $bddFile; Error = $null }
                tla = @{ Success = $true; Output = @{ TlaFile = (Join-Path $tlaDir 'Spec.tla'); TlaDir = $tlaDir }; Error = $null }
            }
        }

        Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot

        $logPath = Join-Path $testRoot 'pipeline.log'
        $logPath | Should -Exist
        $content = Get-Content $logPath -Raw
        $content | Should -Match 'STAGE_COMPLETE:2:test-feature'
    }

    It 'fails when BDD writer fails but preserves TLA output' {
        Mock Invoke-Parallel {
            $tlaDir = Join-Path $featureDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
            return @{
                bdd = @{ Success = $false; Output = $null; Error = "BDD writer crashed" }
                tla = @{ Success = $true; Output = @{ TlaFile = (Join-Path $tlaDir 'Spec.tla'); TlaDir = $tlaDir }; Error = $null }
            }
        }

        $result = Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot

        $result.Success | Should -BeFalse
        $result.Error | Should -Match 'bdd'
        # TLA output should be preserved on disk
        (Join-Path $featureDir 'tla/Spec.tla') | Should -Exist
    }

    It 'fails when both writers fail' {
        Mock Invoke-Parallel {
            return @{
                bdd = @{ Success = $false; Output = $null; Error = "BDD failed" }
                tla = @{ Success = $false; Output = $null; Error = "TLA failed" }
            }
        }

        $result = Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot

        $result.Success | Should -BeFalse
        $result.Error | Should -Match 'bdd'
        $result.Error | Should -Match 'tla'
    }

    It 'throws when elicitor.md does not exist (#23)' {
        Remove-Item (Join-Path $featureDir 'elicitor.md') -ErrorAction SilentlyContinue

        { Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot } | Should -Throw '*Elicitor briefing not found*'
    }

    It 'returns TlaFile as a string path (regression: ConvertTo-Json hang)' {
        Mock Invoke-Parallel {
            $bddFile = Join-Path $featureDir 'bdd.feature'
            Set-Content -Path $bddFile -Value 'Feature: test'
            $tlaDir = Join-Path $featureDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            $tlaPath = Join-Path $tlaDir 'Spec.tla'
            Set-Content -Path $tlaPath -Value '---- MODULE Spec ----'
            return @{
                bdd = @{ Success = $true; Output = $bddFile; Error = $null }
                tla = @{ Success = $true; Output = @{ TlaFile = $tlaPath; TlaDir = $tlaDir }; Error = $null }
            }
        }

        $result = Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot

        $result.TlaFile | Should -BeOfType ([string])
        $warnings = $null
        $null = $result | ConvertTo-Json -Depth 10 -Compress -WarningVariable warnings -WarningAction SilentlyContinue
        $warnings | Should -BeNullOrEmpty
    }

    It 'does not write STAGE_COMPLETE:2 marker on failure' {
        Mock Invoke-Parallel {
            return @{
                bdd = @{ Success = $false; Output = $null; Error = "BDD failed" }
                tla = @{ Success = $true; Output = $null; Error = $null }
            }
        }

        Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot

        $logPath = Join-Path $testRoot 'pipeline.log'
        if (Test-Path $logPath) {
            $content = Get-Content $logPath -Raw
            $content | Should -Not -Match 'STAGE_COMPLETE:2'
        }
    }
}
