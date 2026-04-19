BeforeAll {
    Import-Module PSSQLite -ErrorAction Stop
    $root = Resolve-Path "$PSScriptRoot/../../.."
    . "$root/bus/ops/rollback-rehearsal.ps1"

    function script:New-TestDbPath {
        return Join-Path ([System.IO.Path]::GetTempPath()) "rehearsal-$([guid]::NewGuid().ToString('N').Substring(0,8)).db"
    }

    function script:New-TestSnapshotDir {
        $dir = Join-Path ([System.IO.Path]::GetTempPath()) "rehearsal-snapshots-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        return $dir
    }
}

# T1: New-RehearsalDatabase creates a DB with all required tables
Describe 'T1: New-RehearsalDatabase creates all required tables' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
    }

    It 'creates bus_lifecycle_state table' {
        New-RehearsalDatabase -DbPath $script:dbPath
        $rows = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT name FROM sqlite_master WHERE type='table' AND name='bus_lifecycle_state'"
        $rows | Should -Not -BeNullOrEmpty
    }

    It 'creates event_log table' {
        New-RehearsalDatabase -DbPath $script:dbPath
        $rows = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT name FROM sqlite_master WHERE type='table' AND name='event_log'"
        $rows | Should -Not -BeNullOrEmpty
    }

    It 'creates agent_sessions table' {
        New-RehearsalDatabase -DbPath $script:dbPath
        $rows = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT name FROM sqlite_master WHERE type='table' AND name='agent_sessions'"
        $rows | Should -Not -BeNullOrEmpty
    }

    It 'creates rollback_state table' {
        New-RehearsalDatabase -DbPath $script:dbPath
        $rows = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT name FROM sqlite_master WHERE type='table' AND name='rollback_state'"
        $rows | Should -Not -BeNullOrEmpty
    }

    It 'creates consensus_state table' {
        New-RehearsalDatabase -DbPath $script:dbPath
        $rows = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT name FROM sqlite_master WHERE type='table' AND name='consensus_state'"
        $rows | Should -Not -BeNullOrEmpty
    }
}

# T2: New-RehearsalDatabase populates 10 events in event_log
Describe 'T2: New-RehearsalDatabase populates 10 events in event_log' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        New-RehearsalDatabase -DbPath $script:dbPath
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
    }

    It 'event_log has exactly 10 rows' {
        $count = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT COUNT(*) as cnt FROM event_log"
        $count.cnt | Should -Be 10
    }

    It 'event_log has 8 committed events' {
        $count = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT COUNT(*) as cnt FROM event_log WHERE status='committed'"
        $count.cnt | Should -Be 8
    }

    It 'event_log has 2 routed events' {
        $count = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT COUNT(*) as cnt FROM event_log WHERE status='routed'"
        $count.cnt | Should -Be 2
    }
}

# T3: New-RehearsalDatabase populates 2 agent sessions
Describe 'T3: New-RehearsalDatabase populates 2 agent sessions' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        New-RehearsalDatabase -DbPath $script:dbPath
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
    }

    It 'agent_sessions has exactly 2 rows' {
        $count = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT COUNT(*) as cnt FROM agent_sessions"
        $count.cnt | Should -Be 2
    }

    It 'agent sessions have status active' {
        $rows = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT status FROM agent_sessions"
        foreach ($r in @($rows)) {
            $r.status | Should -Be 'active'
        }
    }
}

# T4: New-RehearsalDatabase sets BusStatus=running
Describe 'T4: New-RehearsalDatabase sets BusStatus=running' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        New-RehearsalDatabase -DbPath $script:dbPath
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
    }

    It 'bus_lifecycle_state BusStatus is running' {
        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='BusStatus'"
        $row.value | Should -Be 'running'
    }

    It 'bus_lifecycle_state ConsensusRound is 3' {
        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT value FROM consensus_state WHERE key='consensusRound'"
        $row.value | Should -Be '3'
    }

    It 'bus_lifecycle_state pipeline_lock is 0' {
        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='pipeline_lock'"
        $row.value | Should -Be '0'
    }
}

# T5: Corrupt-RehearsalState sets BusStatus=corrupted
Describe 'T5: Corrupt-RehearsalState sets BusStatus=corrupted' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        New-RehearsalDatabase -DbPath $script:dbPath
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
    }

    It 'BusStatus becomes corrupted after corruption' {
        Corrupt-RehearsalState -DbPath $script:dbPath
        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='BusStatus'"
        $row.value | Should -Be 'corrupted'
    }
}

