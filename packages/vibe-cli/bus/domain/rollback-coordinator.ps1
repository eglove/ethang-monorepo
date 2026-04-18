Import-Module PSSQLite -ErrorAction SilentlyContinue

function _Compute-Sha256 {
    param([string]$Content)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Content)
    $hash = $sha256.ComputeHash($bytes)
    $sha256.Dispose()
    return ([BitConverter]::ToString($hash)).Replace('-','').ToLower()
}

function Invoke-BusTakeSnapshot {
    param(
        [Parameter(Mandatory)][string]$SnapshotDir,
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$WorktreeLeaf,
        [hashtable]$Coordinator = $null,
        [scriptblock]$GetUtcNow = $null
    )

    # Ensure snapshot dir exists
    if (-not (Test-Path $SnapshotDir)) {
        New-Item -ItemType Directory -Path $SnapshotDir -Force | Out-Null
    }

    # 1. Build snapshot bundle: serialize key DB tables to JSON
    $bundle = @{}
    foreach ($table in @('bus_lifecycle_state','rollback_state','consensus_state','agent_sessions')) {
        try {
            $rows = Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT * FROM $table"
            $bundle[$table] = $rows
        } catch {
            $bundle[$table] = @()
        }
    }
    $ts = if ($GetUtcNow) { & $GetUtcNow } else { (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ') }
    $bundle['_meta'] = @{ WorktreeLeaf = $WorktreeLeaf; WrittenAt = $ts }
    $jsonContent = $bundle | ConvertTo-Json -Depth 10 -Compress

    # 2. Write to .tmp file
    $tmpPath = Join-Path $SnapshotDir "snapshot-$WorktreeLeaf.snapshot.tmp"
    $snapshotPath = Join-Path $SnapshotDir "snapshot-$WorktreeLeaf.snapshot"
    [System.IO.File]::WriteAllText($tmpPath, $jsonContent, [System.Text.Encoding]::UTF8)

    # 3. Compute SHA-256 of content
    $hash = _Compute-Sha256 -Content $jsonContent

    # 4. Atomic rename .tmp -> .snapshot
    if (Test-Path $snapshotPath) {
        [System.IO.File]::Delete($snapshotPath)
    }
    [System.IO.File]::Move($tmpPath, $snapshotPath)

    # 5. Store hash in rollback_state
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query `
        "INSERT OR REPLACE INTO rollback_state (key,value) VALUES (@k,@v)" `
        -SqlParameters @{ k = "snapshot_hash_$WorktreeLeaf"; v = $hash } | Out-Null

    # 6. Update snapshotExists = '1'
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query `
        "UPDATE rollback_state SET value='1' WHERE key='snapshotExists'" | Out-Null

    return @{
        SnapshotPath = $snapshotPath
        Sha256Hash   = $hash
        WrittenAt    = $ts
    }
}

function Test-SnapshotIntegrity {
    param(
        [Parameter(Mandatory)][string]$SnapshotDir,
        [Parameter(Mandatory)][string]$WorktreeLeaf,
        [Parameter(Mandatory)]$Connection
    )

    $snapshotPath = Join-Path $SnapshotDir "snapshot-$WorktreeLeaf.snapshot"

    # 2. File existence check
    if (-not (Test-Path $snapshotPath)) {
        return @{ Valid = $false; Reason = 'file_not_found' }
    }

    # 3. Compute SHA-256 of file content
    $content = [System.IO.File]::ReadAllText($snapshotPath, [System.Text.Encoding]::UTF8)
    $computedHash = _Compute-Sha256 -Content $content

    # 4. Read stored hash
    $row = Invoke-SqliteQuery -SQLiteConnection $Connection -Query `
        "SELECT value FROM rollback_state WHERE key=@k" `
        -SqlParameters @{ k = "snapshot_hash_$WorktreeLeaf" }
    $storedHash = if ($row) { $row.value } else { $null }

    # 5. Compare hashes
    if ($computedHash -eq $storedHash) {
        return @{ Valid = $true; Sha256Hash = $computedHash }
    }

    # 6. Mismatch: reset snapshotExists, emit alarm
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query `
        "UPDATE rollback_state SET value='0' WHERE key='snapshotExists'" | Out-Null
    Write-Host "[ALARM] Snapshot hash mismatch for worktree '$WorktreeLeaf'. Expected=$storedHash Computed=$computedHash"

    return @{ Valid = $false; Reason = 'hash_mismatch' }
}

function Invoke-BusRollbackCoordination {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$WorktreeLeaf,
        [Parameter(Mandatory)][string]$SnapshotDir,
        [hashtable]$Coordinator = $null,
        [scriptblock]$GetUtcNow = $null
    )

    # 1. Verify drain: pipeline_lock must not be held
    $lockRow = Invoke-SqliteQuery -SQLiteConnection $Connection -Query `
        "SELECT value FROM bus_lifecycle_state WHERE key='pipeline_lock'"
    $lockVal = if ($lockRow) { $lockRow.value } else { '0' }
    if ($lockVal -eq '1') {
        throw "RollbackError: pipeline_lock is held — cannot rollback mid-commit"
    }

    # 2. Snapshot integrity check
    $integrity = Test-SnapshotIntegrity -SnapshotDir $SnapshotDir -WorktreeLeaf $WorktreeLeaf -Connection $Connection
    if (-not $integrity.Valid) {
        Write-Host "[ALARM] Snapshot integrity failed for worktree '$WorktreeLeaf': $($integrity.Reason)"
        Invoke-BusHalt -Connection $Connection -HaltReason 'mechanical_error' -FailureCategory 'snapshot_corruption'
        return @{ Rolled = $false; Reason = 'snapshot_integrity_failed' }
    }

    # 3. Single BEGIN IMMEDIATE transaction for all state mutations
    $rawConn = $Connection.SqliteConnection
    if (-not $rawConn) {
        # PSSQLite wraps the connection — try to get underlying connection
        $rawConn = $Connection
    }

    # Use raw SQLite commands for the transaction
    $cmd = $rawConn.CreateCommand()
    $cmd.CommandText = "BEGIN IMMEDIATE"
    $cmd.ExecuteNonQuery() | Out-Null

    try {
        $updates = @(
            "UPDATE bus_lifecycle_state SET value='halted' WHERE key='busStatus'",
            "UPDATE bus_lifecycle_state SET value='user_rollback' WHERE key='halt_reason'",
            "UPDATE bus_lifecycle_state SET value=NULL WHERE key='failure_category'",
            "UPDATE rollback_state SET value='1' WHERE key='rollbackRequested'",
            "UPDATE rollback_state SET value='$WorktreeLeaf' WHERE key='rollbackTargetWorktree'"
        )
        foreach ($sql in $updates) {
            $updateCmd = $rawConn.CreateCommand()
            $updateCmd.CommandText = $sql
            $updateCmd.ExecuteNonQuery() | Out-Null
        }

        $commitCmd = $rawConn.CreateCommand()
        $commitCmd.CommandText = "COMMIT"
        $commitCmd.ExecuteNonQuery() | Out-Null
    } catch {
        $rollbackCmd = $rawConn.CreateCommand()
        $rollbackCmd.CommandText = "ROLLBACK"
        try { $rollbackCmd.ExecuteNonQuery() | Out-Null } catch {}
        throw
    }

    # 4. Advance consensus round epoch (after transaction — per OBJ-R6-17)
    $newEpoch = Get-NextEvtId
    Invoke-AdvanceRoundEpoch -Connection $Connection -NewEpochEvtId $newEpoch

    # 5. Halt (idempotent — latch prevents double-halt, but the DB state is already set by our transaction above)
    # We call Invoke-BusHalt to ensure latch is set and any cleanup logic runs
    # But since our transaction already set busStatus='halted' and halt_reason='user_rollback',
    # Invoke-BusHalt will detect latch already set OR will be a no-op on the DB status
    Invoke-BusHalt -Connection $Connection -HaltReason 'user_rollback'

    # 6. Emit observable log
    Write-PipelineLog -Severity 'INFO' -Message "Rollback complete. BusLifecycleState='halted', HaltReason='user_rollback', FailureCategory=NULL"

    return @{
        Rolled        = $true
        WorktreeLeaf  = $WorktreeLeaf
        HaltReason    = 'user_rollback'
        FailureCategory = $null
    }
}
