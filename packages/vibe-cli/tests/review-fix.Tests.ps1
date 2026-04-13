BeforeAll {
    # Stub external dependencies before sourcing
    function Invoke-Claude { }
    function Write-PipelineLog { }
    function Write-StatusNote { }
    function Write-TaskLog { }
    function Invoke-RedPhase { }
    function Invoke-GreenPhase { }
    function Invoke-CleanupPhase { }
    function Invoke-ReviewGate { }

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
    . "$PSScriptRoot/../utils/review-fix.ps1"
}

# =============================================================================
# Complete-ReviewFix — TLA+ ReviewFixComplete
# BDD: "Cleanup passes trigger re-review"
#      "Review round counter increments per review-fix cycle"
# =============================================================================

Describe 'Complete-ReviewFix' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        # Pre-condition: pipeline in reviewFix state after a failed pre-merge review
        $script:state.pipelineState    = 'reviewFix'
        $script:state.lockHolder       = 1
        $script:state.reviewGateType   = 'preMerge'
        $script:state.reviewRound      = 0
        $script:state.verdict          = $null

        Mock Write-PipelineLog {}
    }

    # =========================================================================
    # TLA+ ReviewFixComplete: pipelineState' = "preMergeReview"
    # =========================================================================

    Context 'Successful fix completion — transitions back to preMergeReview' {
        It 'transitions pipelineState to "preMergeReview"' {
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'preMergeReview'
        }

        It 'increments reviewRound by 1' {
            $script:state.reviewRound = 1
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.reviewRound | Should -BeExactly 2
        }

        It 'increments reviewRound from 0 to 1 on first fix cycle' {
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.reviewRound | Should -BeExactly 1
        }

        It 'clears verdict to $null (ready for re-review)' {
            $script:state.verdict = 'fail'
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.verdict | Should -BeNullOrEmpty
        }
    }

    # =========================================================================
    # TLA+ UNCHANGED fields
    # =========================================================================

    Context 'UNCHANGED fields are preserved after fix completion' {
        It 'preserves lockHolder' {
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.lockHolder | Should -BeExactly 1
        }

        It 'preserves keepGoingResets' {
            $script:state.keepGoingResets = 2
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.keepGoingResets | Should -BeExactly 2
        }

        It 'preserves tddKeepGoingCount' {
            $script:state.tddKeepGoingCount = 3
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.tddKeepGoingCount | Should -BeExactly 3
        }

        It 'preserves tasksDone' {
            $script:state.tasksDone = 2
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.tasksDone | Should -BeExactly 2
        }

        It 'preserves reviewGateType' {
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.reviewGateType | Should -BeExactly 'preMerge'
        }
    }

    # =========================================================================
    # Guard conditions
    # =========================================================================

    Context 'Guard — rejects invalid pipelineState' {
        It 'throws when pipelineState is "running"' {
            $script:state.pipelineState = 'running'
            { Complete-ReviewFix -State $script:state -Config $script:cfg } |
                Should -Throw -ExpectedMessage '*reviewFix*finalReviewFix*'
        }

        It 'throws when pipelineState is "preMergeReview"' {
            $script:state.pipelineState = 'preMergeReview'
            { Complete-ReviewFix -State $script:state -Config $script:cfg } |
                Should -Throw -ExpectedMessage '*reviewFix*finalReviewFix*'
        }

        It 'throws when pipelineState is "idle"' {
            $script:state.pipelineState = 'idle'
            { Complete-ReviewFix -State $script:state -Config $script:cfg } |
                Should -Throw -ExpectedMessage '*reviewFix*finalReviewFix*'
        }
    }

    # =========================================================================
    # FinalReviewFixComplete: finalReviewFix → finalReview (Step 13)
    # =========================================================================

    Context 'Final review-fix completion — transitions to finalReview' {
        BeforeEach {
            $script:state.pipelineState  = 'finalReviewFix'
            $script:state.reviewGateType = 'final'
        }

        It 'transitions pipelineState to "finalReview"' {
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'finalReview'
        }

        It 'increments reviewRound by 1' {
            $script:state.reviewRound = 1
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.reviewRound | Should -BeExactly 2
        }

        It 'clears verdict to $null' {
            $script:state.verdict = 'fail'
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'preserves lockHolder' {
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.lockHolder | Should -BeExactly 1
        }

        It 'preserves keepGoingResets' {
            $script:state.keepGoingResets = 2
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.keepGoingResets | Should -BeExactly 2
        }

        It 'preserves tddKeepGoingCount (sticky across fix re-entries)' {
            $script:state.tddKeepGoingCount = 4
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.tddKeepGoingCount | Should -BeExactly 4
        }

        It 'preserves tasksDone' {
            $script:state.tasksDone = 1
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.tasksDone | Should -BeExactly 1
        }

        It 'preserves reviewGateType as "final"' {
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.reviewGateType | Should -BeExactly 'final'
        }

        It 'state is TypeOK after final review-fix completion' {
            Complete-ReviewFix -State $script:state -Config $script:cfg
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }
    }

    Context 'Regression — reviewFix still routes to preMergeReview' {
        It 'transitions to preMergeReview from reviewFix' {
            Complete-ReviewFix -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'preMergeReview'
        }
    }

    # =========================================================================
    # TypeOK invariant
    # =========================================================================

    Context 'TypeOK invariant holds after fix completion' {
        It 'state is TypeOK after Complete-ReviewFix' {
            Complete-ReviewFix -State $script:state -Config $script:cfg
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }

        It 'state is TypeOK when reviewRound was at 2' {
            $script:state.reviewRound = 2
            Complete-ReviewFix -State $script:state -Config $script:cfg
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }
    }
}

