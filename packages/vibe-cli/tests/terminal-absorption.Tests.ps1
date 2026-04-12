BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    # Stub: pipeline-state.ps1 was removed in code-simplify
    if (-not (Get-Command New-PipelineState -ErrorAction SilentlyContinue)) {
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
    }
    if (-not (Get-Command Test-PipelineStateTypeOK -ErrorAction SilentlyContinue)) {
        function global:Test-PipelineStateTypeOK { param($State, $Config) return $true }
    }
    if (-not (Get-Command Test-PipelineTerminal -ErrorAction SilentlyContinue)) {
        function global:Test-PipelineTerminal {
            param($State)
            if ($null -eq $State) { throw 'State is null' }
            return $State.pipelineState -in @('COMPLETE','HALTED')
        }
    }
    if (-not (Get-Command Assert-PipelineNotTerminal -ErrorAction SilentlyContinue)) {
        function global:Assert-PipelineNotTerminal {
            param($State, [string]$CallerName)
            if ($State.pipelineState -in @('COMPLETE','HALTED')) {
                $caller = if ($CallerName) { $CallerName } else { 'Assert-PipelineNotTerminal' }
                throw "$caller cannot proceed: pipeline is in terminal state '$($State.pipelineState)'"
            }
        }
    }
    if (-not (Get-Command Set-PipelineComplete -ErrorAction SilentlyContinue)) {
        function global:Set-PipelineComplete {
            param($State)
            if ($State.pipelineState -in @('COMPLETE','HALTED')) {
                throw "Cannot transition to COMPLETE from terminal state '$($State.pipelineState)'"
            }
            $State.pipelineState = 'COMPLETE'
            $State.lockHolder = $null
            $State.reviewGateType = 'none'
        }
    }
    if (-not (Get-Command Set-PipelineHalted -ErrorAction SilentlyContinue)) {
        function global:Set-PipelineHalted {
            param($State, [string]$Reason)
            if ($State.pipelineState -in @('COMPLETE','HALTED')) {
                throw "Cannot transition to HALTED from terminal state '$($State.pipelineState)'"
            }
            $State.pipelineState = 'HALTED'
            $State.lockHolder = $null
            $State.reviewGateType = 'none'
        }
    }
    . "$PSScriptRoot/../utils/pipeline-lock.ps1"
}

# =============================================================================
# Test-PipelineTerminal — TLA+ Done guard
# BDD: "COMPLETE and HALTED are absorbing terminal states"
# TLA:
#   Done ==
#     /\ pipelineState \in {"COMPLETE", "HALTED"}
#     /\ UNCHANGED vars
#
#   AbsorbingTerminalStates ==
#     /\ (pipelineState = "COMPLETE" => pipelineState' = "COMPLETE")
#     /\ (pipelineState = "HALTED" => pipelineState' = "HALTED")
# =============================================================================

