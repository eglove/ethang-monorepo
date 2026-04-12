BeforeAll {
    . "$PSScriptRoot/../utils/pipeline-lock.ps1"
    . "$PSScriptRoot/../stages/8-coding.ps1"
    . "$PSScriptRoot/helpers/claude-test-double.ps1"
}

Describe 'Stage 8 — Logging' {
    BeforeAll {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "log-integ-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'Write-PipelineLog writes to both console and pipeline.log when Root is provided' {
        $logPath = Join-Path $script:tempDir 'pipeline.log'
        Remove-Item $logPath -ErrorAction SilentlyContinue

        Write-PipelineLog -Message 'test dual output' -Root $script:tempDir

        $logPath | Should -Exist
        $content = Get-Content $logPath -Raw
        $content | Should -Match 'test dual output'
        $content | Should -Match '\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]'
    }

    It 'Write-PipelineLog without Root does not create pipeline.log' {
        $otherDir = Join-Path $script:tempDir 'no-root'
        New-Item -ItemType Directory -Path $otherDir -Force | Out-Null
        $logPath = Join-Path $otherDir 'pipeline.log'

        Write-PipelineLog -Message 'console only'

        $logPath | Should -Not -Exist
    }

    It 'Multiple log entries append to pipeline.log' {
        $subDir = Join-Path $script:tempDir 'multi'
        New-Item -ItemType Directory -Path $subDir -Force | Out-Null

        Write-PipelineLog -Message 'first entry' -Root $subDir
        Write-PipelineLog -Message 'second entry' -Root $subDir

        $lines = Get-Content (Join-Path $subDir 'pipeline.log')
        $lines.Count | Should -Be 2
        $lines[0] | Should -Match 'first entry'
        $lines[1] | Should -Match 'second entry'
    }

    It 'Resume markers include MARKER prefix' {
        $subDir = Join-Path $script:tempDir 'markers'
        New-Item -ItemType Directory -Path $subDir -Force | Out-Null

        Write-PipelineLog -Message '>>> MARKER PRE_CODING_GATE' -Root $subDir
        Write-PipelineLog -Message '>>> MARKER TIER_1_COMPLETE' -Root $subDir
        Write-PipelineLog -Message '>>> MARKER GLOBAL_DOUBLEPASS_COMPLETE' -Root $subDir

        $content = Get-Content (Join-Path $subDir 'pipeline.log') -Raw
        $content | Should -Match '>>> MARKER PRE_CODING_GATE'
        $content | Should -Match '>>> MARKER TIER_1_COMPLETE'
        $content | Should -Match '>>> MARKER GLOBAL_DOUBLEPASS_COMPLETE'
    }

    It 'PIPELINE COMPLETE and HALTED markers are written by Complete-Pipeline' {
        $subDir = Join-Path $script:tempDir 'complete-markers'
        New-Item -ItemType Directory -Path $subDir -Force | Out-Null

        Complete-Pipeline -Root $subDir -Status 'complete'
        $content = Get-Content (Join-Path $subDir 'pipeline.log') -Raw
        $content | Should -Match '>>> PIPELINE COMPLETE'

        Remove-Item (Join-Path $subDir 'pipeline.log') -ErrorAction SilentlyContinue
        Complete-Pipeline -Root $subDir -Status 'halted'
        $content = Get-Content (Join-Path $subDir 'pipeline.log') -Raw
        $content | Should -Match '>>> PIPELINE HALTED'
    }
}

