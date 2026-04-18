BeforeAll {
    Import-Module PSSQLite -ErrorAction SilentlyContinue
    # PSScriptRoot = tests/bus/integration => go up 3 levels to vibe-cli, then into bus
    $script:VibeCliRoot = (Get-Item (Join-Path $PSScriptRoot '..' '..' '..')).FullName
    $script:BusRoot = Join-Path $script:VibeCliRoot 'bus'
    . (Join-Path $script:BusRoot 'infra' 'evt-id-allocator.ps1')
    . (Join-Path $script:BusRoot 'router' 'router.ps1')
    . (Join-Path $script:BusRoot 'router' 'wait-bus-group.ps1')
    if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
        function global:Write-PipelineLog { param($M,$S='INFO',$G=$null,$D=$null) }
    }
}

# ─── New-BusGroup ─────────────────────────────────────────────────────────────

Describe 'New-BusGroup' {
    BeforeEach {
        $script:TestDir = Join-Path $env:TEMP "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory $script:TestDir | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'
        $script:Conn = New-SQLiteConnection -DataSource $script:DbPath
        $sql = Get-Content (Join-Path $script:BusRoot 'schema' 'event-log.sql') -Raw
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $sql
        Initialize-EvtIdAllocator -StartValue 1
        Reset-RouterState
        Reset-BusGroupState
    }
    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    It 'T1: creates entry in _BusGroups keyed by GroupId' {
        New-BusGroup -GroupId 'grp1' -Members @('a1','a2') -ExpectedResponseType 'done'

        $status = Get-BusGroupStatus -GroupId 'grp1'
        $status | Should -Not -BeNullOrEmpty
        $status.GroupId | Should -Be 'grp1'
    }

    It 'T2: sets Members, ExpectedCount, and Complete = false' {
        New-BusGroup -GroupId 'grp2' -Members @('a1','a2','a3') -ExpectedResponseType 'ack'

        $status = Get-BusGroupStatus -GroupId 'grp2'
        $status.Members | Should -Be @('a1','a2','a3')
        $status.ExpectedCount | Should -Be 3
        $status.Complete | Should -Be $false
    }

    It 'T3: silently overwrites existing GroupId (idempotent)' {
        New-BusGroup -GroupId 'grp3' -Members @('a1') -ExpectedResponseType 'done'
        New-BusGroup -GroupId 'grp3' -Members @('b1','b2') -ExpectedResponseType 'ack'

        $status = Get-BusGroupStatus -GroupId 'grp3'
        $status.Members | Should -Be @('b1','b2')
        $status.ExpectedCount | Should -Be 2
        $status.ExpectedResponseType | Should -Be 'ack'
    }
}

# ─── Send-BusGroupEvent ───────────────────────────────────────────────────────

Describe 'Send-BusGroupEvent' {
    BeforeEach {
        $script:TestDir = Join-Path $env:TEMP "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory $script:TestDir | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'
        $script:Conn = New-SQLiteConnection -DataSource $script:DbPath
        $sql = Get-Content (Join-Path $script:BusRoot 'schema' 'event-log.sql') -Raw
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $sql
        Initialize-EvtIdAllocator -StartValue 1
        Reset-RouterState
        Reset-BusGroupState
    }
    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    It 'T4: inserts one row per member with same group_id' {
        New-BusGroup -GroupId 'grp4' -Members @('agent1','agent2','agent3') -ExpectedResponseType 'done'
        Send-BusGroupEvent -Connection $script:Conn -GroupId 'grp4' -From 'orchestrator' -Type 'task'

        $rows = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT * FROM event_log WHERE group_id='grp4'"
        $rows.Count | Should -Be 3
    }

    It 'T5: throws GroupNotFound on unknown GroupId' {
        { Send-BusGroupEvent -Connection $script:Conn -GroupId 'unknown-grp' -From 'orchestrator' -Type 'task' } |
            Should -Throw -ExpectedMessage '*GroupNotFound*'
    }

    It 'T6: returns SentCount = 3 when group has 3 members' {
        New-BusGroup -GroupId 'grp6' -Members @('a1','a2','a3') -ExpectedResponseType 'done'
        $result = Send-BusGroupEvent -Connection $script:Conn -GroupId 'grp6' -From 'orchestrator' -Type 'task'

        $result.SentCount | Should -Be 3
    }

    It 'T7: all rows in DB share the same group_id' {
        New-BusGroup -GroupId 'grp7' -Members @('x1','x2') -ExpectedResponseType 'done'
        Send-BusGroupEvent -Connection $script:Conn -GroupId 'grp7' -From 'orchestrator' -Type 'work'

        $rows = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT group_id FROM event_log WHERE group_id='grp7'"
        $rows | ForEach-Object { $_.group_id | Should -Be 'grp7' }
        $rows.Count | Should -Be 2
    }

    It 'T17: with 1 member sends exactly 1 row' {
        New-BusGroup -GroupId 'grp17' -Members @('solo') -ExpectedResponseType 'done'
        $result = Send-BusGroupEvent -Connection $script:Conn -GroupId 'grp17' -From 'orchestrator' -Type 'ping'

        $result.SentCount | Should -Be 1
        $rows = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT * FROM event_log WHERE group_id='grp17'"
        $rows.Count | Should -Be 1
    }
}

