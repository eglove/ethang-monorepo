BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Open-StateDatabase' {
    AfterEach {
        $dbPath = & (Get-Module state-repository) { $script:StateDbPath }
        & (Get-Module state-repository) { $script:StateDbPath = $null }
        if ($dbPath -and (Test-Path $dbPath)) {
            Remove-Item $dbPath -Force
        }
    }

    It 'creates database file and all 12 tables' {
        $tempDb = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-open-test-$(New-Guid).db"
        $result = Open-StateDatabase -Path $tempDb
        $result | Should -BeExactly $tempDb
        Test-Path $tempDb | Should -BeTrue

        $tables = Invoke-SqliteQuery -DataSource $tempDb -Query "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        $tables.Count | Should -Be 12
    }

    It 'sets module-scoped StateDbPath' {
        $tempDb = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-open-test-$(New-Guid).db"
        Open-StateDatabase -Path $tempDb
        $dbPath = & (Get-Module state-repository) { $script:StateDbPath }
        $dbPath | Should -BeExactly $tempDb
    }

    It 'subsequent run is a no-op on existing database' {
        $tempDb = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-open-test-$(New-Guid).db"
        Open-StateDatabase -Path $tempDb

        # Insert test data
        Invoke-SqliteQuery -DataSource $tempDb -Query "INSERT INTO features (name, created_at, status) VALUES ('test-feature', datetime('now'), 'idle')"

        # Re-open
        & (Get-Module state-repository) { $script:StateDbPath = $null }
        Open-StateDatabase -Path $tempDb

        # Verify data preserved
        $feature = Invoke-SqliteQuery -DataSource $tempDb -Query "SELECT * FROM features WHERE name = 'test-feature'"
        $feature | Should -Not -BeNullOrEmpty
        $feature.name | Should -BeExactly 'test-feature'
    }

    It 'handles deleted database (re-initialization)' {
        $tempDb = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-open-test-$(New-Guid).db"
        Open-StateDatabase -Path $tempDb
        & (Get-Module state-repository) { $script:StateDbPath = $null }
        Remove-Item $tempDb -Force

        $result = Open-StateDatabase -Path $tempDb
        $result | Should -BeExactly $tempDb
        $tables = Invoke-SqliteQuery -DataSource $tempDb -Query "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        $tables.Count | Should -Be 12
    }
}

Describe 'Close-StateDatabase' {
    AfterEach {
        $dbPath = & (Get-Module state-repository) { $script:StateDbPath }
        & (Get-Module state-repository) { $script:StateDbPath = $null }
        if ($dbPath -and (Test-Path $dbPath)) {
            Remove-Item $dbPath -Force
        }
    }

    It 'tears down the connection' {
        $tempDb = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-close-test-$(New-Guid).db"
        Open-StateDatabase -Path $tempDb
        Close-StateDatabase

        $dbPath = & (Get-Module state-repository) { $script:StateDbPath }
        $dbPath | Should -BeNullOrEmpty
    }

    It 'subsequent repository calls fail after close' {
        $tempDb = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-close-test-$(New-Guid).db"
        Open-StateDatabase -Path $tempDb
        Close-StateDatabase

        { & (Get-Module state-repository) { Assert-StateDatabaseOpen } } | Should -Throw '*not open*'
    }

    It 'rejected while lock is held' {
        $tempDb = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-close-test-$(New-Guid).db"
        Open-StateDatabase -Path $tempDb

        # Insert a lock row
        Invoke-SqliteQuery -DataSource $tempDb -Query "INSERT INTO pipeline_lock (feature_name, pid, start_time, crash_count, locked_at) VALUES ('auth-flow', 12345, datetime('now'), 0, datetime('now'))"

        { Close-StateDatabase } | Should -Throw '*lock*'
    }

    It 'rejected while active feature is set' {
        $tempDb = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-close-test-$(New-Guid).db"
        Open-StateDatabase -Path $tempDb

        # Insert a session row with active feature
        Invoke-SqliteQuery -DataSource $tempDb -Query "INSERT INTO features (name, created_at, status) VALUES ('auth-flow', datetime('now'), 'idle')"
        Invoke-SqliteQuery -DataSource $tempDb -Query "INSERT OR REPLACE INTO session (id, active_feature, started_at) VALUES (1, 'auth-flow', datetime('now'))"

        { Close-StateDatabase } | Should -Throw '*active feature*'
    }

    It 'on already-closed database produces error' {
        $tempDb = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-close-test-$(New-Guid).db"
        Open-StateDatabase -Path $tempDb
        Close-StateDatabase

        { Close-StateDatabase } | Should -Throw '*not open*'
    }

    It 'repository call before Open-StateDatabase fails' {
        & (Get-Module state-repository) { $script:StateDbPath = $null }
        { & (Get-Module state-repository) { Assert-StateDatabaseOpen } } | Should -Throw '*not open*'
    }
}
