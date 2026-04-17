#Requires -Version 7.0
<#
.SYNOPSIS
    PreToolUse hook that rewrites find/ls/dir/Get-ChildItem/gci commands to use the Everything CLI (es).

.DESCRIPTION
    Reads a Claude Code tool-call JSON payload from stdin.
    If the command first token matches any of: find, ls, dir, Get-ChildItem, gci
    -- rewrites it to use `es` with equivalent arguments.
    Does NOT intercept Get-Content (S12 PlainReadNeverIntercepted).
    Does NOT intercept grep-type commands (rg-hook domain).

    TLA+ state machine:
        hookState: idle -> intercepting -> rewriting -> done | error
        hookKind:  "es" when intercepting; "none" when done (S15); "es" preserved at error (S28)
        hookRewritten: TRUE after successful rewrite
        hookCommand: NULL after success (S36)

.OUTPUTS
    Modified JSON payload on stdout. Exits 0 on success, non-zero on failure.
#>

$ErrorActionPreference = 'Stop'

# Surface tokens that this hook owns (S13 EsHookOnlyForFind)
$script:EsSurfaceTokens = @('find', 'ls', 'dir', 'Get-ChildItem', 'gci')

function Convert-ToEsCommand {
    <#
    .SYNOPSIS
        Converts a specific find/ls/dir/gci invocation into an `es` invocation.
    #>
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
                if ($searchPath -match '^-' -or $searchPath -eq '') {
                    return "es $pattern"
                }
                elseif ($searchPath -eq '.') {
                    return "es $pattern"
                }
                else {
                    return "es -path `"$searchPath`" $pattern"
                }
            }
            elseif ($Rest -match '-type\s+f\s+(.+)') {
                $remaining = $Matches[1].Trim()
                return "es $remaining"
            }
            else {
                return ("es $Rest").TrimEnd()
            }
        }
        { $_ -in @('ls', 'dir') } {
            if ([string]::IsNullOrWhiteSpace($Rest)) {
                return 'es'
            }
            $cleanRest = ($Rest -replace '\s*-[lAaRrth1]+\s*', ' ').Trim()
            if ([string]::IsNullOrWhiteSpace($cleanRest)) {
                return 'es'
            }
            return "es -path `"$cleanRest`""
        }
        { $_ -in @('Get-ChildItem', 'gci') } {
            if ([string]::IsNullOrWhiteSpace($Rest)) {
                return 'es'
            }
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
        This function is separated for Pester mocking support.
    .PARAMETER Command
        The original command string.
    .OUTPUTS
        [string] The rewritten command, or $null if no rewrite was performed.
    #>
    param(
        [Parameter(Mandatory)]
        [string]$Command
    )

    # Tokenize: split on whitespace
    $tokens = $Command -split '\s+', 2

    if ($tokens.Count -eq 0 -or [string]::IsNullOrWhiteSpace($tokens[0])) {
        return $null
    }

    $firstToken = $tokens[0].Trim()

    # S12: Never intercept Get-Content or aliases
    if ($firstToken -in @('Get-Content', 'gc', 'cat', 'type')) {
        return $null
    }

    # grep-type commands belong to rg-hook
    if ($firstToken -in @('grep', 'rg', 'Select-String', 'sls')) {
        return $null
    }

    # Check if first token is one of our surface tokens
    if ($firstToken -notin $script:EsSurfaceTokens) {
        return $null
    }

    # Build the es equivalent
    $rest = if ($tokens.Count -gt 1) { $tokens[1] } else { '' }

    return Convert-ToEsCommand -Token $firstToken -Rest $rest
}

function Invoke-EsHook {
    <#
    .SYNOPSIS
        Main hook entry point. Reads stdin JSON, rewrites if needed, outputs JSON.
    .PARAMETER StdinContent
        Stdin content (required — passed in from script scope where $input is available).
    .OUTPUTS
        Modified JSON to stdout.
    #>
    param(
        [Parameter(Mandatory)]
        [string]$StdinContent
    )

    # TLA+ state tracking
    $hookState     = 'idle'
    $hookKind      = 'none'
    $hookRewritten = $false
    $hookCommand   = $null

    try {
        if ([string]::IsNullOrWhiteSpace($StdinContent)) {
            # Empty payload — nothing to intercept, pass through silently
            $hookState = 'done'
            $hookKind  = 'none'
            return
        }

        $hookState = 'intercepting'

        # Parse JSON — throws on invalid JSON (S3 NoHookFallback: will be caught below)
        $payload = $StdinContent | ConvertFrom-Json -ErrorAction Stop

        # Safely extract command field without StrictMode issues
        $command = $null
        $hasToolInput = $null -ne ($payload | Select-Object -ExpandProperty tool_input -ErrorAction SilentlyContinue)
        if ($hasToolInput) {
            $command = $payload.tool_input | Select-Object -ExpandProperty command -ErrorAction SilentlyContinue
        }

        if ($null -eq $command -or $command -eq '') {
            # No command field -- pass through unchanged
            Write-Output $StdinContent
            $hookState = 'done'
            $hookKind  = 'none'
            return
        }

        $hookCommand = $command
        $hookState   = 'rewriting'
        $hookKind    = 'es'   # S13: EsHookOnlyForFind -- set when intercepting a candidate

        $rewritten = Invoke-EsHookRewrite -Command $command

        if ($null -ne $rewritten) {
            # Rewrite succeeded
            $hookRewritten = $true
            $payload.tool_input.command = $rewritten
            $hookCommand = $null   # S36: clear after success

            $outJson = $payload | ConvertTo-Json -Depth 10 -Compress
            Write-Output $outJson

            $hookState = 'done'
            $hookKind  = 'none'  # S15: done terminal CLEARS hookKind
        }
        else {
            # No rewrite -- pass through unchanged
            Write-Output $StdinContent
            $hookState = 'done'
            $hookKind  = 'none'  # S15
        }
    }
    catch {
        # S3 NoHookFallback: crash exits non-zero with no stdout
        # S28 HookErrorPreservesKind: hookKind stays "es" (not cleared)
        $hookState = 'error'
        [Console]::Error.WriteLine("es-hook error: $_")
        exit 1
    }
}

# Run main hook body only when executed as a script (not dot-sourced in tests)
# IMPORTANT: $input must be consumed at script scope — PowerShell places piped data there,
# not in [Console]::In when invoked via `pwsh -File`.
if ($env:ES_HOOK_TEST_MODE -ne '1') {
    $script:_hookInput = @($input) -join "`n"
    if ([string]::IsNullOrWhiteSpace($script:_hookInput)) {
        # Fallback for non-piped invocation (e.g., stdin via terminal)
        $script:_hookInput = [Console]::In.ReadToEnd()
    }
    Invoke-EsHook -StdinContent $script:_hookInput
}
