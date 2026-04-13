# =============================================================================
# trace-replay.Tests.ps1 — TLA+ trace replay tests for PipelineReviewers
# Replays pre-generated traces against real PowerShell transition functions.
# Tag: Trace
# =============================================================================

BeforeAll {
    # Stub side-effect functions (defined before loading modules)
    function Invoke-Claude { }
    function Write-PipelineLog { }
    function Write-StatusNote { }
    function Write-TaskLog { }
    function Invoke-RedPhase {
        return @{ Status = 'pass'; TestFiles = @('t.ps1'); Counters = @{ redAttempts = 1 } }
    }
    function Invoke-GreenPhase {
        return @{ Status = 'pass'; Counters = @{ greenAttempts = 1 } }
    }
    function Invoke-CleanupPhase {
        return @{ Status = 'pass'; Counters = @{ cleanupCleanPasses = 2 } }
    }

    # Load production modules (review-gate.ps1 dots read-escalation.ps1)
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
    . "$PSScriptRoot/../utils/review-verdict.ps1"
    . "$PSScriptRoot/../utils/review-gate.ps1"
    . "$PSScriptRoot/../utils/review-fix.ps1"

    # Re-define Read-Escalation AFTER loading review-gate.ps1 (which overwrites it)
    function Read-Escalation {
        return @{ Decision = 'KeepGoing'; Source = 'task' }
    }

    # Load trace replay harness
    . "$PSScriptRoot/traces/trace-replay.ps1"
}

# =============================================================================
# PipelineReviewers trace replays
# =============================================================================

Describe 'TLA+ Trace Replay — PipelineReviewers' -Tag 'Trace' {
    BeforeEach {
        Mock Write-PipelineLog {}
        Mock Write-TaskLog {}
    }

    It 'replays trace: happy-path-001' {
        $result = Invoke-TraceReplay -TraceFile "$PSScriptRoot/traces/fixtures/reviewers/happy-path-001.json" -StopOnFirstMismatch
        $detail = ($result.Mismatches | ForEach-Object { "Step $($_.StepNum)($($_.Action)):$($_.Field) exp=$($_.Expected) act=$($_.Actual)" }) -join '; '
            $result.Passed | Should -BeTrue -Because $detail
    }

    It 'replays trace: fail-fix-pass-001' {
        $result = Invoke-TraceReplay -TraceFile "$PSScriptRoot/traces/fixtures/reviewers/fail-fix-pass-001.json" -StopOnFirstMismatch
        $detail = ($result.Mismatches | ForEach-Object { "Step $($_.StepNum)($($_.Action)):$($_.Field) exp=$($_.Expected) act=$($_.Actual)" }) -join '; '
            $result.Passed | Should -BeTrue -Because $detail
    }

    It 'replays trace: escalation-stop-001' {
        $result = Invoke-TraceReplay -TraceFile "$PSScriptRoot/traces/fixtures/reviewers/escalation-stop-001.json" -StopOnFirstMismatch
        $detail = ($result.Mismatches | ForEach-Object { "Step $($_.StepNum)($($_.Action)):$($_.Field) exp=$($_.Expected) act=$($_.Actual)" }) -join '; '
            $result.Passed | Should -BeTrue -Because $detail
    }

    It 'replays trace: keep-going-recovery-001' {
        $result = Invoke-TraceReplay -TraceFile "$PSScriptRoot/traces/fixtures/reviewers/keep-going-recovery-001.json" -StopOnFirstMismatch
        $detail = ($result.Mismatches | ForEach-Object { "Step $($_.StepNum)($($_.Action)):$($_.Field) exp=$($_.Expected) act=$($_.Actual)" }) -join '; '
            $result.Passed | Should -BeTrue -Because $detail
    }

    It 'replays trace: tlc-retry-pass-001' {
        $result = Invoke-TraceReplay -TraceFile "$PSScriptRoot/traces/fixtures/reviewers/tlc-retry-pass-001.json" -StopOnFirstMismatch
        $detail = ($result.Mismatches | ForEach-Object { "Step $($_.StepNum)($($_.Action)):$($_.Field) exp=$($_.Expected) act=$($_.Actual)" }) -join '; '
            $result.Passed | Should -BeTrue -Because $detail
    }

    It 'replays trace: tlc-multi-fix-001' {
        $result = Invoke-TraceReplay -TraceFile "$PSScriptRoot/traces/fixtures/reviewers/tlc-multi-fix-001.json" -StopOnFirstMismatch
        $detail = ($result.Mismatches | ForEach-Object { "Step $($_.StepNum)($($_.Action)):$($_.Field) exp=$($_.Expected) act=$($_.Actual)" }) -join '; '
            $result.Passed | Should -BeTrue -Because $detail
    }

    It 'replays trace: tlc-final-fix-001' {
        $result = Invoke-TraceReplay -TraceFile "$PSScriptRoot/traces/fixtures/reviewers/tlc-final-fix-001.json" -StopOnFirstMismatch
        $detail = ($result.Mismatches | ForEach-Object { "Step $($_.StepNum)($($_.Action)):$($_.Field) exp=$($_.Expected) act=$($_.Actual)" }) -join '; '
            $result.Passed | Should -BeTrue -Because $detail
    }
}

# =============================================================================
# Trace termination verification
# =============================================================================

Describe 'TLA+ Trace Terminal States' -Tag 'Trace' {
    BeforeEach {
        Mock Write-PipelineLog {}
        Mock Write-TaskLog {}
    }

    It 'happy-path traces end in COMPLETE' {
        $traceDir = "$PSScriptRoot/traces/fixtures/reviewers"
        $happyTraces = Get-ChildItem "$traceDir/happy-path-*.json" -ErrorAction SilentlyContinue
        foreach ($f in $happyTraces) {
            $trace = Get-Content $f.FullName -Raw | ConvertFrom-Json -AsHashtable
            $lastStep = $trace.steps[-1]
            $lastStep.state.pipelineState | Should -BeExactly 'COMPLETE' `
                -Because "trace $($f.BaseName) should end in COMPLETE"
        }
    }

    It 'escalation-stop traces end in HALTED' {
        $traceDir = "$PSScriptRoot/traces/fixtures/reviewers"
        $haltTraces = Get-ChildItem "$traceDir/escalation-stop-*.json" -ErrorAction SilentlyContinue
        foreach ($f in $haltTraces) {
            $trace = Get-Content $f.FullName -Raw | ConvertFrom-Json -AsHashtable
            $lastStep = $trace.steps[-1]
            $lastStep.state.pipelineState | Should -BeExactly 'HALTED' `
                -Because "trace $($f.BaseName) should end in HALTED"
        }
    }

}