Describe 'Stage 8 — Resume' {
    BeforeAll {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "resume-integ-$(Get-Random)"
    }

    BeforeEach {
        # Fresh temp dir for each test
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        # Create minimal valid structure
        $featureDir = Join-Path $script:tempDir 'docs/test-feature'
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null

        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @(@{ id = 'T1'; step = 1; title = 'A' }) }
                @{ tier = 2; tasks = @(@{ id = 'T2'; step = 2; title = 'B' }) }
                @{ tier = 3; tasks = @(@{ id = 'T3'; step = 3; title = 'C' }) }
            )
        }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $featureDir 'implementation-plan.json')

        # Create fixture files
        $fixtureDir = Join-Path $script:tempDir 'fixtures/test-feature'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        '[]' | Set-Content (Join-Path $fixtureDir 'bdd.json')
        '[]' | Set-Content (Join-Path $fixtureDir 'tla.json')

        # Mock external commands
        Mock git { '' }
        Mock Lock-Pipeline { @{ pipelineState = 'locked'; lockHolder = 1 } }
        Mock Unlock-Pipeline {}
        Mock Invoke-Claude {}
        Mock Read-Host { 'y' }
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'Resume reads last TIER_N_COMPLETE marker and resumes from tier N+1' {
        # Write a pipeline.log with TIER_1_COMPLETE
        $logPath = Join-Path $script:tempDir 'pipeline.log'
        "[2026-04-11 10:00:00] >>> MARKER TIER_1_COMPLETE" | Set-Content $logPath

        $result = Invoke-CodingStage -Feature 'test-feature' -Root $script:tempDir -Resume

        $result.Status | Should -Be 'tiers_dispatched'
        # Single Claude dispatch for remaining tiers
        Should -Invoke Invoke-Claude -Times 1
    }

    It 'Resume with no pipeline.log starts fresh with warning' {
        # No pipeline.log exists
        $result = Invoke-CodingStage -Feature 'test-feature' -Root $script:tempDir -Resume

        $result.Status | Should -Be 'tiers_dispatched'
        # Single Claude dispatch for all tiers
        Should -Invoke Invoke-Claude -Times 1
    }

    It 'Resume with TIER_0 equivalent (no markers) starts fresh with warning' {
        # pipeline.log exists but no tier markers
        $logPath = Join-Path $script:tempDir 'pipeline.log'
        "[2026-04-11 10:00:00] Stage 8 initialized" | Set-Content $logPath

        $result = Invoke-CodingStage -Feature 'test-feature' -Root $script:tempDir -Resume

        $result.Status | Should -Be 'tiers_dispatched'
        Should -Invoke Invoke-Claude -Times 1
    }

    It 'Resume reclaims stale lock on lock failure' {
        $script:lockAttempt = 0
        Mock Lock-Pipeline {
            $script:lockAttempt++
            if ($script:lockAttempt -eq 1 -and $Resume) {
                throw 'Lock already held by PID 12345'
            }
            return @{ pipelineState = 'locked'; lockHolder = 1 }
        }

        $result = Invoke-CodingStage -Feature 'test-feature' -Root $script:tempDir -Resume

        $result.Status | Should -Be 'tiers_dispatched'
        Should -Invoke Unlock-Pipeline -Times 1
    }

    It 'Resume detects and cleans up orphan worktrees' {
        Mock git {
            if ($args -contains 'worktree' -and $args -contains 'list') {
                return @(
                    "$script:tempDir  abc1234 [main]"
                    "/tmp/orphan-wt  def5678 [feature-branch]"
                )
            }
            if ($args -contains 'worktree' -and $args -contains 'remove') {
                return ''
            }
            return ''
        }

        $result = Invoke-CodingStage -Feature 'test-feature' -Root $script:tempDir -Resume

        $result.Status | Should -Be 'tiers_dispatched'
    }

    It 'Resume with all tiers complete jumps to GlobalDoublePass (R2-4)' {
        # Write markers for all 3 tiers
        $logPath = Join-Path $script:tempDir 'pipeline.log'
        @(
            "[2026-04-11 10:00:00] >>> MARKER TIER_1_COMPLETE"
            "[2026-04-11 10:01:00] >>> MARKER TIER_2_COMPLETE"
            "[2026-04-11 10:02:00] >>> MARKER TIER_3_COMPLETE"
        ) | Set-Content $logPath

        $result = Invoke-CodingStage -Feature 'test-feature' -Root $script:tempDir -Resume

        $result.Status | Should -Be 'tiers_dispatched'
        # No tiers dispatched (skipped to global)
        Should -Not -Invoke Invoke-Claude
    }

    It 'Resume skips already-merged branches during merge detection' {
        Mock git {
            if ($args -contains 'branch' -and $args -contains '--merged') {
                return @('  main', '* feature-branch', '  already-merged-branch')
            }
            if ($args -contains 'worktree' -and $args -contains 'list') {
                return @("$script:tempDir  abc1234 [main]")
            }
            return ''
        }

        $result = Invoke-CodingStage -Feature 'test-feature' -Root $script:tempDir -Resume

        $result.Status | Should -Be 'tiers_dispatched'
    }
}

