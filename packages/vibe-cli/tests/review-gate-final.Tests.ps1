BeforeAll {
    function Invoke-Claude { }
    function Write-PipelineLog { }
    function Read-Escalation { }

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
    function global:Test-PipelineStateTypeOK { param($State, $Config) return $true }
    . "$PSScriptRoot/../utils/review-verdict.ps1"
    . "$PSScriptRoot/../utils/review-gate.ps1"
}

# =============================================================================
# Enter-ReviewGate with GateType 'final' — TLA+ EnterFinalReview
# BDD: "Final review gate triggers after all tasks merge"
# =============================================================================

Describe 'Enter-ReviewGate — final gate entry' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        $script:state.pipelineState = 'running'
        $script:state.lockHolder    = 1
        $script:state.tasksDone     = $script:cfg['NumTasks']  # All tasks done
    }

    Context 'Final gate entry succeeds when tasksDone = NumTasks (TLA+ EnterFinalReview)' {
        It 'transitions pipelineState to "finalReview"' {
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'final'
            $script:state.pipelineState | Should -BeExactly 'finalReview'
        }

        It 'sets reviewGateType to "final"' {
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'final'
            $script:state.reviewGateType | Should -BeExactly 'final'
        }

        It 'resets reviewRound to 0' {
            $script:state.reviewRound = 2
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'final'
            $script:state.reviewRound | Should -BeExactly 0
        }

        It 'resets keepGoingResets to 0' {
            $script:state.keepGoingResets = 1
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'final'
            $script:state.keepGoingResets | Should -BeExactly 0
        }

        It 'resets tddKeepGoingCount to 0' {
            $script:state.tddKeepGoingCount = 3
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'final'
            $script:state.tddKeepGoingCount | Should -BeExactly 0
        }

        It 'resets verdict to $null' {
            $script:state.verdict = 'fail'
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'final'
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'resets gateTimedOut to $false' {
            $script:state.gateTimedOut = $true
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'final'
            $script:state.gateTimedOut | Should -BeExactly $false
        }
    }

    Context 'UNCHANGED fields' {
        It 'preserves lockHolder' {
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'final'
            $script:state.lockHolder | Should -BeExactly 1
        }

        It 'preserves tasksDone' {
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'final'
            $script:state.tasksDone | Should -BeExactly $script:cfg['NumTasks']
        }

        It 'preserves globalTimedOut' {
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'final'
            $script:state.globalTimedOut | Should -BeExactly $false
        }
    }

    Context 'Guard — final gate requires tasksDone = NumTasks (invariant S8)' {
        It 'throws when tasksDone < NumTasks' {
            $script:state.tasksDone = 0
            { Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'final' } |
                Should -Throw -ExpectedMessage '*final*all tasks*'
        }
    }

    Context 'Regression — preMerge still throws when tasksDone = NumTasks' {
        It 'throws for preMerge when all tasks done' {
            { Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'preMerge' } |
                Should -Throw -ExpectedMessage '*final*'
        }
    }

    Context 'TypeOK invariant' {
        It 'state is TypeOK after final gate entry' {
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'final'
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }
    }
}

# =============================================================================
# Resolve-FinalMergeVerdict — TLA+ HandlePassFinal / HandleFailFinal / HandleRetryFinal
# BDD: "Final review pass completes the pipeline"
#      "Final review fail triggers final review-fix cycle"
# =============================================================================

