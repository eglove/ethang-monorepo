# =============================================================================
# property-runner.ps1 — Property-based testing harness for Pester
# Executes N trials with seeded RNG, checks invariants at every step.
# =============================================================================

$ErrorActionPreference = 'Stop'

function Test-AllInvariant {
    <#
    .SYNOPSIS
        Evaluates all invariant scriptblocks against current state and config.
    .OUTPUTS
        Name of first failing invariant, or $null if all pass.
    #>
    param(
        [Parameter(Mandatory)][hashtable]$State,
        $Config,
        [Parameter(Mandatory)][hashtable]$Invariants
    )

    foreach ($name in $Invariants.Keys) {
        $check = $Invariants[$name]
        $passed = if ($null -ne $Config) {
            & $check $State $Config
        } else {
            & $check $State
        }
        if (-not $passed) {
            return $name
        }
    }
    return $null
}

function Format-PropertyFailure {
    <#
    .SYNOPSIS
        Formats a property check failure for Pester diagnostic output.
    #>
    param([Parameter(Mandatory)][hashtable]$Result)

    if ($Result.Passed) { return 'All trials passed' }

    $lines = @(
        "PROPERTY FAILURE"
        "  Seed:      $($Result.FailingSeed)"
        "  Invariant: $($Result.Violation)"
        "  Step:      $($Result.FailingStep)"
        "  State:"
    )

    if ($Result.FailingState) {
        foreach ($key in ($Result.FailingState.Keys | Sort-Object)) {
            $lines += "    $key = $($Result.FailingState[$key])"
        }
    }

    if ($Result.Trace -and $Result.Trace.Count -gt 0) {
        $traceStr = $Result.Trace -join ' -> '
        if ($traceStr.Length -gt 500) {
            $traceStr = $traceStr.Substring(0, 500) + '...'
        }
        $lines += "  Trace: $traceStr"
    }

    return ($lines -join "`n")
}

function Invoke-PropertyCheck {
    <#
    .SYNOPSIS
        Core PBT runner. Executes $NumTrials random scenarios, checking
        invariants after every state transition.
    .PARAMETER NumTrials
        Number of random test cases to generate.
    .PARAMETER SeedBase
        Starting seed (trial i uses seed SeedBase + i).
    .PARAMETER Setup
        ScriptBlock: takes [System.Random]$Rng, returns scenario context hashtable.
    .PARAMETER Driver
        ScriptBlock: takes scenario context, returns @{ FinalState; Trace; Steps;
        InvariantViolation (name or $null); FailingStep (int or $null); FailingState }.
    .PARAMETER Invariants
        Hashtable of name -> scriptblock. Each takes (State, Config) and returns $true/$false.
        Passed to the Driver for per-step checking.
    .OUTPUTS
        PSCustomObject with Passed, TrialsRun, FailingSeed, Violation, FailingStep,
        FailingState, Trace.
    #>
    param(
        [int]$NumTrials = 100,
        [int]$SeedBase = 1,
        [Parameter(Mandatory)][scriptblock]$Setup,
        [Parameter(Mandatory)][scriptblock]$Driver,
        [Parameter(Mandatory)][hashtable]$Invariants
    )

    for ($i = 0; $i -lt $NumTrials; $i++) {
        $seed = $SeedBase + $i
        $rng = New-SeededRng -Seed $seed

        # Setup scenario
        $ctx = & $Setup $rng
        $ctx['Invariants'] = $Invariants

        # Drive scenario
        $driverResult = & $Driver $ctx

        if ($driverResult.InvariantViolation) {
            return @{
                Passed       = $false
                TrialsRun    = $i + 1
                FailingSeed  = $seed
                Violation    = $driverResult.InvariantViolation
                FailingStep  = $driverResult.FailingStep
                FailingState = $driverResult.FailingState
                Trace        = $driverResult.Trace
            }
        }
    }

    return @{
        Passed       = $true
        TrialsRun    = $NumTrials
        FailingSeed  = $null
        Violation    = $null
        FailingStep  = $null
        FailingState = $null
        Trace        = $null
    }
}

