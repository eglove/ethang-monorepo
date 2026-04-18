#Requires -Version 7.0
<#
.SYNOPSIS
    PreToolUse hook that rewrites find/ls/dir/Get-ChildItem/gci commands to use the Everything CLI (es).

.DESCRIPTION
    Reads a Claude Code tool-call JSON payload from stdin. If the command
    first token matches any of: find, ls, dir, Get-ChildItem, gci — emits
    a PreToolUse hookSpecificOutput with permissionDecision="allow" and
    updatedInput.command set to the `es` equivalent. Claude Code then runs
    the rewritten command, so the agent actually gets `es` output instead
    of the native search command output.

    Passthrough: when the command is not a search, the hook exits 0 with
    empty stdout, which means "proceed unchanged" to Claude Code.

    Non-intercept rules:
      - Get-Content / gc / cat / type are never intercepted (S12).
      - grep-type commands belong to rg-hook (this hook leaves them alone).

    TLA+ state machine:
        hookState: idle -> intercepting -> rewriting -> done | error
        hookKind:  "es" when intercepting; "none" when done (S15); "es" preserved at error (S28)
        hookRewritten: TRUE after successful rewrite
        hookCommand: NULL after success (S36)

.OUTPUTS
    On rewrite: JSON with hookSpecificOutput/updatedInput on stdout.
    On passthrough: empty stdout (proceed with original command).
    On error: stderr + exit 1.
#>

$ErrorActionPreference = 'Stop'

# Surface tokens this hook owns (S13 EsHookOnlyForFind)
$script:EsSurfaceTokens = @('find', 'ls', 'dir', 'Get-ChildItem', 'gci')

