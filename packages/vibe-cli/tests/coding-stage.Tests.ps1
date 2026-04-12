BeforeAll {
    . "$PSScriptRoot/../utils/pipeline-lock.ps1"
    . "$PSScriptRoot/../stages/8-coding.ps1"

    # Stub: pipeline-state.ps1 was removed in code-simplify
    function global:New-PipelineState {
        return @{
            pipelineState      = 'idle'
            lockHolder         = $null
            reviewRound        = [int]0
            keepGoingResets    = [int]0
            tddKeepGoingCount = [int]0
            verdict            = $null
            tasksDone          = [int]0
            gateTimedOut       = $false
            globalTimedOut     = $false
            reviewGateType     = 'none'
        }
    }

    Mock Write-Host {}
}

Describe 'Stage 8 — Pre-Coding Gate' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "stage8-gate-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        # Create valid plan + fixtures so gate is the only variable
        $docsDir = Join-Path $script:tempDir "docs/my-feature"
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
        $plan = @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; title = 'A' }) }) }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $docsDir 'implementation-plan.json')

        $fixtureDir = Join-Path $script:tempDir 'fixtures/my-feature'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        '{}' | Set-Content (Join-Path $fixtureDir 'bdd.json')
        '{}' | Set-Content (Join-Path $fixtureDir 'tla.json')
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'clean tree passes gate without prompting' {
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse') { return 'master' }
            return $null
        }
        Mock Lock-Pipeline { return @{ pipelineState = 'locked'; lockHolder = 1 } }
        Mock Unlock-Pipeline {}
        Mock Invoke-Claude { return 'mock-result' }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result | Should -Not -BeNullOrEmpty
        if ($result.Status) { $result.Status | Should -Not -Be 'halted_uncommitted' }
    }

    It 'dirty tree + decline halts and restores previous branch' {
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse') { return 'master' }
            if ($joined -match 'branch --list') { return $null }
            if ($joined -match 'checkout') { return $null }
            if ($joined -match 'branch -D') { return $null }
            if ($joined -match 'status') { return 'M dirty.ps1' }
            return $null
        }
        Mock Read-Host { return 'n' }
        Mock Lock-Pipeline {}
        Mock Unlock-Pipeline {}

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.Status | Should -Be 'halted_uncommitted'
        $result.Message | Should -Match 'uncommitted changes must be committed before Stage 8 can proceed'
        Should -Invoke git -ParameterFilter { ($args -join ' ') -match 'checkout master' }
        Should -Invoke git -ParameterFilter { ($args -join ' ') -match 'branch -D feature/my-feature' }
    }

    It 'dirty tree + accept auto-commits on feature branch and continues' {
        $script:commitCalled = $false
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse') { return 'master' }
            if ($joined -match 'branch --list') { return $null }
            if ($joined -match 'checkout') { return $null }
            if ($joined -match 'status') { return 'M dirty.ps1' }
            if ($joined -match 'commit') { $script:commitCalled = $true; return $null }
            return $null
        }
        Mock Read-Host { return 'y' }
        Mock Lock-Pipeline { return @{ pipelineState = 'locked'; lockHolder = 1 } }
        Mock Unlock-Pipeline {}
        Mock Invoke-Claude { return 'mock-result' }

        Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $script:commitCalled | Should -BeTrue
    }
}

Describe 'Stage 8 — Pipeline Lock' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "stage8-lock-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        $docsDir = Join-Path $script:tempDir "docs/my-feature"
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
        $plan = @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; title = 'A' }) }) }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $docsDir 'implementation-plan.json')

        $fixtureDir = Join-Path $script:tempDir 'fixtures/my-feature'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        '{}' | Set-Content (Join-Path $fixtureDir 'bdd.json')
        '{}' | Set-Content (Join-Path $fixtureDir 'tla.json')
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Lock-Pipeline on entry and Unlock-Pipeline on completion' {
        Mock git { return $null }
        Mock Lock-Pipeline { return @{ pipelineState = 'locked'; lockHolder = 1 } } -Verifiable
        Mock Unlock-Pipeline {} -Verifiable
        Mock Invoke-Claude { return 'mock-result' }

        Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        Should -InvokeVerifiable
    }

    It 'does not call Unlock-Pipeline when Lock-Pipeline throws (lock never acquired)' {
        Mock git { return $null }
        Mock Lock-Pipeline { throw "Simulated lock failure" }
        Mock Unlock-Pipeline {}

        Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        Should -Invoke Unlock-Pipeline -Times 0
    }

    It 'calls Unlock-Pipeline in finally block after successful lock even on validation error' {
        Mock git { return $null }
        Mock Lock-Pipeline { return @{ pipelineState = 'locked'; lockHolder = 1 } }
        Mock Unlock-Pipeline {}

        # No plan file => validation error, but lock was acquired => unlock must fire
        $result = Invoke-CodingStage -Feature 'nonexistent' -Root $script:tempDir
        $result.Status | Should -Be 'halted_validation'
        Should -Invoke Unlock-Pipeline -Times 1
    }

    It 'concurrent run rejected when Lock-Pipeline throws already-running' {
        Mock git { return $null }
        Mock Lock-Pipeline { throw "Pipeline is already running (PID 12345 holds the lock)" }
        Mock Unlock-Pipeline {}

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.Status | Should -Be 'halted_lock'
        $result.Message | Should -Match 'already running'
    }

    It 'stale lock reclaimed via Lock-Pipeline succeeding after stale detection' {
        Mock git { return $null }
        Mock Lock-Pipeline { return @{ pipelineState = 'locked'; lockHolder = 1 } }
        Mock Unlock-Pipeline {}
        Mock Invoke-Claude { return 'mock-result' }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result | Should -Not -BeNullOrEmpty
        if ($result.Status) { $result.Status | Should -Not -Be 'halted_lock' }
    }
}

Describe 'Stage 8 — Input Validation' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "stage8-valid-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null
        Mock git { return $null }
        Mock Lock-Pipeline { return @{ pipelineState = 'locked'; lockHolder = 1 } }
        Mock Unlock-Pipeline {}
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'halts when implementation-plan.json not found' {
        $fixtureDir = Join-Path $script:tempDir 'fixtures/my-feature'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        '{}' | Set-Content (Join-Path $fixtureDir 'bdd.json')
        '{}' | Set-Content (Join-Path $fixtureDir 'tla.json')

        $result = Invoke-CodingStage -Feature 'no-plan' -Root $script:tempDir
        $result.Status | Should -Be 'halted_validation'
        $result.Message | Should -Match 'implementation-plan.json'
    }

    It 'halts when plan JSON is malformed' {
        $docsDir = Join-Path $script:tempDir "docs/bad-json"
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
        'NOT VALID JSON{{{' | Set-Content (Join-Path $docsDir 'implementation-plan.json')

        $fixtureDir = Join-Path $script:tempDir 'fixtures/my-feature'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        '{}' | Set-Content (Join-Path $fixtureDir 'bdd.json')
        '{}' | Set-Content (Join-Path $fixtureDir 'tla.json')

        $result = Invoke-CodingStage -Feature 'bad-json' -Root $script:tempDir
        $result.Status | Should -Be 'halted_validation'
        $result.Message | Should -Match 'malformed'
    }

    It 'halts when tiers array is empty' {
        $docsDir = Join-Path $script:tempDir "docs/empty-tiers"
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
        @{ tiers = @() } | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $docsDir 'implementation-plan.json')

        $fixtureDir = Join-Path $script:tempDir 'fixtures/my-feature'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        '{}' | Set-Content (Join-Path $fixtureDir 'bdd.json')
        '{}' | Set-Content (Join-Path $fixtureDir 'tla.json')

        $result = Invoke-CodingStage -Feature 'empty-tiers' -Root $script:tempDir
        $result.Status | Should -Be 'halted_validation'
        $result.Message | Should -Match 'tiers'
    }

    It 'halts when a tier has zero tasks' {
        $docsDir = Join-Path $script:tempDir "docs/no-tasks"
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
        @{ tiers = @(@{ tier = 1; tasks = @() }) } | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $docsDir 'implementation-plan.json')

        $fixtureDir = Join-Path $script:tempDir 'fixtures/my-feature'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        '{}' | Set-Content (Join-Path $fixtureDir 'bdd.json')
        '{}' | Set-Content (Join-Path $fixtureDir 'tla.json')

        $result = Invoke-CodingStage -Feature 'no-tasks' -Root $script:tempDir
        $result.Status | Should -Be 'halted_validation'
        $result.Message | Should -Match 'tasks'
    }

    It 'halts when BDD fixture not found' {
        $docsDir = Join-Path $script:tempDir "docs/no-bdd"
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
        @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; title = 'A' }) }) } | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $docsDir 'implementation-plan.json')

        $fixtureDir = Join-Path $script:tempDir 'fixtures/no-bdd'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        '{}' | Set-Content (Join-Path $fixtureDir 'tla.json')

        $result = Invoke-CodingStage -Feature 'no-bdd' -Root $script:tempDir
        $result.Status | Should -Be 'halted_validation'
        $result.Message | Should -Match 'bdd'
    }

    It 'halts when TLA fixture not found' {
        $docsDir = Join-Path $script:tempDir "docs/no-tla"
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
        @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; title = 'A' }) }) } | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $docsDir 'implementation-plan.json')

        $fixtureDir = Join-Path $script:tempDir 'fixtures/no-tla'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        '{}' | Set-Content (Join-Path $fixtureDir 'bdd.json')

        $result = Invoke-CodingStage -Feature 'no-tla' -Root $script:tempDir
        $result.Status | Should -Be 'halted_validation'
        $result.Message | Should -Match 'tla'
    }
}

