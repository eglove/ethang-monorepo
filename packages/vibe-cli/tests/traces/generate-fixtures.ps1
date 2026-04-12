# =============================================================================
# generate-fixtures.ps1 — Generates trace fixture JSON files from the
# PowerShell state machine models (faithful mirrors of TLA+ specs).
# Uses seeded random walks + targeted scenario walks.
# =============================================================================

param(
    [int]$NumRandomTraces = 10,
    [int]$Seed = 42
)

$ErrorActionPreference = 'Stop'

# Load dependencies
function Invoke-Claude { }
function Write-PipelineLog { }
function Write-StatusNote { }
function Write-TaskLog { }
function Read-Escalation { return @{ Decision = 'KeepGoing'; Source = 'task' } }
function Invoke-RedPhase { return @{ Status = 'pass'; TestFiles = @('t.ps1') } }
function Invoke-GreenPhase { return @{ Status = 'pass' } }
function Invoke-CleanupPhase { return @{ Status = 'pass' } }

. "$PSScriptRoot/../../utils/config.ps1"
# Stub: pipeline-state.ps1 was removed in code-simplify
if (-not (Get-Command New-PipelineState -ErrorAction SilentlyContinue)) {
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
}
if (-not (Get-Command Test-PipelineStateTypeOK -ErrorAction SilentlyContinue)) {
    function global:Test-PipelineStateTypeOK { param($State, $Config) return $true }
}
if (-not (Get-Command Test-PipelineTerminal -ErrorAction SilentlyContinue)) {
    function global:Test-PipelineTerminal {
        param($State)
        if ($null -eq $State) { throw 'State is null' }
        return $State.pipelineState -in @('COMPLETE','HALTED')
    }
}
. "$PSScriptRoot/../../utils/review-verdict.ps1"
. "$PSScriptRoot/../../utils/review-gate.ps1"
. "$PSScriptRoot/../../utils/review-fix.ps1"
. "$PSScriptRoot/../helpers/property-gen.ps1"
. "$PSScriptRoot/../helpers/coding-stage-model.ps1"

$reviewerOutDir = "$PSScriptRoot/fixtures/reviewers"
$codingOutDir = "$PSScriptRoot/fixtures/coding-stage"

# =============================================================================
# Helper: Capture PipelineReviewers state as a snapshot
# =============================================================================
function Get-ReviewerSnapshot([hashtable]$State) {
    return @{
        pipelineState     = $State.pipelineState
        lockHolder        = $State.lockHolder
        reviewRound       = $State.reviewRound
        keepGoingResets    = $State.keepGoingResets
        tddKeepGoingCount = $State.tddKeepGoingCount
        verdict           = $State.verdict
        tasksDone         = $State.tasksDone
        gateTimedOut      = $State.gateTimedOut
        globalTimedOut    = $State.globalTimedOut
        reviewGateType    = $State.reviewGateType
    }
}

# =============================================================================
# Helper: Run a PipelineReviewers scenario with explicit action sequence
# =============================================================================
function New-ReviewerTrace {
    param(
        [string]$TraceId,
        [string]$Description,
        [hashtable]$Constants,
        [scriptblock]$Scenario
    )

    $steps = [System.Collections.ArrayList]::new()

    # Set env vars for config
    $saved = @{}
    foreach ($k in $Constants.Keys) {
        $envKey = switch ($k) {
            'MaxReviewRounds'       { 'VIBE_MAX_REVIEW_ROUNDS' }
            'MaxKeepGoingResets'    { 'VIBE_MAX_KEEP_GOING_RESETS' }
            'MaxTddKeepGoingPerGate' { 'VIBE_MAX_TDD_KEEP_GOING_PER_GATE' }
            'NumTasks'              { 'VIBE_NUM_TASKS' }
        }
        if ($envKey) {
            $saved[$envKey] = [Environment]::GetEnvironmentVariable($envKey)
            [Environment]::SetEnvironmentVariable($envKey, $Constants[$k].ToString())
        }
    }

    try {
        $config = Get-PipelineConfig
        $state = New-PipelineState

        # Step 0: Init
        $null = $steps.Add(@{ stepNum = 0; action = 'Init'; state = (Get-ReviewerSnapshot $state) })

        # Run scenario (passes state, config, steps list)
        & $Scenario $state $config $steps
    }
    finally {
        foreach ($k in $saved.Keys) { [Environment]::SetEnvironmentVariable($k, $saved[$k]) }
    }

    return @{
        spec        = 'PipelineReviewers'
        traceId     = $TraceId
        description = $Description
        constants   = $Constants
        steps       = $steps.ToArray()
    }
}

