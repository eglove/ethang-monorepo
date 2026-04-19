#Requires -Module PSSQLite

# Source companion scripts
$_schemaDir = $PSScriptRoot
. (Join-Path $_schemaDir 'generate-schema-hash.ps1')
. (Join-Path $_schemaDir 'migration-down.ps1')

function Invoke-BusMigration {
    <#
    .SYNOPSIS
        Applies (or re-applies) the full bus schema to a SQLite database.

    .DESCRIPTION
        Steps:
          1. Open / create the SQLite database at $DbPath.
          2. Detect whether old bus tables already exist.
          3. If old tables exist and -Force is not set: prompt for confirmation.
          4. Apply all schema SQL files in dependency order:
               event-log.sql, agent-sessions.sql, settings.sql,
               bus-lifecycle-state.sql, consensus-state.sql, rollback-state.sql
          5. Call Invoke-GenerateSchemaHash to compute and store the schema hash.
          6. Compact the event_log if it already had rows.
          7. Emit [INFO] Migration complete. Schema version: 1

    .PARAMETER DbPath
        Absolute path to the SQLite database file (will be created if absent).

    .PARAMETER Force
        Skip the confirmation prompt when old tables are detected.

    .OUTPUTS
        [hashtable] @{ Success = $true; SchemaVersion = 1 }
    #>
    [CmdletBinding()]
    [OutputType([hashtable])]
    param(
        [Parameter(Mandatory)]
        [string]$DbPath,

        [switch]$Force
    )

    # Ensure parent directory exists
    $dbDir = Split-Path $DbPath -Parent
    if (-not (Test-Path $dbDir)) {
        New-Item -ItemType Directory -Path $dbDir -Force | Out-Null
    }

    # Detect existing bus tables
    $existingTables = @()
    if (Test-Path $DbPath) {
        try {
            $existingTables = Invoke-SqliteQuery -DataSource $DbPath `
                -Query "SELECT name FROM sqlite_master WHERE type='table'" |
                Select-Object -ExpandProperty name
        } catch { }
    }

    $busTables = @('event_log','agent_sessions','settings','bus_lifecycle_state','consensus_state','rollback_state')
    $oldTablesExist = ($existingTables | Where-Object { $busTables -contains $_ }).Count -gt 0

    # Confirm if old tables detected and -Force not set
    if ($oldTablesExist -and -not $Force) {
        $confirm = Read-Host "Bus schema tables already exist in '$DbPath'. Re-apply migration? (yes/no)"
        if ($confirm -notmatch '^yes$') {
            Write-Host "[INFO] Migration cancelled."
            return @{ Success = $false; SchemaVersion = $null }
        }
    }

    # SQL files in dependency order
    $sqlFiles = @(
        'event-log.sql',
        'agent-sessions.sql',
        'settings.sql',
        'bus-lifecycle-state.sql',
        'consensus-state.sql',
        'rollback-state.sql'
    )

    foreach ($sqlFile in $sqlFiles) {
        $sqlPath = Join-Path $_schemaDir $sqlFile
        if (-not (Test-Path $sqlPath)) {
            throw "Required SQL file not found: $sqlPath"
        }
        $sql = Get-Content -Path $sqlPath -Raw -Encoding UTF8

        # Pass the whole SQL file at once. Splitting on ';' (even with a newline
        # lookahead) breaks CREATE TRIGGER blocks because their BEGIN..END bodies
        # contain their own semicolons — each fragment becomes partial SQL that
        # SQLite reports as "incomplete input" / "no transaction is active".
        Invoke-SqliteQuery -DataSource $DbPath -Query $sql | Out-Null
    }

    # Compute and store schema hash
    Invoke-GenerateSchemaHash -DbPath $DbPath | Out-Null

    # Compact event_log if it had existing rows
    $eventCount = 0
    try {
        $eventCount = (Invoke-SqliteQuery -DataSource $DbPath `
            -Query "SELECT COUNT(*) AS n FROM event_log").n
    } catch { }

    if ($eventCount -gt 0) {
        $retainRow = Invoke-SqliteQuery -DataSource $DbPath `
            -Query "SELECT value FROM settings WHERE key='retain_events'"
        $retain = if ($retainRow) { [int]$retainRow.value } else { 10000 }
        if ($eventCount -gt $retain) {
            Invoke-SqliteQuery -DataSource $DbPath -Query @"
DELETE FROM event_log
WHERE id NOT IN (
    SELECT id FROM event_log
    ORDER BY id DESC
    LIMIT $retain
)
"@ | Out-Null
        }
    }

    Write-Host '[INFO] Migration complete. Schema version: 1'

    return @{ Success = $true; SchemaVersion = 1 }
}

# Invoke-BusMigrationDown is defined in migration-down.ps1 (dot-sourced above).
