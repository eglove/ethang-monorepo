BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
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
            Mock Invoke-ReviewLoop { return @{ Verdict = 'fail'; Blockers = @('string blocker') } }
            Mock Invoke-PerWorktreeDoublePass { return @{ Status = 'passed'; Retries = 0; LastError = $null } }

            $result = Invoke-PerWorktreeReview -WorktreePath 'C:\wt' -FeatureDir 'C:\fake\docs\feat' -Root 'C:\fake' -MaxReviewRounds 2
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

            $result = Invoke-PerWorktreeReview -WorktreePath 'C:\wt' -FeatureDir 'C:\fake\docs\feat' -Root 'C:\fake' -MaxReviewRounds 3
            Should -Invoke Invoke-Claude -Times 1 -Scope It
        }
    }

    Context 'Escalated returns (lines 71-82)' {
        It 'returns escalated when double-pass escalates after review fix' {
            Mock git { return 'diff' }
            Mock Invoke-ReviewLoop { return @{ Verdict = 'fail'; Blockers = @('blocker') } }
            Mock Invoke-PerWorktreeDoublePass { return @{ Status = 'escalated'; Retries = 5; LastError = 'dp fail' } }

            $result = Invoke-PerWorktreeReview -WorktreePath 'C:\wt' -FeatureDir 'C:\fake\docs\feat' -Root 'C:\fake' -MaxReviewRounds 3
            $result.Verdict | Should -BeExactly 'escalated'
            $result.Blockers | Should -Contain 'dp fail'
        }

        It 'returns escalated when review fails at MaxReviewRounds' {
            Mock git { return 'diff' }
            Mock Invoke-ReviewLoop { return @{ Verdict = 'fail'; Blockers = @('persistent') } }

            $result = Invoke-PerWorktreeReview -WorktreePath 'C:\wt' -FeatureDir 'C:\fake\docs\feat' -Root 'C:\fake' -MaxReviewRounds 1
            $result.Verdict | Should -BeExactly 'escalated'
            $result.ReviewRound | Should -Be 1
        }

        It 'returns escalated fallthrough when loop exhausts (lines 79-83)' {
            Mock git { return 'diff' }
            Mock Invoke-ReviewLoop { return @{ Verdict = 'fail'; Blockers = @('b') } }
            Mock Invoke-PerWorktreeDoublePass { return @{ Status = 'passed'; Retries = 0; LastError = $null } }

            $result = Invoke-PerWorktreeReview -WorktreePath 'C:\wt' -FeatureDir 'C:\fake\docs\feat' -Root 'C:\fake' -MaxReviewRounds 2
            $result.Verdict | Should -BeExactly 'escalated'
        }
    }
}
