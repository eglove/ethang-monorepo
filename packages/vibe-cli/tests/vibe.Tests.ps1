BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
}

Describe 'vibe.ps1 parameter validation' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}
        Mock Set-Content {}
    }

    It 'throws when no Seed provided for fresh run' {
        { & "$PSScriptRoot/../vibe.ps1" } |
            Should -Throw '*seed prompt is required*'
    }

    It 'throws when both Seed and -Resume are provided' {
        { & "$PSScriptRoot/../vibe.ps1" "test seed" -Resume } |
            Should -Throw '*Cannot specify both*'
    }
}

Describe 'vibe.ps1 bus initialization' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'loads bus infrastructure when VIBE_BUS_STAGE2=1 (then throws on missing seed)' {
        $env:VIBE_BUS_STAGE2 = '1'
        { & "$PSScriptRoot/../vibe.ps1" } |
            Should -Throw '*seed prompt is required*'
    }

    It 'loads bus infrastructure when VIBE_BUS_ALL_STAGES=1 (then throws on missing seed)' {
        $env:VIBE_BUS_ALL_STAGES = '1'
        { & "$PSScriptRoot/../vibe.ps1" } |
            Should -Throw '*seed prompt is required*'
    }
}

Describe 'vibe.ps1 schema subcommands' {
    BeforeEach {
        $script:TestDir = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-subcmd-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:TestDir | Out-Null
        $script:TestDb = Join-Path $script:TestDir 'vibe-bus.db'
    }
    AfterEach {
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    It 'schema-backup throws when database does not exist' {
        $missingDb = Join-Path $script:TestDir 'no-such-db.db'
        { & "$PSScriptRoot/../vibe.ps1" -Command 'schema-backup' -BusDbPath $missingDb -Force } |
            Should -Throw '*Database not found*'
    }

    It 'schema-backup copies the database to a timestamped backup directory' {
        # Create a minimal DB file (any bytes — backup just copies the file).
        Set-Content -Path $script:TestDb -Value 'fake-db-bytes' -NoNewline
        & "$PSScriptRoot/../vibe.ps1" -Command 'schema-backup' -BusDbPath $script:TestDb -Force | Out-Null
        $backupRoot = Join-Path $script:TestDir '.vibe/backups'
        Test-Path $backupRoot | Should -BeTrue
        $backups = Get-ChildItem $backupRoot
        $backups.Count | Should -BeGreaterOrEqual 1
        Test-Path (Join-Path $backups[0].FullName 'vibe-bus.db') | Should -BeTrue
    }

    It 'reset with -Force reports no database found when DB is absent' {
        $missingDb = Join-Path $script:TestDir 'no-such-db.db'
        # -Force bypasses interactive confirmation; with no DB, it prints "No database found"
        # and returns exit 0 rather than throwing.
        { & "$PSScriptRoot/../vibe.ps1" -Command 'reset' -BusDbPath $missingDb -Force } |
            Should -Not -Throw
    }

    It 'reset with -Force deletes an existing database' {
        Set-Content -Path $script:TestDb -Value 'fake-db-bytes' -NoNewline
        Test-Path $script:TestDb | Should -BeTrue
        & "$PSScriptRoot/../vibe.ps1" -Command 'reset' -BusDbPath $script:TestDb -Force | Out-Null
        Test-Path $script:TestDb | Should -BeFalse
    }
}

