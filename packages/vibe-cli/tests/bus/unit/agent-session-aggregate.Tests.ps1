#Requires -Module Pester
<#
.SYNOPSIS
    Unit tests for AgentSession aggregate root (T11).
    Tests must FAIL before the implementation file exists.
#>

BeforeAll {
    Import-Module PSSQLite -ErrorAction Stop

    $script:SqlFile = Join-Path $PSScriptRoot '../../../bus/schema/agent-sessions.sql'
    $script:DomainFile = Join-Path $PSScriptRoot '../../../bus/domain/agent-session.ps1'

    # Load implementation (will fail until file exists)
    . $script:DomainFile

    function New-TestDb {
        $tempPath = [System.IO.Path]::GetTempFileName() + '.db'
        $conn = New-SQLiteConnection -DataSource $tempPath
        # Pass the whole schema at once. Splitting on ';' breaks the CREATE TRIGGER
        # block because the trigger body contains its own semicolons — each fragment
        # would then be partial SQL ("incomplete input") or a stray END.
        Invoke-SqliteQuery -SQLiteConnection $conn -Query (Get-Content $script:SqlFile -Raw) | Out-Null
        return @{ Conn = $conn; Path = $tempPath }
    }
}

Describe 'New-AgentSession' {
    BeforeEach {
        $db = New-TestDb
        $script:Conn = $db.Conn
        $script:DbPath = $db.Path
    }
    AfterEach {
        $script:Conn.Close()
        Remove-Item $script:DbPath -Force -ErrorAction SilentlyContinue
    }

    It 'creates a record with status spawning' {
        $sessionId = New-AgentSession -Connection $script:Conn -AgentName 'coder' -Role 'coding'
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT status FROM agent_sessions WHERE session_id='$sessionId'"
        $row.status | Should -Be 'spawning'
    }

    It 'returns a non-empty session_id GUID' {
        $sessionId = New-AgentSession -Connection $script:Conn -AgentName 'coder' -Role 'coding'
        $sessionId | Should -Not -BeNullOrEmpty
        { [guid]::Parse($sessionId) } | Should -Not -Throw
    }
}

Describe 'Set-AgentSessionAlive' {
    BeforeEach {
        $db = New-TestDb
        $script:Conn = $db.Conn
        $script:DbPath = $db.Path
        $script:SessionId = New-AgentSession -Connection $script:Conn -AgentName 'coder' -Role 'coding'
    }
    AfterEach {
        $script:Conn.Close()
        Remove-Item $script:DbPath -Force -ErrorAction SilentlyContinue
    }

    It 'transitions spawning to alive' {
        Set-AgentSessionAlive -Connection $script:Conn -SessionId $script:SessionId -SpawnEpoch 42
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT status FROM agent_sessions WHERE session_id='$($script:SessionId)'"
        $row.status | Should -Be 'alive'
    }

    It 'sets spawn_epoch correctly' {
        Set-AgentSessionAlive -Connection $script:Conn -SessionId $script:SessionId -SpawnEpoch 42
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT spawn_epoch FROM agent_sessions WHERE session_id='$($script:SessionId)'"
        $row.spawn_epoch | Should -Be 42
    }

    It 'throws when session is not in spawning state' {
        Set-AgentSessionAlive -Connection $script:Conn -SessionId $script:SessionId -SpawnEpoch 42
        # Already alive — calling again should throw
        { Set-AgentSessionAlive -Connection $script:Conn -SessionId $script:SessionId -SpawnEpoch 99 } | Should -Throw 'AgentSession not in spawning state'
    }
}

