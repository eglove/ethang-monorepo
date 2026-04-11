BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/result-contracts.ps1"
    . "$PSScriptRoot/../utils/task-log.ps1"
    . "$PSScriptRoot/../utils/workspace.ps1"
    . "$PSScriptRoot/../utils/tdd-cleanup.ps1"
    . "$PSScriptRoot/helpers/claude-test-double.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Write-TaskLog {}
    Mock Get-PackageWorkDir { $WorktreePath }
}

Describe 'Invoke-CleanupPhase' {
    BeforeAll {
        $script:root = (Resolve-Path "$PSScriptRoot/..").Path
        $script:task = @{ id = 'T1'; title = 'Config'; codeWriter = 'powershell-writer'; testWriter = 'pester'; files = @('utils/config.ps1') }
    }

    It 'completes after consecutive clean passes' {
        Mock Invoke-VerifyCommand { 0 }
        Mock Invoke-Claude { '{}' }

        $counters = @{ cleanupCleanPasses = 0; cleanupRemediations = 0 }
        $result = Invoke-CleanupPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Phase | Should -Be 'done'
        $result.Status | Should -Be 'completed'
        $counters.cleanupCleanPasses | Should -Be $Config.CleanupPasses
    }

    It 'resets clean passes on failure and triggers remediation' {
        $script:verifyRound = 0
        Mock Invoke-VerifyCommand {
            $script:verifyRound++
            # First 3 calls pass (1 full pass), 4th fails (test cmd of 2nd pass)
            if ($script:verifyRound -le 3) { 0 }
            elseif ($script:verifyRound -eq 4) { 1 }
            else { 0 }  # After remediation, all pass
        }
        Mock Invoke-Claude { '{"blame":"code"}' }

        $counters = @{ cleanupCleanPasses = 0; cleanupRemediations = 0 }
        $result = Invoke-CleanupPhase -Task $script:task -Root $script:root -Counters $counters
        $counters.cleanupRemediations | Should -BeGreaterThan 0
    }

    It 'short-circuits verify on first failure' {
        $script:cmdsCalled = [System.Collections.ArrayList]::new()
        Mock Invoke-VerifyCommand {
            param($Command)
            $null = $script:cmdsCalled.Add($Command)
            if ($Command -eq $Config.VerifyLint) { return 1 }
            return 0
        }
        Mock Invoke-Claude { '{"blame":"code"}' }

        # Force exhaustion to terminate the loop
        $counters = @{ cleanupCleanPasses = 0; cleanupRemediations = $Config.MaxFixRounds }
        Invoke-CleanupPhase -Task $script:task -Root $script:root -Counters $counters

        # VerifyTsc should NOT be in the list (short-circuit after lint fails)
        $script:cmdsCalled | Should -Not -Contain $Config.VerifyTsc
    }

    It 'escalates when remediation exhausted' {
        Mock Invoke-VerifyCommand { 1 }
        Mock Invoke-Claude { '{"blame":"code"}' }

        $counters = @{ cleanupCleanPasses = 0; cleanupRemediations = $Config.MaxFixRounds }
        $result = Invoke-CleanupPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'escalated'
        $result.Phase | Should -Be 'cleanup_remed'
    }

    It 'does not dispatch remediation when already at max (boundary)' {
        Mock Invoke-VerifyCommand { 1 }
        Mock Invoke-Claude { '{"blame":"code"}' }

        $counters = @{ cleanupCleanPasses = 0; cleanupRemediations = $Config.MaxFixRounds }
        Invoke-CleanupPhase -Task $script:task -Root $script:root -Counters $counters
        Should -Not -Invoke Invoke-Claude
    }

    It 'dispatches test writer on blame=test' {
        $script:claudeFiles = [System.Collections.ArrayList]::new()
        $script:verifyIdx_bt = 0
        Mock Invoke-VerifyCommand {
            $script:verifyIdx_bt++
            if ($script:verifyIdx_bt -eq 1) { 1 } else { 0 }
        }
        Mock Invoke-Claude {
            $null = $script:claudeFiles.Add($SystemPromptFile)
            if ($script:claudeFiles.Count -eq 1) { return '{"blame":"test"}' }
            return '{}'
        }

        $counters = @{ cleanupCleanPasses = 0; cleanupRemediations = 0 }
        Invoke-CleanupPhase -Task $script:task -Root $script:root -Counters $counters
        # Second call should be the remediation dispatch — should use test writer
        $script:claudeFiles[1] | Should -Match 'test-writers'
    }

    It 'dispatches code writer on blame=code' {
        $script:claudeFiles2 = [System.Collections.ArrayList]::new()
        $script:verifyIdx_bc = 0
        Mock Invoke-VerifyCommand {
            $script:verifyIdx_bc++
            if ($script:verifyIdx_bc -eq 1) { 1 } else { 0 }
        }
        Mock Invoke-Claude {
            $null = $script:claudeFiles2.Add($SystemPromptFile)
            if ($script:claudeFiles2.Count -eq 1) { return '{"blame":"code"}' }
            return '{}'
        }

        $counters = @{ cleanupCleanPasses = 0; cleanupRemediations = 0 }
        Invoke-CleanupPhase -Task $script:task -Root $script:root -Counters $counters
        # Second call should use code writer
        $script:claudeFiles2[1] | Should -Match 'code-writers'
    }

    It 'escalates on infrastructure failure during cleanup' {
        Mock Invoke-VerifyCommand { throw 'exit code 127' }

        $counters = @{ cleanupCleanPasses = 0; cleanupRemediations = 0 }
        $result = Invoke-CleanupPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'escalated'
        $counters.cleanupRemediations | Should -Be 0
    }

    It 'initializes missing counter keys' {
        Mock Invoke-VerifyCommand { 0 }

        $counters = @{}  # No cleanupCleanPasses or cleanupRemediations keys
        $result = Invoke-CleanupPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'completed'
        $counters.cleanupCleanPasses | Should -BeGreaterOrEqual $Config.CleanupPasses
    }

    It 'passes WorkspacePath through to verify commands' {
        Mock Invoke-VerifyCommand { 0 } -ParameterFilter { $WorkingDirectory -eq '/tmp/ws' }

        $counters = @{ cleanupCleanPasses = 0; cleanupRemediations = 0 }
        $result = Invoke-CleanupPhase -Task $script:task -Root $script:root -Counters $counters -WorkspacePath '/tmp/ws'
        $result.Status | Should -Be 'completed'
    }

    It 'escalates on infrastructure failure during blame dispatch' {
        $script:cleanVerifyCall = 0
        Mock Invoke-VerifyCommand {
            $script:cleanVerifyCall++
            if ($script:cleanVerifyCall -eq 1) { return 1 }  # First call fails
            return 0
        }
        Mock Invoke-Claude { throw 'blame infra failure' }

        $counters = @{ cleanupCleanPasses = 0; cleanupRemediations = 0 }
        $result = Invoke-CleanupPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'escalated'
        $result.Phase | Should -Be 'cleanup_remed'
    }

    It 'skips fix dispatch when blame is neither' {
        $script:neitherVerifyIdx = 0
        Mock Invoke-VerifyCommand {
            $script:neitherVerifyIdx++
            if ($script:neitherVerifyIdx -eq 1) { return 1 }  # First call fails
            return 0  # After skipping remediation, all pass
        }
        Mock Invoke-Claude { return '{"blame":"neither"}' }

        $counters = @{ cleanupCleanPasses = 0; cleanupRemediations = 0 }
        $result = Invoke-CleanupPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'completed'
        # Invoke-Claude should be called exactly once (blame query only, no fix dispatch)
        Should -Invoke Invoke-Claude -Times 1 -Exactly
    }

    It 'skips fix dispatch when blame response is unparseable' {
        $script:nullBlameVerifyIdx = 0
        Mock Invoke-VerifyCommand {
            $script:nullBlameVerifyIdx++
            if ($script:nullBlameVerifyIdx -eq 1) { return 1 }  # First call fails
            return 0  # After skipping remediation, all pass
        }
        Mock Invoke-Claude { return 'just some prose with no json at all' }

        $counters = @{ cleanupCleanPasses = 0; cleanupRemediations = 0 }
        $result = Invoke-CleanupPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'completed'
        # Invoke-Claude should be called exactly once (blame query only, no fix dispatch)
        Should -Invoke Invoke-Claude -Times 1 -Exactly
    }

    It 'escalates on infrastructure failure during remediation dispatch' {
        $script:cleanVerifyCall2 = 0
        Mock Invoke-VerifyCommand {
            $script:cleanVerifyCall2++
            if ($script:cleanVerifyCall2 -eq 1) { return 1 }  # First call fails
            return 0
        }
        $script:cleanClaudeCall2 = 0
        Mock Invoke-Claude {
            $script:cleanClaudeCall2++
            if ($script:cleanClaudeCall2 -eq 1) { return '{"blame":"code"}' }  # Blame OK
            throw 'remediation infra failure'  # Fix dispatch fails
        }

        $counters = @{ cleanupCleanPasses = 0; cleanupRemediations = 0 }
        $result = Invoke-CleanupPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'escalated'
        $result.Phase | Should -Be 'cleanup_remed'
    }
}

Describe 'Reset-CleanupCounters' {
    It 'resets BOTH counters to 0' {
        $state = @{ cleanupRemediations = 5; cleanupCleanPasses = 1; redRetries = 2 }
        $result = Reset-CleanupCounters -State $state
        $result.cleanupRemediations | Should -Be 0
        $result.cleanupCleanPasses | Should -Be 0
        $result.redRetries | Should -Be 2
    }
}
