BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/tdd-loop.ps1"
    . "$PSScriptRoot/../utils/cleanup-loop.ps1"
    . "$PSScriptRoot/../utils/review-runner.ps1"
    . "$PSScriptRoot/../utils/task-runner.ps1"
}

Describe 'Invoke-TaskRunner' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "taskrunner-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        # Create agents dir structure
        $script:agentsDir = Join-Path $script:tempDir 'agents'
        New-Item -ItemType Directory -Path "$($script:agentsDir)/code-writers" -Force | Out-Null
        New-Item -ItemType Directory -Path "$($script:agentsDir)/test-writers" -Force | Out-Null
        New-Item -ItemType Directory -Path "$($script:agentsDir)/reviewers" -Force | Out-Null
        Set-Content (Join-Path $script:agentsDir 'code-writers/typescript-writer.md') -Value 'code writer'
        Set-Content (Join-Path $script:agentsDir 'test-writers/vitest-writer.md') -Value 'test writer'
        Set-Content (Join-Path $script:agentsDir 'reviewers/test-reviewer.md') -Value 'reviewer'

        # Create user_notes.md location
        Set-Content (Join-Path $script:tempDir 'user_notes.md') -Value ''

        $script:wtDir = Join-Path $script:tempDir 'worktree'
        New-Item -ItemType Directory -Path $script:wtDir -Force | Out-Null

        $script:task = @{
            id         = 'T1'
            title      = 'Test task'
            files      = @('src/index.ts')
            codeWriter = 'typescript-writer'
            testWriter = 'vitest-writer'
        }
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns DONE when TDD, cleanup, and review all pass on first round' {
        Mock Invoke-TddLoop {
            @{ Status = 'DONE'; Cycles = 2 }
        }
        Mock Invoke-CleanupLoop {
            @{ Passed = $true }
        }
        Mock Push-Location {}
        Mock Pop-Location {}
        Mock git { $global:LASTEXITCODE = 0 }
        Mock Invoke-ReviewRunner {
            @{ Passed = $true; Issues = @(); BlockingCount = 0 }
        }

        $result = Invoke-TaskRunner `
            -Task $script:task `
            -ImplPlanMarkdown '# Plan' `
            -WorktreePath $script:wtDir `
            -AgentsDir $script:agentsDir `
            -MaxFixRounds 3

        $result.Status | Should -Be 'DONE'
        $result.FixRounds | Should -Be 1
    }

    It 'passes task JSON to TDD loop context' {
        $script:capturedContext = $null
        Mock Invoke-TddLoop {
            param($TestWriterFile, $CodeWriterFile, $TaskContext, $WorktreePath, $TaskId)
            $script:capturedContext = $TaskContext
            @{ Status = 'DONE'; Cycles = 1 }
        }
        Mock Invoke-CleanupLoop {
            @{ Passed = $true }
        }
        Mock Push-Location {}
        Mock Pop-Location {}
        Mock git { $global:LASTEXITCODE = 0 }
        Mock Invoke-ReviewRunner {
            @{ Passed = $true; Issues = @(); BlockingCount = 0 }
        }

        $taskWithDetails = @{
            id             = 'T4'
            title          = 'Suppression utility'
            files          = @('utils/suppress.ps1', 'utils/suppress.Tests.ps1')
            codeWriter     = 'typescript-writer'
            testWriter     = 'vitest-writer'
            dependencies   = @()
            addressesObjections = @('H9', 'D-1')
        }

        Invoke-TaskRunner `
            -Task $taskWithDetails `
            -ImplPlanMarkdown '# Full Plan Here' `
            -WorktreePath $script:wtDir `
            -AgentsDir $script:agentsDir `
            -MaxFixRounds 1

        # Context should contain structured task JSON
        $script:capturedContext | Should -Match '"id":\s*"T4"'
        $script:capturedContext | Should -Match '"title":\s*"Suppression utility"'
        $script:capturedContext | Should -Match 'suppress\.ps1'
        $script:capturedContext | Should -Match 'H9'
        # Context should also include the full plan
        $script:capturedContext | Should -Match 'Full Plan Here'
    }

    It 'throws when TDD loop fails' {
        Mock Invoke-TddLoop {
            @{ Status = 'FAILED'; Reason = 'green_failed' }
        }

        { Invoke-TaskRunner `
            -Task $script:task `
            -ImplPlanMarkdown '# Plan' `
            -WorktreePath $script:wtDir `
            -AgentsDir $script:agentsDir `
            -MaxFixRounds 3 } |
            Should -Throw '*TDD loop failed*'
    }

    It 'retries when cleanup fails' {
        $script:tddCallCount = 0
        Mock Invoke-TddLoop {
            $script:tddCallCount++
            @{ Status = 'DONE'; Cycles = 1 }
        }

        $script:cleanupCallCount = 0
        Mock Invoke-CleanupLoop {
            $script:cleanupCallCount++
            if ($script:cleanupCallCount -eq 1) {
                @{ Passed = $false; Pass = 1; FailedAt = 'lint'; Output = 'lint errors' }
            } else {
                @{ Passed = $true }
            }
        }

        Mock Push-Location {}
        Mock Pop-Location {}
        Mock git { $global:LASTEXITCODE = 0 }
        Mock Invoke-ReviewRunner {
            @{ Passed = $true; Issues = @(); BlockingCount = 0 }
        }

        $result = Invoke-TaskRunner `
            -Task $script:task `
            -ImplPlanMarkdown '# Plan' `
            -WorktreePath $script:wtDir `
            -AgentsDir $script:agentsDir `
            -MaxFixRounds 3

        $result.Status | Should -Be 'DONE'
        $result.FixRounds | Should -Be 2
    }

    It 'retries when review finds blocking issues' {
        Mock Invoke-TddLoop {
            @{ Status = 'DONE'; Cycles = 1 }
        }
        Mock Invoke-CleanupLoop {
            @{ Passed = $true }
        }
        Mock Push-Location {}
        Mock Pop-Location {}
        Mock git { $global:LASTEXITCODE = 0 }

        $script:reviewCallCount = 0
        Mock Invoke-ReviewRunner {
            $script:reviewCallCount++
            if ($script:reviewCallCount -eq 1) {
                @{
                    Passed = $false
                    BlockingCount = 1
                    Issues = @(
                        @{ severity = 'critical'; file = 'a.ts'; line = 1; issue = 'bug'; recommendation = 'fix it' }
                    )
                }
            } else {
                @{ Passed = $true; Issues = @(); BlockingCount = 0 }
            }
        }

        $result = Invoke-TaskRunner `
            -Task $script:task `
            -ImplPlanMarkdown '# Plan' `
            -WorktreePath $script:wtDir `
            -AgentsDir $script:agentsDir `
            -MaxFixRounds 3

        $result.Status | Should -Be 'DONE'
        $result.FixRounds | Should -Be 2
    }

    It 'throws after MaxFixRounds exceeded' {
        Mock Invoke-TddLoop {
            @{ Status = 'DONE'; Cycles = 1 }
        }
        Mock Invoke-CleanupLoop {
            @{ Passed = $false; Pass = 1; FailedAt = 'lint'; Output = 'errors' }
        }

        { Invoke-TaskRunner `
            -Task $script:task `
            -ImplPlanMarkdown '# Plan' `
            -WorktreePath $script:wtDir `
            -AgentsDir $script:agentsDir `
            -MaxFixRounds 2 } |
            Should -Throw '*Failed after 2 fix rounds*'
    }

    It 'throws when git commit fails' {
        Mock Invoke-TddLoop {
            @{ Status = 'DONE'; Cycles = 1 }
        }
        Mock Invoke-CleanupLoop {
            @{ Passed = $true }
        }
        Mock Push-Location {}
        Mock Pop-Location {}
        Mock git {
            if ($args[0] -eq 'commit') {
                $global:LASTEXITCODE = 1
            } else {
                $global:LASTEXITCODE = 0
            }
        }

        { Invoke-TaskRunner `
            -Task $script:task `
            -ImplPlanMarkdown '# Plan' `
            -WorktreePath $script:wtDir `
            -AgentsDir $script:agentsDir `
            -MaxFixRounds 2 } |
            Should -Throw '*git commit failed*'
    }
}