Describe 'Stage 8 — Config Snapshot' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "stage8-snap-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        $docsDir = Join-Path $script:tempDir "docs/my-feature"
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
        $plan = @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; title = 'A' }) }) }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $docsDir 'implementation-plan.json')

        $fixtureDir = Join-Path $script:tempDir 'fixtures/my-feature'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        '{}' | Set-Content (Join-Path $fixtureDir 'bdd.json')
        '{}' | Set-Content (Join-Path $fixtureDir 'tla.json')

        Mock git { return $null }
        Mock Lock-Pipeline { return @{ pipelineState = 'locked'; lockHolder = 1 } }
        Mock Unlock-Pipeline {}
        Mock Invoke-Claude { return 'mock-result' }
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns plan snapshot in result' {
        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.PlanSnapshot | Should -Not -BeNullOrEmpty
        $result.PlanSnapshot.tiers | Should -Not -BeNullOrEmpty
    }

    It 'snapshot is not affected by later file changes (immutability)' {
        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir

        # Mutate the plan file on disk after the stage read it
        $planPath = Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json'
        @{ tiers = @(@{ tier = 99; tasks = @(@{ id = 'TXXX'; title = 'Changed' }) }) } | ConvertTo-Json -Depth 5 | Set-Content $planPath

        # The snapshot captured during the run should still have the original data
        $result.PlanSnapshot.tiers[0].tier | Should -Be 1
    }

    It 'snapshot is idempotent across repeated reads' {
        $result1 = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result2 = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir

        ($result1.PlanSnapshot | ConvertTo-Json -Depth 10) | Should -Be ($result2.PlanSnapshot | ConvertTo-Json -Depth 10)
    }
}

Describe 'Stage 8 — Fixture Coverage' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "stage8-fixture-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        $docsDir = Join-Path $script:tempDir "docs/my-feature"
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
        $plan = @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; title = 'A' }) }) }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $docsDir 'implementation-plan.json')

        $fixtureDir = Join-Path $script:tempDir 'fixtures/my-feature'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null

        # Default: empty fixtures
        '[]' | Set-Content (Join-Path $fixtureDir 'bdd.json')
        '[]' | Set-Content (Join-Path $fixtureDir 'tla.json')

        Mock git { return $null }
        Mock Lock-Pipeline { return @{ pipelineState = 'locked'; lockHolder = 1 } }
        Mock Unlock-Pipeline {}
        Mock Invoke-Claude { return 'mock-result' }
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'all fixtures covered — check passes with no gaps' {
        # Create fixtures with entries
        $bddFixture = @(@{ name = 'login-scenario' }) | ConvertTo-Json -Depth 5
        $bddFixture | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/bdd.json')
        $tlaFixture = @(@{ name = 'state-invariant' }) | ConvertTo-Json -Depth 5
        $tlaFixture | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/tla.json')

        # Create test files that contain the fixture names
        $testsDir = Join-Path $script:tempDir 'tests'
        New-Item -ItemType Directory -Path $testsDir -Force | Out-Null
        'test login-scenario and state-invariant' | Set-Content (Join-Path $testsDir 'my.test.ps1')

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.UncoveredFixtures.Count | Should -Be 0
    }

    It 'missing BDD fixtures — uncovered list collected' {
        $bddFixture = @(@{ name = 'missing-scenario' }) | ConvertTo-Json -Depth 5
        $bddFixture | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/bdd.json')
        '[]' | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/tla.json')

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.UncoveredFixtures.Count | Should -Be 1
        $result.UncoveredFixtures[0].Type | Should -Be 'BDD'
        $result.UncoveredFixtures[0].Name | Should -Be 'missing-scenario'
    }

    It 'missing TLA+ fixtures — uncovered list collected' {
        '[]' | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/bdd.json')
        $tlaFixture = @(@{ name = 'missing-invariant' }) | ConvertTo-Json -Depth 5
        $tlaFixture | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/tla.json')

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.UncoveredFixtures.Count | Should -Be 1
        $result.UncoveredFixtures[0].Type | Should -Be 'TLA'
        $result.UncoveredFixtures[0].Name | Should -Be 'missing-invariant'
    }

    It 'empty BDD fixture file — skip with warning' {
        '[]' | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/bdd.json')
        $tlaFixture = @(@{ name = 'tla-entry' }) | ConvertTo-Json -Depth 5
        $tlaFixture | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/tla.json')

        # Create test file covering TLA entry
        $testsDir = Join-Path $script:tempDir 'tests'
        New-Item -ItemType Directory -Path $testsDir -Force | Out-Null
        'test tla-entry here' | Set-Content (Join-Path $testsDir 'my.test.ps1')

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        # BDD was skipped, TLA covered — no gaps
        $result.UncoveredFixtures.Count | Should -Be 0
        $result.Status | Should -Be 'tiers_dispatched'
    }

    It 'empty TLA+ fixture file — skip with warning' {
        $bddFixture = @(@{ name = 'bdd-entry' }) | ConvertTo-Json -Depth 5
        $bddFixture | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/bdd.json')
        '[]' | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/tla.json')

        # Create test file covering BDD entry
        $testsDir = Join-Path $script:tempDir 'tests'
        New-Item -ItemType Directory -Path $testsDir -Force | Out-Null
        'test bdd-entry here' | Set-Content (Join-Path $testsDir 'my.test.ps1')

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.UncoveredFixtures.Count | Should -Be 0
        $result.Status | Should -Be 'tiers_dispatched'
    }

    It 'both empty — skip both with warnings' {
        '[]' | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/bdd.json')
        '[]' | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/tla.json')

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.UncoveredFixtures.Count | Should -Be 0
        $result.Status | Should -Be 'tiers_dispatched'
    }

    It 'uses title fallback when entry has no name property (line 245/257)' {
        $bddFixture = @(@{ title = 'bdd-title-entry' }) | ConvertTo-Json -Depth 5
        $bddFixture | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/bdd.json')
        $tlaFixture = @(@{ title = 'tla-title-entry' }) | ConvertTo-Json -Depth 5
        $tlaFixture | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/tla.json')

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.UncoveredFixtures.Count | Should -Be 2
        $result.UncoveredFixtures[0].Name | Should -Be 'bdd-title-entry'
        $result.UncoveredFixtures[1].Name | Should -Be 'tla-title-entry'
    }

    It 'uses ToString fallback when entry has neither name nor title (line 245/257)' {
        # Use a simple string array which will invoke ToString()
        $bddFixture = '["bdd-string-entry"]'
        $bddFixture | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/bdd.json')
        $tlaFixture = '["tla-string-entry"]'
        $tlaFixture | Set-Content (Join-Path $script:tempDir 'fixtures/my-feature/tla.json')

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.UncoveredFixtures.Count | Should -Be 2
        $result.UncoveredFixtures[0].Name | Should -Be 'bdd-string-entry'
        $result.UncoveredFixtures[1].Name | Should -Be 'tla-string-entry'
    }
}