function Add-Step([System.Collections.ArrayList]$Steps, [string]$Action, [hashtable]$State) {
    $null = $Steps.Add(@{
        stepNum = $Steps.Count
        action  = $Action
        state   = (Get-ReviewerSnapshot $State)
    })
}

# =============================================================================
# Generate PipelineReviewers traces
# =============================================================================

Write-Host "Generating PipelineReviewers traces..."

$constants = @{ MaxReviewRounds = 3; MaxKeepGoingResets = 3; MaxTddKeepGoingPerGate = 5; NumTasks = 1 }

# Trace: retry-then-pass
$trace = New-ReviewerTrace -TraceId 'tlc-retry-pass-001' -Description 'Retry once then pass pre-merge -> COMPLETE' -Constants $constants -Scenario {
    param($s, $c, $steps)
    $s.pipelineState = 'locked'; $s.lockHolder = 1; Add-Step $steps 'AcquireLock' $s
    $s.pipelineState = 'running'; Add-Step $steps 'StartRunning' $s
    Enter-ReviewGate -State $s -Config $c -GateType 'preMerge'; Add-Step $steps 'EnterPreMergeReview' $s
    $v = [PSCustomObject]@{ Verdict='retry'; Blockers=@(); Notes=@(); SelectedReviewers=@(); ExcludedReviewers=@() }
    $null = Resolve-PreMergeVerdict -State $s -Config $c -Verdict $v; Add-Step $steps 'HandleRetryPreMerge' $s
    $v2 = [PSCustomObject]@{ Verdict='pass'; Blockers=@(); Notes=@(); SelectedReviewers=@('sec'); ExcludedReviewers=@() }
    $null = Resolve-PreMergeVerdict -State $s -Config $c -Verdict $v2; Add-Step $steps 'HandlePassPreMerge' $s
    $s.tasksDone++; $s.pipelineState = 'running'; $s.reviewGateType = 'none'; Add-Step $steps 'TaskMerged' $s
    Enter-ReviewGate -State $s -Config $c -GateType 'final'; Add-Step $steps 'EnterFinalReview' $s
    $v3 = [PSCustomObject]@{ Verdict='pass'; Blockers=@(); Notes=@(); SelectedReviewers=@('sec'); ExcludedReviewers=@() }
    $null = Resolve-FinalMergeVerdict -State $s -Config $c -Verdict $v3; Add-Step $steps 'HandlePassFinal' $s
}
$trace | ConvertTo-Json -Depth 10 | Set-Content "$reviewerOutDir/tlc-retry-pass-001.json" -Encoding UTF8
Write-Host "  Written: tlc-retry-pass-001.json ($($trace.steps.Count) steps)"

