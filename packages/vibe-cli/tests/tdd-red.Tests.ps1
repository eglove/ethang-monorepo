BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/result-contracts.ps1"
    . "$PSScriptRoot/../utils/task-log.ps1"
    . "$PSScriptRoot/../utils/tdd-red.ps1"
    . "$PSScriptRoot/helpers/claude-test-double.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Write-TaskLog {}
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

    It 'escalates when redRetries reaches MaxRedRetries' {
        Mock Invoke-Claude { '{"verdict":"revised"}' }
        Mock Invoke-VerifyCommand { 0 }

        $counters = @{ redRetries = $Config.MaxRedRetries }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'escalated'
        $result.Phase | Should -Be 'red_retry'
    }

    It 'does not call Invoke-Claude when already at max retries (boundary check)' {
        Mock Invoke-Claude { '{"verdict":"revised"}' }
        Mock Invoke-VerifyCommand { 0 }

        $counters = @{ redRetries = $Config.MaxRedRetries }
        Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters

        # Invoke-Claude should be called once for initial test writing, but NOT for retry
        Should -Invoke Invoke-Claude -Times 1
    }

    It 'escalates on infrastructure failure without consuming retry' {
        Mock Invoke-Claude { throw 'exit code 127' }
        $counters = @{ redRetries = 0 }
        $result = Invoke-RedPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'escalated'
        $counters.redRetries | Should -Be 0
    }
}

Describe 'Reset-RedCounters' {
    It 'resets redRetries to 0' {
        $state = @{ redRetries = 3; greenAttempts = 5 }
        $result = Reset-RedCounters -State $state
        $result.redRetries | Should -Be 0
        $result.greenAttempts | Should -Be 5
    }
}
