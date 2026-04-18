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
        It 'catches test command exception, calls Claude to fix, then passes' {
            $script:callCount = 0
            Mock pnpm {
                $script:callCount++
                if ($script:callCount -eq 1) { throw 'pnpm not found' }
                $global:LASTEXITCODE = 0; return 'ok'
            }

            $result = Invoke-GlobalDoublePass -Root 'C:\fake' -Feature 'feat'
            $result.Status | Should -BeExactly 'passed'
            Should -Invoke Invoke-Claude -Times 1 -Scope It
        }
    }

    Context 'Lint catch block (lines 66-67)' {
        It 'catches lint command exception, calls Claude to fix, then passes' {
            $script:pnpmCall = 0
            Mock pnpm {
                $script:pnpmCall++
                if ($script:pnpmCall % 2 -eq 1) {
                    $global:LASTEXITCODE = 0; return 'tests pass'
                }
                if ($script:pnpmCall -eq 2) { throw 'lint crashed' }
                $global:LASTEXITCODE = 0; return 'ok'
            }

            $result = Invoke-GlobalDoublePass -Root 'C:\fake' -Feature 'feat'
            $result.Status | Should -BeExactly 'passed'
            Should -Invoke Invoke-Claude -Times 1 -Scope It
        }
    }

    Context 'Fix prompt construction + Invoke-Claude' {
        It 'calls Invoke-Claude with lint fix prompt when lint fails but then passes' {
            $script:pnpmCall = 0
            Mock pnpm {
                $script:pnpmCall++
                if ($script:pnpmCall % 2 -eq 1) {
                    $global:LASTEXITCODE = 0; return 'ok'
                }
                if ($script:pnpmCall -eq 2) {
                    $global:LASTEXITCODE = 1; return 'lint error details'
                }
                $global:LASTEXITCODE = 0; return 'ok'
            }

            $result = Invoke-GlobalDoublePass -Root 'C:\fake' -Feature 'feat'
            $result.Status | Should -BeExactly 'passed'
            Should -Invoke Invoke-Claude -Times 1 -Scope It
        }

        It 'calls Invoke-Claude with test fix prompt when test fails but then passes' {
            $script:pnpmCall = 0
            Mock pnpm {
                $script:pnpmCall++
                if ($script:pnpmCall -le 1) {
                    $global:LASTEXITCODE = 1; return 'test failure'
                }
                $global:LASTEXITCODE = 0; return 'ok'
            }

            $result = Invoke-GlobalDoublePass -Root 'C:\fake' -Feature 'feat'
            $result.Status | Should -BeExactly 'passed'
            Should -Invoke Invoke-Claude -Times 1 -Scope It
        }
    }
}
