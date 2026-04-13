BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Session tracks the active feature' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    Context 'Set-ActiveFeature' {
        It 'sets active feature on empty session' {
            New-Feature -Name 'auth-flow'
            Set-ActiveFeature -Name 'auth-flow'
            Get-ActiveFeature | Should -BeExactly 'auth-flow'
        }

        It 'session row has a non-null started_at' {
            New-Feature -Name 'auth-flow'
            Set-ActiveFeature -Name 'auth-flow'
            $session = Invoke-SqliteQuery -DataSource $script:testDb -Query "SELECT started_at FROM session WHERE id = 1"
            $session.started_at | Should -Not -BeNullOrEmpty
        }

        It 'replaces previous value when previous feature is complete' {
            New-Feature -Name 'auth-flow'
            New-Feature -Name 'search-api'
            Set-ActiveFeature -Name 'auth-flow'
            Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE features SET status = 'complete' WHERE name = 'auth-flow'"
            Set-ActiveFeature -Name 'search-api'
            Get-ActiveFeature | Should -BeExactly 'search-api'
        }

        It 'rejected when another feature is running' {
            New-Feature -Name 'auth-flow'
            New-Feature -Name 'search-api'
            Set-ActiveFeature -Name 'auth-flow'
            Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE features SET status = 'running' WHERE name = 'auth-flow'"
            { Set-ActiveFeature -Name 'search-api' } | Should -Throw '*terminal*'
        }

        It 'allowed when previous feature is halted' {
            New-Feature -Name 'auth-flow'
            New-Feature -Name 'search-api'
            Set-ActiveFeature -Name 'auth-flow'
            Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE features SET status = 'halted' WHERE name = 'auth-flow'"
            Set-ActiveFeature -Name 'search-api'
            Get-ActiveFeature | Should -BeExactly 'search-api'
        }

        It 'rejected for feature that does not exist' {
            { Set-ActiveFeature -Name 'ghost-feature' } | Should -Throw '*does not exist*'
        }

        It 'same active idle feature is a no-op' {
            New-Feature -Name 'auth-flow'
            Set-ActiveFeature -Name 'auth-flow'
            { Set-ActiveFeature -Name 'auth-flow' } | Should -Not -Throw
            Get-ActiveFeature | Should -BeExactly 'auth-flow'
        }
    }

    Context 'Get-ActiveFeature' {
        It 'returns null when none is set' {
            Get-ActiveFeature | Should -BeNullOrEmpty
        }
    }

    Context 'Clear-ActiveFeature' {
        It 'clears on completed feature' {
            New-Feature -Name 'auth-flow'
            Set-ActiveFeature -Name 'auth-flow'
            Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE features SET status = 'complete' WHERE name = 'auth-flow'"
            Clear-ActiveFeature
            Get-ActiveFeature | Should -BeNullOrEmpty
        }

        It 'clears on halted feature' {
            New-Feature -Name 'auth-flow'
            Set-ActiveFeature -Name 'auth-flow'
            Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE features SET status = 'halted' WHERE name = 'auth-flow'"
            Clear-ActiveFeature
            Get-ActiveFeature | Should -BeNullOrEmpty
        }

        It 'rejected for idle feature' {
            New-Feature -Name 'auth-flow'
            Set-ActiveFeature -Name 'auth-flow'
            { Clear-ActiveFeature } | Should -Throw '*terminal*'
        }

        It 'rejected for running feature' {
            New-Feature -Name 'auth-flow'
            Set-ActiveFeature -Name 'auth-flow'
            Invoke-SqliteQuery -DataSource $script:testDb -Query "UPDATE features SET status = 'running' WHERE name = 'auth-flow'"
            { Clear-ActiveFeature } | Should -Throw '*terminal*'
        }
    }
}
