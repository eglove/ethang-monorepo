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

    BeforeEach {
        $script:origVerifyTest = $Config.VerifyTest
    }

    AfterEach {
        $Config.VerifyTest = $script:origVerifyTest
    }

    It 'uses Config.VerifyTest instead of hardcoded pnpm test' {
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            if ($script:invokeCount -eq 1) {
                '{"status":"CONTINUE","summary":"test init"}'
            } elseif ($script:invokeCount -eq 2) {
                '{"status":"CONTINUE","summary":"impl"}'
            } else {
                '{"status":"DONE","summary":"all covered"}'
            }
        }

        Mock Push-Location {}
        Mock Pop-Location {}

        # First call (RED) fails, subsequent calls pass
        $script:verifyCallFile = Join-Path $script:tempDir 'verify-calls.txt'
        Remove-Item $script:verifyCallFile -ErrorAction SilentlyContinue
        $Config.VerifyTest = "if (Test-Path '$($script:verifyCallFile)') { `$global:LASTEXITCODE = 0 } else { Set-Content '$($script:verifyCallFile)' -Value '1'; `$global:LASTEXITCODE = 1 }"

        $result = Invoke-TddLoop `
            -TestWriterFile $script:testWriterFile `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test task' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        Remove-Item $script:verifyCallFile -ErrorAction SilentlyContinue

        $result.Status | Should -Be 'DONE'
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
                '{"status":"CONTINUE","summary":"test for init"}'
            }
            elseif ($script:invokeCount -eq 2) {
                '{"status":"CONTINUE","summary":"implemented init"}'
            }
            elseif ($script:invokeCount -eq 3) {
                '{"status":"DONE","summary":"all covered"}'
            }
        }

        Mock Push-Location {}
        Mock Pop-Location {}

        # RED fails (first call), GREEN passes (second call)
        $script:verifyCallFile = Join-Path $script:tempDir "verify-rg-$(Get-Random).txt"
        Remove-Item $script:verifyCallFile -ErrorAction SilentlyContinue
        $Config.VerifyTest = "if (Test-Path '$($script:verifyCallFile)') { `$global:LASTEXITCODE = 0 } else { Set-Content '$($script:verifyCallFile)' -Value '1'; `$global:LASTEXITCODE = 1 }"

        $result = Invoke-TddLoop `
            -TestWriterFile $script:testWriterFile `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test task' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        Remove-Item $script:verifyCallFile -ErrorAction SilentlyContinue

        $result.Status | Should -Be 'DONE'
        $result.Cycles | Should -Be 1
    }

    It 'returns MAX_CYCLES when MaxCycles is reached' {
        Mock Invoke-Claude {
            '{"status":"CONTINUE","summary":"test N"}'
        }

        Mock Push-Location {}
        Mock Pop-Location {}

        # All tests pass immediately (RED passes → skip GREEN → loop)
        $Config.VerifyTest = '$global:LASTEXITCODE = 0'

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
        }

        Mock Push-Location {}
        Mock Pop-Location {}

        # Tests always fail
        $Config.VerifyTest = '$global:LASTEXITCODE = 1; "Error: expected true to be false"'

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

    It 'continues after GREEN retry fixes the failing test' {
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            if ($script:invokeCount -le 3) {
                '{"status":"CONTINUE","summary":"cycle work"}'
            }
            else {
                '{"status":"DONE","summary":"all covered"}'
            }
        }

        Mock Push-Location {}
        Mock Pop-Location {}
        Mock Write-Host {}

        # RED fails (call 1), GREEN fails (call 2), GREEN retry passes (call 3)
        $script:verifyCount = 0
        $Config.VerifyTest = "`$script:verifyCount++; if (`$script:verifyCount -le 2) { `$global:LASTEXITCODE = 1 } else { `$global:LASTEXITCODE = 0 }"

        $origRetries = $Config.MaxGreenRetries
        $Config.MaxGreenRetries = 3

        $result = Invoke-TddLoop `
            -TestWriterFile $script:testWriterFile `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test task' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $Config.MaxGreenRetries = $origRetries

        $result.Status | Should -Be 'DONE'
        $script:verifyCount | Should -BeGreaterOrEqual 3
    }

    It 'includes red-skip feedback in prompt after consecutive RED passes' {
        $script:capturedPrompts = @()
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            $script:capturedPrompts += $Prompt
            if ($script:invokeCount -le 2) {
                '{"status":"CONTINUE","summary":"test something"}'
            }
            else {
                '{"status":"DONE","summary":"all covered"}'
            }
        }

        Mock Push-Location {}
        Mock Pop-Location {}

        $Config.VerifyTest = '$global:LASTEXITCODE = 0'

        $result = Invoke-TddLoop `
            -TestWriterFile $script:testWriterFile `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test task' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1' `
            -MaxCycles 5

        $result.Status | Should -Be 'DONE'
        $script:capturedPrompts[0] | Should -Not -Match 'already passed'
        $script:capturedPrompts[1] | Should -Match 'last 1 test\(s\) already passed'
        $script:capturedPrompts[2] | Should -Match 'last 2 test\(s\) already passed'
    }

    It 'resets red-skip counter after a successful RED-GREEN cycle' {
        $script:capturedPrompts = @()
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            $script:capturedPrompts += $Prompt
            '{"status":"CONTINUE","summary":"test N"}'
        }

        Mock Push-Location {}
        Mock Pop-Location {}

        # Cycle 1: RED passes (skip), Cycle 2: RED fails then GREEN passes, Cycle 3: RED passes (skip)
        $script:verifyCount = 0
        $Config.VerifyTest = "`$script:verifyCount++; if (`$script:verifyCount -eq 1) { `$global:LASTEXITCODE = 0 } elseif (`$script:verifyCount -eq 2) { `$global:LASTEXITCODE = 1 } elseif (`$script:verifyCount -eq 3) { `$global:LASTEXITCODE = 0 } else { `$global:LASTEXITCODE = 0 }"

        Invoke-TddLoop `
            -TestWriterFile $script:testWriterFile `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test task' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1' `
            -MaxCycles 3

        # Cycle 2 prompt: counter was 1 from cycle 1
        $script:capturedPrompts[1] | Should -Match 'last 1 test\(s\) already passed'
        # Cycle 2 had a real RED→GREEN, counter resets
        # capturedPrompts: [0]=cycle1-RED, [1]=cycle2-RED, [2]=cycle2-GREEN, [3]=cycle3-RED
        $script:capturedPrompts[3] | Should -Not -Match 'already passed'
    }

    It 'skips GREEN when RED test passes immediately' {
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            if ($script:invokeCount -eq 1) {
                '{"status":"CONTINUE","summary":"test init"}'
            }
            else {
                '{"status":"DONE","summary":"all covered"}'
            }
        }

        Mock Push-Location {}
        Mock Pop-Location {}

        $Config.VerifyTest = '$global:LASTEXITCODE = 0'

        $result = Invoke-TddLoop `
            -TestWriterFile $script:testWriterFile `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test task' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Status | Should -Be 'DONE'
        $script:invokeCount | Should -Be 2
    }

    It 'warns but continues when RED test passes immediately' {
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            if ($script:invokeCount -le 2) {
                '{"status":"CONTINUE","summary":"test init"}'
            }
            else {
                '{"status":"DONE","summary":"all covered"}'
            }
        }

        Mock Push-Location {}
        Mock Pop-Location {}

        $Config.VerifyTest = '$global:LASTEXITCODE = 0'

        $result = Invoke-TddLoop `
            -TestWriterFile $script:testWriterFile `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test task' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Status | Should -Be 'DONE'
    }
}
