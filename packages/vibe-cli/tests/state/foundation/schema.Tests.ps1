BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'SQL Schema' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
    }

    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) {
            Remove-Item $script:testDb -Force
        }
    }

    It 'creates exactly 12 tables' {
        $tables = Invoke-SqliteQuery -DataSource $script:testDb -Query "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        $tables.Count | Should -Be 12
    }

    It 'creates all expected table names' {
        $tables = Invoke-SqliteQuery -DataSource $script:testDb -Query "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'" |
            Select-Object -ExpandProperty name | Sort-Object
        $expected = @(
            'artifacts', 'debate_state', 'features', 'gate_results',
            'merge_results', 'pipeline_lock', 'pipeline_state',
            'session', 'stage_outputs', 'stage_progress',
            'task_results', 'tier_progress'
        )
        $tables | Should -Be $expected
    }

    It 'session table has correct columns' {
        $cols = Invoke-SqliteQuery -DataSource $script:testDb -Query "PRAGMA table_info(session)" |
            Select-Object -ExpandProperty name
        $cols | Should -Contain 'id'
        $cols | Should -Contain 'active_feature'
        $cols | Should -Contain 'started_at'
    }

    It 'features table has correct columns' {
        $cols = Invoke-SqliteQuery -DataSource $script:testDb -Query "PRAGMA table_info(features)" |
            Select-Object -ExpandProperty name
        $cols | Should -Contain 'name'
        $cols | Should -Contain 'created_at'
        $cols | Should -Contain 'status'
    }

    It 'pipeline_state table has all 9 columns' {
        $cols = Invoke-SqliteQuery -DataSource $script:testDb -Query "PRAGMA table_info(pipeline_state)" |
            Select-Object -ExpandProperty name
        $cols | Should -Contain 'feature_name'
        $cols | Should -Contain 'pipeline_state'
        $cols | Should -Contain 'lock_holder'
        $cols | Should -Contain 'review_round'
        $cols | Should -Contain 'keep_going_resets'
        $cols | Should -Contain 'tdd_keep_going_count'
        $cols | Should -Contain 'verdict'
        $cols | Should -Contain 'tasks_done'
        $cols | Should -Contain 'review_gate_type'
    }

    It 'debate_state table has correct columns' {
        $cols = Invoke-SqliteQuery -DataSource $script:testDb -Query "PRAGMA table_info(debate_state)" |
            Select-Object -ExpandProperty name
        $cols | Should -Contain 'feature_name'
        $cols | Should -Contain 'stage'
        $cols | Should -Contain 'round'
        $cols | Should -Contain 'consensus_status'
        $cols | Should -Contain 'moderator_json'
    }

    It 'task_results table has correct columns' {
        $cols = Invoke-SqliteQuery -DataSource $script:testDb -Query "PRAGMA table_info(task_results)" |
            Select-Object -ExpandProperty name
        $cols | Should -Contain 'task_id'
        $cols | Should -Contain 'tier'
        $cols | Should -Contain 'phase'
        $cols | Should -Contain 'status'
        $cols | Should -Contain 'counters_json'
        $cols | Should -Contain 'escalated'
        $cols | Should -Contain 'test_files_json'
    }

    It 'schema is idempotent - running twice does not error' {
        $schemaPath = Join-Path $PSScriptRoot '../../../state/schema.sql'
        $schema = Get-Content $schemaPath -Raw
        { Invoke-SqliteQuery -DataSource $script:testDb -Query $schema } | Should -Not -Throw
    }
}