# T6: Corrupt-RehearsalState deletes 3 events (leaves 7)
Describe 'T6: Corrupt-RehearsalState deletes 3 events (leaves 7)' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        New-RehearsalDatabase -DbPath $script:dbPath
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
    }

    It 'event_log has 7 rows after corruption' {
        Corrupt-RehearsalState -DbPath $script:dbPath
        $count = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT COUNT(*) as cnt FROM event_log"
        $count.cnt | Should -Be 7
    }
}

# T7: Corrupt-RehearsalState marks agent sessions as crashed
Describe 'T7: Corrupt-RehearsalState marks agent sessions as crashed' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        New-RehearsalDatabase -DbPath $script:dbPath
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
    }

    It 'all agent sessions have status crashed after corruption' {
        Corrupt-RehearsalState -DbPath $script:dbPath
        $rows = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT status FROM agent_sessions"
        foreach ($r in @($rows)) {
            $r.status | Should -Be 'crashed'
        }
    }
}

# T8: Invoke-RollbackRehearsal returns Success=true on happy path
Describe 'T8: Invoke-RollbackRehearsal returns Success=true on happy path' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        $script:snapDir = New-TestSnapshotDir
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
        Remove-Item $script:snapDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns Success=true' {
        $result = Invoke-RollbackRehearsal -DbPath $script:dbPath -SnapshotDir $script:snapDir
        $result.Success | Should -BeTrue
    }
}

# T9: Invoke-RollbackRehearsal returns SnapshotPath in result
Describe 'T9: Invoke-RollbackRehearsal returns SnapshotPath in result' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        $script:snapDir = New-TestSnapshotDir
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
        Remove-Item $script:snapDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'result contains SnapshotPath' {
        $result = Invoke-RollbackRehearsal -DbPath $script:dbPath -SnapshotDir $script:snapDir
        $result.SnapshotPath | Should -Not -BeNullOrEmpty
    }

    It 'SnapshotPath file exists after rehearsal' {
        $result = Invoke-RollbackRehearsal -DbPath $script:dbPath -SnapshotDir $script:snapDir
        Test-Path $result.SnapshotPath | Should -BeTrue
    }
}

# T10: Invoke-RollbackRehearsal returns RehearsalMs (timing)
Describe 'T10: Invoke-RollbackRehearsal returns RehearsalMs' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        $script:snapDir = New-TestSnapshotDir
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
        Remove-Item $script:snapDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'result contains RehearsalMs key' {
        $result = Invoke-RollbackRehearsal -DbPath $script:dbPath -SnapshotDir $script:snapDir
        $result.ContainsKey('RehearsalMs') | Should -BeTrue
    }

    It 'RehearsalMs is a non-negative number' {
        $result = Invoke-RollbackRehearsal -DbPath $script:dbPath -SnapshotDir $script:snapDir
        $result.RehearsalMs | Should -BeGreaterOrEqual 0
    }
}

# T11: After rehearsal, event_log has all 10 events restored
Describe 'T11: After rehearsal, event_log has all 10 events restored' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        $script:snapDir = New-TestSnapshotDir
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
        Remove-Item $script:snapDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'event_log count is 10 after rollback' {
        Invoke-RollbackRehearsal -DbPath $script:dbPath -SnapshotDir $script:snapDir | Out-Null
        $count = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT COUNT(*) as cnt FROM event_log"
        $count.cnt | Should -Be 10
    }
}

# T12: After rehearsal, BusStatus=halted
Describe 'T12: After rehearsal, BusStatus=halted' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        $script:snapDir = New-TestSnapshotDir
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
        Remove-Item $script:snapDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'BusStatus is halted after rollback' {
        Invoke-RollbackRehearsal -DbPath $script:dbPath -SnapshotDir $script:snapDir | Out-Null
        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='BusStatus'"
        $row.value | Should -Be 'halted'
    }
}

# T13: After rehearsal, halt_reason=user_rollback
Describe 'T13: After rehearsal, halt_reason=user_rollback' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        $script:snapDir = New-TestSnapshotDir
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
        Remove-Item $script:snapDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'halt_reason is user_rollback after rollback' {
        Invoke-RollbackRehearsal -DbPath $script:dbPath -SnapshotDir $script:snapDir | Out-Null
        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='halt_reason'"
        $row.value | Should -Be 'user_rollback'
    }
}