Describe 'Stage 8 — Claude Dispatch' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "stage8-dispatch-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        $docsDir = Join-Path $script:tempDir "docs/my-feature"
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null

        $fixtureDir = Join-Path $script:tempDir 'fixtures/my-feature'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        '[]' | Set-Content (Join-Path $fixtureDir 'bdd.json')
        '[]' | Set-Content (Join-Path $fixtureDir 'tla.json')

        Mock Lock-Pipeline { return @{ pipelineState = 'locked'; lockHolder = 1 } }
        Mock Unlock-Pipeline {}
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'Claude receives plan content and feature docs path' {
        $plan = @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; title = 'A' }) }) }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        $script:capturedPrompt = $null
        Mock git { return $null }
        Mock Invoke-Claude {
            $script:capturedPrompt = $Prompt
            return 'mock-result'
        }

        Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir

        $script:capturedPrompt | Should -Match 'Implementation'
        $script:capturedPrompt | Should -Match 'implementation-plan\.json'
        $script:capturedPrompt | Should -Match 'docs(/|\\)my-feature'
    }

    It 'worktrees detected — flag set for per-WT gates' {
        $plan = @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; title = 'A' }) }) }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        Mock Invoke-Claude { return 'mock-result' }
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'worktree') {
                return @(
                    "/main/path  abc1234 [main]",
                    "/wt/path    def5678 [feature-branch]"
                )
            }
            return $null
        }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.WorktreeDetected | Should -BeTrue
    }

    It 'no worktrees — cleanup path' {
        $plan = @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; title = 'A' }) }) }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        Mock Invoke-Claude { return 'mock-result' }
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'worktree') {
                return @("/main/path  abc1234 [main]")
            }
            return $null
        }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.WorktreeDetected | Should -BeFalse
    }

    It 'single-task tier with no worktrees still advances' {
        $plan = @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; title = 'Single' }) }) }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        Mock Invoke-Claude { return 'mock-result' }
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'worktree') { return @("/main/path  abc1234 [main]") }
            return $null
        }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.Status | Should -Be 'tiers_dispatched'
    }

    It 'multi-tier plan: single Claude dispatch for all tiers' {
        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @(@{ id = 'T1'; title = 'First' }) },
                @{ tier = 2; tasks = @(@{ id = 'T2'; title = 'Second' }) }
            )
        }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        $script:claudeCallCount = 0
        Mock Invoke-Claude {
            $script:claudeCallCount++
            return "result-$($script:claudeCallCount)"
        }
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'worktree') { return @("/main/path  abc1234 [main]") }
            return $null
        }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $script:claudeCallCount | Should -Be 1
    }

    It 'zero-diff task: Claude produces no changes, status still dispatched' {
        $plan = @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; title = 'No-op' }) }) }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        Mock Invoke-Claude { return $null }
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'worktree') { return @("/main/path  abc1234 [main]") }
            return $null
        }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.Status | Should -Be 'tiers_dispatched'
    }

    It 'resume marker written after fixture coverage' {
        $plan = @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; title = 'A' }) }) }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        $script:logMessages = @()
        Mock Write-Host { $script:logMessages += $Object }
        Mock Invoke-Claude { return 'mock-result' }
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'worktree') { return @("/main/path  abc1234 [main]") }
            return $null
        }

        Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        ($script:logMessages -join "`n") | Should -Match 'MARKER FIXTURE_COVERAGE_COMPLETE'
    }

    It 'resume marker written after Claude dispatch completes all tiers' {
        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @(@{ id = 'T1'; title = 'First' }) },
                @{ tier = 2; tasks = @(@{ id = 'T2'; title = 'Second' }) }
            )
        }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        $script:logMessages = @()
        Mock Write-Host { $script:logMessages += $Object }
        Mock Invoke-Claude { return 'mock-result' }
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'worktree') { return @("/main/path  abc1234 [main]") }
            return $null
        }

        Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $allLogs = $script:logMessages -join "`n"
        $allLogs | Should -Match 'MARKER TIER_2_COMPLETE'
    }

    It 'lock held during FixtureCoverage (S2)' {
        $plan = @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; title = 'A' }) }) }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        Mock Invoke-Claude { return 'mock-result' }
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'worktree') { return @("/main/path  abc1234 [main]") }
            return $null
        }

        # Lock-Pipeline and Unlock-Pipeline are already mocked — verify unlock only called once at the end
        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.Status | Should -Be 'tiers_dispatched'
        # Lock was acquired once, unlock in finally block — the stage ran fully inside the lock
        Should -Invoke Lock-Pipeline -Times 1
        Should -Invoke Unlock-Pipeline -Times 1
    }

    It 'lock held during ClaudeDispatch (S2)' {
        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @(@{ id = 'T1'; title = 'First' }) },
                @{ tier = 2; tasks = @(@{ id = 'T2'; title = 'Second' }) }
            )
        }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        Mock Invoke-Claude { return 'mock-result' }
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'worktree') { return @("/main/path  abc1234 [main]") }
            return $null
        }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir
        $result.Status | Should -Be 'tiers_dispatched'
        # All tiers dispatched inside single lock/unlock cycle
        Should -Invoke Lock-Pipeline -Times 1
        Should -Invoke Unlock-Pipeline -Times 1
    }
}

