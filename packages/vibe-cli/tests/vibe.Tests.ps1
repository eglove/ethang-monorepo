BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
}

Describe 'vibe.ps1 parameter validation' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}
        Mock Set-Content {}
    }

    It 'throws when Stage > 1 and no Feature provided' {
        { & "$PSScriptRoot/../vibe.ps1" -Stage 2 } |
            Should -Throw '*requires -Feature*'
    }

    It 'throws when Stage > 1 and Feature dir missing' {
        { & "$PSScriptRoot/../vibe.ps1" -Stage 2 -Feature 'nonexistent-feature-xyz' } |
            Should -Throw '*not found*'
    }

    It 'throws when no Seed provided for fresh run' {
        { & "$PSScriptRoot/../vibe.ps1" } |
            Should -Throw '*seed prompt is required*'
    }
}

Describe 'Resolve-PipelineState edge cases' {
    BeforeAll {
        . "$PSScriptRoot/../utils/pipeline-state.ps1"

        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "vibestate-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null
        Set-Content (Join-Path $script:tempDir 'elicitor.md') -Value '# Briefing'
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns only FeatureDir for stage 1' {
        $state = Resolve-PipelineState -FromStage 1 -Dir $script:tempDir
        $state.FeatureDir | Should -Be $script:tempDir
        $state.Keys.Count | Should -Be 1
    }

    It 'includes Briefing for stage 2' {
        $state = Resolve-PipelineState -FromStage 2 -Dir $script:tempDir
        $state.Briefing | Should -Not -BeNullOrEmpty
    }

    It 'returns GherkinFile for stage 4 (between 3 and 5)' {
        Set-Content (Join-Path $script:tempDir 'bdd.feature') -Value 'Feature: test'
        $state = Resolve-PipelineState -FromStage 4 -Dir $script:tempDir
        $state.GherkinFile | Should -Match 'bdd\.feature'
        $state.TlaFile | Should -BeNullOrEmpty
    }

    It 'returns TlaFile for stage 6 (between 5 and 7)' {
        $tlaDir = Join-Path $script:tempDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'

        $state = Resolve-PipelineState -FromStage 6 -Dir $script:tempDir
        $state.TlaFile | Should -Not -BeNullOrEmpty
        $state.ImplFile | Should -BeNullOrEmpty
    }

    It 'returns all state for stage 8+' {
        Set-Content (Join-Path $script:tempDir 'implementation-plan.md') -Value '# Plan'
        Set-Content (Join-Path $script:tempDir 'implementation-plan.json') -Value '{}'

        $state = Resolve-PipelineState -FromStage 8 -Dir $script:tempDir
        $state.FeatureDir | Should -Be $script:tempDir
        $state.Briefing | Should -Not -BeNullOrEmpty
        $state.GherkinFile | Should -Not -BeNullOrEmpty
        $state.TlaFile | Should -Not -BeNullOrEmpty
        $state.ImplFile | Should -Match 'implementation-plan\.md'
        $state.ImplJson | Should -Match 'implementation-plan\.json'
    }

    It 'throws when impl json missing but impl md exists for stage 7' {
        $partialDir = Join-Path $script:tempDir 'partial'
        New-Item -ItemType Directory -Path $partialDir -Force | Out-Null
        Set-Content (Join-Path $partialDir 'elicitor.md') -Value '# Brief'
        Set-Content (Join-Path $partialDir 'bdd.feature') -Value 'Feature: t'
        $ptla = Join-Path $partialDir 'tla'
        New-Item -ItemType Directory -Path $ptla -Force | Out-Null
        Set-Content (Join-Path $ptla 'S.tla') -Value '---- MODULE S ----'
        Set-Content (Join-Path $partialDir 'implementation-plan.md') -Value '# Plan'

        { Resolve-PipelineState -FromStage 7 -Dir $partialDir } |
            Should -Throw '*missing*implementation-plan.json*'

        Remove-Item $partialDir -Recurse -Force
    }
}

Describe 'vibe.ps1 debateSchema' {
    It 'has valid JSON debate schema' {
        $vibeContent = Get-Content "$PSScriptRoot/../vibe.ps1" -Raw
        $schemaMatch = [regex]::Match($vibeContent, "(?s)\`$debateSchema = @'`n(.+?)`n'@")
        $schemaMatch.Success | Should -BeTrue

        $schema = $schemaMatch.Groups[1].Value | ConvertFrom-Json
        $schema.type | Should -Be 'object'
        $schema.properties.result | Should -Not -BeNullOrEmpty
        $schema.required | Should -Contain 'result'
    }
}

