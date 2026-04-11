BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/result-contracts.ps1"
    . "$PSScriptRoot/../utils/task-log.ps1"
    . "$PSScriptRoot/../utils/tdd-green.ps1"
    . "$PSScriptRoot/helpers/claude-test-double.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Write-TaskLog {}
}

Describe 'Invoke-GreenPhase' {
    BeforeAll {
        $script:root = (Resolve-Path "$PSScriptRoot/..").Path
        $script:task = @{ id = 'T1'; title = 'Config'; codeWriter = 'powershell-writer'; testWriter = 'pester'; files = @('utils/config.ps1') }
    }

    It 'advances to cleanup when tests pass' {
        Mock Invoke-Claude { '{"filesModified":[{"path":"utils/config.ps1","action":"modified"}],"summary":"done"}' }
        Mock Invoke-VerifyCommand { 0 }

        $counters = @{ greenAttempts = 0 }
        $result = Invoke-GreenPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Phase | Should -Be 'cleanup'
        $result.Status | Should -Be 'running'
    }

    It 'increments greenAttempts on failure' {
        $script:greenCallCount = 0
        Mock Invoke-Claude { '{"filesModified":[{"path":"utils/config.ps1","action":"modified"}],"summary":"try"}' }
        Mock Invoke-VerifyCommand {
            $script:greenCallCount++
            if ($script:greenCallCount -ge 2) { return 0 }
            return 1
        }

        $counters = @{ greenAttempts = 0 }
        $result = Invoke-GreenPhase -Task $script:task -Root $script:root -Counters $counters
        $counters.greenAttempts | Should -BeGreaterThan 0
    }

    It 'escalates at MaxTddCycles boundary' {
        Mock Invoke-Claude { '{"filesModified":[]}' }
        Mock Invoke-VerifyCommand { 1 }

        $counters = @{ greenAttempts = $Config.MaxTddCycles }
        $result = Invoke-GreenPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'escalated'
        $result.Phase | Should -Be 'green_retry'
    }

    It 'does not call Invoke-Claude when already at max (boundary)' {
        Mock Invoke-Claude { '{"filesModified":[]}' }
        Mock Invoke-VerifyCommand { 1 }

        $counters = @{ greenAttempts = $Config.MaxTddCycles }
        Invoke-GreenPhase -Task $script:task -Root $script:root -Counters $counters
        Should -Not -Invoke Invoke-Claude
    }

    It 'rejects test file modifications and counts as attempt' {
        Mock Invoke-Claude { '{"filesModified":[{"path":"tests/config.Tests.ps1","action":"modified"}]}' }
        Mock Invoke-VerifyCommand { 0 }

        $script:claudeCallCount2 = 0
        Mock Invoke-Claude {
            $script:claudeCallCount2++
            if ($script:claudeCallCount2 -eq 1) {
                '{"filesModified":[{"path":"tests/config.Tests.ps1","action":"modified"}]}'
            }
            else {
                '{"filesModified":[{"path":"utils/config.ps1","action":"modified"}]}'
            }
        }

        $counters = @{ greenAttempts = 0 }
        $result = Invoke-GreenPhase -Task $script:task -Root $script:root -Counters $counters
        $counters.greenAttempts | Should -BeGreaterThan 0
    }

    It 'skips to cleanup when code writer reports already_implemented' {
        Mock Invoke-Claude { '{"verdict":"already_implemented","filesModified":[]}' }
        Mock Invoke-VerifyCommand { 1 }

        $counters = @{ greenAttempts = 0 }
        $result = Invoke-GreenPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Phase | Should -Be 'cleanup'
        $result.Status | Should -Be 'running'
        $counters.greenAttempts | Should -Be 0
    }

    It 'skips to cleanup when code writer makes no file changes' {
        Mock Invoke-Claude { '{"filesModified":[],"summary":"no changes needed"}' }
        Mock Invoke-VerifyCommand { 1 }

        $counters = @{ greenAttempts = 0 }
        $result = Invoke-GreenPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Phase | Should -Be 'cleanup'
        $result.Status | Should -Be 'running'
        $counters.greenAttempts | Should -Be 0
        Should -Not -Invoke Invoke-VerifyCommand
    }

    It 'escalates on infrastructure failure without incrementing counter' {
        Mock Invoke-Claude { throw 'command not found' }
        $counters = @{ greenAttempts = 0 }
        $result = Invoke-GreenPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'escalated'
        $counters.greenAttempts | Should -Be 0
    }

    It 'passes WorkspacePath through to verify command' {
        Mock Invoke-Claude { '{"filesModified":[{"path":"utils/config.ps1","action":"modified"}]}' }
        Mock Invoke-VerifyCommand { 0 } -ParameterFilter { $WorkingDirectory -eq '/tmp/ws' }

        $counters = @{ greenAttempts = 0 }
        $result = Invoke-GreenPhase -Task $script:task -Root $script:root -Counters $counters -WorkspacePath '/tmp/ws'
        $result.Phase | Should -Be 'cleanup'
    }

    It 'escalates when verify command throws' {
        Mock Invoke-Claude { '{"filesModified":[{"path":"utils/config.ps1","action":"modified"}]}' }
        Mock Invoke-VerifyCommand { throw 'verify crashed' }

        $counters = @{ greenAttempts = 0 }
        $result = Invoke-GreenPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Status | Should -Be 'escalated'
        $result.Phase | Should -Be 'green'
    }
}