function Convert-ToEsCommand {
    param(
        [string]$Token,
        [string]$Rest
    )

    switch ($Token) {
        'find' {
            if ($Rest -match '-name\s+[''"]?([^''"]+)[''"]?') {
                $pattern = $Matches[1].Trim()
                $restTokens = $Rest -split '\s+', 2
                $searchPath = $restTokens[0]
                if ($searchPath -match '^-' -or $searchPath -eq '' -or $searchPath -eq '.') {
                    return "es $pattern"
                }
                return "es -path `"$searchPath`" $pattern"
            }
            elseif ($Rest -match '-type\s+f\s+(.+)') {
                return "es $($Matches[1].Trim())"
            }
            else {
                return ("es $Rest").TrimEnd()
            }
        }
        { $_ -in @('ls', 'dir') } {
            if ([string]::IsNullOrWhiteSpace($Rest)) { return 'es' }
            $cleanRest = ($Rest -replace '\s*-[lAaRrth1]+\s*', ' ').Trim()
            if ([string]::IsNullOrWhiteSpace($cleanRest)) { return 'es' }
            return "es -path `"$cleanRest`""
        }
        { $_ -in @('Get-ChildItem', 'gci') } {
            if ([string]::IsNullOrWhiteSpace($Rest)) { return 'es' }
            $esPattern = ''
            $esPath = ''
            if ($Rest -match '-Filter\s+[''"]?([^''"]+)[''"]?') {
                $esPattern = $Matches[1].Trim()
            }
            if ($Rest -match '-Path\s+[''"]?([^''"]+)[''"]?') {
                $esPath = $Matches[1].Trim()
            }
            elseif ($Rest -match '-LiteralPath\s+[''"]?([^''"]+)[''"]?') {
                $esPath = $Matches[1].Trim()
            }
            $cmd = 'es'
            if ($esPath)    { $cmd += " -path `"$esPath`"" }
            if ($esPattern) { $cmd += " $esPattern" }
            if ($cmd -eq 'es' -and -not [string]::IsNullOrWhiteSpace($Rest)) {
                $cleanRest = ($Rest -replace '-Recurse\s*', '' -replace '-Force\s*', '').Trim()
                if ($cleanRest) { $cmd += " $cleanRest" }
            }
            return $cmd
        }
        default {
            return ("es $Rest").TrimEnd()
        }
    }
}

function Invoke-EsHookRewrite {
    <#
    .SYNOPSIS
        Rewrites a find/ls/dir/Get-ChildItem/gci command to use `es`.
        Separated for Pester mocking support.
    .PARAMETER Command
        The original command string.
    .OUTPUTS
        [string] The rewritten command, or $null if no rewrite was performed.
    #>
    param(
        [Parameter(Mandatory)]
        [string]$Command
    )

    $tokens = $Command -split '\s+', 2

    if ($tokens.Count -eq 0 -or [string]::IsNullOrWhiteSpace($tokens[0])) {
        return $null
    }

    $firstToken = $tokens[0].Trim()

    # S12: plain reads never intercepted
    if ($firstToken -in @('Get-Content', 'gc', 'cat', 'type')) { return $null }

    # grep-type commands belong to rg-hook
    if ($firstToken -in @('grep', 'rg', 'egrep', 'fgrep', 'Select-String', 'sls')) {
        return $null
    }

    if ($firstToken -notin $script:EsSurfaceTokens) { return $null }

    $rest = if ($tokens.Count -gt 1) { $tokens[1] } else { '' }
    return Convert-ToEsCommand -Token $firstToken -Rest $rest
}

function Write-RewriteResponse {
    <#
    .SYNOPSIS
        Emits the Claude Code PreToolUse hookSpecificOutput payload that
        swaps the native command for the `es` rewrite.
    #>
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

function Invoke-EsHook {
    <#
    .SYNOPSIS
        Main hook entry point. Reads stdin JSON, emits hookSpecificOutput on rewrite.
    #>
    param(
        [Parameter(Mandatory)]
        [AllowEmptyString()]
        [string]$StdinContent
    )

    $hookState     = 'idle'
    $hookKind      = 'none'
    $hookRewritten = $false
    $hookCommand   = $null

    try {
        if ([string]::IsNullOrWhiteSpace($StdinContent)) {
            # Empty payload — passthrough (no stdout, original command runs)
            $hookState = 'done'
            $hookKind  = 'none'
            return
        }

        $hookState = 'intercepting'

        $payload = $StdinContent | ConvertFrom-Json -ErrorAction Stop

        $command = $null
        $hasToolInput = $null -ne ($payload | Select-Object -ExpandProperty tool_input -ErrorAction SilentlyContinue)
        if ($hasToolInput) {
            $command = $payload.tool_input | Select-Object -ExpandProperty command -ErrorAction SilentlyContinue
        }

        if ($null -eq $command -or $command -eq '') {
            # No command field — passthrough
            $hookState = 'done'
            $hookKind  = 'none'
            return
        }

        $hookCommand = $command
        $hookState   = 'rewriting'
        $hookKind    = 'es'

        $rewritten = Invoke-EsHookRewrite -Command $command

        if ($null -ne $rewritten) {
            $hookRewritten = $true
            $hookCommand = $null   # S36

            Write-RewriteResponse -RewrittenCommand $rewritten

            $hookState = 'done'
            $hookKind  = 'none'  # S15
        }
        else {
            # No rewrite — passthrough
            $hookState = 'done'
            $hookKind  = 'none'
        }
    }
    catch {
        # S3 NoHookFallback: crash exits non-zero, no stdout
        # S28: hookKind stays "es" at error
        $hookState = 'error'
        [Console]::Error.WriteLine("es-hook error: $_")
        exit 1
    }
}

# Main body only runs when executed as a script (not dot-sourced in tests)
if ($env:ES_HOOK_TEST_MODE -ne '1') {
    $script:_hookInput = @($input) -join "`n"
    if ([string]::IsNullOrWhiteSpace($script:_hookInput)) {
        $script:_hookInput = [Console]::In.ReadToEnd()
    }
    Invoke-EsHook -StdinContent $script:_hookInput
}