Describe 'Set-AgentSessionDead' {
    BeforeEach {
        $db = New-TestDb
        $script:Conn = $db.Conn
        $script:DbPath = $db.Path
        $script:SessionId = New-AgentSession -Connection $script:Conn -AgentName 'coder' -Role 'coding'
        Set-AgentSessionAlive -Connection $script:Conn -SessionId $script:SessionId -SpawnEpoch 1
    }
    AfterEach {
        $script:Conn.Close()
        Remove-Item $script:DbPath -Force -ErrorAction SilentlyContinue
    }

    It 'transitions alive to dead' {
        Set-AgentSessionDead -Connection $script:Conn -SessionId $script:SessionId -DeathEpoch 100
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT status FROM agent_sessions WHERE session_id='$($script:SessionId)'"
        $row.status | Should -Be 'dead'
    }

    It 'sets death_epoch' {
        Set-AgentSessionDead -Connection $script:Conn -SessionId $script:SessionId -DeathEpoch 100
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT death_epoch FROM agent_sessions WHERE session_id='$($script:SessionId)'"
        $row.death_epoch | Should -Be 100
    }

    It 'does NOT transition from ended (invariant 2 — dead agent stays dead)' {
        Set-AgentSessionEnded -Connection $script:Conn -SessionId $script:SessionId
        Set-AgentSessionDead -Connection $script:Conn -SessionId $script:SessionId -DeathEpoch 999
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT status FROM agent_sessions WHERE session_id='$($script:SessionId)'"
        $row.status | Should -Be 'ended'
    }
}

Describe 'Set-AgentSessionCheckpointing' {
    BeforeEach {
        $db = New-TestDb
        $script:Conn = $db.Conn
        $script:DbPath = $db.Path
        $script:SessionId = New-AgentSession -Connection $script:Conn -AgentName 'coder' -Role 'coding'
        Set-AgentSessionAlive -Connection $script:Conn -SessionId $script:SessionId -SpawnEpoch 1
    }
    AfterEach {
        $script:Conn.Close()
        Remove-Item $script:DbPath -Force -ErrorAction SilentlyContinue
    }

    It 'transitions alive to checkpointing' {
        Set-AgentSessionCheckpointing -Connection $script:Conn -SessionId $script:SessionId
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT status FROM agent_sessions WHERE session_id='$($script:SessionId)'"
        $row.status | Should -Be 'checkpointing'
    }
}

Describe 'Set-AgentSessionRenewing' {
    BeforeEach {
        $db = New-TestDb
        $script:Conn = $db.Conn
        $script:DbPath = $db.Path
        $script:SessionId = New-AgentSession -Connection $script:Conn -AgentName 'coder' -Role 'coding'
        Set-AgentSessionAlive -Connection $script:Conn -SessionId $script:SessionId -SpawnEpoch 1
        Set-AgentSessionCheckpointing -Connection $script:Conn -SessionId $script:SessionId
    }
    AfterEach {
        $script:Conn.Close()
        Remove-Item $script:DbPath -Force -ErrorAction SilentlyContinue
    }

    It 'transitions checkpointing to renewing and stores checkpoint_json' {
        $json = '{"key":"value"}'
        Set-AgentSessionRenewing -Connection $script:Conn -SessionId $script:SessionId -CheckpointJson $json
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT status, checkpoint_json FROM agent_sessions WHERE session_id='$($script:SessionId)'"
        $row.status | Should -Be 'renewing'
        $row.checkpoint_json | Should -Be $json
    }
}

Describe 'Set-AgentSessionRespawned' {
    BeforeEach {
        $db = New-TestDb
        $script:Conn = $db.Conn
        $script:DbPath = $db.Path
        $script:SessionId = New-AgentSession -Connection $script:Conn -AgentName 'coder' -Role 'coding'
        Set-AgentSessionAlive -Connection $script:Conn -SessionId $script:SessionId -SpawnEpoch 1
        Set-AgentSessionCheckpointing -Connection $script:Conn -SessionId $script:SessionId
        Set-AgentSessionRenewing -Connection $script:Conn -SessionId $script:SessionId -CheckpointJson '{}'
    }
    AfterEach {
        $script:Conn.Close()
        Remove-Item $script:DbPath -Force -ErrorAction SilentlyContinue
    }

    It 'transitions renewing to alive with new spawn_epoch' {
        Set-AgentSessionRespawned -Connection $script:Conn -SessionId $script:SessionId -NewSpawnEpoch 200 -NewProcessId 9999
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT status, spawn_epoch, pid FROM agent_sessions WHERE session_id='$($script:SessionId)'"
        $row.status | Should -Be 'alive'
        $row.spawn_epoch | Should -Be 200
        $row.pid | Should -Be 9999
    }
}

