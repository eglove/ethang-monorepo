BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/tdd-loop.ps1"
}

Describe 'Invoke-TddLoop' {
    BeforeAll {
        Mock Write-PipelineLog {}

        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "tdd-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        $script:testWriterFile = Join-Path $script:tempDir 'test-writer.md'
        Set-Content $script:testWriterFile -Value 'test writer prompt'

        $script:codeWriterFile = Join-Path $script:tempDir 'code-writer.md'
        Set-Content $script:codeWriterFile -Value 'code writer prompt'
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns DONE when test writer signals DONE on first cycle' {
        Mock Invoke-Claude {
            '{"status":"DONE","summary":"all covered"}'
        }

        $result = Invoke-TddLoop `
            -TestWriterFile $script:testWriterFile `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test task' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Status | Should -Be 'DONE'
        $result.Cycles | Should -Be 0
    }

    It 'runs RED then GREEN for each cycle' {
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            if ($script:invokeCount -eq 1) {
                # RED — test writer writes a test
                '{"status":"CONTINUE","summary":"test for init"}'
            }
            elseif ($script:invokeCount -eq 2) {
                # GREEN — code writer implements
                '{"status":"CONTINUE","summary":"implemented init"}'
            }
            elseif ($script:invokeCount -eq 3) {
                # Cycle 2 RED — test writer says done
                '{"status":"DONE","summary":"all covered"}'
            }
        }

        # Mock pnpm test to fail on RED, pass on GREEN
        $script:pnpmCount = 0
        Mock pnpm {
            $script:pnpmCount++
            if ($script:pnpmCount -eq 1) {
                # RED verify — should fail
                $global:LASTEXITCODE = 1
            }
            else {
                # GREEN verify — should pass
                $global:LASTEXITCODE = 0
            }
        } -ParameterFilter { $args[0] -eq 'test' }

        Mock Push-Location {}
        Mock Pop-Location {}

        $result = Invoke-TddLoop `
            -TestWriterFile $script:testWriterFile `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test task' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Status | Should -Be 'DONE'
        $result.Cycles | Should -Be 1
    }

    It 'returns MAX_CYCLES when MaxCycles is reached' {
        Mock Invoke-Claude {
            '{"status":"CONTINUE","summary":"test N"}'
        }

        Mock pnpm {
            $global:LASTEXITCODE = 0
        } -ParameterFilter { $args[0] -eq 'test' }

        Mock Push-Location {}
        Mock Pop-Location {}

        $result = Invoke-TddLoop `
            -TestWriterFile $script:testWriterFile `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test task' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1' `
            -MaxCycles 3

        $result.Status | Should -Be 'MAX_CYCLES'
        $result.Cycles | Should -Be 3
    }

    It 'retries GREEN when tests fail and returns FAILED after MaxGreenRetries' {
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            if ($script:invokeCount -eq 1) {
                '{"status":"CONTINUE","summary":"test something"}'
            }
            # All subsequent calls are GREEN/retry attempts — no output needed
        }

        # Tests always fail
        Mock pnpm {
            $global:LASTEXITCODE = 1
            'Error: expected true to be false'
        } -ParameterFilter { $args[0] -eq 'test' }

        Mock Push-Location {}
        Mock Pop-Location {}

        # Use a small retry count to speed up test
        $origRetries = $Config.MaxGreenRetries
        $Config.MaxGreenRetries = 2

        $result = Invoke-TddLoop `
            -TestWriterFile $script:testWriterFile `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test task' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $Config.MaxGreenRetries = $origRetries

        $result.Status | Should -Be 'FAILED'
        $result.Reason | Should -Be 'green_failed'
    }

    It 'includes red-skip feedback in prompt after consecutive RED passes' {
        $script:capturedPrompts = @()
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            $script:capturedPrompts += $Prompt
            if ($script:invokeCount -le 2) {
                # Cycles 1 and 2: test writer writes tests that pass immediately
                '{"status":"CONTINUE","summary":"test something"}'
            }
            else {
                # Cycle 3: test writer says done
                '{"status":"DONE","summary":"all covered"}'
            }
        }

        Mock pnpm {
            $global:LASTEXITCODE = 0
        } -ParameterFilter { $args[0] -eq 'test' }

        Mock Push-Location {}
        Mock Pop-Location {}

        $result = Invoke-TddLoop `
            -TestWriterFile $script:testWriterFile `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test task' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1' `
            -MaxCycles 5

        $result.Status | Should -Be 'DONE'
        # Cycle 1 prompt should have no feedback (first cycle)
        $script:capturedPrompts[0] | Should -Not -Match 'already passed'
        # Cycle 2 prompt should mention 1 test already passed
        $script:capturedPrompts[1] | Should -Match 'last 1 test\(s\) already passed'
        # Cycle 3 prompt should mention 2 tests already passed
        $script:capturedPrompts[2] | Should -Match 'last 2 test\(s\) already passed'
    }

    It 'resets red-skip counter after a successful RED-GREEN cycle' {
        $script:capturedPrompts = @()
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            $script:capturedPrompts += $Prompt
            # All test writer calls return CONTINUE
            '{"status":"CONTINUE","summary":"test N"}'
        }

        # Cycle 1: RED passes (skip), Cycle 2: RED fails then GREEN passes, Cycle 3: RED passes (skip)
        $script:pnpmCount = 0
        Mock pnpm {
            $script:pnpmCount++
            if ($script:pnpmCount -eq 1) {
                # Cycle 1 RED verify — passes (skip GREEN)
                $global:LASTEXITCODE = 0
            }
            elseif ($script:pnpmCount -eq 2) {
                # Cycle 2 RED verify — fails (proceed to GREEN)
                $global:LASTEXITCODE = 1
            }
            elseif ($script:pnpmCount -eq 3) {
                # Cycle 2 GREEN verify — passes
                $global:LASTEXITCODE = 0
            }
            elseif ($script:pnpmCount -eq 4) {
                # Cycle 3 RED verify — passes (skip GREEN)
                $global:LASTEXITCODE = 0
            }
        } -ParameterFilter { $args[0] -eq 'test' }

        Mock Push-Location {}
        Mock Pop-Location {}

        Invoke-TddLoop `
            -TestWriterFile $script:testWriterFile `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test task' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1' `
            -MaxCycles 3

        # Cycle 2 prompt: counter was 1 from cycle 1
        $script:capturedPrompts[1] | Should -Match 'last 1 test\(s\) already passed'
        # Cycle 2 had a real RED→GREEN, so counter resets to 0
        # Cycle 3 prompt should NOT have red-skip feedback
        # capturedPrompts: [0]=cycle1-RED, [1]=cycle2-RED, [2]=cycle2-GREEN, [3]=cycle3-RED
        $script:capturedPrompts[3] | Should -Not -Match 'already passed'
    }

    It 'skips GREEN when RED test passes immediately' {
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            if ($script:invokeCount -eq 1) {
                # Cycle 1: RED test passes immediately — GREEN should be skipped
                '{"status":"CONTINUE","summary":"test init"}'
            }
            else {
                # Cycle 2: test writer says done
                '{"status":"DONE","summary":"all covered"}'
            }
        }

        # All pnpm test calls pass (including RED verify)
        Mock pnpm {
            $global:LASTEXITCODE = 0
        } -ParameterFilter { $args[0] -eq 'test' }

        Mock Push-Location {}
        Mock Pop-Location {}

        $result = Invoke-TddLoop `
            -TestWriterFile $script:testWriterFile `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test task' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Status | Should -Be 'DONE'
        # Only 2 Invoke-Claude calls: RED(cycle1) + RED(cycle2=DONE)
        # Code writer should NOT have been called since RED passed immediately
        $script:invokeCount | Should -Be 2
    }
}
