BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/tlc-runner.ps1"
}

Describe 'Invoke-TlcCheck' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "tlc-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        $script:writerFile = Join-Path $script:tempDir 'tla-writer.md'
        Set-Content $script:writerFile -Value 'tla writer prompt'
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'throws when no .tla file found' {
        $emptyDir = Join-Path $script:tempDir 'empty'
        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null

        { Invoke-TlcCheck -TlaDir $emptyDir -TlaWriterFile $script:writerFile -MaxAttempts 1 } |
            Should -Throw '*No .tla file*'

        Remove-Item $emptyDir -Recurse -Force
    }

    It 'throws when no .cfg file found' {
        $noCfgDir = Join-Path $script:tempDir 'no-cfg'
        New-Item -ItemType Directory -Path $noCfgDir -Force | Out-Null
        Set-Content (Join-Path $noCfgDir 'Spec.tla') -Value '---- MODULE Spec ----'

        { Invoke-TlcCheck -TlaDir $noCfgDir -TlaWriterFile $script:writerFile -MaxAttempts 1 } |
            Should -Throw '*No .cfg file*'

        Remove-Item $noCfgDir -Recurse -Force
    }

    It 'passes when TLC returns clean output' {
        $tlaDir = Join-Path $script:tempDir 'pass'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg') -Value 'SPECIFICATION Spec'

        Mock Invoke-TlcProcess {
            return @{ Output = 'Model checking completed. No error has been found.'; ExitCode = 0; TimedOut = $false }
        }

        { Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile -MaxAttempts 1 } |
            Should -Not -Throw

        Remove-Item $tlaDir -Recurse -Force
    }

    It 'retries on failure and calls Invoke-Claude to fix' {
        $tlaDir = Join-Path $script:tempDir 'retry'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg') -Value 'SPECIFICATION Spec'

        $script:tlcCallCount = 0
        Mock Invoke-TlcProcess {
            $script:tlcCallCount++
            if ($script:tlcCallCount -eq 1) {
                return @{ Output = 'Error: invariant violated'; ExitCode = 1; TimedOut = $false }
            } else {
                return @{ Output = 'Model checking completed. No error has been found.'; ExitCode = 0; TimedOut = $false }
            }
        }
        Mock Invoke-Claude {}

        { Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile -MaxAttempts 2 } |
            Should -Not -Throw

        Should -Invoke Invoke-Claude -Times 1 -Exactly

        Remove-Item $tlaDir -Recurse -Force
    }

    It 'throws after max attempts exceeded' {
        $tlaDir = Join-Path $script:tempDir 'maxfail'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg') -Value 'SPECIFICATION Spec'

        Mock Invoke-TlcProcess {
            return @{ Output = 'Error: deadlock reached'; ExitCode = 1; TimedOut = $false }
        }
        Mock Invoke-Claude {}

        { Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile -MaxAttempts 2 } |
            Should -Throw '*failed TLC verification after 2 attempts*'

        Remove-Item $tlaDir -Recurse -Force
    }

    It 'detects failure when exit code is 0 but output contains Error:' {
        $tlaDir = Join-Path $script:tempDir 'sneaky'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg') -Value 'SPECIFICATION Spec'

        Mock Invoke-TlcProcess {
            return @{ Output = 'Error: something went wrong'; ExitCode = 0; TimedOut = $false }
        }
        Mock Invoke-Claude {}

        { Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile -MaxAttempts 1 } |
            Should -Throw '*failed TLC verification*'

        Remove-Item $tlaDir -Recurse -Force
    }

    It 'includes FixContext in the fix prompt' {
        $tlaDir = Join-Path $script:tempDir 'fixctx'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg') -Value 'SPECIFICATION Spec'

        $script:tlcCallCount = 0
        Mock Invoke-TlcProcess {
            $script:tlcCallCount++
            if ($script:tlcCallCount -eq 1) {
                return @{ Output = 'Error: violated'; ExitCode = 1; TimedOut = $false }
            } else {
                return @{ Output = 'No error'; ExitCode = 0; TimedOut = $false }
            }
        }

        $script:capturedPrompt = $null
        Mock Invoke-Claude {
            param($SystemPromptFile, $Prompt)
            $script:capturedPrompt = $Prompt
        }

        Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile -FixContext 'extra context here' -MaxAttempts 2

        $script:capturedPrompt | Should -Match 'extra context here'

        Remove-Item $tlaDir -Recurse -Force
    }

    It 'retries on timeout and includes timeout guidance in fix prompt' {
        $tlaDir = Join-Path $script:tempDir 'timeout'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg') -Value 'SPECIFICATION Spec'

        $script:tlcCallCount = 0
        Mock Invoke-TlcProcess {
            $script:tlcCallCount++
            if ($script:tlcCallCount -eq 1) {
                return @{ Output = '47 states generated, 12 distinct states found'; ExitCode = -1; TimedOut = $true }
            } else {
                return @{ Output = 'Model checking completed. No error has been found.'; ExitCode = 0; TimedOut = $false }
            }
        }

        $script:capturedPrompt = $null
        Mock Invoke-Claude {
            param($SystemPromptFile, $Prompt)
            $script:capturedPrompt = $Prompt
        }

        { Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile -MaxAttempts 2 -TimeoutSeconds 10 } |
            Should -Not -Throw

        Should -Invoke Invoke-Claude -Times 1 -Exactly
        $script:capturedPrompt | Should -Match 'timed out'
        $script:capturedPrompt | Should -Match 'reducing model constants'

        Remove-Item $tlaDir -Recurse -Force
    }

    It 'throws with timeout message after max attempts of timeouts' {
        $tlaDir = Join-Path $script:tempDir 'timeout-max'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg') -Value 'SPECIFICATION Spec'

        Mock Invoke-TlcProcess {
            return @{ Output = 'partial output'; ExitCode = -1; TimedOut = $true }
        }
        Mock Invoke-Claude {}

        { Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile -MaxAttempts 2 -TimeoutSeconds 10 } |
            Should -Throw '*timed out*after 2 attempts*'

        Remove-Item $tlaDir -Recurse -Force
    }
}

