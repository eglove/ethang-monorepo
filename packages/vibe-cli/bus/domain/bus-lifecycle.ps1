Import-Module PSSQLite -ErrorAction SilentlyContinue
# bus/domain/bus-lifecycle.ps1
# BusLifecycle aggregate — encapsulates busStatus, haltReason, failureCategory, pipeline_lock
#
# Invariants enforced:
#   I3  InvHaltLatchMonotonic   — once halt latch is set it is never cleared
#   INV-4  OnlyDefinedHalts     — only ValidateSet values accepted
#   INV-13 BusRunningImpliesLockHeld — halt releases pipeline_lock
#   INV-15 MechanicalHaltHasCategory — mechanical_error requires FailureCategory
#
# $Connection parameter is always a SQLite file path string.

$script:_HaltLatch = [int]0

# ---------------------------------------------------------------------------
# Helper: open a raw SQLiteConnection for transaction work
# ---------------------------------------------------------------------------
function _OpenConn {
    param([string]$DataSource)
    $c = New-SQLiteConnection -DataSource $DataSource
    if ($c.State -ne 'Open') { $c.Open() }
    return $c
}

# ---------------------------------------------------------------------------
# Helper: execute a non-query command with optional params; returns rows-affected
# ---------------------------------------------------------------------------
function _ExecCmd {
    param(
        [System.Data.SQLite.SQLiteConnection]$Conn,
        [System.Data.SQLite.SQLiteTransaction]$Txn,
        [string]$Sql,
        [hashtable]$Params = @{}
    )
    $cmd = $Conn.CreateCommand()
    $cmd.Transaction = $Txn
    $cmd.CommandText = $Sql
    foreach ($k in $Params.Keys) {
        $cmd.Parameters.AddWithValue("@$k", $Params[$k]) | Out-Null
    }
    return $cmd.ExecuteNonQuery()
}

# ---------------------------------------------------------------------------
# Helper: execute a scalar command; returns the scalar value
# ---------------------------------------------------------------------------
function _ScalarCmd {
    param(
        [System.Data.SQLite.SQLiteConnection]$Conn,
        [System.Data.SQLite.SQLiteTransaction]$Txn,
        [string]$Sql
    )
    $cmd = $Conn.CreateCommand()
    if ($null -ne $Txn) { $cmd.Transaction = $Txn }
    $cmd.CommandText = $Sql
    return $cmd.ExecuteScalar()
}

# ---------------------------------------------------------------------------
# Get-BusLifecycleState
# ---------------------------------------------------------------------------
function Get-BusLifecycleState {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Connection)

    $rows = Invoke-SqliteQuery -DataSource $Connection `
        -Query "SELECT key, value FROM bus_lifecycle_state"

    $map = @{}
    foreach ($r in $rows) { $map[$r.key] = $r.value }

    $lockVal = $map['pipeline_lock']
    $lockInt  = if ($null -ne $lockVal -and $lockVal -ne '') { [int]$lockVal } else { 0 }

    return @{
        BusStatus       = $map['busStatus']
        PipelineLock    = $lockInt
        HaltReason      = $map['halt_reason']
        FailureCategory = $map['failure_category']
        HaltIntent      = $map['halt_intent']
        RecoveryOwner   = $map['recovery_owner']
    }
}

# ---------------------------------------------------------------------------
# Invoke-BusAcquirePipelineLock
# ---------------------------------------------------------------------------
function Invoke-BusAcquirePipelineLock {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Connection)

    $conn = _OpenConn -DataSource $Connection
    try {
        $txn = $conn.BeginTransaction([System.Data.IsolationLevel]::Serializable)
        try {
            $affected = _ExecCmd -Conn $conn -Txn $txn `
                -Sql "UPDATE bus_lifecycle_state SET value='1' WHERE key='pipeline_lock' AND value='0'"
            $txn.Commit()
            return ($affected -gt 0)
        }
        catch {
            $txn.Rollback()
            throw
        }
    }
    finally {
        $conn.Close()
    }
}