Describe 'Stage 8 — Crash Recovery' {
    BeforeAll {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "crash-integ-$(Get-Random)"
    }

    BeforeEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        $featureDir = Join-Path $script:tempDir 'docs/test-feature'
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null

        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @(@{ id = 'T1'; step = 1; title = 'A' }) }
                @{ tier = 2; tasks = @(@{ id = 'T2'; step = 2; title = 'B' }) }
            )
        }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $featureDir 'implementation-plan.json')

        $fixtureDir = Join-Path $script:tempDir 'fixtures/test-feature'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        '[]' | Set-Content (Join-Path $fixtureDir 'bdd.json')
        '[]' | Set-Content (Join-Path $fixtureDir 'tla.json')

        Mock git { '' }
        Mock Lock-Pipeline { @{ pipelineState = 'locked'; lockHolder = 1 } }
        Mock Unlock-Pipeline {}
        Mock Invoke-Claude {}
        Mock Read-Host { 'y' }
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'R2-3: Zero-checkpoint crash (lastCompletedTier=0) starts fresh with warning' {
        $logPath = Join-Path $script:tempDir 'pipeline.log'
        "[2026-04-11 10:00:00] Stage 8 initialized" | Set-Content $logPath

        $result = Invoke-CodingStage -Feature 'test-feature' -Root $script:tempDir -Resume

        $result.Status | Should -Be 'tiers_dispatched'
        # Single Claude dispatch (starting fresh)
        Should -Invoke Invoke-Claude -Times 1

        $logContent = Get-Content $logPath -Raw
        $logContent | Should -Match 'WARNING.*--resume with no completed tiers'
    }

    It 'R2-4: ResumeToGlobal (lastCompletedTier=MaxTiers) jumps to GlobalDoublePass' {
        $logPath = Join-Path $script:tempDir 'pipeline.log'
        @(
            "[2026-04-11 10:00:00] >>> MARKER TIER_1_COMPLETE"
            "[2026-04-11 10:01:00] >>> MARKER TIER_2_COMPLETE"
        ) | Set-Content $logPath

        $result = Invoke-CodingStage -Feature 'test-feature' -Root $script:tempDir -Resume

        $result.Status | Should -Be 'tiers_dispatched'
        Should -Not -Invoke Invoke-Claude

        $logContent = Get-Content $logPath -Raw
        $logContent | Should -Match 'jumping to GlobalDoublePass'
    }

    It 'R2-6: Input re-validation on resume — missing plan halts' {
        # Remove the plan file
        Remove-Item (Join-Path $script:tempDir 'docs/test-feature/implementation-plan.json')

        $result = Invoke-CodingStage -Feature 'test-feature' -Root $script:tempDir -Resume

        $result.Status | Should -Be 'halted_validation'
        $result.Message | Should -Match 'implementation-plan.json not found'
    }

    It 'R2-6: Input re-validation on resume — missing BDD fixture halts' {
        Remove-Item (Join-Path $script:tempDir 'fixtures/test-feature/bdd.json')

        $result = Invoke-CodingStage -Feature 'test-feature' -Root $script:tempDir -Resume

        $result.Status | Should -Be 'halted_validation'
        $result.Message | Should -Match 'BDD fixture not found'
    }

    It 'R2-6: Input re-validation on resume — missing TLA fixture halts' {
        Remove-Item (Join-Path $script:tempDir 'fixtures/test-feature/tla.json')

        $result = Invoke-CodingStage -Feature 'test-feature' -Root $script:tempDir -Resume

        $result.Status | Should -Be 'halted_validation'
        $result.Message | Should -Match 'TLA fixture not found'
    }

    It 'R1-5: Idempotency — re-running completed tier is a no-op' {
        $logPath = Join-Path $script:tempDir 'pipeline.log'
        "[2026-04-11 10:00:00] >>> MARKER TIER_1_COMPLETE" | Set-Content $logPath

        $result = Invoke-CodingStage -Feature 'test-feature' -Root $script:tempDir -Resume

        $result.Status | Should -Be 'tiers_dispatched'
        # Only tier 2 should be dispatched
        Should -Invoke Invoke-Claude -Times 1
    }

    It 'R1-4: Resume with orphan worktrees cleans them up' {
        $script:worktreeRemoved = $false
        Mock git {
            if ($args -contains 'worktree' -and $args -contains 'list') {
                return @(
                    "$script:tempDir  abc1234 [main]"
                    "/tmp/orphan1  def5678 [feature-wt-1]"
                )
            }
            if ($args -contains 'worktree' -and $args -contains 'remove') {
                $script:worktreeRemoved = $true
                return ''
            }
            return ''
        }

        Invoke-CodingStage -Feature 'test-feature' -Root $script:tempDir -Resume

        $script:worktreeRemoved | Should -Be $true
    }
}

