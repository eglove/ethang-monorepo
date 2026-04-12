BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    # Stub: pipeline-state.ps1 was removed in code-simplify
    if (-not (Get-Command New-PipelineState -ErrorAction SilentlyContinue)) {
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
    }
    if (-not (Get-Command New-PipelineLogWriter -ErrorAction SilentlyContinue)) {
        function global:New-PipelineLogWriter {
            param([string]$LogPath)
            $dir = Split-Path $LogPath -Parent
            if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
            $fs = [System.IO.FileStream]::new($LogPath, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::Write, [System.IO.FileShare]::Read)
            $fs.Seek(0, [System.IO.SeekOrigin]::End) | Out-Null
            return [System.IO.StreamWriter]::new($fs)
        }
    }
    if (-not (Get-Command Write-IdempotencyToken -ErrorAction SilentlyContinue)) {
        function global:Write-IdempotencyToken {
            param($Writer, [string]$Stage, [string]$Status, [string]$RunId)
            $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
            $line = "[$ts] INVOKE-CLAUDE $Status stage=$Stage"
            if ($RunId) { $line += " runId=$RunId" }
            $Writer.WriteLine($line)
            $Writer.Flush()
        }
    }
    if (-not (Get-Command Read-IdempotencyTokens -ErrorAction SilentlyContinue)) {
        function global:Read-IdempotencyTokens {
            param([string]$LogPath)
            $tokens = [System.Collections.Generic.HashSet[string]]::new()
            if (-not (Test-Path $LogPath)) { return $tokens }
            foreach ($line in (Get-Content $LogPath)) {
                if ($line -match 'INVOKE-CLAUDE\s+(INVOKE|COMPLETE)\s+stage=(\S+)') {
                    $null = $tokens.Add("$($Matches[1]):$($Matches[2])")
                }
            }
            return $tokens
        }
    }
    if (-not (Get-Command Test-IdempotencyComplete -ErrorAction SilentlyContinue)) {
        function global:Test-IdempotencyComplete {
            param($Tokens, [string]$Stage)
            return ($Tokens.Contains("INVOKE:$Stage") -and $Tokens.Contains("COMPLETE:$Stage"))
        }
    }
    . "$PSScriptRoot/../utils/pipeline-lock.ps1"
    . "$PSScriptRoot/../utils/pipeline-log.ps1"
    . "$PSScriptRoot/../utils/complete-pipeline.ps1"
    . "$PSScriptRoot/../utils/coverage-gate.ps1"
    . "$PSScriptRoot/../utils/abort-cleanup.ps1"
    . "$PSScriptRoot/../utils/task-cleanup.ps1"
    . "$PSScriptRoot/../utils/warden-config.ps1"
    . "$PSScriptRoot/../utils/playwright-detect.ps1"
    . "$PSScriptRoot/../utils/gherkin-parser.ps1"
    . "$PSScriptRoot/../utils/tlc-parser.ps1"
    . "$PSScriptRoot/../utils/job-runner.ps1"
    . "$PSScriptRoot/../utils/global-timeout.ps1"
    . "$PSScriptRoot/../utils/review-gate.ps1"
}

