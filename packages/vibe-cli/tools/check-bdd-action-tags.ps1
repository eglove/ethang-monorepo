<#
.SYNOPSIS
    Verifies each BDD scenario has a @tla-action-<ActionName> tag.
.PARAMETER WhatIf
    Reports what would happen without failing.
#>
param(
    [switch]$WhatIf
)

$Root = Join-Path $PSScriptRoot '..'
$FeatureFiles = Get-ChildItem -Path $Root -Filter '*.feature' -Recurse

if ($FeatureFiles.Count -eq 0) {
    Write-Output "WARN: No .feature files found — skipping BDD action tag check."
    exit 0
}

$violations = @()

foreach ($file in $FeatureFiles) {
    $lines = Get-Content $file.FullName
    $pendingScenario = $false
    $hasTlaTag = $false
    $scenarioLine = 0

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i].Trim()

        if ($line -match '^@') {
            if ($line -match '@tla-action-') {
                $hasTlaTag = $true
            }
        } elseif ($line -match '^Scenario') {
            if ($pendingScenario -and -not $hasTlaTag) {
                $violations += "$($file.FullName) (line $scenarioLine): scenario missing @tla-action-<ActionName> tag"
            }
            $pendingScenario = $true
            $hasTlaTag = $false
            $scenarioLine = $i + 1
        } elseif ($line -eq '') {
            # blank line between tag block and scenario name resets tag collection
        }
    }

    # Check last scenario
    if ($pendingScenario -and -not $hasTlaTag) {
        $violations += "$($file.FullName) (line $scenarioLine): scenario missing @tla-action-<ActionName> tag"
    }
}

if ($violations.Count -gt 0) {
    Write-Output "FAIL: BDD scenarios missing @tla-action tags:"
    $violations | ForEach-Object { Write-Output "  - $_" }
    if (-not $WhatIf) { exit 1 }
} else {
    Write-Output "PASS: All BDD scenarios have @tla-action tags."
    exit 0
}
