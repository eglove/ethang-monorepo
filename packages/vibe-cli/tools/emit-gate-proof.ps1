<#
.SYNOPSIS
    Appends a gate proof record to docs/gate-ledger.jsonl.
.PARAMETER GateName
    Name of the gate being proven.
.PARAMETER Status
    Status of the gate (pass/fail/skip).
.PARAMETER ToolVersion
    Version of the tool that ran the gate.
.PARAMETER LedgerPath
    Override path to gate-ledger.jsonl.
.PARAMETER WhatIf
    Reports what would happen without writing.
#>
param(
    [Parameter(Mandatory)]
    [string]$GateName,

    [Parameter(Mandatory)]
    [ValidateSet('pass', 'fail', 'skip')]
    [string]$Status,

    [string]$ToolVersion = '1.0.0',

    [string]$LedgerPath = '',

    [switch]$WhatIf
)

. (Join-Path $PSScriptRoot 'gate-ledger.ps1')

if (-not $LedgerPath) {
    $LedgerPath = Join-Path $PSScriptRoot '..' 'docs' 'gate-ledger.jsonl'
}

$entry = @{
    type        = 'gate-proof'
    gate        = $GateName
    status      = $Status
    toolVersion = $ToolVersion
    timestamp   = (Get-Date -Format 'o')
}

if ($WhatIf) {
    Write-Output "WHATIF: Would append gate-proof record to $LedgerPath"
    Write-Output ($entry | ConvertTo-Json -Compress)
    exit 0
}

Add-GateLedgerEntry -Entry $entry -LedgerPath $LedgerPath
Write-Output "PASS: Gate proof recorded for '$GateName' (status: $Status)"
exit 0