# =============================================================================
# Invoke-ReviewFixCycle — orchestrates RED→GREEN→Cleanup with blocker context
# BDD: "Blockers are passed as context to the RED phase"
#      "GREEN phase receives blocker context plus failing tests"
#      "TDD counters reset fresh for each review-fix cycle"
# =============================================================================

Describe 'Invoke-ReviewFixCycle' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        $script:state.pipelineState    = 'reviewFix'
        $script:state.lockHolder       = 1
        $script:state.reviewGateType   = 'preMerge'
        $script:state.reviewRound      = 0
        $script:state.verdict          = $null

        $script:blockers = @(
            [PSCustomObject]@{
                Reviewer    = 'security'
                Severity    = 'critical'
                Description = 'SQL injection in query builder'
                Files       = @('src/db.ts')
                Suggestion  = 'Use parameterized queries'
            },
            [PSCustomObject]@{
                Reviewer    = 'bug-hunter'
                Severity    = 'high'
                Description = 'Null dereference in auth handler'
                Files       = @('src/auth.ts')
                Suggestion  = 'Add null check before access'
            }
        )

        $script:task = @{
            id         = 'T1'
            step       = 1
            title      = 'Add auth endpoint'
            files      = @('src/auth.ts')
            codeWriter = 'typescript-writer'
            testWriter = 'pester-writer'
        }

        Mock Write-PipelineLog {}
        Mock Write-TaskLog {}
        Mock Write-StatusNote {}
    }

    # =========================================================================
    # BDD: "Blockers are passed as context to the RED phase"
    # =========================================================================

    Context 'Blocker context is passed to RED phase' {
        It 'calls Invoke-RedPhase with blockers included in the context' {
            Mock Invoke-RedPhase {
                return @{ Status = 'pass'; TestFiles = @('tests/auth.Tests.ps1'); Counters = @{ redAttempts = 1 } }
            }
            Mock Invoke-GreenPhase {
                return @{ Status = 'pass'; Counters = @{ greenAttempts = 1 } }
            }
            Mock Invoke-CleanupPhase {
                return @{ Status = 'pass'; Counters = @{ cleanupCleanPasses = 2 } }
            }

            Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'

            Should -Invoke Invoke-RedPhase -Times 1
        }

        It 'includes the full blockers array in RED phase parameters' {
            $capturedBlockers = $null
            Mock Invoke-RedPhase {
                # The function should receive blocker context
                return @{ Status = 'pass'; TestFiles = @('tests/auth.Tests.ps1'); Counters = @{ redAttempts = 1 } }
            } -ParameterFilter { $null -ne $Blockers -and $Blockers.Count -eq 2 }
            Mock Invoke-GreenPhase {
                return @{ Status = 'pass'; Counters = @{ greenAttempts = 1 } }
            }
            Mock Invoke-CleanupPhase {
                return @{ Status = 'pass'; Counters = @{ cleanupCleanPasses = 2 } }
            }

            Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'

            Should -Invoke Invoke-RedPhase -Times 1 -ParameterFilter { $null -ne $Blockers -and $Blockers.Count -eq 2 }
        }
    }

    # =========================================================================
    # BDD: "GREEN phase receives blocker context plus failing tests"
    # =========================================================================

    Context 'GREEN phase receives blockers and test files from RED' {
        It 'passes blocker descriptions to the GREEN phase' {
            Mock Invoke-RedPhase {
                return @{ Status = 'pass'; TestFiles = @('tests/auth.Tests.ps1'); Counters = @{ redAttempts = 1 } }
            }
            Mock Invoke-GreenPhase {
                return @{ Status = 'pass'; Counters = @{ greenAttempts = 1 } }
            } -ParameterFilter { $null -ne $Blockers -and $Blockers.Count -eq 2 }
            Mock Invoke-CleanupPhase {
                return @{ Status = 'pass'; Counters = @{ cleanupCleanPasses = 2 } }
            }

            Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'

            Should -Invoke Invoke-GreenPhase -Times 1 -ParameterFilter { $null -ne $Blockers -and $Blockers.Count -eq 2 }
        }

        It 'passes test files produced by RED to the GREEN phase' {
            Mock Invoke-RedPhase {
                return @{ Status = 'pass'; TestFiles = @('tests/auth.Tests.ps1', 'tests/db.Tests.ps1'); Counters = @{ redAttempts = 1 } }
            }
            Mock Invoke-GreenPhase {
                return @{ Status = 'pass'; Counters = @{ greenAttempts = 1 } }
            } -ParameterFilter { $null -ne $TestFiles -and $TestFiles.Count -eq 2 }
            Mock Invoke-CleanupPhase {
                return @{ Status = 'pass'; Counters = @{ cleanupCleanPasses = 2 } }
            }

            Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'

            Should -Invoke Invoke-GreenPhase -Times 1 -ParameterFilter { $null -ne $TestFiles -and $TestFiles.Count -eq 2 }
        }
    }

    # =========================================================================
    # BDD: "TDD counters reset fresh for each review-fix cycle"
    # =========================================================================

    Context 'TDD counters reset at start of each review-fix cycle' {
        It 'starts with GREEN retry counter at 0' {
            Mock Invoke-RedPhase {
                return @{ Status = 'pass'; TestFiles = @('t.ps1'); Counters = @{ redAttempts = 1 } }
            }
            Mock Invoke-GreenPhase {
                param($Counters)
                return @{ Status = 'pass'; Counters = @{ greenAttempts = 1 } }
            } -ParameterFilter { $null -ne $Counters -and $Counters.greenAttempts -eq 0 }
            Mock Invoke-CleanupPhase {
                return @{ Status = 'pass'; Counters = @{ cleanupCleanPasses = 2 } }
            }

            Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'

            Should -Invoke Invoke-GreenPhase -Times 1 -ParameterFilter { $null -ne $Counters -and $Counters.greenAttempts -eq 0 }
        }

        It 'starts with RED retry counter at 0' {
            Mock Invoke-RedPhase {
                return @{ Status = 'pass'; TestFiles = @('t.ps1'); Counters = @{ redAttempts = 1 } }
            } -ParameterFilter { $null -ne $Counters -and $Counters.redAttempts -eq 0 }
            Mock Invoke-GreenPhase {
                return @{ Status = 'pass'; Counters = @{ greenAttempts = 1 } }
            }
            Mock Invoke-CleanupPhase {
                return @{ Status = 'pass'; Counters = @{ cleanupCleanPasses = 2 } }
            }

            Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'

            Should -Invoke Invoke-RedPhase -Times 1 -ParameterFilter { $null -ne $Counters -and $Counters.redAttempts -eq 0 }
        }

        It 'starts with cleanup remediation counter at 0' {
            Mock Invoke-RedPhase {
                return @{ Status = 'pass'; TestFiles = @('t.ps1'); Counters = @{ redAttempts = 1 } }
            }
            Mock Invoke-GreenPhase {
                return @{ Status = 'pass'; Counters = @{ greenAttempts = 1 } }
            }
            Mock Invoke-CleanupPhase {
                return @{ Status = 'pass'; Counters = @{ cleanupCleanPasses = 2 } }
            } -ParameterFilter { $null -ne $Counters -and $Counters.cleanupRemediations -eq 0 }

            Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'

            Should -Invoke Invoke-CleanupPhase -Times 1 -ParameterFilter { $null -ne $Counters -and $Counters.cleanupRemediations -eq 0 }
        }
    }

    # =========================================================================
    # Full cycle: RED → GREEN → Cleanup → returns success
    # =========================================================================

    Context 'Successful full cycle returns completion result' {
        BeforeEach {
            Mock Invoke-RedPhase {
                return @{ Status = 'pass'; TestFiles = @('tests/auth.Tests.ps1'); Counters = @{ redAttempts = 1 } }
            }
            Mock Invoke-GreenPhase {
                return @{ Status = 'pass'; Counters = @{ greenAttempts = 1 } }
            }
            Mock Invoke-CleanupPhase {
                return @{ Status = 'pass'; Counters = @{ cleanupCleanPasses = 2 } }
            }
        }

        It 'returns a result with Status "pass"' {
            $result = Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'

            $result.Status | Should -BeExactly 'pass'
        }

        It 'invokes all three TDD phases in sequence' {
            Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'

            Should -Invoke Invoke-RedPhase -Times 1
            Should -Invoke Invoke-GreenPhase -Times 1
            Should -Invoke Invoke-CleanupPhase -Times 1
        }
    }

    # =========================================================================
    # RED phase escalation bubbles up
    # =========================================================================

    Context 'RED phase escalation stops the cycle' {
        It 'returns escalated status when RED phase escalates' {
            Mock Invoke-RedPhase {
                return @{ Status = 'escalated'; Escalated = $true; Error = 'RED attempts exhausted' }
            }

            $result = Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'

            $result.Status | Should -BeExactly 'escalated'
        }

        It 'does not invoke GREEN when RED escalates' {
            Mock Invoke-RedPhase {
                return @{ Status = 'escalated'; Escalated = $true; Error = 'RED attempts exhausted' }
            }
            Mock Invoke-GreenPhase {}

            Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'

            Should -Invoke Invoke-GreenPhase -Times 0
        }
    }

    # =========================================================================
    # GREEN phase escalation bubbles up
    # =========================================================================

    Context 'GREEN phase escalation stops the cycle' {
        It 'returns escalated status when GREEN phase escalates' {
            Mock Invoke-RedPhase {
                return @{ Status = 'pass'; TestFiles = @('t.ps1'); Counters = @{ redAttempts = 1 } }
            }
            Mock Invoke-GreenPhase {
                return @{ Status = 'escalated'; Escalated = $true; Error = 'GREEN attempts exhausted' }
            }

            $result = Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'

            $result.Status | Should -BeExactly 'escalated'
        }

        It 'does not invoke Cleanup when GREEN escalates' {
            Mock Invoke-RedPhase {
                return @{ Status = 'pass'; TestFiles = @('t.ps1'); Counters = @{ redAttempts = 1 } }
            }
            Mock Invoke-GreenPhase {
                return @{ Status = 'escalated'; Escalated = $true; Error = 'GREEN attempts exhausted' }
            }
            Mock Invoke-CleanupPhase {}

            Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'

            Should -Invoke Invoke-CleanupPhase -Times 0
        }
    }

    # =========================================================================
    # Cleanup escalation bubbles up
    # =========================================================================

    Context 'Cleanup phase escalation stops the cycle' {
        It 'returns escalated status when Cleanup escalates' {
            Mock Invoke-RedPhase {
                return @{ Status = 'pass'; TestFiles = @('t.ps1'); Counters = @{ redAttempts = 1 } }
            }
            Mock Invoke-GreenPhase {
                return @{ Status = 'pass'; Counters = @{ greenAttempts = 1 } }
            }
            Mock Invoke-CleanupPhase {
                return @{ Status = 'escalated'; Escalated = $true; Error = 'Cleanup exhausted' }
            }

            $result = Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'

            $result.Status | Should -BeExactly 'escalated'
        }
    }

    # =========================================================================
    # Guard: pipelineState must be 'reviewFix'
    # =========================================================================

    Context 'Guard — rejects invalid pipelineState' {
        It 'throws when pipelineState is "running"' {
            $script:state.pipelineState = 'running'
            { Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature' } |
                Should -Throw -ExpectedMessage '*reviewFix*finalReviewFix*'
        }

        It 'throws when pipelineState is "preMergeReview"' {
            $script:state.pipelineState = 'preMergeReview'
            { Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature' } |
                Should -Throw -ExpectedMessage '*reviewFix*finalReviewFix*'
        }
    }

    Context 'Accepts finalReviewFix state (Step 13)' {
        BeforeEach {
            $script:state.pipelineState  = 'finalReviewFix'
            $script:state.reviewGateType = 'final'

            Mock Invoke-RedPhase {
                return @{ Status = 'pass'; TestFiles = @('t.ps1'); Counters = @{ redAttempts = 1 } }
            }
            Mock Invoke-GreenPhase {
                return @{ Status = 'pass'; Counters = @{ greenAttempts = 1 } }
            }
            Mock Invoke-CleanupPhase {
                return @{ Status = 'pass'; Counters = @{ cleanupCleanPasses = 2 } }
            }
        }

        It 'completes successfully from finalReviewFix' {
            $result = Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $script:blockers `
                -Root 'C:\project' -FeatureDir 'C:\project\feature'
            $result.Status | Should -BeExactly 'pass'
        }
    }

    # =========================================================================
    # Guard: Blockers must be non-empty
    # BDD: "Zero-blocker failures trigger retry-review instead of review-fix"
    # =========================================================================

    Context 'Guard — requires non-empty blockers array' {
        It 'throws when Blockers is empty' {
            { Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers @() `
                -Root 'C:\project' -FeatureDir 'C:\project\feature' } |
                Should -Throw -ExpectedMessage '*blocker*'
        }

        It 'throws when Blockers is $null' {
            { Invoke-ReviewFixCycle -State $script:state -Config $script:cfg `
                -Task $script:task -Blockers $null `
                -Root 'C:\project' -FeatureDir 'C:\project\feature' } |
                Should -Throw
        }
    }
}

