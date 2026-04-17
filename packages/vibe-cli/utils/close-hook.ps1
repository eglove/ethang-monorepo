# close-hook.ps1
# Per-agent close hook — fires after each Invoke-Claude returns.
# Triggers the graph write cycle via tsx packages/vibe-cli/graph/index.ts.

function Invoke-CloseHook {
    param(
        [int]$AgentIndex = 0,
        [string]$OutputPath = 'CLAUDE.md',
        [int]$MaxAgents = 1,
        [int]$TimeoutSeconds = 30,
        [string]$PipelineState = 'running',
        [scriptblock]$TsxRunner = $null,   # injected for tests
        [hashtable]$InitialState = $null,  # injected for tests
        [switch]$SimulateTimeout           # forces timeout path in tests
    )

    # Load or clone state
    $state = if ($InitialState) { $InitialState.Clone() } else { Load-GraphState }

    # GraphHaltCleanup: halted pipeline — set warn, leave counts/markdownState untouched
    if ($PipelineState -eq 'halted') {
        $state.graphState = 'warn'
        return $state
    }

    # -----------------------------------------------------------------------
    # Run tsx (or test double).  agentsCompleted is incremented ONLY after
    # the process exits so the sequencing invariant (S32) is satisfied.
    # -----------------------------------------------------------------------
    $success = $false
    $warnEmitted = $false
    $warnMessage = $null

    if ($SimulateTimeout) {
        # Timeout path: kill process, emit WARN, treat as failure, continue
        $warnMessage = "[WARN: closeHookTimeout agent=$AgentIndex]"
        Write-Output $warnMessage
        $warnEmitted = $true
        $success = $false
    }
    elseif ($null -ne $TsxRunner) {
        # Test hook — invoke the scriptblock
        try {
            & $TsxRunner
            $success = $true
        }
        catch {
            $success = $false
        }
    }
    else {
        # Real tsx invocation with timeout
        $proc = Start-Process `
            -FilePath 'tsx' `
            -ArgumentList "packages/vibe-cli/graph/index.ts", $OutputPath, $MaxAgents `
            -PassThru `
            -NoNewWindow

        $exited = $proc.WaitForExit($TimeoutSeconds * 1000)

        if (-not $exited) {
            # Kill and emit WARN
            try { $proc.Kill() } catch { }
            $warnMessage = "[WARN: closeHookTimeout agent=$AgentIndex]"
            Write-Output $warnMessage
            $warnEmitted = $true
            $success = $false
        }
        else {
            $success = ($proc.ExitCode -eq 0)
        }
    }

    # agentsCompleted incremented AFTER tsx exits (S32, S37)
    $state.agentsCompleted++

    if ($success) {
        $state.markdownState = 'current'
    }
    else {
        $state.markdownState = 'stale'
    }

    $state.graphState = if ($state.agentsCompleted -ge $MaxAgents) { 'done' } else { 'collecting' }

    if ($warnEmitted) {
        $state.warnEmitted = $true
        $state.warnMessage = $warnMessage
    }

    return $state
}

# ---------------------------------------------------------------------------
# State persistence helpers (used when no InitialState is injected)
# ---------------------------------------------------------------------------

function Load-GraphState {
    $path = if ($env:VIBE_CLI_GRAPH_STATE) {
        $env:VIBE_CLI_GRAPH_STATE
    }
    else {
        Join-Path $PSScriptRoot '../state/graph-state.json'
    }

    if (Test-Path $path) {
        $json = Get-Content $path -Raw | ConvertFrom-Json
        return @{
            agentsCompleted = [int]$json.agentsCompleted
            markdownState   = [string]$json.markdownState
            graphState      = [string]$json.graphState
        }
    }

    return @{
        agentsCompleted = 0
        markdownState   = 'none'
        graphState      = 'collecting'
    }
}

function Save-GraphState {
    param([hashtable]$State)

    $path = if ($env:VIBE_CLI_GRAPH_STATE) {
        $env:VIBE_CLI_GRAPH_STATE
    }
    else {
        Join-Path $PSScriptRoot '../state/graph-state.json'
    }

    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

    $State | ConvertTo-Json | Set-Content $path -Encoding UTF8
}

# ---------------------------------------------------------------------------
# Entry point — only executed when the script is run directly (not dot-sourced)
# ---------------------------------------------------------------------------
if ($MyInvocation.InvocationName -ne '.') {
    $hookResult = Invoke-CloseHook @PSBoundParameters
    Save-GraphState -State $hookResult
}
