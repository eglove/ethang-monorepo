BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"

    # Source just the Resolve-PipelineState function from vibe.ps1
    # Extract it since vibe.ps1 has top-level execution code
    $vibeContent = Get-Content "$PSScriptRoot/../vibe.ps1" -Raw
    $funcMatch = [regex]::Match($vibeContent, '(?s)(function Resolve-PipelineState \{.+?\n\})')
    if ($funcMatch.Success) {
        Invoke-Expression $funcMatch.Value
    }
}

Describe 'Resolve-PipelineState' {
    BeforeAll {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "state-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        # Create elicitor.md (always needed for stage > 1)
        Set-Content (Join-Path $script:tempDir 'elicitor.md') -Value '# Briefing'
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns FeatureDir for stage 2' {
        $state = Resolve-PipelineState -FromStage 2 -Dir $script:tempDir
        $state.FeatureDir | Should -Be $script:tempDir
        $state.Briefing | Should -Match 'Briefing'
    }

    It 'throws when bdd.feature is missing for stage 3' {
        { Resolve-PipelineState -FromStage 3 -Dir $script:tempDir } |
            Should -Throw '*missing*bdd.feature*'
    }

    It 'returns GherkinFile for stage 3 when bdd.feature exists' {
        Set-Content (Join-Path $script:tempDir 'bdd.feature') -Value 'Feature: test'
        $state = Resolve-PipelineState -FromStage 3 -Dir $script:tempDir
        $state.GherkinFile | Should -Match 'bdd\.feature'
    }

    It 'throws when TLA+ spec is missing for stage 5' {
        { Resolve-PipelineState -FromStage 5 -Dir $script:tempDir } |
            Should -Throw '*missing TLA*'
    }

    It 'returns TlaFile for stage 5 when .tla exists' {
        $tlaDir = Join-Path $script:tempDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'

        $state = Resolve-PipelineState -FromStage 5 -Dir $script:tempDir
        $state.TlaFile | Should -Not -BeNullOrEmpty
        $state.TlaDir | Should -Match 'tla$'
    }

    It 'throws when impl plan is missing for stage 7' {
        { Resolve-PipelineState -FromStage 7 -Dir $script:tempDir } |
            Should -Throw '*missing*implementation-plan*'
    }

    It 'returns ImplFile and ImplJson for stage 7 when both exist' {
        Set-Content (Join-Path $script:tempDir 'implementation-plan.md') -Value '# Plan'
        Set-Content (Join-Path $script:tempDir 'implementation-plan.json') -Value '{}'

        $state = Resolve-PipelineState -FromStage 7 -Dir $script:tempDir
        $state.ImplFile | Should -Match 'implementation-plan\.md'
        $state.ImplJson | Should -Match 'implementation-plan\.json'
    }

    It 'does not load later artifacts for earlier stages' {
        $state = Resolve-PipelineState -FromStage 2 -Dir $script:tempDir
        $state.GherkinFile | Should -BeNullOrEmpty
        $state.TlaFile | Should -BeNullOrEmpty
        $state.ImplFile | Should -BeNullOrEmpty
    }
}
