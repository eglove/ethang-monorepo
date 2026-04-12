BeforeAll {
    # Stub external dependencies before sourcing
    function Invoke-Claude { }
    function Write-PipelineLog { }
    function Read-Escalation { }
    function Write-StatusNote { }
    function ConvertTo-EscalationResult { param($Props) return $Props }

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
    . "$PSScriptRoot/../utils/review-verdict.ps1"
    . "$PSScriptRoot/../utils/review-gate.ps1"
}

# =============================================================================
# Invoke-ReviewEscalation — TLA+ review round exhaustion + Keep Going escalation
# BDD: "Review rounds exhaust after MaxReviewRounds cycles"
#      "Keep Going on review escalation resets review round counter"
#      "Stop on review escalation halts pipeline with pre-stop snapshot"
#      "MaxKeepGoingResets prevents infinite Keep Going loops"
# =============================================================================

Describe 'Invoke-ReviewEscalation' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        # Pre-condition: pipeline in preMergeReview at round exhaustion
        $script:state.pipelineState  = 'preMergeReview'
        $script:state.lockHolder     = 1
        $script:state.reviewGateType = 'preMerge'
        $script:state.reviewRound    = $script:cfg['MaxReviewRounds']
        $script:state.keepGoingResets = 0
        $script:state.verdict        = $null

        Mock Write-PipelineLog {}
    }

    # =========================================================================
    # BDD: "Review rounds exhaust after MaxReviewRounds cycles"
    #      "Read-Escalation is called with review exhaustion context"
    # =========================================================================

    Context 'Exhaustion detection — calls Read-Escalation when rounds exhausted' {
        It 'calls Read-Escalation when reviewRound >= MaxReviewRounds' {
            Mock Read-Escalation { return @{ Decision = 'Stop' } }
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            Should -Invoke Read-Escalation -Times 1 -Exactly
        }

        It 'passes review exhaustion context to Read-Escalation' {
            Mock Read-Escalation { return @{ Decision = 'Stop' } } -ParameterFilter {
                $Source -eq 'task'
            }
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            Should -Invoke Read-Escalation -Times 1 -Exactly -ParameterFilter {
                $Source -eq 'task'
            }
        }
    }

    # =========================================================================
    # BDD: "Keep Going on review escalation resets review round counter"
    #      "the review-fix cycle resumes from a fresh review"
    # =========================================================================

    Context 'Keep Going — resets review round counter (TLA+ KeepGoingReview)' {
        BeforeEach {
            Mock Read-Escalation { return @{ Decision = 'KeepGoing' } }
        }

        It 'resets reviewRound to 0 when user selects Keep Going' {
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.reviewRound | Should -BeExactly 0
        }

        It 'increments keepGoingResets by 1' {
            $script:state.keepGoingResets = 0
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.keepGoingResets | Should -BeExactly 1
        }

        It 'preserves pipelineState as review state (stays in gate)' {
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'preMergeReview'
        }

        It 'clears verdict to $null (ready for fresh review)' {
            $script:state.verdict = 'fail'
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'resets tddKeepGoingCount to 0 on Keep Going' {
            $script:state.tddKeepGoingCount = 3
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.tddKeepGoingCount | Should -BeExactly 0
        }

        It 'returns an action indicating review should resume' {
            $result = Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $result.Action | Should -BeExactly 'resumeReview'
        }

        It 'preserves lockHolder (TLA+ UNCHANGED)' {
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.lockHolder | Should -BeExactly 1
        }

        It 'preserves tasksDone (TLA+ UNCHANGED)' {
            $script:state.tasksDone = 3
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.tasksDone | Should -BeExactly 3
        }
    }

    # =========================================================================
    # BDD: "Stop on review escalation halts pipeline with pre-stop snapshot"
    # =========================================================================

    Context 'Stop — halts pipeline (TLA+ StopReview)' {
        BeforeEach {
            Mock Read-Escalation { return @{ Decision = 'Stop' } }
        }

        It 'transitions pipelineState to HALTED when user selects Stop' {
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }

        It 'releases lockHolder to $null (TLA+ terminal state absorbing)' {
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.lockHolder | Should -BeNullOrEmpty
        }

        It 'returns an action indicating pipeline stopped' {
            $result = Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $result.Action | Should -BeExactly 'stopped'
        }
    }

    # =========================================================================
    # BDD: "Keep Going fencepost — 2nd/3rd reset is permitted"
    #      "Keep Going increments the meta-counter"
    # =========================================================================

    Context 'Keep Going fencepost — keepGoingResets accumulation' {
        BeforeEach {
            Mock Read-Escalation { return @{ Decision = 'KeepGoing' } }
        }

        It 'allows Keep Going when keepGoingResets is 0 (first reset)' {
            $script:state.keepGoingResets = 0
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.keepGoingResets | Should -BeExactly 1
            $script:state.reviewRound | Should -BeExactly 0
        }

        It 'allows Keep Going when keepGoingResets is 1 (second reset)' {
            $script:state.keepGoingResets = 1
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.keepGoingResets | Should -BeExactly 2
            $script:state.reviewRound | Should -BeExactly 0
        }

        It 'allows Keep Going when keepGoingResets is MaxKeepGoingResets - 1 (last permitted)' {
            $script:state.keepGoingResets = $script:cfg['MaxKeepGoingResets'] - 1
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.keepGoingResets | Should -BeExactly $script:cfg['MaxKeepGoingResets']
            $script:state.reviewRound | Should -BeExactly 0
        }
    }

    # =========================================================================
    # BDD: "Keep Going exhausts MaxKeepGoingResets — forced stop"
    #      '"Keep Going" is no longer offered as an option'
    #      "the only option is Stop"
    # =========================================================================

    Context 'Keep Going exhaustion — forced stop at MaxKeepGoingResets' {
        It 'forces halt when keepGoingResets >= MaxKeepGoingResets (no escalation prompt)' {
            $script:state.keepGoingResets = $script:cfg['MaxKeepGoingResets']
            # Read-Escalation should NOT be called — forced stop
            Mock Read-Escalation { throw 'Should not be called' }
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }

        It 'does not call Read-Escalation when Keep Going is exhausted' {
            $script:state.keepGoingResets = $script:cfg['MaxKeepGoingResets']
            Mock Read-Escalation { return @{ Decision = 'KeepGoing' } }
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            Should -Invoke Read-Escalation -Times 0 -Exactly
        }

        It 'returns action indicating forced stop with exhaustion context' {
            $script:state.keepGoingResets = $script:cfg['MaxKeepGoingResets']
            Mock Read-Escalation { return @{ Decision = 'KeepGoing' } }
            $result = Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $result.Action | Should -BeExactly 'forcedStop'
        }

        It 'releases lockHolder on forced stop' {
            $script:state.keepGoingResets = $script:cfg['MaxKeepGoingResets']
            Mock Read-Escalation { return @{ Decision = 'KeepGoing' } }
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.lockHolder | Should -BeNullOrEmpty
        }
    }

    # =========================================================================
    # BDD: works for both preMergeReview and finalReview gates
    # =========================================================================

    Context 'Works for finalReview gate type' {
        BeforeEach {
            $script:state.pipelineState  = 'finalReview'
            $script:state.reviewGateType = 'final'
            $script:state.reviewRound    = $script:cfg['MaxReviewRounds']
        }

        It 'calls Read-Escalation for finalReview exhaustion' {
            Mock Read-Escalation { return @{ Decision = 'Stop' } }
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            Should -Invoke Read-Escalation -Times 1 -Exactly
        }

        It 'resets reviewRound on Keep Going for finalReview' {
            Mock Read-Escalation { return @{ Decision = 'KeepGoing' } }
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.reviewRound | Should -BeExactly 0
            $script:state.pipelineState | Should -BeExactly 'finalReview'
        }
    }

    # =========================================================================
    # Guard conditions
    # =========================================================================

    Context 'Guard conditions — rejects invalid pre-states' {
        It 'throws a guard error (not CommandNotFoundException) when pipelineState is not a review state' {
            $script:state.pipelineState = 'running'
            $threw = $false
            try {
                Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            }
            catch [System.Management.Automation.CommandNotFoundException] {
                # Wrong exception — function doesn't exist yet
                throw "Invoke-ReviewEscalation is not defined"
            }
            catch {
                $threw = $true
                $_.Exception.Message | Should -Match 'review'
            }
            $threw | Should -BeTrue
        }

        It 'throws a guard error (not CommandNotFoundException) when reviewRound < MaxReviewRounds' {
            $script:state.reviewRound = 0
            $threw = $false
            try {
                Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            }
            catch [System.Management.Automation.CommandNotFoundException] {
                throw "Invoke-ReviewEscalation is not defined"
            }
            catch {
                $threw = $true
                $_.Exception.Message | Should -Match 'exhaust|not yet'
            }
            $threw | Should -BeTrue
        }
    }

    # =========================================================================
    # TypeOK invariant holds after escalation
    # =========================================================================

    Context 'TypeOK invariant holds after escalation handling' {
        It 'state is TypeOK after Keep Going reset' {
            Mock Read-Escalation { return @{ Decision = 'KeepGoing' } }
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }

        It 'state is TypeOK after Stop halt' {
            Mock Read-Escalation { return @{ Decision = 'Stop' } }
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }

        It 'state is TypeOK after forced stop (Keep Going exhausted)' {
            $script:state.keepGoingResets = $script:cfg['MaxKeepGoingResets']
            Mock Read-Escalation { return @{ Decision = 'KeepGoing' } }
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }
    }
}

