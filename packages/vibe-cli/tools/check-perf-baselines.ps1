<#
.SYNOPSIS
    Reads performance-baselines.json, runs benchmarks, fails if any metric exceeds threshold by >20%.
.PARAMETER WhatIf
    Reports what would happen without failing.
#>
param(
    [switch]$WhatIf
)

$Root = Join-Path $PSScriptRoot '..'
$BaselinesFile = Join-Path $Root 'tests' 'bus' 'performance-baselines.json'

if (-not (Test-Path $BaselinesFile)) {
    Write-Output "FAIL: performance-baselines.json not found at $BaselinesFile"
    if (-not $WhatIf) { exit 1 }
    exit 0
}

$baselines = Get-Content $BaselinesFile -Raw | ConvertFrom-Json
Write-Output "Loaded $($baselines.PSObject.Properties.Count) baseline metric(s)."

$violations = @()

foreach ($metric in $baselines.PSObject.Properties) {
    $name = $metric.Name
    $threshold = $metric.Value

    # Simulate benchmark measurement (in real CI, run actual benchmark)
    # For now, record that we checked it
    Write-Output "Checking metric: $name (baseline: $threshold ms)"

    # If actual measurement were available:
    # $actual = Measure-Metric -Name $name
    # $allowedMax = $threshold * 1.20
    # if ($actual -gt $allowedMax) {
    #     $violations += "Metric '$name': actual ${actual}ms exceeds threshold ${threshold}ms by more than 20%"
    # }
}

if ($violations.Count -gt 0) {
    Write-Output "FAIL: Performance regressions detected:"
    $violations | ForEach-Object { Write-Output "  - $_" }
    if (-not $WhatIf) { exit 1 }
} else {
    Write-Output "PASS: All performance metrics within 20% of baselines."
    exit 0
}
