BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
    . "$PSScriptRoot/../utils/pipeline-log.ps1"
    . "$PSScriptRoot/../utils/invoke-claude.ps1"
    . "$PSScriptRoot/../utils/per-worktree-double-pass.ps1"
    . "$PSScriptRoot/../utils/review-loop.ps1"
    . "$PSScriptRoot/../utils/per-worktree-review.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Invoke-Claude {}
}

Describe 'Invoke-PerWorktreeReview' {
    Context 'Pass on first review' {
        It 'returns pass verdict' {
            Mock git { return 'diff content here' }
            Mock Invoke-ReviewLoop { return @{ Verdict = 'pass'; Blockers = @() } }

            $result = Invoke-PerWorktreeReview -WorktreePath 'C:\wt' -FeatureDir 'C:\fake\docs\feat' -Root 'C:\fake'
            $result.Verdict | Should -BeExactly 'pass'
            $result.ReviewRound | Should -Be 1
        }
    }

    Context 'No diff available (line 25)' {
        It 'uses "(no diff available)" fallback when git diff returns empty' {
            Mock git { return '' }
            Mock Invoke-ReviewLoop { return @{ Verdict = 'pass'; Blockers = @() } }

            $result = Invoke-PerWorktreeReview -WorktreePath 'C:\wt' -FeatureDir 'C:\fake\docs\feat' -Root 'C:\fake'
            $result.Verdict | Should -BeExactly 'pass'
            Should -Invoke Invoke-ReviewLoop -Times 1 -Scope It
        }
    }

    Context 'Diff format with string blockers (line 52)' {
        It 'formats string blockers using $_ fallback path' {
            Mock git { return 'some diff' }
            $script:strBlockerCall = 0
            Mock Invoke-ReviewLoop {
                $script:strBlockerCall++
                if ($script:strBlockerCall -eq 1) {
                    return @{ Verdict = 'fail'; Blockers = @('string blocker') }
                }
                return @{ Verdict = 'pass'; Blockers = @() }
            }
            Mock Invoke-PerWorktreeDoublePass { return @{ Status = 'passed'; Retries = 0; LastError = $null } }

            $result = Invoke-PerWorktreeReview -WorktreePath 'C:\wt' -FeatureDir 'C:\fake\docs\feat' -Root 'C:\fake'
            Should -Invoke Invoke-Claude -Times 1 -Scope It
        }

        It 'formats hashtable blockers using .description' {
            Mock git { return 'some diff' }
            $script:reviewCall = 0
            Mock Invoke-ReviewLoop {
                $script:reviewCall++
                if ($script:reviewCall -eq 1) {
                    return @{ Verdict = 'fail'; Blockers = @(@{ description = 'missing test' }) }
                }
                return @{ Verdict = 'pass'; Blockers = @() }
            }
            Mock Invoke-PerWorktreeDoublePass { return @{ Status = 'passed'; Retries = 0; LastError = $null } }

            $result = Invoke-PerWorktreeReview -WorktreePath 'C:\wt' -FeatureDir 'C:\fake\docs\feat' -Root 'C:\fake'
            Should -Invoke Invoke-Claude -Times 1 -Scope It
        }
    }

}
