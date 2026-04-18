[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Resolve glossary path relative to this script's location
$GlossaryPath = Join-Path $PSScriptRoot '../bus/bounded-context-glossary.psd1'
$CheckBddScript = Join-Path $PSScriptRoot 'check-bdd-tags.ps1'

if (-not (Test-Path $GlossaryPath)) {
    Write-Error "Cannot find bounded-context-glossary.psd1 at: $GlossaryPath"
    exit 1
}

$glossary = Import-PowerShellDataFile $GlossaryPath
$tlaVariables = $glossary['TlaVariables']

# Delegate .feature files to check-bdd-tags.ps1
if ($Path -match '\.feature$') {
    & pwsh -NoProfile -File $CheckBddScript -Path $Path
    exit $LASTEXITCODE
}

# Resolve the target path
$resolvedPath = Resolve-Path $Path -ErrorAction SilentlyContinue
if (-not $resolvedPath) {
    Write-Error "File not found: $Path"
    exit 1
}
$targetPath = $resolvedPath.Path

# Exclude the glossary file itself from scanning
$resolvedGlossary = Resolve-Path $GlossaryPath -ErrorAction SilentlyContinue
if ($resolvedGlossary -and ($targetPath -eq $resolvedGlossary.Path)) {
    Write-Output "[SKIP] Glossary file excluded from scan: $targetPath"
    exit 0
}

# Parse the PowerShell file using the AST
$parseErrors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile(
    $targetPath,
    [ref]$null,
    [ref]$parseErrors
)

if ($parseErrors -and $parseErrors.Count -gt 0) {
    Write-Warning "Parse errors in $targetPath (continuing scan):"
    foreach ($err in $parseErrors) {
        Write-Warning "  Line $($err.Extent.StartLineNumber): $($err.Message)"
    }
}

# Walk all VariableExpressionAst nodes
$leaks = @()
$variableAsts = $ast.FindAll(
    { param($node) $node -is [System.Management.Automation.Language.VariableExpressionAst] },
    $true
)

foreach ($varAst in $variableAsts) {
    $varName = $varAst.VariablePath.UserPath
    # Case-insensitive match against TLA+ variable names
    foreach ($tlaVar in $tlaVariables) {
        if ($varName -ieq $tlaVar) {
            $leaks += [PSCustomObject]@{
                Line     = $varAst.Extent.StartLineNumber
                Variable = $varName
                TlaName  = $tlaVar
            }
            break
        }
    }
}

if ($leaks.Count -gt 0) {
    foreach ($leak in $leaks) {
        Write-Output "[FAIL] TLA+ variable name leak: `$$($leak.Variable) at line $($leak.Line) in $targetPath. Use the PowerShell name from bounded-context-glossary.psd1 instead."
    }
    exit 1
}

Write-Output "[PASS] No TLA+ variable name leaks found in $targetPath"
exit 0