# Trace: fail-fix-fail-fix-pass (multiple fix cycles)
$trace = New-ReviewerTrace -TraceId 'tlc-multi-fix-001' -Description 'Two fail-fix cycles then pass -> COMPLETE' -Constants $constants -Scenario {
    param($s, $c, $steps)
    $s.pipelineState = 'locked'; $s.lockHolder = 1; Add-Step $steps 'AcquireLock' $s
    $s.pipelineState = 'running'; Add-Step $steps 'StartRunning' $s
    Enter-ReviewGate -State $s -Config $c -GateType 'preMerge'; Add-Step $steps 'EnterPreMergeReview' $s
    # Fail 1
    $blocker = [PSCustomObject]@{ Reviewer='sec'; Severity='high'; Description='XSS'; Files=@('a.ts'); Suggestion='Fix' }
    $v = [PSCustomObject]@{ Verdict='fail'; Blockers=@($blocker); Notes=@(); SelectedReviewers=@('sec'); ExcludedReviewers=@() }
    $null = Resolve-PreMergeVerdict -State $s -Config $c -Verdict $v; Add-Step $steps 'HandleFailPreMerge' $s
    Complete-ReviewFix -State $s -Config $c; Add-Step $steps 'ReviewFixComplete' $s
    # Fail 2
    $null = Resolve-PreMergeVerdict -State $s -Config $c -Verdict $v; Add-Step $steps 'HandleFailPreMerge' $s
    Complete-ReviewFix -State $s -Config $c; Add-Step $steps 'ReviewFixComplete' $s
    # Pass
    $v2 = [PSCustomObject]@{ Verdict='pass'; Blockers=@(); Notes=@(); SelectedReviewers=@('sec'); ExcludedReviewers=@() }
    $null = Resolve-PreMergeVerdict -State $s -Config $c -Verdict $v2; Add-Step $steps 'HandlePassPreMerge' $s
    $s.tasksDone++; $s.pipelineState = 'running'; $s.reviewGateType = 'none'; Add-Step $steps 'TaskMerged' $s
    Enter-ReviewGate -State $s -Config $c -GateType 'final'; Add-Step $steps 'EnterFinalReview' $s
    $null = Resolve-FinalMergeVerdict -State $s -Config $c -Verdict $v2; Add-Step $steps 'HandlePassFinal' $s
}
$trace | ConvertTo-Json -Depth 10 | Set-Content "$reviewerOutDir/tlc-multi-fix-001.json" -Encoding UTF8
Write-Host "  Written: tlc-multi-fix-001.json ($($trace.steps.Count) steps)"

# Trace: forced stop (keepGoingResets exhausted)
$smallConst = @{ MaxReviewRounds = 1; MaxKeepGoingResets = 1; MaxTddKeepGoingPerGate = 5; NumTasks = 1 }
$trace = New-ReviewerTrace -TraceId 'tlc-forced-stop-001' -Description 'KeepGoing exhausted -> forced stop -> HALTED' -Constants $smallConst -Scenario {
    param($s, $c, $steps)
    $s.pipelineState = 'locked'; $s.lockHolder = 1; Add-Step $steps 'AcquireLock' $s
    $s.pipelineState = 'running'; Add-Step $steps 'StartRunning' $s
    Enter-ReviewGate -State $s -Config $c -GateType 'preMerge'; Add-Step $steps 'EnterPreMergeReview' $s
    # Retry to exhaust round
    $vr = [PSCustomObject]@{ Verdict='retry'; Blockers=@(); Notes=@(); SelectedReviewers=@(); ExcludedReviewers=@() }
    $null = Resolve-PreMergeVerdict -State $s -Config $c -Verdict $vr; Add-Step $steps 'HandleRetryPreMerge' $s
    # Escalation: KeepGoing (round reset)
    function Read-Escalation { return @{ Decision = 'KeepGoing'; Source = 'task' } }
    $null = Invoke-ReviewEscalation -State $s -Config $c; Add-Step $steps 'ReviewKeepGoing' $s
    # Retry again to re-exhaust
    $null = Resolve-PreMergeVerdict -State $s -Config $c -Verdict $vr; Add-Step $steps 'HandleRetryPreMerge' $s
    # Forced stop (keepGoingResets=1 >= MaxKeepGoingResets=1)
    $null = Invoke-ReviewEscalation -State $s -Config $c; Add-Step $steps 'ReviewForcedStop' $s
}
$trace | ConvertTo-Json -Depth 10 | Set-Content "$reviewerOutDir/tlc-forced-stop-001.json" -Encoding UTF8
Write-Host "  Written: tlc-forced-stop-001.json ($($trace.steps.Count) steps)"

