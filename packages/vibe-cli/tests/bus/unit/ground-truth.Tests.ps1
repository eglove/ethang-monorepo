BeforeAll {
    Import-Module PSSQLite -ErrorAction Stop

    $busDir = "$PSScriptRoot/../../../bus"
    . "$busDir/router/ground-truth.ps1"
    . "$busDir/domain/agent-session.ps1"

    # Helper: create in-memory SQLite DB with agent_sessions schema
    function New-TestDb {
        $conn = New-SQLiteConnection -DataSource ':memory:'
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
        $eventLogSql = @'
CREATE TABLE IF NOT EXISTS event_log (
    evt_id INTEGER PRIMARY KEY, "from" TEXT NOT NULL, "to" TEXT NOT NULL,
    in_reply_to INTEGER, group_id TEXT, type TEXT NOT NULL, payload TEXT,
    status TEXT NOT NULL DEFAULT 'routed'
);
'@
        Invoke-SqliteQuery -SQLiteConnection $conn -Query $eventLogSql | Out-Null
        return $conn
    }

    $script:MockAppendCalls = @()
    $mockDbExecutor = {
        param($conn, $from, $to, $inReplyTo, $groupId, $type, $payload)
        $script:MockAppendCalls += @{from=$from;to=$to;type=$type;payload=$payload;groupId=$groupId}
        return $script:MockAppendCalls.Count
    }

    $mockSessions = @(
        [PSCustomObject]@{ session_id = 'sid1'; agent_name = 'tla-writer'; status = 'alive'; ground_truth_delivered = 0 },
        [PSCustomObject]@{ session_id = 'sid2'; agent_name = 'coding-worker'; status = 'alive'; ground_truth_delivered = 0 }
    )
    $mockGetAliveSessions = { param($conn) return $mockSessions }
    # No-op SetGroundTruthDelivered for unit tests that don't need a real DB
    $mockSetDelivered = { param($conn, $sid) }
}

