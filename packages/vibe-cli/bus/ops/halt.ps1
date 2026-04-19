Import-Module PSSQLite -ErrorAction SilentlyContinue

# Module-level halt latch — prevents double-halt
$script:_HaltLatch = $false

function Invoke-BusHalt {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [Parameter(Mandatory)]
        [string]$HaltReason,

        [string]$DbPath,
        [scriptblock]$DbExecutor
    )

    # Latch guard: no-op if already halted
    if ($script:_HaltLatch) { return @{ NoOp = $true; Reason = 'already_halted' } }
    $script:_HaltLatch = $true

    $resolvedDb = if ($DbPath) { $DbPath } elseif ($script:_BusDbPath) { $script:_BusDbPath } else { $null }

    if ($resolvedDb) {
        Invoke-SqliteQuery -DataSource $resolvedDb -Query @"
UPDATE bus_lifecycle_state SET value='halted' WHERE key='BusStatus'
"@ | Out-Null
        Invoke-SqliteQuery -DataSource $resolvedDb -Query @"
UPDATE bus_lifecycle_state SET value=@v WHERE key='halt_reason'
"@ -SqlParameters @{ v = $HaltReason } | Out-Null
    }

    return @{ Halted = $true; HaltReason = $HaltReason }
}

function Invoke-Halt-UserInterrupt {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [string]$DbPath,
        [scriptblock]$DbExecutor
    )
    return Invoke-BusHalt -HaltReason 'user_interrupt' -DbPath $DbPath -DbExecutor $DbExecutor
}

function Get-BusStatus {
    param(
        [string]$DbPath
    )
    $resolvedDb = if ($DbPath) { $DbPath } elseif ($script:_BusDbPath) { $script:_BusDbPath } else { $null }
    if (-not $resolvedDb) { return 'running' }
    $row = Invoke-SqliteQuery -DataSource $resolvedDb -Query "SELECT value FROM bus_lifecycle_state WHERE key='BusStatus'" | Select-Object -First 1
    return if ($row) { $row.value } else { 'running' }
}

function Get-BusHaltReason {
    param(
        [string]$DbPath
    )
    $resolvedDb = if ($DbPath) { $DbPath } elseif ($script:_BusDbPath) { $script:_BusDbPath } else { $null }
    if (-not $resolvedDb) { return '' }
    $row = Invoke-SqliteQuery -DataSource $resolvedDb -Query "SELECT value FROM bus_lifecycle_state WHERE key='halt_reason'" | Select-Object -First 1
    return if ($row) { $row.value } else { '' }
}

function Reset-BusLifecycleLatch {
    $script:_HaltLatch = $false
}
