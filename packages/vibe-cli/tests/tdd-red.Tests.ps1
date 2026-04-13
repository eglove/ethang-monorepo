BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
    . "$PSScriptRoot/../utils/result-contracts.ps1"
    . "$PSScriptRoot/../utils/task-log.ps1"
    . "$PSScriptRoot/../utils/workspace.ps1"
    . "$PSScriptRoot/../utils/tdd-red.ps1"
    . "$PSScriptRoot/helpers/claude-test-double.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Write-TaskLog {}
    Mock Get-PackageWorkDir { $WorktreePath }
}

Describe 'Invoke-RedPhase' {
    BeforeAll {
        $script:root = (Resolve-Path "$PSScriptRoot/..").Path
        $script:task = @{ id = 'T1'; title = 'Config'; testWriter = 'pester'; codeWriter = 'powershell-writer'; files = @('utils/config.ps1') }
    }

    It 'advances to GREEN when tests fail (expected RED)' {
        Mock Invoke-Claude { '{"filesModified":[]}' }
        Mock Invoke-VerifyCommand { 1 }  # exit code 1 = tests fail

        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Phase | Should -Be 'green'
        $result.Status | Should -Be 'running'
    }

    It 'enters RED retry when tests pass unexpectedly then fails on revised' {
        Mock Invoke-Claude { '{"verdict":"revised","filesModified":[]}' }
        $script:redVerifyCount = 0
        Mock Invoke-VerifyCommand {
            $script:redVerifyCount++
            if ($script:redVerifyCount -ge 2) { return 1 }  # Fail on second call (after revision)
            return 0  # Pass on first call (triggers retry)
        }

        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Phase | Should -Be 'green'
        $counters.redRetries | Should -BeGreaterThan 0
    }

    It 'skips to cleanup on already_implemented verdict' {
        Mock Invoke-Claude { '{"verdict":"already_implemented"}' }
        Mock Invoke-VerifyCommand { 0 }

        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Phase | Should -Be 'cleanup'
    }

    It 'skips to cleanup on already_implemented even when verify would fail' {
        Mock Invoke-Claude { '{"verdict":"already_implemented","filesModified":[]}' }
        Mock Invoke-VerifyCommand { 1 }

        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Phase | Should -Be 'cleanup'
        Should -Not -Invoke Invoke-VerifyCommand
    }

    It 'escalates on infrastructure failure without consuming retry' {
        Mock Invoke-Claude { throw 'exit code 127' }
        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'escalated'
        $counters.redRetries | Should -Be 0
    }

    It 'escalates when verify command throws during initial RED' {
        Mock Invoke-Claude { '{"filesModified":[]}' }
        Mock Invoke-VerifyCommand { throw 'command not found' }

        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'escalated'
        $result.Phase | Should -Be 'red'
    }

    It 'passes WorkspacePath through to verify command' {
        Mock Invoke-Claude { '{"filesModified":[]}' }
        Mock Invoke-VerifyCommand { 1 } -ParameterFilter { $WorkingDirectory -eq '/tmp/workspace' }

        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters -WorkspacePath '/tmp/workspace'
        $result.Phase | Should -Be 'green'
    }

    It 'decrements retries on infrastructure failure during retry' {
        $script:redClaudeCall = 0
        Mock Invoke-Claude {
            $script:redClaudeCall++
            if ($script:redClaudeCall -eq 1) { return '{"filesModified":[]}' }
            throw 'exit code 127'  # Infrastructure failure during retry
        }
        Mock Invoke-VerifyCommand { 0 }  # Tests pass = triggers retry loop

        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'escalated'
        $result.Phase | Should -Be 'red_retry'
        $counters.redRetries | Should -Be 0  # Incremented then decremented
    }

    It 'escalates when verify throws during retry verify' {
        $script:redClaudeCall2 = 0
        Mock Invoke-Claude {
            $script:redClaudeCall2++
            if ($script:redClaudeCall2 -eq 1) { return '{"filesModified":[]}' }
            return '{"verdict":"revised"}'
        }
        $script:redVerifyCall2 = 0
        Mock Invoke-VerifyCommand {
            $script:redVerifyCall2++
            if ($script:redVerifyCall2 -eq 1) { return 0 }  # Initial: tests pass
            throw 'verify crashed'  # Retry verify: infra failure
        }

        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'escalated'
        $result.Phase | Should -Be 'red_retry'
    }

    It 'logs still-passing when revised tests still pass and retries again' {
        $script:redClaudeCallSP = 0
        Mock Invoke-Claude {
            $script:redClaudeCallSP++
            if ($script:redClaudeCallSP -eq 1) { return '{"filesModified":[]}' }
            return '{"verdict":"revised"}'
        }
        $script:redVerifyCallSP = 0
        Mock Invoke-VerifyCommand {
            $script:redVerifyCallSP++
            if ($script:redVerifyCallSP -le 2) { return 0 }  # Initial + first retry: still pass
            return 1  # Second retry: now fail
        }

        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Phase | Should -Be 'green'
        $counters.redRetries | Should -Be 2
    }

    It 'accepts PSCustomObject task from ConvertFrom-Json' {
        # ConvertFrom-Json returns PSCustomObject, not hashtable
        $jsonTask = '{"id":"T1","title":"Config","testWriter":"pester","codeWriter":"powershell-writer","files":["utils/config.ps1"]}' | ConvertFrom-Json
        Mock Invoke-Claude { '{"filesModified":[]}' }
        Mock Invoke-VerifyCommand { 1 }

        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $jsonTask -Root $script:root -Counters $counters
        $result.Phase | Should -Be 'green'
    }
}

