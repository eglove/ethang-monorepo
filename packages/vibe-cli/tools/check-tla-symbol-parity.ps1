<#
.SYNOPSIS
    Compares TLA+ action names with PowerShell function names to verify parity.
    Advisory only — emits WARN lines for missing implementations, never fails the build.
.PARAMETER WhatIf
    Reports what would happen without failing.
#>
param(
    [switch]$WhatIf
)

$Root = Join-Path $PSScriptRoot '..'
$DocsRoot = Join-Path $Root 'docs'

if (-not (Test-Path $DocsRoot)) {
    Write-Output "WARN: docs/ directory not found: $DocsRoot — skipping parity check."
    exit 0
}

$specFiles = Get-ChildItem -Path $DocsRoot -Filter '*.tla' -Recurse
if ($specFiles.Count -eq 0) {
    Write-Output "WARN: No .tla files found under $DocsRoot — skipping parity check."
    exit 0
}

$tlaActions = @()
foreach ($spec in $specFiles) {
    $content = Get-Content $spec.FullName -Raw
    $actionMatches = [regex]::Matches($content, '(?m)^([A-Z][A-Za-z0-9_]+)\s*==')
    foreach ($m in $actionMatches) {
        $tlaActions += $m.Groups[1].Value
    }
}
$tlaActions = $tlaActions | Sort-Object -Unique

if ($tlaActions.Count -eq 0) {
    Write-Output "WARN: No TLA+ actions found — skipping parity check."
    exit 0
}

$SearchDirs = @('bus', 'stages', 'utils', 'tools', 'agents', 'graph', 'state') |
    ForEach-Object { Join-Path $Root $_ } |
    Where-Object { Test-Path $_ }

$psFunctions = @()
foreach ($dir in $SearchDirs) {
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
    $found = $psFunctions | Where-Object { $_ -match $action }
    if (-not $found) {
        $missing += "TLA+ action '$action' has no corresponding PS function"
    }
}

if ($missing.Count -gt 0) {
    Write-Output "WARN: TLA+ symbol parity gaps (advisory, non-blocking):"
    $missing | ForEach-Object { Write-Output "  - $_" }
}

Write-Output "PASS: TLA+ symbol parity check complete ($($tlaActions.Count) unique actions checked against $($psFunctions.Count) PS functions across $($SearchDirs.Count) dirs)."
exit 0
