BeforeAll {
    # Stub external dependencies before sourcing
    function Invoke-Claude { }
    function Write-PipelineLog { param([string]$Message, [string]$Color = 'Gray') }

    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-state.ps1"
    . "$PSScriptRoot/../utils/pipeline-lock.ps1"
    . "$PSScriptRoot/../utils/global-timeout.ps1"
}

# =============================================================================
# Test-GlobalPipelineTimeout — TLA+ GlobalTimeout action
# BDD: "Pipeline halts when global wall-clock exceeds PipelineTimeoutSeconds"
# TLA:
#   /\ pipelineState \notin {"idle", "COMPLETE", "HALTED"}
#   /\ ~globalTimedOut
#   /\ globalTimedOut' = TRUE
#   /\ pipelineState' = "HALTED"
#   /\ lockHolder' = NULL
#   /\ UNCHANGED <<reviewRound, keepGoingResets, tddKeepGoingCount,
#                  verdict, tasksDone, gateTimedOut, reviewGateType>>
# =============================================================================

Describe 'Test-GlobalPipelineTimeout' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        # Common pre-condition: pipeline is running with lock held
        $script:state.pipelineState = 'running'
        $script:state.lockHolder    = 1
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Guard: pipelineState ∉ {idle, COMPLETE, HALTED}
    # TLA: pipelineState \notin {"idle", "COMPLETE", "HALTED"}
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Guard: fires in all active (non-idle, non-terminal) states' {
        It 'accepts pipelineState "running"' {
            $script:state.pipelineState = 'running'
            { Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400 } |
                Should -Not -Throw
        }

        It 'accepts pipelineState "locked"' {
            $script:state.pipelineState = 'locked'
            { Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400 } |
                Should -Not -Throw
        }

        It 'accepts pipelineState "preMergeReview"' {
            $script:state.pipelineState = 'preMergeReview'
            { Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400 } |
                Should -Not -Throw
        }

        It 'accepts pipelineState "reviewFix"' {
            $script:state.pipelineState = 'reviewFix'
            { Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400 } |
                Should -Not -Throw
        }

        It 'accepts pipelineState "mergeQueue"' {
            $script:state.pipelineState = 'mergeQueue'
            { Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400 } |
                Should -Not -Throw
        }

        It 'accepts pipelineState "finalReview"' {
            $script:state.pipelineState = 'finalReview'
            { Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400 } |
                Should -Not -Throw
        }

        It 'accepts pipelineState "finalReviewFix"' {
            $script:state.pipelineState = 'finalReviewFix'
            { Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400 } |
                Should -Not -Throw
        }

        It 'throws for pipelineState "idle"' {
            $script:state.pipelineState = 'idle'
            { Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400 } |
                Should -Throw '*pipelineState*'
        }

        It 'throws for terminal state "COMPLETE"' {
            $script:state.pipelineState = 'COMPLETE'
            { Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400 } |
                Should -Throw '*pipelineState*'
        }

        It 'throws for terminal state "HALTED"' {
            $script:state.pipelineState = 'HALTED'
            { Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400 } |
                Should -Throw '*pipelineState*'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Guard: globalTimedOut must be false (no double-fire)
    # TLA: ~globalTimedOut
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Guard: globalTimedOut must be false' {
        It 'throws when globalTimedOut is already true (idempotency guard)' {
            $script:state.globalTimedOut = $true
            { Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400 } |
                Should -Throw '*globalTimedOut*'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Timeout detection: elapsed >= PipelineTimeoutSeconds
    # BDD: "the pipeline has been running for 14400 cumulative seconds"
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Timeout fires when elapsed >= PipelineTimeoutSeconds' {
        It 'returns true when elapsed equals PipelineTimeoutSeconds (boundary)' {
            $result = Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $result | Should -BeTrue
        }

        It 'returns true when elapsed exceeds PipelineTimeoutSeconds' {
            $result = Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 15000
            $result | Should -BeTrue
        }

        It 'sets globalTimedOut to true when threshold reached' {
            Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $script:state.globalTimedOut | Should -BeTrue
        }

        It 'transitions pipelineState to HALTED' {
            Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }

        It 'sets lockHolder to $null (lock released)' {
            $script:state.lockHolder = 1
            Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $script:state.lockHolder | Should -BeNullOrEmpty
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # No timeout: elapsed < PipelineTimeoutSeconds
    # ─────────────────────────────────────────────────────────────────────────

    Context 'No timeout when elapsed < PipelineTimeoutSeconds' {
        It 'returns false when elapsed is below threshold' {
            $result = Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14399
            $result | Should -BeFalse
        }

        It 'returns false when elapsed is 0' {
            $result = Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 0
            $result | Should -BeFalse
        }

        It 'does NOT set globalTimedOut when below threshold' {
            Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14399
            $script:state.globalTimedOut | Should -BeFalse
        }

        It 'does NOT change pipelineState when below threshold' {
            $before = $script:state.pipelineState
            Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14399
            $script:state.pipelineState | Should -BeExactly $before
        }

        It 'does NOT change lockHolder when below threshold' {
            Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14399
            $script:state.lockHolder | Should -BeExactly 1
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # UNCHANGED invariant — only globalTimedOut, pipelineState, lockHolder mutate
    # TLA: UNCHANGED <<reviewRound, keepGoingResets, tddKeepGoingCount,
    #                  verdict, tasksDone, gateTimedOut, reviewGateType>>
    # ─────────────────────────────────────────────────────────────────────────

    Context 'UNCHANGED invariant — preserved fields when timeout fires' {
        It 'does not change reviewRound when timeout fires' {
            $script:state.reviewRound = 2
            Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $script:state.reviewRound | Should -Be 2
        }

        It 'does not change keepGoingResets when timeout fires' {
            $script:state.keepGoingResets = 1
            Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $script:state.keepGoingResets | Should -Be 1
        }

        It 'does not change tddKeepGoingCount when timeout fires' {
            $script:state.tddKeepGoingCount = 3
            Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $script:state.tddKeepGoingCount | Should -Be 3
        }

        It 'does not change verdict when timeout fires' {
            $script:state.verdict = 'fail'
            Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $script:state.verdict | Should -BeExactly 'fail'
        }

        It 'does not change tasksDone when timeout fires' {
            $script:state.tasksDone = 5
            Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $script:state.tasksDone | Should -Be 5
        }

        It 'does not change gateTimedOut when timeout fires' {
            Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $script:state.gateTimedOut | Should -BeFalse
        }

        It 'preserves gateTimedOut=true when it was already set before global fires' {
            $script:state.gateTimedOut = $true
            Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $script:state.gateTimedOut | Should -BeTrue
        }

        It 'does not change reviewGateType when timeout fires' {
            $script:state.reviewGateType = 'preMerge'
            Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $script:state.reviewGateType | Should -BeExactly 'preMerge'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # BDD: "PipelineTimeoutSeconds is not reset by Keep Going"
    # Cumulative elapsed is the caller's responsibility; function checks threshold
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Cumulative wall-clock — not reset by Keep Going' {
        It 'fires when cumulative elapsed reaches threshold despite mid-run resets (13000 + 1400 = 14400)' {
            $script:state.keepGoingResets = 2  # Keep Going was used
            $result = Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $result | Should -BeTrue
            $script:state.globalTimedOut | Should -BeTrue
        }

        It 'does NOT fire when cumulative elapsed is below threshold after Keep Going' {
            $script:state.keepGoingResets = 2
            $result = Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 13999
            $result | Should -BeFalse
            $script:state.globalTimedOut | Should -BeFalse
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # BDD: "PipelineTimeoutSeconds overrides active ReviewGateTimeout"
    # Global timeout fires even when a review gate is active
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Overrides active review gate' {
        It 'fires during preMergeReview even when gate has time left' {
            $script:state.pipelineState  = 'preMergeReview'
            $script:state.reviewGateType = 'preMerge'
            $script:state.gateTimedOut   = $false  # gate hasn't timed out yet

            $result = Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $result | Should -BeTrue
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }

        It 'fires during finalReview even when gate has time left' {
            $script:state.pipelineState  = 'finalReview'
            $script:state.reviewGateType = 'final'
            $script:state.gateTimedOut   = $false

            $result = Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds 14400
            $result | Should -BeTrue
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # ElapsedSeconds parameter validation
    # ─────────────────────────────────────────────────────────────────────────

    Context 'ElapsedSeconds parameter validation' {
        It 'throws for negative ElapsedSeconds' {
            { Test-GlobalPipelineTimeout -State $script:state -Config $script:cfg -ElapsedSeconds -1 } |
                Should -Throw
        }
    }
}

# =============================================================================
# Get-PipelineElapsed — helper to compute global wall-clock seconds
# BDD: "the pipeline has been running for 14400 cumulative seconds"
# =============================================================================

Describe 'Get-PipelineElapsed' {
    It 'returns elapsed seconds from a given start time to now' {
        $startTime = (Get-Date).AddSeconds(-120)
        $elapsed = Get-PipelineElapsed -StartTime $startTime
        # Allow 2-second tolerance for test execution time
        $elapsed | Should -BeGreaterOrEqual 119
        $elapsed | Should -BeLessOrEqual 125
    }

    It 'returns 0 or near-0 for a start time that is now' {
        $startTime = Get-Date
        $elapsed = Get-PipelineElapsed -StartTime $startTime
        $elapsed | Should -BeGreaterOrEqual 0
        $elapsed | Should -BeLessOrEqual 2
    }

    It 'returns the elapsed seconds as a numeric type' {
        $startTime = (Get-Date).AddSeconds(-60)
        $elapsed = Get-PipelineElapsed -StartTime $startTime
        $elapsed | Should -BeOfType [double]
    }
}

# =============================================================================
# Safety invariant: S10 — GlobalTimeoutHalts
# TLA: globalTimedOut => pipelineState = "HALTED"
# =============================================================================

Describe 'Safety invariant: GlobalTimeoutHalts (S10)' {
    It 'After global timeout fires, pipelineState is always HALTED' {
        $cfg   = Get-PipelineConfig
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder    = 1

        Test-GlobalPipelineTimeout -State $state -Config $cfg -ElapsedSeconds 14400

        # S10: globalTimedOut => pipelineState = "HALTED"
        $state.globalTimedOut | Should -BeTrue
        $state.pipelineState  | Should -BeExactly 'HALTED'
    }

    It 'lockHolder is NULL after global timeout (lock released for cleanup)' {
        $cfg   = Get-PipelineConfig
        $state = New-PipelineState
        $state.pipelineState = 'preMergeReview'
        $state.lockHolder    = 1

        Test-GlobalPipelineTimeout -State $state -Config $cfg -ElapsedSeconds 14400

        $state.lockHolder | Should -BeNullOrEmpty
    }

    It 'TypeOK still holds after global timeout fires' {
        $cfg   = Get-PipelineConfig
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder    = 1

        Test-GlobalPipelineTimeout -State $state -Config $cfg -ElapsedSeconds 14400

        # lockHolder must be NULL for HALTED to pass TypeOK — adjust check
        # TypeOK validates all fields are within legal ranges
        Test-PipelineStateTypeOK -State $state -Config $cfg | Should -BeTrue
    }
}