Describe 'Invoke-RedPhase — TestFiles extraction' {
    BeforeAll {
        $script:root = (Resolve-Path "$PSScriptRoot/..").Path
        $script:task = @{ id = 'T1'; title = 'Config'; testWriter = 'pester'; codeWriter = 'powershell-writer'; files = @('utils/config.ps1') }
    }

    It 'returns TestFiles from agent filesModified response' {
        Mock Invoke-Claude { '{"filesModified":[{"path":"tests/config-review-gate.Tests.ps1","action":"created"}],"summary":"wrote tests"}' }
        Mock Invoke-VerifyCommand { 1 }

        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.TestFiles | Should -Not -BeNullOrEmpty
        $result.TestFiles | Should -Contain 'tests/config-review-gate.Tests.ps1'
    }

    It 'returns empty TestFiles when no test files in response' {
        Mock Invoke-Claude { '{"filesModified":[{"path":"utils/config.ps1","action":"modified"}],"summary":"no tests"}' }
        Mock Invoke-VerifyCommand { 1 }

        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.TestFiles | Should -BeNullOrEmpty
    }

    It 'extracts multiple test files from response' {
        Mock Invoke-Claude { '{"filesModified":[{"path":"tests/a.Tests.ps1","action":"created"},{"path":"tests/b.spec.ts","action":"created"},{"path":"src/code.ps1","action":"modified"}]}' }
        Mock Invoke-VerifyCommand { 1 }

        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.TestFiles.Count | Should -Be 2
    }

    It 'preserves TestFiles when advancing to cleanup via already_implemented' {
        Mock Invoke-Claude { '{"verdict":"already_implemented","filesModified":[{"path":"tests/config.Tests.ps1","action":"created"}]}' }
        Mock Invoke-VerifyCommand { 0 }

        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Phase | Should -Be 'cleanup'
        $result.TestFiles | Should -Contain 'tests/config.Tests.ps1'
    }
}

Describe 'Reset-RedCounter' {
    It 'resets redRetries to 0' {
        $state = @{ redRetries = 3; greenAttempts = 5 }
        $result = Reset-RedCounter -State $state
        $result.redRetries | Should -Be 0
        $result.greenAttempts | Should -Be 5
    }
}
