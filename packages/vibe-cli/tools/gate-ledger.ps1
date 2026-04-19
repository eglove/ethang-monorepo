<#
.SYNOPSIS
    Gate ledger functions: Get-GateLedger, Add-GateLedgerEntry, Reset-GateLedger.
#>

function Get-GateLedger {
    <#
    .SYNOPSIS
        Reads the gate-ledger.jsonl file and returns all records as objects.
    .PARAMETER LedgerPath
        Path to the gate-ledger.jsonl file.
    #>
    param(
        [string]$LedgerPath = ''
    )

    if (-not $LedgerPath) {
        $LedgerPath = Join-Path $PSScriptRoot '..' 'docs' 'gate-ledger.jsonl'
    }

    if (-not (Test-Path $LedgerPath)) {
        return @()
    }

    $lines = Get-Content $LedgerPath | Where-Object { $_.Trim() -ne '' }
    if (-not $lines) { return @() }

    $lines | ForEach-Object {
        try {
            $_ | ConvertFrom-Json
        } catch {
            Write-Warning "Skipping malformed line in gate ledger: $_"
        }
    }
}

function Add-GateLedgerEntry {
    <#
    .SYNOPSIS
        Appends a JSON record to the gate-ledger.jsonl file.
    .PARAMETER LedgerPath
        Path to the gate-ledger.jsonl file.
    .PARAMETER Entry
        Hashtable or PSCustomObject to serialize as a JSON line.
    #>
    param(
        [Parameter(Mandatory)]
        $Entry,
        [string]$LedgerPath = ''
    )

    if (-not $LedgerPath) {
        $LedgerPath = Join-Path $PSScriptRoot '..' 'docs' 'gate-ledger.jsonl'
    }

    $dir = Split-Path $LedgerPath -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    if (-not ($Entry.PSObject.Properties.Name -contains 'timestamp')) {
        if ($Entry -is [hashtable]) {
            $Entry['timestamp'] = (Get-Date -Format 'o')
        } else {
            $Entry | Add-Member -NotePropertyName 'timestamp' -NotePropertyValue (Get-Date -Format 'o') -Force
        }
    }

    $json = $Entry | ConvertTo-Json -Compress
    Add-Content -Path $LedgerPath -Value $json -Encoding UTF8
}

function Reset-GateLedger {
    <#
    .SYNOPSIS
        Clears the gate-ledger.jsonl file (test helper).
    .PARAMETER LedgerPath
        Path to the gate-ledger.jsonl file.
    #>
    param(
        [string]$LedgerPath = ''
    )

    if (-not $LedgerPath) {
        $LedgerPath = Join-Path $PSScriptRoot '..' 'docs' 'gate-ledger.jsonl'
    }

    if (Test-Path $LedgerPath) {
        Clear-Content -Path $LedgerPath
    } else {
        $dir = Split-Path $LedgerPath -Parent
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        New-Item -ItemType File -Path $LedgerPath -Force | Out-Null
    }
}
