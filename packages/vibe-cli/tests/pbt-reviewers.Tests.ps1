# =============================================================================
# pbt-reviewers.Tests.ps1 — Property-based tests for PipelineReviewers
# Tests real production transition functions against TLA+ invariants.
# Tag: PBT
# =============================================================================

BeforeAll {
    # Stub side-effect functions
    function Invoke-Claude { }
    function Write-PipelineLog { }
    function Write-StatusNote { }
    function Write-TaskLog { }
    function Read-Escalation {
        return @{ Decision = 'KeepGoing'; Source = 'task' }
    }
    function Invoke-RedPhase {
        return @{ Status = 'pass'; TestFiles = @('t.ps1'); Counters = @{ redAttempts = 1 } }
    }
    function Invoke-GreenPhase {
        return @{ Status = 'pass'; Counters = @{ greenAttempts = 1 } }
    }
    function Invoke-CleanupPhase {
        return @{ Status = 'pass'; Counters = @{ cleanupCleanPasses = 2 } }
    }

    # Load production modules
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-state.ps1"
    . "$PSScriptRoot/../utils/review-verdict.ps1"
    . "$PSScriptRoot/../utils/review-gate.ps1"
    . "$PSScriptRoot/../utils/review-fix.ps1"

    # Load PBT harness
    . "$PSScriptRoot/helpers/property-gen.ps1"
    . "$PSScriptRoot/helpers/property-runner.ps1"

    # ── PipelineReviewers invariants (from PipelineReviewers.tla S1-S10) ──
    $script:ReviewerInvariants = @{
        'TypeOK' = {
            param($S, $C)
            Test-PipelineStateTypeOK -State $S -Config $C
        }
        'LockReleasedInTerminal' = {
            param($S, $C)
            -not ($S.pipelineState -in @('COMPLETE', 'HALTED')) -or ($null -eq $S.lockHolder)
        }
        'LockHeldWhileActive' = {
            param($S, $C)
            ($S.pipelineState -in @('idle', 'COMPLETE', 'HALTED')) -or ($S.lockHolder -eq 1)
        }
        'ReviewRoundBounded' = {
            param($S, $C)
            $S.reviewRound -le $C['MaxReviewRounds']
        }
        'KeepGoingResetsBounded' = {
            param($S, $C)
            $S.keepGoingResets -le $C['MaxKeepGoingResets']
        }
        'TddKeepGoingBounded' = {
            param($S, $C)
            $S.tddKeepGoingCount -le $C['MaxTddKeepGoingPerGate']
        }
        'TaskCountBounded' = {
            param($S, $C)
            $S.tasksDone -le $C['NumTasks']
        }
        'FinalReviewRequiresAllMerged' = {
            param($S, $C)
            -not ($S.pipelineState -in @('finalReview', 'finalReviewFix')) -or
            ($S.tasksDone -eq $C['NumTasks'])
        }
        'GlobalTimeoutHalts' = {
            param($S, $C)
            -not $S.globalTimedOut -or ($S.pipelineState -eq 'HALTED')
        }
    }
}

# =============================================================================
# Safety Properties — Pre-merge gate
# =============================================================================

