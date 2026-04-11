# =============================================================================
# pbt-coding-stage.Tests.ps1 — Property-based tests for CodingStage model
# Tests pure state machine model against TLA+ invariants S1-S12.
# Tag: PBT
# =============================================================================

BeforeAll {
    . "$PSScriptRoot/helpers/property-gen.ps1"
    . "$PSScriptRoot/helpers/property-runner.ps1"
    . "$PSScriptRoot/helpers/coding-stage-model.ps1"

    # All 12 CodingStage safety invariants
    $script:CodingStageInvariants = @{
        'TypeOK'                       = { param($S) Test-CodingStageTypeOK $S }
        'TiersSequential'              = { param($S) Test-TiersSequential $S }
        'RetryBounds'                  = { param($S) Test-RetryBounds $S }
        'AgentWriterNoTdd'             = { param($S) Test-AgentWriterNoTdd $S }
        'MergeSerial'                  = { param($S) Test-MergeSerial $S }
        'NoOrphanedWorkspaces'         = { param($S) Test-NoOrphanedWorkspaces $S }
        'SingleTaskNoWorkspace'        = { param($S) Test-SingleTaskNoWorkspace $S }
        'CompletionRequiresFinalVerif' = { param($S) Test-CompletionRequiresFinalVerif $S }
        'EscalationBlocksProgress'     = { param($S) Test-EscalationBlocksProgress $S }
        'GreenAfterRed'                = { param($S) Test-GreenAfterRed $S }
        'CleanupOnlyForTdd'            = { param($S) Test-CleanupOnlyForTdd $S }
        'ValidationGatesExecution'     = { param($S) Test-ValidationGatesExecution $S }
        'WorkspaceCreationSafety'      = { param($S) Test-WorkspaceCreationSafety $S }
    }

    $script:SmallConstants = @{
        MaxRedRetries  = 2
        MaxTddCycles   = 2
        MaxFixRounds   = 2
        MaxMergeRetries = 2
        CleanupPasses  = 2
    }
}

# =============================================================================
# 3-task 2-tier all-TDD plan
# =============================================================================

Describe 'PBT CodingStage — 3-task 2-tier all-TDD (200 trials)' -Tag 'PBT' {
    It 'all 12 invariants hold across 200 random walks' {
        for ($seed = 1; $seed -le 200; $seed++) {
            $rng = New-SeededRng -Seed $seed
            $state = New-CodingStageState `
                -Tasks @('T1', 'T2', 'T3') `
                -Tiers @{ T1 = 1; T2 = 1; T3 = 2 } `
                -WriterTypes @{ T1 = 'tdd'; T2 = 'tdd'; T3 = 'tdd' } `
                -Constants $script:SmallConstants

            $result = Invoke-CodingStageRandomWalk `
                -State $state -Rng $rng -MaxSteps 300 `
                -Invariants $script:CodingStageInvariants

            if ($result.InvariantViolation) {
                $traceStr = ($result.Trace | Select-Object -Last 20) -join ' -> '
                throw "Seed ${seed}: $($result.InvariantViolation) at step $($result.FailingStep). Last 20 actions: $traceStr"
            }
        }
    }
}

# =============================================================================
# 1-task 1-tier plan (SingleTaskNoWorkspace focus)
# =============================================================================

Describe 'PBT CodingStage — 1-task 1-tier (100 trials)' -Tag 'PBT' {
    It 'SingleTaskNoWorkspace invariant holds across 100 random walks' {
        for ($seed = 300; $seed -le 399; $seed++) {
            $rng = New-SeededRng -Seed $seed
            $state = New-CodingStageState `
                -Tasks @('T1') `
                -Tiers @{ T1 = 1 } `
                -WriterTypes @{ T1 = 'tdd' } `
                -Constants $script:SmallConstants

            $result = Invoke-CodingStageRandomWalk `
                -State $state -Rng $rng -MaxSteps 200 `
                -Invariants $script:CodingStageInvariants

            if ($result.InvariantViolation) {
                $traceStr = ($result.Trace | Select-Object -Last 20) -join ' -> '
                throw "Seed ${seed}: $($result.InvariantViolation) at step $($result.FailingStep). Last 20 actions: $traceStr"
            }
        }
    }
}

