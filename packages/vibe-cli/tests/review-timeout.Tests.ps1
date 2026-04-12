BeforeAll {
    # Stub external dependencies before sourcing
    function Invoke-Claude { }
    function Write-PipelineLog { param([string]$Message, [string]$Color = 'Gray') }

    . "$PSScriptRoot/../utils/config.ps1"
    # Stub: pipeline-state.ps1 was removed in code-simplify
    function global:New-PipelineState {
        return @{
            pipelineState      = 'idle'
            lockHolder         = $null
            reviewRound        = [int]0
            keepGoingResets    = [int]0
            tddKeepGoingCount = [int]0
            verdict            = $null
            tasksDone          = [int]0
            gateTimedOut       = $false
            globalTimedOut     = $false
            reviewGateType     = 'none'
        }
    }
    . "$PSScriptRoot/../utils/review-timeout.ps1"
}

# =============================================================================
# Test-ReviewGateTimeout — TLA+ ReviewGateTimeout action (detection only)
# BDD: Feature "ReviewGateTimeout caps total wall-clock time for an entire review gate"
# TLA: gateTimedOut' = TRUE when wall-clock >= ReviewGateTimeoutSeconds
#      UNCHANGED <<pipelineState, lockHolder, reviewRound, keepGoingResets,
#                  tddKeepGoingCount, verdict, tasksDone, globalTimedOut,
#                  reviewGateType>>
# =============================================================================

