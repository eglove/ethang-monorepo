BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
    . "$PSScriptRoot/../utils/pipeline-log.ps1"
    . "$PSScriptRoot/../utils/invoke-claude.ps1"
    . "$PSScriptRoot/../utils/per-worktree-double-pass.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Invoke-Claude {}
}

Describe 'Invoke-PerWorktreeDoublePass' {
    Context 'Two consecutive passes return passed' {
        It 'returns passed after two clean runs' {
            Mock pnpm { $global:LASTEXITCODE = 0; return 'ok' }

            $result = Invoke-PerWorktreeDoublePass -WorktreePath 'C:\wt' -Root 'C:\fake' -Feature 'feat'
            $result.Status | Should -BeExactly 'passed'
            $result.Retries | Should -Be 0
            $result.LastError | Should -BeNullOrEmpty
        }
    }

    Context 'Test catch block (lines 29-30)' {
        It 'catches test command exception and treats as failure' {
            Mock pnpm { throw 'pnpm not found' }

            $result = Invoke-PerWorktreeDoublePass -WorktreePath 'C:\wt' -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 1
            $result.Status | Should -BeExactly 'escalated'
            $result.LastError | Should -Match 'pnpm not found'
        }
    }

    Context 'Lint catch block (lines 69-70)' {
        It 'catches lint command exception and treats as failure' {
            $script:pnpmCall = 0
            Mock pnpm {
                $script:pnpmCall++
                if ($script:pnpmCall % 2 -eq 1) {
                    $global:LASTEXITCODE = 0; return 'tests pass'
                } else {
                    throw 'lint crashed'
                }
            }

            $result = Invoke-PerWorktreeDoublePass -WorktreePath 'C:\wt' -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 2
            $result.Status | Should -BeExactly 'escalated'
            $result.LastError | Should -Match 'lint crashed'
        }
    }

    Context 'Lint failure escalation at max retries (lines 80-83)' {
        It 'returns escalated with LastError when lint fails at max retries' {
            $script:pnpmCall = 0
            Mock pnpm {
                $script:pnpmCall++
                if ($script:pnpmCall % 2 -eq 1) {
                    $global:LASTEXITCODE = 0; return 'ok'
                } else {
                    $global:LASTEXITCODE = 1; return 'lint error output'
                }
            }

            $result = Invoke-PerWorktreeDoublePass -WorktreePath 'C:\wt' -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 2
            $result.Status | Should -BeExactly 'escalated'
            $result.Retries | Should -Be 2
            $result.LastError | Should -Match 'lint error'
        }
    }

    Context 'Fallthrough escalation (lines 115-118)' {
        It 'returns escalated when loop exits without 2 consecutive passes' {
            $script:pnpmCall = 0
            Mock pnpm {
                $script:pnpmCall++
                if ($script:pnpmCall % 2 -eq 1) {
                    $global:LASTEXITCODE = 0; return 'ok'
                } else {
                    $global:LASTEXITCODE = 1; return 'lint fail'
                }
            }

            $result = Invoke-PerWorktreeDoublePass -WorktreePath 'C:\wt' -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 1
            $result.Status | Should -BeExactly 'escalated'
        }
    }

    Context 'Fallthrough escalation with MaxDoublePassRetries=0 (lines 115-118 exact)' {
        It 'returns escalated immediately when MaxDoublePassRetries is 0' {
            Mock pnpm { $global:LASTEXITCODE = 0; return 'ok' }

            $result = Invoke-PerWorktreeDoublePass -WorktreePath 'C:\wt' -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 0
            $result.Status | Should -BeExactly 'escalated'
            $result.Retries | Should -Be 0
            $result.LastError | Should -BeNullOrEmpty
        }
    }

    Context 'Fix prompt dispatches Claude on non-final failures' {
        It 'calls Invoke-Claude with test fix prompt' {
            $script:pnpmCall = 0
            Mock pnpm {
                $script:pnpmCall++
                if ($script:pnpmCall -eq 1) {
                    $global:LASTEXITCODE = 1; return 'test failure'
                }
                $global:LASTEXITCODE = 0; return 'ok'
            }

            Invoke-PerWorktreeDoublePass -WorktreePath 'C:\wt' -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 3
            Should -Invoke Invoke-Claude -Times 1 -Scope It
        }

        It 'calls Invoke-Claude with lint fix prompt' {
            $script:pnpmCall = 0
            Mock pnpm {
                $script:pnpmCall++
                if ($script:pnpmCall % 2 -eq 1) {
                    $global:LASTEXITCODE = 0; return 'ok'
                }
                if ($script:pnpmCall -eq 2) {
                    $global:LASTEXITCODE = 1; return 'lint error'
                }
                $global:LASTEXITCODE = 0; return 'ok'
            }

            Invoke-PerWorktreeDoublePass -WorktreePath 'C:\wt' -Root 'C:\fake' -Feature 'feat' -MaxDoublePassRetries 3
            Should -Invoke Invoke-Claude -Times 1 -Scope It
        }
    }
}
