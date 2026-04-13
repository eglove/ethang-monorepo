BeforeAll {
    # Stub external dependencies before sourcing
    function Invoke-Claude { }
    function Write-PipelineLog { }
    function Read-Escalation { }
    function Write-StatusNote { }
    function ConvertTo-EscalationResult { param($Props) return $Props }

    . "$PSScriptRoot/helpers/test-config.ps1"
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
            reviewGateType     = 'none'
        }
    }
    function global:Test-PipelineStateTypeOK { param($State, $Config) return $true }
    . "$PSScriptRoot/../utils/review-verdict.ps1"
    . "$PSScriptRoot/../utils/review-gate.ps1"
}

# =============================================================================
# Invoke-ReviewEscalation — Keep Going and Stop escalation choices
# BDD: "Keep Going on review escalation resets review round counter"
#      "Stop on review escalation halts pipeline with pre-stop snapshot"
# =============================================================================

Describe 'Invoke-ReviewEscalation' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        # Pre-condition: pipeline in preMergeReview
        $script:state.pipelineState  = 'preMergeReview'
        $script:state.lockHolder     = 1
        $script:state.reviewGateType = 'preMerge'
        $script:state.reviewRound    = 3
        $script:state.keepGoingResets = 0
        $script:state.verdict        = $null

        Mock Write-PipelineLog {}
    }

    # =========================================================================
    # BDD: "Read-Escalation is called"
    # =========================================================================

    Context 'Calls Read-Escalation' {
        It 'calls Read-Escalation' {
            Mock Read-Escalation { return @{ Decision = 'Stop' } }
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            Should -Invoke Read-Escalation -Times 1 -Exactly
        }

        It 'passes review context to Read-Escalation' {
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

    Context 'Keep Going — resets review round counter' {
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

    Context 'Stop — halts pipeline' {
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
    # BDD: "Keep Going increments the meta-counter"
    # =========================================================================

    Context 'Keep Going — keepGoingResets accumulation' {
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

        It 'allows Keep Going when keepGoingResets is high (no limit)' {
            $script:state.keepGoingResets = 10
            Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            $script:state.keepGoingResets | Should -BeExactly 11
            $script:state.reviewRound | Should -BeExactly 0
        }
    }

    # =========================================================================
    # BDD: works for both preMergeReview and finalReview gates
    # =========================================================================

    Context 'Works for finalReview gate type' {
        BeforeEach {
            $script:state.pipelineState  = 'finalReview'
            $script:state.reviewGateType = 'final'
            $script:state.reviewRound    = 3
        }

        It 'calls Read-Escalation for finalReview' {
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
        It 'throws a guard error when pipelineState is not a review state' {
            $script:state.pipelineState = 'running'
            $threw = $false
            try {
                Invoke-ReviewEscalation -State $script:state -Config $script:cfg
            }
            catch [System.Management.Automation.CommandNotFoundException] {
                throw "Invoke-ReviewEscalation is not defined"
            }
            catch {
                $threw = $true
                $_.Exception.Message | Should -Match 'review'
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
    }
}

# =============================================================================
# Mixed scenario — BDD: "Mixed retry-review and fix-cycle rounds share the
# same counter" leading to escalation
# =============================================================================

Describe 'Invoke-ReviewEscalation — mixed round scenario' {
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

    It 'Keep Going after escalation allows further review rounds' {
        Mock Read-Escalation { return @{ Decision = 'KeepGoing' } }

        # Drive reviewRound to 3
        $script:state.reviewRound = 3

        Invoke-ReviewEscalation -State $script:state -Config $script:cfg

        # After Keep Going, reviewRound is reset — retry should work again
        $script:state.reviewRound | Should -BeExactly 0
        Resolve-PreMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
        $script:state.reviewRound | Should -BeExactly 1
    }

    Context 'DB sync via Update-PipelineState' {
        BeforeAll {
            function global:Update-PipelineState { param($FeatureName, $PipelineState, $ReviewRound, $KeepGoingResets, $Verdict, $TddKeepGoingCount, $LockHolder, $FeatureStatus) }
        }
        AfterAll { Remove-Item Function:\Update-PipelineState -ErrorAction SilentlyContinue }

        It 'syncs KeepGoing to DB when FeatureName provided' {
            Mock Read-Escalation { return @{ Decision = 'KeepGoing' } }
            Mock Update-PipelineState {}
            $script:state.pipelineState = 'preMergeReview'
            $script:state.reviewRound = 3

            Invoke-ReviewEscalation -State $script:state -Config $script:cfg -FeatureName 'feat-3'
            Should -Invoke Update-PipelineState -Times 1 -ParameterFilter {
                $FeatureName -eq 'feat-3' -and $ReviewRound -eq 0
            }
        }

        It 'syncs Stop to DB when FeatureName provided' {
            Mock Read-Escalation { return @{ Decision = 'Stop' } }
            Mock Update-PipelineState {}
            $script:state.pipelineState = 'preMergeReview'

            Invoke-ReviewEscalation -State $script:state -Config $script:cfg -FeatureName 'feat-3'
            Should -Invoke Update-PipelineState -Times 1 -ParameterFilter {
                $FeatureName -eq 'feat-3' -and $PipelineState -eq 'HALTED'
            }
        }
    }
}