# ─── Wait-BusGroup ────────────────────────────────────────────────────────────

Describe 'Wait-BusGroup' {
    BeforeEach {
        $script:TestDir = Join-Path $env:TEMP "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory $script:TestDir | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'
        $script:Conn = New-SQLiteConnection -DataSource $script:DbPath
        $sql = Get-Content (Join-Path $script:BusRoot 'schema' 'event-log.sql') -Raw
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $sql
        Initialize-EvtIdAllocator -StartValue 1
        Reset-RouterState
        Reset-BusGroupState
    }
    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    It 'T8: returns Complete=true when all expected responses present' {
        New-BusGroup -GroupId 'grp8' -Members @('agent1','agent2') -ExpectedResponseType 'done'

        foreach ($agent in @('agent1','agent2')) {
            $cmd = $script:Conn.CreateCommand()
            $cmd.CommandText = "INSERT INTO event_log (`"from`",`"to`",in_reply_to,group_id,type,payload,status) VALUES (@f,'orchestrator',NULL,'grp8','done',NULL,'routed')"
            $cmd.Parameters.AddWithValue('@f', $agent) | Out-Null
            $cmd.ExecuteNonQuery() | Out-Null
            $cmd.Dispose()
        }

        $result = Wait-BusGroup -Connection $script:Conn -GroupId 'grp8' -TimeoutMs 5000 -PollIntervalMs 0

        $result.Complete | Should -Be $true
        $result.TimedOut | Should -Be $false
    }

    It 'T9: returns TimedOut=true when no responses and timeout reached' {
        New-BusGroup -GroupId 'grp9' -Members @('agent1','agent2') -ExpectedResponseType 'done'

        $mockClock = { [DateTime]::UtcNow.AddSeconds(60) }

        $result = Wait-BusGroup -Connection $script:Conn -GroupId 'grp9' -TimeoutMs 5000 -PollIntervalMs 0 -GetUtcNow $mockClock

        $result.TimedOut | Should -Be $true
        $result.Complete | Should -Be $false
    }

    It 'T10: with PollIntervalMs=0 completes fast (no sleep overhead)' {
        New-BusGroup -GroupId 'grp10' -Members @('a1') -ExpectedResponseType 'ack'

        $cmd = $script:Conn.CreateCommand()
        $cmd.CommandText = "INSERT INTO event_log (`"from`",`"to`",in_reply_to,group_id,type,payload,status) VALUES ('a1','orchestrator',NULL,'grp10','ack',NULL,'routed')"
        $cmd.ExecuteNonQuery() | Out-Null
        $cmd.Dispose()

        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $result = Wait-BusGroup -Connection $script:Conn -GroupId 'grp10' -TimeoutMs 5000 -PollIntervalMs 0
        $sw.Stop()

        $result.Complete | Should -Be $true
        $sw.ElapsedMilliseconds | Should -BeLessThan 1000
    }

    It 'T11: pre-inserted responses return ReceivedCount = ExpectedCount immediately' {
        New-BusGroup -GroupId 'grp11' -Members @('a1','a2','a3') -ExpectedResponseType 'result'

        foreach ($i in 1..3) {
            $cmd = $script:Conn.CreateCommand()
            $cmd.CommandText = "INSERT INTO event_log (`"from`",`"to`",in_reply_to,group_id,type,payload,status) VALUES ('a$i','orch',NULL,'grp11','result',NULL,'routed')"
            $cmd.ExecuteNonQuery() | Out-Null
            $cmd.Dispose()
        }

        $result = Wait-BusGroup -Connection $script:Conn -GroupId 'grp11' -TimeoutMs 5000 -PollIntervalMs 0

        $result.Complete | Should -Be $true
        $result.ReceivedCount | Should -Be 3
    }

    It 'T12: partial responses (2/3) times out with TimedOut=true' {
        New-BusGroup -GroupId 'grp12' -Members @('a1','a2','a3') -ExpectedResponseType 'done'

        foreach ($i in 1..2) {
            $cmd = $script:Conn.CreateCommand()
            $cmd.CommandText = "INSERT INTO event_log (`"from`",`"to`",in_reply_to,group_id,type,payload,status) VALUES ('a$i','orch',NULL,'grp12','done',NULL,'routed')"
            $cmd.ExecuteNonQuery() | Out-Null
            $cmd.Dispose()
        }

        $mockClock = { [DateTime]::UtcNow.AddSeconds(60) }

        $result = Wait-BusGroup -Connection $script:Conn -GroupId 'grp12' -TimeoutMs 5000 -PollIntervalMs 0 -GetUtcNow $mockClock

        $result.TimedOut | Should -Be $true
        $result.ReceivedCount | Should -Be 2
    }

    It 'T18: throws GroupNotFound on unknown GroupId' {
        { Wait-BusGroup -Connection $script:Conn -GroupId 'no-such-group' -TimeoutMs 100 -PollIntervalMs 0 } |
            Should -Throw -ExpectedMessage '*GroupNotFound*'
    }
}