Describe 'Stage 8 — End-to-End Integration' {
    BeforeAll {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "e2e-integ-$(Get-Random)"
    }

    BeforeEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        $featureDir = Join-Path $script:tempDir 'docs/my-feature'
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null

        $fixtureDir = Join-Path $script:tempDir 'fixtures/my-feature'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        '[]' | Set-Content (Join-Path $fixtureDir 'bdd.json')
        '[]' | Set-Content (Join-Path $fixtureDir 'tla.json')

        Mock Lock-Pipeline { @{ pipelineState = 'locked'; lockHolder = 1 } }
        Mock Unlock-Pipeline {}
        Mock Invoke-Claude {}
        Mock Read-Host { 'y' }
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'Full happy path: Init -> dispatch all tiers -> complete' {
        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @(@{ id = 'T1'; step = 1; title = 'First' }) }
                @{ tier = 2; tasks = @(@{ id = 'T2'; step = 2; title = 'Second' }) }
            )
        }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        Mock git { '' }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir

        $result.Status | Should -Be 'tiers_dispatched'
        $result.Feature | Should -Be 'my-feature'
        $result.PlanSnapshot | Should -Not -BeNullOrEmpty
        @($result.PlanSnapshot.tiers).Count | Should -Be 2
        Should -Invoke Invoke-Claude -Times 1

        # Verify pipeline.log was created with markers
        $logPath = Join-Path $script:tempDir 'pipeline.log'
        $logPath | Should -Exist
        $logContent = Get-Content $logPath -Raw
        $logContent | Should -Match '>>> MARKER PRE_CODING_GATE'
        $logContent | Should -Match '>>> MARKER TIER_2_COMPLETE'
        $logContent | Should -Match '>>> MARKER GLOBAL_DOUBLEPASS_COMPLETE'
    }

    It 'Crash mid-tier, resume, complete' {
        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @(@{ id = 'T1'; step = 1; title = 'A' }) }
                @{ tier = 2; tasks = @(@{ id = 'T2'; step = 2; title = 'B' }) }
                @{ tier = 3; tasks = @(@{ id = 'T3'; step = 3; title = 'C' }) }
            )
        }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        Mock git { '' }

        # Simulate a crash after tier 1 by writing a partial log
        $logPath = Join-Path $script:tempDir 'pipeline.log'
        @(
            "[2026-04-11 10:00:00] Stage 8 initialized for feature 'my-feature'"
            "[2026-04-11 10:00:01] >>> MARKER TIER_1_COMPLETE"
        ) | Set-Content $logPath

        # Resume should pick up from tier 2
        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir -Resume

        $result.Status | Should -Be 'tiers_dispatched'
        # Single Claude dispatch for remaining tiers
        Should -Invoke Invoke-Claude -Times 1

        # Log should contain the completion marker for all tiers
        $logContent = Get-Content $logPath -Raw
        $logContent | Should -Match '>>> MARKER TIER_3_COMPLETE'
    }

    It 'Alternating tier sizes [3,1,2] dispatches correct number of Claude calls' {
        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @(
                    @{ id = 'T1'; step = 1; title = 'A' }
                    @{ id = 'T2'; step = 2; title = 'B' }
                    @{ id = 'T3'; step = 3; title = 'C' }
                ) }
                @{ tier = 2; tasks = @(
                    @{ id = 'T4'; step = 4; title = 'D' }
                ) }
                @{ tier = 3; tasks = @(
                    @{ id = 'T5'; step = 5; title = 'E' }
                    @{ id = 'T6'; step = 6; title = 'F' }
                ) }
            )
        }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        Mock git { '' }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir

        $result.Status | Should -Be 'tiers_dispatched'
        # Single Claude dispatch for all tiers at once
        Should -Invoke Invoke-Claude -Times 1
    }

    It 'L4: Lock is always released even on validation failure' {
        # Create plan with empty tiers array to trigger validation failure
        $plan = @{ tiers = @() }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        Mock git { '' }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir

        $result.Status | Should -Be 'halted_validation'
        Should -Invoke Unlock-Pipeline -Times 1
    }

    It 'Lock is always released even on successful completion' {
        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @(@{ id = 'T1'; step = 1; title = 'A' }) }
            )
        }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        Mock git { '' }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir

        $result.Status | Should -Be 'tiers_dispatched'
        Should -Invoke Unlock-Pipeline -Times 1
    }

    It 'Validation failure: missing plan halts without dispatching Claude' {
        # No plan file created
        Mock git { '' }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir

        $result.Status | Should -Be 'halted_validation'
        Should -Not -Invoke Invoke-Claude
    }

    It 'Validation failure: malformed JSON halts' {
        'not-json{{{' | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        Mock git { '' }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir

        $result.Status | Should -Be 'halted_validation'
        $result.Message | Should -Match 'malformed JSON'
    }

    It 'Pre-coding gate: uncommitted changes with user refusing halts pipeline' {
        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @(@{ id = 'T1'; step = 1; title = 'A' }) }
            )
        }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        Mock git {
            if ($args -contains 'status' -and $args -contains '--porcelain') {
                return 'M  dirty-file.txt'
            }
            return ''
        }
        Mock Read-Host { 'n' }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir

        $result.Status | Should -Be 'halted_uncommitted'
    }

    It 'Lock acquisition failure returns halted_lock' {
        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @(@{ id = 'T1'; step = 1; title = 'A' }) }
            )
        }
        $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $script:tempDir 'docs/my-feature/implementation-plan.json')

        Mock git { '' }
        Mock Lock-Pipeline { throw 'Lock already held by PID 99999' }

        $result = Invoke-CodingStage -Feature 'my-feature' -Root $script:tempDir

        $result.Status | Should -Be 'halted_lock'
        $result.Message | Should -Match 'Lock already held'
    }

    It 'WorktreeCleanup writes checkpoint marker before removing worktrees' {
        $subDir = Join-Path $script:tempDir 'wt-cleanup'
        New-Item -ItemType Directory -Path $subDir -Force | Out-Null

        Mock git { '' }

        $result = Invoke-WorktreeCleanup -WorktreePaths @('/tmp/wt1') -Root $subDir -CompletedTier 2

        $logPath = Join-Path $subDir 'pipeline.log'
        $logPath | Should -Exist
        $content = Get-Content $logPath -Raw
        $content | Should -Match '>>> MARKER TIER_2_COMPLETE'
        $result.TierCheckpoint | Should -Be 2
    }

    It 'Complete-Pipeline returns correct status and timestamp' {
        $subDir = Join-Path $script:tempDir 'completion'
        New-Item -ItemType Directory -Path $subDir -Force | Out-Null

        $result = Complete-Pipeline -Root $subDir -Status 'complete'

        $result.Status | Should -Be 'complete'
        $result.Timestamp | Should -BeOfType [datetime]
    }
}
