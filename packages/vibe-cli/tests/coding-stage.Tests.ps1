BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/tdd-loop.ps1"
    . "$PSScriptRoot/../utils/cleanup-loop.ps1"
    . "$PSScriptRoot/../utils/review-runner.ps1"
    . "$PSScriptRoot/../utils/task-runner.ps1"
    . "$PSScriptRoot/../stages/8-coding.ps1"
}

Describe 'Resolve-VerifyProfile' {
    It 'returns powershell profile when all files are .ps1' {
        $plan = @{
            tiers = @(
                @{ tasks = @(
                    @{ files = @('utils/lint-fixer/types.ps1', 'utils/lint-fixer/types.Tests.ps1') }
                    @{ files = @('utils/lint-fixer/suppress.ps1') }
                )}
            )
        }

        $profile = Resolve-VerifyProfile -Plan $plan
        $profile.Test | Should -Match 'Pester'
        $profile.Lint | Should -Not -Be 'pnpm lint'
    }

    It 'returns typescript profile when all files are .ts' {
        $plan = @{
            tiers = @(
                @{ tasks = @(
                    @{ files = @('src/index.ts', 'src/index.test.ts') }
                )}
            )
        }

        $profile = Resolve-VerifyProfile -Plan $plan
        $profile.Test | Should -Be 'pnpm test'
        $profile.Lint | Should -Be 'pnpm lint'
        $profile.Tsc | Should -Be 'pnpm tsc'
    }

    It 'returns default profile for non-code files like .md' {
        $plan = @{
            tiers = @(
                @{ tasks = @(
                    @{ files = @('docs/learned.md', 'agents/lint-fixer.md') }
                )}
            )
        }

        $profile = Resolve-VerifyProfile -Plan $plan
        $profile.Test | Should -Be 'pnpm test'
    }

    It 'uses dominant extension when mixed' {
        $plan = @{
            tiers = @(
                @{ tasks = @(
                    @{ files = @('utils/types.ps1', 'utils/types.Tests.ps1', 'utils/run.ps1') }
                    @{ files = @('docs/readme.md') }
                )}
            )
        }

        # 3 .ps1 files vs 1 .md — PowerShell dominates
        $profile = Resolve-VerifyProfile -Plan $plan
        $profile.Test | Should -Match 'Pester'
    }

    It 'falls back to defaults when no code files found' {
        $plan = @{ tiers = @() }

        $profile = Resolve-VerifyProfile -Plan $plan
        $profile.Test | Should -Be 'pnpm test'
        $profile.Lint | Should -Be 'pnpm lint'
        $profile.Tsc | Should -Be 'pnpm tsc'
    }
}

