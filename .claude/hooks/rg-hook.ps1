# rg-hook.ps1 - PreToolUse hook for text search commands
# Surface tokens: grep, egrep, fgrep, Select-String, sls
# Runs before Bash/PowerShell tools to intercept search commands
# and route them through the RTK rg (ripgrep) filter.
#
# Supported surface tokens:
#   - grep      (Unix grep)
#   - egrep     (extended grep)
#   - fgrep     (fixed-string grep)
#   - Select-String (PowerShell)
#   - sls       (PowerShell alias for Select-String)

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
# grep, egrep, fgrep, Select-String, sls
$surfaceTokens = @('grep', 'egrep', 'fgrep', 'Select-String', 'sls')

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
# Future: could redirect to rtk grep for token savings
exit 0