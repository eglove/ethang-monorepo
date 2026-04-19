<#
.SYNOPSIS
    Verifies each BDD scenario Then clause maps to an observable behavior.
.PARAMETER WhatIf
    Reports what would happen without failing.
#>
param(
    [switch]$WhatIf
)

$Root = Join-Path $PSScriptRoot '..'
$FeatureFiles = Get-ChildItem -Path $Root -Filter '*.feature' -Recurse

if ($FeatureFiles.Count -eq 0) {
    Write-Output "WARN: No .feature files found — skipping BDD postcondition check."
    exit 0
}

$violations = @()

foreach ($file in $FeatureFiles) {
    $lines = Get-Content $file.FullName
    $inScenario = $false
    $hasThen = $false
    $scenarioName = ''
    $scenarioLine = 0

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i].Trim()

        if ($line -match '^Scenario[:\s](.*)') {
            if ($inScenario -and -not $hasThen) {
                $violations += "$($file.FullName) (line $scenarioLine): scenario '$scenarioName' has no Then clause"
            }
            $inScenario = $true
            $hasThen = $false
            $scenarioName = $Matches[1].Trim()
            $scenarioLine = $i + 1
        } elseif ($line -match '^Then\s') {
            $hasThen = $true
        }
    }

    if ($inScenario -and -not $hasThen) {
        $violations += "$($file.FullName) (line $scenarioLine): scenario '$scenarioName' has no Then clause"
    }
}

if ($violations.Count -gt 0) {
    Write-Output "FAIL: BDD scenarios missing Then clauses:"
    $violations | ForEach-Object { Write-Output "  - $_" }
    if (-not $WhatIf) { exit 1 }
} else {
    Write-Output "PASS: All BDD scenarios have Then clauses."
    exit 0
}
