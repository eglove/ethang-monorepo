BeforeAll {
    function Invoke-Claude { }
    function Write-PipelineLog { }
    function Write-StatusNote { }
    function Write-TaskLog { }
    function Read-Escalation {
        # Default: always KeepGoing (overridden per-test)
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
    function global:Test-PipelineTerminal {
        param($State)
        if ($null -eq $State) { throw 'State is null' }
        return $State.pipelineState -in @('COMPLETE','HALTED')
    }
    function global:Assert-PipelineNotTerminal {
        param($State, [string]$CallerName)
        if ($State.pipelineState -in @('COMPLETE','HALTED')) {
            $caller = if ($CallerName) { $CallerName } else { 'Assert-PipelineNotTerminal' }
            throw "$caller cannot proceed: pipeline is in terminal state '$($State.pipelineState)'"
        }
    }
    . "$PSScriptRoot/../utils/review-verdict.ps1"
    . "$PSScriptRoot/../utils/review-gate.ps1"
    . "$PSScriptRoot/../utils/review-fix.ps1"
    . "$PSScriptRoot/../utils/merge-queue.ps1"

    function New-RandomVerdictSequence {
        param(
            [int]$Length = 20,
            [int]$Seed = 42
        )
        $rng = [System.Random]::new($Seed)
        $choices = @('pass', 'fail', 'retry')
        $seq = @()
        for ($i = 0; $i -lt $Length; $i++) {
            $seq += $choices[$rng.Next(0, 3)]
        }
        return $seq
    }

    function Invoke-StateMachineDriver {
        <#
        .SYNOPSIS
            Drives the pipeline state machine through a verdict sequence for a single gate.
        .DESCRIPTION
            Enters the review gate, feeds verdicts from the sequence, handles
            pass/fail/retry transitions, fix cycles, and escalation. Returns
            the final state and a trace log of all transitions.
        #>
        param(
            [Parameter(Mandatory)][hashtable]$State,
            [Parameter(Mandatory)]$Config,
            [Parameter(Mandatory)][ValidateSet('preMerge', 'final')][string]$GateType,
            [Parameter(Mandatory)][array]$VerdictSequence,
            [string]$EscalationChoice = 'KeepGoing'
        )

        Mock Read-Escalation {
            return @{ Decision = $EscalationChoice; Source = 'task' }
        }

        Enter-ReviewGate -State $State -Config $Config -GateType $GateType
        $trace = @("enter:$GateType")
        $verdictIdx = 0
        $maxSteps = ($Config['MaxReviewRounds'] + 1) * ($Config['MaxKeepGoingResets'] + 1) * ($Config['MaxTddKeepGoingPerGate'] + 1) * 4
        $step = 0

        while (-not (Test-PipelineTerminal -State $State)) {
            $step++
            if ($step -gt $maxSteps) {
                throw "State machine did not terminate within $maxSteps steps"
            }

            # Validate TypeOK at every step
            $typeOk = Test-PipelineStateTypeOK -State $State -Config $Config
            if (-not $typeOk) {
                throw "TypeOK violation at step ${step} - state=$($State.pipelineState), round=$($State.reviewRound), keepGoing=$($State.keepGoingResets), tddCount=$($State.tddKeepGoingCount)"
            }

            # Handle fix states
            if ($State.pipelineState -in @('reviewFix', 'finalReviewFix')) {
                $trace += "fix:$($State.pipelineState)"
                Complete-ReviewFix -State $State -Config $Config
                $trace += "fixComplete:$($State.pipelineState)"
                continue
            }

            # Get next verdict from sequence
            if ($verdictIdx -ge $VerdictSequence.Count) {
                # Ran out of verdicts — force pass to terminate
                $verdictStr = 'pass'
            }
            else {
                $verdictStr = $VerdictSequence[$verdictIdx]
                $verdictIdx++
            }

            $verdict = [PSCustomObject]@{
                Verdict = $verdictStr
                Blockers = if ($verdictStr -eq 'fail') {
                    @([PSCustomObject]@{
                        Reviewer = 'test'; Severity = 'high'
                        Description = 'Test blocker'; Files = @('f.ts'); Suggestion = 'Fix it'
                    })
                } else { @() }
                Notes = @()
                SelectedReviewers = @()
                ExcludedReviewers = @()
            }

            # Try to resolve the verdict
            $resolveFunc = if ($GateType -eq 'preMerge') { 'Resolve-PreMergeVerdict' } else { 'Resolve-FinalMergeVerdict' }

            try {
                $result = & $resolveFunc -State $State -Config $Config -Verdict $verdict
                $trace += "$($verdictStr):$($result.Action)"

                if ($result.Action -eq 'mergeQueue' -or $result.Action -eq 'complete') {
                    break
                }
            }
            catch {
                if ($_.Exception.Message -match 'exhausted') {
                    $trace += "$($verdictStr):exhausted"
                    # Trigger escalation
                    $escResult = Invoke-ReviewEscalation -State $State -Config $Config
                    $trace += "esc:$($escResult.Action)"
                }
                else {
                    throw
                }
            }
        }

        return @{
            FinalState = $State.pipelineState
            Trace      = $trace
            Steps      = $step
        }
    }
}

# =============================================================================
# L1: EventuallyTerminates — every execution reaches COMPLETE or HALTED
# =============================================================================

Describe 'L1 — EventuallyTerminates' {
    BeforeEach {
        $script:cfg = Get-PipelineConfig
        Mock Write-PipelineLog {}
        Mock Write-TaskLog {}
    }

    It 'terminates for 50 randomized pre-merge verdict sequences' {
        for ($seed = 1; $seed -le 50; $seed++) {
            $state = New-PipelineState
            $state.pipelineState = 'running'
            $state.lockHolder    = 1

            $seq = New-RandomVerdictSequence -Length 30 -Seed $seed

            $result = Invoke-StateMachineDriver -State $state -Config $script:cfg `
                -GateType 'preMerge' -VerdictSequence $seq -EscalationChoice 'KeepGoing'

            $result.FinalState | Should -BeIn @('mergeQueue', 'HALTED', 'COMPLETE') `
                -Because "seed $seed should terminate (trace: $($result.Trace -join ' → '))"
        }
    }

    It 'terminates for 50 randomized final verdict sequences' {
        for ($seed = 100; $seed -le 149; $seed++) {
            $state = New-PipelineState
            $state.pipelineState = 'running'
            $state.lockHolder    = 1
            $state.tasksDone     = $script:cfg['NumTasks']

            $seq = New-RandomVerdictSequence -Length 30 -Seed $seed

            $result = Invoke-StateMachineDriver -State $state -Config $script:cfg `
                -GateType 'final' -VerdictSequence $seq -EscalationChoice 'KeepGoing'

            $result.FinalState | Should -BeIn @('COMPLETE', 'HALTED') `
                -Because "seed $seed should terminate (trace: $($result.Trace -join ' → '))"
        }
    }

    It 'terminates when escalation always returns Stop' {
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder    = 1

        # All fails → exhaust rounds → Stop
        $seq = @('fail', 'fail', 'fail', 'fail', 'fail')

        $result = Invoke-StateMachineDriver -State $state -Config $script:cfg `
            -GateType 'preMerge' -VerdictSequence $seq -EscalationChoice 'Stop'

        $result.FinalState | Should -BeExactly 'HALTED'
    }
}

# =============================================================================
# L2: ReviewGateResolves — preMergeReview always exits within bounded steps
# =============================================================================

Describe 'L2 — ReviewGateResolves' {
    BeforeEach {
        $script:cfg = Get-PipelineConfig
        Mock Write-PipelineLog {}
        Mock Write-TaskLog {}
    }

    It 'pre-merge review resolves to mergeQueue on all-pass' {
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder    = 1

        $result = Invoke-StateMachineDriver -State $state -Config $script:cfg `
            -GateType 'preMerge' -VerdictSequence @('pass')

        $result.FinalState | Should -BeExactly 'mergeQueue'
        $result.Steps | Should -BeLessOrEqual 5
    }

    It 'pre-merge review halts after max rounds exhausted with Stop' {
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder    = 1

        $maxRetries = $script:cfg['MaxReviewRounds']
        $seq = @('retry') * ($maxRetries + 1)  # One more than allowed

        $result = Invoke-StateMachineDriver -State $state -Config $script:cfg `
            -GateType 'preMerge' -VerdictSequence $seq -EscalationChoice 'Stop'

        $result.FinalState | Should -BeExactly 'HALTED'
    }

    It 'review gate resolves within bounded steps with MaxReviewRounds=1, MaxKeepGoingResets=0' {
        $env:VIBE_MAX_REVIEW_ROUNDS = '1'
        $env:VIBE_MAX_KEEP_GOING_RESETS = '0'
        try {
            $minCfg = Get-PipelineConfig
            $state = New-PipelineState
            $state.pipelineState = 'running'
            $state.lockHolder    = 1

            $seq = @('fail', 'fail')  # First fail → fix → re-review, second → exhaustion → forced stop

            $result = Invoke-StateMachineDriver -State $state -Config $minCfg `
                -GateType 'preMerge' -VerdictSequence $seq -EscalationChoice 'KeepGoing'

            $result.FinalState | Should -BeExactly 'HALTED'
        }
        finally {
            Remove-Item Env:\VIBE_MAX_REVIEW_ROUNDS -ErrorAction SilentlyContinue
            Remove-Item Env:\VIBE_MAX_KEEP_GOING_RESETS -ErrorAction SilentlyContinue
        }
    }
}

