#Requires -Version 7.0
<#
.SYNOPSIS
    PreToolUse hook that rewrites grep/egrep/fgrep/Select-String/sls to rg.

.DESCRIPTION
    Reads a Claude Code tool-call JSON payload from stdin. When the command
    first token (or a piped segment) matches a grep-surface token, emits
    a PreToolUse hookSpecificOutput with permissionDecision="allow" and
    updatedInput.command set to the rg equivalent. Claude Code then runs
    the rewritten command.

    Passthrough: when no rewrite applies, the hook exits 0 with empty
    stdout (Claude Code proceeds with the original command).

    Non-intercept rules:
      - Get-Content / gc / cat are plain reads — never intercepted (S12).
      - es-domain commands (es/find/ls/dir/Get-ChildItem/gci) belong to
        es-hook (D28 sequential evaluation).

    TLA+ state machine:
        hookState: idle -> intercepting -> rewriting -> done | error
        hookKind:  "rg" only for matched grep-surface commands (S14)
        hookRewritten: TRUE after successful rewrite

.OUTPUTS
    On rewrite: JSON with hookSpecificOutput/updatedInput on stdout.
    On passthrough: empty stdout (proceed with original command).
    On error: stderr + exit 1.
#>

#region Fault injection (for Test 11 D11 crash testing)
if ($env:RG_HOOK_FAULT_INJECT -eq '1') {
    [Console]::Error.WriteLine('rg-hook: fault injection triggered — pre-output crash')
    exit 1
}
#endregion

#region Surface token sets
$script:GrepTokens = @('grep', 'egrep', 'fgrep', 'Select-String', 'sls')
$script:PlainReadTokens = @('Get-Content', 'gc', 'cat')
$script:EsDomainTokens = @('es', 'find', 'ls', 'dir', 'Get-ChildItem', 'gci')
#endregion

function Invoke-RgHookRewrite {
    param(
        [Parameter(Mandatory)]
        [string]$Command
    )

    $trimmed = $Command.TrimStart()

    foreach ($token in $script:GrepTokens) {
        if ($trimmed -match "^$([regex]::Escape($token))(\s|$|;|\|)") {
            return $Command -replace "^(\s*)$([regex]::Escape($token))(\s|$)", '$1rg$2'
        }
    }

    foreach ($token in $script:GrepTokens) {
        if ($Command -match "\|\s*$([regex]::Escape($token))(\s|$|;|\|)") {
            return $Command -replace "\|\s*$([regex]::Escape($token))(\s|$)", "| rg`$1"
        }
    }

    return $Command
}

function Get-SurfaceToken {
    param([string]$Command)
    $trimmed = $Command.TrimStart()
    if ($trimmed -match '^(\S+)') { return $Matches[1] }
    return ''
}

function Test-IsGrepCommand {
    param([string]$Command)
    $surface = Get-SurfaceToken -Command $Command
    foreach ($token in $script:GrepTokens) {
        if ($surface -eq $token) { return $true }
    }
    foreach ($token in $script:GrepTokens) {
        if ($Command -match "\|\s*$([regex]::Escape($token))(\s|$|;|\|)") { return $true }
    }
    return $false
}

function Write-RewriteResponse {
    param(
        [Parameter(Mandatory)]
        [string]$RewrittenCommand
    )

    $response = @{
        hookSpecificOutput = @{
            hookEventName      = 'PreToolUse'
            permissionDecision = 'allow'
            updatedInput       = @{ command = $RewrittenCommand }
        }
    }
    Write-Output ($response | ConvertTo-Json -Depth 10 -Compress)
}

#region Main hook body
$hookKind = 'none'
$hookState = 'idle'
$hookRewritten = $false

try {
    $rawInput = [Console]::In.ReadToEnd()

    if ([string]::IsNullOrWhiteSpace($rawInput)) {
        [Console]::Error.WriteLine('rg-hook: empty stdin — nothing to process')
        exit 1
    }

    $payload = $rawInput | ConvertFrom-Json -ErrorAction Stop

    $hookState = 'intercepting'

    $command = $null
    $hasToolInput = $null -ne ($payload | Select-Object -ExpandProperty tool_input -ErrorAction SilentlyContinue)
    if ($hasToolInput) {
        $command = $payload.tool_input | Select-Object -ExpandProperty command -ErrorAction SilentlyContinue
    }

    if ([string]::IsNullOrWhiteSpace($command)) {
        # Passthrough: nothing to rewrite
        $hookState = 'done'
        $hookKind = 'none'
        exit 0
    }

    if (Test-IsGrepCommand -Command $command) {
        $hookKind = 'rg'
        $hookState = 'rewriting'

        $rewrittenCommand = Invoke-RgHookRewrite -Command $command
        $hookRewritten = $true

        Write-RewriteResponse -RewrittenCommand $rewrittenCommand

        $hookState = 'done'
        $hookKind = 'none'  # S15
        exit 0
    }
    else {
        # Passthrough: not our domain
        $hookState = 'done'
        $hookKind = 'none'
        exit 0
    }
}
catch {
    $hookState = 'error'
    [Console]::Error.WriteLine("rg-hook: error — $_")
    exit 1
}
#endregion
