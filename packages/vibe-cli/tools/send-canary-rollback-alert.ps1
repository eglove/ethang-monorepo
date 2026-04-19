<#
.SYNOPSIS
    Sends an alert when canary rollback threshold is exceeded.
    Writes alert record to docs/gate-ledger.jsonl.
.PARAMETER Metric
    Name of the metric that exceeded the threshold.
.PARAMETER Value
    Actual measured value.
.PARAMETER Threshold
    Threshold that was exceeded.
.PARAMETER LedgerPath
    Override path to gate-ledger.jsonl.
.PARAMETER WhatIf
    Reports what would happen without writing.
#>
param(
    [Parameter(Mandatory)]
    [string]$Metric,

    [Parameter(Mandatory)]
    [double]$Value,

    [Parameter(Mandatory)]
    [double]$Threshold,

    [string]$LedgerPath = '',

    [switch]$WhatIf
)

. (Join-Path $PSScriptRoot 'gate-ledger.ps1')

if (-not $LedgerPath) {
    $LedgerPath = Join-Path $PSScriptRoot '..' 'docs' 'gate-ledger.jsonl'
}

$entry = @{
    type      = 'canary-rollback-alert'
    metric    = $Metric
    value     = $Value
    threshold = $Threshold
    exceeded  = ($Value -gt $Threshold)
    timestamp = (Get-Date -Format 'o')
}

if ($WhatIf) {
    Write-Output "WHATIF: Would append canary-rollback-alert to $LedgerPath"
    Write-Output ($entry | ConvertTo-Json -Compress)
    exit 0
}

Add-GateLedgerEntry -Entry $entry -LedgerPath $LedgerPath
Write-Output "ALERT: Canary rollback threshold exceeded for metric '$Metric': value=$Value threshold=$Threshold"
exit 0