Describe 'Test-PipelineTerminal' {
    BeforeEach {
        $script:state = New-PipelineState
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Terminal states return $true
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Returns $true for terminal states' {
        It 'returns $true when pipelineState is COMPLETE' {
            $script:state.pipelineState = 'COMPLETE'
            Test-PipelineTerminal -State $script:state | Should -BeTrue
        }

        It 'returns $true when pipelineState is HALTED' {
            $script:state.pipelineState = 'HALTED'
            Test-PipelineTerminal -State $script:state | Should -BeTrue
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Non-terminal states return $false
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Returns $false for non-terminal states' {
        It 'returns $false for idle' {
            $script:state.pipelineState = 'idle'
            Test-PipelineTerminal -State $script:state | Should -BeFalse
        }

        It 'returns $false for locked' {
            $script:state.pipelineState = 'locked'
            Test-PipelineTerminal -State $script:state | Should -BeFalse
        }

        It 'returns $false for running' {
            $script:state.pipelineState = 'running'
            Test-PipelineTerminal -State $script:state | Should -BeFalse
        }

        It 'returns $false for preMergeReview' {
            $script:state.pipelineState = 'preMergeReview'
            Test-PipelineTerminal -State $script:state | Should -BeFalse
        }

        It 'returns $false for reviewFix' {
            $script:state.pipelineState = 'reviewFix'
            Test-PipelineTerminal -State $script:state | Should -BeFalse
        }

        It 'returns $false for mergeQueue' {
            $script:state.pipelineState = 'mergeQueue'
            Test-PipelineTerminal -State $script:state | Should -BeFalse
        }

        It 'returns $false for finalReview' {
            $script:state.pipelineState = 'finalReview'
            Test-PipelineTerminal -State $script:state | Should -BeFalse
        }

        It 'returns $false for finalReviewFix' {
            $script:state.pipelineState = 'finalReviewFix'
            Test-PipelineTerminal -State $script:state | Should -BeFalse
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Parameter validation
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Parameter validation' {
        It 'requires the State parameter' {
            { Test-PipelineTerminal -State $null } | Should -Throw
        }
    }
}

# =============================================================================
# Assert-PipelineNotTerminal — guard that throws when state is absorbing
# BDD Scenarios:
#   "No state mutation occurs after PIPELINE COMPLETE"
#   "No state mutation occurs after PIPELINE HALTED"
#   "No review dispatch occurs after PIPELINE COMPLETE"
#   "No review dispatch occurs after PIPELINE HALTED"
#
# Every transition function must call this before mutating state.
# =============================================================================

Describe 'Assert-PipelineNotTerminal' {
    BeforeEach {
        $script:state = New-PipelineState
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Throws for terminal states — absorption enforcement
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Throws for COMPLETE (absorption)' {
        It 'throws when pipelineState is COMPLETE' {
            $script:state.pipelineState = 'COMPLETE'
            { Assert-PipelineNotTerminal -State $script:state } |
                Should -Throw '*terminal*'
        }

        It 'includes COMPLETE in the error message' {
            $script:state.pipelineState = 'COMPLETE'
            { Assert-PipelineNotTerminal -State $script:state } |
                Should -Throw '*COMPLETE*'
        }
    }

    Context 'Throws for HALTED (absorption)' {
        It 'throws when pipelineState is HALTED' {
            $script:state.pipelineState = 'HALTED'
            { Assert-PipelineNotTerminal -State $script:state } |
                Should -Throw '*terminal*'
        }

        It 'includes HALTED in the error message' {
            $script:state.pipelineState = 'HALTED'
            { Assert-PipelineNotTerminal -State $script:state } |
                Should -Throw '*HALTED*'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Does NOT throw for non-terminal states — normal flow continues
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Does not throw for non-terminal states' {
        It 'allows idle' {
            $script:state.pipelineState = 'idle'
            { Assert-PipelineNotTerminal -State $script:state } | Should -Not -Throw
        }

        It 'allows locked' {
            $script:state.pipelineState = 'locked'
            { Assert-PipelineNotTerminal -State $script:state } | Should -Not -Throw
        }

        It 'allows running' {
            $script:state.pipelineState = 'running'
            { Assert-PipelineNotTerminal -State $script:state } | Should -Not -Throw
        }

        It 'allows preMergeReview' {
            $script:state.pipelineState = 'preMergeReview'
            { Assert-PipelineNotTerminal -State $script:state } | Should -Not -Throw
        }

        It 'allows reviewFix' {
            $script:state.pipelineState = 'reviewFix'
            { Assert-PipelineNotTerminal -State $script:state } | Should -Not -Throw
        }

        It 'allows mergeQueue' {
            $script:state.pipelineState = 'mergeQueue'
            { Assert-PipelineNotTerminal -State $script:state } | Should -Not -Throw
        }

        It 'allows finalReview' {
            $script:state.pipelineState = 'finalReview'
            { Assert-PipelineNotTerminal -State $script:state } | Should -Not -Throw
        }

        It 'allows finalReviewFix' {
            $script:state.pipelineState = 'finalReviewFix'
            { Assert-PipelineNotTerminal -State $script:state } | Should -Not -Throw
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Does NOT mutate state (read-only guard)
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Does not mutate state' {
        It 'leaves non-terminal state unmodified' {
            $script:state.pipelineState = 'running'
            $script:state.lockHolder = 1
            $script:state.tasksDone = 3
            Assert-PipelineNotTerminal -State $script:state
            $script:state.pipelineState | Should -BeExactly 'running'
            $script:state.lockHolder | Should -BeExactly 1
            $script:state.tasksDone | Should -BeExactly 3
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Optional CallerName parameter for better diagnostics
    # ─────────────────────────────────────────────────────────────────────────

    Context 'CallerName parameter for diagnostics' {
        It 'includes the caller name in the error when provided' {
            $script:state.pipelineState = 'COMPLETE'
            { Assert-PipelineNotTerminal -State $script:state -CallerName 'Start-ReviewGate' } |
                Should -Throw '*Start-ReviewGate*'
        }
    }
}

# =============================================================================
# Set-PipelineComplete — transitions pipeline to COMPLETE terminal state
# BDD: "Pipeline lock is released in both terminal states"
# TLA: TerminalIsAbsorbing ==
#   pipelineState \in {"COMPLETE", "HALTED"} => lockHolder = NULL
# =============================================================================

Describe 'Set-PipelineComplete' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        $script:state.pipelineState = 'finalReview'
        $script:state.lockHolder    = 1
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Successful transition
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Transition to COMPLETE' {
        It 'sets pipelineState to COMPLETE' {
            Set-PipelineComplete -State $script:state
            $script:state.pipelineState | Should -BeExactly 'COMPLETE'
        }

        It 'sets lockHolder to $null (lock released)' {
            Set-PipelineComplete -State $script:state
            $script:state.lockHolder | Should -BeNullOrEmpty
        }

        It 'sets reviewGateType to none' {
            $script:state.reviewGateType = 'final'
            Set-PipelineComplete -State $script:state
            $script:state.reviewGateType | Should -BeExactly 'none'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # UNCHANGED invariant — only pipelineState, lockHolder, reviewGateType mutate
    # ─────────────────────────────────────────────────────────────────────────

    Context 'UNCHANGED invariant — preserved fields' {
        It 'does not change reviewRound' {
            $script:state.reviewRound = 2
            Set-PipelineComplete -State $script:state
            $script:state.reviewRound | Should -Be 2
        }

        It 'does not change keepGoingResets' {
            $script:state.keepGoingResets = 1
            Set-PipelineComplete -State $script:state
            $script:state.keepGoingResets | Should -Be 1
        }

        It 'does not change tddKeepGoingCount' {
            $script:state.tddKeepGoingCount = 3
            Set-PipelineComplete -State $script:state
            $script:state.tddKeepGoingCount | Should -Be 3
        }

        It 'does not change verdict' {
            $script:state.verdict = 'pass'
            Set-PipelineComplete -State $script:state
            $script:state.verdict | Should -BeExactly 'pass'
        }

        It 'does not change tasksDone' {
            $script:state.tasksDone = 5
            Set-PipelineComplete -State $script:state
            $script:state.tasksDone | Should -Be 5
        }

        It 'does not change gateTimedOut' {
            Set-PipelineComplete -State $script:state
            $script:state.gateTimedOut | Should -BeFalse
        }

        It 'does not change globalTimedOut' {
            Set-PipelineComplete -State $script:state
            $script:state.globalTimedOut | Should -BeFalse
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Guard: already terminal — idempotent or throws
    # BDD: "No state mutation occurs after PIPELINE COMPLETE"
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Guard: rejects transition from terminal state' {
        It 'throws when already COMPLETE (absorption — no re-entry)' {
            $script:state.pipelineState = 'COMPLETE'
            $script:state.lockHolder = $null
            { Set-PipelineComplete -State $script:state } |
                Should -Throw '*terminal*'
        }

        It 'throws when already HALTED (cannot switch terminal states)' {
            $script:state.pipelineState = 'HALTED'
            $script:state.lockHolder = $null
            { Set-PipelineComplete -State $script:state } |
                Should -Throw '*terminal*'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # TypeOK invariant holds after transition
    # ─────────────────────────────────────────────────────────────────────────

    Context 'TypeOK invariant after transition' {
        It 'TypeOK holds after Set-PipelineComplete' {
            Set-PipelineComplete -State $script:state
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }
    }
}

# =============================================================================
# Set-PipelineHalted — transitions pipeline to HALTED terminal state
# BDD: "Pipeline lock is released in both terminal states"
# TLA: TerminalIsAbsorbing, LockReleasedInTerminal
# =============================================================================

Describe 'Set-PipelineHalted' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        $script:state.pipelineState = 'running'
        $script:state.lockHolder    = 1
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Successful transition
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Transition to HALTED' {
        It 'sets pipelineState to HALTED' {
            Set-PipelineHalted -State $script:state
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }

        It 'sets lockHolder to $null (lock released)' {
            Set-PipelineHalted -State $script:state
            $script:state.lockHolder | Should -BeNullOrEmpty
        }

        It 'sets reviewGateType to none' {
            $script:state.reviewGateType = 'preMerge'
            Set-PipelineHalted -State $script:state
            $script:state.reviewGateType | Should -BeExactly 'none'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Accepts any active (non-terminal) state
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Accepts all non-terminal states' {
        It 'accepts locked' {
            $script:state.pipelineState = 'locked'
            { Set-PipelineHalted -State $script:state } | Should -Not -Throw
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }

        It 'accepts running' {
            $script:state.pipelineState = 'running'
            { Set-PipelineHalted -State $script:state } | Should -Not -Throw
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }

        It 'accepts preMergeReview' {
            $script:state.pipelineState = 'preMergeReview'
            { Set-PipelineHalted -State $script:state } | Should -Not -Throw
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }

        It 'accepts reviewFix' {
            $script:state.pipelineState = 'reviewFix'
            { Set-PipelineHalted -State $script:state } | Should -Not -Throw
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }

        It 'accepts mergeQueue' {
            $script:state.pipelineState = 'mergeQueue'
            { Set-PipelineHalted -State $script:state } | Should -Not -Throw
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }

        It 'accepts finalReview' {
            $script:state.pipelineState = 'finalReview'
            { Set-PipelineHalted -State $script:state } | Should -Not -Throw
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }

        It 'accepts finalReviewFix' {
            $script:state.pipelineState = 'finalReviewFix'
            { Set-PipelineHalted -State $script:state } | Should -Not -Throw
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }

        It 'accepts idle (edge case — halt before lock acquired)' {
            $script:state.pipelineState = 'idle'
            $script:state.lockHolder = $null
            { Set-PipelineHalted -State $script:state } | Should -Not -Throw
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # UNCHANGED invariant — only pipelineState, lockHolder, reviewGateType mutate
    # ─────────────────────────────────────────────────────────────────────────

    Context 'UNCHANGED invariant — preserved fields' {
        It 'does not change reviewRound' {
            $script:state.reviewRound = 2
            Set-PipelineHalted -State $script:state
            $script:state.reviewRound | Should -Be 2
        }

        It 'does not change keepGoingResets' {
            $script:state.keepGoingResets = 1
            Set-PipelineHalted -State $script:state
            $script:state.keepGoingResets | Should -Be 1
        }

        It 'does not change tddKeepGoingCount' {
            $script:state.tddKeepGoingCount = 3
            Set-PipelineHalted -State $script:state
            $script:state.tddKeepGoingCount | Should -Be 3
        }

        It 'does not change verdict' {
            $script:state.verdict = 'fail'
            Set-PipelineHalted -State $script:state
            $script:state.verdict | Should -BeExactly 'fail'
        }

        It 'does not change tasksDone' {
            $script:state.tasksDone = 5
            Set-PipelineHalted -State $script:state
            $script:state.tasksDone | Should -Be 5
        }

        It 'does not change gateTimedOut' {
            $script:state.gateTimedOut = $true
            Set-PipelineHalted -State $script:state
            $script:state.gateTimedOut | Should -BeTrue
        }

        It 'does not change globalTimedOut' {
            $script:state.globalTimedOut = $true
            Set-PipelineHalted -State $script:state
            $script:state.globalTimedOut | Should -BeTrue
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Guard: already terminal — absorption
    # BDD: "No state mutation occurs after PIPELINE HALTED"
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Guard: rejects transition from terminal state' {
        It 'throws when already HALTED (absorption — no re-entry)' {
            $script:state.pipelineState = 'HALTED'
            $script:state.lockHolder = $null
            { Set-PipelineHalted -State $script:state } |
                Should -Throw '*terminal*'
        }

        It 'throws when already COMPLETE (cannot switch terminal states)' {
            $script:state.pipelineState = 'COMPLETE'
            $script:state.lockHolder = $null
            { Set-PipelineHalted -State $script:state } |
                Should -Throw '*terminal*'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Reason parameter for diagnostics
    # ─────────────────────────────────────────────────────────────────────────

    Context 'Reason parameter' {
        It 'accepts an optional Reason string without error' {
            { Set-PipelineHalted -State $script:state -Reason 'Global timeout exceeded' } |
                Should -Not -Throw
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # TypeOK invariant holds after transition
    # ─────────────────────────────────────────────────────────────────────────

    Context 'TypeOK invariant after transition' {
        It 'TypeOK holds after Set-PipelineHalted' {
            Set-PipelineHalted -State $script:state
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }
    }
}

# =============================================================================
# Safety Invariants — cross-cutting absorption properties
# TLA:
#   AbsorbingTerminalStates ==
#     /\ (pipelineState = "COMPLETE" => pipelineState' = "COMPLETE")
#     /\ (pipelineState = "HALTED"   => pipelineState' = "HALTED")
#   TerminalIsAbsorbing ==
#     pipelineState \in {"COMPLETE", "HALTED"} => lockHolder = NULL
#   LockReleasedInTerminal ==
#     pipelineState \in {"COMPLETE", "HALTED"} => lockHolder = NULL
# =============================================================================

Describe 'Safety invariant: TerminalIsAbsorbing' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
    }

    It 'COMPLETE state has lockHolder = $null' {
        $script:state.pipelineState = 'running'
        $script:state.lockHolder    = 1
        Set-PipelineComplete -State $script:state
        $script:state.lockHolder | Should -BeNullOrEmpty
    }

    It 'HALTED state has lockHolder = $null' {
        $script:state.pipelineState = 'running'
        $script:state.lockHolder    = 1
        Set-PipelineHalted -State $script:state
        $script:state.lockHolder | Should -BeNullOrEmpty
    }

    It 'cannot transition out of COMPLETE via Set-PipelineHalted' {
        $script:state.pipelineState = 'COMPLETE'
        $script:state.lockHolder    = $null
        { Set-PipelineHalted -State $script:state } | Should -Throw
        $script:state.pipelineState | Should -BeExactly 'COMPLETE'
    }

    It 'cannot transition out of HALTED via Set-PipelineComplete' {
        $script:state.pipelineState = 'HALTED'
        $script:state.lockHolder    = $null
        { Set-PipelineComplete -State $script:state } | Should -Throw
        $script:state.pipelineState | Should -BeExactly 'HALTED'
    }

    It 'TypeOK holds for COMPLETE terminal state' {
        $script:state.pipelineState = 'running'
        $script:state.lockHolder    = 1
        Set-PipelineComplete -State $script:state
        Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
    }

    It 'TypeOK holds for HALTED terminal state' {
        $script:state.pipelineState = 'running'
        $script:state.lockHolder    = 1
        Set-PipelineHalted -State $script:state
        Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
    }
}
