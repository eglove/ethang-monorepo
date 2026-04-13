BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
    . "$PSScriptRoot/../utils/pipeline-log.ps1"
    . "$PSScriptRoot/../utils/invoke-claude.ps1"
    . "$PSScriptRoot/../utils/global-double-pass.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Invoke-Claude {}
}

Describe 'Invoke-GlobalDoublePass' {
    Context 'Two consecutive passes return passed' {
        It 'returns passed after two clean runs' {
            Mock pnpm { $global:LASTEXITCODE = 0; return 'ok' }

            $result = Invoke-GlobalDoublePass -Root 'C:\fake' -Feature 'feat'
            $result.Status | Should -BeExactly 'passed'
            $result.Retries | Should -Be 0
            $result.LastError | Should -BeNullOrEmpty
        }
    }

    Context 'Test catch block (lines 27-28)' {
        It 'catches test command exception and sets exitCode=1' {
            $script:callCount = 0
            Mock pnpm {
                $script:callCount++
                if ($script:callCount -le 5) { throw 'pnpm not found' }
                $global:LASTEXITCODE = 0; return 'ok'
            }

            $result = Invoke-GlobalDoublePass -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 5
            $result.Status | Should -BeExactly 'escalated'
            $result.LastError | Should -Not -BeNullOrEmpty
        }
    }

    Context 'Lint catch block (lines 66-67)' {
        It 'catches lint command exception and sets lintExitCode=1' {
            $script:pnpmCall = 0
            Mock pnpm {
                $script:pnpmCall++
                # test passes (odd calls), lint throws (even calls)
                if ($script:pnpmCall % 2 -eq 1) {
                    $global:LASTEXITCODE = 0; return 'tests pass'
                } else {
                    throw 'lint crashed'
                }
            }

            $result = Invoke-GlobalDoublePass -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 2
            $result.Status | Should -BeExactly 'escalated'
            $result.LastError | Should -Match 'lint crashed'
        }
    }

    Context 'Lint failure path (lines 71-80)' {
        It 'escalates after MaxDoublePassRetries lint failures' {
            $script:pnpmCall = 0
            Mock pnpm {
                $script:pnpmCall++
                if ($script:pnpmCall % 2 -eq 1) {
                    $global:LASTEXITCODE = 0; return 'ok'
                } else {
                    $global:LASTEXITCODE = 1; return 'lint error'
                }
            }

            $result = Invoke-GlobalDoublePass -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 2
            $result.Status | Should -BeExactly 'escalated'
            $result.Retries | Should -Be 2
            $result.LastError | Should -Match 'lint error'
        }
    }

    Context 'Fix prompt construction + Invoke-Claude (lines 84-95)' {
        It 'calls Invoke-Claude with lint fix prompt when lint fails but retries remain' {
            $script:pnpmCall = 0
            Mock pnpm {
                $script:pnpmCall++
                if ($script:pnpmCall % 2 -eq 1) {
                    $global:LASTEXITCODE = 0; return 'ok'
                } else {
                    # First lint fails, second lint fails -> escalated at max
                    $global:LASTEXITCODE = 1; return 'lint error details'
                }
            }

            $result = Invoke-GlobalDoublePass -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 3
            Should -Invoke Invoke-Claude -Times 1 -Scope It
        }

        It 'calls Invoke-Claude with test fix prompt when test fails but retries remain' {
            $script:pnpmCall = 0
            Mock pnpm {
                $script:pnpmCall++
                if ($script:pnpmCall -le 1) {
                    $global:LASTEXITCODE = 1; return 'test failure'
                }
                $global:LASTEXITCODE = 0; return 'ok'
            }

            $result = Invoke-GlobalDoublePass -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 3
            Should -Invoke Invoke-Claude -Times 1 -Scope It
        }
    }

    Context 'Fallthrough escalation (lines 111-114)' {
        It 'returns escalated when loop exits without 2 consecutive passes' {
            # Test passes once then lint fails, exhausting retries without 2 consecutive passes
            $script:pnpmCall = 0
            Mock pnpm {
                $script:pnpmCall++
                # Pattern: test pass, lint fail, repeat until exhausted
                if ($script:pnpmCall % 2 -eq 1) {
                    $global:LASTEXITCODE = 0; return 'ok'
                } else {
                    $global:LASTEXITCODE = 1; return 'lint error'
                }
            }

            $result = Invoke-GlobalDoublePass -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 1
            $result.Status | Should -BeExactly 'escalated'
        }
    }

    Context 'Fallthrough escalation with MaxDoublePassRetries=0 (lines 111-114 exact)' {
        It 'returns escalated immediately when MaxDoublePassRetries is 0' {
            Mock pnpm { $global:LASTEXITCODE = 0; return 'ok' }

            $result = Invoke-GlobalDoublePass -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 0
            $result.Status | Should -BeExactly 'escalated'
            $result.Retries | Should -Be 0
            $result.LastError | Should -BeNullOrEmpty
        }
    }

    Context 'Test failure escalation at max retries' {
        It 'returns escalated with LastError when test fails at MaxDoublePassRetries' {
            Mock pnpm { $global:LASTEXITCODE = 1; return 'persistent test failure' }

            $result = Invoke-GlobalDoublePass -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 1
            $result.Status | Should -BeExactly 'escalated'
            $result.Retries | Should -Be 1
            $result.LastError | Should -Match 'persistent test failure'
        }
    }
}