function Invoke-ReviewerPbtDriver {
    <#
    .SYNOPSIS
        Generalized state machine driver for PipelineReviewers PBT.
        Extends the pattern from review-liveness.Tests.ps1 with:
        - Invariant checking at every step
        - Diff staleness injection
    .PARAMETER Ctx
        Scenario context from Setup. Expected keys:
          State, Config, VerdictSeq, EscalationSeq, GateType, Invariants
    #>
    param([Parameter(Mandatory)][hashtable]$Ctx)

    $state        = $Ctx.State
    $config       = $Ctx.Config
    $verdictSeq   = $Ctx.VerdictSeq
    $escalationSeq = if ($Ctx.ContainsKey('EscalationSeq')) { $Ctx.EscalationSeq } else { @('KeepGoing') * 20 }
    $gateType     = $Ctx.GateType
    $invariants   = $Ctx.Invariants

    $trace = [System.Collections.ArrayList]::new()
    $verdictIdx = 0
    $escalationIdx = 0
    $maxSteps = 500  # generous upper bound since retry limits have been removed
    $step = 0

    # Enter review gate
    Enter-ReviewGate -State $state -Config $config -GateType $gateType
    $null = $trace.Add("enter:$gateType")

    # Check invariants after entry
    $violation = Test-AllInvariant -State $state -Config $config -Invariants $invariants
    if ($violation) {
        return @{
            InvariantViolation = $violation
            FailingStep        = 0
            FailingState       = $state.Clone()
            Trace              = $trace.ToArray()
            FinalState         = $state.pipelineState
            Steps              = 0
        }
    }

    while (-not (Test-PipelineTerminal -State $state)) {
        $step++
        if ($step -gt $maxSteps) {
            return @{
                InvariantViolation = "NonTermination(maxSteps=$maxSteps)"
                FailingStep        = $step
                FailingState       = $state.Clone()
                Trace              = $trace.ToArray()
                FinalState         = $state.pipelineState
                Steps              = $step
            }
        }

        # Handle fix states
        if ($state.pipelineState -in @('reviewFix', 'finalReviewFix')) {
            $null = $trace.Add("fix:$($state.pipelineState)")
            Complete-ReviewFix -State $state -Config $config
            $null = $trace.Add("fixComplete:$($state.pipelineState)")

            $violation = Test-AllInvariant -State $state -Config $config -Invariants $invariants
            if ($violation) {
                return @{
                    InvariantViolation = $violation
                    FailingStep        = $step
                    FailingState       = $state.Clone()
                    Trace              = $trace.ToArray()
                    FinalState         = $state.pipelineState
                    Steps              = $step
                }
            }
            continue
        }

        # Reached mergeQueue — exit for pre-merge
        if ($state.pipelineState -eq 'mergeQueue') {
            $null = $trace.Add('mergeQueue:exit')
            break
        }

        # Get next verdict
        $verdictStr = if ($verdictIdx -lt $verdictSeq.Count) {
            $verdictSeq[$verdictIdx++]
        } else { 'pass' }

        $verdict = [PSCustomObject]@{
            Verdict           = $verdictStr
            Blockers          = if ($verdictStr -eq 'fail') {
                @([PSCustomObject]@{
                    Reviewer = 'pbt-gen'; Severity = 'high'
                    Description = "PBT blocker seed"; Files = @('f.ts'); Suggestion = 'Fix'
                })
            } else { @() }
            Notes             = @()
            SelectedReviewers = @('pbt')
            ExcludedReviewers = @()
        }

        $resolveFunc = if ($gateType -eq 'preMerge') { 'Resolve-PreMergeVerdict' } else { 'Resolve-FinalMergeVerdict' }

        try {
            $result = & $resolveFunc -State $state -Config $config -Verdict $verdict
            $null = $trace.Add("$($verdictStr):$($result.Action)")

            if ($result.Action -eq 'mergeQueue' -or $result.Action -eq 'complete') {
                $violation = Test-AllInvariant -State $state -Config $config -Invariants $invariants
                if ($violation) {
                    return @{
                        InvariantViolation = $violation
                        FailingStep        = $step
                        FailingState       = $state.Clone()
                        Trace              = $trace.ToArray()
                        FinalState         = $state.pipelineState
                        Steps              = $step
                    }
                }
                break
            }
        }
        catch {
            if ($_.Exception.Message -match 'exhausted') {
                $null = $trace.Add("$($verdictStr):exhausted")

                $escChoice = if ($escalationIdx -lt $escalationSeq.Count) {
                    $escalationSeq[$escalationIdx++]
                } else { 'Stop' }

                $savedEsc = ${function:Read-Escalation}
                $capturedChoice = $escChoice
                Set-Item function:Read-Escalation { return @{ Decision = $capturedChoice; Source = 'task' } }.GetNewClosure()
                try {
                    $escResult = Invoke-ReviewEscalation -State $state -Config $config
                }
                finally {
                    Set-Item function:Read-Escalation $savedEsc
                }
                $null = $trace.Add("esc:$($escResult.Action)")
            }
            else {
                throw
            }
        }

        # Check invariants after every step
        $violation = Test-AllInvariant -State $state -Config $config -Invariants $invariants
        if ($violation) {
            return @{
                InvariantViolation = $violation
                FailingStep        = $step
                FailingState       = $state.Clone()
                Trace              = $trace.ToArray()
                FinalState         = $state.pipelineState
                Steps              = $step
            }
        }
    }

    return @{
        InvariantViolation = $null
        FailingStep        = $null
        FailingState       = $null
        Trace              = $trace.ToArray()
        FinalState         = $state.pipelineState
        Steps              = $step
    }
}
