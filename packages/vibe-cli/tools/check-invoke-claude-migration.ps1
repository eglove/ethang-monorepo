<#
.SYNOPSIS
    Verifies no stage file calls Invoke-Claude directly (all must go through bus).
.PARAMETER WhatIf
    Reports what would happen without failing.
#>
param(
    [switch]$WhatIf
)

$StagesDir = Join-Path $PSScriptRoot '..' 'stages'
$StagesDir = (Resolve-Path $StagesDir).Path

$violations = @()

Get-ChildItem -Path $StagesDir -Filter '*.ps1' -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'Invoke-Claude\b') {
        $violations += $_.FullName
    }
}

if ($violations.Count -gt 0) {
    Write-Output "FAIL: Direct Invoke-Claude calls found in stage files (must use bus):"
    $violations | ForEach-Object { Write-Output "  - $_" }
    if (-not $WhatIf) {
        exit 1
    }
} else {
    Write-Output "PASS: No direct Invoke-Claude calls found in stage files."
    exit 0
}