# ─── Get-BusGroupStatus ───────────────────────────────────────────────────────

Describe 'Get-BusGroupStatus' {
    BeforeEach {
        $script:TestDir = Join-Path $env:TEMP "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory $script:TestDir | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'
        $script:Conn = New-SQLiteConnection -DataSource $script:DbPath
        $sql = Get-Content (Join-Path $script:BusRoot 'schema' 'event-log.sql') -Raw
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $sql
        Initialize-EvtIdAllocator -StartValue 1
        Reset-RouterState
        Reset-BusGroupState
    }
    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    It 'T13: returns group info after creation' {
        New-BusGroup -GroupId 'grp13' -Members @('m1','m2') -ExpectedResponseType 'ping'

        $status = Get-BusGroupStatus -GroupId 'grp13'
        $status | Should -Not -BeNullOrEmpty
        $status.GroupId | Should -Be 'grp13'
        $status.ExpectedResponseType | Should -Be 'ping'
    }

    It 'T14: returns null for unknown group' {
        $status = Get-BusGroupStatus -GroupId 'no-group'
        $status | Should -BeNullOrEmpty
    }
}

# ─── Reset-BusGroupState ──────────────────────────────────────────────────────

Describe 'Reset-BusGroupState' {
    BeforeEach {
        $script:TestDir = Join-Path $env:TEMP "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory $script:TestDir | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'
        $script:Conn = New-SQLiteConnection -DataSource $script:DbPath
        $sql = Get-Content (Join-Path $script:BusRoot 'schema' 'event-log.sql') -Raw
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $sql
        Initialize-EvtIdAllocator -StartValue 1
        Reset-RouterState
        Reset-BusGroupState
    }
    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    It 'T15: clears all entries from _BusGroups' {
        New-BusGroup -GroupId 'grp15a' -Members @('a') -ExpectedResponseType 'done'
        New-BusGroup -GroupId 'grp15b' -Members @('b') -ExpectedResponseType 'done'

        Reset-BusGroupState

        Get-BusGroupStatus -GroupId 'grp15a' | Should -BeNullOrEmpty
        Get-BusGroupStatus -GroupId 'grp15b' | Should -BeNullOrEmpty
    }
}

# ─── Complete flow ─────────────────────────────────────────────────────────────

Describe 'Complete flow' {
    BeforeEach {
        $script:TestDir = Join-Path $env:TEMP "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory $script:TestDir | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'
        $script:Conn = New-SQLiteConnection -DataSource $script:DbPath
        $sql = Get-Content (Join-Path $script:BusRoot 'schema' 'event-log.sql') -Raw
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $sql
        Initialize-EvtIdAllocator -StartValue 1
        Reset-RouterState
        Reset-BusGroupState
    }
    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    It 'T16: after Wait-BusGroup completes, Get-BusGroupStatus shows Complete=true' {
        New-BusGroup -GroupId 'grp16' -Members @('w1','w2') -ExpectedResponseType 'ok'

        foreach ($i in 1..2) {
            $cmd = $script:Conn.CreateCommand()
            $cmd.CommandText = "INSERT INTO event_log (`"from`",`"to`",in_reply_to,group_id,type,payload,status) VALUES ('w$i','orch',NULL,'grp16','ok',NULL,'routed')"
            $cmd.ExecuteNonQuery() | Out-Null
            $cmd.Dispose()
        }

        Wait-BusGroup -Connection $script:Conn -GroupId 'grp16' -TimeoutMs 5000 -PollIntervalMs 0 | Out-Null

        $status = Get-BusGroupStatus -GroupId 'grp16'
        $status.Complete | Should -Be $true
    }
}