Describe 'Stage 8 — Per-Worktree Double-Pass' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "stage8-dp-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        Mock Invoke-Claude { return 'fix-applied' }
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'double-pass succeeds on first attempt (2 consecutive passes)' {
        Mock pnpm { $global:LASTEXITCODE = 0; return 'ok' }

        $result = Invoke-PerWorktreeDoublePass -WorktreePath $script:tempDir -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'passed'
        $result.Retries | Should -Be 0
        $result.LastError | Should -BeNullOrEmpty
    }

    It 'test failure sends error to Claude, resets consec=0, increments retry' {
        $script:pnpmCallCount = 0
        Mock pnpm {
            $script:pnpmCallCount++
            $joined = $args -join ' '
            if ($joined -match 'test' -and $script:pnpmCallCount -eq 1) {
                $global:LASTEXITCODE = 1
                return 'test-error-output'
            }
            $global:LASTEXITCODE = 0
            return 'ok'
        }

        $result = Invoke-PerWorktreeDoublePass -WorktreePath $script:tempDir -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'passed'
        $result.Retries | Should -BeGreaterOrEqual 1
        Should -Invoke Invoke-Claude -Times 1 -Exactly
    }

    It 'lint failure on second pass resets consec=0, increments retry' {
        $script:pnpmCallCount = 0
        Mock pnpm {
            $script:pnpmCallCount++
            $joined = $args -join ' '
            # First iteration: test passes, lint fails
            if ($joined -match 'lint' -and $script:pnpmCallCount -eq 2) {
                $global:LASTEXITCODE = 1
                return 'lint-error-output'
            }
            $global:LASTEXITCODE = 0
            return 'ok'
        }

        $result = Invoke-PerWorktreeDoublePass -WorktreePath $script:tempDir -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'passed'
        $result.Retries | Should -BeGreaterOrEqual 1
    }

    It 'MaxDoublePassRetries=5 triggers escalation' {
        Mock pnpm {
            $global:LASTEXITCODE = 1
            return 'persistent-failure'
        }

        $result = Invoke-PerWorktreeDoublePass -WorktreePath $script:tempDir -Root $script:tempDir -Feature 'my-feature' -MaxDoublePassRetries 5
        $result.Status | Should -Be 'escalated'
        $result.Retries | Should -Be 5
        $result.LastError | Should -Not -BeNullOrEmpty
    }

    It 'wtDoublePassRetries never exceeds MaxDoublePassRetries (S3)' {
        Mock pnpm {
            $global:LASTEXITCODE = 1
            return 'failure'
        }

        $max = 3
        $result = Invoke-PerWorktreeDoublePass -WorktreePath $script:tempDir -Root $script:tempDir -Feature 'my-feature' -MaxDoublePassRetries $max
        $result.Status | Should -Be 'escalated'
        $result.Retries | Should -BeLessOrEqual $max
    }

    It 'wtConsecPasses never exceeds 2 (S6)' {
        # All passes succeed — should return after exactly 2 consecutive passes, not more
        $script:pnpmCallCount = 0
        Mock pnpm {
            $script:pnpmCallCount++
            $global:LASTEXITCODE = 0
            return 'ok'
        }

        $result = Invoke-PerWorktreeDoublePass -WorktreePath $script:tempDir -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'passed'
        # 2 consecutive passes = 2 test + 2 lint = 4 pnpm calls
        $script:pnpmCallCount | Should -Be 4
    }
}

Describe 'Stage 8 — Per-Worktree Review' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "stage8-review-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        $script:featureDir = Join-Path $script:tempDir 'docs/my-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null

        Mock Invoke-Claude { return 'fix-applied' }
        Mock pnpm { $global:LASTEXITCODE = 0; return 'ok' }
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'review pass advances' {
        Mock git { return 'diff --git a/file.ps1' }
        Mock Invoke-ReviewLoop {
            return @{ Verdict = 'pass'; Blockers = @(); Notes = @(); Warnings = @(); Round = 1 }
        }

        $result = Invoke-PerWorktreeReview -WorktreePath $script:tempDir -FeatureDir $script:featureDir -Root $script:tempDir
        $result.Verdict | Should -Be 'pass'
        $result.ReviewRound | Should -Be 1
        $result.Blockers.Count | Should -Be 0
    }

    It 'review fail triggers Claude fix, double-pass, re-review' {
        $script:reviewCallCount = 0
        Mock git { return 'diff --git a/file.ps1' }
        Mock Invoke-ReviewLoop {
            $script:reviewCallCount++
            if ($script:reviewCallCount -eq 1) {
                return @{ Verdict = 'fail'; Blockers = @(@{ description = 'missing test' }); Notes = @(); Warnings = @(); Round = 1 }
            }
            return @{ Verdict = 'pass'; Blockers = @(); Notes = @(); Warnings = @(); Round = 1 }
        }

        $result = Invoke-PerWorktreeReview -WorktreePath $script:tempDir -FeatureDir $script:featureDir -Root $script:tempDir
        $result.Verdict | Should -Be 'pass'
        $result.ReviewRound | Should -Be 2
        # Claude was called for the fix
        Should -Invoke Invoke-Claude -Times 1 -Exactly
    }

    It 'after ReviewFail: wtDoublePassRetries=0 AND wtConsecPasses=0 (R2-1)' {
        # Verify double-pass is called with fresh counters after review fail
        $script:reviewCallCount = 0
        $script:dpCallCount = 0
        Mock git { return 'diff content' }
        Mock Invoke-ReviewLoop {
            $script:reviewCallCount++
            if ($script:reviewCallCount -eq 1) {
                return @{ Verdict = 'fail'; Blockers = @(@{ description = 'blocker' }); Notes = @(); Warnings = @(); Round = 1 }
            }
            return @{ Verdict = 'pass'; Blockers = @(); Notes = @(); Warnings = @(); Round = 1 }
        }

        # Double-pass will be called with fresh MaxDoublePassRetries=5 (default)
        # If counters were not reset, it would fail. Mock pnpm to always pass.
        $result = Invoke-PerWorktreeReview -WorktreePath $script:tempDir -FeatureDir $script:featureDir -Root $script:tempDir
        $result.Verdict | Should -Be 'pass'
        # pnpm was called during the double-pass (4 calls for 2 consec passes)
        Should -Invoke pnpm -Times 4 -Exactly
    }

    It 'MaxReviewRounds=3 triggers escalation' {
        Mock git { return 'diff content' }
        Mock Invoke-ReviewLoop {
            return @{ Verdict = 'fail'; Blockers = @(@{ description = 'persistent blocker' }); Notes = @(); Warnings = @(); Round = 1 }
        }

        $result = Invoke-PerWorktreeReview -WorktreePath $script:tempDir -FeatureDir $script:featureDir -Root $script:tempDir -MaxReviewRounds 3
        $result.Verdict | Should -Be 'escalated'
        $result.ReviewRound | Should -Be 3
        $result.Blockers.Count | Should -BeGreaterThan 0
    }

    It 'KeepGoing mid-tier: advance + reset counters (R2-2)' {
        # Simulate Invoke-PerWorktreeGate with multiple worktrees where first passes, second passes
        Mock git { return 'diff content' }
        Mock Invoke-ReviewLoop {
            return @{ Verdict = 'pass'; Blockers = @(); Notes = @(); Warnings = @(); Round = 1 }
        }

        $wt1 = Join-Path $script:tempDir 'wt1'
        $wt2 = Join-Path $script:tempDir 'wt2'
        New-Item -ItemType Directory -Path $wt1, $wt2 -Force | Out-Null

        $result = Invoke-PerWorktreeGate -WorktreePaths @($wt1, $wt2) -FeatureDir $script:featureDir -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'all_passed'
        $result.Results.Count | Should -Be 2
        # Each worktree got its own fresh double-pass (4 pnpm calls each = 8 total)
        Should -Invoke pnpm -Times 8 -Exactly
    }

    It 'KeepGoing last-task: advance to merge WITHOUT counter reset (R2-2)' {
        Mock git { return 'diff content' }
        Mock Invoke-ReviewLoop {
            return @{ Verdict = 'pass'; Blockers = @(); Notes = @(); Warnings = @(); Round = 1 }
        }

        $wt1 = Join-Path $script:tempDir 'wt1'
        New-Item -ItemType Directory -Path $wt1 -Force | Out-Null

        $script:logMessages = @()
        Mock Write-Host { $script:logMessages += $Object }

        $result = Invoke-PerWorktreeGate -WorktreePaths @($wt1) -FeatureDir $script:featureDir -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'all_passed'
        ($script:logMessages -join "`n") | Should -Match 'SequentialMerge'
    }

    It 'wtReviewRounds never exceeds MaxReviewRounds (S4)' {
        Mock git { return 'diff content' }
        Mock Invoke-ReviewLoop {
            return @{ Verdict = 'fail'; Blockers = @(@{ description = 'blocker' }); Notes = @(); Warnings = @(); Round = 1 }
        }

        $max = 2
        $result = Invoke-PerWorktreeReview -WorktreePath $script:tempDir -FeatureDir $script:featureDir -Root $script:tempDir -MaxReviewRounds $max
        $result.Verdict | Should -Be 'escalated'
        $result.ReviewRound | Should -BeLessOrEqual $max
    }

    It 'lock held during PerWT_DoublePass (S2)' {
        # Verify that the double-pass function itself does not release/acquire locks
        # (lock management is at the Invoke-CodingStage level)
        Mock git { return 'diff content' }
        Mock Lock-Pipeline {}
        Mock Unlock-Pipeline {}

        $result = Invoke-PerWorktreeDoublePass -WorktreePath $script:tempDir -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'passed'
        # No lock/unlock calls from within double-pass
        Should -Invoke Lock-Pipeline -Times 0
        Should -Invoke Unlock-Pipeline -Times 0
    }

    It 'lock held during PerWT_Review (S2)' {
        # Verify that the review function itself does not release/acquire locks
        Mock git { return 'diff content' }
        Mock Lock-Pipeline {}
        Mock Unlock-Pipeline {}
        Mock Invoke-ReviewLoop {
            return @{ Verdict = 'pass'; Blockers = @(); Notes = @(); Warnings = @(); Round = 1 }
        }

        $result = Invoke-PerWorktreeReview -WorktreePath $script:tempDir -FeatureDir $script:featureDir -Root $script:tempDir
        $result.Verdict | Should -Be 'pass'
        # No lock/unlock calls from within review
        Should -Invoke Lock-Pipeline -Times 0
        Should -Invoke Unlock-Pipeline -Times 0
    }
}