# =============================================================================
# Invoke-TddKeepGoing — TLA+ TddKeepGoingInFix
# BDD: "TDD cycles within a fix can be extended via Keep Going"
# =============================================================================

Describe 'Invoke-TddKeepGoing' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        $script:state.pipelineState    = 'reviewFix'
        $script:state.lockHolder       = 1
        $script:state.reviewGateType   = 'preMerge'
        $script:state.reviewRound      = 1
        $script:state.keepGoingResets   = 0
        $script:state.tddKeepGoingCount = 0
        $script:state.verdict          = $null
        $script:state.tasksDone        = 0

        Mock Write-PipelineLog {}
    }

    Context 'Increments tddKeepGoingCount (TLA+ TddKeepGoingInFix)' {
        It 'increments tddKeepGoingCount from 0 to 1' {
            Invoke-TddKeepGoing -State $script:state -Config $script:cfg
            $script:state.tddKeepGoingCount | Should -BeExactly 1
        }

        It 'increments tddKeepGoingCount from 3 to 4' {
            $script:state.tddKeepGoingCount = 3
            Invoke-TddKeepGoing -State $script:state -Config $script:cfg
            $script:state.tddKeepGoingCount | Should -BeExactly 4
        }

        It 'allows Keep Going at count 4' {
            $script:state.tddKeepGoingCount = 4
            { Invoke-TddKeepGoing -State $script:state -Config $script:cfg } |
                Should -Not -Throw
        }

        It 'allows Keep Going at high count (no limit)' {
            $script:state.tddKeepGoingCount = 100
            { Invoke-TddKeepGoing -State $script:state -Config $script:cfg } |
                Should -Not -Throw
        }
    }

    Context 'UNCHANGED fields (TLA+ TddKeepGoingInFix)' {
        It 'preserves pipelineState as reviewFix' {
            Invoke-TddKeepGoing -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'reviewFix'
        }

        It 'preserves lockHolder' {
            Invoke-TddKeepGoing -State $script:state -Config $script:cfg
            $script:state.lockHolder | Should -BeExactly 1
        }

        It 'preserves reviewRound' {
            $script:state.reviewRound = 2
            Invoke-TddKeepGoing -State $script:state -Config $script:cfg
            $script:state.reviewRound | Should -BeExactly 2
        }

        It 'preserves keepGoingResets' {
            $script:state.keepGoingResets = 1
            Invoke-TddKeepGoing -State $script:state -Config $script:cfg
            $script:state.keepGoingResets | Should -BeExactly 1
        }

        It 'preserves verdict' {
            Invoke-TddKeepGoing -State $script:state -Config $script:cfg
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'preserves tasksDone' {
            $script:state.tasksDone = 2
            Invoke-TddKeepGoing -State $script:state -Config $script:cfg
            $script:state.tasksDone | Should -BeExactly 2
        }

        It 'preserves reviewGateType' {
            Invoke-TddKeepGoing -State $script:state -Config $script:cfg
            $script:state.reviewGateType | Should -BeExactly 'preMerge'
        }
    }

    Context 'Guard — rejects invalid pipelineState' {
        It 'throws when pipelineState is "running"' {
            $script:state.pipelineState = 'running'
            { Invoke-TddKeepGoing -State $script:state -Config $script:cfg } |
                Should -Throw -ExpectedMessage '*reviewFix*finalReviewFix*'
        }

        It 'throws when pipelineState is "preMergeReview"' {
            $script:state.pipelineState = 'preMergeReview'
            { Invoke-TddKeepGoing -State $script:state -Config $script:cfg } |
                Should -Throw -ExpectedMessage '*reviewFix*finalReviewFix*'
        }
    }

    Context 'TypeOK invariant' {
        It 'state is TypeOK after Invoke-TddKeepGoing' {
            Invoke-TddKeepGoing -State $script:state -Config $script:cfg
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }

        It 'state is TypeOK at tddKeepGoingCount 3' {
            $script:state.tddKeepGoingCount = 3
            Invoke-TddKeepGoing -State $script:state -Config $script:cfg
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }
    }
}

