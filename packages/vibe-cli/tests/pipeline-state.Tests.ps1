BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-state.ps1"
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
        Set-Content (Join-Path $script:tempDir 'implementation-plan.json') -Value '{"tiers":[{"tier":1,"tasks":[{"id":"T1","title":"A"}]}]}'

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

    Context 'Stage 8 resume' {
        BeforeAll {
            # Create tickets directory with task logs
            $ticketsDir = Join-Path $script:tempDir 'tickets'
            New-Item -ItemType Directory -Path $ticketsDir -Force | Out-Null
            Set-Content (Join-Path $ticketsDir 'T1-config.md') -Value '# T1'
            Set-Content (Join-Path $ticketsDir 'T1-log.txt') -Value "[2026-04-10] [T1] done | COMPLETED`n[2026-04-10] [T1] done | MERGED"
            Set-Content (Join-Path $ticketsDir 'T2-workspace.md') -Value '# T2'
            Set-Content (Join-Path $ticketsDir 'T2-log.txt') -Value "[2026-04-10] [T2] green | running"

            # Sync-FallbackLog may not be loaded in this test context, define a stub
            if (-not (Get-Command Sync-FallbackLog -ErrorAction SilentlyContinue)) {
                function global:Sync-FallbackLog { }
            }
            Mock Sync-FallbackLog {}
        }

        It 'returns Plan, Tickets, and TlaFile for stage 8' {
            $state = Resolve-PipelineState -FromStage 8 -Dir $script:tempDir
            $state.Plan | Should -Not -BeNullOrEmpty
            $state.Tickets | Should -Not -BeNullOrEmpty
            $state.TlaFile | Should -Not -BeNullOrEmpty
        }

        It 'detects completed tasks from log files' {
            $state = Resolve-PipelineState -FromStage 8 -Dir $script:tempDir
            $state.CompletedTasks | Should -Contain 'T1'
            $state.CompletedTasks | Should -Not -Contain 'T2'
        }

        It 'detects merged tasks from log files' {
            $state = Resolve-PipelineState -FromStage 8 -Dir $script:tempDir
            $state.MergedTasks | Should -Contain 'T1'
            $state.MergedTasks | Should -Not -Contain 'T2'
        }

        It 'throws when tickets directory missing' {
            $emptyDir = Join-Path ([System.IO.Path]::GetTempPath()) "empty-$(Get-Random)"
            New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
            Set-Content (Join-Path $emptyDir 'elicitor.md') -Value '# Briefing'
            Set-Content (Join-Path $emptyDir 'bdd.feature') -Value 'Feature: test'
            $tlaDir2 = Join-Path $emptyDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir2 -Force | Out-Null
            Set-Content (Join-Path $tlaDir2 'Spec.tla') -Value '---- MODULE ----'
            Set-Content (Join-Path $emptyDir 'implementation-plan.md') -Value '# Plan'
            Set-Content (Join-Path $emptyDir 'implementation-plan.json') -Value '{}'

            { Resolve-PipelineState -FromStage 8 -Dir $emptyDir } | Should -Throw '*tickets*'
            Remove-Item $emptyDir -Recurse -Force
        }

        It 'calls Sync-FallbackLog before parsing logs' {
            Resolve-PipelineState -FromStage 8 -Dir $script:tempDir
            Should -Invoke Sync-FallbackLog
        }
    }
}