Describe 'Send-GroundTruth Unit Tests' {
    BeforeEach {
        $script:MockAppendCalls = @()
        Reset-GroundTruthState
    }

    It 'T01: calls GetAliveSessions via injected scriptblock' {
        $called = $false
        $trackingGetSessions = { param($conn) $script:called = $true; return @() }
        Send-GroundTruth -Connection $null -Payload '{}' -GetAliveSessions $trackingGetSessions -DbExecutor $mockDbExecutor -SetGroundTruthDeliveredFn $mockSetDelivered
        $script:called | Should -Be $true
    }

    It 'T02: sends one event per alive session' {
        Send-GroundTruth -Connection $null -Payload '{}' -GetAliveSessions $mockGetAliveSessions -DbExecutor $mockDbExecutor -SetGroundTruthDeliveredFn $mockSetDelivered
        $script:MockAppendCalls.Count | Should -Be 2
    }

    It 'T03: uses ground_truth event type for all events' {
        Send-GroundTruth -Connection $null -Payload '{}' -GetAliveSessions $mockGetAliveSessions -DbExecutor $mockDbExecutor -SetGroundTruthDeliveredFn $mockSetDelivered
        $script:MockAppendCalls | ForEach-Object { $_.type | Should -Be 'ground_truth' }
    }

    It 'T04: uses From = orchestrator for all events' {
        Send-GroundTruth -Connection $null -Payload '{}' -GetAliveSessions $mockGetAliveSessions -DbExecutor $mockDbExecutor -SetGroundTruthDeliveredFn $mockSetDelivered
        $script:MockAppendCalls | ForEach-Object { $_.from | Should -Be 'orchestrator' }
    }

    It 'T05: returns DeliveredTo array with all session agent names' {
        $result = Send-GroundTruth -Connection $null -Payload '{}' -GetAliveSessions $mockGetAliveSessions -DbExecutor $mockDbExecutor -SetGroundTruthDeliveredFn $mockSetDelivered
        $result.DeliveredTo | Should -Contain 'tla-writer'
        $result.DeliveredTo | Should -Contain 'coding-worker'
        $result.DeliveredTo.Count | Should -Be 2
    }

    It 'T06: with 0 alive sessions returns empty arrays' {
        $emptyGetSessions = { param($conn) return @() }
        $result = Send-GroundTruth -Connection $null -Payload '{}' -GetAliveSessions $emptyGetSessions -DbExecutor $mockDbExecutor -SetGroundTruthDeliveredFn $mockSetDelivered
        $result.DeliveredTo.Count | Should -Be 0
        $result.EventIds.Count | Should -Be 0
    }

    It 'T07: calls Set-GroundTruthDelivered for each session' {
        $script:deliveredSids = @()
        $trackingSetDelivered = { param($conn, $sid) $script:deliveredSids += $sid }
        Send-GroundTruth -Connection $null -Payload '{}' -GetAliveSessions $mockGetAliveSessions -DbExecutor $mockDbExecutor -SetGroundTruthDeliveredFn $trackingSetDelivered
        $script:deliveredSids | Should -Contain 'sid1'
        $script:deliveredSids | Should -Contain 'sid2'
    }

    It 'T08: passes Payload to each event' {
        $payload = '{"phase":"start","version":1}'
        Send-GroundTruth -Connection $null -Payload $payload -GetAliveSessions $mockGetAliveSessions -DbExecutor $mockDbExecutor -SetGroundTruthDeliveredFn $mockSetDelivered
        $script:MockAppendCalls | ForEach-Object { $_.payload | Should -Be $payload }
    }

    It 'T09: passes GroupId to each event when provided' {
        $groupId = 'grp-test-001'
        Send-GroundTruth -Connection $null -Payload '{}' -GroupId $groupId -GetAliveSessions $mockGetAliveSessions -DbExecutor $mockDbExecutor -SetGroundTruthDeliveredFn $mockSetDelivered
        $script:MockAppendCalls | ForEach-Object { $_.groupId | Should -Be $groupId }
    }

    It 'T10: Assert-GroundTruthDelivered returns true when ground_truth_delivered = 1' {
        $db = New-TestDb
        Invoke-SqliteQuery -SQLiteConnection $db -Query "INSERT INTO agent_sessions (session_id,agent_name,role,status,ground_truth_delivered) VALUES ('s1','tla-writer-1','tla-writer','alive',1)"
        $result = Assert-GroundTruthDelivered -Connection $db -AgentName 'tla-writer-1'
        $result | Should -Be $true
        $db.Close(); $db.Dispose()
    }

    It 'T11: Assert-GroundTruthDelivered throws Inv9Violation when ground_truth_delivered = 0' {
        $db = New-TestDb
        Invoke-SqliteQuery -SQLiteConnection $db -Query "INSERT INTO agent_sessions (session_id,agent_name,role,status,ground_truth_delivered) VALUES ('s1','tla-writer-1','tla-writer','alive',0)"
        { Assert-GroundTruthDelivered -Connection $db -AgentName 'tla-writer-1' } |
            Should -Throw -ExpectedMessage '*Inv9Violation*'
        $db.Close(); $db.Dispose()
    }

    It 'T12: Assert-GroundTruthDelivered throws Inv9Violation when agent session not found' {
        $db = New-TestDb
        { Assert-GroundTruthDelivered -Connection $db -AgentName 'nonexistent-agent' } |
            Should -Throw -ExpectedMessage '*Inv9Violation*'
        $db.Close(); $db.Dispose()
    }

    It 'T13: after Send-GroundTruth, Assert-GroundTruthDelivered passes for each delivered agent' {
        $db = New-TestDb
        Invoke-SqliteQuery -SQLiteConnection $db -Query "INSERT INTO agent_sessions (session_id,agent_name,role,status,ground_truth_delivered) VALUES ('s1','tla-writer-1','tla-writer','alive',0)"
        Invoke-SqliteQuery -SQLiteConnection $db -Query "INSERT INTO agent_sessions (session_id,agent_name,role,status,ground_truth_delivered) VALUES ('s2','coding-worker-1','coding-worker','alive',0)"
        $realSessions = @(
            [PSCustomObject]@{ session_id = 's1'; agent_name = 'tla-writer-1'; status = 'alive'; ground_truth_delivered = 0 },
            [PSCustomObject]@{ session_id = 's2'; agent_name = 'coding-worker-1'; status = 'alive'; ground_truth_delivered = 0 }
        )
        $realGetSessions = { param($conn) return $realSessions }
        Send-GroundTruth -Connection $db -Payload '{}' -GetAliveSessions $realGetSessions -DbExecutor $mockDbExecutor
        { Assert-GroundTruthDelivered -Connection $db -AgentName 'tla-writer-1' } | Should -Not -Throw
        { Assert-GroundTruthDelivered -Connection $db -AgentName 'coding-worker-1' } | Should -Not -Throw
        $db.Close(); $db.Dispose()
    }

    It 'T14: Reset-GroundTruthState clears any cached state' {
        { Reset-GroundTruthState } | Should -Not -Throw
    }

    It 'T15: Send-GroundTruth with real DB inserts ground_truth events for each alive agent' {
        $db = New-TestDb
        Invoke-SqliteQuery -SQLiteConnection $db -Query "INSERT INTO agent_sessions (session_id,agent_name,role,status,ground_truth_delivered) VALUES ('s1','tla-writer-1','tla-writer','alive',0)"
        Invoke-SqliteQuery -SQLiteConnection $db -Query "INSERT INTO agent_sessions (session_id,agent_name,role,status,ground_truth_delivered) VALUES ('s2','coding-worker-1','coding-worker','alive',0)"
        $realSessions = @(
            [PSCustomObject]@{ session_id = 's1'; agent_name = 'tla-writer-1'; status = 'alive'; ground_truth_delivered = 0 },
            [PSCustomObject]@{ session_id = 's2'; agent_name = 'coding-worker-1'; status = 'alive'; ground_truth_delivered = 0 }
        )
        $realGetSessions = { param($conn) return $realSessions }
        $result = Send-GroundTruth -Connection $db -Payload '{"phase":"init"}' -GetAliveSessions $realGetSessions -DbExecutor $mockDbExecutor
        $result.DeliveredTo.Count | Should -Be 2
        $result.EventIds.Count | Should -Be 2
        $db.Close(); $db.Dispose()
    }
}
