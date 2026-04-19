<#
.SYNOPSIS
    Verifies every `(* version: X *)` comment in docs/*/tla/*.tla matches tla-spec-version.txt.
.PARAMETER WhatIf
    Reports what would happen without failing.
#>
param(
    [switch]$WhatIf
)

$Root = Join-Path $PSScriptRoot '..'
$VersionFile = Join-Path $Root 'tla-spec-version.txt'

if (-not (Test-Path $VersionFile)) {
    Write-Output "FAIL: tla-spec-version.txt not found at $VersionFile"
    if (-not $WhatIf) { exit 1 }
    exit 0
}

$recordedVersion = (Get-Content $VersionFile -Raw).Trim()
Write-Output "Recorded TLA+ version: $recordedVersion"

$DocsRoot = Join-Path $Root 'docs'
if (-not (Test-Path $DocsRoot)) {
    Write-Output "FAIL: docs/ directory not found: $DocsRoot"
    if (-not $WhatIf) { exit 1 }
    exit 0
}

$specFiles = Get-ChildItem -Path $DocsRoot -Filter '*.tla' -Recurse
if ($specFiles.Count -eq 0) {
    Write-Output "WARN: No .tla files found under $DocsRoot. Version check skipped."
    exit 0
}

# Version comment on its own line: (* version: 1.0.0 *)
$versionPattern = '(?m)^\s*\(\*\s*version:\s*([\d.]+)\s*\*\)'
$mismatches = @()
$missing    = @()

foreach ($spec in $specFiles) {
    $content = Get-Content $spec.FullName -Raw
    if ($content -match $versionPattern) {
        $specVersion = $Matches[1]
        if ($specVersion -ne $recordedVersion) {
            $mismatches += "$($spec.Name): spec version $specVersion != recorded $recordedVersion"
        }
    } else {
        $missing += $spec.Name
    }
}

$failures = @()
if ($missing.Count -gt 0) {
    $failures += "Specs missing (* version: X *) comment:"
    $missing | ForEach-Object { $failures += "  - $_" }
}
if ($mismatches.Count -gt 0) {
    $failures += "Version mismatches:"
    $mismatches | ForEach-Object { $failures += "  - $_" }
}

if ($failures.Count -gt 0) {
    Write-Output "FAIL: TLA+ version check:"
    $failures | ForEach-Object { Write-Output $_ }
    if (-not $WhatIf) { exit 1 }
} else {
    Write-Output "PASS: TLA+ version check passed ($($specFiles.Count) specs at version $recordedVersion)."
    exit 0
}