Describe 'Invoke-GreenPhase — scoped test verification' {
    BeforeAll {
        $script:root = (Resolve-Path "$PSScriptRoot/..").Path
        $script:task = @{ id = 'T1'; title = 'Config'; codeWriter = 'powershell-writer'; testWriter = 'pester'; files = @('utils/config.ps1') }
    }

    It 'uses Invoke-ScopedTestVerify when TestFiles provided' {
        Mock Invoke-Claude { '{"filesModified":[{"path":"utils/config.ps1","action":"modified"}]}' }
        Mock Invoke-ScopedTestVerify { 0 }
        Mock Invoke-VerifyCommand { throw 'should not be called for tests' }

        $counters = @{ greenAttempts = 0 }
        $result = Invoke-GreenPhase -Task $script:task -Root $script:root -Counters $counters -TestFiles @('tests/config.Tests.ps1')
        $result.Phase | Should -Be 'cleanup'
        Should -Invoke Invoke-ScopedTestVerify -Times 1
        Should -Not -Invoke Invoke-VerifyCommand
    }

    It 'falls back to Invoke-VerifyCommand when no TestFiles' {
        Mock Invoke-Claude { '{"filesModified":[{"path":"utils/config.ps1","action":"modified"}]}' }
        Mock Invoke-VerifyCommand { 0 }

        $counters = @{ greenAttempts = 0 }
        $result = Invoke-GreenPhase -Task $script:task -Root $script:root -Counters $counters
        $result.Phase | Should -Be 'cleanup'
        Should -Invoke Invoke-VerifyCommand -Times 1
    }

    It 'passes TestFiles array to Invoke-ScopedTestVerify' {
        Mock Invoke-Claude { '{"filesModified":[{"path":"utils/config.ps1","action":"modified"}]}' }
        Mock Invoke-ScopedTestVerify { 0 } -ParameterFilter { $TestFiles -contains 'tests/a.Tests.ps1' -and $TestFiles -contains 'tests/b.Tests.ps1' }

        $counters = @{ greenAttempts = 0 }
        $result = Invoke-GreenPhase -Task $script:task -Root $script:root -Counters $counters -TestFiles @('tests/a.Tests.ps1', 'tests/b.Tests.ps1')
        $result.Phase | Should -Be 'cleanup'
    }

    It 'retries with scoped verify on failure' {
        $script:scopedCallCount = 0
        Mock Invoke-Claude { '{"filesModified":[{"path":"utils/config.ps1","action":"modified"}]}' }
        Mock Invoke-ScopedTestVerify {
            $script:scopedCallCount++
            if ($script:scopedCallCount -ge 2) { return 0 }
            return 1
        }

        $counters = @{ greenAttempts = 0 }
        $result = Invoke-GreenPhase -Task $script:task -Root $script:root -Counters $counters -TestFiles @('tests/config.Tests.ps1')
        $result.Phase | Should -Be 'cleanup'
        $counters.greenAttempts | Should -Be 1
    }
}

Describe 'Reset-GreenCounters' {
    It 'resets greenAttempts to 0 and preserves other fields' {
        $state = @{ greenAttempts = 50; redRetries = 2 }
        $result = Reset-GreenCounters -State $state
        $result.greenAttempts | Should -Be 0
        $result.redRetries | Should -Be 2
    }
}
