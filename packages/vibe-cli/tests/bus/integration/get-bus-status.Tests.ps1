BeforeAll {
    Import-Module PSSQLite -ErrorAction SilentlyContinue
    $script:VikeCliRoot = (Resolve-Path "$PSScriptRoot/../../..").Path
    . (Join-Path $script:VikeCliRoot 'bus/domain/bus-lifecycle.ps1')
    . (Join-Path $script:VikeCliRoot 'bus/router/get-bus-status.ps1')
    if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
        function global:Write-PipelineLog { param($Message,$Severity='INFO',$Gate=$null,$StructuredData=$null) }
    }

    function global:_InsertRoutedEvent {
        $cmd = $script:Conn.CreateCommand()
        $cmd.CommandText = "INSERT INTO event_log (""from"",""to"",type,status) VALUES ('orchestrator','tla-writer','bootstrap','routed')"
        $cmd.ExecuteNonQuery() | Out-Null; $cmd.Dispose()
    }

    function global:_InsertAliveSession {
        param([string]$Name='test-agent')
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "INSERT INTO agent_sessions (session_id,agent_name,role,status) VALUES ('$(New-Guid)','$Name','coding-worker','alive')"
    }
}

Describe 'Get-BusStatus integration tests' {

    BeforeEach {
        $script:TestDir = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory $script:TestDir | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'
        $script:Conn = New-SQLiteConnection -DataSource $script:DbPath
        foreach ($sqlFile in @('bus-lifecycle-state','event-log','agent-sessions')) {
            $sql = Get-Content (Join-Path $script:VikeCliRoot "bus/schema/$sqlFile.sql") -Raw
            Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $sql
        }
        Reset-BusLifecycleLatch
        Reset-BusStatusState
    }

    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    It 'Test 01: returns BusStatus=running from fresh DB' {
        $result = Get-BusStatus -Connection $script:Conn
        $result.BusStatus | Should -Be 'running'
    }

    It 'Test 02: returns HaltReason=$null when not halted' {
        $result = Get-BusStatus -Connection $script:Conn
        $result.HaltReason | Should -BeNullOrEmpty
    }

    It 'Test 03: returns PipelineLock=0 initially' {
        $result = Get-BusStatus -Connection $script:Conn
        $result.PipelineLock | Should -Be 0
    }

    It 'Test 04: EventCounts.Total = 0 on empty event_log' {
        $result = Get-BusStatus -Connection $script:Conn
        $result.EventCounts.Total | Should -Be 0
    }

    It 'Test 05: EventCounts.Routed = 1 after one routed event inserted' {
        _InsertRoutedEvent
        $result = Get-BusStatus -Connection $script:Conn
        $result.EventCounts.Routed | Should -Be 1
    }

    It 'Test 06: EventCounts.Committed counts committed events' {
        _InsertRoutedEvent
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "UPDATE event_log SET status='committed' WHERE rowid=(SELECT MAX(rowid) FROM event_log)"
        $result = Get-BusStatus -Connection $script:Conn
        $result.EventCounts.Committed | Should -Be 1
    }

    It 'Test 07: AgentCounts.Alive = 0 on empty agent_sessions' {
        $result = Get-BusStatus -Connection $script:Conn
        $result.AgentCounts.Alive | Should -Be 0
    }

    It 'Test 08: AgentCounts.Alive = 2 when 2 alive sessions' {
        _InsertAliveSession -Name 'agent-a'
        _InsertAliveSession -Name 'agent-b'
        $result = Get-BusStatus -Connection $script:Conn
        $result.AgentCounts.Alive | Should -Be 2
    }

    It 'Test 09: AgentCounts.Dead = 1 when 1 dead session' {
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "INSERT INTO agent_sessions (session_id,agent_name,role,status) VALUES ('$(New-Guid)','dead-agent','coding-worker','dead')"
        $result = Get-BusStatus -Connection $script:Conn
        $result.AgentCounts.Dead | Should -Be 1
    }

    It 'Test 10: After Invoke-BusHalt: BusStatus=halted and HaltReason=mechanical_error' {
        # INV-15: mechanical_error requires FailureCategory; supply one to satisfy the invariant.
        Invoke-BusHalt -Connection $script:Conn -HaltReason 'mechanical_error' -FailureCategory 'agent_crash'
        $result = Get-BusStatus -Connection $script:Conn
        $result.BusStatus | Should -Be 'halted'
        $result.HaltReason | Should -Be 'mechanical_error'
    }

    It 'Test 11: After halt with FailureCategory: FailureCategory=agent_crash visible in status' {
        Invoke-BusHalt -Connection $script:Conn -HaltReason 'mechanical_error' -FailureCategory 'agent_crash'
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "UPDATE bus_lifecycle_state SET value='agent_crash' WHERE key='failure_category'"
        $result = Get-BusStatus -Connection $script:Conn
        $result.FailureCategory | Should -Be 'agent_crash'
    }

    It 'Test 12: uses virtual clock - Timestamp matches injected time' {
        $fixedTime = [DateTime]::new(2026, 4, 18, 12, 0, 0, [System.DateTimeKind]::Utc)
        $result = Get-BusStatus -Connection $script:Conn -GetUtcNow { $fixedTime }
        $result.Timestamp | Should -Be $fixedTime
    }

    It 'Test 13: Format-BusStatusReport contains Bus Status: running' {
        $status = Get-BusStatus -Connection $script:Conn
        $report = Format-BusStatusReport -Status $status
        $report | Should -Match 'Bus Status: running'
    }

    It 'Test 14: Format-BusStatusReport contains Total: and Alive:' {
        $status = Get-BusStatus -Connection $script:Conn
        $report = Format-BusStatusReport -Status $status
        $report | Should -Match 'Total:'
        $report | Should -Match 'Alive:'
    }

    It 'Test 15: Format-BusStatusReport with halted bus shows halt reason' {
        # INV-15: mechanical_error requires FailureCategory.
        Invoke-BusHalt -Connection $script:Conn -HaltReason 'mechanical_error' -FailureCategory 'agent_crash'
        $status = Get-BusStatus -Connection $script:Conn
        $report = Format-BusStatusReport -Status $status
        $report | Should -Match 'mechanical_error'
    }

    It 'Test 16: EventCounts.DeliveryFailed = 1 after one failed event' {
        _InsertRoutedEvent
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "UPDATE event_log SET status='delivery_failed' WHERE rowid=(SELECT MAX(rowid) FROM event_log)"
        $result = Get-BusStatus -Connection $script:Conn
        $result.EventCounts.DeliveryFailed | Should -Be 1
    }

    It 'Test 17: AgentCounts.Total includes all sessions regardless of status' {
        _InsertAliveSession -Name 'alive-agent'
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "INSERT INTO agent_sessions (session_id,agent_name,role,status) VALUES ('$(New-Guid)','dead-agent','coding-worker','dead')"
        $result = Get-BusStatus -Connection $script:Conn
        $result.AgentCounts.Total | Should -Be 2
    }

    It 'Test 18: with both event types and agent statuses returns correct composite' {
        _InsertRoutedEvent
        _InsertRoutedEvent
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "UPDATE event_log SET status='committed' WHERE rowid=(SELECT MIN(rowid) FROM event_log)"
        _InsertAliveSession -Name 'alive-1'
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "INSERT INTO agent_sessions (session_id,agent_name,role,status) VALUES ('$(New-Guid)','dead-1','coding-worker','dead')"
        $result = Get-BusStatus -Connection $script:Conn
        $result.EventCounts.Total | Should -Be 2
        $result.EventCounts.Committed | Should -Be 1
        $result.EventCounts.Routed | Should -Be 1
        $result.AgentCounts.Alive | Should -Be 1
        $result.AgentCounts.Dead | Should -Be 1
        $result.AgentCounts.Total | Should -Be 2
    }
}
