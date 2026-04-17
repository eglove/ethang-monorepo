<#
.SYNOPSIS
    Per-agent close hook — called after each Invoke-Claude completes.
    Manages hookState transitions and detects pipeline completion.

.DESCRIPTION
    Implements the close-hook subsystem (T10).

    hookState machine:
      idle        — no hook activity (initial/default)
      intercepting — hook is actively intercepting a command
      rewriting    — hook is rewriting the intercepted command
      done         — hook completed successfully
      error        — hook failed (non-fatal — does NOT halt pipeline, S17, L7)

    PipelineComplete condition:
      pipelineState = 'done' when:
        routingState = 'done' AND
        agentsCompleted = MaxAgents AND
        hookState IN {'idle', 'done', 'error'}

    Absorbing states (S22, S23):
      pipelineState = 'done' and pipelineState = 'halted' are absorbing.
      Once reached, no transition back to 'running'.
#>

function Invoke-CloseHook {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [Parameter(Mandatory)]
        [int]$AgentIndex,

        [Parameter(Mandatory)]
        [int]$MaxAgents,

        [Parameter(Mandatory)]
        [hashtable]$PipelineState
    )

    # Validate required keys exist
    if (-not $PipelineState.ContainsKey('pipelineState')) {
        throw "PipelineState hashtable missing required key: pipelineState"
    }
    if (-not $PipelineState.ContainsKey('hookState')) {
        throw "PipelineState hashtable missing required key: hookState"
    }
    if (-not $PipelineState.ContainsKey('routingState')) {
        throw "PipelineState hashtable missing required key: routingState"
    }
    if (-not $PipelineState.ContainsKey('agentsCompleted')) {
        throw "PipelineState hashtable missing required key: agentsCompleted"
    }

    # Absorbing state guard (S22, S23): do nothing if already in terminal state
    if ($PipelineState.pipelineState -in @('done', 'halted')) {
        return @{
            Success      = $true
            PipelineState = $PipelineState
            Skipped      = $true
            Reason       = "Pipeline already in absorbing state '$($PipelineState.pipelineState)'"
        }
    }

    # Increment agents completed counter
    $PipelineState.agentsCompleted = $PipelineState.agentsCompleted + 1

    # Check if hookState needs to advance (if intercepting/rewriting, advance to done)
    # hookState='error' is non-fatal (S17, L7) — pipeline continues
    $currentHookState = $PipelineState.hookState
    if ($currentHookState -eq 'intercepting' -or $currentHookState -eq 'rewriting') {
        # Hook was in progress — mark as done (successful rewrite assumed)
        $PipelineState.hookState = 'done'
        $PipelineState.hookRewritten = $true
    }

    # Evaluate PipelineComplete condition:
    #   routingState='done' AND agentsCompleted=MaxAgents AND hookState IN {'idle','done','error'}
    $routingDone   = $PipelineState.routingState -eq 'done'
    $agentsDone    = $PipelineState.agentsCompleted -ge $MaxAgents
    $hookSettled   = $PipelineState.hookState -in @('idle', 'done', 'error')

    if ($routingDone -and $agentsDone -and $hookSettled) {
        $PipelineState.pipelineState = 'done'
    }

    return @{
        Success       = $true
        PipelineState = $PipelineState
        Skipped       = $false
    }
}

function Invoke-EsHookRewrite {
    <#
    .SYNOPSIS
        Rewrites a find/es command via the es-hook subsystem.
        Stubbed here — real implementation lives in .claude/hooks/es-hook.ps1.
    #>
    param(
        [Parameter(Mandatory)]
        [string]$Command
    )
    # Delegate to es-hook if available
    $esHookPath = Join-Path $PSScriptRoot "../../.claude/hooks/es-hook.ps1"
    if (Test-Path $esHookPath) {
        . $esHookPath
    }
    return @{ RewrittenCommand = $Command; Success = $true }
}

function Invoke-RgHookRewrite {
    <#
    .SYNOPSIS
        Rewrites an rg/grep command via the rg-hook subsystem.
        Stubbed here — real implementation lives in .claude/hooks/rg-hook.ps1.
    #>
    param(
        [Parameter(Mandatory)]
        [string]$Command
    )
    # Delegate to rg-hook if available
    $rgHookPath = Join-Path $PSScriptRoot "../../.claude/hooks/rg-hook.ps1"
    if (Test-Path $rgHookPath) {
        . $rgHookPath
    }
    return @{ RewrittenCommand = $Command; Success = $true }
}