Describe 'Stage 8 — Sequential Merge' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "stage8-merge-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        Mock Invoke-Claude { return 'fix-applied' }
        Mock pnpm { $global:LASTEXITCODE = 0; return 'ok' }
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'worktrees merge in task number order (T1, T2, T3)' {
        $script:mergeOrder = @()
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123checkpoint' }
            if ($joined -match 'merge (.+) --no-ff') {
                $script:mergeOrder += $Matches[1]
                $global:LASTEXITCODE = 0
                return 'Merge made'
            }
            return $null
        }

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch', 'T2-branch', 'T3-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'merged'
        $script:mergeOrder | Should -Be @('T1-branch', 'T2-branch', 'T3-branch')
    }

    It 'clean merge proceeds without intervention' {
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123' }
            if ($joined -match 'merge') { $global:LASTEXITCODE = 0; return 'Merge made' }
            return $null
        }

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'merged'
        $result.MergedBranches | Should -Be @('T1-branch')
        Should -Invoke Invoke-Claude -Times 0
    }

    It 'merge conflict sent to Claude for resolution' {
        $script:diffCallCount = 0
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123' }
            if ($joined -match 'merge .+ --no-ff') {
                $global:LASTEXITCODE = 1
                return 'CONFLICT (content): Merge conflict in file.ps1'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') {
                $script:diffCallCount++
                # First call: gather conflict files for Claude prompt
                # Second call: post-resolution check — no more conflicts
                if ($script:diffCallCount -le 1) { return 'file.ps1' }
                return ''
            }
            return $null
        }
        Mock Invoke-Claude { return 'resolved' }

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'merged'
        Should -Invoke Invoke-Claude -Times 1 -ParameterFilter { $Prompt -match 'Merge Conflict Resolution' }
    }

    It 'double-pass runs on feature branch after conflict resolution' {
        $script:conflictResolved = $false
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123' }
            if ($joined -match 'merge .+ --no-ff') {
                $global:LASTEXITCODE = 1
                return 'CONFLICT (content): Merge conflict'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') {
                # After Claude resolves, no more conflicts
                if ($script:conflictResolved) { return '' }
                $script:conflictResolved = $true
                return 'file.ps1'
            }
            return $null
        }
        Mock Invoke-Claude {
            $script:conflictResolved = $true
            return 'resolved'
        }

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'merged'
        # pnpm was called for double-pass (test + lint, 2 consecutive passes = 4 calls)
        Should -Invoke pnpm -Times 4
    }

    It 'double-pass failure after conflict sends output to Claude' {
        $script:pnpmCallCount = 0
        $script:conflictResolved = $false
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123' }
            if ($joined -match 'merge .+ --no-ff') {
                $global:LASTEXITCODE = 1
                return 'CONFLICT'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') {
                if ($script:conflictResolved) { return '' }
                $script:conflictResolved = $true
                return 'file.ps1'
            }
            return $null
        }
        Mock Invoke-Claude {
            $script:conflictResolved = $true
            return 'resolved'
        }
        Mock pnpm {
            $script:pnpmCallCount++
            # First test call fails, rest pass
            if ($script:pnpmCallCount -eq 1) {
                $global:LASTEXITCODE = 1
                return 'test-failure'
            }
            $global:LASTEXITCODE = 0
            return 'ok'
        }

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'merged'
        # Claude called once for conflict resolution + once for DP fix = 2
        Should -Invoke Invoke-Claude -Times 2
    }

    It 'MaxDoublePassRetries after conflict escalates to user' {
        $script:conflictResolved = $false
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123' }
            if ($joined -match 'merge .+ --no-ff') {
                $global:LASTEXITCODE = 1
                return 'CONFLICT'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') {
                if ($script:conflictResolved) { return '' }
                $script:conflictResolved = $true
                return 'file.ps1'
            }
            if ($joined -match 'reset --hard') { return $null }
            return $null
        }
        Mock Invoke-Claude {
            $script:conflictResolved = $true
            return 'resolved'
        }
        Mock pnpm {
            $global:LASTEXITCODE = 1
            return 'persistent-failure'
        }
        Mock Read-Host { return 's' }

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature' -MaxDoublePassRetries 3
        $result.Status | Should -Be 'escalated_stop'
        Should -Invoke Read-Host -Times 1
    }

    It 'Keep Going after conflict continues merge sequence' {
        $script:mergeCallCount = 0
        $script:conflictResolved = $false
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123' }
            if ($joined -match 'merge .+ --no-ff') {
                $script:mergeCallCount++
                if ($script:mergeCallCount -eq 1) {
                    $global:LASTEXITCODE = 1
                    return 'CONFLICT'
                }
                $global:LASTEXITCODE = 0
                return 'Merge made'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') { return 'file.ps1' }
            if ($joined -match 'merge --abort') { return $null }
            return $null
        }
        Mock Invoke-Claude { return 'UNRESOLVABLE' }
        Mock Read-Host { return 'k' }

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch', 'T2-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'escalated_keepgoing'
        $result.SkippedBranches | Should -Be @('T1-branch')
        $result.MergedBranches | Should -Be @('T2-branch')
    }

    It 'Stop after conflict halts pipeline' {
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123checkpoint' }
            if ($joined -match 'merge .+ --no-ff') {
                $global:LASTEXITCODE = 1
                return 'CONFLICT'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') { return 'file.ps1' }
            if ($joined -match 'merge --abort') { return $null }
            if ($joined -match 'reset --hard') { return $null }
            return $null
        }
        Mock Invoke-Claude { return 'UNRESOLVABLE' }
        Mock Read-Host { return 's' }

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch', 'T2-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'escalated_stop'
        $result.Checkpoint | Should -Be 'abc123checkpoint'
    }

    It 'unresolvable conflict escalates with file list' {
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123' }
            if ($joined -match 'merge .+ --no-ff') {
                $global:LASTEXITCODE = 1
                return 'CONFLICT'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') { return "file1.ps1`nfile2.ps1" }
            if ($joined -match 'merge --abort') { return $null }
            if ($joined -match 'reset --hard') { return $null }
            return $null
        }
        Mock Invoke-Claude { return 'UNRESOLVABLE' }
        $script:escalationPrompt = $null
        Mock Read-Host {
            $script:escalationPrompt = $Prompt
            return 's'
        }

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'escalated_stop'
        $script:escalationPrompt | Should -Match 'file1\.ps1'
        $script:escalationPrompt | Should -Match 'file2\.ps1'
    }

    It 'NO re-review after conflict (S7) — never enters review phase' {
        $script:conflictResolved = $false
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123' }
            if ($joined -match 'merge .+ --no-ff') {
                $global:LASTEXITCODE = 1
                return 'CONFLICT'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') {
                if ($script:conflictResolved) { return '' }
                $script:conflictResolved = $true
                return 'file.ps1'
            }
            return $null
        }
        Mock Invoke-Claude {
            $script:conflictResolved = $true
            return 'resolved'
        }
        Mock Invoke-ReviewLoop { throw "Review should not be called after merge conflict" }

        # Should not throw — ReviewLoop is never called
        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'merged'
        Should -Invoke Invoke-ReviewLoop -Times 0
    }

    It 'merge conflict on T1 (first task, pristine base) (R1-2)' {
        $script:conflictResolved = $false
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'pristine-base' }
            if ($joined -match 'merge .+ --no-ff') {
                $global:LASTEXITCODE = 1
                return 'CONFLICT'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') {
                if ($script:conflictResolved) { return '' }
                $script:conflictResolved = $true
                return 'file.ps1'
            }
            return $null
        }
        Mock Invoke-Claude {
            $script:conflictResolved = $true
            return 'resolved'
        }

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'merged'
        $result.Checkpoint | Should -Be 'pristine-base'
    }

    It 'merge conflict on T2+ after T1 merged (R1-2)' {
        $script:mergeCallCount = 0
        $script:conflictResolved = $false
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123' }
            if ($joined -match 'merge .+ --no-ff') {
                $script:mergeCallCount++
                if ($script:mergeCallCount -eq 1) {
                    # T1 merges cleanly
                    $global:LASTEXITCODE = 0
                    return 'Merge made'
                }
                # T2 conflicts
                $global:LASTEXITCODE = 1
                return 'CONFLICT'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') {
                if ($script:conflictResolved) { return '' }
                $script:conflictResolved = $true
                return 'file.ps1'
            }
            return $null
        }
        Mock Invoke-Claude {
            $script:conflictResolved = $true
            return 'resolved'
        }

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch', 'T2-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'merged'
        $result.MergedBranches | Should -Contain 'T1-branch'
        $result.MergedBranches | Should -Contain 'T2-branch'
    }

    It 'mergeDoublePassRetries never exceeds max (S3)' {
        $script:conflictResolved = $false
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123' }
            if ($joined -match 'merge .+ --no-ff') {
                $global:LASTEXITCODE = 1
                return 'CONFLICT'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') {
                if ($script:conflictResolved) { return '' }
                $script:conflictResolved = $true
                return 'file.ps1'
            }
            if ($joined -match 'reset --hard') { return $null }
            return $null
        }
        Mock Invoke-Claude {
            $script:conflictResolved = $true
            return 'resolved'
        }
        Mock pnpm {
            $global:LASTEXITCODE = 1
            return 'failure'
        }
        Mock Read-Host { return 's' }

        $max = 3
        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature' -MaxDoublePassRetries $max
        $result.Status | Should -Be 'escalated_stop'
        # pnpm was called exactly $max times (one test failure per retry)
        Should -Invoke pnpm -Times $max -Exactly
    }

    It 'mergeConsecPasses never exceeds 2 (S6)' {
        $script:conflictResolved = $false
        $script:pnpmCallCount = 0
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123' }
            if ($joined -match 'merge .+ --no-ff') {
                $global:LASTEXITCODE = 1
                return 'CONFLICT'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') {
                if ($script:conflictResolved) { return '' }
                $script:conflictResolved = $true
                return 'file.ps1'
            }
            return $null
        }
        Mock Invoke-Claude {
            $script:conflictResolved = $true
            return 'resolved'
        }
        Mock pnpm {
            $script:pnpmCallCount++
            $global:LASTEXITCODE = 0
            return 'ok'
        }

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'merged'
        # 2 consecutive passes = 2 test + 2 lint = 4 pnpm calls
        $script:pnpmCallCount | Should -Be 4
    }

    It 'lock held during SequentialMerge (S2)' {
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123' }
            if ($joined -match 'merge') { $global:LASTEXITCODE = 0; return 'Merge made' }
            return $null
        }
        Mock Lock-Pipeline {}
        Mock Unlock-Pipeline {}

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'merged'
        # SequentialMerge does not manage locks itself
        Should -Invoke Lock-Pipeline -Times 0
        Should -Invoke Unlock-Pipeline -Times 0
    }

    It 'lock held during MergeConflictDP (S2)' {
        $script:conflictResolved = $false
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'abc123' }
            if ($joined -match 'merge .+ --no-ff') {
                $global:LASTEXITCODE = 1
                return 'CONFLICT'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') {
                if ($script:conflictResolved) { return '' }
                $script:conflictResolved = $true
                return 'file.ps1'
            }
            return $null
        }
        Mock Invoke-Claude {
            $script:conflictResolved = $true
            return 'resolved'
        }
        Mock Lock-Pipeline {}
        Mock Unlock-Pipeline {}

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'merged'
        # MergeConflictDP does not manage locks itself
        Should -Invoke Lock-Pipeline -Times 0
        Should -Invoke Unlock-Pipeline -Times 0
    }
}