# ---------------------------------------------------------------------------
# Invoke-BusReleasePipelineLock
# ---------------------------------------------------------------------------
function Invoke-BusReleasePipelineLock {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Connection)

    Invoke-SqliteQuery -DataSource $Connection `
        -Query "UPDATE bus_lifecycle_state SET value='0' WHERE key='pipeline_lock'"
}

# ---------------------------------------------------------------------------
# Invoke-BusHalt
# ---------------------------------------------------------------------------
function Invoke-BusHalt {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)]
        [ValidateSet('feature_complete','user_interrupt','mechanical_error','user_rollback')]
        [string]$HaltReason,
        [ValidateSet('sqlite_error','agent_crash','git_commit','mechanical_error',$null)]
        [string]$FailureCategory = $null,
        [scriptblock]$HaltLatchStore = $null
    )

    # INV-15: mechanical_error requires FailureCategory
    if ($HaltReason -eq 'mechanical_error' -and [string]::IsNullOrEmpty($FailureCategory)) {
        throw 'mechanical_error requires FailureCategory'
    }

    # InvHaltLatchMonotonic (I3): only first caller proceeds
    $wasZero = [System.Threading.Interlocked]::CompareExchange([ref]$script:_HaltLatch, 1, 0)
    if ($wasZero -ne 0) {
        # Latch already set — this is a no-op
        return
    }

    # If caller supplied a custom latch store (for testing), invoke it
    if ($null -ne $HaltLatchStore) {
        & $HaltLatchStore
    }

    $conn = _OpenConn -DataSource $Connection
    try {
        # Step 1: write halt_intent (SQLite-first, OBJ-R7-EC-1)
        $txn1 = $conn.BeginTransaction([System.Data.IsolationLevel]::Serializable)
        try {
            _ExecCmd -Conn $conn -Txn $txn1 `
                -Sql "UPDATE bus_lifecycle_state SET value=@v WHERE key='halt_intent'" `
                -Params @{ v = $HaltReason } | Out-Null
            $txn1.Commit()
        }
        catch {
            $txn1.Rollback()
            throw
        }

        # Step 2: write busStatus='halted', halt_reason, failure_category
        $txn2 = $conn.BeginTransaction([System.Data.IsolationLevel]::Serializable)
        try {
            _ExecCmd -Conn $conn -Txn $txn2 `
                -Sql "UPDATE bus_lifecycle_state SET value='halted' WHERE key='busStatus'" | Out-Null
            _ExecCmd -Conn $conn -Txn $txn2 `
                -Sql "UPDATE bus_lifecycle_state SET value=@v WHERE key='halt_reason'" `
                -Params @{ v = $HaltReason } | Out-Null
            $fcVal = if ([string]::IsNullOrEmpty($FailureCategory)) { [DBNull]::Value } else { $FailureCategory }
            _ExecCmd -Conn $conn -Txn $txn2 `
                -Sql "UPDATE bus_lifecycle_state SET value=@v WHERE key='failure_category'" `
                -Params @{ v = $fcVal } | Out-Null
            $txn2.Commit()
        }
        catch {
            $txn2.Rollback()
            throw
        }
    }
    finally {
        $conn.Close()
    }

    # Step 3: release pipeline_lock (INV-13 BusRunningImpliesLockHeld)
    Invoke-BusReleasePipelineLock -Connection $Connection
}

# ---------------------------------------------------------------------------
# Invoke-BusResume
# ---------------------------------------------------------------------------
function Invoke-BusResume {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Connection)

    $conn = _OpenConn -DataSource $Connection
    try {
        $affected = _ExecCmd -Conn $conn -Txn $null `
            -Sql "UPDATE bus_lifecycle_state SET value='resuming' WHERE key='busStatus' AND value='halted'"

        if ($affected -eq 0) {
            throw 'Cannot resume: bus is not halted'
        }
    }
    finally {
        $conn.Close()
    }
}

# ---------------------------------------------------------------------------
# Invoke-BusResumed
# ---------------------------------------------------------------------------
function Invoke-BusResumed {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Connection)

    $conn = _OpenConn -DataSource $Connection
    try {
        $txn = $conn.BeginTransaction([System.Data.IsolationLevel]::Serializable)
        try {
            _ExecCmd -Conn $conn -Txn $txn `
                -Sql "UPDATE bus_lifecycle_state SET value='running' WHERE key='busStatus' AND value='resuming'" | Out-Null
            _ExecCmd -Conn $conn -Txn $txn `
                -Sql "UPDATE bus_lifecycle_state SET value=NULL WHERE key='halt_reason'" | Out-Null
            _ExecCmd -Conn $conn -Txn $txn `
                -Sql "UPDATE bus_lifecycle_state SET value=NULL WHERE key='failure_category'" | Out-Null
            $txn.Commit()
        }
        catch {
            $txn.Rollback()
            throw
        }
    }
    finally {
        $conn.Close()
    }
}