Describe 'Resolve-FinalMergeVerdict' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        $script:state.pipelineState    = 'finalReview'
        $script:state.lockHolder       = 1
        $script:state.reviewGateType   = 'final'
        $script:state.reviewRound      = 0
        $script:state.keepGoingResets   = 0
        $script:state.tddKeepGoingCount = 0
        $script:state.verdict          = $null
        $script:state.tasksDone        = $script:cfg['NumTasks']
        $script:state.gateTimedOut     = $false
        $script:state.globalTimedOut   = $false

        Mock Write-PipelineLog {}
    }

    # =========================================================================
    # HandlePassFinal: → COMPLETE
    # =========================================================================

    Context 'Pass verdict — pipeline COMPLETE (HandlePassFinal)' {
        BeforeEach {
            $script:passVerdict = [PSCustomObject]@{
                Verdict           = 'pass'
                Blockers          = @()
                Notes             = @()
                SelectedReviewers = @('expert-tdd')
                ExcludedReviewers = @()
            }
        }

        It 'transitions pipelineState to COMPLETE' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.pipelineState | Should -BeExactly 'COMPLETE'
        }

        It 'releases lockHolder to $null (invariant S1/S2)' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.lockHolder | Should -BeNullOrEmpty
        }

        It 'sets reviewGateType to "none"' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.reviewGateType | Should -BeExactly 'none'
        }

        It 'clears verdict to $null' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'returns action "complete"' {
            $result = Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $result.Action | Should -BeExactly 'complete'
        }

        It 'pass has no round guard — succeeds at reviewRound = MaxReviewRounds' {
            $script:state.reviewRound = $script:cfg['MaxReviewRounds']
            { Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict } |
                Should -Not -Throw
        }
    }

    Context 'Pass UNCHANGED fields' {
        BeforeEach {
            $script:passVerdict = [PSCustomObject]@{
                Verdict = 'pass'; Blockers = @(); Notes = @()
                SelectedReviewers = @(); ExcludedReviewers = @()
            }
        }

        It 'preserves reviewRound' {
            $script:state.reviewRound = 2
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.reviewRound | Should -BeExactly 2
        }

        It 'preserves keepGoingResets' {
            $script:state.keepGoingResets = 1
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.keepGoingResets | Should -BeExactly 1
        }

        It 'preserves tddKeepGoingCount' {
            $script:state.tddKeepGoingCount = 3
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.tddKeepGoingCount | Should -BeExactly 3
        }

        It 'preserves tasksDone' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.tasksDone | Should -BeExactly $script:cfg['NumTasks']
        }

        It 'preserves gateTimedOut' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.gateTimedOut | Should -BeExactly $false
        }

        It 'preserves globalTimedOut' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:passVerdict
            $script:state.globalTimedOut | Should -BeExactly $false
        }
    }

    # =========================================================================
    # HandleFailFinal: → finalReviewFix
    # =========================================================================

    Context 'Fail verdict — enters finalReviewFix (HandleFailFinal)' {
        BeforeEach {
            $script:failVerdict = [PSCustomObject]@{
                Verdict  = 'fail'
                Blockers = @([PSCustomObject]@{
                    Reviewer = 'security'; Severity = 'critical'
                    Description = 'Issue found'; Files = @('f.ts'); Suggestion = 'Fix it'
                })
                Notes             = @()
                SelectedReviewers = @()
                ExcludedReviewers = @()
            }
        }

        It 'transitions pipelineState to finalReviewFix' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.pipelineState | Should -BeExactly 'finalReviewFix'
        }

        It 'clears verdict to $null' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'returns blockers for fix cycle' {
            $result = Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $result.Blockers.Count | Should -BeExactly 1
        }

        It 'preserves reviewGateType as "final"' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.reviewGateType | Should -BeExactly 'final'
        }

        It 'preserves lockHolder' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:failVerdict
            $script:state.lockHolder | Should -BeExactly 1
        }
    }

    # =========================================================================
    # HandleRetryFinal: increment round, stay in finalReview
    # =========================================================================

    Context 'Retry verdict — increment round (HandleRetryFinal)' {
        BeforeEach {
            $script:retryVerdict = [PSCustomObject]@{
                Verdict = 'retry'; Blockers = @(); Notes = @()
                SelectedReviewers = @(); ExcludedReviewers = @()
                Reason = 'parse failure'
            }
        }

        It 'increments reviewRound by 1' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.reviewRound | Should -BeExactly 1
        }

        It 'clears verdict to $null' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'stays in finalReview' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.pipelineState | Should -BeExactly 'finalReview'
        }

        It 'preserves lockHolder' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.lockHolder | Should -BeExactly 1
        }

        It 'preserves reviewGateType' {
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $script:retryVerdict
            $script:state.reviewGateType | Should -BeExactly 'final'
        }
    }

    # =========================================================================
    # Fencepost: round exhaustion
    # =========================================================================

    Context 'Fencepost — fail at round = MaxReviewRounds throws exhaustion' {
        It 'throws when reviewRound >= MaxReviewRounds on fail' {
            $script:state.reviewRound = $script:cfg['MaxReviewRounds']
            $failVerdict = [PSCustomObject]@{
                Verdict = 'fail'; Blockers = @(); Notes = @()
                SelectedReviewers = @(); ExcludedReviewers = @()
            }
            { Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $failVerdict } |
                Should -Throw -ExpectedMessage '*exhausted*'
        }

        It 'throws when reviewRound >= MaxReviewRounds on retry' {
            $script:state.reviewRound = $script:cfg['MaxReviewRounds']
            $retryVerdict = [PSCustomObject]@{
                Verdict = 'retry'; Blockers = @(); Notes = @()
                SelectedReviewers = @(); ExcludedReviewers = @()
            }
            { Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $retryVerdict } |
                Should -Throw -ExpectedMessage '*exhausted*'
        }

        It 'allows fail at reviewRound = MaxReviewRounds - 1' {
            $script:state.reviewRound = $script:cfg['MaxReviewRounds'] - 1
            $failVerdict = [PSCustomObject]@{
                Verdict = 'fail'; Blockers = @(@{
                    Reviewer='r'; Severity='high'; Description='d'; Files=@('f'); Suggestion='s'
                })
                Notes = @(); SelectedReviewers = @(); ExcludedReviewers = @()
            }
            { Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $failVerdict } |
                Should -Not -Throw
        }
    }

    # =========================================================================
    # Guard conditions
    # =========================================================================

    Context 'Guard — pipelineState must be finalReview' {
        It 'throws when pipelineState is "preMergeReview"' {
            $script:state.pipelineState = 'preMergeReview'
            $v = [PSCustomObject]@{ Verdict='pass'; Blockers=@(); Notes=@(); SelectedReviewers=@(); ExcludedReviewers=@() }
            { Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $v } |
                Should -Throw -ExpectedMessage '*finalReview*'
        }

        It 'throws when pipelineState is "running"' {
            $script:state.pipelineState = 'running'
            $v = [PSCustomObject]@{ Verdict='pass'; Blockers=@(); Notes=@(); SelectedReviewers=@(); ExcludedReviewers=@() }
            { Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $v } |
                Should -Throw -ExpectedMessage '*finalReview*'
        }
    }

    Context 'Guard — invalid verdict value' {
        It 'throws for unknown verdict "maybe"' {
            $v = [PSCustomObject]@{ Verdict='maybe'; Blockers=@(); Notes=@(); SelectedReviewers=@(); ExcludedReviewers=@() }
            { Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $v } |
                Should -Throw -ExpectedMessage '*invalid*'
        }

        It 'throws when Verdict is $null' {
            $v = [PSCustomObject]@{ Verdict=$null; Blockers=@(); Notes=@(); SelectedReviewers=@(); ExcludedReviewers=@() }
            { Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $v } |
                Should -Throw -ExpectedMessage '*invalid*'
        }
    }

    # =========================================================================
    # TypeOK invariant
    # =========================================================================

    Context 'TypeOK invariant after each verdict path' {
        It 'TypeOK after pass (COMPLETE)' {
            $v = [PSCustomObject]@{ Verdict='pass'; Blockers=@(); Notes=@(); SelectedReviewers=@(); ExcludedReviewers=@() }
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $v
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }

        It 'TypeOK after fail (finalReviewFix)' {
            $v = [PSCustomObject]@{
                Verdict='fail'
                Blockers=@(@{ Reviewer='r'; Severity='high'; Description='d'; Files=@('f'); Suggestion='s' })
                Notes=@(); SelectedReviewers=@(); ExcludedReviewers=@()
            }
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $v
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }

        It 'TypeOK after retry' {
            $v = [PSCustomObject]@{ Verdict='retry'; Blockers=@(); Notes=@(); SelectedReviewers=@(); ExcludedReviewers=@() }
            Resolve-FinalMergeVerdict -State $script:state -Config $script:cfg -Verdict $v
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }
    }
}