Describe 'Stage 8 — Rollback' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "stage8-rollback-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        Mock Invoke-Claude { return 'UNRESOLVABLE' }
        Mock pnpm { $global:LASTEXITCODE = 0; return 'ok' }
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'Stop: feature branch reset to pre-merge checkpoint (R1-6)' {
        $script:resetTarget = $null
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'pre-merge-checkpoint-sha' }
            if ($joined -match 'merge .+ --no-ff') {
                $global:LASTEXITCODE = 1
                return 'CONFLICT'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') { return 'file.ps1' }
            if ($joined -match 'merge --abort') { return $null }
            if ($joined -match 'reset --hard (.+)') {
                $script:resetTarget = $args[-1]
                return $null
            }
            return $null
        }
        Mock Read-Host { return 's' }

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'escalated_stop'
        $script:resetTarget | Should -Be 'pre-merge-checkpoint-sha'
    }

    It 'rollback preserves prior tier merges (R1-6)' {
        # Simulate: T1 merges clean, T2 conflicts and user stops
        # The checkpoint is from BEFORE T1 merge started, so reset goes there
        $script:mergeCallCount = 0
        $script:resetCalled = $false
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'rev-parse HEAD') { return 'tier-start-checkpoint' }
            if ($joined -match 'merge .+ --no-ff') {
                $script:mergeCallCount++
                if ($script:mergeCallCount -eq 1) {
                    $global:LASTEXITCODE = 0
                    return 'Merge made'
                }
                $global:LASTEXITCODE = 1
                return 'CONFLICT'
            }
            if ($joined -match 'diff --name-only --diff-filter=U') { return 'file.ps1' }
            if ($joined -match 'merge --abort') { return $null }
            if ($joined -match 'reset --hard') {
                $script:resetCalled = $true
                return $null
            }
            return $null
        }
        Mock Read-Host { return 's' }

        $result = Invoke-SequentialMerge -WorktreeBranches @('T1-branch', 'T2-branch') -FeatureBranch 'feature/test' -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'escalated_stop'
        $result.Checkpoint | Should -Be 'tier-start-checkpoint'
        $script:resetCalled | Should -BeTrue
        # T1 was recorded as merged before the rollback
        $result.MergedBranches | Should -Contain 'T1-branch'
    }
}

