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
# Enter-ReviewGate — TLA+ EnterPreMergeReview state transition
# BDD: "Pre-merge review triggers after cleanup passes"
# TLA: pipelineState' = "preMergeReview", reviewRound' = 0, etc.
# =============================================================================

Describe 'Enter-ReviewGate' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        # Pre-condition: pipeline must be in "running" state with lock held
        $script:state.pipelineState = 'running'
        $script:state.lockHolder    = 1
    }

    Context 'Pre-merge gate entry (TLA+ EnterPreMergeReview)' {
        It 'transitions pipelineState to "preMergeReview"' {
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'preMerge'
            $script:state.pipelineState | Should -BeExactly 'preMergeReview'
        }

        It 'sets reviewGateType to "preMerge"' {
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'preMerge'
            $script:state.reviewGateType | Should -BeExactly 'preMerge'
        }

        It 'resets reviewRound to 0' {
            $script:state.reviewRound = 2
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'preMerge'
            $script:state.reviewRound | Should -BeExactly 0
        }

        It 'resets keepGoingResets to 0' {
            $script:state.keepGoingResets = 1
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'preMerge'
            $script:state.keepGoingResets | Should -BeExactly 0
        }

        It 'resets tddKeepGoingCount to 0' {
            $script:state.tddKeepGoingCount = 3
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'preMerge'
            $script:state.tddKeepGoingCount | Should -BeExactly 0
        }

        It 'resets verdict to $null' {
            $script:state.verdict = 'fail'
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'preMerge'
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'resets gateTimedOut to $false' {
            $script:state.gateTimedOut = $true
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'preMerge'
            $script:state.gateTimedOut | Should -BeExactly $false
        }

        It 'preserves lockHolder (TLA+ UNCHANGED)' {
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'preMerge'
            $script:state.lockHolder | Should -BeExactly 1
        }

        It 'preserves tasksDone (TLA+ UNCHANGED)' {
            # Use env override so tasksDone < NumTasks for preMerge guard
            $env:VIBE_NUM_TASKS = '5'
            try {
                $multiCfg = Get-PipelineConfig
                $script:state.tasksDone = 3
                Enter-ReviewGate -State $script:state -Config $multiCfg -GateType 'preMerge'
                $script:state.tasksDone | Should -BeExactly 3
            }
            finally { Remove-Item Env:\VIBE_NUM_TASKS -ErrorAction SilentlyContinue }
        }

        It 'preserves globalTimedOut (TLA+ UNCHANGED)' {
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'preMerge'
            $script:state.globalTimedOut | Should -BeExactly $false
        }
    }

    Context 'Final review gate entry' {
        It 'transitions pipelineState to "finalReview" for GateType "final"' {
            $script:state.tasksDone = $script:cfg['NumTasks']
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'final'
            $script:state.pipelineState | Should -BeExactly 'finalReview'
        }

        It 'sets reviewGateType to "final"' {
            $script:state.tasksDone = $script:cfg['NumTasks']
            Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'final'
            $script:state.reviewGateType | Should -BeExactly 'final'
        }
    }

    Context 'Guard conditions — invalid pre-states' {
        It 'throws when pipelineState is not "running"' {
            $script:state.pipelineState = 'idle'
            { Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'preMerge' } |
                Should -Throw
        }

        It 'throws when all tasks are done (tasksDone >= NumTasks)' {
            $script:state.tasksDone = $script:cfg['NumTasks']
            { Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'preMerge' } |
                Should -Throw
        }

        It 'throws for invalid GateType value' {
            { Enter-ReviewGate -State $script:state -Config $script:cfg -GateType 'postMerge' } |
                Should -Throw
        }
    }
}

# =============================================================================
# Invoke-ReviewGate — core loop: call moderator, parse, validate, return verdict
# BDD: "Review-moderator dispatches selected reviewers and consolidates findings"
# TLA+ ReviewVerdict: verdict' in {"pass", "fail", "retry"}
# =============================================================================