# Trace: gate timeout -> keepGoing recovery
$trace = New-ReviewerTrace -TraceId 'tlc-gate-timeout-keepgoing-001' -Description 'Gate timeout fires, KeepGoing resets gate, pass -> COMPLETE' -Constants $constants -Scenario {
    param($s, $c, $steps)
    $s.pipelineState = 'locked'; $s.lockHolder = 1; Add-Step $steps 'AcquireLock' $s
    $s.pipelineState = 'running'; Add-Step $steps 'StartRunning' $s
    Enter-ReviewGate -State $s -Config $c -GateType 'preMerge'; Add-Step $steps 'EnterPreMergeReview' $s
    # Gate timeout fires
    $s.gateTimedOut = $true; Add-Step $steps 'ReviewGateTimeout' $s
    # KeepGoing for gate timeout
    $s.gateTimedOut = $false; $s.keepGoingResets++; $s.reviewRound = 0; $s.tddKeepGoingCount = 0; $s.verdict = $null
    $s.pipelineState = 'preMergeReview'; Add-Step $steps 'GateTimeoutKeepGoing' $s
    # Pass
    $v = [PSCustomObject]@{ Verdict='pass'; Blockers=@(); Notes=@(); SelectedReviewers=@('sec'); ExcludedReviewers=@() }
    $null = Resolve-PreMergeVerdict -State $s -Config $c -Verdict $v; Add-Step $steps 'HandlePassPreMerge' $s
    $s.tasksDone++; $s.pipelineState = 'running'; $s.reviewGateType = 'none'; Add-Step $steps 'TaskMerged' $s
    Enter-ReviewGate -State $s -Config $c -GateType 'final'; Add-Step $steps 'EnterFinalReview' $s
    $v2 = [PSCustomObject]@{ Verdict='pass'; Blockers=@(); Notes=@(); SelectedReviewers=@('sec'); ExcludedReviewers=@() }
    $null = Resolve-FinalMergeVerdict -State $s -Config $c -Verdict $v2; Add-Step $steps 'HandlePassFinal' $s
}
$trace | ConvertTo-Json -Depth 10 | Set-Content "$reviewerOutDir/tlc-gate-timeout-keepgoing-001.json" -Encoding UTF8
Write-Host "  Written: tlc-gate-timeout-keepgoing-001.json ($($trace.steps.Count) steps)"

# Trace: final review fail-fix-pass
$trace = New-ReviewerTrace -TraceId 'tlc-final-fix-001' -Description 'Final review fails, fix cycle, then pass -> COMPLETE' -Constants $constants -Scenario {
    param($s, $c, $steps)
    $s.pipelineState = 'locked'; $s.lockHolder = 1; Add-Step $steps 'AcquireLock' $s
    $s.pipelineState = 'running'; Add-Step $steps 'StartRunning' $s
    Enter-ReviewGate -State $s -Config $c -GateType 'preMerge'; Add-Step $steps 'EnterPreMergeReview' $s
    $vp = [PSCustomObject]@{ Verdict='pass'; Blockers=@(); Notes=@(); SelectedReviewers=@('sec'); ExcludedReviewers=@() }
    $null = Resolve-PreMergeVerdict -State $s -Config $c -Verdict $vp; Add-Step $steps 'HandlePassPreMerge' $s
    $s.tasksDone++; $s.pipelineState = 'running'; $s.reviewGateType = 'none'; Add-Step $steps 'TaskMerged' $s
    Enter-ReviewGate -State $s -Config $c -GateType 'final'; Add-Step $steps 'EnterFinalReview' $s
    # Fail final
    $blocker = [PSCustomObject]@{ Reviewer='a11y'; Severity='critical'; Description='Missing alt'; Files=@('img.tsx'); Suggestion='Add alt' }
    $vf = [PSCustomObject]@{ Verdict='fail'; Blockers=@($blocker); Notes=@(); SelectedReviewers=@('a11y'); ExcludedReviewers=@() }
    $null = Resolve-FinalMergeVerdict -State $s -Config $c -Verdict $vf; Add-Step $steps 'HandleFailFinal' $s
    # Fix complete (finalReviewFix -> finalReview)
    Complete-ReviewFix -State $s -Config $c; Add-Step $steps 'FinalReviewFixComplete' $s
    # Pass final
    $null = Resolve-FinalMergeVerdict -State $s -Config $c -Verdict $vp; Add-Step $steps 'HandlePassFinal' $s
}
$trace | ConvertTo-Json -Depth 10 | Set-Content "$reviewerOutDir/tlc-final-fix-001.json" -Encoding UTF8
Write-Host "  Written: tlc-final-fix-001.json ($($trace.steps.Count) steps)"

