BeforeAll {
    # Stub external dependencies before sourcing
    function Invoke-Claude { }
    function Write-PipelineLog { }

    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-state.ps1"
    . "$PSScriptRoot/../utils/review-verdict.ps1"
    . "$PSScriptRoot/../utils/review-gate.ps1"

    # Safe fallback — review-gate.ps1 dots read-escalation.ps1 which prompts stdin
    function Read-Escalation {
        return @{ Decision = 'KeepGoing'; Source = 'task' }
    }
}

# =============================================================================
# Resolve-PreMergeVerdict — TLA+ HandlePassPreMerge / HandleFailPreMerge / HandleRetryPreMerge
# BDD: "Pre-merge review pass — task enters merge queue"
#      "Pre-merge review fail — review-fix cycle starts"
#      "Zero-blocker failures trigger retry-review instead of review-fix TDD cycles"
# =============================================================================

Describe 'Resolve-PreMergeVerdict' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        # Pre-condition: pipeline in preMergeReview, ready for verdict handling
        $script:state.pipelineState  = 'preMergeReview'
        $script:state.lockHolder     = 1
        $script:state.reviewGateType = 'preMerge'
        $script:state.verdict        = $null

        # Reusable verdict objects
        $script:passVerdict = [PSCustomObject]@{
            Verdict           = 'pass'
            Blockers          = @()
            Notes             = @()
            SelectedReviewers = @('security', 'bug')
            ExcludedReviewers = @()
        }

        $script:failVerdict = [PSCustomObject]@{
            Verdict           = 'fail'
            Blockers          = @(
                [PSCustomObject]@{
                    Reviewer    = 'security'
                    Severity    = 'critical'
                    Description = 'SQL injection in query builder'
                    Files       = @('src/db.ts')
                    Suggestion  = 'Use parameterized queries'
                }
            )
            Notes             = @()
            SelectedReviewers = @('security')
            ExcludedReviewers = @()
        }

        $script:retryVerdict = [PSCustomObject]@{
            Verdict           = 'retry'
            Blockers          = @()
            Notes             = @()
            SelectedReviewers = @()
            ExcludedReviewers = @()
            Reason            = 'Moderator returned non-JSON output'
        }

        Mock Write-PipelineLog {}
    }

    # =========================================================================
    # HandlePassPreMerge — TLA+ verdict = "pass" → pipelineState' = "mergeQueue"
    # BDD: "Pre-merge review pass — task enters merge queue"
    # =========================================================================

    Context 'Pass verdict — task enters merge queue (TLA+ HandlePassPreMerge)' {
        It 'transitions pipelineState to "mergeQueue"' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.pipelineState | Should -BeExactly 'mergeQueue'
        }

        It 'clears verdict to $null (ready for next gate)' {
            $script:state.verdict = 'pass'
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'resets reviewGateType to "none"' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.reviewGateType | Should -BeExactly 'none'
        }

        It 'preserves lockHolder (TLA+ UNCHANGED)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.lockHolder | Should -BeExactly 1
        }

        It 'preserves reviewRound (TLA+ UNCHANGED)' {
            $script:state.reviewRound = 2
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.reviewRound | Should -BeExactly 2
        }

        It 'preserves keepGoingResets (TLA+ UNCHANGED)' {
            $script:state.keepGoingResets = 1
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.keepGoingResets | Should -BeExactly 1
        }

        It 'preserves tddKeepGoingCount (TLA+ UNCHANGED)' {
            $script:state.tddKeepGoingCount = 2
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.tddKeepGoingCount | Should -BeExactly 2
        }

        It 'preserves tasksDone (TLA+ UNCHANGED)' {
            $script:state.tasksDone = 3
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.tasksDone | Should -BeExactly 3
        }

        It 'preserves gateTimedOut (TLA+ UNCHANGED)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.gateTimedOut | Should -BeExactly $false
        }

        It 'preserves globalTimedOut (TLA+ UNCHANGED)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.globalTimedOut | Should -BeExactly $false
        }

        It 'returns a result indicating pass was handled' {
            $result = Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $result.Action | Should -BeExactly 'mergeQueue'
        }
    }

    # =========================================================================
    # HandleFailPreMerge — TLA+ verdict = "fail" → pipelineState' = "reviewFix"
    # BDD: "Pre-merge review fail — review-fix cycle starts"
    # =========================================================================

    Context 'Fail verdict — review-fix cycle starts (TLA+ HandleFailPreMerge)' {
        It 'transitions pipelineState to "reviewFix"' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.pipelineState | Should -BeExactly 'reviewFix'
        }

        It 'clears verdict to $null' {
            $script:state.verdict = 'fail'
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'preserves reviewGateType as "preMerge" (gate not exited)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.reviewGateType | Should -BeExactly 'preMerge'
        }

        It 'preserves reviewRound (TLA+ UNCHANGED — round increments on re-review, not on fail)' {
            $script:state.reviewRound = 1
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.reviewRound | Should -BeExactly 1
        }

        It 'preserves lockHolder (TLA+ UNCHANGED)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.lockHolder | Should -BeExactly 1
        }

        It 'preserves keepGoingResets (TLA+ UNCHANGED)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.keepGoingResets | Should -BeExactly 0
        }

        It 'preserves tddKeepGoingCount (TLA+ UNCHANGED)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.tddKeepGoingCount | Should -BeExactly 0
        }

        It 'preserves tasksDone (TLA+ UNCHANGED)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.tasksDone | Should -BeExactly 0
        }

        It 'returns a result indicating fix cycle with blockers' {
            $result = Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $result.Action | Should -BeExactly 'reviewFix'
            $result.Blockers.Count | Should -Be 1
        }

        It 'returns blockers from the verdict for the RED phase' {
            $result = Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $result.Blockers[0].Description | Should -Be 'SQL injection in query builder'
        }
    }

    # =========================================================================
    # HandleRetryPreMerge — TLA+ verdict = "retry" → reviewRound' = reviewRound + 1
    # BDD: "Moderator parse failure produces a retry-review not a fix cycle"
    #      "Review round counter increments on retry-review (no fix cycle)"
    # =========================================================================

    Context 'Retry verdict — increment round, stay in preMergeReview (TLA+ HandleRetryPreMerge)' {
        It 'increments reviewRound by 1' {
            $script:state.reviewRound = 0
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.reviewRound | Should -BeExactly 1
        }

        It 'clears verdict to $null (ready for next review attempt)' {
            $script:state.verdict = 'retry'
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'preserves pipelineState as "preMergeReview" (no state transition)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.pipelineState | Should -BeExactly 'preMergeReview'
        }

        It 'preserves reviewGateType (TLA+ UNCHANGED)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.reviewGateType | Should -BeExactly 'preMerge'
        }

        It 'preserves lockHolder (TLA+ UNCHANGED)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.lockHolder | Should -BeExactly 1
        }

        It 'preserves keepGoingResets (TLA+ UNCHANGED)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.keepGoingResets | Should -BeExactly 0
        }

        It 'preserves tddKeepGoingCount (TLA+ UNCHANGED)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.tddKeepGoingCount | Should -BeExactly 0
        }

        It 'preserves tasksDone (TLA+ UNCHANGED)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.tasksDone | Should -BeExactly 0
        }

        It 'preserves gateTimedOut (TLA+ UNCHANGED)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.gateTimedOut | Should -BeExactly $false
        }

        It 'preserves globalTimedOut (TLA+ UNCHANGED)' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.globalTimedOut | Should -BeExactly $false
        }

        It 'returns a result indicating retry (no fix cycle)' {
            $result = Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $result.Action | Should -BeExactly 'retry'
        }

        It 'does not start a fix cycle (no blockers to feed RED)' {
            $result = Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $result.Action | Should -Not -BeExactly 'reviewFix'
        }
    }

    # =========================================================================
    # Fencepost — reviewRound boundary behavior
    # BDD: "Review round fencepost — 2nd cycle permits a 3rd"
    #      "Review round fencepost — 3rd cycle is the last"
    # =========================================================================

    Context 'Fencepost — fail at reviewRound < MaxReviewRounds is permitted' {
        It 'allows fail when reviewRound is 0 (first review)' {
            $script:state.reviewRound = 0
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.pipelineState | Should -BeExactly 'reviewFix'
        }

        It 'allows fail when reviewRound is MaxReviewRounds - 1' {
            $script:state.reviewRound = $script:cfg['MaxReviewRounds'] - 1
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.pipelineState | Should -BeExactly 'reviewFix'
        }

        It 'throws with exhaustion message when fail verdict at reviewRound >= MaxReviewRounds' {
            $script:state.reviewRound = $script:cfg['MaxReviewRounds']
            { Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict } |
                Should -Throw -ExpectedMessage '*review*round*exhaust*'
        }
    }

    Context 'Fencepost — retry at reviewRound < MaxReviewRounds is permitted' {
        It 'allows retry when reviewRound is 0 and increments to 1' {
            $script:state.reviewRound = 0
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.reviewRound | Should -BeExactly 1
        }

        It 'allows retry when reviewRound is MaxReviewRounds - 1' {
            $script:state.reviewRound = $script:cfg['MaxReviewRounds'] - 1
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.reviewRound | Should -BeExactly $script:cfg['MaxReviewRounds']
        }

        It 'throws with exhaustion message when retry verdict at reviewRound >= MaxReviewRounds' {
            $script:state.reviewRound = $script:cfg['MaxReviewRounds']
            { Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict } |
                Should -Throw -ExpectedMessage '*review*round*exhaust*'
        }
    }

    Context 'Pass verdict has no round guard — passes at any reviewRound' {
        It 'allows pass when reviewRound equals MaxReviewRounds' {
            $script:state.reviewRound = $script:cfg['MaxReviewRounds']
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.pipelineState | Should -BeExactly 'mergeQueue'
        }

        It 'allows pass when reviewRound is 0' {
            $script:state.reviewRound = 0
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.pipelineState | Should -BeExactly 'mergeQueue'
        }
    }

    # =========================================================================
    # Guard conditions — invalid pre-states
    # =========================================================================

    Context 'Guard conditions — rejects invalid pipelineState' {
        It 'throws with state error when pipelineState is "running"' {
            $script:state.pipelineState = 'running'
            { Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict } |
                Should -Throw -ExpectedMessage '*preMergeReview*'
        }

        It 'throws with state error when pipelineState is "finalReview" (wrong gate type for pre-merge)' {
            $script:state.pipelineState = 'finalReview'
            { Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict } |
                Should -Throw -ExpectedMessage '*preMergeReview*'
        }

        It 'throws with state error when pipelineState is "idle"' {
            $script:state.pipelineState = 'idle'
            { Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict } |
                Should -Throw -ExpectedMessage '*preMergeReview*'
        }
    }

    Context 'Guard conditions — rejects invalid verdict values' {
        It 'throws with invalid verdict message for unknown verdict value "maybe"' {
            $badVerdict = [PSCustomObject]@{
                Verdict = 'maybe'; Blockers = @(); Notes = @()
                SelectedReviewers = @(); ExcludedReviewers = @()
            }
            { Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $badVerdict } |
                Should -Throw -ExpectedMessage '*invalid*verdict*maybe*'
        }

        It 'throws with invalid verdict message when Verdict property is $null' {
            $nullVerdict = [PSCustomObject]@{
                Verdict = $null; Blockers = @(); Notes = @()
                SelectedReviewers = @(); ExcludedReviewers = @()
            }
            { Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $nullVerdict } |
                Should -Throw -ExpectedMessage '*invalid*verdict*'
        }
    }

    # =========================================================================
    # Mixed scenario — BDD: "Mixed retry-review and fix-cycle rounds share
    # the same counter"
    # =========================================================================

    Context 'Mixed retry and fail rounds share the same reviewRound counter' {
        It 'retry at round 0 → round 1, then fail at round 1 enters reviewFix' {
            # Round 1: retry (moderator timeout)
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.reviewRound | Should -BeExactly 1

            # Round 2: fail (blockers found)
            $script:state.verdict = $null
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.pipelineState | Should -BeExactly 'reviewFix'
            # reviewRound unchanged on fail — stays at 1
            $script:state.reviewRound | Should -BeExactly 1
        }
    }

    # =========================================================================
    # TypeOK invariant — state remains valid after each verdict handling
    # =========================================================================

    Context 'TypeOK invariant holds after verdict handling' {
        It 'state is TypeOK after pass verdict' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }

        It 'state is TypeOK after fail verdict' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }

        It 'state is TypeOK after retry verdict' {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }
    }
}
