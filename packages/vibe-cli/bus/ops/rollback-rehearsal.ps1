Import-Module PSSQLite -ErrorAction SilentlyContinue

# ---------------------------------------------------------------------------
# Module-level reset state
# ---------------------------------------------------------------------------
$script:_RehearsalState = @{ Initialized = $false }

# ---------------------------------------------------------------------------
# New-RehearsalDatabase
# Creates a fresh SQLite DB with bus schema + known fixture state.
# Self-contained: no dot-sourcing of schema files.
# ---------------------------------------------------------------------------
function New-RehearsalDatabase {
    param([Parameter(Mandatory)][string]$DbPath)

    # Ensure parent directory exists
    $parentDir = Split-Path $DbPath -Parent
    if ($parentDir -and -not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }

    # Create all tables
    $ddl = @(
        "CREATE TABLE IF NOT EXISTS bus_lifecycle_state (key TEXT PRIMARY KEY, value TEXT)",
        "CREATE TABLE IF NOT EXISTS event_log (id INTEGER PRIMARY KEY AUTOINCREMENT, evt_id INTEGER, [from] TEXT, [to] TEXT, event_type TEXT, payload TEXT, status TEXT, created_at TEXT)",
        "CREATE TABLE IF NOT EXISTS agent_sessions (session_id TEXT PRIMARY KEY, agent_id TEXT, role TEXT, status TEXT, started_at TEXT, ended_at TEXT, ground_truth_delivered INTEGER NOT NULL DEFAULT 0)",
        "CREATE TABLE IF NOT EXISTS rollback_state (key TEXT PRIMARY KEY, value TEXT)",
        "CREATE TABLE IF NOT EXISTS consensus_state (key TEXT PRIMARY KEY, value TEXT)"
    )
    foreach ($sql in $ddl) {
        Invoke-SqliteQuery -DataSource $DbPath -Query $sql | Out-Null
    }

    # Populate bus_lifecycle_state with known fixture state
    $lifecycleRows = @(
        @{ key = 'BusStatus';         value = 'running' },
        @{ key = 'pipeline_lock';     value = '0'       },
        @{ key = 'halt_reason';       value = $null     },
        @{ key = 'failure_category';  value = $null     },
        @{ key = 'halt_intent';       value = $null     },
        @{ key = 'recovery_owner';    value = $null     }
    )
    foreach ($row in $lifecycleRows) {
        Invoke-SqliteQuery -DataSource $DbPath -Query `
            "INSERT OR REPLACE INTO bus_lifecycle_state (key, value) VALUES (@k, @v)" `
            -SqlParameters @{ k = $row.key; v = $row.value } | Out-Null
    }

    # Populate consensus_state: ConsensusRound=3
    $consensusRows = @(
        @{ key = 'consensusRound';         value = '3'    },
        @{ key = 'consensusState';         value = 'open' },
        @{ key = 'consensusRoundStart';    value = '1'    },
        @{ key = 'unresolvedObjections';   value = '[]'   },
        @{ key = 'overriddenObjections';   value = '[]'   }
    )
    foreach ($row in $consensusRows) {
        Invoke-SqliteQuery -DataSource $DbPath -Query `
            "INSERT OR REPLACE INTO consensus_state (key, value) VALUES (@k, @v)" `
            -SqlParameters @{ k = $row.key; v = $row.value } | Out-Null
    }

    # Populate rollback_state
    $rollbackRows = @(
        @{ key = 'rollbackRequested';       value = '0'  },
        @{ key = 'rollbackTargetWorktree';  value = $null },
        @{ key = 'snapshotExists';          value = '0'  },
        @{ key = 'rollback_phase';          value = $null },
        @{ key = 'rollback_execution_id';   value = $null }
    )
    foreach ($row in $rollbackRows) {
        Invoke-SqliteQuery -DataSource $DbPath -Query `
            "INSERT OR REPLACE INTO rollback_state (key, value) VALUES (@k, @v)" `
            -SqlParameters @{ k = $row.key; v = $row.value } | Out-Null
    }

    # Populate event_log: 10 events (8 committed, 2 routed), evt_id 1..10
    $ts = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    for ($i = 1; $i -le 10; $i++) {
        $status = if ($i -le 8) { 'committed' } else { 'routed' }
        Invoke-SqliteQuery -DataSource $DbPath -Query `
            "INSERT INTO event_log (evt_id, [from], [to], event_type, payload, status, created_at) VALUES (@id, @from, @to, @et, @pl, @st, @ca)" `
            -SqlParameters @{
                id   = $i
                from = 'rehearsal'
                to   = 'bus'
                et   = 'rehearsal_event'
                pl   = "{`"seq`":$i}"
                st   = $status
                ca   = $ts
            } | Out-Null
    }

    # Populate agent_sessions: 2 active sessions
    $sessions = @(
        @{ session_id = 'rehearsal-agent-001'; agent_id = 'agent-alpha'; role = 'writer'; status = 'active' },
        @{ session_id = 'rehearsal-agent-002'; agent_id = 'agent-beta';  role = 'reviewer'; status = 'active' }
    )
    foreach ($s in $sessions) {
        Invoke-SqliteQuery -DataSource $DbPath -Query `
            "INSERT OR REPLACE INTO agent_sessions (session_id, agent_id, role, status, started_at) VALUES (@sid, @aid, @role, @st, @sa)" `
            -SqlParameters @{
                sid  = $s.session_id
                aid  = $s.agent_id
                role = $s.role
                st   = $s.status
                sa   = $ts
            } | Out-Null
    }
}

# ---------------------------------------------------------------------------
# Corrupt-RehearsalState
# Deliberately corrupts bus_lifecycle_state to simulate a bad run.
# ---------------------------------------------------------------------------
function Corrupt-RehearsalState {
    param([Parameter(Mandatory)][string]$DbPath)

    Invoke-SqliteQuery -DataSource $DbPath -Query `
        "UPDATE bus_lifecycle_state SET value='corrupted' WHERE key='BusStatus'" | Out-Null
    Invoke-SqliteQuery -DataSource $DbPath -Query `
        "DELETE FROM event_log WHERE evt_id > 7" | Out-Null
    Invoke-SqliteQuery -DataSource $DbPath -Query `
        "UPDATE agent_sessions SET status='crashed'" | Out-Null
}

# ---------------------------------------------------------------------------
# _Take-RehearsalSnapshot (internal)
# Copies the SQLite DB file to SnapshotDir with a timestamped name.
# Stores SHA-256 in rollback_state.
# ---------------------------------------------------------------------------
function _Take-RehearsalSnapshot {
    param(
        [Parameter(Mandatory)][string]$DbPath,
        [Parameter(Mandatory)][string]$SnapshotDir,
        [scriptblock]$GetUtcNow = $null
    )

    if (-not (Test-Path $SnapshotDir)) {
        New-Item -ItemType Directory -Path $SnapshotDir -Force | Out-Null
    }

    $ts = if ($GetUtcNow) { & $GetUtcNow } else {
        (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
    }
    $snapshotPath = Join-Path $SnapshotDir "bus-snapshot-$ts.db"

    # Copy the DB file to snapshot location
    Copy-Item -Path $DbPath -Destination $snapshotPath -Force

    # Compute SHA-256 of the snapshot file
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $fileBytes = [System.IO.File]::ReadAllBytes($snapshotPath)
    $hashBytes = $sha256.ComputeHash($fileBytes)
    $sha256.Dispose()
    $hash = ([BitConverter]::ToString($hashBytes)).Replace('-', '').ToLower()

    # Store hash and snapshot path in rollback_state
    Invoke-SqliteQuery -DataSource $DbPath -Query `
        "INSERT OR REPLACE INTO rollback_state (key, value) VALUES ('snapshot_hash', @v)" `
        -SqlParameters @{ v = $hash } | Out-Null
    Invoke-SqliteQuery -DataSource $DbPath -Query `
        "INSERT OR REPLACE INTO rollback_state (key, value) VALUES ('snapshot_path', @v)" `
        -SqlParameters @{ v = $snapshotPath } | Out-Null
    Invoke-SqliteQuery -DataSource $DbPath -Query `
        "UPDATE rollback_state SET value='1' WHERE key='snapshotExists'" | Out-Null

    return @{
        SnapshotPath = $snapshotPath
        Sha256Hash   = $hash
    }
}

# ---------------------------------------------------------------------------
# _Restore-RehearsalSnapshot (internal)
# Restores the SQLite DB from the snapshot, then applies rollback state markers.
# ---------------------------------------------------------------------------
function _Restore-RehearsalSnapshot {
    param(
        [Parameter(Mandatory)][string]$DbPath,
        [Parameter(Mandatory)][string]$SnapshotPath
    )

    if (-not (Test-Path $SnapshotPath)) {
        throw "RehearsalError: snapshot file not found at '$SnapshotPath'"
    }

    # Restore by overwriting the DB
    Copy-Item -Path $SnapshotPath -Destination $DbPath -Force

    # Apply post-rollback state: halted + user_rollback
    Invoke-SqliteQuery -DataSource $DbPath -Query `
        "UPDATE bus_lifecycle_state SET value='halted' WHERE key='BusStatus'" | Out-Null
    Invoke-SqliteQuery -DataSource $DbPath -Query `
        "UPDATE bus_lifecycle_state SET value='user_rollback' WHERE key='halt_reason'" | Out-Null
    Invoke-SqliteQuery -DataSource $DbPath -Query `
        "UPDATE bus_lifecycle_state SET value='0' WHERE key='pipeline_lock'" | Out-Null
    Invoke-SqliteQuery -DataSource $DbPath -Query `
        "INSERT OR REPLACE INTO rollback_state (key, value) VALUES ('rollbackRequested', '0')" | Out-Null
}

# ---------------------------------------------------------------------------
# Assert-RollbackSucceeded
# Verifies post-rollback state matches expectations. Throws on failure.
# ---------------------------------------------------------------------------
function Assert-RollbackSucceeded {
    param(
        [Parameter(Mandatory)][string]$DbPath,
        [Parameter(Mandatory)][hashtable]$PreCorruptionState
    )

    $errors = [System.Collections.Generic.List[string]]::new()

    # Check event count
    $evtCount = (Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT COUNT(*) as cnt FROM event_log").cnt
    if ($evtCount -ne 10) {
        $errors.Add("event_log count=$evtCount expected=10")
    }

    # Check BusStatus=halted
    $busStatus = (Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='BusStatus'").value
    if ($busStatus -ne 'halted') {
        $errors.Add("BusStatus='$busStatus' expected='halted'")
    }

    # Check halt_reason=user_rollback
    $haltReason = (Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='halt_reason'").value
    if ($haltReason -ne 'user_rollback') {
        $errors.Add("halt_reason='$haltReason' expected='user_rollback'")
    }

    # Check rollbackRequested=0
    $rollbackReq = (Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT value FROM rollback_state WHERE key='rollbackRequested'").value
    if ($rollbackReq -ne '0') {
        $errors.Add("rollbackRequested='$rollbackReq' expected='0'")
    }

    if ($errors.Count -gt 0) {
        throw "RollbackAssertionFailed: $($errors -join '; ')"
    }
}

# ---------------------------------------------------------------------------
# Reset-RollbackRehearsalState
# Test helper — resets any module-level state.
# ---------------------------------------------------------------------------
function Reset-RollbackRehearsalState {
    $script:_RehearsalState = @{ Initialized = $false }
}

# ---------------------------------------------------------------------------
# Invoke-RollbackRehearsal
# Main entry point — exercises full snapshot → corrupt → rollback → verify cycle.
# ---------------------------------------------------------------------------
function Invoke-RollbackRehearsal {
    param(
        [Parameter(Mandatory)][string]$DbPath,
        [Parameter(Mandatory)][string]$SnapshotDir,
        [switch]$Quiet,
        [scriptblock]$GetUtcNow = $null
    )

    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    try {
        # Step 1: Create rehearsal DB with known fixture state
        New-RehearsalDatabase -DbPath $DbPath

        # Step 2: Capture pre-corruption state
        $preState = @{
            EventCount     = (Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT COUNT(*) as cnt FROM event_log").cnt
            BusStatus      = (Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='BusStatus'").value
            AgentStatuses  = @(Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT status FROM agent_sessions" | ForEach-Object { $_.status })
        }

        # Step 3: Take snapshot before corruption
        $snapResult = _Take-RehearsalSnapshot -DbPath $DbPath -SnapshotDir $SnapshotDir -GetUtcNow $GetUtcNow
        $snapshotPath = $snapResult.SnapshotPath

        # Step 4: Corrupt state
        Corrupt-RehearsalState -DbPath $DbPath

        # Step 5: Verify corruption happened
        $corruptedStatus = (Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='BusStatus'").value
        if ($corruptedStatus -ne 'corrupted') {
            throw "RehearsalError: corruption verification failed — BusStatus='$corruptedStatus'"
        }

        # Step 6: Perform rollback (restore from snapshot + apply rollback markers)
        _Restore-RehearsalSnapshot -DbPath $DbPath -SnapshotPath $snapshotPath

        # Step 7: Capture post-rollback state
        $postState = @{
            EventCount  = (Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT COUNT(*) as cnt FROM event_log").cnt
            BusStatus   = (Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='BusStatus'").value
            HaltReason  = (Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='halt_reason'").value
        }

        # Step 8: Assert rollback succeeded
        Assert-RollbackSucceeded -DbPath $DbPath -PreCorruptionState $preState

        $sw.Stop()

        return @{
            Success          = $true
            SnapshotPath     = $snapshotPath
            PreState         = $preState
            PostRollbackState = $postState
            RehearsalMs      = $sw.Elapsed.TotalMilliseconds
        }
    }
    catch {
        $sw.Stop()
        if (-not $Quiet) {
            Write-Host "[REHEARSAL ERROR] $($_.Exception.Message)"
        }
        return @{
            Success     = $false
            Error       = $_
            RehearsalMs = $sw.Elapsed.TotalMilliseconds
        }
    }
}
