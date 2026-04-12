BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-log.ps1"
    . "$PSScriptRoot/../utils/invoke-claude.ps1"
    . "$PSScriptRoot/../utils/per-worktree-double-pass.ps1"
    . "$PSScriptRoot/../utils/review-loop.ps1"
    . "$PSScriptRoot/../utils/per-worktree-review.ps1"
    . "$PSScriptRoot/../utils/per-worktree-gates.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Invoke-Claude {}
}

Describe 'Invoke-PerWorktreeGate' {
    Context 'All tasks pass' {
        It 'returns all_passed when double-pass and review pass for all worktrees' {
            Mock Invoke-PerWorktreeDoublePass { return @{ Status = 'passed'; Retries = 0; LastError = $null } }
            Mock Invoke-PerWorktreeReview { return @{ Verdict = 'pass'; ReviewRound = 1; Blockers = @() } }

            $result = Invoke-PerWorktreeGate -WorktreePaths @('C:\wt1', 'C:\wt2') -FeatureDir 'C:\docs\feat' -Root 'C:\fake' -Feature 'feat'
            $result.Status | Should -BeExactly 'all_passed'
            $result.Results.Count | Should -Be 2
        }
    }

    Context 'Double-pass escalation early return (lines 30-38)' {
        It 'returns escalated immediately when double-pass escalates' {
            Mock Invoke-PerWorktreeDoublePass { return @{ Status = 'escalated'; Retries = 5; LastError = 'test fail' } }
            Mock Invoke-PerWorktreeReview { return @{ Verdict = 'pass'; ReviewRound = 1; Blockers = @() } }

            $result = Invoke-PerWorktreeGate -WorktreePaths @('C:\wt1', 'C:\wt2') -FeatureDir 'C:\docs\feat' -Root 'C:\fake' -Feature 'feat'
            $result.Status | Should -BeExactly 'escalated'
            $result.Results.Count | Should -Be 1
            $result.Results[0].Status | Should -BeExactly 'escalated'
            $result.Results[0].DoublePass.Status | Should -BeExactly 'escalated'
            $result.Results[0].Review | Should -BeNullOrEmpty
        }

        It 'does not invoke review when double-pass escalates' {
            Mock Invoke-PerWorktreeDoublePass { return @{ Status = 'escalated'; Retries = 5; LastError = 'fail' } }
            Mock Invoke-PerWorktreeReview { return @{ Verdict = 'pass'; ReviewRound = 1; Blockers = @() } }

            Invoke-PerWorktreeGate -WorktreePaths @('C:\wt1') -FeatureDir 'C:\docs\feat' -Root 'C:\fake' -Feature 'feat'
            Should -Invoke Invoke-PerWorktreeReview -Times 0 -Scope It
        }
    }

    Context 'Review escalation early return (lines 47-55)' {
        It 'returns escalated immediately when review escalates' {
            Mock Invoke-PerWorktreeDoublePass { return @{ Status = 'passed'; Retries = 0; LastError = $null } }
            Mock Invoke-PerWorktreeReview { return @{ Verdict = 'escalated'; ReviewRound = 3; Blockers = @('review fail') } }

            $result = Invoke-PerWorktreeGate -WorktreePaths @('C:\wt1', 'C:\wt2') -FeatureDir 'C:\docs\feat' -Root 'C:\fake' -Feature 'feat'
            $result.Status | Should -BeExactly 'escalated'
            $result.Results.Count | Should -Be 1
            $result.Results[0].Status | Should -BeExactly 'escalated'
            $result.Results[0].Review.Verdict | Should -BeExactly 'escalated'
        }

        It 'does not process subsequent worktrees after review escalation' {
            $script:dpCallCount = 0
            Mock Invoke-PerWorktreeDoublePass {
                $script:dpCallCount++
                return @{ Status = 'passed'; Retries = 0; LastError = $null }
            }
            Mock Invoke-PerWorktreeReview { return @{ Verdict = 'escalated'; ReviewRound = 3; Blockers = @('fail') } }

            Invoke-PerWorktreeGate -WorktreePaths @('C:\wt1', 'C:\wt2', 'C:\wt3') -FeatureDir 'C:\docs\feat' -Root 'C:\fake' -Feature 'feat'
            $script:dpCallCount | Should -Be 1
        }
    }

    Context 'Single worktree pass' {
        It 'returns all_passed for single worktree' {
            Mock Invoke-PerWorktreeDoublePass { return @{ Status = 'passed'; Retries = 0; LastError = $null } }
            Mock Invoke-PerWorktreeReview { return @{ Verdict = 'pass'; ReviewRound = 1; Blockers = @() } }

            $result = Invoke-PerWorktreeGate -WorktreePaths @('C:\wt1') -FeatureDir 'C:\docs\feat' -Root 'C:\fake' -Feature 'feat'
            $result.Status | Should -BeExactly 'all_passed'
            $result.Results.Count | Should -Be 1
        }
    }
}