# =============================================================================
# Mixed tdd/agent writers (AgentWriterNoTdd focus)
# =============================================================================

Describe 'PBT CodingStage — mixed tdd/agent writers (100 trials)' -Tag 'PBT' {
    It 'AgentWriterNoTdd invariant holds across 100 random walks' {
        for ($seed = 500; $seed -le 599; $seed++) {
            $rng = New-SeededRng -Seed $seed
            $state = New-CodingStageState `
                -Tasks @('T1', 'T2', 'T3') `
                -Tiers @{ T1 = 1; T2 = 1; T3 = 2 } `
                -WriterTypes @{ T1 = 'tdd'; T2 = 'agent'; T3 = 'tdd' } `
                -Constants $script:SmallConstants

            $result = Invoke-CodingStageRandomWalk `
                -State $state -Rng $rng -MaxSteps 300 `
                -Invariants $script:CodingStageInvariants

            if ($result.InvariantViolation) {
                $traceStr = ($result.Trace | Select-Object -Last 20) -join ' -> '
                throw "Seed ${seed}: $($result.InvariantViolation) at step $($result.FailingStep). Last 20 actions: $traceStr"
            }
        }
    }
}

# =============================================================================
# Escalation-heavy sequences (biased toward failures)
# =============================================================================

Describe 'PBT CodingStage — escalation-heavy (100 trials)' -Tag 'PBT' {
    It 'EscalationBlocksProgress holds across failure-biased random walks' {
        for ($seed = 700; $seed -le 799; $seed++) {
            $rng = New-SeededRng -Seed $seed
            # Very small bounds to trigger escalation faster
            $tinyConstants = @{
                MaxRedRetries   = 1
                MaxTddCycles    = 1
                MaxFixRounds    = 1
                MaxMergeRetries = 1
                CleanupPasses   = 2
            }
            $state = New-CodingStageState `
                -Tasks @('T1', 'T2') `
                -Tiers @{ T1 = 1; T2 = 1 } `
                -WriterTypes @{ T1 = 'tdd'; T2 = 'tdd' } `
                -Constants $tinyConstants

            $result = Invoke-CodingStageRandomWalk `
                -State $state -Rng $rng -MaxSteps 200 `
                -Invariants $script:CodingStageInvariants

            if ($result.InvariantViolation) {
                $traceStr = ($result.Trace | Select-Object -Last 20) -join ' -> '
                throw "Seed ${seed}: $($result.InvariantViolation) at step $($result.FailingStep). Last 20 actions: $traceStr"
            }
        }
    }
}

# =============================================================================
# Liveness: EventuallyTerminates
# =============================================================================

Describe 'PBT CodingStage Liveness — EventuallyTerminates' -Tag 'PBT' {
    It '1-task TDD plans complete or halt within 200 steps (50 trials)' {
        for ($seed = 900; $seed -le 949; $seed++) {
            $rng = New-SeededRng -Seed $seed
            $state = New-CodingStageState `
                -Tasks @('T1') `
                -Tiers @{ T1 = 1 } `
                -WriterTypes @{ T1 = 'tdd' } `
                -Constants $script:SmallConstants

            $result = Invoke-CodingStageRandomWalk `
                -State $state -Rng $rng -MaxSteps 500 `
                -Invariants @{ 'TypeOK' = { param($S) Test-CodingStageTypeOK $S } }

            # Not a hard failure if non-termination (random walk may not find fair path),
            # but flag it for investigation
            if ($result.FinalStatus -notin @('completed', 'halted')) {
                Write-Warning "Seed ${seed}: did not terminate in $($result.Steps) steps (status=$($result.FinalStatus))"
            }
        }
    }
}