Describe 'Invoke-ReviewGate' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        $script:state.pipelineState  = 'preMergeReview'
        $script:state.lockHolder     = 1
        $script:state.reviewGateType = 'preMerge'

        $script:validPassResponse = @{
            selectedReviewers = @('security', 'bug')
            excludedReviewers = @(
                @{ reviewer = 'ai-agent'; reason = 'No agent prompts in diff' }
            )
            verdict  = 'pass'
            blockers = @()
            notes    = @()
        } | ConvertTo-Json -Depth 5

        $script:validFailResponse = @{
            selectedReviewers = @('security')
            excludedReviewers = @()
            verdict  = 'fail'
            blockers = @(
                @{
                    reviewer    = 'security'
                    severity    = 'critical'
                    description = 'SQL injection in query builder'
                    files       = @('src/db.ts')
                    suggestion  = 'Use parameterized queries'
                }
            )
            notes = @()
        } | ConvertTo-Json -Depth 5

        Mock Write-PipelineLog {}
    }

    Context 'Happy path — moderator returns valid pass verdict' {
        It 'returns a verdict object with Verdict "pass"' {
            Mock Invoke-Claude { return $script:validPassResponse }
            $result = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff --git a/src/db.ts'
            $result.Verdict | Should -BeExactly 'pass'
        }

        It 'returns verdict with SelectedReviewers populated' {
            Mock Invoke-Claude { return $script:validPassResponse }
            $result = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff content'
            $result.SelectedReviewers | Should -Contain 'security'
            $result.SelectedReviewers | Should -Contain 'bug'
        }

        It 'returns verdict with ExcludedReviewers populated' {
            Mock Invoke-Claude { return $script:validPassResponse }
            $result = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff content'
            $result.ExcludedReviewers.Count | Should -Be 1
            $result.ExcludedReviewers[0].Reviewer | Should -Be 'ai-agent'
        }

        It 'does not modify pipelineState (verdict handling is T6)' {
            Mock Invoke-Claude { return $script:validPassResponse }
            $null = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff content'
            $script:state.pipelineState | Should -BeExactly 'preMergeReview'
        }
    }

    Context 'Happy path — moderator returns valid fail verdict' {
        It 'returns a verdict object with Verdict "fail"' {
            Mock Invoke-Claude { return $script:validFailResponse }
            $result = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff content'
            $result.Verdict | Should -BeExactly 'fail'
        }

        It 'returns blockers from the moderator response' {
            Mock Invoke-Claude { return $script:validFailResponse }
            $result = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff content'
            $result.Blockers.Count | Should -Be 1
            $result.Blockers[0].Severity | Should -Be 'critical'
        }
    }

    Context 'Moderator returns non-JSON (parse failure) — triggers retry verdict' {
        It 'returns a retry verdict when moderator output is not valid JSON' {
            Mock Invoke-Claude { return 'This is not JSON at all' }
            $result = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff content'
            $result.Verdict | Should -BeExactly 'retry'
        }

        It 'logs the parse failure for audit' {
            Mock Invoke-Claude { return 'broken output' }
            $null = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff content'
            Should -Invoke Write-PipelineLog -Times 1 -ParameterFilter {
                $args[0] -match 'parse failure|malformed|not valid JSON' -or
                $Message -match 'parse failure|malformed|not valid JSON'
            }
        }
    }

    Context 'Moderator returns valid JSON with wrong schema (schema violation)' {
        It 'returns a retry verdict when moderator JSON is missing required fields' {
            $badSchema = '{"foo": "bar"}'
            Mock Invoke-Claude { return $badSchema }
            $result = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff content'
            $result.Verdict | Should -BeExactly 'retry'
        }

        It 'returns a retry verdict when moderator JSON has wrong verdict value' {
            $badVerdict = @{
                selectedReviewers = @()
                excludedReviewers = @()
                verdict  = 'maybe'
                blockers = @()
                notes    = @()
            } | ConvertTo-Json -Depth 5
            Mock Invoke-Claude { return $badVerdict }
            $result = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff content'
            $result.Verdict | Should -BeExactly 'retry'
        }
    }

    Context 'Moderator returns empty/null output' {
        It 'returns a retry verdict for empty string output' {
            Mock Invoke-Claude { return '' }
            $result = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff content'
            $result.Verdict | Should -BeExactly 'retry'
        }

        It 'returns a retry verdict for $null output' {
            Mock Invoke-Claude { return $null }
            $result = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff content'
            $result.Verdict | Should -BeExactly 'retry'
        }
    }

    Context 'Guard conditions — TLA+ preconditions for ReviewVerdict' {
        It 'throws when pipelineState is not preMergeReview or finalReview' {
            $script:state.pipelineState = 'running'
            { Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff' } |
                Should -Throw
        }

        It 'throws when verdict is already set (not null)' {
            $script:state.verdict = 'pass'
            { Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff' } |
                Should -Throw
        }

        It 'throws when gateTimedOut is true' {
            $script:state.gateTimedOut = $true
            { Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff' } |
                Should -Throw
        }

        It 'throws when globalTimedOut is true' {
            $script:state.globalTimedOut = $true
            { Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff' } |
                Should -Throw
        }
    }

    Context 'Invoke-Claude is called with the diff content' {
        It 'passes the diff content to Invoke-Claude' {
            Mock Invoke-Claude { return $script:validPassResponse } -Verifiable
            $null = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'my-diff-content'
            Should -InvokeVerifiable
        }

        It 'calls Invoke-Claude exactly once per invocation' {
            Mock Invoke-Claude { return $script:validPassResponse }
            $null = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff'
            Should -Invoke Invoke-Claude -Times 1 -Exactly
        }
    }

    Context 'Works for finalReview gate type (TLA+ ReviewVerdict guard)' {
        It 'accepts pipelineState "finalReview" as valid' {
            $script:state.pipelineState  = 'finalReview'
            $script:state.reviewGateType = 'final'
            Mock Invoke-Claude { return $script:validPassResponse }
            $result = Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent 'diff'
            $result.Verdict | Should -BeExactly 'pass'
        }
    }

    Context 'DiffContent parameter validation' {
        It 'throws when DiffContent is null' {
            Mock Invoke-Claude { return $script:validPassResponse }
            { Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent $null } |
                Should -Throw
        }

        It 'throws when DiffContent is empty string' {
            Mock Invoke-Claude { return $script:validPassResponse }
            { Invoke-ReviewGate -State $script:state -Config $script:cfg -DiffContent '' } |
                Should -Throw
        }
    }
}

# =============================================================================
# New-RetryVerdict — factory for synthetic retry verdict on parse/schema failure
# BDD: "review is treated as a retry-review"
# =============================================================================

Describe 'New-RetryVerdict' {
    It 'returns a verdict object with Verdict "retry"' {
        $result = New-RetryVerdict -Reason 'Moderator returned non-JSON output'
        $result.Verdict | Should -BeExactly 'retry'
    }

    It 'has empty Blockers array' {
        $result = New-RetryVerdict -Reason 'parse failure'
        $result.Blockers.Count | Should -Be 0
    }

    It 'has empty Notes array' {
        $result = New-RetryVerdict -Reason 'schema violation'
        $result.Notes.Count | Should -Be 0
    }

    It 'has empty SelectedReviewers array' {
        $result = New-RetryVerdict -Reason 'timeout'
        $result.SelectedReviewers.Count | Should -Be 0
    }

    It 'stores the reason for audit logging' {
        $result = New-RetryVerdict -Reason 'Moderator output truncated'
        $result.Reason | Should -BeExactly 'Moderator output truncated'
    }
}
