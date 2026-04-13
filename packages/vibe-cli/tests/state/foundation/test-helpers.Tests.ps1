BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Reset-StateDatabase' {
    AfterEach {
        $dbPath = & (Get-Module state-repository) { $script:StateDbPath }
        if ($dbPath -and (Test-Path $dbPath)) {
            Remove-Item $dbPath -Force
        }
    }

    Context 'InMemory mode' {
        It 'returns a temp file path (not literal :memory:)' {
            $result = Reset-StateDatabase -InMemory
            $result | Should -Match 'vibe-state-mem-'
            Test-Path $result | Should -BeTrue
        }

        It 'sets module-scoped StateDbPath' {
            $result = Reset-StateDatabase -InMemory
            $dbPath = & (Get-Module state-repository) { $script:StateDbPath }
            $dbPath | Should -BeExactly $result
        }

        It 'creates all 12 tables' {
            $dbPath = Reset-StateDatabase -InMemory
            $tables = Invoke-SqliteQuery -DataSource $dbPath -Query "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            $tables.Count | Should -Be 12
        }
    }

    Context 'TempPath mode' {
        It 'creates database at specified path' {
            $tempFile = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-test-$(New-Guid).db"
            $result = Reset-StateDatabase -TempPath $tempFile
            $result | Should -BeExactly $tempFile
            Test-Path $tempFile | Should -BeTrue
        }
    }

    Context 'Auto-generated temp file' {
        It 'creates a temp file in the OS temp directory' {
            $result = Reset-StateDatabase
            $result | Should -Match 'vibe-state-test-'
            Test-Path $result | Should -BeTrue
        }
    }
}