# =============================================================================
# Invoke-TddKeepGoingExhausted — TLA+ TddKeepGoingExhausted
# BDD: "TDD cap reached escalates back to review gate with fail verdict"
# =============================================================================

Describe 'Invoke-TddKeepGoingExhausted' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        $script:state.pipelineState    = 'reviewFix'
        $script:state.lockHolder       = 1
        $script:state.reviewGateType   = 'preMerge'
        $script:state.reviewRound      = 1
        $script:state.keepGoingResets   = 0
        $script:state.tddKeepGoingCount = 5
        $script:state.verdict          = $null
        $script:state.tasksDone        = 0

        Mock Write-PipelineLog {}
    }

    Context 'Transitions to parent review state with fail verdict' {
        It 'transitions pipelineState to preMergeReview from reviewFix' {
            Invoke-TddKeepGoingExhausted -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'preMergeReview'
        }

        It 'sets verdict to "fail"' {
            Invoke-TddKeepGoingExhausted -State $script:state -Config $script:cfg
            $script:state.verdict | Should -BeExactly 'fail'
        }

        It 'increments reviewRound by 1' {
            Invoke-TddKeepGoingExhausted -State $script:state -Config $script:cfg
            $script:state.reviewRound | Should -BeExactly 2
        }

        It 'transitions to finalReview from finalReviewFix' {
            $script:state.pipelineState  = 'finalReviewFix'
            $script:state.reviewGateType = 'final'
            Invoke-TddKeepGoingExhausted -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'finalReview'
        }
    }

    Context 'UNCHANGED fields (TLA+ TddKeepGoingExhausted)' {
        It 'preserves lockHolder' {
            Invoke-TddKeepGoingExhausted -State $script:state -Config $script:cfg
            $script:state.lockHolder | Should -BeExactly 1
        }

        It 'preserves keepGoingResets' {
            $script:state.keepGoingResets = 2
            Invoke-TddKeepGoingExhausted -State $script:state -Config $script:cfg
            $script:state.keepGoingResets | Should -BeExactly 2
        }

        It 'preserves tddKeepGoingCount (not reset on exhaustion)' {
            Invoke-TddKeepGoingExhausted -State $script:state -Config $script:cfg
            $script:state.tddKeepGoingCount | Should -BeExactly 5
        }

        It 'preserves tasksDone' {
            Invoke-TddKeepGoingExhausted -State $script:state -Config $script:cfg
            $script:state.tasksDone | Should -BeExactly 0
        }

        It 'preserves reviewGateType' {
            Invoke-TddKeepGoingExhausted -State $script:state -Config $script:cfg
            $script:state.reviewGateType | Should -BeExactly 'preMerge'
        }
    }

    Context 'Guard — rejects invalid pipelineState' {
        It 'throws when pipelineState is "running"' {
            $script:state.pipelineState = 'running'
            { Invoke-TddKeepGoingExhausted -State $script:state -Config $script:cfg } |
                Should -Throw -ExpectedMessage '*reviewFix*finalReviewFix*'
        }
    }

    Context 'TypeOK invariant' {
        It 'state is TypeOK after TddKeepGoingExhausted' {
            Invoke-TddKeepGoingExhausted -State $script:state -Config $script:cfg
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }
    }
}

