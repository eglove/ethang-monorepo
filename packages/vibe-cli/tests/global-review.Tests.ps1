BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
    . "$PSScriptRoot/../utils/pipeline-log.ps1"
    . "$PSScriptRoot/../utils/invoke-claude.ps1"
    . "$PSScriptRoot/../utils/global-double-pass.ps1"
    . "$PSScriptRoot/../utils/review-loop.ps1"
    . "$PSScriptRoot/../utils/global-review.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Invoke-Claude {}
}

Describe 'Invoke-GlobalReview' {
    Context 'Pass on first review' {
        It 'returns pass verdict' {
            Mock git { return 'diff content here' }
            Mock Invoke-ReviewLoop { return @{ Verdict = 'pass'; Blockers = @() } }

            $result = Invoke-GlobalReview -Root 'C:\fake' -FeatureDir 'C:\fake\docs\feat' -BaseBranch 'main'
            $result.Verdict | Should -BeExactly 'pass'
            $result.ReviewRound | Should -Be 1
        }
    }

    Context 'No diff available (line 25)' {
        It 'uses "(no diff available)" fallback when git diff returns empty' {
            Mock git { return '' }
            Mock Invoke-ReviewLoop {
                param($DiffContent)
                return @{ Verdict = 'pass'; Blockers = @() }
            }

            $result = Invoke-GlobalReview -Root 'C:\fake' -FeatureDir 'C:\fake\docs\feat' -BaseBranch 'main'
            $result.Verdict | Should -BeExactly 'pass'
            Should -Invoke Invoke-ReviewLoop -Times 1 -Scope It
        }
    }

    Context 'Diff line formatting with blockers (line 49)' {
        It 'formats string blockers using $_ fallback' {
            Mock git { return 'some diff' }
            $script:strBlockerCall = 0
            Mock Invoke-ReviewLoop {
                $script:strBlockerCall++
                if ($script:strBlockerCall -eq 1) {
                    return @{ Verdict = 'fail'; Blockers = @('simple string blocker') }
                }
                return @{ Verdict = 'pass'; Blockers = @() }
            }
            Mock Invoke-GlobalDoublePass { return @{ Status = 'passed'; Retries = 0; LastError = $null } }

            $result = Invoke-GlobalReview -Root 'C:\fake' -FeatureDir 'C:\fake\docs\feat' -BaseBranch 'main'
            # Should have called Invoke-Claude for fix
            Should -Invoke Invoke-Claude -Times 1 -Scope It
        }

        It 'formats hashtable blockers using .description' {
            Mock git { return 'some diff' }
            $script:reviewCall = 0
            Mock Invoke-ReviewLoop {
                $script:reviewCall++
                if ($script:reviewCall -eq 1) {
                    return @{ Verdict = 'fail'; Blockers = @(@{ description = 'missing tests' }) }
                }
                return @{ Verdict = 'pass'; Blockers = @() }
            }
            Mock Invoke-GlobalDoublePass { return @{ Status = 'passed'; Retries = 0; LastError = $null } }

            $result = Invoke-GlobalReview -Root 'C:\fake' -FeatureDir 'C:\fake\docs\feat' -BaseBranch 'main'
            Should -Invoke Invoke-Claude -Times 1 -Scope It
        }
    }

    Context 'Escalated returns from double-pass' {
        It 'returns escalated when double-pass escalates after review fix' {
            Mock git { return 'some diff' }
            Mock Invoke-ReviewLoop { return @{ Verdict = 'fail'; Blockers = @('blocker1') } }
            Mock Invoke-GlobalDoublePass { return @{ Status = 'escalated'; Retries = 5; LastError = 'dp failure' } }

            $result = Invoke-GlobalReview -Root 'C:\fake' -FeatureDir 'C:\fake\docs\feat' -BaseBranch 'main'
            $result.Verdict | Should -BeExactly 'escalated'
            $result.Blockers | Should -Contain 'dp failure'
        }
    }
}
