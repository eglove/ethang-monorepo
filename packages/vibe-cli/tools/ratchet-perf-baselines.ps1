<#
.SYNOPSIS
    When perf improves by >5%, updates performance-baselines.json and appends to docs/perf-ratchet-log.json.
.PARAMETER Metric
    Name of the metric to ratchet.
.PARAMETER NewValue
    New measured value (lower is better, in ms).
.PARAMETER BaselinesPath
    Override path to performance-baselines.json.
.PARAMETER RatchetLogPath
    Override path to perf-ratchet-log.json.
.PARAMETER WhatIf
    Reports what would happen without writing.
#>
param(
    [Parameter(Mandatory)]
    [string]$Metric,

    [Parameter(Mandatory)]
    [double]$NewValue,

    [string]$BaselinesPath = '',
    [string]$RatchetLogPath = '',
    [switch]$WhatIf
)

$Root = Join-Path $PSScriptRoot '..'

if (-not $BaselinesPath) {
    $BaselinesPath = Join-Path $Root 'tests' 'bus' 'performance-baselines.json'
}
if (-not $RatchetLogPath) {
    $RatchetLogPath = Join-Path $Root 'docs' 'perf-ratchet-log.json'
}

if (-not (Test-Path $BaselinesPath)) {
    Write-Output "FAIL: performance-baselines.json not found: $BaselinesPath"
    exit 1
}

$baselines = Get-Content $BaselinesPath -Raw | ConvertFrom-Json
$current = $baselines.$Metric

if ($null -eq $current) {
    Write-Output "INFO: Metric '$Metric' not in baselines — adding with value $NewValue"
    $baselines | Add-Member -NotePropertyName $Metric -NotePropertyValue $NewValue -Force
    if (-not $WhatIf) {
        $baselines | ConvertTo-Json | Set-Content -Path $BaselinesPath -Encoding UTF8
    }
    Write-Output "PASS: New metric '$Metric' added to baselines."
    exit 0
}

$improvement = ($current - $NewValue) / $current
if ($improvement -gt 0.05) {
    Write-Output "RATCHET: '$Metric' improved by $([math]::Round($improvement * 100, 1))% ($current -> $NewValue ms)"

    if ($WhatIf) {
        Write-Output "WHATIF: Would update $BaselinesPath and append to $RatchetLogPath"
        exit 0
    }

    # Update baselines
    $baselines.$Metric = $NewValue
    $baselines | ConvertTo-Json | Set-Content -Path $BaselinesPath -Encoding UTF8

    # Append to ratchet log
    $log = @()
    if (Test-Path $RatchetLogPath) {
        $existing = Get-Content $RatchetLogPath -Raw
        if ($existing.Trim() -ne '' -and $existing.Trim() -ne '[]') {
            $log = $existing | ConvertFrom-Json
        }
    }
    $log += @{
        metric      = $Metric
        oldValue    = $current
        newValue    = $NewValue
        improvement = [math]::Round($improvement * 100, 2)
        timestamp   = (Get-Date -Format 'o')
    }
    $log | ConvertTo-Json | Set-Content -Path $RatchetLogPath -Encoding UTF8

    Write-Output "PASS: Baseline ratcheted for '$Metric'."
} else {
    Write-Output "SKIP: '$Metric' improvement ($([math]::Round($improvement * 100, 1))%) below 5% threshold — no ratchet."
}
exit 0
