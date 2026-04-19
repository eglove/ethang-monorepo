#Requires -Module Pester
#Requires -Module PSSQLite

Describe 'Bus Schema Migration' {
    BeforeAll {
        $pkg = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
        $schemaDir = Join-Path $pkg 'bus/schema'
        $migrationScript  = Join-Path $schemaDir 'migration.ps1'
        $hashScript       = Join-Path $schemaDir 'generate-schema-hash.ps1'

        . $migrationScript
        . $hashScript
    }

    BeforeEach {
        $guid   = [System.Guid]::NewGuid().ToString()
        $tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-migration-test-$guid"
        New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
        $script:DbPath = Join-Path $tmpDir 'vibe-bus.db'
    }

    AfterEach {
        try { Remove-Item (Split-Path $script:DbPath -Parent) -Recurse -Force -ErrorAction SilentlyContinue } catch {}
    }

    Context 'Forward migration' {
        It 'creates event_log, agent_sessions, settings, bus_lifecycle_state, consensus_state, rollback_state tables' {
            $result = Invoke-BusMigration -DbPath $script:DbPath -Force

            $tables = Invoke-SqliteQuery -DataSource $script:DbPath `
                -Query "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name" |
                Select-Object -ExpandProperty name

            $tables | Should -Contain 'event_log'
            $tables | Should -Contain 'agent_sessions'
            $tables | Should -Contain 'settings'
            $tables | Should -Contain 'bus_lifecycle_state'
            $tables | Should -Contain 'consensus_state'
            $tables | Should -Contain 'rollback_state'
        }

        It 'is idempotent — running twice produces no error and same schema' {
            Invoke-BusMigration -DbPath $script:DbPath -Force | Out-Null
            $hash1 = (Invoke-SqliteQuery -DataSource $script:DbPath `
                -Query "SELECT value FROM settings WHERE key='schema_hash'").value

            { Invoke-BusMigration -DbPath $script:DbPath -Force } | Should -Not -Throw

            $hash2 = (Invoke-SqliteQuery -DataSource $script:DbPath `
                -Query "SELECT value FROM settings WHERE key='schema_hash'").value

            $hash1 | Should -Be $hash2
        }

        It 'writes schema_version=1 to settings' {
            Invoke-BusMigration -DbPath $script:DbPath -Force | Out-Null

            $row = Invoke-SqliteQuery -DataSource $script:DbPath `
                -Query "SELECT value FROM settings WHERE key='schema_version'"
            $row.value | Should -Be '1'
        }

        It 'computes and stores schema_hash in settings' {
            Invoke-BusMigration -DbPath $script:DbPath -Force | Out-Null

            $row = Invoke-SqliteQuery -DataSource $script:DbPath `
                -Query "SELECT value FROM settings WHERE key='schema_hash'"
            $row | Should -Not -BeNullOrEmpty
            $row.value | Should -Not -BeNullOrEmpty
        }

        It 'schema hash is non-empty after migration' {
            Invoke-BusMigration -DbPath $script:DbPath -Force | Out-Null

            $hash = (Invoke-SqliteQuery -DataSource $script:DbPath `
                -Query "SELECT value FROM settings WHERE key='schema_hash'").value
            $hash.Length | Should -BeGreaterThan 0
        }
    }

    Context 'Schema hash generation' {
        It 'Invoke-GenerateSchemaHash returns consistent hash for same schema' {
            Invoke-BusMigration -DbPath $script:DbPath -Force | Out-Null

            $hash1 = Invoke-GenerateSchemaHash -DbPath $script:DbPath
            $hash2 = Invoke-GenerateSchemaHash -DbPath $script:DbPath

            $hash1 | Should -Be $hash2
            $hash1 | Should -Not -BeNullOrEmpty
        }
    }

    Context 'Aggregate table ownership manifest' {
        It 'aggregate-table-ownership.psd1 has entries for all 6 tables' {
            $pkg = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
            $ownershipFile = Join-Path $pkg 'bus/schema/aggregate-table-ownership.psd1'
            $ownershipFile | Should -Exist

            $ownership = Import-PowerShellDataFile $ownershipFile
            $ownership.Keys | Should -Contain 'bus_lifecycle_state'
            $ownership.Keys | Should -Contain 'consensus_state'
            $ownership.Keys | Should -Contain 'rollback_state'
            $ownership.Keys | Should -Contain 'event_log'
            $ownership.Keys | Should -Contain 'agent_sessions'
            $ownership.Keys | Should -Contain 'settings'
        }
    }

    Context 'Migration down — multi-stage rollback refusal' {
        It 'Invoke-BusMigrationDown refuses multi-stage rollback with [ERROR] message' {
            # Setup: seed settings with version 3
            Invoke-BusMigration -DbPath $script:DbPath -Force | Out-Null
            Invoke-SqliteQuery -DataSource $script:DbPath `
                -Query "UPDATE settings SET value='3' WHERE key='schema_version'" | Out-Null

            $errorMessage = ''
            try {
                Invoke-BusMigrationDown -DbPath $script:DbPath -TargetVersion 1 -Force 2>&1
            } catch {
                $errorMessage = $_.ToString()
            }

            $errorMessage | Should -Match '\[ERROR\].*[Mm]ulti.stage.*schema rollback'
        }

        It 'Invoke-BusMigrationDown exits non-zero on multi-stage rollback' {
            Invoke-BusMigration -DbPath $script:DbPath -Force | Out-Null
            Invoke-SqliteQuery -DataSource $script:DbPath `
                -Query "UPDATE settings SET value='3' WHERE key='schema_version'" | Out-Null

            $threw = $false
            try {
                Invoke-BusMigrationDown -DbPath $script:DbPath -TargetVersion 1 -Force
            } catch {
                $threw = $true
            }

            $threw | Should -Be $true
        }
    }

    Context 'Artifact files' {
        It 'migration-playbook.md exists and contains required sections' {
            $pkg = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
            $playbookFile = Join-Path $pkg 'docs/bidirectional-comms/migration-playbook.md'
            $playbookFile | Should -Exist

            $content = Get-Content $playbookFile -Raw
            $content | Should -Match 'Forward Migration'
            $content | Should -Match 'Rollback'
            $content | Should -Match 'Backup'
            $content | Should -Match 'Canary Ladder'
        }

        It 'feature-flag-sunset-manifest.psd1 has entries for all 6 stage flags' {
            $pkg = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
            $manifestFile = Join-Path $pkg 'bus/infra/feature-flag-sunset-manifest.psd1'
            $manifestFile | Should -Exist

            $manifest = Import-PowerShellDataFile $manifestFile
            $manifest.Flags.Keys | Should -Contain 'VIBE_STAGE_2_BIDIR'
            $manifest.Flags.Keys | Should -Contain 'VIBE_STAGE_3_BIDIR'
            $manifest.Flags.Keys | Should -Contain 'VIBE_STAGE_4_BIDIR'
            $manifest.Flags.Keys | Should -Contain 'VIBE_STAGE_5_BIDIR'
            $manifest.Flags.Keys | Should -Contain 'VIBE_STAGE_6_BIDIR'
            $manifest.Flags.Keys | Should -Contain 'VIBE_STAGE_7_BIDIR'
        }

        It 'schema-hash-history.json is valid JSON with schemaHashAlgorithm field' {
            $pkg = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
            $historyFile = Join-Path $pkg 'bus/schema/schema-hash-history.json'
            $historyFile | Should -Exist

            $json = Get-Content $historyFile -Raw | ConvertFrom-Json
            $json.schemaHashAlgorithm | Should -Be 'sha256-canonical-v1'
        }
    }
}
