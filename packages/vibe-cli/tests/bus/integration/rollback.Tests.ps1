Describe 'T29 Rollback Subsystem Integration Tests' {

    BeforeAll {
        Import-Module PSSQLite -ErrorAction SilentlyContinue
        . "$PSScriptRoot/../../../bus/infra/evt-id-allocator.ps1"
        . "$PSScriptRoot/../../../bus/domain/bus-lifecycle.ps1"
        . "$PSScriptRoot/../../../bus/domain/consensus-round.ps1"
        . "$PSScriptRoot/../../../bus/infra/working-tree-coordinator.ps1"
        . "$PSScriptRoot/../../../bus/domain/rollback-coordinator.ps1"
        . "$PSScriptRoot/../../../bus/router/rollback.ps1"
        if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
            function global:Write-PipelineLog { param($Message,$Severity='INFO',$Gate=$null,$StructuredData=$null) }
        }
    }

    BeforeEach {
        $script:TestDir = Join-Path $env:TEMP "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory $script:TestDir | Out-Null
        $script:SnapshotDir = Join-Path $script:TestDir 'snapshots'
        New-Item -ItemType Directory $script:SnapshotDir | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'
        $script:Conn = New-SQLiteConnection -DataSource $script:DbPath
        foreach ($f in @('bus-lifecycle-state','rollback-state','consensus-state','agent-sessions')) {
            $sql = Get-Content "$PSScriptRoot/../../../bus/schema/$f.sql" -Raw
            Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $sql
        }
        Reset-BusLifecycleLatch
        Initialize-EvtIdAllocator -StartValue 100  # start high so advance works
    }

    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    # --- Invoke-BusTakeSnapshot tests ---

    It 'T01: Invoke-BusTakeSnapshot creates .snapshot file in SnapshotDir' {
        $result = Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main'
        $snapshotPath = Join-Path $script:SnapshotDir 'snapshot-main.snapshot'
        Test-Path $snapshotPath | Should -BeTrue
        $result.SnapshotPath | Should -Be $snapshotPath
    }

    It 'T02: Invoke-BusTakeSnapshot deletes .tmp file after rename' {
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main' | Out-Null
        $tmpPath = Join-Path $script:SnapshotDir 'snapshot-main.snapshot.tmp'
        Test-Path $tmpPath | Should -BeFalse
    }

    It 'T03: Invoke-BusTakeSnapshot stores snapshotExists=1 in rollback_state' {
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main' | Out-Null
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT value FROM rollback_state WHERE key='snapshotExists'"
        $row.value | Should -Be '1'
    }

    It 'T04: Invoke-BusTakeSnapshot stores SHA-256 hash in rollback_state' {
        $result = Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main'
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT value FROM rollback_state WHERE key='snapshot_hash_main'"
        $row.value | Should -Not -BeNullOrEmpty
        $row.value | Should -Be $result.Sha256Hash
        # SHA-256 hex is 64 chars
        $row.value.Length | Should -Be 64
    }

    It 'T05: Invoke-BusTakeSnapshot returns WrittenAt timestamp' {
        $result = Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main'
        $result.WrittenAt | Should -Not -BeNullOrEmpty
    }

    # --- Test-SnapshotIntegrity tests ---

    It 'T06: Test-SnapshotIntegrity returns Valid=$true for a valid snapshot' {
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main' | Out-Null
        $result = Test-SnapshotIntegrity -SnapshotDir $script:SnapshotDir -WorktreeLeaf 'main' -Connection $script:Conn
        $result.Valid | Should -BeTrue
        $result.Sha256Hash | Should -Not -BeNullOrEmpty
    }

    It 'T07: Test-SnapshotIntegrity returns Valid=$false for a non-existent file' {
        $result = Test-SnapshotIntegrity -SnapshotDir $script:SnapshotDir -WorktreeLeaf 'nonexistent' -Connection $script:Conn
        $result.Valid | Should -BeFalse
        $result.Reason | Should -Be 'file_not_found'
    }

    It 'T08: Test-SnapshotIntegrity returns Valid=$false on hash mismatch (tampered file)' {
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main' | Out-Null
        # Tamper the snapshot file
        $snapshotPath = Join-Path $script:SnapshotDir 'snapshot-main.snapshot'
        [System.IO.File]::AppendAllText($snapshotPath, 'TAMPERED')
        $result = Test-SnapshotIntegrity -SnapshotDir $script:SnapshotDir -WorktreeLeaf 'main' -Connection $script:Conn
        $result.Valid | Should -BeFalse
        $result.Reason | Should -Be 'hash_mismatch'
    }

    It 'T09: Test-SnapshotIntegrity on mismatch resets snapshotExists=0 in DB' {
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main' | Out-Null
        $snapshotPath = Join-Path $script:SnapshotDir 'snapshot-main.snapshot'
        [System.IO.File]::AppendAllText($snapshotPath, 'TAMPERED')
        Test-SnapshotIntegrity -SnapshotDir $script:SnapshotDir -WorktreeLeaf 'main' -Connection $script:Conn | Out-Null
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT value FROM rollback_state WHERE key='snapshotExists'"
        $row.value | Should -Be '0'
    }

    # --- Invoke-BusRollbackCoordination tests ---

    It 'T10: Invoke-BusRollbackCoordination sets busStatus=halted in DB' {
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main' | Out-Null
        Invoke-BusRollbackCoordination -Connection $script:Conn -WorktreeLeaf 'main' -SnapshotDir $script:SnapshotDir
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.BusStatus | Should -Be 'halted'
    }

    It 'T11: Invoke-BusRollbackCoordination sets halt_reason=user_rollback in DB' {
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main' | Out-Null
        Reset-BusLifecycleLatch
        Invoke-BusRollbackCoordination -Connection $script:Conn -WorktreeLeaf 'main' -SnapshotDir $script:SnapshotDir
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.HaltReason | Should -Be 'user_rollback'
    }

    It 'T12: Invoke-BusRollbackCoordination sets failure_category=NULL in DB (OBJ-R5-1)' {
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main' | Out-Null
        Reset-BusLifecycleLatch
        Invoke-BusRollbackCoordination -Connection $script:Conn -WorktreeLeaf 'main' -SnapshotDir $script:SnapshotDir
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.FailureCategory | Should -BeNullOrEmpty
    }

    It 'T13: Invoke-BusRollbackCoordination sets rollbackRequested=1 in rollback_state' {
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main' | Out-Null
        Reset-BusLifecycleLatch
        Invoke-BusRollbackCoordination -Connection $script:Conn -WorktreeLeaf 'main' -SnapshotDir $script:SnapshotDir
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT value FROM rollback_state WHERE key='rollbackRequested'"
        $row.value | Should -Be '1'
    }

    It 'T14: Invoke-BusRollbackCoordination advances consensusRoundStart' {
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main' | Out-Null
        Reset-BusLifecycleLatch
        $before = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT value FROM consensus_state WHERE key='consensusRoundStart'"
        Invoke-BusRollbackCoordination -Connection $script:Conn -WorktreeLeaf 'main' -SnapshotDir $script:SnapshotDir
        $after = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT value FROM consensus_state WHERE key='consensusRoundStart'"
        [long]$after.value | Should -BeGreaterThan ([long]$before.value)
    }

    It 'T15: Invoke-BusRollbackCoordination with pipeline_lock=1 throws RollbackError' {
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "UPDATE bus_lifecycle_state SET value='1' WHERE key='pipeline_lock'"
        { Invoke-BusRollbackCoordination -Connection $script:Conn -WorktreeLeaf 'main' -SnapshotDir $script:SnapshotDir } | Should -Throw "*RollbackError*"
    }

    It 'T16: Invoke-BusRollbackCoordination with corrupt snapshot returns Rolled=$false' {
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main' | Out-Null
        Reset-BusLifecycleLatch
        # Corrupt the snapshot
        $snapshotPath = Join-Path $script:SnapshotDir 'snapshot-main.snapshot'
        [System.IO.File]::AppendAllText($snapshotPath, 'CORRUPTED')
        $result = Invoke-BusRollbackCoordination -Connection $script:Conn -WorktreeLeaf 'main' -SnapshotDir $script:SnapshotDir
        $result.Rolled | Should -BeFalse
        $result.Reason | Should -Be 'snapshot_integrity_failed'
    }

    # --- Invoke-BusRollback tests ---

    It 'T17: Invoke-BusRollback without -SkipSnapshot calls Invoke-BusTakeSnapshot (snapshot file exists)' {
        Reset-BusLifecycleLatch
        Invoke-BusRollback -Connection $script:Conn -WorktreeLeaf 'main' -SnapshotDir $script:SnapshotDir
        $snapshotPath = Join-Path $script:SnapshotDir 'snapshot-main.snapshot'
        Test-Path $snapshotPath | Should -BeTrue
    }

    It 'T18: Invoke-BusRollback -SkipSnapshot skips snapshot but still runs coordination' {
        # Pre-create a valid snapshot so integrity check passes
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main' | Out-Null
        Reset-BusLifecycleLatch
        $result = Invoke-BusRollback -Connection $script:Conn -WorktreeLeaf 'main' -SnapshotDir $script:SnapshotDir -SkipSnapshot
        $result.Rolled | Should -BeTrue
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.BusStatus | Should -Be 'halted'
    }

    It 'T19: Invoke-BusRollback returns @{ Rolled=$true }' {
        Reset-BusLifecycleLatch
        $result = Invoke-BusRollback -Connection $script:Conn -WorktreeLeaf 'main' -SnapshotDir $script:SnapshotDir
        $result.Rolled | Should -BeTrue
    }

    It 'T20: After rollback, Get-BusLifecycleState shows BusStatus=halted, HaltReason=user_rollback, FailureCategory=$null' {
        Reset-BusLifecycleLatch
        Invoke-BusRollback -Connection $script:Conn -WorktreeLeaf 'main' -SnapshotDir $script:SnapshotDir
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.BusStatus | Should -Be 'halted'
        $state.HaltReason | Should -Be 'user_rollback'
        $state.FailureCategory | Should -BeNullOrEmpty
    }

    It 'T21: InvNoLostWrites — after rollback, all events remain in event_log (no rows deleted)' {
        # Create event_log table and insert some rows
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query @"
CREATE TABLE IF NOT EXISTS event_log (
    evt_id INTEGER PRIMARY KEY,
    event_type TEXT,
    payload TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
)
"@
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "INSERT INTO event_log (evt_id, event_type, payload) VALUES (1,'test_event','{}'),(2,'test_event2','{}')"
        $countBefore = (Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT COUNT(*) as cnt FROM event_log").cnt

        Reset-BusLifecycleLatch
        Invoke-BusRollback -Connection $script:Conn -WorktreeLeaf 'main' -SnapshotDir $script:SnapshotDir

        $countAfter = (Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT COUNT(*) as cnt FROM event_log").cnt
        $countAfter | Should -Be $countBefore
    }

    It 'T22: Invoke-BusTakeSnapshot stores rollbackTargetWorktree in rollback_state after coordination' {
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'feature-branch' | Out-Null
        Reset-BusLifecycleLatch
        Invoke-BusRollbackCoordination -Connection $script:Conn -WorktreeLeaf 'feature-branch' -SnapshotDir $script:SnapshotDir
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT value FROM rollback_state WHERE key='rollbackTargetWorktree'"
        $row.value | Should -Be 'feature-branch'
    }

    It 'T23: Invoke-BusTakeSnapshot snapshot file contains serialized DB state (non-empty JSON)' {
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main' | Out-Null
        $snapshotPath = Join-Path $script:SnapshotDir 'snapshot-main.snapshot'
        $content = Get-Content $snapshotPath -Raw
        $content | Should -Not -BeNullOrEmpty
        # Should parse as JSON
        { $content | ConvertFrom-Json } | Should -Not -Throw
    }

    It 'T24: Invoke-BusRollback uses default TEMP snapshot dir when SnapshotDir not specified' {
        Reset-BusLifecycleLatch
        $defaultSnapDir = Join-Path $env:TEMP 'vibe-snapshots'
        try {
            $result = Invoke-BusRollback -Connection $script:Conn -WorktreeLeaf 'main'
            $result.Rolled | Should -BeTrue
            $snapshotPath = Join-Path $defaultSnapDir 'snapshot-main.snapshot'
            Test-Path $snapshotPath | Should -BeTrue
        } finally {
            # Clean up default snapshot
            Remove-Item (Join-Path $defaultSnapDir 'snapshot-main.snapshot') -ErrorAction SilentlyContinue
        }
    }

    It 'T25: Reset-RollbackState clears rollbackRequested back to 0' {
        Invoke-BusTakeSnapshot -SnapshotDir $script:SnapshotDir -Connection $script:Conn -WorktreeLeaf 'main' | Out-Null
        Reset-BusLifecycleLatch
        Invoke-BusRollbackCoordination -Connection $script:Conn -WorktreeLeaf 'main' -SnapshotDir $script:SnapshotDir
        Reset-RollbackState -Connection $script:Conn
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT value FROM rollback_state WHERE key='rollbackRequested'"
        $row.value | Should -Be '0'
    }
}
