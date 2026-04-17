# rg-hook.ps1 — PreToolUse hook: rewrites grep/egrep/fgrep/Select-String/sls to rg
# Hook state machine: idle -> intercepting -> rewriting -> done | error
# S12: Get-Content/gc/cat are plain reads — never intercepted
# S14: hookKind="rg" only for matched grep-surface commands
# S15: hookKind cleared to "none" at done terminal (success)
# S28: hookKind preserved as "rg" at error terminal (attribution)
# D28: sequential evaluation — es-hook runs before this; "es" tokens are NOT matched

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
            $rewritten = $Command -replace "^(\s*)$([regex]::Escape($token))(\s|$)", '$1rg$2'
            return $rewritten
        }
    }

    foreach ($token in $script:GrepTokens) {
        if ($Command -match "\|\s*$([regex]::Escape($token))(\s|$|;|\|)") {
            $rewritten = $Command -replace "\|\s*$([regex]::Escape($token))(\s|$)", "| rg`$1"
            return $rewritten
        }
    }

    return $Command
}

function Get-SurfaceToken {
    param([string]$Command)
    $trimmed = $Command.TrimStart()
    if ($trimmed -match '^(\S+)') {
        return $Matches[1]
    }
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

    $command = $payload.tool_input.command

    if ([string]::IsNullOrWhiteSpace($command)) {
        $hookState = 'done'
        $hookKind = 'none'
        Write-Output ($payload | ConvertTo-Json -Depth 10 -Compress)
        exit 0
    }

    $isGrepCommand = Test-IsGrepCommand -Command $command

    if ($isGrepCommand) {
        $hookKind = 'rg'
        $hookState = 'rewriting'

        $rewrittenCommand = Invoke-RgHookRewrite -Command $command
        $hookRewritten = $true

        $payload.tool_input.command = $rewrittenCommand

        $hookState = 'done'
        $hookKind = 'none'  # S15: done terminal clears hookKind

        Write-Output ($payload | ConvertTo-Json -Depth 10 -Compress)
        exit 0
    }
    else {
        $hookState = 'done'
        $hookKind = 'none'
        Write-Output ($payload | ConvertTo-Json -Depth 10 -Compress)
        exit 0
    }
}
catch {
    $hookState = 'error'
    [Console]::Error.WriteLine("rg-hook: error — $_")
    exit 1
}
#endregion