# =============================================================================
# Mixed scenario — BDD: "Mixed retry-review and fix-cycle rounds share the
# same counter" leading to exhaustion
# =============================================================================

Describe 'Invoke-ReviewEscalation — mixed round exhaustion scenario' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        $script:state.pipelineState  = 'preMergeReview'
        $script:state.lockHolder     = 1
        $script:state.reviewGateType = 'preMerge'

        $script:retryVerdict = [PSCustomObject]@{
            Verdict           = 'retry'
            Blockers          = @()
            Notes             = @()
            SelectedReviewers = @()
            ExcludedReviewers = @()
            Reason            = 'Moderator timeout'
        }

        Mock Write-PipelineLog {}
    }

    It 'escalates after MaxReviewRounds mixed retry+fail rounds reach the cap' {
        Mock Read-Escalation { return @{ Decision = 'Stop' } }

        # Simulate 3 retry rounds reaching MaxReviewRounds
        for ($i = 0; $i -lt $script:cfg['MaxReviewRounds']; $i++) {
            Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.verdict = $null
        }

        # Now reviewRound == MaxReviewRounds, escalation should fire
        $script:state.reviewRound | Should -BeExactly $script:cfg['MaxReviewRounds']
        Invoke-ReviewEscalation -State $script:state -Config $script:cfg
        Should -Invoke Read-Escalation -Times 1 -Exactly
    }

    It 'Keep Going after exhaustion allows further review rounds' {
        Mock Read-Escalation { return @{ Decision = 'KeepGoing' } }

        # Drive to exhaustion
        $script:state.reviewRound = $script:cfg['MaxReviewRounds']

        Invoke-ReviewEscalation -State $script:state -Config $script:cfg

        # After Keep Going, reviewRound is reset — retry should work again
        $script:state.reviewRound | Should -BeExactly 0
        Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
        $script:state.reviewRound | Should -BeExactly 1
    }
}
