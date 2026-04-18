BeforeAll {
    Import-Module PSSQLite -ErrorAction Stop

    $busDir = "$PSScriptRoot/../../../bus"
    . "$busDir/router/send-bus-event.ps1"
    . "$busDir/domain/agent-session.ps1"

    # Helper: create in-memory SQLite DB with required schema
    function New-TestDb {
        $conn = New-SQLiteConnection -DataSource ':memory:'
        $eventLogSql = Get-Content "$busDir/../bus/schema/event-log.sql" -Raw -ErrorAction SilentlyContinue
        if (-not $eventLogSql) {
            $eventLogSql = @'
CREATE TABLE IF NOT EXISTS event_log (
    evt_id INTEGER PRIMARY KEY, "from" TEXT NOT NULL, "to" TEXT NOT NULL,
    in_reply_to INTEGER, group_id TEXT, type TEXT NOT NULL, payload TEXT,
    status TEXT NOT NULL DEFAULT 'routed'
);
'@
        }
        Invoke-SqliteQuery -SQLiteConnection $conn -Query $eventLogSql | Out-Null
        $agentSql = @'
CREATE TABLE IF NOT EXISTS agent_sessions (
    session_id TEXT PRIMARY KEY, agent_name TEXT NOT NULL, role TEXT NOT NULL,
    role_schema_version INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'spawning',
    worktree TEXT, pid INTEGER, spawn_epoch INTEGER, death_epoch INTEGER,
    renew_epoch INTEGER, checkpointed_at_mono INTEGER, session_mono_epoch INTEGER,
    ground_truth_delivered INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
'@
        Invoke-SqliteQuery -SQLiteConnection $conn -Query $agentSql | Out-Null
        return $conn
    }
}

Describe 'Send-BusEvent Integration Tests' {
    BeforeEach {
        $db = New-TestDb
        Reset-SendBusEventState
    }

    AfterEach {
        if ($db) { $db.Close(); $db.Dispose() }
    }

    It 'T01: inserts row in event_log with status routed' {
        $result = Send-BusEvent -Connection $db -From 'orchestrator' -FromRole 'orchestrator' -Type 'bootstrap'
        $row = Invoke-SqliteQuery -SQLiteConnection $db -Query "SELECT * FROM event_log WHERE evt_id = $($result.EvtId)"
        $row.status | Should -Be 'routed'
    }

    It 'T02: authorized sender succeeds - orchestrator sends bootstrap' {
        { Send-BusEvent -Connection $db -From 'orchestrator' -FromRole 'orchestrator' -Type 'bootstrap' } | Should -Not -Throw
    }

    It 'T03: unauthorized sender throws ACLViolation' {
        { Send-BusEvent -Connection $db -From 'coding-worker-1' -FromRole 'coding-worker' -Type 'bootstrap' } |
            Should -Throw -ExpectedMessage '*ACLViolation*'
    }

    It 'T04: unknown event type throws' {
        { Send-BusEvent -Connection $db -From 'orchestrator' -FromRole 'orchestrator' -Type 'nonexistent_type' } |
            Should -Throw
    }

    It 'T05: done from coding-worker resolves to active moderator' {
        $result = Send-BusEvent -Connection $db -From 'cw-1' -FromRole 'coding-worker' -Type 'done' -ActiveModeratorName 'debate-mod-1'
        $row = Invoke-SqliteQuery -SQLiteConnection $db -Query "SELECT * FROM event_log WHERE evt_id = $($result.EvtId)"
        $row.to | Should -Be 'debate-mod-1'
    }

    It 'T06: ground_truth type stores To = broadcast in DB' {
        $result = Send-BusEvent -Connection $db -From 'orchestrator' -FromRole 'orchestrator' -Type 'ground_truth' -Payload '{"state":"initial"}'
        $row = Invoke-SqliteQuery -SQLiteConnection $db -Query "SELECT * FROM event_log WHERE evt_id = $($result.EvtId)"
        $row.to | Should -Be 'broadcast'
    }

    It 'T07: explicit target required but no To throws' {
        { Send-BusEvent -Connection $db -From 'tla-writer-1' -FromRole 'tla-writer' -Type 'objection' } |
            Should -Throw -ExpectedMessage "*requires explicit*"
    }

    It 'T08: returns hashtable with EvtId and Status routed' {
        $result = Send-BusEvent -Connection $db -From 'orchestrator' -FromRole 'orchestrator' -Type 'bootstrap'
        $result | Should -Not -BeNullOrEmpty
        $result.EvtId | Should -BeGreaterThan 0
        $result.Status | Should -Be 'routed'
    }

    It 'T09: sequential calls produce monotonically increasing evt_ids' {
        $r1 = Send-BusEvent -Connection $db -From 'orchestrator' -FromRole 'orchestrator' -Type 'bootstrap'
        $r2 = Send-BusEvent -Connection $db -From 'orchestrator' -FromRole 'orchestrator' -Type 'ground_truth' -Payload '{}'
        $r2.EvtId | Should -BeGreaterThan $r1.EvtId
    }

    It 'T10: JSON payload stored correctly' {
        $payload = '{"key":"value","num":42}'
        $result = Send-BusEvent -Connection $db -From 'orchestrator' -FromRole 'orchestrator' -Type 'bootstrap' -Payload $payload
        $row = Invoke-SqliteQuery -SQLiteConnection $db -Query "SELECT * FROM event_log WHERE evt_id = $($result.EvtId)"
        $row.payload | Should -Be $payload
    }

    It 'T11: null payload stores NULL' {
        $result = Send-BusEvent -Connection $db -From 'orchestrator' -FromRole 'orchestrator' -Type 'bootstrap' -Payload $null
        $row = Invoke-SqliteQuery -SQLiteConnection $db -Query "SELECT * FROM event_log WHERE evt_id = $($result.EvtId)"
        $row.payload | Should -BeNullOrEmpty
    }

    It 'T12: InReplyTo stores correct in_reply_to in DB' {
        $r1 = Send-BusEvent -Connection $db -From 'orchestrator' -FromRole 'orchestrator' -Type 'bootstrap'
        $result = Send-BusEvent -Connection $db -From 'tla-w-1' -FromRole 'tla-writer' -Type 'verify' -InReplyTo $r1.EvtId
        $row = Invoke-SqliteQuery -SQLiteConnection $db -Query "SELECT * FROM event_log WHERE evt_id = $($result.EvtId)"
        $row.in_reply_to | Should -Be $r1.EvtId
    }

    It 'T13: GroupId stores correct group_id in DB' {
        $groupId = 'grp-abc-123'
        $result = Send-BusEvent -Connection $db -From 'orchestrator' -FromRole 'orchestrator' -Type 'bootstrap' -GroupId $groupId
        $row = Invoke-SqliteQuery -SQLiteConnection $db -Query "SELECT * FROM event_log WHERE evt_id = $($result.EvtId)"
        $row.group_id | Should -Be $groupId
    }

    It 'T14: verify from tla-writer resolves to tlc (inferred target)' {
        $result = Send-BusEvent -Connection $db -From 'tla-w-1' -FromRole 'tla-writer' -Type 'verify'
        $row = Invoke-SqliteQuery -SQLiteConnection $db -Query "SELECT * FROM event_log WHERE evt_id = $($result.EvtId)"
        $row.to | Should -Be 'tlc'
    }

    It 'T15: done from coding-worker when no moderator set resolves to null target' {
        $result = Send-BusEvent -Connection $db -From 'cw-1' -FromRole 'coding-worker' -Type 'done'
        $row = Invoke-SqliteQuery -SQLiteConnection $db -Query "SELECT * FROM event_log WHERE evt_id = $($result.EvtId)"
        $row.to | Should -BeNullOrEmpty
    }
}
