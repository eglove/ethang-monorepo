# es-hook.ps1 - PreToolUse hook for filesystem enumeration commands
# Surface tokens: find, ls, dir, Get-ChildItem, gci
# Runs before Bash/PowerShell tools to intercept directory listing commands
# and route them through the RTK es (enumerate/search) filter.
#
# Supported surface tokens:
#   - find      (Unix find)
#   - ls        (Unix list)
#   - dir       (Windows dir)
#   - Get-ChildItem (PowerShell)
#   - gci       (PowerShell alias for Get-ChildItem)

param(
    [Parameter(ValueFromPipeline)]
    [string]$InputJson
)

# Read hook input from stdin
$input_data = $null
if ($InputJson) {
    $input_data = $InputJson | ConvertFrom-Json -ErrorAction SilentlyContinue
} else {
    $raw = $null
    try { $raw = [Console]::In.ReadToEnd() } catch {}
    if ($raw) {
        $input_data = $raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    }
}

# Surface-token matching - check if the command uses any of our tokens:
# find, ls, dir, Get-ChildItem, gci
$surfaceTokens = @('find', 'ls', 'dir', 'Get-ChildItem', 'gci')

$command = ''
if ($input_data -and $input_data.tool_input) {
    if ($input_data.tool_input.command) {
        $command = $input_data.tool_input.command
    }
}

$matched = $false
foreach ($token in $surfaceTokens) {
    if ($command -match "\b$([regex]::Escape($token))\b") {
        $matched = $true
        break
    }
}

# If no surface token matched, pass through (no output = hook is a no-op)
if (-not $matched) {
    exit 0
}

# Hook passes through - no blocking action for now
# Future: could redirect to rtk ls/find for token savings
exit 0