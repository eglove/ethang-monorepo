BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    . "$root/utils/resolve-pipeline-state.ps1"
}

Describe 'Resolve-PipelineState' {
    BeforeEach {
        $testDir = Join-Path ([System.IO.Path]::GetTempPath()) "pstate-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $testDir -Force | Out-Null
    }

    AfterEach {
        Remove-Item -Path $testDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    Context 'Stage 1' {
        It 'returns FeatureDir with no validation' {
            $result = Resolve-PipelineState -FromStage 1 -Dir $testDir
            $result.FeatureDir | Should -Be $testDir
        }
    }

    Context 'Stage 2 — requires elicitor.md' {
        It 'passes when elicitor.md exists' {
            Set-Content -Path (Join-Path $testDir 'elicitor.md') -Value '# Briefing'
            $result = Resolve-PipelineState -FromStage 2 -Dir $testDir
            $result.Briefing | Should -Match 'Briefing'
            $result.FeatureDir | Should -Be $testDir
        }

        It 'throws when elicitor.md is missing' {
            { Resolve-PipelineState -FromStage 2 -Dir $testDir } | Should -Throw '*elicitor.md*'
        }
    }

    Context 'Stage 3 — requires elicitor.md, bdd.feature, .tla file' {
        BeforeEach {
            Set-Content -Path (Join-Path $testDir 'elicitor.md') -Value '# Briefing'
            Set-Content -Path (Join-Path $testDir 'bdd.feature') -Value 'Feature: test'
            $tlaDir = Join-Path $testDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        }

        It 'passes with all artifacts' {
            $result = Resolve-PipelineState -FromStage 3 -Dir $testDir
            $result.GherkinFile | Should -Exist
            $result.TlaFile | Should -Exist
            $result.TlaDir | Should -Exist
        }

        It 'throws when elicitor.md is missing (cumulative)' {
            Remove-Item (Join-Path $testDir 'elicitor.md')
            { Resolve-PipelineState -FromStage 3 -Dir $testDir } | Should -Throw '*elicitor.md*'
        }

        It 'throws when bdd.feature is missing' {
            Remove-Item (Join-Path $testDir 'bdd.feature')
            { Resolve-PipelineState -FromStage 3 -Dir $testDir } | Should -Throw '*bdd.feature*'
        }

        It 'throws when .tla file is missing' {
            Remove-Item (Join-Path $testDir 'tla/Spec.tla')
            { Resolve-PipelineState -FromStage 3 -Dir $testDir } | Should -Throw '*TLA*'
        }
    }

    Context 'Stage 4 — adds unified-debate.md' {
        BeforeEach {
            Set-Content -Path (Join-Path $testDir 'elicitor.md') -Value '# Briefing'
            Set-Content -Path (Join-Path $testDir 'bdd.feature') -Value 'Feature: test'
            $tlaDir = Join-Path $testDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
            Set-Content -Path (Join-Path $testDir 'unified-debate.md') -Value '# Debate'
        }

        It 'passes with all artifacts including unified-debate.md' {
            $result = Resolve-PipelineState -FromStage 4 -Dir $testDir
            $result.UnifiedDebateFile | Should -Exist
        }

        It 'throws when unified-debate.md is missing' {
            Remove-Item (Join-Path $testDir 'unified-debate.md')
            { Resolve-PipelineState -FromStage 4 -Dir $testDir } | Should -Throw '*unified-debate.md*'
        }
    }

    Context 'Stage 5 — adds fixture JSON' {
        BeforeEach {
            Set-Content -Path (Join-Path $testDir 'elicitor.md') -Value '# Briefing'
            Set-Content -Path (Join-Path $testDir 'bdd.feature') -Value 'Feature: test'
            $tlaDir = Join-Path $testDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
            Set-Content -Path (Join-Path $testDir 'unified-debate.md') -Value '# Debate'
            Set-Content -Path (Join-Path $testDir 'bdd-fixture.json') -Value '{}'
        }

        It 'passes with fixture JSON' {
            $result = Resolve-PipelineState -FromStage 5 -Dir $testDir
            $result.FixtureJson | Should -Exist
        }

        It 'throws when fixture JSON is missing' {
            Remove-Item (Join-Path $testDir 'bdd-fixture.json')
            { Resolve-PipelineState -FromStage 5 -Dir $testDir } | Should -Throw '*fixture*'
        }

        It 'throws when unified-debate.md is missing (cumulative)' {
            Remove-Item (Join-Path $testDir 'unified-debate.md')
            { Resolve-PipelineState -FromStage 5 -Dir $testDir } | Should -Throw '*unified-debate.md*'
        }
    }

    Context 'Stage 6 — adds implementation-plan.md and .json' {
        BeforeEach {
            Set-Content -Path (Join-Path $testDir 'elicitor.md') -Value '# Briefing'
            Set-Content -Path (Join-Path $testDir 'bdd.feature') -Value 'Feature: test'
            $tlaDir = Join-Path $testDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
            Set-Content -Path (Join-Path $testDir 'unified-debate.md') -Value '# Debate'
            Set-Content -Path (Join-Path $testDir 'bdd-fixture.json') -Value '{}'
            Set-Content -Path (Join-Path $testDir 'implementation-plan.md') -Value '# Plan'
            Set-Content -Path (Join-Path $testDir 'implementation-plan.json') -Value '{}'
        }

        It 'passes with all artifacts' {
            $result = Resolve-PipelineState -FromStage 6 -Dir $testDir
            $result.ImplFile | Should -Exist
            $result.ImplJson | Should -Exist
        }

        It 'throws when implementation-plan.md is missing' {
            Remove-Item (Join-Path $testDir 'implementation-plan.md')
            { Resolve-PipelineState -FromStage 6 -Dir $testDir } | Should -Throw '*implementation-plan.md*'
        }

        It 'throws when implementation-plan.json is missing' {
            Remove-Item (Join-Path $testDir 'implementation-plan.json')
            { Resolve-PipelineState -FromStage 6 -Dir $testDir } | Should -Throw '*implementation-plan.json*'
        }
    }

    Context 'Stage 7 ��� adds impl-debate.md' {
        BeforeEach {
            Set-Content -Path (Join-Path $testDir 'elicitor.md') -Value '# Briefing'
            Set-Content -Path (Join-Path $testDir 'bdd.feature') -Value 'Feature: test'
            $tlaDir = Join-Path $testDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
            Set-Content -Path (Join-Path $testDir 'unified-debate.md') -Value '# Debate'
            Set-Content -Path (Join-Path $testDir 'bdd-fixture.json') -Value '{}'
            Set-Content -Path (Join-Path $testDir 'implementation-plan.md') -Value '# Plan'
            Set-Content -Path (Join-Path $testDir 'implementation-plan.json') -Value '{}'
            Set-Content -Path (Join-Path $testDir 'impl-debate.md') -Value '# Impl debate'
        }

        It 'passes with all artifacts' {
            $result = Resolve-PipelineState -FromStage 7 -Dir $testDir
            $result.ImplDebateFile | Should -Exist
        }

        It 'throws when impl-debate.md is missing' {
            Remove-Item (Join-Path $testDir 'impl-debate.md')
            { Resolve-PipelineState -FromStage 7 -Dir $testDir } | Should -Throw '*impl-debate*'
        }
    }
}