# =============================================================================
# Generate CodingStage traces using the pure model
# =============================================================================

Write-Host ""
Write-Host "Generating CodingStage traces..."

function Get-CodingSnapshot([hashtable]$S) {
    $snap = @{
        currentTier      = $S.currentTier
        pipelineStatus   = $S.pipelineStatus
        escalationActive = $S.escalationActive
        validationStatus = $S.validationStatus
        wsCreationFailed = $S.wsCreationFailed
        finalVerifPhase  = $S.finalVerifPhase
        finalCleanPasses = $S.finalCleanPasses
        finalRemediations = $S.finalRemediations
    }
    foreach ($t in $S._Tasks) {
        $snap["taskPhase_$t"]    = $S.taskPhase[$t]
        $snap["taskStatus_$t"]   = $S.taskStatus[$t]
        $snap["workspace_$t"]    = $S.workspaceExists[$t]
        $snap["merged_$t"]       = $S.workspaceMerged[$t]
        $snap["redRetries_$t"]   = $S.redRetries[$t]
        $snap["greenAttempts_$t"] = $S.greenAttempts[$t]
    }
    return $snap
}

function New-CodingTrace {
    param([string]$TraceId, [string]$Description, [hashtable]$State, [string[]]$ActionSequence)

    $steps = [System.Collections.ArrayList]::new()
    $null = $steps.Add(@{ stepNum = 0; action = 'Init'; state = (Get-CodingSnapshot $State) })

    foreach ($actionSpec in $ActionSequence) {
        $parts = $actionSpec -split '\('
        $action = $parts[0]
        $task = if ($parts.Count -gt 1) { $parts[1].TrimEnd(')') } else { $null }

        $fired = Invoke-ModelAction -S $State -Action $action -Task $task
        if (-not $fired) {
            Write-Warning "Action $actionSpec guard failed at step $($steps.Count)"
            break
        }
        $null = $steps.Add(@{
            stepNum = $steps.Count
            action  = $actionSpec
            state   = (Get-CodingSnapshot $State)
        })
    }

    return @{
        spec        = 'CodingStage'
        traceId     = $TraceId
        description = $Description
        steps       = $steps.ToArray()
    }
}

$consts = @{ MaxRedRetries = 2; MaxTddCycles = 2; MaxFixRounds = 2; MaxMergeRetries = 2; CleanupPasses = 2 }

# Trace: single-task happy path (validate -> red -> green -> cleanup -> done -> merge -> verify -> complete)
$s = New-CodingStageState -Tasks @('T1') -Tiers @{T1=1} -WriterTypes @{T1='tdd'} -Constants $consts
$trace = New-CodingTrace -TraceId 'tlc-single-happy-001' -Description 'Single TDD task: validate -> RED -> GREEN -> cleanup(x2) -> final verify -> completed' -State $s -ActionSequence @(
    'ValidationPasses', 'StartNextTier',
    'RedTestsFail(T1)', 'GreenTestsPass(T1)',
    'CleanupPass(T1)', 'CleanupPass(T1)', 'CleanupComplete(T1)',
    'SingleTaskTierComplete(T1)',
    'StartFinalVerification', 'FinalVerifPass', 'FinalVerifPass', 'FinalVerifComplete'
)
$trace | ConvertTo-Json -Depth 10 | Set-Content "$codingOutDir/tlc-single-happy-001.json" -Encoding UTF8
Write-Host "  Written: tlc-single-happy-001.json ($($trace.steps.Count) steps)"