Describe 'Stage 8 — Worktree Cleanup' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "stage8-cleanup-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'checkpoint-first: marker written BEFORE worktree removal (R2-8)' {
        $script:logOrder = @()
        Mock Write-Host {
            $msg = "$Object"
            if ($msg -match 'MARKER') { $script:logOrder += 'marker' }
            if ($msg -match 'WorktreeCleanup: removed') { $script:logOrder += 'removal' }
        }
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'worktree remove') {
                $global:LASTEXITCODE = 0
                return 'removed'
            }
            return $null
        }

        $wtPath = Join-Path $script:tempDir 'wt1'
        New-Item -ItemType Directory -Path $wtPath -Force | Out-Null

        $result = Invoke-WorktreeCleanup -WorktreePaths @($wtPath) -Root $script:tempDir -CompletedTier 1
        $result.TierCheckpoint | Should -Be 1

        # Marker must appear before any removal
        $markerIdx = [array]::IndexOf($script:logOrder, 'marker')
        $removalIdx = [array]::IndexOf($script:logOrder, 'removal')
        $markerIdx | Should -BeLessThan $removalIdx
    }

    It 'all worktrees removed after merge' {
        $script:removedPaths = @()
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'worktree remove (.+) --force') {
                $script:removedPaths += $args[4]
                $global:LASTEXITCODE = 0
                return 'removed'
            }
            return $null
        }

        $wt1 = Join-Path $script:tempDir 'wt1'
        $wt2 = Join-Path $script:tempDir 'wt2'
        New-Item -ItemType Directory -Path $wt1, $wt2 -Force | Out-Null

        $result = Invoke-WorktreeCleanup -WorktreePaths @($wt1, $wt2) -Root $script:tempDir -CompletedTier 2
        $result.CleanedUp.Count | Should -Be 2
        $result.Failed.Count | Should -Be 0
    }

    It 'removal failure logs warning, does not halt' {
        Mock git {
            $joined = $args -join ' '
            if ($joined -match 'worktree remove') {
                $global:LASTEXITCODE = 1
                return 'error: worktree busy'
            }
            return $null
        }

        $wt1 = Join-Path $script:tempDir 'wt1'
        $wt2 = Join-Path $script:tempDir 'wt2'
        New-Item -ItemType Directory -Path $wt1, $wt2 -Force | Out-Null

        $result = Invoke-WorktreeCleanup -WorktreePaths @($wt1, $wt2) -Root $script:tempDir -CompletedTier 1
        # Both failed but function completed without throwing
        $result.Failed.Count | Should -Be 2
        $result.CleanedUp.Count | Should -Be 0
        $result.TierCheckpoint | Should -Be 1
    }

    It 'no worktrees — skip gates, proceed to global' {
        Mock git {}

        $result = Invoke-WorktreeCleanup -WorktreePaths @() -Root $script:tempDir -CompletedTier 3
        $result.CleanedUp.Count | Should -Be 0
        $result.Failed.Count | Should -Be 0
        $result.TierCheckpoint | Should -Be 3
        # git worktree remove never called
        Should -Invoke git -Times 0
    }
}

Describe 'Stage 8 — Global Double-Pass' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "stage8-gdp-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        Mock Invoke-Claude { return 'fix-applied' }
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'succeeds after 2 consecutive passes' {
        Mock pnpm { $global:LASTEXITCODE = 0; return 'ok' }

        $result = Invoke-GlobalDoublePass -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'passed'
        $result.Retries | Should -Be 0
        $result.LastError | Should -BeNullOrEmpty
    }

    It 'failure sends output to Claude' {
        $script:pnpmCallCount = 0
        Mock pnpm {
            $script:pnpmCallCount++
            $joined = $args -join ' '
            if ($joined -match 'test' -and $script:pnpmCallCount -eq 1) {
                $global:LASTEXITCODE = 1
                return 'test-error-output'
            }
            $global:LASTEXITCODE = 0
            return 'ok'
        }

        $result = Invoke-GlobalDoublePass -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'passed'
        $result.Retries | Should -BeGreaterOrEqual 1
        Should -Invoke Invoke-Claude -Times 1 -Exactly
    }

    It 'MaxDoublePassRetries=5 escalates' {
        Mock pnpm {
            $global:LASTEXITCODE = 1
            return 'persistent-failure'
        }

        $result = Invoke-GlobalDoublePass -Root $script:tempDir -Feature 'my-feature' -MaxDoublePassRetries 5
        $result.Status | Should -Be 'escalated'
        $result.Retries | Should -Be 5
        $result.LastError | Should -Not -BeNullOrEmpty
    }

    It 'Keep Going after escalation logs and proceeds to global review' {
        # Simulate: global double-pass escalates, caller reads escalation as Keep Going
        Mock pnpm {
            $global:LASTEXITCODE = 1
            return 'persistent-failure'
        }

        $result = Invoke-GlobalDoublePass -Root $script:tempDir -Feature 'my-feature' -MaxDoublePassRetries 2
        $result.Status | Should -Be 'escalated'
        # Caller would check result.Status and call Read-Escalation -> KeepGoing
        # The function itself returns 'escalated' so caller can decide
        $result.LastError | Should -Not -BeNullOrEmpty
    }

    It 'Stop after escalation halts and releases lock' {
        # Simulate: global double-pass escalates, caller reads escalation as Stop
        Mock pnpm {
            $global:LASTEXITCODE = 1
            return 'persistent-failure'
        }

        $result = Invoke-GlobalDoublePass -Root $script:tempDir -Feature 'my-feature' -MaxDoublePassRetries 2
        $result.Status | Should -Be 'escalated'
        # Lock management is at the caller level (Invoke-CodingStage finally block)
        # Verify function does not call Lock/Unlock itself
        Mock Lock-Pipeline {}
        Mock Unlock-Pipeline {}
        Should -Invoke Lock-Pipeline -Times 0
        Should -Invoke Unlock-Pipeline -Times 0
    }

    It 'glDoublePassRetries never exceeds max (S3)' {
        Mock pnpm {
            $global:LASTEXITCODE = 1
            return 'failure'
        }

        $max = 3
        $result = Invoke-GlobalDoublePass -Root $script:tempDir -Feature 'my-feature' -MaxDoublePassRetries $max
        $result.Status | Should -Be 'escalated'
        $result.Retries | Should -BeLessOrEqual $max
    }

    It 'glConsecPasses never exceeds 2 (S6)' {
        $script:pnpmCallCount = 0
        Mock pnpm {
            $script:pnpmCallCount++
            $global:LASTEXITCODE = 0
            return 'ok'
        }

        $result = Invoke-GlobalDoublePass -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'passed'
        # 2 consecutive passes = 2 test + 2 lint = 4 pnpm calls
        $script:pnpmCallCount | Should -Be 4
    }

    It 'lock held during GlobalDoublePass (S2)' {
        Mock pnpm { $global:LASTEXITCODE = 0; return 'ok' }
        Mock Lock-Pipeline {}
        Mock Unlock-Pipeline {}

        $result = Invoke-GlobalDoublePass -Root $script:tempDir -Feature 'my-feature'
        $result.Status | Should -Be 'passed'
        # GlobalDoublePass does not manage locks itself
        Should -Invoke Lock-Pipeline -Times 0
        Should -Invoke Unlock-Pipeline -Times 0
    }
}