Describe 'Test-ReviewGateTimeout' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        # Common pre-condition: pipeline in a review gate with lock held
        $script:state.pipelineState = 'preMergeReview'
        $script:state.lockHolder    = 1
        $script:state.reviewGateType = 'preMerge'
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Guard: valid pipeline states
    # TLA: pipelineState ∈ {"preMergeReview","reviewFix","finalReview","finalReviewFix"}
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Guard: only fires in review-related states' {
        It 'accepts pipelineState "preMergeReview"' {
            $script:state.pipelineState = 'preMergeReview'
            # Should not throw — elapsed exceeds timeout
            { Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801 } |
                Should -Not -Throw
        }

        It 'accepts pipelineState "reviewFix"' {
            $script:state.pipelineState = 'reviewFix'
            { Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801 } |
                Should -Not -Throw
        }

        It 'accepts pipelineState "finalReview"' {
            $script:state.pipelineState  = 'finalReview'
            $script:state.reviewGateType = 'final'
            { Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801 } |
                Should -Not -Throw
        }

        It 'accepts pipelineState "finalReviewFix"' {
            $script:state.pipelineState  = 'finalReviewFix'
            $script:state.reviewGateType = 'final'
            { Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801 } |
                Should -Not -Throw
        }

        It 'throws for pipelineState "running" (not in a review gate)' {
            $script:state.pipelineState = 'running'
            { Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801 } |
                Should -Throw '*pipelineState*'
        }

        It 'throws for pipelineState "idle"' {
            $script:state.pipelineState = 'idle'
            { Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801 } |
                Should -Throw '*pipelineState*'
        }

        It 'throws for pipelineState "mergeQueue"' {
            $script:state.pipelineState = 'mergeQueue'
            { Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801 } |
                Should -Throw '*pipelineState*'
        }

        It 'throws for terminal state "HALTED"' {
            $script:state.pipelineState = 'HALTED'
            { Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801 } |
                Should -Throw '*pipelineState*'
        }

        It 'throws for terminal state "COMPLETE"' {
            $script:state.pipelineState = 'COMPLETE'
            { Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801 } |
                Should -Throw '*pipelineState*'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Guard: gateTimedOut must be false (no double-fire)
    # TLA: ~gateTimedOut
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Guard: gateTimedOut must be false' {
        It 'throws when gateTimedOut is already true (no-op / idempotency guard)' {
            $script:state.gateTimedOut = $true
            { Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801 } |
                Should -Throw '*gateTimedOut*'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Guard: globalTimedOut must be false
    # TLA: ~globalTimedOut
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Guard: globalTimedOut must be false' {
        It 'throws when globalTimedOut is already true' {
            $script:state.globalTimedOut = $true
            { Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801 } |
                Should -Throw '*globalTimedOut*'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Timeout detection: elapsed >= ReviewGateTimeoutSeconds → gateTimedOut = true
    # BDD: "When the cumulative wall-clock reaches 1800 seconds / Then the review gate timeout fires"
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Timeout fires when elapsed >= ReviewGateTimeoutSeconds' {
        It 'sets gateTimedOut to true when elapsed equals ReviewGateTimeoutSeconds (boundary)' {
            $result = Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1800
            $script:state.gateTimedOut | Should -BeTrue
            $result | Should -BeTrue
        }

        It 'sets gateTimedOut to true when elapsed exceeds ReviewGateTimeoutSeconds' {
            $result = Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 2000
            $script:state.gateTimedOut | Should -BeTrue
            $result | Should -BeTrue
        }

        It 'returns true (timeout fired) when threshold reached' {
            $result = Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1800
            $result | Should -BeTrue
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # No timeout: elapsed < ReviewGateTimeoutSeconds → gateTimedOut stays false
    # ─────────────────────────────────────────────────────────────────────────

    Context 'No timeout when elapsed < ReviewGateTimeoutSeconds' {
        It 'does NOT set gateTimedOut when elapsed is below threshold' {
            $result = Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1799
            $script:state.gateTimedOut | Should -BeFalse
            $result | Should -BeFalse
        }

        It 'does NOT set gateTimedOut when elapsed is 0' {
            $result = Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 0
            $script:state.gateTimedOut | Should -BeFalse
            $result | Should -BeFalse
        }

        It 'returns false (no timeout) when threshold not reached' {
            $result = Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 500
            $result | Should -BeFalse
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # UNCHANGED invariant — all other state fields must be untouched
    # TLA: UNCHANGED <<pipelineState, lockHolder, reviewRound, keepGoingResets,
    #                  tddKeepGoingCount, verdict, tasksDone, globalTimedOut,
    #                  reviewGateType>>
    # ─────────────────────────────────────────────────────────────────────────

    Context 'UNCHANGED invariant — only gateTimedOut is mutated' {
        It 'does not change pipelineState when timeout fires' {
            $before = $script:state.pipelineState
            Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801
            $script:state.pipelineState | Should -BeExactly $before
        }

        It 'does not change lockHolder when timeout fires' {
            $script:state.lockHolder = 42
            Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801
            $script:state.lockHolder | Should -Be 42
        }

        It 'does not change reviewRound when timeout fires' {
            $script:state.reviewRound = 2
            Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801
            $script:state.reviewRound | Should -Be 2
        }

        It 'does not change keepGoingResets when timeout fires' {
            $script:state.keepGoingResets = 1
            Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801
            $script:state.keepGoingResets | Should -Be 1
        }

        It 'does not change tddKeepGoingCount when timeout fires' {
            $script:state.tddKeepGoingCount = 3
            Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801
            $script:state.tddKeepGoingCount | Should -Be 3
        }

        It 'does not change verdict when timeout fires' {
            Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'does not change tasksDone when timeout fires' {
            $script:state.tasksDone = 5
            Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801
            $script:state.tasksDone | Should -Be 5
        }

        It 'does not change globalTimedOut when timeout fires' {
            Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801
            $script:state.globalTimedOut | Should -BeFalse
        }

        It 'does not change reviewGateType when timeout fires' {
            $before = $script:state.reviewGateType
            Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801
            $script:state.reviewGateType | Should -BeExactly $before
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # BDD: "ReviewGateTimeout accumulates across retry-reviews"
    # Verifies the function uses the provided cumulative elapsed, not per-call
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Cumulative wall-clock accumulation' {
        It 'fires when cumulative elapsed across retries reaches threshold (500 + 1300 = 1800)' {
            # Caller is responsible for tracking cumulative time; we just test threshold
            $result = Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1800
            $result | Should -BeTrue
            $script:state.gateTimedOut | Should -BeTrue
        }

        It 'does NOT fire when cumulative elapsed is still below threshold (500 + 1200 = 1700)' {
            $result = Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1700
            $result | Should -BeFalse
            $script:state.gateTimedOut | Should -BeFalse
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Works for all four review-related states (preMerge and final gates)
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Timeout fires in final review states too' {
        It 'sets gateTimedOut in finalReview state' {
            $script:state.pipelineState  = 'finalReview'
            $script:state.reviewGateType = 'final'
            $result = Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801
            $script:state.gateTimedOut | Should -BeTrue
            $result | Should -BeTrue
        }

        It 'sets gateTimedOut in finalReviewFix state' {
            $script:state.pipelineState  = 'finalReviewFix'
            $script:state.reviewGateType = 'final'
            $result = Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 1801
            $script:state.gateTimedOut | Should -BeTrue
            $result | Should -BeTrue
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # ElapsedSeconds parameter validation
    # ─────────────────────────────────────────────────────────────────────────

    Context 'ElapsedSeconds parameter validation' {
        It 'throws for negative ElapsedSeconds' {
            { Test-ReviewGateTimeout -State $script:state -Config $script:cfg -ElapsedSeconds -1 } |
                Should -Throw
        }
    }
}

# =============================================================================
# Get-ReviewGateElapsed — helper to compute cumulative wall-clock seconds
# BDD: "the review gate for task T1 has been running for 1800 cumulative seconds"
# =============================================================================

Describe 'Get-ReviewGateElapsed' {
    It 'returns elapsed seconds from a given start time to now' {
        $startTime = (Get-Date).AddSeconds(-120)
        $elapsed = Get-ReviewGateElapsed -StartTime $startTime
        # Allow 2-second tolerance for test execution time
        $elapsed | Should -BeGreaterOrEqual 119
        $elapsed | Should -BeLessOrEqual 125
    }

    It 'returns 0 or near-0 for a start time that is now' {
        $startTime = Get-Date
        $elapsed = Get-ReviewGateElapsed -StartTime $startTime
        $elapsed | Should -BeGreaterOrEqual 0
        $elapsed | Should -BeLessOrEqual 2
    }

    It 'returns the elapsed seconds as a numeric type' {
        $startTime = (Get-Date).AddSeconds(-60)
        $elapsed = Get-ReviewGateElapsed -StartTime $startTime
        $elapsed | Should -BeOfType [double]
    }
}
