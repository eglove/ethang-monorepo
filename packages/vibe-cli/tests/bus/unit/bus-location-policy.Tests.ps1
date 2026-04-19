BeforeAll {
    . (Join-Path $PSScriptRoot '../../../bus/schema/open-bus-database.ps1')
    . (Join-Path $PSScriptRoot '../../../bus/domain/bus-location-policy.ps1')
}

Describe 'BusLocationPolicy' {
    BeforeEach {
        $script:_SavedEnvVar = $env:VIBE_BUS_DB_PATH
        $env:VIBE_BUS_DB_PATH = $null
    }

    AfterEach {
        $env:VIBE_BUS_DB_PATH = $script:_SavedEnvVar
    }

    It 'T1: New-BusLocationPolicy returns hashtable with DbPath key' {
        $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-bus-test-$(New-Guid)"
        $policy = New-BusLocationPolicy -WorkspaceRoot $tempDir
        $policy | Should -Not -BeNullOrEmpty
        $policy | Should -BeOfType [hashtable]
        $policy.ContainsKey('DbPath') | Should -BeTrue
    }

    It 'T2: New-BusLocationPolicy -DbPath uses the provided path' {
        $dbPath = Join-Path ([System.IO.Path]::GetTempPath()) 'test/bus.db'
        $policy = New-BusLocationPolicy -DbPath $dbPath
        $policy.DbPath | Should -BeExactly $dbPath
    }

    It 'T3: New-BusLocationPolicy with VIBE_BUS_DB_PATH set uses env var' {
        $envPath = Join-Path ([System.IO.Path]::GetTempPath()) 'env/bus.db'
        $env:VIBE_BUS_DB_PATH = $envPath
        $policy = New-BusLocationPolicy
        $policy.DbPath | Should -BeExactly $envPath
    }

    It 'T4: VIBE_BUS_DB_PATH overrides -DbPath when env var is set' {
        $envPath = Join-Path ([System.IO.Path]::GetTempPath()) 'env/bus.db'
        $dbPath  = Join-Path ([System.IO.Path]::GetTempPath()) 'test/bus.db'
        $env:VIBE_BUS_DB_PATH = $envPath
        $policy = New-BusLocationPolicy -DbPath $dbPath
        $policy.DbPath | Should -BeExactly $envPath
    }

    It 'T5: New-BusLocationPolicy without DbPath or env var defaults to .vibe/vibe-bus.db relative to current location' {
        $currentLocation = (Get-Location).Path
        $expectedPath = Join-Path $currentLocation '.vibe/vibe-bus.db'
        $policy = New-BusLocationPolicy
        $policy.DbPath | Should -BeExactly $expectedPath
    }

    It 'T6: New-BusLocationPolicy -WorkspaceRoot uses workspace path' {
        $workspace = Join-Path ([System.IO.Path]::GetTempPath()) 'project'
        $policy = New-BusLocationPolicy -WorkspaceRoot $workspace
        $policy.DbPath | Should -BeExactly (Join-Path $workspace '.vibe/vibe-bus.db')
    }

    It 'T7: Get-BusDatabasePath returns the resolved path from policy' {
        $dbPath = Join-Path ([System.IO.Path]::GetTempPath()) 'test/bus.db'
        $policy = New-BusLocationPolicy -DbPath $dbPath
        $result = Get-BusDatabasePath -Policy $policy
        $result | Should -BeExactly $dbPath
    }

    It 'T8: Assert-BusLocationPolicyValid returns $true for a valid policy with non-empty DbPath' {
        $dbPath = Join-Path ([System.IO.Path]::GetTempPath()) 'test/bus.db'
        $policy = New-BusLocationPolicy -DbPath $dbPath
        $result = Assert-BusLocationPolicyValid -Policy $policy
        $result | Should -BeTrue
    }

    It 'T9: Assert-BusLocationPolicyValid throws for a policy with empty DbPath' {
        $policy = @{ DbPath = ''; WorkspaceRoot = $null }
        { Assert-BusLocationPolicyValid -Policy $policy } | Should -Throw
    }

    It 'T10: Open-BusDatabaseFromPolicy succeeds when _InsideTransaction is $false' {
        $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-bus-test-$(New-Guid)"
        $null = New-Item -ItemType Directory -Path $tempDir -Force
        $dbPath = Join-Path $tempDir 'bus.db'
        $policy = New-BusLocationPolicy -DbPath $dbPath

        # Ensure transaction flag is false
        $script:_InsideTransaction = $false

        # Should not throw — the policy is valid and no transaction is in progress
        { Open-BusDatabaseFromPolicy -Policy $policy } | Should -Not -Throw

        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'T11: Open-BusDatabaseFromPolicy throws when _InsideTransaction is $true (transaction-inside-git prevention)' {
        $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-bus-test-$(New-Guid)"
        $null = New-Item -ItemType Directory -Path $tempDir -Force
        $dbPath = Join-Path $tempDir 'vibe-bus.db'
        $policy = New-BusLocationPolicy -DbPath $dbPath

        # Set transaction flag to true to simulate active transaction
        $script:_InsideTransaction = $true

        { Open-BusDatabaseFromPolicy -Policy $policy } | Should -Throw '*transaction boundary*'

        # Reset flag
        $script:_InsideTransaction = $false
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'T12: After clearing VIBE_BUS_DB_PATH, New-BusLocationPolicy -WorkspaceRoot uses workspace path' {
        $oldPath = Join-Path ([System.IO.Path]::GetTempPath()) 'old/path.db'
        $workspace = Join-Path ([System.IO.Path]::GetTempPath()) 'project'
        $env:VIBE_BUS_DB_PATH = $oldPath
        $env:VIBE_BUS_DB_PATH = $null
        $policy = New-BusLocationPolicy -WorkspaceRoot $workspace
        $policy.DbPath | Should -BeExactly (Join-Path $workspace '.vibe/vibe-bus.db')
    }

    It 'T13: New-BusLocationPolicy creates the .vibe directory if it does not exist (via Open-BusDatabaseFromPolicy)' {
        $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-bus-test-$(New-Guid)"
        $policy = New-BusLocationPolicy -WorkspaceRoot $tempDir

        $script:_InsideTransaction = $false

        $createdDir = $null
        function script:Open-BusDatabase {
            param([Parameter(Mandatory)][string]$Path, [scriptblock]$GetUtcNow = $null)
            $parentDir = Split-Path $Path -Parent
            if (-not (Test-Path $parentDir)) {
                $null = New-Item -ItemType Directory -Path $parentDir -Force
            }
            $script:createdDir = $parentDir
            return [PSCustomObject]@{ DataSource = $Path; State = 'Open' }
        }

        Open-BusDatabaseFromPolicy -Policy $policy

        $expectedVibeDir = Join-Path $tempDir '.vibe'
        Test-Path $expectedVibeDir | Should -BeTrue

        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