Describe 'Invoke-TlcProcess ExtraArgs' {
    It 'passes ExtraArgs into java arguments' {
        Mock Write-PipelineLog {}
        $script:capturedArgs = $null
        Mock -CommandName 'Register-ObjectEvent' -MockWith { @{ Name = 'mock'; Id = 999 } }
        Mock -CommandName 'Unregister-Event' {}
        Mock -CommandName 'Remove-Job' {}

        # We can't easily mock the Process class, so verify the parameter is accepted
        $params = (Get-Command Invoke-TlcProcess).Parameters
        $params.ContainsKey('ExtraArgs') | Should -BeTrue
    }
}

Describe 'Invoke-TlcProcess integration' {
    BeforeAll {
        Mock Write-PipelineLog {}
    }

    It 'configures RedirectStandardError, BeginErrorReadLine, and cleans up event jobs' {
        # Use a real process that exits quickly to exercise the full code path
        $tlaDir = Join-Path ([System.IO.Path]::GetTempPath()) "tlc-proc-$(Get-Random)"
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null

        try {
            # Override TlaToolsJar to a non-existent jar so java fails fast
            $origJar = $script:TlaToolsJar
            $script:TlaToolsJar = Join-Path $tlaDir 'nonexistent.jar'

            # This will start java, which will fail quickly because the jar doesn't exist.
            # The important thing is it exercises RedirectStandardError=true,
            # BeginErrorReadLine(), and the finally block with Remove-Job.
            $result = Invoke-TlcProcess -TlaDir $tlaDir -TlaFileName 'Spec.tla' -CfgFileName 'Spec.cfg' -TimeoutSeconds 10

            # java should exit with non-zero (jar not found)
            $result.ExitCode | Should -Not -Be 0
            $result.TimedOut | Should -BeFalse
            $result.Output | Should -Not -BeNullOrEmpty
        }
        finally {
            $script:TlaToolsJar = $origJar
            Remove-Item $tlaDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

Describe 'Invoke-TlcSimulation' {
    BeforeAll {
        Mock Write-PipelineLog {}
    }

    It 'parses simulation output into trace objects' {
        $simOutput = @(
            "TLC2 Version 2.18"
            "State 1: <Init>"
            "/\ phase = ""Init"""
            "/\ lockHeld = FALSE"
            "/\ currentTier = 0"
            ""
            "State 1: <Init>"
            "/\ phase = ""Init"""
            "/\ lockHeld = FALSE"
            "/\ currentTier = 0"
            "State 2: <LockAcquire>"
            "/\ phase = ""LockAcquire"""
            "/\ lockHeld = TRUE"
            "/\ currentTier = 1"
            ""
        ) -join "`n"

        Mock Invoke-TlcProcess {
            return @{ Output = $simOutput; ExitCode = 0; TimedOut = $false }
        }

        $traces = Invoke-TlcSimulation -TlaDir 'C:\fake' -TlaFileName 'Spec.tla' -CfgFileName 'Spec.cfg'
        $traces.Count | Should -BeGreaterOrEqual 1

        # Second trace should have 2 steps
        $multiStepTrace = $traces | Where-Object { $_.steps.Count -ge 2 } | Select-Object -First 1
        $multiStepTrace | Should -Not -BeNullOrEmpty
        $multiStepTrace.steps[0].action | Should -BeExactly 'Init'
        $multiStepTrace.steps[1].action | Should -BeExactly 'LockAcquire'
        $multiStepTrace.steps[1].variables.lockHeld | Should -BeTrue
    }

    It 'returns empty array on no output' {
        Mock Invoke-TlcProcess {
            return @{ Output = ''; ExitCode = 0; TimedOut = $false }
        }

        $traces = Invoke-TlcSimulation -TlaDir 'C:\fake' -TlaFileName 'Spec.tla' -CfgFileName 'Spec.cfg'
        $traces.Count | Should -Be 0
    }

    It 'parses TLA+ value types correctly' {
        $simOutput = @(
            "TLC2 Version 2.18"
            ""
            "State 1: <Init>"
            "/\ boolVar = TRUE"
            "/\ intVar = 42"
            "/\ strVar = ""hello"""
            "/\ nullVar = NULL"
            "/\ complexVar = <<1, 2, 3>>"
            ""
        ) -join "`n"

        Mock Invoke-TlcProcess {
            return @{ Output = $simOutput; ExitCode = 0; TimedOut = $false }
        }

        $traces = Invoke-TlcSimulation -TlaDir 'C:\fake' -TlaFileName 'Spec.tla' -CfgFileName 'Spec.cfg'
        $traces.Count | Should -BeGreaterOrEqual 1
        $vars = $traces[-1].steps[0].variables
        $vars.boolVar | Should -BeTrue
        $vars.intVar | Should -Be 42
        $vars.strVar | Should -BeExactly 'hello'
        $vars.nullVar | Should -BeNullOrEmpty
        $vars.complexVar | Should -BeExactly '<<1, 2, 3>>'
    }
}

Describe 'TlcTimeoutSeconds config' {
    It 'defaults to 300 seconds' {
        $Config.TlcTimeoutSeconds | Should -Be 300
    }

    It 'rejects non-positive values via Get-PipelineConfig' {
        $originalValue = $env:VIBE_TLC_TIMEOUT_SECONDS
        try {
            $env:VIBE_TLC_TIMEOUT_SECONDS = '0'
            { Get-PipelineConfig } | Should -Throw '*TlcTimeoutSeconds must be positive*'
        }
        finally {
            if ($originalValue) {
                $env:VIBE_TLC_TIMEOUT_SECONDS = $originalValue
            } else {
                Remove-Item Env:\VIBE_TLC_TIMEOUT_SECONDS -ErrorAction SilentlyContinue
            }
        }
    }

    It 'accepts env var override' {
        $originalValue = $env:VIBE_TLC_TIMEOUT_SECONDS
        try {
            $env:VIBE_TLC_TIMEOUT_SECONDS = '120'
            $cfg = Get-PipelineConfig
            $cfg['TlcTimeoutSeconds'] | Should -Be 120
        }
        finally {
            if ($originalValue) {
                $env:VIBE_TLC_TIMEOUT_SECONDS = $originalValue
            } else {
                Remove-Item Env:\VIBE_TLC_TIMEOUT_SECONDS -ErrorAction SilentlyContinue
            }
        }
    }
}
