# =============================================================================
# trace-replay.ps1 — Replays TLA+ traces against PowerShell implementation
# =============================================================================

$ErrorActionPreference = 'Stop'

. "$PSScriptRoot/state-mapper.ps1"
. "$PSScriptRoot/action-dispatcher.ps1"

function Invoke-TraceReplay {
    <#
    .SYNOPSIS
        Loads a TLA+ trace JSON file, replays each step against the PowerShell
        state machine, and asserts state equivalence at every step.
    .PARAMETER TraceFile
        Path to the trace JSON file.
    .PARAMETER StopOnFirstMismatch
        If set, stops at the first mismatch instead of collecting all.
    .OUTPUTS
        Hashtable: TraceId, Steps, Mismatches, Passed
    #>
    param(
        [Parameter(Mandatory)][string]$TraceFile,
        [switch]$StopOnFirstMismatch
    )

    $trace = Get-Content $TraceFile -Raw | ConvertFrom-Json -AsHashtable

    # Configure with trace constants
    $savedEnv = @{}
    if ($trace.ContainsKey('constants')) {
        foreach ($key in $trace.constants.Keys) {
            $envKey = "VIBE_$($key -creplace '([A-Z])', '_$1' -replace '^_', '' -replace '__', '_')".ToUpper()
            # Direct mapping for known keys
            switch ($key) {
                'MaxReviewRounds'       { $envKey = 'VIBE_MAX_REVIEW_ROUNDS' }
                'MaxKeepGoingResets'    { $envKey = 'VIBE_MAX_KEEP_GOING_RESETS' }
                'MaxTddKeepGoingPerGate' { $envKey = 'VIBE_MAX_TDD_KEEP_GOING_PER_GATE' }
                'NumTasks'              { $envKey = 'VIBE_NUM_TASKS' }
                'PipelineTimeoutSeconds' { $envKey = 'VIBE_PIPELINE_TIMEOUT_SECONDS' }
            }
            $savedEnv[$envKey] = [System.Environment]::GetEnvironmentVariable($envKey)
            [System.Environment]::SetEnvironmentVariable($envKey, $trace.constants[$key].ToString())
        }
    }

    try {
        $config = Get-PipelineConfig

        # Initialize PowerShell state
        $psState = New-PipelineState

        $mismatches = [System.Collections.ArrayList]::new()

        foreach ($step in $trace.steps) {
            if ($step.stepNum -eq 0) {
                # Verify Init state matches
                $expected = ConvertFrom-TlaReviewerState -TlaState $step.state
                $diff = Compare-PipelineState -Actual $psState -Expected $expected `
                    -StepNum 0 -ActionName 'Init'
                if ($diff.Count -gt 0) {
                    $null = $mismatches.AddRange($diff)
                    if ($StopOnFirstMismatch) { break }
                }
                continue
            }

            # Dispatch the TLA+ action (suppress output from transition functions)
            $null = Invoke-TlaAction -ActionName $step.action -State $psState -Config $config

            # Compare resulting state
            $expected = ConvertFrom-TlaReviewerState -TlaState $step.state
            $diff = Compare-PipelineState -Actual $psState -Expected $expected `
                -StepNum $step.stepNum -ActionName $step.action
            if ($diff.Count -gt 0) {
                $null = $mismatches.AddRange($diff)
                if ($StopOnFirstMismatch) { break }
            }
        }

        return @{
            TraceId    = $trace.traceId
            Steps      = $trace.steps.Count
            Mismatches = $mismatches.ToArray()
            Passed     = $mismatches.Count -eq 0
        }
    }
    finally {
        foreach ($envKey in $savedEnv.Keys) {
            [System.Environment]::SetEnvironmentVariable($envKey, $savedEnv[$envKey])
        }
    }
}
