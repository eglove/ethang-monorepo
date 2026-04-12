BeforeAll {
    # Stub external dependencies before sourcing
    function Invoke-Claude { }
    function Write-PipelineLog { param([string]$Message, [string]$Color = 'Gray') }
    function Write-StatusNote { param([string]$TaskId, [string]$Status) }

    # Stub Read-Escalation so Pester can mock it (defined in read-escalation.ps1)
    function Read-Escalation {
        param([string]$Source, [string]$TaskId, [string]$Phase, [string]$Error_,
              [hashtable]$TaskStatuses, [string]$FeatureDir, [string]$RunId)
    }

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
# Invoke-GateTimeoutEscalation — TLA+ GateTimeoutKeepGoing / GateTimeoutStop
# BDD: Feature "ReviewGateTimeout caps total wall-clock time for an entire review gate"
#      Scenario "Keep Going on ReviewGateTimeout resets the wall-clock timer"
#      Scenario "ReviewGateTimeout fires during reviewer dispatch"
# TLA:
#   GateTimeoutKeepGoing:
#     gateTimedOut = TRUE ∧ ~globalTimedOut ∧ keepGoingResets < MaxKeepGoingResets
#     → gateTimedOut' = FALSE, keepGoingResets' + 1, reviewRound' = 0,
#       tddKeepGoingCount' = 0, verdict' = NULL,
#       pipelineState' = preMergeReview | finalReview (based on reviewGateType)
#     UNCHANGED <<lockHolder, tasksDone, globalTimedOut, reviewGateType>>
#
#   GateTimeoutStop:
#     gateTimedOut = TRUE
#     → pipelineState' = HALTED, lockHolder' = NULL
#     UNCHANGED <<reviewRound, keepGoingResets, tddKeepGoingCount,
#                 verdict, tasksDone, gateTimedOut, globalTimedOut, reviewGateType>>
# =============================================================================

Describe 'Invoke-GateTimeoutEscalation' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        # Pre-condition: gate timeout has fired, pipeline is in a review state
        $script:state.pipelineState  = 'preMergeReview'
        $script:state.lockHolder     = 1
        $script:state.gateTimedOut   = $true
        $script:state.reviewGateType = 'preMerge'
        $script:state.reviewRound    = 2
        $script:state.tddKeepGoingCount = 3
        $script:state.verdict        = 'fail'

        # Mock Read-Escalation — default to KeepGoing
        Mock Read-Escalation {
            return @{
                Decision        = 'KeepGoing'
                Source           = 'task'
                TaskId           = $null
                Phase            = $null
                Reason           = $null
                PreStopSnapshot  = $null
            }
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Guard: gateTimedOut must be true
    # TLA: gateTimedOut = TRUE
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Guard: gateTimedOut must be true' {
        It 'throws when gateTimedOut is false (no timeout to escalate)' {
            $script:state.gateTimedOut = $false
            { Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg } |
                Should -Throw '*gateTimedOut*'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Guard: pipelineState must be a review-related state
    # TLA: pipelineState ∈ {"preMergeReview","reviewFix","finalReview","finalReviewFix"}
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Guard: pipelineState must be review-related' {
        It 'throws for pipelineState "running"' {
            $script:state.pipelineState = 'running'
            { Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg } |
                Should -Throw '*pipelineState*'
        }

        It 'throws for pipelineState "idle"' {
            $script:state.pipelineState = 'idle'
            { Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg } |
                Should -Throw '*pipelineState*'
        }

        It 'throws for pipelineState "mergeQueue"' {
            $script:state.pipelineState = 'mergeQueue'
            { Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg } |
                Should -Throw '*pipelineState*'
        }

        It 'throws for terminal state "HALTED"' {
            $script:state.pipelineState = 'HALTED'
            { Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg } |
                Should -Throw '*pipelineState*'
        }

        It 'throws for terminal state "COMPLETE"' {
            $script:state.pipelineState = 'COMPLETE'
            { Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg } |
                Should -Throw '*pipelineState*'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Guard: globalTimedOut must be false
    # TLA: ~globalTimedOut (GateTimeoutKeepGoing guard)
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Guard: globalTimedOut must be false' {
        It 'throws when globalTimedOut is already true' {
            $script:state.globalTimedOut = $true
            { Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg } |
                Should -Throw '*globalTimedOut*'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Calls Read-Escalation with gate timeout context
    # BDD: "Read-Escalation is called with review gate timeout context"
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Calls Read-Escalation with timeout context' {
        It 'invokes Read-Escalation exactly once' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            Should -Invoke Read-Escalation -Times 1 -Exactly
        }

        It 'passes Source parameter to Read-Escalation' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            Should -Invoke Read-Escalation -Times 1 -ParameterFilter {
                $Source -ne $null -and $Source -ne ''
            }
        }

        It 'passes Error_ context mentioning gate timeout to Read-Escalation' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            Should -Invoke Read-Escalation -Times 1 -ParameterFilter {
                $Error_ -match 'gate.*time' -or $Error_ -match 'timeout'
            }
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Keep Going path — TLA GateTimeoutKeepGoing
    # BDD: "Keep Going on ReviewGateTimeout resets the wall-clock timer"
    #      "the review gate wall-clock timer resets to 0"
    #      "the review resumes from a fresh review (retry-review)"
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Keep Going: resets gate state for fresh review' {
        BeforeEach {
            Mock Read-Escalation {
                return @{
                    Decision = 'KeepGoing'; Source = 'task'
                    TaskId = $null; Phase = $null; Reason = $null; PreStopSnapshot = $null
                }
            }
        }

        It 'sets gateTimedOut to false (resets wall-clock timer)' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.gateTimedOut | Should -BeFalse
        }

        It 'increments keepGoingResets by 1' {
            $before = $script:state.keepGoingResets
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.keepGoingResets | Should -Be ($before + 1)
        }

        It 'resets reviewRound to 0' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.reviewRound | Should -Be 0
        }

        It 'resets tddKeepGoingCount to 0' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.tddKeepGoingCount | Should -Be 0
        }

        It 'resets verdict to null' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'transitions pipelineState to preMergeReview when reviewGateType is preMerge' {
            $script:state.reviewGateType = 'preMerge'
            $script:state.pipelineState  = 'reviewFix'  # could be in fix state
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'preMergeReview'
        }

        It 'transitions pipelineState to finalReview when reviewGateType is final' {
            $script:state.pipelineState  = 'finalReviewFix'
            $script:state.reviewGateType = 'final'
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'finalReview'
        }

        It 'returns the escalation result with KeepGoing decision' {
            $result = Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $result.Decision | Should -BeExactly 'KeepGoing'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Keep Going UNCHANGED invariant — fields that must not change
    # TLA: UNCHANGED <<lockHolder, tasksDone, globalTimedOut, reviewGateType>>
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Keep Going: UNCHANGED invariant' {
        BeforeEach {
            Mock Read-Escalation {
                return @{
                    Decision = 'KeepGoing'; Source = 'task'
                    TaskId = $null; Phase = $null; Reason = $null; PreStopSnapshot = $null
                }
            }
            $script:state.lockHolder = 42
            $script:state.tasksDone  = 3
        }

        It 'does not change lockHolder' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.lockHolder | Should -Be 42
        }

        It 'does not change tasksDone' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.tasksDone | Should -Be 3
        }

        It 'does not change globalTimedOut' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.globalTimedOut | Should -BeFalse
        }

        It 'does not change reviewGateType' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.reviewGateType | Should -BeExactly 'preMerge'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Stop path — TLA GateTimeoutStop
    # BDD: "ReviewGateTimeout fires during reviewer dispatch" → escalation → Stop
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Stop: transitions to HALTED with lock release' {
        BeforeEach {
            Mock Read-Escalation {
                return @{
                    Decision = 'Stop'; Source = 'task'
                    TaskId = $null; Phase = $null; Reason = $null; PreStopSnapshot = $null
                }
            }
        }

        It 'sets pipelineState to HALTED' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }

        It 'releases lockHolder to null' {
            $script:state.lockHolder = 42
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.lockHolder | Should -BeNullOrEmpty
        }

        It 'returns the escalation result with Stop decision' {
            $result = Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $result.Decision | Should -BeExactly 'Stop'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Stop UNCHANGED invariant
    # TLA: UNCHANGED <<reviewRound, keepGoingResets, tddKeepGoingCount,
    #                  verdict, tasksDone, gateTimedOut, globalTimedOut,
    #                  reviewGateType>>
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Stop: UNCHANGED invariant' {
        BeforeEach {
            Mock Read-Escalation {
                return @{
                    Decision = 'Stop'; Source = 'task'
                    TaskId = $null; Phase = $null; Reason = $null; PreStopSnapshot = $null
                }
            }
            $script:state.reviewRound      = 2
            $script:state.keepGoingResets   = 1
            $script:state.tddKeepGoingCount = 3
            $script:state.verdict           = 'fail'
            $script:state.tasksDone         = 5
        }

        It 'does not change reviewRound' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.reviewRound | Should -Be 2
        }

        It 'does not change keepGoingResets' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.keepGoingResets | Should -Be 1
        }

        It 'does not change tddKeepGoingCount' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.tddKeepGoingCount | Should -Be 3
        }

        It 'does not change verdict' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.verdict | Should -BeExactly 'fail'
        }

        It 'does not change tasksDone' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.tasksDone | Should -Be 5
        }

        It 'does not change gateTimedOut' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.gateTimedOut | Should -BeTrue
        }

        It 'does not change globalTimedOut' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.globalTimedOut | Should -BeFalse
        }

        It 'does not change reviewGateType' {
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.reviewGateType | Should -BeExactly 'preMerge'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Forced stop when keepGoingResets exhausted
    # TLA: keepGoingResets >= MaxKeepGoingResets → must stop (no Keep Going offered)
    # BDD: similar to ReviewForcedStop but for gate timeout path
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Forced stop when Keep Going resets exhausted' {
        It 'transitions to HALTED without calling Read-Escalation when keepGoingResets >= MaxKeepGoingResets' {
            $script:state.keepGoingResets = $script:cfg['MaxKeepGoingResets']
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'HALTED'
            $script:state.lockHolder | Should -BeNullOrEmpty
        }

        It 'does not call Read-Escalation when forced stop' {
            $script:state.keepGoingResets = $script:cfg['MaxKeepGoingResets']
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            Should -Invoke Read-Escalation -Times 0 -Exactly
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Works across all four review-related pipeline states
    # TLA: pipelineState ∈ {"preMergeReview","reviewFix","finalReview","finalReviewFix"}
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Accepts all four review-related pipeline states' {
        BeforeEach {
            Mock Read-Escalation {
                return @{
                    Decision = 'KeepGoing'; Source = 'task'
                    TaskId = $null; Phase = $null; Reason = $null; PreStopSnapshot = $null
                }
            }
        }

        It 'accepts preMergeReview' {
            $script:state.pipelineState = 'preMergeReview'
            { Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg } |
                Should -Not -Throw
        }

        It 'accepts reviewFix' {
            $script:state.pipelineState = 'reviewFix'
            { Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg } |
                Should -Not -Throw
        }

        It 'accepts finalReview with final gate type' {
            $script:state.pipelineState  = 'finalReview'
            $script:state.reviewGateType = 'final'
            { Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg } |
                Should -Not -Throw
        }

        It 'accepts finalReviewFix with final gate type' {
            $script:state.pipelineState  = 'finalReviewFix'
            $script:state.reviewGateType = 'final'
            { Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg } |
                Should -Not -Throw
        }

        It 'routes reviewFix to preMergeReview on Keep Going (not back to reviewFix)' {
            $script:state.pipelineState = 'reviewFix'
            $script:state.reviewGateType = 'preMerge'
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'preMergeReview'
        }

        It 'routes finalReviewFix to finalReview on Keep Going (not back to finalReviewFix)' {
            $script:state.pipelineState  = 'finalReviewFix'
            $script:state.reviewGateType = 'final'
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'finalReview'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # BDD: "ReviewGateTimeout accumulates across retry-reviews"
    # BDD: "ReviewGateTimeout accumulates across review-fix cycles"
    # Scenario context: the function is called after Test-ReviewGateTimeout
    # detects the timeout — it receives state with context about rounds completed
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Context preservation for escalation' {
        It 'passes the current reviewRound context (for "context including review rounds completed")' {
            $script:state.reviewRound = 2
            Mock Read-Escalation {
                return @{
                    Decision = 'KeepGoing'; Source = 'task'
                    TaskId = $null; Phase = $null; Reason = $null; PreStopSnapshot = $null
                }
            }
            Invoke-GateTimeoutEscalation -State $script:state -Config $script:cfg
            # Error_ context should mention rounds or review state
            Should -Invoke Read-Escalation -Times 1 -ParameterFilter {
                $Error_ -match 'round|review' -or $Error_ -match 'timeout'
            }
        }
    }
}
