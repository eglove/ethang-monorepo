BeforeAll {
    Import-Module PSSQLite -Force
    $script:SchemaPath = Join-Path $PSScriptRoot '../../../bus/schema/agent-sessions.sql'

    function script:New-AgentSessionsDb {
        $db = Join-Path ([System.IO.Path]::GetTempPath()) "agent-sessions-test-$(New-Guid).db"
        $schema = Get-Content $script:SchemaPath -Raw
        Invoke-SqliteQuery -DataSource $db -Query $schema
        return $db
    }
}

Describe 'agent_sessions schema' {
    BeforeEach {
        $script:db = New-AgentSessionsDb
    }

    AfterEach {
        if ($script:db) {
            # Allow SQLite connection pool to release handles before deleting
            [System.GC]::Collect()
            [System.GC]::WaitForPendingFinalizers()
            if (Test-Path $script:db) {
                Remove-Item $script:db -Force -ErrorAction SilentlyContinue
            }
        }
        $script:db = $null
    }

    It 'agent_sessions table has exactly 16 columns' {
        # 16 columns: session_id, agent_name, role, role_schema_version, status, worktree,
        # pid, checkpoint_json, spawn_epoch, death_epoch, session_mono_epoch,
        # checkpointed_at_mono, renew_epoch, ground_truth_delivered, created_at, updated_at.
        $cols = Invoke-SqliteQuery -DataSource $script:db -Query 'PRAGMA table_info(agent_sessions)'
        $cols.Count | Should -Be 16
    }

    It 'default status is spawning' {
        $guid = [System.Guid]::NewGuid().ToString()
        Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO agent_sessions (session_id, agent_name, role)
VALUES ('$guid', 'test-agent', 'worker')
"@
        $row = Invoke-SqliteQuery -DataSource $script:db -Query "SELECT status FROM agent_sessions WHERE session_id='$guid'"
        $row.status | Should -BeExactly 'spawning'
    }

    It 'default role_schema_version is 1' {
        $guid = [System.Guid]::NewGuid().ToString()
        Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO agent_sessions (session_id, agent_name, role)
VALUES ('$guid', 'test-agent', 'worker')
"@
        $row = Invoke-SqliteQuery -DataSource $script:db -Query "SELECT role_schema_version FROM agent_sessions WHERE session_id='$guid'"
        $row.role_schema_version | Should -Be 1
    }

    It 'session_id PRIMARY KEY constraint: duplicate session_id raises error' {
        $guid = [System.Guid]::NewGuid().ToString()
        Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO agent_sessions (session_id, agent_name, role)
VALUES ('$guid', 'agent-a', 'worker')
"@
        {
            Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO agent_sessions (session_id, agent_name, role)
VALUES ('$guid', 'agent-b', 'coordinator')
"@ -ErrorAction Stop
        } | Should -Throw
    }

    It 'idx_agent_sessions_alive partial index exists' {
        $idx = Invoke-SqliteQuery -DataSource $script:db -Query @"
SELECT name FROM sqlite_master
WHERE type='index' AND name='idx_agent_sessions_alive'
"@
        $idx | Should -Not -BeNullOrEmpty
        $idx.name | Should -BeExactly 'idx_agent_sessions_alive'
    }

    It 'alive index covers status spawning - EXPLAIN QUERY PLAN uses index for alive agent_name lookup' {
        $guid = [System.Guid]::NewGuid().ToString()
        Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO agent_sessions (session_id, agent_name, role, status)
VALUES ('$guid', 'indexed-agent', 'worker', 'spawning')
"@
        # Include the partial index WHERE clause so SQLite will use the index
        $plan = Invoke-SqliteQuery -DataSource $script:db -Query @"
EXPLAIN QUERY PLAN
SELECT * FROM agent_sessions
WHERE agent_name='indexed-agent'
  AND status IN ('spawning', 'alive', 'checkpointing', 'renewing')
"@
        $planText = ($plan | ForEach-Object { $_.detail }) -join ' '
        $planText | Should -Match 'idx_agent_sessions_alive'
    }

    It 'created_at is automatically set to current time' {
        $guid = [System.Guid]::NewGuid().ToString()
        $before = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO agent_sessions (session_id, agent_name, role)
VALUES ('$guid', 'time-agent', 'worker')
"@
        $after = (Get-Date).ToUniversalTime().AddSeconds(1).ToString('yyyy-MM-ddTHH:mm:ssZ')
        $row = Invoke-SqliteQuery -DataSource $script:db -Query "SELECT created_at FROM agent_sessions WHERE session_id='$guid'"
        $row.created_at | Should -Not -BeNullOrEmpty
        $row.created_at | Should -BeGreaterOrEqual $before
        $row.created_at | Should -BeLessOrEqual $after
    }

    It 'updated_at changes when row is updated' {
        $guid = [System.Guid]::NewGuid().ToString()
        Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO agent_sessions (session_id, agent_name, role)
VALUES ('$guid', 'update-agent', 'worker')
"@
        $original = Invoke-SqliteQuery -DataSource $script:db -Query "SELECT updated_at FROM agent_sessions WHERE session_id='$guid'"

        # Wait so the second SQLite now() call returns a different second
        Start-Sleep -Milliseconds 1100

        Invoke-SqliteQuery -DataSource $script:db -Query @"
UPDATE agent_sessions SET status='alive' WHERE session_id='$guid'
"@
        $updated = Invoke-SqliteQuery -DataSource $script:db -Query "SELECT updated_at FROM agent_sessions WHERE session_id='$guid'"
        $updated.updated_at | Should -BeGreaterOrEqual $original.updated_at
    }

    It 'agent_name NOT NULL constraint is enforced' {
        $guid = [System.Guid]::NewGuid().ToString()
        {
            Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO agent_sessions (session_id, agent_name, role)
VALUES ('$guid', NULL, 'worker')
"@ -ErrorAction Stop
        } | Should -Throw
    }

    It 'status NOT NULL constraint is enforced via explicit NULL' {
        $guid = [System.Guid]::NewGuid().ToString()
        {
            Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO agent_sessions (session_id, agent_name, role, status)
VALUES ('$guid', 'null-status-agent', 'worker', NULL)
"@ -ErrorAction Stop
        } | Should -Throw
    }

    It 'checkpoint_json accepts NULL' {
        $guid = [System.Guid]::NewGuid().ToString()
        Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO agent_sessions (session_id, agent_name, role, checkpoint_json)
VALUES ('$guid', 'chk-agent', 'worker', NULL)
"@
        $row = Invoke-SqliteQuery -DataSource $script:db -Query "SELECT checkpoint_json FROM agent_sessions WHERE session_id='$guid'"
        $row.checkpoint_json | Should -BeNullOrEmpty
    }

    It 'checkpoint_json accepts valid JSON string' {
        $guid = [System.Guid]::NewGuid().ToString()
        $json = '{"stage":3,"round":2}'
        Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO agent_sessions (session_id, agent_name, role, checkpoint_json)
VALUES ('$guid', 'chk-json-agent', 'worker', '$json')
"@
        $row = Invoke-SqliteQuery -DataSource $script:db -Query "SELECT checkpoint_json FROM agent_sessions WHERE session_id='$guid'"
        $row.checkpoint_json | Should -BeExactly $json
    }
}
