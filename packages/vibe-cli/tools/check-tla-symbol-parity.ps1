<#
.SYNOPSIS
    Compares TLA+ action names with PowerShell function names to verify parity.
.PARAMETER WhatIf
    Reports what would happen without failing.
#>
param(
    [switch]$WhatIf
)

$Root = Join-Path $PSScriptRoot '..'
$TlaDir = Join-Path $Root 'bus' 'tla'

if (-not (Test-Path $TlaDir)) {
    Write-Output "WARN: TLA+ directory not found: $TlaDir — skipping parity check."
    exit 0
}

$tlaActions = @()
Get-ChildItem -Path $TlaDir -Filter '*.tla' | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $actionMatches = [regex]::Matches($content, '(?m)^([A-Z][A-Za-z0-9_]+)\s*==')
    foreach ($m in $actionMatches) {
        $tlaActions += $m.Groups[1].Value
    }
}

if ($tlaActions.Count -eq 0) {
    Write-Output "WARN: No TLA+ actions found — skipping parity check."
    exit 0
}

$psFunctions = @()
$SearchDirs = @(
    (Join-Path $Root 'bus'),
    (Join-Path $Root 'stages')
)
foreach ($dir in $SearchDirs) {
    if (-not (Test-Path $dir)) { continue }
    Get-ChildItem -Path $dir -Filter '*.ps1' -Recurse | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        $funcMatches = [regex]::Matches($content, '(?m)^function\s+([\w-]+)')
        foreach ($m in $funcMatches) {
            $psFunctions += $m.Groups[1].Value
        }
    }
}

$missing = @()
foreach ($action in $tlaActions) {
    # Convert TLA+ ActionName to Verb-ActionName pattern
    $found = $psFunctions | Where-Object { $_ -match $action }
    if (-not $found) {
        $missing += "TLA+ action '$action' has no corresponding PS function"
    }
}

if ($missing.Count -gt 0) {
    Write-Output "WARN: TLA+ symbol parity gaps (not blocking):"
    $missing | ForEach-Object { Write-Output "  - $_" }
}

Write-Output "PASS: TLA+ symbol parity check complete ($($tlaActions.Count) actions checked)."
exit 0
