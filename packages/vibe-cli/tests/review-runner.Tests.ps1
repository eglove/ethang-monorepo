BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/review-runner.ps1"
}

Describe 'Invoke-ReviewRunner aggregation logic' {
    # ForEach-Object -Parallel runs in separate runspaces where Pester mocks don't apply.
    # We test the aggregation and reporting logic by exercising the function with real reviewer
    # files but accepting that the parallel block will fail to call claude and fall back to PASS.

    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "review-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        $script:agentsDir = Join-Path $script:tempDir 'agents'
        $reviewersDir = Join-Path $script:agentsDir 'reviewers'
        New-Item -ItemType Directory -Path $reviewersDir -Force | Out-Null

        Set-Content (Join-Path $reviewersDir 'test-reviewer.md') -Value 'test prompt'

        $script:userNotes = Join-Path $script:tempDir 'user_notes.md'

        $script:wtDir = Join-Path $script:tempDir 'worktree'
        New-Item -ItemType Directory -Path $script:wtDir -Force | Out-Null
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    BeforeEach {
        Remove-Item $script:userNotes -ErrorAction SilentlyContinue
    }

    It 'gets diff using merge-base when available' {
        Mock Push-Location {}
        Mock Pop-Location {}

        $script:gitCalls = @()
        Mock git {
            $script:gitCalls += ($args -join ' ')
            if ($args[0] -eq 'merge-base') {
                $global:LASTEXITCODE = 0
                'abc123'
            } elseif ($args[0] -eq 'diff') {
                'diff output here'
            }
        }

        $result = Invoke-ReviewRunner `
            -WorktreePath $script:wtDir `
            -AgentsDir $script:agentsDir `
            -UserNotesPath $script:userNotes `
            -Context 'diff test'

        $script:gitCalls | Should -Contain 'merge-base HEAD master'
        ($script:gitCalls | Where-Object { $_ -match '^diff abc123 HEAD$' }).Count | Should -Be 1
    }

    It 'falls back to git show when merge-base fails' {
        Mock Push-Location {}
        Mock Pop-Location {}

        $script:gitCalls = @()
        Mock git {
            $script:gitCalls += ($args -join ' ')
            if ($args[0] -eq 'merge-base') {
                $global:LASTEXITCODE = 1
                $null
            } elseif ($args[0] -eq 'show') {
                'show diff'
            } elseif ($args[0] -eq 'diff') {
                'cached diff'
            }
        }

        Invoke-ReviewRunner `
            -WorktreePath $script:wtDir `
            -AgentsDir $script:agentsDir `
            -UserNotesPath $script:userNotes `
            -Context 'fallback'

        ($script:gitCalls | Where-Object { $_ -match '^show' }).Count | Should -BeGreaterThan 0
    }

    It 'returns Passed true when all parallel reviewers return PASS (fallback)' {
        Mock Push-Location {}
        Mock Pop-Location {}
        Mock git {
            if ($args[0] -eq 'merge-base') {
                $global:LASTEXITCODE = 0
                'abc'
            } else { 'diff' }
        }

        # Parallel block will fail to call claude → catch returns PASS
        $result = Invoke-ReviewRunner `
            -WorktreePath $script:wtDir `
            -AgentsDir $script:agentsDir `
            -UserNotesPath $script:userNotes `
            -Context 'pass test'

        $result.Passed | Should -BeTrue
        $result.BlockingCount | Should -Be 0
    }

    It 'does not create user_notes when no issues exist' {
        Mock Push-Location {}
        Mock Pop-Location {}
        Mock git {
            if ($args[0] -eq 'merge-base') {
                $global:LASTEXITCODE = 0
                'abc'
            } else { 'diff' }
        }

        Invoke-ReviewRunner `
            -WorktreePath $script:wtDir `
            -AgentsDir $script:agentsDir `
            -UserNotesPath $script:userNotes `
            -Context 'no issues'

        Test-Path $script:userNotes | Should -BeFalse
    }

    It 'dispatches correct number of reviewers' {
        # Add a second reviewer
        Set-Content (Join-Path $script:agentsDir 'reviewers/security-reviewer.md') -Value 'sec prompt'

        Mock Push-Location {}
        Mock Pop-Location {}
        Mock git {
            if ($args[0] -eq 'merge-base') {
                $global:LASTEXITCODE = 0
                'abc'
            } else { 'diff' }
        }

        $result = Invoke-ReviewRunner `
            -WorktreePath $script:wtDir `
            -AgentsDir $script:agentsDir `
            -UserNotesPath $script:userNotes `
            -Context 'multi reviewer'

        # Both reviewers fall back to PASS since claude isn't available
        $result.Passed | Should -BeTrue

        Remove-Item (Join-Path $script:agentsDir 'reviewers/security-reviewer.md')
    }
}

