#Requires -Module Pester
# router-core.Tests.ps1 — Integration tests for bus/router/router.ps1 using real SQLite

Describe 'Invoke-BusAppendEvent — integration tests (real SQLite)' {

    BeforeAll {
        Import-Module PSSQLite -ErrorAction Stop

        $script:RouterPath = Resolve-Path "$PSScriptRoot/../../../bus/router/router.ps1"
        $script:SchemaPath = Resolve-Path "$PSScriptRoot/../../../bus/schema/event-log.sql"

        # Define Write-PipelineLog stub before dot-sourcing router
        function global:Write-PipelineLog {
            param(
                [string]$Message,
                [string]$Severity = 'INFO',
                [string]$Gate = $null,
                [hashtable]$StructuredData = $null
            )
        }

        . $script:RouterPath
    }

    BeforeEach {
        $script:TestDir = Join-Path $env:TEMP "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory -Path $script:TestDir | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'

        # Create connection and apply schema
        $connStr = "Data Source=$($script:DbPath);Version=3;"
        $conn = New-Object System.Data.SQLite.SQLiteConnection($connStr)
        $conn.Open()

        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "PRAGMA journal_mode=WAL"
        $cmd.ExecuteNonQuery() | Out-Null

        # Execute schema using Invoke-SqliteQuery which handles multiple statements
        $sql = Get-Content $script:SchemaPath -Raw
        Invoke-SqliteQuery -SQLiteConnection $conn -Query $sql | Out-Null
        $cmd.Dispose()

        $script:Conn = $conn

        Initialize-EvtIdAllocator -StartValue 1
        Reset-RouterState
    }

    AfterEach {
        if ($script:Conn) {
            $script:Conn.Close()
            $script:Conn.Dispose()
            $script:Conn = $null
        }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    AfterAll {
        Remove-Item function:global:Write-PipelineLog -ErrorAction SilentlyContinue
    }

    It '01: inserts a row in event_log with status=routed' {
        Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' | Out-Null

        $cmd = $script:Conn.CreateCommand()
        $cmd.CommandText = "SELECT count(*) FROM event_log WHERE status='routed'"
        $count = $cmd.ExecuteScalar()
        $cmd.Dispose()
        $count | Should -Be 1
    }

    It '02: inserted row has correct from, to, type values' {
        Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' | Out-Null

        $cmd = $script:Conn.CreateCommand()
        $cmd.CommandText = 'SELECT "from", "to", type FROM event_log LIMIT 1'
        $reader = $cmd.ExecuteReader()
        $reader.Read() | Out-Null
        $fromVal = $reader['from']
        $toVal   = $reader['to']
        $typeVal = $reader['type']
        $reader.Close()
        $cmd.Dispose()

        $fromVal | Should -Be 'orchestrator'
        $toVal   | Should -Be 'tla-writer'
        $typeVal | Should -Be 'bootstrap'
    }

    It '03: first call produces evt_id = 1' {
        $result = Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap'
        $result.EvtId | Should -Be 1
    }

    It '04: null payload stored as NULL (not empty string)' {
        Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' | Out-Null

        $cmd = $script:Conn.CreateCommand()
        $cmd.CommandText = "SELECT payload FROM event_log WHERE evt_id=1"
        $val = $cmd.ExecuteScalar()
        $cmd.Dispose()

        # SQLite returns DBNull or null for NULL columns
        ($val -eq $null -or $val -is [System.DBNull]) | Should -BeTrue
    }

    It '05: non-null payload stored as JSON string' {
        $json = '{"key":"value"}'
        Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -Payload $json | Out-Null

        $cmd = $script:Conn.CreateCommand()
        $cmd.CommandText = "SELECT payload FROM event_log WHERE evt_id=1"
        $val = $cmd.ExecuteScalar()
        $cmd.Dispose()

        $val | Should -Be $json
    }

    It '06: second call produces evt_id = 2 (monotone)' {
        $r1 = Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap'
        $r2 = Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'ground_truth'
        $r1.EvtId | Should -Be 1
        $r2.EvtId | Should -Be 2
    }

    It '07: group_id is stored correctly when provided' {
        $gid = 'grp-abc-123'
        Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -GroupId $gid | Out-Null

        $cmd = $script:Conn.CreateCommand()
        $cmd.CommandText = "SELECT group_id FROM event_log WHERE evt_id=1"
        $val = $cmd.ExecuteScalar()
        $cmd.Dispose()

        $val | Should -Be $gid
    }

    It '08: in_reply_to is stored correctly when provided' {
        Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' | Out-Null
        Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'ground_truth' -InReplyTo 1 | Out-Null

        $cmd = $script:Conn.CreateCommand()
        $cmd.CommandText = "SELECT in_reply_to FROM event_log WHERE evt_id=2"
        $val = $cmd.ExecuteScalar()
        $cmd.Dispose()

        $val | Should -Be 1
    }

    It '09: Invoke-RouterStartupRecovery rebuilds _RoutedIds from existing rows' {
        Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' | Out-Null
        Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'ground_truth' | Out-Null

        Reset-RouterState
        $idsBefore = Get-RoutedEventIds
        $idsBefore.Count | Should -Be 0

        Invoke-RouterStartupRecovery -Connection $script:Conn

        $idsAfter = Get-RoutedEventIds
        $idsAfter.Count | Should -Be 2
        $idsAfter.Contains([long]1) | Should -BeTrue
        $idsAfter.Contains([long]2) | Should -BeTrue
    }

    It '10: Invoke-RouterStartupRecovery re-initializes allocator to max_evt_id + 1' {
        Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' | Out-Null
        Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'ground_truth' | Out-Null

        Reset-RouterState
        Invoke-RouterStartupRecovery -Connection $script:Conn

        $nextId = Get-NextEvtId
        $nextId | Should -Be 3
    }

    It '11: after recovery, Invoke-BusAppendEvent produces evt_id = max_existing + 1' {
        Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' | Out-Null
        Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'ground_truth' | Out-Null

        Reset-RouterState
        Invoke-RouterStartupRecovery -Connection $script:Conn

        $r3 = Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'checkpoint'
        $r3.EvtId | Should -Be 3
    }

    It '12: records AppendEvent p99 latency baseline (advisory, always passes)' {
        $times = [System.Collections.Generic.List[double]]::new()
        for ($i = 0; $i -lt 1000; $i++) {
            $sw = [System.Diagnostics.Stopwatch]::StartNew()
            Invoke-BusAppendEvent -Connection $script:Conn -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' | Out-Null
            $sw.Stop()
            $times.Add($sw.Elapsed.TotalMilliseconds)
        }

        $sorted = $times | Sort-Object
        $p99  = $sorted[[int]($sorted.Count * 0.99)]
        $p999 = $sorted[[int]($sorted.Count * 0.999)]
        Write-Host "AppendEvent p99=${p99}ms p999=${p999}ms"

        if ($p99 -gt 5) {
            Write-Warning "p99=${p99}ms exceeds 5ms baseline (advisory in test env)"
        }

        # Always passes — baseline is advisory
        $p99 | Should -BeGreaterOrEqual 0
    }
}