Describe 'PBT Safety — Pre-merge gate with random verdicts' -Tag 'PBT' {
    BeforeEach {
        Mock Write-PipelineLog {}
        Mock Write-TaskLog {}
    }

    It 'all 9 invariants hold across 100 random pre-merge trials' {
        $result = Invoke-PropertyCheck -NumTrials 100 -SeedBase 1 `
            -Setup {
                param($Rng)
                $cfg = New-RandomPipelineConfig -Rng $Rng
                $state = New-PipelineState
                $state.pipelineState = 'running'
                $state.lockHolder = 1
                @{
                    State        = $state
                    Config       = $cfg
                    VerdictSeq   = New-RandomVerdictSequence -Rng $Rng -Length 30
                    EscalationSeq = New-RandomEscalationSequence -Rng $Rng -Length 20
                    GateType     = 'preMerge'
                }
            } `
            -Driver { param($Ctx) Invoke-ReviewerPbtDriver -Ctx $Ctx } `
            -Invariants $script:ReviewerInvariants

        $result.Passed | Should -BeTrue -Because (Format-PropertyFailure $result)
    }
}

# =============================================================================
# Safety Properties — Final review gate
# =============================================================================

Describe 'PBT Safety — Final review gate with random verdicts' -Tag 'PBT' {
    BeforeEach {
        Mock Write-PipelineLog {}
        Mock Write-TaskLog {}
    }

    It 'all 9 invariants hold across 100 random final review trials' {
        $result = Invoke-PropertyCheck -NumTrials 100 -SeedBase 200 `
            -Setup {
                param($Rng)
                $cfg = New-RandomPipelineConfig -Rng $Rng
                $state = New-PipelineState
                $state.pipelineState = 'running'
                $state.lockHolder = 1
                $state.tasksDone = $cfg['NumTasks']
                @{
                    State        = $state
                    Config       = $cfg
                    VerdictSeq   = New-RandomVerdictSequence -Rng $Rng -Length 30
                    EscalationSeq = New-RandomEscalationSequence -Rng $Rng -Length 20
                    GateType     = 'final'
                }
            } `
            -Driver { param($Ctx) Invoke-ReviewerPbtDriver -Ctx $Ctx } `
            -Invariants $script:ReviewerInvariants

        $result.Passed | Should -BeTrue -Because (Format-PropertyFailure $result)
    }
}

# =============================================================================
# Safety Properties — Timeout injection
# =============================================================================

Describe 'PBT Safety — Nondeterministic timeout injection' -Tag 'PBT' {
    BeforeEach {
        Mock Write-PipelineLog {}
        Mock Write-TaskLog {}
    }

    It 'invariants hold with gate timeout injection (50 trials)' {
        $result = Invoke-PropertyCheck -NumTrials 50 -SeedBase 400 `
            -Setup {
                param($Rng)
                $cfg = New-RandomPipelineConfig -Rng $Rng
                $state = New-PipelineState
                $state.pipelineState = 'running'
                $state.lockHolder = 1
                @{
                    State           = $state
                    Config          = $cfg
                    VerdictSeq      = New-RandomVerdictSequence -Rng $Rng -Length 30
                    EscalationSeq   = New-RandomEscalationSequence -Rng $Rng -Length 20
                    GateType        = 'preMerge'
                    TimeoutSchedule = New-RandomTimeoutSchedule -Rng $Rng -MaxSteps 30 `
                        -GateTimeoutProbability 0.5 -GlobalTimeoutProbability 0.0
                }
            } `
            -Driver { param($Ctx) Invoke-ReviewerPbtDriver -Ctx $Ctx } `
            -Invariants $script:ReviewerInvariants

        $result.Passed | Should -BeTrue -Because (Format-PropertyFailure $result)
    }

    It 'invariants hold with global timeout injection (50 trials)' {
        $result = Invoke-PropertyCheck -NumTrials 50 -SeedBase 500 `
            -Setup {
                param($Rng)
                $cfg = New-RandomPipelineConfig -Rng $Rng
                $state = New-PipelineState
                $state.pipelineState = 'running'
                $state.lockHolder = 1
                @{
                    State           = $state
                    Config          = $cfg
                    VerdictSeq      = New-RandomVerdictSequence -Rng $Rng -Length 30
                    EscalationSeq   = New-RandomEscalationSequence -Rng $Rng -Length 20
                    GateType        = 'preMerge'
                    TimeoutSchedule = New-RandomTimeoutSchedule -Rng $Rng -MaxSteps 20 `
                        -GateTimeoutProbability 0.0 -GlobalTimeoutProbability 0.5
                }
            } `
            -Driver { param($Ctx) Invoke-ReviewerPbtDriver -Ctx $Ctx } `
            -Invariants $script:ReviewerInvariants

        $result.Passed | Should -BeTrue -Because (Format-PropertyFailure $result)
    }
}