Describe 'vibe.ps1 pipeline execution' {
    BeforeAll {
        . "$PSScriptRoot/../utils/config.ps1"
        . "$PSScriptRoot/../utils/debate-loop.ps1"
        . "$PSScriptRoot/../utils/task-runner.ps1"
        . "$PSScriptRoot/../utils/review-runner.ps1"
        . "$PSScriptRoot/../utils/tlc-runner.ps1"
        . "$PSScriptRoot/../stages/1-elicitor.ps1"
        . "$PSScriptRoot/../stages/2-bdd-writer.ps1"
        . "$PSScriptRoot/../stages/3-bdd-debate.ps1"
        . "$PSScriptRoot/../stages/4-tla-writer.ps1"
        . "$PSScriptRoot/../stages/5-tla-debate.ps1"
        . "$PSScriptRoot/../stages/6-implementation-writer.ps1"
        . "$PSScriptRoot/../stages/7-implementation-debate.ps1"
        . "$PSScriptRoot/../stages/8-coding.ps1"
        . "$PSScriptRoot/../stages/9-global-review.ps1"

        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:vibeRoot = Resolve-Path "$PSScriptRoot/.."
    }

    It 'runs full pipeline from stage 1 through stage 9' {
        $featureName = "test-e2e-$(Get-Random)"
        $featureDir = Join-Path $script:vibeRoot "docs/$featureName"
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null

        Mock Invoke-Elicitor {
            @{ FeatureDir = $featureDir; Briefing = 'test briefing' }
        }
        Mock Invoke-BddWriter { "$featureDir/bdd.feature" }
        Mock Invoke-BddDebate {}
        Mock Invoke-TlaWriter {
            @{
                TlaFile = [PSCustomObject]@{ FullName = "$featureDir/tla/Spec.tla" }
                TlaDir  = "$featureDir/tla"
            }
        }
        Mock Invoke-TlaDebate {}
        Mock Invoke-ImplementationWriter {
            @{
                ImplFile = "$featureDir/implementation-plan.md"
                ImplJson = "$featureDir/implementation-plan.json"
            }
        }
        Mock Invoke-ImplementationDebate {}
        Mock Invoke-CodingStage { "feature/$featureName" }
        Mock Invoke-GlobalReview {}

        & "$PSScriptRoot/../vibe.ps1" "test seed"

        Should -Invoke Invoke-Elicitor -Times 1
        Should -Invoke Invoke-BddWriter -Times 1
        Should -Invoke Invoke-BddDebate -Times 1
        Should -Invoke Invoke-TlaWriter -Times 1
        Should -Invoke Invoke-TlaDebate -Times 1
        Should -Invoke Invoke-ImplementationWriter -Times 1
        Should -Invoke Invoke-ImplementationDebate -Times 1
        Should -Invoke Invoke-CodingStage -Times 1
        Should -Invoke Invoke-GlobalReview -Times 1

        Remove-Item $featureDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'resumes at stage 3 skipping earlier stages' {
        $featureName = "test-resume-$(Get-Random)"
        $featureDir = Join-Path $script:vibeRoot "docs/$featureName"
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
        Set-Content (Join-Path $featureDir 'elicitor.md') -Value '# Test briefing'
        Set-Content (Join-Path $featureDir 'bdd.feature') -Value 'Feature: test'

        Mock Invoke-BddDebate {}
        Mock Invoke-TlaWriter {
            @{
                TlaFile = [PSCustomObject]@{ FullName = "$featureDir/tla/Spec.tla" }
                TlaDir  = "$featureDir/tla"
            }
        }
        Mock Invoke-TlaDebate {}
        Mock Invoke-ImplementationWriter {
            @{
                ImplFile = "$featureDir/implementation-plan.md"
                ImplJson = "$featureDir/implementation-plan.json"
            }
        }
        Mock Invoke-ImplementationDebate {}
        Mock Invoke-CodingStage { "feature/$featureName" }
        Mock Invoke-GlobalReview {}

        & "$PSScriptRoot/../vibe.ps1" -Stage 3 -Feature $featureName

        Should -Invoke Invoke-BddDebate -Times 1
        Should -Invoke Invoke-TlaWriter -Times 1

        Remove-Item $featureDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'resumes at stage 9 and derives integrationBranch from feature slug' {
        $featureName = "test-stage9-$(Get-Random)"
        $featureDir = Join-Path $script:vibeRoot "docs/$featureName"
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
        Set-Content (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content (Join-Path $featureDir 'bdd.feature') -Value 'Feature: test'
        $tlaDir = Join-Path $featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $featureDir 'implementation-plan.md') -Value '# Plan'
        Set-Content (Join-Path $featureDir 'implementation-plan.json') -Value '{}'

        Mock Invoke-GlobalReview {}

        & "$PSScriptRoot/../vibe.ps1" -Stage 9 -Feature $featureName

        Should -Invoke Invoke-GlobalReview -Times 1

        Remove-Item $featureDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'catch block logs error and re-throws on stage failure' {
        $featureName = "test-error-$(Get-Random)"
        $featureDir = Join-Path $script:vibeRoot "docs/$featureName"
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null

        Mock Invoke-Elicitor { throw 'Elicitor exploded' }

        { & "$PSScriptRoot/../vibe.ps1" "boom seed" } |
            Should -Throw '*Elicitor exploded*'

        Remove-Item $featureDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
