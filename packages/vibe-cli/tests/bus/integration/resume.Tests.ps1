BeforeAll {
    Import-Module PSSQLite -ErrorAction SilentlyContinue
    . "$PSScriptRoot/../../../bus/infra/evt-id-allocator.ps1"
    . "$PSScriptRoot/../../../bus/domain/bus-lifecycle.ps1"
    . "$PSScriptRoot/../../../bus/domain/agent-session.ps1"
    . "$PSScriptRoot/../../../bus/router/resume.ps1"
    # Force-override any Write-PipelineLog left over from earlier test files
    # (e.g. protocol-error.Tests.ps1 installs a tracker that hits cross-file $script:
    # scope and fails with "Item has already been added" when reused here).
    function global:Write-PipelineLog { param($Message,$Severity='INFO',$Gate=$null,$StructuredData=$null) }

    function script:New-TestBusDb {
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

    function script:Add-TestEvent {
        param($Connection, [int]$EvtId, [string]$Status = 'routed')
        Invoke-SqliteQuery -SQLiteConnection $Connection -Query @"
INSERT INTO event_log (evt_id, "from", "to", type, status)
VALUES (@id, 'agent-a', 'agent-b', 'task', @st)
"@ -SqlParameters @{id=$EvtId; st=$Status} | Out-Null
    }

    function script:Add-TestSession {
        param($Connection, [string]$SessionId, [string]$Status = 'alive')
        Invoke-SqliteQuery -SQLiteConnection $Connection -Query @"
INSERT INTO agent_sessions (session_id, agent_name, role, status)
VALUES (@sid, 'test-agent', 'worker', @st)
"@ -SqlParameters @{sid=$SessionId; st=$Status} | Out-Null
    }
}

Describe 'Resume Bus Integration Tests' {

    BeforeEach {
        $script:conn = New-TestBusDb
        # Put bus in halted state for most tests
        Invoke-BusHalt -Connection $script:conn -HaltReason 'test_halt'
    }

    AfterEach {
        if ($script:conn) { $script:conn.Close(); $script:conn.Dispose() }
    }

    It '1. Test-ResumePreconditions returns Safe=$true when bus is halted and lock=0' {
        $result = Test-ResumePreconditions -Connection $script:conn
        $result.Safe | Should -BeTrue
    }

    It '2. Test-ResumePreconditions throws when bus is running (not halted)' {
        # Fresh DB: bus is running
        $runningConn = New-TestBusDb
        try {
            { Test-ResumePreconditions -Connection $runningConn } | Should -Throw '*not halted*'
        } finally {
            $runningConn.Close(); $runningConn.Dispose()
        }
    }

    It '3. Test-ResumePreconditions throws when pipeline_lock=1' {
        Invoke-SqliteQuery -SQLiteConnection $script:conn -Query "UPDATE bus_lifecycle_state SET value='1' WHERE key='pipeline_lock'" | Out-Null
        { Test-ResumePreconditions -Connection $script:conn } | Should -Throw '*pipeline_lock*'
    }

    It '4. Get-UncommittedEvents returns empty array when no routed events' {
        $result = Get-UncommittedEvents -Connection $script:conn
        @($result).Count | Should -Be 0
    }

    It '5. Get-UncommittedEvents returns routed events ordered by evt_id' {
        Add-TestEvent -Connection $script:conn -EvtId 10
        Add-TestEvent -Connection $script:conn -EvtId 5
        Add-TestEvent -Connection $script:conn -EvtId 20
        $result = @(Get-UncommittedEvents -Connection $script:conn)
        $result.Count | Should -Be 3
        $result[0].evt_id | Should -Be 5
        $result[1].evt_id | Should -Be 10
        $result[2].evt_id | Should -Be 20
    }

    It '6. Invoke-ReplayUncommittedEvents marks routed events as delivery_failed' {
        Add-TestEvent -Connection $script:conn -EvtId 1
        Add-TestEvent -Connection $script:conn -EvtId 2
        Invoke-ReplayUncommittedEvents -Connection $script:conn | Out-Null
        $events = @(Invoke-SqliteQuery -SQLiteConnection $script:conn -Query "SELECT * FROM event_log WHERE status='delivery_failed'")
        $events.Count | Should -Be 2
    }

    It '7. Invoke-ReplayUncommittedEvents returns ReplayedCount = N' {
        Add-TestEvent -Connection $script:conn -EvtId 1
        Add-TestEvent -Connection $script:conn -EvtId 2
        Add-TestEvent -Connection $script:conn -EvtId 3
        $result = Invoke-ReplayUncommittedEvents -Connection $script:conn
        $result.ReplayedCount | Should -Be 3
    }

    It '8. Invoke-BusResumeRecovery transitions bus from halted to running' {
        Invoke-BusResumeRecovery -Connection $script:conn | Out-Null
        $state = Get-BusLifecycleState -Connection $script:conn
        $state.BusStatus | Should -Be 'running'
    }

    It '9. Invoke-BusResumeRecovery replays uncommitted events' {
        Add-TestEvent -Connection $script:conn -EvtId 1
        Add-TestEvent -Connection $script:conn -EvtId 2
        $result = Invoke-BusResumeRecovery -Connection $script:conn
        $result.ReplayedEvents | Should -Be 2
    }

    It '10. Invoke-BusResumeRecovery marks alive sessions as dead' {
        Add-TestSession -Connection $script:conn -SessionId 'sess-1' -Status 'alive'
        Add-TestSession -Connection $script:conn -SessionId 'sess-2' -Status 'alive'
        Invoke-BusResumeRecovery -Connection $script:conn | Out-Null
        $dead = @(Invoke-SqliteQuery -SQLiteConnection $script:conn -Query "SELECT * FROM agent_sessions WHERE status='dead'")
        $dead.Count | Should -Be 2
    }

    It '11. Invoke-BusResumeRecovery returns @{ Status=''running'' }' {
        $result = Invoke-BusResumeRecovery -Connection $script:conn
        $result.Status | Should -Be 'running'
    }

    It '12. Invoke-BusResumeRecovery -Force skips precondition check (succeeds even if not halted)' {
        # Fresh running DB - no halt
        $runningConn = New-TestBusDb
        try {
            { Invoke-BusResumeRecovery -Connection $runningConn -Force } | Should -Not -Throw
        } finally {
            $runningConn.Close(); $runningConn.Dispose()
        }
    }

    It '13. Invoke-BusResumeRecovery calls $OnAgentRespawn with dead sessions list' {
        Add-TestSession -Connection $script:conn -SessionId 'sess-respawn' -Status 'alive'
        $script:captured = $null
        $respawnCallback = { param($sessions); $script:captured = $sessions }
        Invoke-BusResumeRecovery -Connection $script:conn -OnAgentRespawn $respawnCallback | Out-Null
        $script:captured | Should -Not -BeNullOrEmpty
        @($script:captured).Count | Should -BeGreaterOrEqual 1
    }

    It '14. After recovery, busStatus = ''running'' in DB' {
        Invoke-BusResumeRecovery -Connection $script:conn | Out-Null
        $row = Invoke-SqliteQuery -SQLiteConnection $script:conn -Query "SELECT value FROM bus_lifecycle_state WHERE key='busStatus'"
        $row.value | Should -Be 'running'
    }

    It '15. After recovery, halt_reason = NULL in DB' {
        Invoke-BusResumeRecovery -Connection $script:conn | Out-Null
        $row = Invoke-SqliteQuery -SQLiteConnection $script:conn -Query "SELECT value FROM bus_lifecycle_state WHERE key='halt_reason'"
        $row.value | Should -BeNullOrEmpty
    }
}