Describe 'Set-AgentSessionEnded' {
    BeforeEach {
        $db = New-TestDb
        $script:Conn = $db.Conn
        $script:DbPath = $db.Path
        $script:SessionId = New-AgentSession -Connection $script:Conn -AgentName 'coder' -Role 'coding'
        Set-AgentSessionAlive -Connection $script:Conn -SessionId $script:SessionId -SpawnEpoch 1
    }
    AfterEach {
        $script:Conn.Close()
        Remove-Item $script:DbPath -Force -ErrorAction SilentlyContinue
    }

    It 'transitions alive to ended' {
        Set-AgentSessionEnded -Connection $script:Conn -SessionId $script:SessionId
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT status FROM agent_sessions WHERE session_id='$($script:SessionId)'"
        $row.status | Should -Be 'ended'
    }

    It 'transitions dead to ended' {
        Set-AgentSessionDead -Connection $script:Conn -SessionId $script:SessionId -DeathEpoch 50
        Set-AgentSessionEnded -Connection $script:Conn -SessionId $script:SessionId
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT status FROM agent_sessions WHERE session_id='$($script:SessionId)'"
        $row.status | Should -Be 'ended'
    }
}

Describe 'Get-AliveSessions' {
    BeforeEach {
        $db = New-TestDb
        $script:Conn = $db.Conn
        $script:DbPath = $db.Path
    }
    AfterEach {
        $script:Conn.Close()
        Remove-Item $script:DbPath -Force -ErrorAction SilentlyContinue
    }

    It 'returns only sessions in spawning/alive/checkpointing/renewing states' {
        $s1 = New-AgentSession -Connection $script:Conn -AgentName 'agent1' -Role 'coding'
        $s2 = New-AgentSession -Connection $script:Conn -AgentName 'agent2' -Role 'coding'
        Set-AgentSessionAlive -Connection $script:Conn -SessionId $s2 -SpawnEpoch 1
        Set-AgentSessionEnded -Connection $script:Conn -SessionId $s2
        $s3 = New-AgentSession -Connection $script:Conn -AgentName 'agent3' -Role 'coding'
        Set-AgentSessionAlive -Connection $script:Conn -SessionId $s3 -SpawnEpoch 2

        $alive = Get-AliveSessions -Connection $script:Conn
        # s1 is spawning, s3 is alive; s2 is ended
        $alive | Should -HaveCount 2
        $ids = $alive | ForEach-Object { $_.session_id }
        $ids | Should -Contain $s1
        $ids | Should -Contain $s3
        $ids | Should -Not -Contain $s2
    }
}

Describe 'Get-AgentSession' {
    BeforeEach {
        $db = New-TestDb
        $script:Conn = $db.Conn
        $script:DbPath = $db.Path
    }
    AfterEach {
        $script:Conn.Close()
        Remove-Item $script:DbPath -Force -ErrorAction SilentlyContinue
    }

    It 'returns the alive session for an agent name' {
        $sessionId = New-AgentSession -Connection $script:Conn -AgentName 'writer' -Role 'writing'
        Set-AgentSessionAlive -Connection $script:Conn -SessionId $sessionId -SpawnEpoch 5

        $session = Get-AgentSession -Connection $script:Conn -AgentName 'writer'
        $session | Should -Not -BeNullOrEmpty
        $session.session_id | Should -Be $sessionId
        $session.status | Should -Be 'alive'
    }

    It 'returns null after Set-AgentSessionDead' {
        $sessionId = New-AgentSession -Connection $script:Conn -AgentName 'writer' -Role 'writing'
        Set-AgentSessionAlive -Connection $script:Conn -SessionId $sessionId -SpawnEpoch 5
        Set-AgentSessionDead -Connection $script:Conn -SessionId $sessionId -DeathEpoch 10

        $session = Get-AgentSession -Connection $script:Conn -AgentName 'writer'
        $session | Should -BeNullOrEmpty
    }
}
