BeforeAll {
    Import-Module PSSQLite -ErrorAction Stop
    $script:SchemaPath = Resolve-Path "$PSScriptRoot/../../../bus/schema/event-log.sql"
}

Describe 'event_log schema' {
    BeforeEach {
        $script:db = New-SQLiteConnection -DataSource ':memory:'
        $schema = Get-Content $script:SchemaPath -Raw
        Invoke-SqliteQuery -SQLiteConnection $script:db -Query $schema
    }

    AfterEach {
        if ($script:db) {
            $script:db.Close()
            $script:db.Dispose()
            $script:db = $null
        }
    }

    It 'event_log table has exactly 8 columns with correct names' {
        $cols = Invoke-SqliteQuery -SQLiteConnection $script:db -Query "PRAGMA table_info(event_log)" |
            Select-Object -ExpandProperty name
        $cols.Count | Should -Be 8
        $cols | Should -Contain 'evt_id'
        $cols | Should -Contain 'from'
        $cols | Should -Contain 'to'
        $cols | Should -Contain 'in_reply_to'
        $cols | Should -Contain 'group_id'
        $cols | Should -Contain 'type'
        $cols | Should -Contain 'payload'
        $cols | Should -Contain 'status'
    }

    It 'BEFORE UPDATE trigger rejects committed -> routed transition' {
        Invoke-SqliteQuery -SQLiteConnection $script:db -Query @"
            INSERT INTO event_log ([from], [to], type, status)
            VALUES ('agent-a', 'agent-b', 'task', 'committed')
"@
        {
            Invoke-SqliteQuery -SQLiteConnection $script:db -ErrorAction Stop -Query @"
                UPDATE event_log SET status = 'routed' WHERE evt_id = 1
"@
        } | Should -Throw
    }

    It 'BEFORE UPDATE trigger allows routed -> committed transition' {
        Invoke-SqliteQuery -SQLiteConnection $script:db -Query @"
            INSERT INTO event_log ([from], [to], type, status)
            VALUES ('agent-a', 'agent-b', 'task', 'routed')
"@
        {
            Invoke-SqliteQuery -SQLiteConnection $script:db -Query @"
                UPDATE event_log SET status = 'committed' WHERE evt_id = 1
"@
        } | Should -Not -Throw
    }

    It 'BEFORE UPDATE trigger allows routed -> delivery_failed transition' {
        Invoke-SqliteQuery -SQLiteConnection $script:db -Query @"
            INSERT INTO event_log ([from], [to], type, status)
            VALUES ('agent-a', 'agent-b', 'task', 'routed')
"@
        {
            Invoke-SqliteQuery -SQLiteConnection $script:db -Query @"
                UPDATE event_log SET status = 'delivery_failed' WHERE evt_id = 1
"@
        } | Should -Not -Throw
    }

    It 'BEFORE DELETE trigger always raises error when DELETE attempted' {
        Invoke-SqliteQuery -SQLiteConnection $script:db -Query @"
            INSERT INTO event_log ([from], [to], type, status)
            VALUES ('agent-a', 'agent-b', 'task', 'routed')
"@
        {
            Invoke-SqliteQuery -SQLiteConnection $script:db -ErrorAction Stop -Query @"
                DELETE FROM event_log WHERE evt_id = 1
"@
        } | Should -Throw
    }

    It 'all four indices exist in sqlite_master' {
        $indices = Invoke-SqliteQuery -SQLiteConnection $script:db -Query @"
            SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='event_log'
"@ | Select-Object -ExpandProperty name
        $indices | Should -Contain 'idx_event_log_to_evtid'
        $indices | Should -Contain 'idx_event_log_type_evtid'
        $indices | Should -Contain 'idx_event_log_from_evtid'
        $indices | Should -Contain 'idx_event_log_status'
    }

    It 'EXPLAIN QUERY PLAN uses idx_event_log_to_evtid for to + evt_id query' {
        $plan = Invoke-SqliteQuery -SQLiteConnection $script:db -Query @"
            EXPLAIN QUERY PLAN SELECT * FROM event_log WHERE [to]='agent-b' AND evt_id >= 0
"@
        $detail = ($plan | Select-Object -ExpandProperty detail) -join ' '
        $detail | Should -Match 'idx_event_log_to_evtid'
    }

    It 'EXPLAIN QUERY PLAN uses idx_event_log_type_evtid for type + evt_id query' {
        $plan = Invoke-SqliteQuery -SQLiteConnection $script:db -Query @"
            EXPLAIN QUERY PLAN SELECT * FROM event_log WHERE type='task' AND evt_id >= 0
"@
        $detail = ($plan | Select-Object -ExpandProperty detail) -join ' '
        $detail | Should -Match 'idx_event_log_type_evtid'
    }

    It 'event_log_archive table exists with same columns as event_log' {
        $archiveCols = Invoke-SqliteQuery -SQLiteConnection $script:db -Query "PRAGMA table_info(event_log_archive)" |
            Select-Object -ExpandProperty name | Sort-Object
        $eventCols = Invoke-SqliteQuery -SQLiteConnection $script:db -Query "PRAGMA table_info(event_log)" |
            Select-Object -ExpandProperty name | Sort-Object
        $archiveCols | Should -Be $eventCols
    }

    It 'default status value is routed when INSERT omits status' {
        Invoke-SqliteQuery -SQLiteConnection $script:db -Query @"
            INSERT INTO event_log ([from], [to], type) VALUES ('agent-a', 'agent-b', 'task')
"@
        $row = Invoke-SqliteQuery -SQLiteConnection $script:db -Query "SELECT status FROM event_log WHERE evt_id = 1"
        $row.status | Should -Be 'routed'
    }
}