# Trace: agent writer (no TDD)
$s = New-CodingStageState -Tasks @('T1') -Tiers @{T1=1} -WriterTypes @{T1='agent'} -Constants $consts
$trace = New-CodingTrace -TraceId 'tlc-agent-writer-001' -Description 'Agent writer: validate -> agent_call -> done -> verify -> completed' -State $s -ActionSequence @(
    'ValidationPasses', 'StartNextTier',
    'AgentWriterComplete(T1)', 'SingleTaskTierComplete(T1)',
    'StartFinalVerification', 'FinalVerifPass', 'FinalVerifPass', 'FinalVerifComplete'
)
$trace | ConvertTo-Json -Depth 10 | Set-Content "$codingOutDir/tlc-agent-writer-001.json" -Encoding UTF8
Write-Host "  Written: tlc-agent-writer-001.json ($($trace.steps.Count) steps)"

# Trace: validation failure
$s = New-CodingStageState -Tasks @('T1') -Tiers @{T1=1} -WriterTypes @{T1='tdd'} -Constants $consts
$trace = New-CodingTrace -TraceId 'tlc-validation-fail-001' -Description 'Plan validation fails -> halted' -State $s -ActionSequence @(
    'ValidationFails'
)
$trace | ConvertTo-Json -Depth 10 | Set-Content "$codingOutDir/tlc-validation-fail-001.json" -Encoding UTF8
Write-Host "  Written: tlc-validation-fail-001.json ($($trace.steps.Count) steps)"

# Trace: red retry exhausted -> escalation -> stop
$s = New-CodingStageState -Tasks @('T1') -Tiers @{T1=1} -WriterTypes @{T1='tdd'} -Constants $consts
$trace = New-CodingTrace -TraceId 'tlc-red-exhausted-001' -Description 'RED retry exhausted -> escalation -> stop -> halted' -State $s -ActionSequence @(
    'ValidationPasses', 'StartNextTier',
    'RedTestsPassUnexpectedly(T1)', 'RedRetryRevised(T1)',
    'RedTestsPassUnexpectedly(T1)', 'RedRetryRevised(T1)',
    'RedTestsPassUnexpectedly(T1)', 'RedRetryExhausted(T1)',
    'EscalationStop'
)
$trace | ConvertTo-Json -Depth 10 | Set-Content "$codingOutDir/tlc-red-exhausted-001.json" -Encoding UTF8
Write-Host "  Written: tlc-red-exhausted-001.json ($($trace.steps.Count) steps)"

# Trace: multi-task merge (2 tasks in tier 1)
$s = New-CodingStageState -Tasks @('T1','T2') -Tiers @{T1=1;T2=1} -WriterTypes @{T1='tdd';T2='tdd'} -Constants $consts
$trace = New-CodingTrace -TraceId 'tlc-multi-task-merge-001' -Description '2-task tier: both complete -> serial merge -> final verify -> completed' -State $s -ActionSequence @(
    'ValidationPasses', 'StartNextTier',
    'RedTestsFail(T1)', 'GreenTestsPass(T1)', 'CleanupPass(T1)', 'CleanupPass(T1)', 'CleanupComplete(T1)',
    'RedTestsFail(T2)', 'GreenTestsPass(T2)', 'CleanupPass(T2)', 'CleanupPass(T2)', 'CleanupComplete(T2)',
    'EnqueueForMerge(T1)', 'EnqueueForMerge(T2)',
    'StartMerge', 'MergeSuccess',
    'StartMerge', 'MergeSuccess',
    'StartFinalVerification', 'FinalVerifPass', 'FinalVerifPass', 'FinalVerifComplete'
)
$trace | ConvertTo-Json -Depth 10 | Set-Content "$codingOutDir/tlc-multi-task-merge-001.json" -Encoding UTF8
Write-Host "  Written: tlc-multi-task-merge-001.json ($($trace.steps.Count) steps)"