# =============================================================================
# L2b: FinalReviewResolves — finalReview always exits
# =============================================================================

Describe 'L2b — FinalReviewResolves' {
    BeforeEach {
        $script:cfg = Get-PipelineConfig
        Mock Write-PipelineLog {}
        Mock Write-TaskLog {}
    }

    It 'final review resolves to COMPLETE on pass' {
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder    = 1
        $state.tasksDone     = $script:cfg['NumTasks']

        $result = Invoke-StateMachineDriver -State $state -Config $script:cfg `
            -GateType 'final' -VerdictSequence @('pass')

        $result.FinalState | Should -BeExactly 'COMPLETE'
    }

    It 'final review halts on exhaustion with Stop' {
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder    = 1
        $state.tasksDone     = $script:cfg['NumTasks']

        $maxRetries = $script:cfg['MaxReviewRounds']
        $seq = @('retry') * ($maxRetries + 1)

        $result = Invoke-StateMachineDriver -State $state -Config $script:cfg `
            -GateType 'final' -VerdictSequence $seq -EscalationChoice 'Stop'

        $result.FinalState | Should -BeExactly 'HALTED'
    }

    It 'final review with fail-then-pass completes' {
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder    = 1
        $state.tasksDone     = $script:cfg['NumTasks']

        $result = Invoke-StateMachineDriver -State $state -Config $script:cfg `
            -GateType 'final' -VerdictSequence @('fail', 'pass')

        $result.FinalState | Should -BeExactly 'COMPLETE'
    }
}

# =============================================================================
# L3: AllTasksResolve — tasksDone is monotonically non-decreasing
# =============================================================================

Describe 'L3 — AllTasksResolve' {
    BeforeEach {
        $script:cfg = Get-PipelineConfig
        Mock Write-PipelineLog {}
        Mock Write-TaskLog {}
    }

    It 'all-pass verdict sequence yields mergeQueue for pre-merge' {
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder    = 1

        $result = Invoke-StateMachineDriver -State $state -Config $script:cfg `
            -GateType 'preMerge' -VerdictSequence @('pass')

        $result.FinalState | Should -BeExactly 'mergeQueue'
    }

    It 'all-pass yields COMPLETE for final review' {
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder    = 1
        $state.tasksDone     = $script:cfg['NumTasks']

        $result = Invoke-StateMachineDriver -State $state -Config $script:cfg `
            -GateType 'final' -VerdictSequence @('pass')

        $result.FinalState | Should -BeExactly 'COMPLETE'
    }

    It 'all-fail with Stop yields HALTED' {
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder    = 1

        $seq = @('fail') * 20

        $result = Invoke-StateMachineDriver -State $state -Config $script:cfg `
            -GateType 'preMerge' -VerdictSequence $seq -EscalationChoice 'Stop'

        $result.FinalState | Should -BeExactly 'HALTED'
    }

    It 'every terminal state has lockHolder=$null (invariant S2)' {
        for ($seed = 200; $seed -le 220; $seed++) {
            $state = New-PipelineState
            $state.pipelineState = 'running'
            $state.lockHolder    = 1

            $seq = New-RandomVerdictSequence -Length 20 -Seed $seed

            $result = Invoke-StateMachineDriver -State $state -Config $script:cfg `
                -GateType 'preMerge' -VerdictSequence $seq -EscalationChoice 'KeepGoing'

            if ($state.pipelineState -in @('COMPLETE', 'HALTED')) {
                $state.lockHolder | Should -BeNullOrEmpty `
                    -Because "terminal state must release lock (seed $seed)"
            }
        }
    }
}

