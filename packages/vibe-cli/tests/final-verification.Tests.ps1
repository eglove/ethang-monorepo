BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/result-contracts.ps1"
    . "$PSScriptRoot/../utils/task-log.ps1"
    . "$PSScriptRoot/../utils/final-verification.ps1"
    . "$PSScriptRoot/helpers/claude-test-double.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Write-TaskLog {}
}

Describe 'Invoke-FinalVerification' {
    BeforeAll {
        $script:root = (Resolve-Path "$PSScriptRoot/..").Path
    }

    It 'completes after consecutive clean passes' {
        Mock Invoke-VerifyCommand { 0 }
        $counters = @{ finalCleanPasses = 0; finalRemediations = 0 }
        $result = Invoke-FinalVerification -Root $script:root -Counters $counters
        $result.finalVerifPhase | Should -Be 'completed'
    }

    It 'resets clean passes on failure and enters remediation' {
        $script:finalVerifyIdx = 0
        Mock Invoke-VerifyCommand {
            $script:finalVerifyIdx++
            # First 3 pass (1 round), 4th fails, then all pass
            if ($script:finalVerifyIdx -le 3) { 0 }
            elseif ($script:finalVerifyIdx -eq 4) { 1 }
            else { 0 }
        }
        Mock Invoke-Claude { '{}' }

        $counters = @{ finalCleanPasses = 0; finalRemediations = 0 }
        $result = Invoke-FinalVerification -Root $script:root -Counters $counters
        $counters.finalRemediations | Should -BeGreaterThan 0
        $result.finalVerifPhase | Should -Be 'completed'
    }

    It 'escalates when remediation exhausted' {
        Mock Invoke-VerifyCommand { 1 }
        Mock Invoke-Claude { '{}' }

        $counters = @{ finalCleanPasses = 0; finalRemediations = $Config.MaxFixRounds }
        $result = Invoke-FinalVerification -Root $script:root -Counters $counters
        $result.finalVerifPhase | Should -Be 'escalated'
    }

    It 'does not dispatch remediation at boundary' {
        Mock Invoke-VerifyCommand { 1 }
        Mock Invoke-Claude { '{}' }

        $counters = @{ finalCleanPasses = 0; finalRemediations = $Config.MaxFixRounds }
        Invoke-FinalVerification -Root $script:root -Counters $counters
        Should -Not -Invoke Invoke-Claude
    }

    It 'escalates on infrastructure failure' {
        Mock Invoke-VerifyCommand { throw 'exit code 127' }
        $counters = @{ finalCleanPasses = 0; finalRemediations = 0 }
        $result = Invoke-FinalVerification -Root $script:root -Counters $counters
        $result.finalVerifPhase | Should -Be 'escalated'
    }
}

Describe 'Reset-FinalCounters' {
    It 'resets both counters AND sets finalVerifPhase to running' {
        $state = @{ finalRemediations = 5; finalCleanPasses = 1; finalVerifPhase = 'escalated' }
        $result = Reset-FinalCounters -State $state
        $result.finalRemediations | Should -Be 0
        $result.finalCleanPasses | Should -Be 0
        $result.finalVerifPhase | Should -Be 'running'
    }
}
