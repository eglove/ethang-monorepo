# BusLocationPolicy — Value Object
# Encapsulates VIBE_BUS_DB_PATH guard, exposes connection-handle factory,
# prevents transaction-inside-git boundary leak.

$script:_InsideTransaction = $false

function New-BusLocationPolicy {
    param(
        [string]$DbPath = $null,
        [string]$WorkspaceRoot = $null
    )

    # Resolution order:
    # 1. $env:VIBE_BUS_DB_PATH (env var always wins — 12-factor)
    # 2. $DbPath (explicit caller param)
    # 3. WorkspaceRoot + '.vibe/vibe-bus.db'
    # 4. (Get-Location) + '.vibe/vibe-bus.db'

    $resolvedPath = $null

    if (-not [string]::IsNullOrEmpty($env:VIBE_BUS_DB_PATH)) {
        $resolvedPath = $env:VIBE_BUS_DB_PATH
    }
    elseif (-not [string]::IsNullOrEmpty($DbPath)) {
        $resolvedPath = $DbPath
    }
    elseif (-not [string]::IsNullOrEmpty($WorkspaceRoot)) {
        $resolvedPath = Join-Path $WorkspaceRoot '.vibe/vibe-bus.db'
    }
    else {
        $resolvedPath = Join-Path (Get-Location).Path '.vibe/vibe-bus.db'
    }

    if ([string]::IsNullOrEmpty($resolvedPath)) {
        throw 'BusLocationPolicy: no database path configured. Set VIBE_BUS_DB_PATH or provide -DbPath.'
    }

    $resolvedWorkspaceRoot = $WorkspaceRoot
    if ([string]::IsNullOrEmpty($resolvedWorkspaceRoot)) {
        $resolvedWorkspaceRoot = (Get-Location).Path
    }

    return @{
        DbPath        = $resolvedPath
        WorkspaceRoot = $resolvedWorkspaceRoot
    }
}

function Get-BusDatabasePath {
    param([Parameter(Mandatory)][hashtable]$Policy)
    return $Policy.DbPath
}

function Open-BusDatabaseFromPolicy {
    param(
        [Parameter(Mandatory)][hashtable]$Policy,
        [scriptblock]$GetUtcNow = $null
    )

    # Guard: prevent transaction-inside-git boundary leak
    if ($script:_InsideTransaction -eq $true) {
        throw 'BusLocationPolicy: cannot open database connection inside a transaction boundary. This prevents the transaction-inside-git lock leak.'
    }

    $dbPath = $Policy.DbPath

    if ($null -ne $GetUtcNow) {
        return Open-BusDatabase -Path $dbPath -GetUtcNow $GetUtcNow
    }
    else {
        return Open-BusDatabase -Path $dbPath
    }
}

function Assert-BusLocationPolicyValid {
    param([Parameter(Mandatory)][hashtable]$Policy)

    if ([string]::IsNullOrEmpty($Policy.DbPath)) {
        throw 'BusLocationPolicy: policy is invalid — DbPath is empty or null.'
    }

    return $true
}