# =============================================================================
# Invoke-TddStopInFix — TLA+ TddStopInFix
# BDD: "User can voluntarily stop during a TDD fix cycle"
# =============================================================================

Describe 'Invoke-TddStopInFix' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        $script:state.pipelineState    = 'reviewFix'
        $script:state.lockHolder       = 1
        $script:state.reviewGateType   = 'preMerge'
        $script:state.reviewRound      = 1
        $script:state.keepGoingResets   = 0
        $script:state.tddKeepGoingCount = 2
        $script:state.verdict          = $null
        $script:state.tasksDone        = 0

        Mock Write-PipelineLog {}
    }

    Context 'Transitions to HALTED (TLA+ TddStopInFix)' {
        It 'transitions pipelineState to HALTED from reviewFix' {
            Invoke-TddStopInFix -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }

        It 'releases lockHolder to $null' {
            Invoke-TddStopInFix -State $script:state -Config $script:cfg
            $script:state.lockHolder | Should -BeNullOrEmpty
        }

        It 'transitions to HALTED from finalReviewFix' {
            $script:state.pipelineState  = 'finalReviewFix'
            $script:state.reviewGateType = 'final'
            Invoke-TddStopInFix -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'HALTED'
        }
    }

    Context 'UNCHANGED fields (TLA+ TddStopInFix)' {
        It 'preserves reviewRound' {
            Invoke-TddStopInFix -State $script:state -Config $script:cfg
            $script:state.reviewRound | Should -BeExactly 1
        }

        It 'preserves keepGoingResets' {
            Invoke-TddStopInFix -State $script:state -Config $script:cfg
            $script:state.keepGoingResets | Should -BeExactly 0
        }

        It 'preserves tddKeepGoingCount' {
            Invoke-TddStopInFix -State $script:state -Config $script:cfg
            $script:state.tddKeepGoingCount | Should -BeExactly 2
        }

        It 'preserves verdict' {
            Invoke-TddStopInFix -State $script:state -Config $script:cfg
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'preserves tasksDone' {
            Invoke-TddStopInFix -State $script:state -Config $script:cfg
            $script:state.tasksDone | Should -BeExactly 0
        }

        It 'preserves reviewGateType' {
            Invoke-TddStopInFix -State $script:state -Config $script:cfg
            $script:state.reviewGateType | Should -BeExactly 'preMerge'
        }
    }

    Context 'Guard — rejects invalid pipelineState' {
        It 'throws when pipelineState is "running"' {
            $script:state.pipelineState = 'running'
            { Invoke-TddStopInFix -State $script:state -Config $script:cfg } |
                Should -Throw -ExpectedMessage '*reviewFix*finalReviewFix*'
        }
    }

    Context 'TypeOK invariant' {
        It 'state is TypeOK after TddStopInFix (HALTED is valid terminal)' {
            Invoke-TddStopInFix -State $script:state -Config $script:cfg
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }
    }
}

