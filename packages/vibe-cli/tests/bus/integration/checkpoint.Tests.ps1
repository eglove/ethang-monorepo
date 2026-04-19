BeforeAll {
    Import-Module PSSQLite -ErrorAction SilentlyContinue
    . "$PSScriptRoot/../../../bus/infra/evt-id-allocator.ps1"
    . "$PSScriptRoot/../../../bus/domain/agent-session.ps1"
    . "$PSScriptRoot/../../../bus/domain/bus-lifecycle.ps1"
    . "$PSScriptRoot/../../../bus/router/checkpoint.ps1"
    if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
        function global:Write-PipelineLog { param($Message,$Severity='INFO',$Gate=$null,$StructuredData=$null) }
    }
}

Describe 'Checkpoint / Session Renewal' {
    BeforeAll {
        function global:_CreateAliveSession {
            param([string]$Name='test-agent',[string]$Role='coding-worker')
            $sid = New-AgentSession -Connection $script:Conn -AgentName $Name -Role $Role
            Set-AgentSessionAlive -Connection $script:Conn -SessionId $sid -SpawnEpoch 1000
            return $sid
        }
    }

    BeforeEach {
        $script:TestDir = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory $script:TestDir | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'
        $script:Conn = New-SQLiteConnection -DataSource $script:DbPath
        $evtSql = Get-Content "$PSScriptRoot/../../../bus/schema/event-log.sql" -Raw
        $agSql = Get-Content "$PSScriptRoot/../../../bus/schema/agent-sessions.sql" -Raw
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $evtSql
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $agSql
        Initialize-EvtIdAllocator -StartValue 1
        Reset-RouterState
        Reset-CheckpointState
    }

    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    Context 'Invoke-CheckpointAgent' {
        It 'T01 — transitions session status from alive to checkpointing in DB' {
            $sid = _CreateAliveSession
            Invoke-CheckpointAgent -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -CheckpointedAtMono 9999
            $row = Get-AgentSession -Connection $script:Conn -SessionId $sid
            $row.status | Should -Be 'checkpointing'
        }

        It 'T02 — appends checkpoint event to event_log' {
            $sid = _CreateAliveSession
            Invoke-CheckpointAgent -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -CheckpointedAtMono 9999
            $events = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT * FROM event_log WHERE type='checkpoint'"
            $events | Should -Not -BeNullOrEmpty
        }

        It 'T03 — checkpoint event has from=orchestrator and to=agentName' {
            $sid = _CreateAliveSession -Name 'my-agent'
            Invoke-CheckpointAgent -Connection $script:Conn -SessionId $sid -AgentName 'my-agent' -CheckpointedAtMono 9999
            $evt = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT * FROM event_log WHERE type='checkpoint'" | Select-Object -First 1
            $evt.from | Should -Be 'orchestrator'
            $evt.to   | Should -Be 'my-agent'
        }

        It 'T04 — returns Status=checkpointing' {
            $sid = _CreateAliveSession
            $result = Invoke-CheckpointAgent -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -CheckpointedAtMono 9999
            $result.Status | Should -Be 'checkpointing'
        }

        It 'T05 — stores checkpointed_at_mono in agent_sessions' {
            $sid = _CreateAliveSession
            Invoke-CheckpointAgent -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -CheckpointedAtMono 88888
            $row = Get-AgentSession -Connection $script:Conn -SessionId $sid
            $row.checkpointed_at_mono | Should -Be 88888
        }
    }

    Context 'Invoke-RenewAgentSession' {
        It 'T06 — transitions checkpointing -> renewing -> alive in DB' {
            $sid = _CreateAliveSession
            Invoke-CheckpointAgent -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -CheckpointedAtMono 9999
            Invoke-RenewAgentSession -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -RenewEpoch 11111 -NewSpawnEpoch 22222
            $row = Get-AgentSession -Connection $script:Conn -SessionId $sid
            $row.status | Should -Be 'alive'
        }

        It 'T07 — appends checkpoint_response event' {
            $sid = _CreateAliveSession
            Invoke-CheckpointAgent -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -CheckpointedAtMono 9999
            Invoke-RenewAgentSession -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -RenewEpoch 11111 -NewSpawnEpoch 22222
            $events = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT * FROM event_log WHERE type='checkpoint_response'"
            $events | Should -Not -BeNullOrEmpty
        }

        It 'T08 — calls RespawnAgent injectable' {
            $sid = _CreateAliveSession
            Invoke-CheckpointAgent -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -CheckpointedAtMono 9999
            $script:RespawnCalled = $false
            $respawn = { param($AgentName) $script:RespawnCalled = $true; return @{ ProcessId = 42 } }
            Invoke-RenewAgentSession -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -RenewEpoch 11111 -NewSpawnEpoch 22222 -RespawnAgent $respawn
            $script:RespawnCalled | Should -Be $true
        }

        It 'T09 — stores renew_epoch in DB' {
            $sid = _CreateAliveSession
            Invoke-CheckpointAgent -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -CheckpointedAtMono 9999
            Invoke-RenewAgentSession -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -RenewEpoch 55555 -NewSpawnEpoch 66666
            $row = Get-AgentSession -Connection $script:Conn -SessionId $sid
            $row.renew_epoch | Should -Be 55555
        }

        It 'T10 — resets ground_truth_delivered to 0 after respawn' {
            $sid = _CreateAliveSession
            Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "UPDATE agent_sessions SET ground_truth_delivered=1 WHERE session_id='$sid'"
            Invoke-CheckpointAgent -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -CheckpointedAtMono 9999
            Invoke-RenewAgentSession -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -RenewEpoch 11111 -NewSpawnEpoch 22222
            $row = Get-AgentSession -Connection $script:Conn -SessionId $sid
            $row.ground_truth_delivered | Should -Be 0
        }

        It 'T11 — returns Status=alive' {
            $sid = _CreateAliveSession
            Invoke-CheckpointAgent -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -CheckpointedAtMono 9999
            $result = Invoke-RenewAgentSession -Connection $script:Conn -SessionId $sid -AgentName 'test-agent' -RenewEpoch 11111 -NewSpawnEpoch 22222
            $result.Status | Should -Be 'alive'
        }
    }

    Context 'Test-ContextOverrunRisk' {
        It 'T12 — returns Risk=false when session_mono_epoch is below threshold' {
            $sid = _CreateAliveSession
            Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "UPDATE agent_sessions SET session_mono_epoch=1000 WHERE session_id='$sid'"
            $result = Test-ContextOverrunRisk -Connection $script:Conn -AgentName 'test-agent' -Threshold 5000
            $result.Risk | Should -Be $false
        }

        It 'T13 — returns Risk=true when session_mono_epoch equals threshold' {
            $sid = _CreateAliveSession
            Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "UPDATE agent_sessions SET session_mono_epoch=5000 WHERE session_id='$sid'"
            $result = Test-ContextOverrunRisk -Connection $script:Conn -AgentName 'test-agent' -Threshold 5000
            $result.Risk | Should -Be $true
        }

        It 'T13b — returns Risk=true when session_mono_epoch exceeds threshold' {
            $sid = _CreateAliveSession
            Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "UPDATE agent_sessions SET session_mono_epoch=9999 WHERE session_id='$sid'"
            $result = Test-ContextOverrunRisk -Connection $script:Conn -AgentName 'test-agent' -Threshold 5000
            $result.Risk | Should -Be $true
        }

        It 'T14 — returns Risk=false with reason no_active_session when no session exists' {
            $result = Test-ContextOverrunRisk -Connection $script:Conn -AgentName 'nonexistent-agent' -Threshold 5000
            $result.Risk   | Should -Be $false
            $result.Reason | Should -Be 'no_active_session'
        }
    }

    Context 'Invoke-CheckpointAll' {
        It 'T15 — checkpoints all alive sessions' {
            $sid1 = _CreateAliveSession -Name 'agent-1'
            $sid2 = _CreateAliveSession -Name 'agent-2'
            Invoke-CheckpointAll -Connection $script:Conn
            $row1 = Get-AgentSession -Connection $script:Conn -SessionId $sid1
            $row2 = Get-AgentSession -Connection $script:Conn -SessionId $sid2
            $row1.status | Should -Be 'checkpointing'
            $row2.status | Should -Be 'checkpointing'
        }

        It 'T16 — returns correct CheckpointedCount' {
            _CreateAliveSession -Name 'agent-a' | Out-Null
            _CreateAliveSession -Name 'agent-b' | Out-Null
            _CreateAliveSession -Name 'agent-c' | Out-Null
            $result = Invoke-CheckpointAll -Connection $script:Conn
            $result.CheckpointedCount | Should -Be 3
        }

        It 'T17 — with no alive sessions returns CheckpointedCount=0' {
            $result = Invoke-CheckpointAll -Connection $script:Conn
            $result.CheckpointedCount | Should -Be 0
        }

        It 'T18 — after renew agent status is alive and ground_truth_delivered is 0' {
            $sid = _CreateAliveSession -Name 'renew-agent'
            Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "UPDATE agent_sessions SET ground_truth_delivered=1 WHERE session_id='$sid'"
            Invoke-CheckpointAll -Connection $script:Conn
            Invoke-RenewAgentSession -Connection $script:Conn -SessionId $sid -AgentName 'renew-agent' -RenewEpoch 77777 -NewSpawnEpoch 88888
            $row = Get-AgentSession -Connection $script:Conn -SessionId $sid
            $row.status | Should -Be 'alive'
            $row.ground_truth_delivered | Should -Be 0
        }
    }
}
