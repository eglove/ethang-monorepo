<#
.SYNOPSIS
    Verifies TLA+ version in tla-spec-version.txt matches spec files.
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

$TlaDir = Join-Path $Root 'bus' 'tla'
if (-not (Test-Path $TlaDir)) {
    Write-Output "FAIL: TLA+ directory not found: $TlaDir"
    if (-not $WhatIf) { exit 1 }
    exit 0
}

$specFiles = Get-ChildItem -Path $TlaDir -Filter '*.tla'
if ($specFiles.Count -eq 0) {
    Write-Output "WARN: No .tla files found. Version check skipped."
    exit 0
}

$versionPattern = 'MODULE\s+\S+\s+\(\*\s*version:\s*([\d.]+)\s*\*\)'
$mismatches = @()

foreach ($spec in $specFiles) {
    $content = Get-Content $spec.FullName -Raw
    if ($content -match $versionPattern) {
        $specVersion = $Matches[1]
        if ($specVersion -ne $recordedVersion) {
            $mismatches += "$($spec.Name): spec version $specVersion != recorded $recordedVersion"
        }
    }
}

if ($mismatches.Count -gt 0) {
    Write-Output "FAIL: TLA+ version mismatches:"
    $mismatches | ForEach-Object { Write-Output "  - $_" }
    if (-not $WhatIf) { exit 1 }
} else {
    Write-Output "PASS: TLA+ version check passed (version: $recordedVersion)."
    exit 0
}
