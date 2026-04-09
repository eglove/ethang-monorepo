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
        # Extract Resolve-PipelineState from vibe.ps1
        $vibeContent = Get-Content "$PSScriptRoot/../vibe.ps1" -Raw
        $funcMatch = [regex]::Match($vibeContent, '(?s)(function Resolve-PipelineState \{.+?\n\})')
        if ($funcMatch.Success) {
            Invoke-Expression $funcMatch.Value
        }

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