Describe 'Invoke-CodingStage' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "coding-test-$(Get-Random)"
        $script:featureDir = Join-Path $script:tempRoot 'docs/test-feat'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null

        $agentDir = Join-Path $script:tempRoot 'agents'
        New-Item -ItemType Directory -Path "$agentDir/code-writers" -Force | Out-Null
        New-Item -ItemType Directory -Path "$agentDir/test-writers" -Force | Out-Null
        New-Item -ItemType Directory -Path "$agentDir/reviewers" -Force | Out-Null
        Set-Content (Join-Path $agentDir 'code-writers/typescript-writer.md') -Value 'writer'
        Set-Content (Join-Path $agentDir 'test-writers/vitest-writer.md') -Value 'test writer'
        Set-Content (Join-Path $agentDir 'reviewers/test-reviewer.md') -Value 'reviewer'

        # Create impl plan JSON
        $script:implJson = Join-Path $script:featureDir 'implementation-plan.json'
        $script:implFile = Join-Path $script:featureDir 'implementation-plan.md'

        $plan = @{
            tiers = @(
                @{
                    tier = 1
                    title = 'Foundation'
                    tasks = @(
                        @{
                            id = 'T1'
                            title = 'Setup types'
                            files = @('src/types.ts')
                            codeWriter = 'typescript-writer'
                            testWriter = 'vitest-writer'
                        }
                    )
                }
            )
        }
        $plan | ConvertTo-Json -Depth 10 | Set-Content $script:implJson
        Set-Content $script:implFile -Value '# Implementation Plan'
    }

    AfterAll {
        Remove-Item $script:tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'creates integration branch and worktrees for each task' {
        $script:gitCommands = @()
        Mock git {
            $script:gitCommands += ($args -join ' ')
            $global:LASTEXITCODE = 0
        }

        Mock Invoke-TaskRunner {
            @{ Status = 'DONE'; FixRounds = 1; Reviews = @{ Issues = @() } }
        }

        $result = Invoke-CodingStage `
            -ImplJson $script:implJson `
            -ImplFile $script:implFile `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot

        $result | Should -Be 'feature/test-feat'
        $script:gitCommands | Should -Contain 'checkout -b feature/test-feat'
        ($script:gitCommands | Where-Object { $_ -match 'worktree add' }).Count | Should -Be 1
    }

    It 'throws when branch creation fails' {
        Mock git {
            if ($args[0] -eq 'checkout') {
                $global:LASTEXITCODE = 1
            } else {
                $global:LASTEXITCODE = 0
            }
        }

        { Invoke-CodingStage `
            -ImplJson $script:implJson `
            -ImplFile $script:implFile `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot } |
            Should -Throw '*Failed to create branch*'
    }

    It 'throws when worktree creation fails' {
        Mock git {
            if ($args[0] -eq 'worktree') {
                $global:LASTEXITCODE = 1
            } else {
                $global:LASTEXITCODE = 0
            }
        }

        { Invoke-CodingStage `
            -ImplJson $script:implJson `
            -ImplFile $script:implFile `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot } |
            Should -Throw '*Failed to create worktree*'
    }

    It 'merges task branches and cleans up worktrees' {
        $script:gitCommands = @()
        Mock git {
            $script:gitCommands += ($args -join ' ')
            $global:LASTEXITCODE = 0
        }

        Mock Invoke-TaskRunner {
            @{ Status = 'DONE'; FixRounds = 1; Reviews = @{ Issues = @() } }
        }

        Invoke-CodingStage `
            -ImplJson $script:implJson `
            -ImplFile $script:implFile `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot

        ($script:gitCommands | Where-Object { $_ -match 'merge --no-ff' }).Count | Should -Be 1
        ($script:gitCommands | Where-Object { $_ -match 'worktree remove' }).Count | Should -Be 1
        ($script:gitCommands | Where-Object { $_ -match 'branch -d' }).Count | Should -Be 1
    }

    It 'throws when merge fails' {
        Mock git {
            if (($args -join ' ') -match 'merge') {
                $global:LASTEXITCODE = 1
            } else {
                $global:LASTEXITCODE = 0
            }
        }

        Mock Invoke-TaskRunner {
            @{ Status = 'DONE'; FixRounds = 1; Reviews = @{ Issues = @() } }
        }

        { Invoke-CodingStage `
            -ImplJson $script:implJson `
            -ImplFile $script:implFile `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot } |
            Should -Throw '*Merge conflict*'
    }

    It 'handles multi-tier plans with multiple tasks' {
        $multiPlan = @{
            tiers = @(
                @{
                    tier = 1
                    title = 'Tier 1'
                    tasks = @(
                        @{ id = 'T1'; title = 'Task 1'; files = @('a.ts'); codeWriter = 'typescript-writer'; testWriter = 'vitest-writer' }
                        @{ id = 'T2'; title = 'Task 2'; files = @('b.ts'); codeWriter = 'typescript-writer'; testWriter = 'vitest-writer' }
                    )
                }
                @{
                    tier = 2
                    title = 'Tier 2'
                    tasks = @(
                        @{ id = 'T3'; title = 'Task 3'; files = @('c.ts'); codeWriter = 'typescript-writer'; testWriter = 'vitest-writer' }
                    )
                }
            )
        }
        $multiJson = Join-Path $script:featureDir 'multi-plan.json'
        $multiPlan | ConvertTo-Json -Depth 10 | Set-Content $multiJson

        Mock git { $global:LASTEXITCODE = 0 }
        Mock Invoke-TaskRunner {
            @{ Status = 'DONE'; FixRounds = 1; Reviews = @{ Issues = @() } }
        }

        $result = Invoke-CodingStage `
            -ImplJson $multiJson `
            -ImplFile $script:implFile `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot

        $result | Should -Be 'feature/test-feat'
    }
}