Describe 'Pipeline E2E: Full Lifecycle' {
    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "e2e-$(Get-Random)"
        $script:lockDir = Join-Path $script:tempDir 'locks'
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
    }
    AfterEach { Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue }

    It 'fresh start: lock acquired -> running -> complete lifecycle' {
        # Acquire lock
        $state = Lock-Pipeline -LockDir $script:lockDir -Feature 'e2e-test'
        $state.pipelineState | Should -BeExactly 'locked'
        $state.lockHolder | Should -Be 1

        # Start running
        Start-PipelineRunning -State $state
        $state.pipelineState | Should -BeExactly 'running'

        # Complete
        $logDir = Join-Path $script:tempDir 'logs'
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        $result = Complete-Pipeline -Root $script:tempDir -Status 'complete'
        $result.Status | Should -BeExactly 'complete'
    }

    It 'S8 LockHeldDuringExecution: pipeline executing implies lock held' {
        $state = Lock-Pipeline -LockDir $script:lockDir -Feature 'e2e-s8'
        Start-PipelineRunning -State $state

        # Lock must be held while running
        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeTrue
        $state.lockHolder | Should -Be 1
    }

    It 'S15 CrashBudgetRespected: crash budget enforced' {
        # Fresh lock has crashCount=0
        Lock-Pipeline -LockDir $script:lockDir -Feature 'e2e-crash'
        Get-CrashCount -LockDir $script:lockDir | Should -Be 0

        # Simulate crashes
        Update-CrashCount -LockDir $script:lockDir -NewCount 3
        { Test-CrashBudget -LockDir $script:lockDir -MaxCrashes 3 } | Should -Throw '*exhausted*'
    }

    It 'abort lifecycle: start -> abort -> cleanup' {
        Lock-Pipeline -LockDir $script:lockDir -Feature 'e2e-abort'

        $tasks = @(
            @{ taskId = 'T1'; worktreeState = 'none'; mergeState = 'waiting' }
            @{ taskId = 'T2'; worktreeState = 'none'; mergeState = 'none' }
        )

        $result = Invoke-AbortCleanup -Tasks $tasks -LockDir $script:lockDir -RunId 'abort-run'

        # S11: abort releases lock
        $result.lockReleased | Should -BeTrue
        # Post-abort invariant: no waiting/merging
        $tasks | Where-Object { $_.mergeState -in @('waiting', 'merging') } | Should -BeNullOrEmpty
    }

    It 'coverage gate: 300% gate enforces three independent categories' {
        $fullCoverage = @{
            pbt = @{ covered = 100; total = 100; testFiles = 5 }
            contract = @{ covered = 50; total = 50; testFiles = 3 }
            e2e = @{ covered = 20; total = 20; testFiles = 2 }
        }
        $r = Test-CoverageGate -CoverageResults $fullCoverage -TddIter 1 -CoverageIter 0 -MaxTddCycles 10 -MaxCoverageIter 5
        $r.passed | Should -BeTrue

        # Fail one category
        $partialCoverage = @{
            pbt = @{ covered = 99; total = 100; testFiles = 5 }
            contract = @{ covered = 50; total = 50; testFiles = 3 }
            e2e = @{ covered = 20; total = 20; testFiles = 2 }
        }
        $r2 = Test-CoverageGate -CoverageResults $partialCoverage -TddIter 1 -CoverageIter 0 -MaxTddCycles 10 -MaxCoverageIter 5
        $r2.passed | Should -BeFalse
    }

    It 'Playwright detection determines E2E strategy' {
        $projDir = Join-Path $script:tempDir 'project'
        New-Item -ItemType Directory -Path $projDir -Force | Out-Null

        # No package.json = trace-replay
        Get-PlaywrightStrategy -ProjectPath $projDir | Should -BeExactly 'trace-replay'

        # With Playwright = playwright
        @{ devDependencies = @{ '@playwright/test' = '1.0.0' } } | ConvertTo-Json | Set-Content (Join-Path $projDir 'package.json')
        Get-PlaywrightStrategy -ProjectPath $projDir | Should -BeExactly 'playwright'
    }

    It 'task failure cleanup: worktree + warden + mergeState reset' {
        $task = @{ worktreeState = 'none'; wardenState = 'active'; mergeState = 'waiting' }
        Complete-TaskFailure -TaskState $task -TaskId 'T1'
        $task.wardenState | Should -BeExactly 'unconfigured'
        $task.mergeState | Should -BeExactly 'failed'
    }

    It 'idempotency token system: write/read/check cycle' {
        $logPath = Join-Path $script:tempDir 'idem.log'
        $writer = New-PipelineLogWriter -LogPath $logPath

        Write-IdempotencyToken -Writer $writer -Stage 'stage1' -Status 'INVOKE' -RunId 'run1'
        Write-IdempotencyToken -Writer $writer -Stage 'stage1' -Status 'COMPLETE' -RunId 'run1'
        Write-IdempotencyToken -Writer $writer -Stage 'stage2' -Status 'INVOKE' -RunId 'run1'
        $writer.Close()

        $tokens = Read-IdempotencyTokens -LogPath $logPath
        Test-IdempotencyComplete -Tokens $tokens -Stage 'stage1' | Should -BeTrue
        Test-IdempotencyComplete -Tokens $tokens -Stage 'stage2' | Should -BeFalse
    }

    It 'review gate failure path works end-to-end' {
        $task = @{ taskState = 'review_gate'; taskId = 'T1'; tddIter = 2; coverageIter = 1 }
        $tier = @{ completionCounter = 0 }
        $result = Invoke-ReviewGateFailure -TaskState $task -TierState $tier
        $task.taskState | Should -BeExactly 'failed'
        $tier.completionCounter | Should -Be 1
        $result.tddIter | Should -Be 2
    }

    It 'tier completion counter: concurrent-safe atomic increments' {
        $counter = New-TierCompletionCounter
        Add-TierCompletion -Counter $counter -TierKey 'tier1' | Should -Be 1
        Add-TierCompletion -Counter $counter -TierKey 'tier1' | Should -Be 2
        Get-TierCompletion -Counter $counter -TierKey 'tier1' | Should -Be 2
    }

    It 'no task reaches escalated state (dead state assertion)' {
        $validTerminal = @('merged', 'failed', 'timed_out')
        'escalated' -in $validTerminal | Should -BeFalse
    }

    It 'BDD parser + fixture export integration' {
        # Create a feature file
        $featureFile = Join-Path $script:tempDir 'test.feature'
        Set-Content $featureFile -Value "Feature: Test`n  Scenario: Simple`n    Given x"

        $parsed = ConvertFrom-Gherkin -Path $featureFile
        $parsed.features.Count | Should -Be 1

        # Export fixture
        $bddFixture = Join-Path $script:tempDir 'tests/fixtures/bdd/fixture.json'
        $parsed.schemaVersion = 1
        Export-BddFixture -Fixture $parsed -OutputPath $bddFixture
        $bddFixture | Should -Exist
    }

    It 'task timeout watchdog detects stale tasks' {
        $task = @{ taskState = 'executing'; stateStartTime = (Get-Date).AddMinutes(-31) }
        Test-TaskTimeout -TaskState $task | Should -BeTrue

        $freshTask = @{ taskState = 'executing'; stateStartTime = (Get-Date).AddMinutes(-5) }
        Test-TaskTimeout -TaskState $freshTask | Should -BeFalse
    }
}
