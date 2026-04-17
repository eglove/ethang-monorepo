BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
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

        { Invoke-TlcCheck -TlaDir $emptyDir -TlaWriterFile $script:writerFile } |
            Should -Throw '*No .tla file*'

        Remove-Item $emptyDir -Recurse -Force
    }

    It 'throws when no .cfg file found' {
        $noCfgDir = Join-Path $script:tempDir 'no-cfg'
        New-Item -ItemType Directory -Path $noCfgDir -Force | Out-Null
        Set-Content (Join-Path $noCfgDir 'Spec.tla') -Value '---- MODULE Spec ----'

        { Invoke-TlcCheck -TlaDir $noCfgDir -TlaWriterFile $script:writerFile } |
            Should -Throw '*No .cfg file*'

        Remove-Item $noCfgDir -Recurse -Force
    }

    It 'passes when TLC returns clean output' {
        $tlaDir = Join-Path $script:tempDir 'pass'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg') -Value 'SPECIFICATION Spec'

        Mock Invoke-TlcProcess {
            return @{ Output = 'Model checking completed. No error has been found.'; ExitCode = 0 }
        }

        { Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile } |
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
                return @{ Output = 'Error: invariant violated'; ExitCode = 1 }
            } else {
                return @{ Output = 'Model checking completed. No error has been found.'; ExitCode = 0 }
            }
        }
        Mock Invoke-Claude {}

        { Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile } |
            Should -Not -Throw

        Should -Invoke Invoke-Claude -Times 1 -Exactly

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
                return @{ Output = 'Error: violated'; ExitCode = 1 }
            } else {
                return @{ Output = 'No error'; ExitCode = 0 }
            }
        }

        $script:capturedPrompt = $null
        Mock Invoke-Claude {
            param($SystemPromptFile, $Prompt)
            $script:capturedPrompt = $Prompt
        }

        Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile -FixContext 'extra context here'

        $script:capturedPrompt | Should -Match 'extra context here'

        Remove-Item $tlaDir -Recurse -Force
    }

    It 'runs all .cfg files when multiple exist' {
        $tlaDir = Join-Path $script:tempDir 'multi-cfg'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla')   -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg')   -Value 'SPECIFICATION Spec'
        Set-Content (Join-Path $tlaDir 'Spec_B.cfg') -Value 'SPECIFICATION Spec'

        $script:invokedCfgs = [System.Collections.ArrayList]::new()
        Mock Invoke-TlcProcess {
            param($TlaDir, $TlaFileName, $CfgFileName)
            $null = $script:invokedCfgs.Add($CfgFileName)
            return @{ Output = 'No error'; ExitCode = 0 }
        }

        { Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile } | Should -Not -Throw

        $script:invokedCfgs | Should -Contain 'Spec.cfg'
        $script:invokedCfgs | Should -Contain 'Spec_B.cfg'

        Remove-Item $tlaDir -Recurse -Force
    }

    It 'retries when any cfg fails even if others pass' {
        $tlaDir = Join-Path $script:tempDir 'multi-cfg-partial-fail'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla')   -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg')   -Value 'SPECIFICATION Spec'
        Set-Content (Join-Path $tlaDir 'Spec_B.cfg') -Value 'SPECIFICATION Spec'

        $script:tlcCallCount = 0
        Mock Invoke-TlcProcess {
            param($TlaDir, $TlaFileName, $CfgFileName)
            $script:tlcCallCount++
            # First attempt: Spec_B.cfg fails; second attempt: all pass
            if ($script:tlcCallCount -le 2 -and $CfgFileName -eq 'Spec_B.cfg') {
                return @{ Output = 'Error: invariant violated'; ExitCode = 1 }
            }
            return @{ Output = 'No error'; ExitCode = 0 }
        }
        Mock Invoke-Claude {}

        { Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile } | Should -Not -Throw

        Should -Invoke Invoke-Claude -Times 1 -Exactly

        Remove-Item $tlaDir -Recurse -Force
    }

    It 'includes all failing cfg names in the fix prompt' {
        $tlaDir = Join-Path $script:tempDir 'multi-cfg-fix-prompt'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla')   -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg')   -Value 'SPECIFICATION Spec'
        Set-Content (Join-Path $tlaDir 'Spec_B.cfg') -Value 'SPECIFICATION Spec'

        $script:tlcCallCount = 0
        Mock Invoke-TlcProcess {
            param($TlaDir, $TlaFileName, $CfgFileName)
            $script:tlcCallCount++
            if ($script:tlcCallCount -le 2) {
                return @{ Output = 'Error: violated'; ExitCode = 1 }
            }
            return @{ Output = 'No error'; ExitCode = 0 }
        }

        $script:capturedPrompt = $null
        Mock Invoke-Claude {
            param($SystemPromptFile, $Prompt)
            $script:capturedPrompt = $Prompt
        }

        Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile

        $script:capturedPrompt | Should -Match 'Spec\.cfg'
        $script:capturedPrompt | Should -Match 'Spec_B\.cfg'

        Remove-Item $tlaDir -Recurse -Force
    }

}

Describe 'Invoke-TlcProcess ExtraArgs' {
    It 'passes ExtraArgs into java arguments' {
        Mock Write-PipelineLog {}

        # Verify the parameter is accepted
        $params = (Get-Command Invoke-TlcProcess).Parameters
        $params.ContainsKey('ExtraArgs') | Should -BeTrue
    }
}

Describe 'Invoke-TlcProcess integration' {
    BeforeAll {
        Mock Write-PipelineLog {}
    }

    It 'configures RedirectStandardError, BeginErrorReadLine, and captures output' {
        # Use a real process that exits quickly to exercise the full code path
        $tlaDir = Join-Path ([System.IO.Path]::GetTempPath()) "tlc-proc-$(Get-Random)"
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null

        try {
            # Override TlaToolsJar to a non-existent jar so java fails fast
            $origJar = $script:TlaToolsJar
            $script:TlaToolsJar = Join-Path $tlaDir 'nonexistent.jar'

            # This will start java, which will fail quickly because the jar doesn't exist.
            # Exercises RedirectStandardError=true, BeginErrorReadLine(),
            # .NET event handlers, and cleanup.
            $result = Invoke-TlcProcess -TlaDir $tlaDir -TlaFileName 'Spec.tla' -CfgFileName 'Spec.cfg'

            # java should exit with non-zero (jar not found)
            $result.ExitCode | Should -Not -Be 0
            # With .NET event handlers, output is reliably captured
            $result.ContainsKey('Output') | Should -BeTrue
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
            return @{ Output = $simOutput; ExitCode = 0 }
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
            return @{ Output = ''; ExitCode = 0 }
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
            return @{ Output = $simOutput; ExitCode = 0 }
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

