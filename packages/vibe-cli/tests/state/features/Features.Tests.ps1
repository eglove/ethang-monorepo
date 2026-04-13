BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Feature Registry' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    Context 'New-Feature' {
        It 'creates a new feature with status idle' {
            New-Feature -Name 'auth-flow'
            $f = Get-Feature -Name 'auth-flow'
            $f | Should -Not -BeNullOrEmpty
            $f.status | Should -BeExactly 'idle'
        }

        It 'sets created_at timestamp' {
            New-Feature -Name 'auth-flow'
            $f = Get-Feature -Name 'auth-flow'
            $f.created_at | Should -Not -BeNullOrEmpty
        }

        It 'duplicate name produces error' {
            New-Feature -Name 'auth-flow'
            { New-Feature -Name 'auth-flow' } | Should -Throw '*already exists*'
        }

        It 'empty string name produces error' {
            { New-Feature -Name '' } | Should -Throw '*empty*'
        }

        It 'whitespace name produces error' {
            { New-Feature -Name '   ' } | Should -Throw '*non-empty*'
        }
    }

    Context 'Get-Feature' {
        It 'returns null for nonexistent feature' {
            $f = Get-Feature -Name 'ghost-feature'
            $f | Should -BeNullOrEmpty
        }

        It 'returns feature row with all fields' {
            New-Feature -Name 'auth-flow'
            $f = Get-Feature -Name 'auth-flow'
            $f.name | Should -BeExactly 'auth-flow'
            $f.status | Should -BeExactly 'idle'
            $f.created_at | Should -Not -BeNullOrEmpty
        }
    }

    Context 'Get-AllFeature' {
        It 'returns empty when no features exist' {
            $all = Get-AllFeature
            $all | Should -BeNullOrEmpty
        }

        It 'returns all features' {
            New-Feature -Name 'auth-flow'
            New-Feature -Name 'search-api'
            New-Feature -Name 'notifications'
            $all = @(Get-AllFeature)
            $all.Count | Should -Be 3
        }

        It 'each row has required fields' {
            New-Feature -Name 'auth-flow'
            $all = @(Get-AllFeature)
            $all[0].name | Should -Not -BeNullOrEmpty
            $all[0].created_at | Should -Not -BeNullOrEmpty
            $all[0].status | Should -Not -BeNullOrEmpty
        }
    }
}
