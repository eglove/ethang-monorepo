BeforeAll {
    Import-Module PSSQLite -ErrorAction SilentlyContinue
    . "$PSScriptRoot/../../../bus/infra/evt-id-allocator.ps1"
    . "$PSScriptRoot/../../../bus/domain/bus-lifecycle.ps1"
    . "$PSScriptRoot/../../../bus/domain/agent-session.ps1"
    . "$PSScriptRoot/../../../bus/router/resume.ps1"
    # Force-override any lingering Write-PipelineLog (see note in resume.Tests.ps1).
    function global:Write-PipelineLog { param($Message,$Severity='INFO',$Gate=$null,$StructuredData=$null) }

    function script:New-E2EBusDb {
        $conn = New-SQLiteConnection -DataSource ':memory:'
        $schemaPaths = @(
            "$PSScriptRoot/../../../bus/schema/bus-lifecycle-state.sql",
            "$PSScriptRoot/../../../bus/schema/agent-sessions.sql",
            "$PSScriptRoot/../../../bus/schema/event-log.sql"
        )
        foreach ($path in $schemaPaths) {
            $sql = Get-Content -Raw -Path $path
            Invoke-SqliteQuery -SQLiteConnection $conn -Query $sql | Out-Null
        }
        Reset-BusLifecycleLatch
        return $conn
    }

    function script:Add-E2EEvent {
        param($Connection, [int]$EvtId, [string]$Status = 'routed')
        Invoke-SqliteQuery -SQLiteConnection $Connection -Query @"
INSERT INTO event_log (evt_id, "from", "to", type, status)
VALUES (@id, 'agent-x', 'agent-y', 'task', @st)
"@ -SqlParameters @{id=$EvtId; st=$Status} | Out-Null
    }

    function script:Add-E2ESession {
        param($Connection, [string]$SessionId, [string]$Status = 'alive')
        Invoke-SqliteQuery -SQLiteConnection $Connection -Query @"
INSERT INTO agent_sessions (session_id, agent_name, role, status)
VALUES (@sid, 'e2e-agent', 'worker', @st)
"@ -SqlParameters @{sid=$SessionId; st=$Status} | Out-Null
    }
}

Describe 'Resume Bus E2E Tests (halt-then-resume lifecycle)' {

    BeforeEach {
        $script:conn = New-E2EBusDb
    }

    AfterEach {
        if ($script:conn) { $script:conn.Close(); $script:conn.Dispose() }
    }

    It '1. Halt then resume: bus transitions halted -> running' {
        Invoke-BusHalt -Connection $script:conn -HaltReason 'crash'
        $halted = Get-BusLifecycleState -Connection $script:conn
        $halted.BusStatus | Should -Be 'halted'

        Invoke-BusResumeRecovery -Connection $script:conn | Out-Null

        $resumed = Get-BusLifecycleState -Connection $script:conn
        $resumed.BusStatus | Should -Be 'running'
    }

    It '2. Halt with 3 uncommitted events: resume marks all 3 as delivery_failed' {
        Add-E2EEvent -Connection $script:conn -EvtId 101
        Add-E2EEvent -Connection $script:conn -EvtId 102
        Add-E2EEvent -Connection $script:conn -EvtId 103
        Invoke-BusHalt -Connection $script:conn -HaltReason 'crash'

        $result = Invoke-BusResumeRecovery -Connection $script:conn
        $result.ReplayedEvents | Should -Be 3

        $failed = @(Invoke-SqliteQuery -SQLiteConnection $script:conn -Query "SELECT * FROM event_log WHERE status='delivery_failed'")
        $failed.Count | Should -Be 3
    }

    It '3. Halt with 2 alive sessions: resume marks both as dead' {
        Add-E2ESession -Connection $script:conn -SessionId 'e2e-sess-1' -Status 'alive'
        Add-E2ESession -Connection $script:conn -SessionId 'e2e-sess-2' -Status 'alive'
        Invoke-BusHalt -Connection $script:conn -HaltReason 'crash'

        $result = Invoke-BusResumeRecovery -Connection $script:conn
        $result.CleanedSessions | Should -Be 2

        $dead = @(Invoke-SqliteQuery -SQLiteConnection $script:conn -Query "SELECT * FROM agent_sessions WHERE status='dead'")
        $dead.Count | Should -Be 2
    }

    It '4. Resume with $OnAgentRespawn injectable: receives the dead sessions' {
        Add-E2ESession -Connection $script:conn -SessionId 'e2e-respawn-1' -Status 'alive'
        Add-E2ESession -Connection $script:conn -SessionId 'e2e-respawn-2' -Status 'spawning'
        Invoke-BusHalt -Connection $script:conn -HaltReason 'crash'

        $script:respawnReceived = $null
        $respawnCb = { param($sessions); $script:respawnReceived = $sessions }

        Invoke-BusResumeRecovery -Connection $script:conn -OnAgentRespawn $respawnCb | Out-Null

        $script:respawnReceived | Should -Not -BeNullOrEmpty
        @($script:respawnReceived).Count | Should -BeGreaterOrEqual 1
    }

    It '5. Resume is idempotent when called twice (second call with -Force is safe)' {
        Invoke-BusHalt -Connection $script:conn -HaltReason 'crash'
        Invoke-BusResumeRecovery -Connection $script:conn | Out-Null

        # Second call uses -Force since bus is already running
        { Invoke-BusResumeRecovery -Connection $script:conn -Force } | Should -Not -Throw

        $state = Get-BusLifecycleState -Connection $script:conn
        $state.BusStatus | Should -Be 'running'
    }

    It '6. Schema-version scenario: after resume, busStatus=''running'' visible via Get-BusLifecycleState' {
        Invoke-BusHalt -Connection $script:conn -HaltReason 'schema_upgrade'
        Invoke-BusResumeRecovery -Connection $script:conn | Out-Null

        $state = Get-BusLifecycleState -Connection $script:conn
        $state.BusStatus | Should -Be 'running'
        $state.HaltReason | Should -BeNullOrEmpty
    }

    It '7. Virtual clock: ResumedAt in result matches injected timestamp' {
        $fixedTime = '2026-04-18T12:00:00Z'
        $clockFn = { $fixedTime }

        Invoke-BusHalt -Connection $script:conn -HaltReason 'crash'
        $result = Invoke-BusResumeRecovery -Connection $script:conn -GetUtcNow $clockFn

        $result.ResumedAt | Should -Be $fixedTime
    }

    It '8. Halt with pipeline_lock=1 (simulate mid-commit): resume without -Force throws ResumeError' {
        Invoke-BusHalt -Connection $script:conn -HaltReason 'mid_commit'
        # Manually set pipeline_lock to 1 to simulate mid-commit
        Invoke-SqliteQuery -SQLiteConnection $script:conn -Query "UPDATE bus_lifecycle_state SET value='1' WHERE key='pipeline_lock'" | Out-Null

        { Invoke-BusResumeRecovery -Connection $script:conn } | Should -Throw '*ResumeError*'
    }
}