# T14: Assert-RollbackSucceeded throws RollbackAssertionFailed if event count wrong
Describe 'T14: Assert-RollbackSucceeded throws RollbackAssertionFailed if event count wrong' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        New-RehearsalDatabase -DbPath $script:dbPath
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
    }

    It 'throws RollbackAssertionFailed when event count != 10' {
        # Delete some events without restoring
        Invoke-SqliteQuery -DataSource $script:dbPath -Query "DELETE FROM event_log WHERE evt_id > 5"
        # Set the expected post-rollback state manually (skip real rollback)
        Invoke-SqliteQuery -DataSource $script:dbPath -Query "UPDATE bus_lifecycle_state SET value='halted' WHERE key='BusStatus'"
        Invoke-SqliteQuery -DataSource $script:dbPath -Query "UPDATE bus_lifecycle_state SET value='user_rollback' WHERE key='halt_reason'"
        Invoke-SqliteQuery -DataSource $script:dbPath -Query "INSERT OR REPLACE INTO rollback_state (key,value) VALUES ('rollbackRequested','0')"

        $preState = @{ EventCount = 10; AgentStatuses = @('active', 'active') }
        { Assert-RollbackSucceeded -DbPath $script:dbPath -PreCorruptionState $preState } | Should -Throw '*RollbackAssertionFailed*'
    }
}

# T15: Assert-RollbackSucceeded throws if BusStatus != halted
Describe 'T15: Assert-RollbackSucceeded throws if BusStatus != halted' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        New-RehearsalDatabase -DbPath $script:dbPath
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
    }

    It 'throws RollbackAssertionFailed when BusStatus is not halted' {
        # event_log still has 10 rows but BusStatus is not halted
        Invoke-SqliteQuery -DataSource $script:dbPath -Query "UPDATE bus_lifecycle_state SET value='running' WHERE key='BusStatus'"
        Invoke-SqliteQuery -DataSource $script:dbPath -Query "UPDATE bus_lifecycle_state SET value='user_rollback' WHERE key='halt_reason'"
        Invoke-SqliteQuery -DataSource $script:dbPath -Query "INSERT OR REPLACE INTO rollback_state (key,value) VALUES ('rollbackRequested','0')"

        $preState = @{ EventCount = 10; AgentStatuses = @('active', 'active') }
        { Assert-RollbackSucceeded -DbPath $script:dbPath -PreCorruptionState $preState } | Should -Throw '*RollbackAssertionFailed*'
    }
}

# T16: Invoke-RollbackRehearsal returns Success=false when rollback fails
Describe 'T16: Invoke-RollbackRehearsal returns Success=false when rollback fails' {
    BeforeEach {
        $script:dbPath = New-TestDbPath
        $script:snapDir = New-TestSnapshotDir
    }
    AfterEach {
        Remove-Item $script:dbPath -Force -ErrorAction SilentlyContinue
        Remove-Item $script:snapDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns Success=false when SnapshotDir is on a locked/nonexistent volume' {
        # Use an invalid snapshot dir path that cannot be created (drive letter that doesn't exist)
        # We simulate failure by mocking _Take-RehearsalSnapshot to throw
        # Instead: create DB, take snapshot, then make the Assert fail by using a bad post-state
        New-RehearsalDatabase -DbPath $script:dbPath
        # Corrupt state so assertion will always fail, but don't restore
        # Use -Quiet to suppress output
        # We need Invoke-RollbackRehearsal to hit the catch block
        # Inject a failing GetUtcNow that throws after snapshot
        $throwAfterSnap = $false
        $getUtcNow = {
            if ($script:throwAfterSnap) { throw "SimulatedRollbackFailure: forced failure for test" }
            $script:throwAfterSnap = $true
            return (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
        }
        # Can't easily inject failure mid-execution. Instead, use a bad snapshot dir that
        # causes _Take-RehearsalSnapshot to fail (path with null byte which is invalid on Windows)
        $badSnapDir = Join-Path ([System.IO.Path]::GetTempPath()) "NOPE`0INVALID"
        $result = Invoke-RollbackRehearsal -DbPath $script:dbPath -SnapshotDir $badSnapDir -Quiet
        $result.Success | Should -BeFalse
    }

    It 'result contains Error key when failure occurs' {
        New-RehearsalDatabase -DbPath $script:dbPath
        $badSnapDir = Join-Path ([System.IO.Path]::GetTempPath()) "NOPE`0INVALID"
        $result = Invoke-RollbackRehearsal -DbPath $script:dbPath -SnapshotDir $badSnapDir -Quiet
        $result.ContainsKey('Error') | Should -BeTrue
    }
}

# T17: Reset-RollbackRehearsalState is callable without error
Describe 'T17: Reset-RollbackRehearsalState is callable without error' {
    It 'does not throw when called' {
        { Reset-RollbackRehearsalState } | Should -Not -Throw
    }

    It 'can be called multiple times without error' {
        { Reset-RollbackRehearsalState; Reset-RollbackRehearsalState } | Should -Not -Throw
    }
}