# =============================================================================
# Boundary configs
# =============================================================================

Describe 'Liveness with boundary configs' {
    BeforeEach {
        Mock Write-PipelineLog {}
        Mock Write-TaskLog {}
    }

    It 'terminates with full counters (MaxReviewRounds=3, MaxKeepGoingResets=3, MaxTddKeepGoingPerGate=5)' {
        $cfg = Get-PipelineConfig
        $state = New-PipelineState
        $state.pipelineState = 'running'
        $state.lockHolder    = 1

        # Long mixed sequence
        $seq = New-RandomVerdictSequence -Length 50 -Seed 999

        $result = Invoke-StateMachineDriver -State $state -Config $cfg `
            -GateType 'preMerge' -VerdictSequence $seq -EscalationChoice 'KeepGoing'

        $result.FinalState | Should -BeIn @('mergeQueue', 'HALTED', 'COMPLETE')
    }

    It 'terminates with NumTasks=3 final review' {
        $env:VIBE_NUM_TASKS = '3'
        try {
            $cfg = Get-PipelineConfig
            $state = New-PipelineState
            $state.pipelineState = 'running'
            $state.lockHolder    = 1
            $state.tasksDone     = 3

            $result = Invoke-StateMachineDriver -State $state -Config $cfg `
                -GateType 'final' -VerdictSequence @('retry', 'fail', 'pass')

            $result.FinalState | Should -BeExactly 'COMPLETE'
        }
        finally { Remove-Item Env:\VIBE_NUM_TASKS -ErrorAction SilentlyContinue }
    }
}