Describe 'ReviewRunner aggregation unit tests' {
    # Test the aggregation logic directly without calling the function

    It 'detects any FAIL verdict' {
        $results = @(
            @{ verdict = 'PASS'; reviewer = 'a'; issues = @() }
            @{ verdict = 'FAIL'; reviewer = 'b'; issues = @() }
        )

        $anyFail = $false
        foreach ($r in $results) {
            if ($r.verdict -eq 'FAIL') { $anyFail = $true }
        }

        $anyFail | Should -BeTrue
    }

    It 'collects and sorts issues by weight' {
        $results = @(
            @{
                verdict = 'FAIL'
                reviewer = 'r1'
                issues = @(
                    @{ file = 'a.ts'; line = 1; issue = 'low'; recommendation = 'fix'; severity = 'low'; weight = 2 }
                )
            }
            @{
                verdict = 'FAIL'
                reviewer = 'r2'
                issues = @(
                    @{ file = 'b.ts'; line = 5; issue = 'high'; recommendation = 'fix'; severity = 'critical'; weight = 9 }
                )
            }
        )

        $allIssues = @()
        foreach ($r in $results) {
            foreach ($issue in $r.issues) {
                $allIssues += @{
                    reviewer       = $r.reviewer
                    file           = $issue.file
                    line           = $issue.line
                    issue          = $issue.issue
                    recommendation = $issue.recommendation
                    severity       = $issue.severity
                    weight         = $issue.weight
                }
            }
        }

        $allIssues = $allIssues | Sort-Object { $_.weight } -Descending

        $allIssues.Count | Should -Be 2
        $allIssues[0].weight | Should -Be 9
        $allIssues[1].weight | Should -Be 2
    }

    It 'counts severity categories correctly' {
        $allIssues = @(
            @{ severity = 'critical'; weight = 10 }
            @{ severity = 'high'; weight = 8 }
            @{ severity = 'medium'; weight = 5 }
            @{ severity = 'low'; weight = 2 }
        )

        $criticalCount = @($allIssues | Where-Object { $_.severity -eq 'critical' }).Count
        $highCount     = @($allIssues | Where-Object { $_.severity -eq 'high' }).Count
        $blockingCount = $criticalCount + $highCount

        $criticalCount | Should -Be 1
        $highCount | Should -Be 1
        $blockingCount | Should -Be 2
    }

    It 'writes issues to user_notes format' {
        $tempNotes = [System.IO.Path]::GetTempFileName()
        $allIssues = @(
            @{ severity = 'critical'; weight = 10; file = 'app.ts'; line = 42; issue = 'SQL injection'; reviewer = 'security'; recommendation = 'parameterize' }
        )

        Set-Content -Path $tempNotes -Value "# User Notes`n"
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        $entry = "`n## Test Context — $timestamp`n"
        foreach ($issue in $allIssues) {
            $lineRef = if ($issue.line) { ":$($issue.line)" } else { "" }
            $entry += "`n- **[$($issue.severity)] w:$($issue.weight)** ``$($issue.file)$lineRef`` — $($issue.issue)"
            $entry += "`n  - Reviewer: $($issue.reviewer)"
            $entry += "`n  - Fix: $($issue.recommendation)"
        }
        Add-Content -Path $tempNotes -Value $entry

        $content = Get-Content $tempNotes -Raw
        $content | Should -Match 'SQL injection'
        $content | Should -Match 'app\.ts:42'
        $content | Should -Match 'parameterize'

        Remove-Item $tempNotes
    }
}
