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

    It 'initializes counters when missing' {
        Mock Invoke-VerifyCommand { 0 }
        $counters = @{}  # No finalCleanPasses or finalRemediations
        $result = Invoke-FinalVerification -Root $script:root -Counters $counters
        $result.finalVerifPhase | Should -Be 'completed'
        $counters.finalCleanPasses | Should -BeGreaterOrEqual $Config.CleanupPasses
    }

    It 'escalates when remediation Claude call throws' {
        $script:fvVerifyIdx = 0
        Mock Invoke-VerifyCommand {
            $script:fvVerifyIdx++
            if ($script:fvVerifyIdx -eq 1) { return 1 }  # First call fails
            return 0
        }
        Mock Invoke-Claude { throw 'infra failure' }
        Mock git { @('file.ps1') }

        $counters = @{ finalCleanPasses = 0; finalRemediations = 0 }
        $result = Invoke-FinalVerification -Root $script:root -Counters $counters
        $result.finalVerifPhase | Should -Be 'escalated'
    }

    It 'attributes remediation to task with most file overlap' {
        $script:fvVerifyIdx2 = 0
        Mock Invoke-VerifyCommand {
            $script:fvVerifyIdx2++
            if ($script:fvVerifyIdx2 -eq 1) { return 1 }  # First call fails
            return 0
        }
        Mock Invoke-Claude { '{}' }
        Mock git { @('utils/config.ps1', 'utils/task-log.ps1') }

        $featDir = Join-Path ([System.IO.Path]::GetTempPath()) "fv-attr-$(Get-Random)"
        $ticketsDir = Join-Path $featDir 'tickets'
        New-Item -ItemType Directory -Path $ticketsDir -Force | Out-Null
        Set-Content (Join-Path $ticketsDir 'T1-log.txt') -Value 'modified utils/config.ps1'
        Set-Content (Join-Path $ticketsDir 'T2-log.txt') -Value 'modified utils/config.ps1 and utils/task-log.ps1'

        $counters = @{ finalCleanPasses = 0; finalRemediations = 0 }
        $result = Invoke-FinalVerification -Root $script:root -Counters $counters -TaskWriters @('powershell-writer') -FeatureDir $featDir

        $result.finalVerifPhase | Should -Be 'completed'
        $counters.finalRemediations | Should -Be 1

        Remove-Item $featDir -Recurse -Force
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