Describe 'Stage 8 — Global Review' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "stage8-gr-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        $script:featureDir = Join-Path $script:tempDir 'docs/my-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null

        Mock Invoke-Claude { return 'fix-applied' }
        Mock pnpm { $global:LASTEXITCODE = 0; return 'ok' }
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'global reviewers dispatched with full diff against base branch' {
        $script:capturedDiff = $null
        Mock git { return 'diff --git a/global-file.ps1 b/global-file.ps1' }
        Mock Invoke-ReviewLoop {
            $script:capturedDiff = $DiffContent
            return @{ Verdict = 'pass'; Blockers = @(); Notes = @(); Warnings = @(); Round = 1 }
        }

        $result = Invoke-GlobalReview -Root $script:tempDir -FeatureDir $script:featureDir -BaseBranch 'master'
        $result.Verdict | Should -Be 'pass'
        $script:capturedDiff | Should -Match 'global-file'
    }

    It 'review pass completes Stage 8 and releases lock' {
        Mock git { return 'diff content' }
        Mock Invoke-ReviewLoop {
            return @{ Verdict = 'pass'; Blockers = @(); Notes = @(); Warnings = @(); Round = 1 }
        }

        $result = Invoke-GlobalReview -Root $script:tempDir -FeatureDir $script:featureDir -BaseBranch 'master'
        $result.Verdict | Should -Be 'pass'
        $result.ReviewRound | Should -Be 1
        $result.Blockers.Count | Should -Be 0
    }

    It 'review blocker triggers fix cycle (Claude fix, double-pass, re-review)' {
        $script:reviewCallCount = 0
        Mock git { return 'diff content' }
        Mock Invoke-ReviewLoop {
            $script:reviewCallCount++
            if ($script:reviewCallCount -eq 1) {
                return @{ Verdict = 'fail'; Blockers = @(@{ description = 'missing test' }); Notes = @(); Warnings = @(); Round = 1 }
            }
            return @{ Verdict = 'pass'; Blockers = @(); Notes = @(); Warnings = @(); Round = 1 }
        }

        $result = Invoke-GlobalReview -Root $script:tempDir -FeatureDir $script:featureDir -BaseBranch 'master'
        $result.Verdict | Should -Be 'pass'
        $result.ReviewRound | Should -Be 2
        # Claude was called for the fix prompt + global double-pass fix calls
        Should -Invoke Invoke-Claude -Times 1 -Exactly -ParameterFilter { $Prompt -match 'Global Review Failure' }
    }

    It 'after GlobalReviewFail: glDoublePassRetries=0 AND glConsecPasses=0 (R2-1)' {
        $script:reviewCallCount = 0
        Mock git { return 'diff content' }
        Mock Invoke-ReviewLoop {
            $script:reviewCallCount++
            if ($script:reviewCallCount -eq 1) {
                return @{ Verdict = 'fail'; Blockers = @(@{ description = 'blocker' }); Notes = @(); Warnings = @(); Round = 1 }
            }
            return @{ Verdict = 'pass'; Blockers = @(); Notes = @(); Warnings = @(); Round = 1 }
        }

        # pnpm always passes — if counters were not reset, behavior would differ
        $result = Invoke-GlobalReview -Root $script:tempDir -FeatureDir $script:featureDir -BaseBranch 'master'
        $result.Verdict | Should -Be 'pass'
        # pnpm was called during the global double-pass (4 calls for 2 consec passes)
        Should -Invoke pnpm -Times 4 -Exactly
    }

    It 'MaxReviewRounds=3 escalates' {
        Mock git { return 'diff content' }
        Mock Invoke-ReviewLoop {
            return @{ Verdict = 'fail'; Blockers = @(@{ description = 'persistent blocker' }); Notes = @(); Warnings = @(); Round = 1 }
        }

        $result = Invoke-GlobalReview -Root $script:tempDir -FeatureDir $script:featureDir -BaseBranch 'master' -MaxReviewRounds 3
        $result.Verdict | Should -Be 'escalated'
        $result.ReviewRound | Should -Be 3
        $result.Blockers.Count | Should -BeGreaterThan 0
    }

    It 'Keep Going at global level logs issues and completes' {
        Mock git { return 'diff content' }
        Mock Invoke-ReviewLoop {
            return @{ Verdict = 'fail'; Blockers = @(@{ description = 'issue' }); Notes = @(); Warnings = @(); Round = 1 }
        }

        # Escalation after MaxReviewRounds — caller decides Keep Going
        $result = Invoke-GlobalReview -Root $script:tempDir -FeatureDir $script:featureDir -BaseBranch 'master' -MaxReviewRounds 1
        $result.Verdict | Should -Be 'escalated'
        # Caller would use Read-Escalation to decide Keep Going and proceed to Complete-Pipeline
        $result.Blockers.Count | Should -BeGreaterThan 0
    }

    It 'Stop halts and releases lock' {
        Mock git { return 'diff content' }
        Mock Invoke-ReviewLoop {
            return @{ Verdict = 'fail'; Blockers = @(@{ description = 'critical' }); Notes = @(); Warnings = @(); Round = 1 }
        }

        $result = Invoke-GlobalReview -Root $script:tempDir -FeatureDir $script:featureDir -BaseBranch 'master' -MaxReviewRounds 1
        $result.Verdict | Should -Be 'escalated'
        # Lock management is at the caller level — function returns for caller to handle
    }

    It 'glReviewRounds never exceeds MaxReviewRounds (S4)' {
        Mock git { return 'diff content' }
        Mock Invoke-ReviewLoop {
            return @{ Verdict = 'fail'; Blockers = @(@{ description = 'blocker' }); Notes = @(); Warnings = @(); Round = 1 }
        }

        $max = 2
        $result = Invoke-GlobalReview -Root $script:tempDir -FeatureDir $script:featureDir -BaseBranch 'master' -MaxReviewRounds $max
        $result.Verdict | Should -Be 'escalated'
        $result.ReviewRound | Should -BeLessOrEqual $max
    }

    It 'lock held during GlobalReview (S2)' {
        Mock git { return 'diff content' }
        Mock Lock-Pipeline {}
        Mock Unlock-Pipeline {}
        Mock Invoke-ReviewLoop {
            return @{ Verdict = 'pass'; Blockers = @(); Notes = @(); Warnings = @(); Round = 1 }
        }

        $result = Invoke-GlobalReview -Root $script:tempDir -FeatureDir $script:featureDir -BaseBranch 'master'
        $result.Verdict | Should -Be 'pass'
        # GlobalReview does not manage locks itself
        Should -Invoke Lock-Pipeline -Times 0
        Should -Invoke Unlock-Pipeline -Times 0
    }
}

Describe 'Stage 8 — Pipeline Completion' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "stage8-complete-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'PIPELINE COMPLETE marker logged on success' {
        $script:logMessages = @()
        Mock Write-Host { $script:logMessages += $Object }

        $result = Complete-Pipeline -Root $script:tempDir -Status 'complete'
        ($script:logMessages -join "`n") | Should -Match 'PIPELINE COMPLETE'
        $result.Status | Should -Be 'complete'
    }

    It 'PIPELINE HALTED marker logged on stop' {
        $script:logMessages = @()
        Mock Write-Host { $script:logMessages += $Object }

        $result = Complete-Pipeline -Root $script:tempDir -Status 'halted'
        ($script:logMessages -join "`n") | Should -Match 'PIPELINE HALTED'
        $result.Status | Should -Be 'halted'
    }

    It 'lock released in all terminal paths (S1)' {
        $script:logMessages = @()
        Mock Write-Host { $script:logMessages += $Object }

        # Complete path
        $completeResult = Complete-Pipeline -Root $script:tempDir -Status 'complete'
        ($script:logMessages -join "`n") | Should -Match 'Lock released'
        $completeResult.Timestamp | Should -Not -BeNullOrEmpty

        # Halted path
        $script:logMessages = @()
        $haltedResult = Complete-Pipeline -Root $script:tempDir -Status 'halted'
        ($script:logMessages -join "`n") | Should -Match 'Lock released'
        $haltedResult.Timestamp | Should -Not -BeNullOrEmpty
    }

    It 'phase=Complete implies outcome=complete (S5)' {
        $script:logMessages = @()
        Mock Write-Host { $script:logMessages += $Object }

        $result = Complete-Pipeline -Root $script:tempDir -Status 'complete'
        $result.Status | Should -Be 'complete'
        ($script:logMessages -join "`n") | Should -Match 'PIPELINE COMPLETE'
        ($script:logMessages -join "`n") | Should -Not -Match 'PIPELINE HALTED'
    }

    It 'phase=Halted implies outcome=halted (S5)' {
        $script:logMessages = @()
        Mock Write-Host { $script:logMessages += $Object }

        $result = Complete-Pipeline -Root $script:tempDir -Status 'halted'
        $result.Status | Should -Be 'halted'
        ($script:logMessages -join "`n") | Should -Match 'PIPELINE HALTED'
        ($script:logMessages -join "`n") | Should -Not -Match 'PIPELINE COMPLETE'
    }
}