# ---------------------------------------------------------------------------
# Invoke-BusHaltIntentRecovery
# ---------------------------------------------------------------------------
function Invoke-BusHaltIntentRecovery {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Connection)

    $rows = Invoke-SqliteQuery -DataSource $Connection `
        -Query "SELECT key, value FROM bus_lifecycle_state WHERE key IN ('halt_intent','busStatus','recovery_owner')"

    $map = @{}
    foreach ($r in $rows) { $map[$r.key] = $r.value }

    $haltIntent = $map['halt_intent']
    $busStatus  = $map['busStatus']

    if ([string]::IsNullOrEmpty($haltIntent)) { return }
    if ($busStatus -eq 'halted') { return }

    # CAS on recovery_owner (OBJ-R9-3)
    $owner = [System.Guid]::NewGuid().ToString()
    $conn = _OpenConn -DataSource $Connection
    try {
        $txn = $conn.BeginTransaction([System.Data.IsolationLevel]::Serializable)
        try {
            $casAffected = _ExecCmd -Conn $conn -Txn $txn `
                -Sql "UPDATE bus_lifecycle_state SET value=@v WHERE key='recovery_owner' AND value IS NULL" `
                -Params @{ v = $owner }
            $txn.Commit()

            if ($casAffected -eq 0) { return }  # Another process won the CAS
        }
        catch {
            $txn.Rollback()
            throw
        }
    }
    finally {
        $conn.Close()
    }

    # Complete the halt
    Invoke-SqliteQuery -DataSource $Connection `
        -Query "UPDATE bus_lifecycle_state SET value='halted' WHERE key='busStatus'"
    Invoke-SqliteQuery -DataSource $Connection `
        -Query "UPDATE bus_lifecycle_state SET value=@v WHERE key='halt_reason'" `
        -SqlParameters @{ v = $haltIntent }
    Invoke-BusReleasePipelineLock -Connection $Connection
}

# ---------------------------------------------------------------------------
# Get-BusReadProjection
# ---------------------------------------------------------------------------
function Get-BusReadProjection {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Connection)

    $rows = Invoke-SqliteQuery -DataSource $Connection `
        -Query "SELECT key, value FROM bus_lifecycle_state"

    $map = @{}
    foreach ($r in $rows) { $map[$r.key] = $r.value }

    $lockVal = $map['pipeline_lock']
    $lockInt  = if ($null -ne $lockVal -and $lockVal -ne '') { [int]$lockVal } else { 0 }

    # Cross-aggregate reads (consensus_state, rollback_state) — stub if tables absent
    $consensusState    = $null
    $roundEpoch        = $null
    $rollbackRequested = $null

    $tables = Invoke-SqliteQuery -DataSource $Connection `
        -Query "SELECT name FROM sqlite_master WHERE type='table'"
    $tableNames = @($tables | ForEach-Object { $_.name })

    if ($tableNames -contains 'consensus_state') {
        $cs = Invoke-SqliteQuery -DataSource $Connection `
            -Query "SELECT value FROM consensus_state WHERE key='state' LIMIT 1"
        if ($cs) { $consensusState = $cs.value }
        $re = Invoke-SqliteQuery -DataSource $Connection `
            -Query "SELECT value FROM consensus_state WHERE key='round_epoch' LIMIT 1"
        if ($re) { $roundEpoch = $re.value }
    }

    if ($tableNames -contains 'rollback_state') {
        $rb = Invoke-SqliteQuery -DataSource $Connection `
            -Query "SELECT value FROM rollback_state WHERE key='rollback_requested' LIMIT 1"
        if ($rb) { $rollbackRequested = $rb.value }
    }

    return @{
        BusStatus         = $map['busStatus']
        PipelineLock      = $lockInt
        HaltReason        = $map['halt_reason']
        FailureCategory   = $map['failure_category']
        ConsensusState    = $consensusState
        RoundEpoch        = $roundEpoch
        RollbackRequested = $rollbackRequested
    }
}

# ---------------------------------------------------------------------------
# Reset-BusLifecycleLatch — resets the in-process halt latch (used by resume)
# ---------------------------------------------------------------------------
function Reset-BusLifecycleLatch { $script:_HaltLatch = 0 }