# =============================================================================
# Sticky tddKeepGoingCount across fix re-entries
# BDD: "tddKeepGoingCount survives Complete-ReviewFix re-entries within gate"
# =============================================================================

Describe 'tddKeepGoingCount stickiness across fix re-entries' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        $script:state.pipelineState    = 'reviewFix'
        $script:state.lockHolder       = 1
        $script:state.reviewGateType   = 'preMerge'
        $script:state.reviewRound      = 0
        $script:state.tddKeepGoingCount = 3
        $script:state.verdict          = $null

        Mock Write-PipelineLog {}
    }

    It 'Complete-ReviewFix preserves tddKeepGoingCount of 3, then re-enter reviewFix retains it' {
        # Fix completes -> back to preMergeReview
        Complete-ReviewFix -State $script:state -Config $script:cfg
        $script:state.pipelineState | Should -BeExactly 'preMergeReview'
        $script:state.tddKeepGoingCount | Should -BeExactly 3

        # Simulate another fail verdict -> back to reviewFix
        $script:state.pipelineState = 'reviewFix'
        $script:state.tddKeepGoingCount | Should -BeExactly 3

        # Continue Keep Going selections (no limit)
        Invoke-TddKeepGoing -State $script:state -Config $script:cfg
        $script:state.tddKeepGoingCount | Should -BeExactly 4
        Invoke-TddKeepGoing -State $script:state -Config $script:cfg
        $script:state.tddKeepGoingCount | Should -BeExactly 5
        Invoke-TddKeepGoing -State $script:state -Config $script:cfg
        $script:state.tddKeepGoingCount | Should -BeExactly 6
    }
}