# Trace: merge conflict resolution
$s = New-CodingStageState -Tasks @('T1','T2') -Tiers @{T1=1;T2=1} -WriterTypes @{T1='tdd';T2='tdd'} -Constants $consts
$trace = New-CodingTrace -TraceId 'tlc-merge-conflict-001' -Description 'Merge conflict -> resolve -> success' -State $s -ActionSequence @(
    'ValidationPasses', 'StartNextTier',
    'RedTestsFail(T1)', 'GreenTestsPass(T1)', 'CleanupPass(T1)', 'CleanupPass(T1)', 'CleanupComplete(T1)',
    'RedTestsFail(T2)', 'GreenTestsPass(T2)', 'CleanupPass(T2)', 'CleanupPass(T2)', 'CleanupComplete(T2)',
    'EnqueueForMerge(T1)', 'StartMerge',
    'MergeConflictResolve', 'MergeSuccess',
    'EnqueueForMerge(T2)', 'StartMerge', 'MergeSuccess',
    'StartFinalVerification', 'FinalVerifPass', 'FinalVerifPass', 'FinalVerifComplete'
)
$trace | ConvertTo-Json -Depth 10 | Set-Content "$codingOutDir/tlc-merge-conflict-001.json" -Encoding UTF8
Write-Host "  Written: tlc-merge-conflict-001.json ($($trace.steps.Count) steps)"

# Trace: green retry with escalation recovery
$s = New-CodingStageState -Tasks @('T1') -Tiers @{T1=1} -WriterTypes @{T1='tdd'} -Constants $consts
$trace = New-CodingTrace -TraceId 'tlc-green-escalation-001' -Description 'GREEN exhausted -> escalation KeepGoing -> complete' -State $s -ActionSequence @(
    'ValidationPasses', 'StartNextTier',
    'RedTestsFail(T1)',
    'GreenTestsFail(T1)', 'GreenRetry(T1)',
    'GreenTestsFail(T1)', 'GreenRetryExhausted(T1)',
    'EscalationKeepGoing(T1)',
    'GreenRetry(T1)', 'GreenTestsPass(T1)',
    'CleanupPass(T1)', 'CleanupPass(T1)', 'CleanupComplete(T1)',
    'SingleTaskTierComplete(T1)',
    'StartFinalVerification', 'FinalVerifPass', 'FinalVerifPass', 'FinalVerifComplete'
)
$trace | ConvertTo-Json -Depth 10 | Set-Content "$codingOutDir/tlc-green-escalation-001.json" -Encoding UTF8
Write-Host "  Written: tlc-green-escalation-001.json ($($trace.steps.Count) steps)"

# Trace: workspace creation failure -> keepGoing -> retry -> complete
$s = New-CodingStageState -Tasks @('T1','T2') -Tiers @{T1=1;T2=1} -WriterTypes @{T1='tdd';T2='tdd'} -Constants $consts
$trace = New-CodingTrace -TraceId 'tlc-workspace-fail-001' -Description 'Workspace creation fails -> KeepGoing -> retry succeeds -> complete' -State $s -ActionSequence @(
    'ValidationPasses',
    'WorkspaceCreationFailure',
    'EscalationKeepGoingWorkspace',
    'StartNextTier',
    'RedTestsFail(T1)', 'GreenTestsPass(T1)', 'CleanupPass(T1)', 'CleanupPass(T1)', 'CleanupComplete(T1)',
    'RedTestsFail(T2)', 'GreenTestsPass(T2)', 'CleanupPass(T2)', 'CleanupPass(T2)', 'CleanupComplete(T2)',
    'EnqueueForMerge(T1)', 'EnqueueForMerge(T2)',
    'StartMerge', 'MergeSuccess', 'StartMerge', 'MergeSuccess',
    'StartFinalVerification', 'FinalVerifPass', 'FinalVerifPass', 'FinalVerifComplete'
)
$trace | ConvertTo-Json -Depth 10 | Set-Content "$codingOutDir/tlc-workspace-fail-001.json" -Encoding UTF8
Write-Host "  Written: tlc-workspace-fail-001.json ($($trace.steps.Count) steps)"

Write-Host ""
Write-Host "Done! Generated traces in:"
Write-Host "  $reviewerOutDir"
Write-Host "  $codingOutDir"