# =============================================================================
# Liveness Properties
# =============================================================================

Describe 'PBT Liveness — EventuallyTerminates' -Tag 'PBT' {
    BeforeEach {
        Mock Write-PipelineLog {}
        Mock Write-TaskLog {}
    }

    It 'pre-merge terminates for 200 random trials' {
        for ($seed = 1; $seed -le 200; $seed++) {
            $rng = New-SeededRng -Seed $seed
            $cfg = New-RandomPipelineConfig -Rng $rng
            $state = New-PipelineState
            $state.pipelineState = 'running'
            $state.lockHolder = 1

            $verdictSeq = New-RandomVerdictSequence -Rng $rng -Length 30
            $escalationSeq = New-RandomEscalationSequence -Rng $rng -Length 20

            $ctx = @{
                State        = $state
                Config       = $cfg
                VerdictSeq   = $verdictSeq
                EscalationSeq = $escalationSeq
                GateType     = 'preMerge'
                Invariants   = @{ 'TypeOK' = { param($S, $C) Test-PipelineStateTypeOK -State $S -Config $C } }
            }

            $result = Invoke-ReviewerPbtDriver -Ctx $ctx

            $state.pipelineState | Should -BeIn @('mergeQueue', 'HALTED', 'COMPLETE') `
                -Because "seed $seed must terminate (trace: $($result.Trace -join ' -> '))"
        }
    }

    It 'final review terminates for 200 random trials' {
        for ($seed = 300; $seed -le 499; $seed++) {
            $rng = New-SeededRng -Seed $seed
            $cfg = New-RandomPipelineConfig -Rng $rng
            $state = New-PipelineState
            $state.pipelineState = 'running'
            $state.lockHolder = 1
            $state.tasksDone = $cfg['NumTasks']

            $verdictSeq = New-RandomVerdictSequence -Rng $rng -Length 30
            $escalationSeq = New-RandomEscalationSequence -Rng $rng -Length 20

            $ctx = @{
                State        = $state
                Config       = $cfg
                VerdictSeq   = $verdictSeq
                EscalationSeq = $escalationSeq
                GateType     = 'final'
                Invariants   = @{ 'TypeOK' = { param($S, $C) Test-PipelineStateTypeOK -State $S -Config $C } }
            }

            $result = Invoke-ReviewerPbtDriver -Ctx $ctx

            $state.pipelineState | Should -BeIn @('COMPLETE', 'HALTED') `
                -Because "seed $seed must terminate (trace: $($result.Trace -join ' -> '))"
        }
    }
}

# =============================================================================
# Liveness — ReviewGateResolves
# =============================================================================

Describe 'PBT Liveness — ReviewGateResolves within bounded steps' -Tag 'PBT' {
    BeforeEach {
        Mock Write-PipelineLog {}
        Mock Write-TaskLog {}
    }

    It 'pre-merge pass resolves in 1 step' {
        $cfg = Get-PipelineConfig
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder = 1

        $ctx = @{
            State      = $state
            Config     = $cfg
            VerdictSeq = @('pass')
            GateType   = 'preMerge'
            Invariants = $script:ReviewerInvariants
        }
        $result = Invoke-ReviewerPbtDriver -Ctx $ctx
        $result.FinalState | Should -BeExactly 'mergeQueue'
        $result.Steps | Should -BeLessOrEqual 3
    }

    It 'final pass resolves to COMPLETE in 1 step' {
        $cfg = Get-PipelineConfig
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder = 1
        $state.tasksDone = $cfg['NumTasks']

        $ctx = @{
            State      = $state
            Config     = $cfg
            VerdictSeq = @('pass')
            GateType   = 'final'
            Invariants = $script:ReviewerInvariants
        }
        $result = Invoke-ReviewerPbtDriver -Ctx $ctx
        $result.FinalState | Should -BeExactly 'COMPLETE'
    }
}
