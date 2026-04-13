function Open-StateDatabase {
    [CmdletBinding()]
    param(
        [string]$Path
    )

    # Check PSSQLite is available
    if (-not (Get-Module -ListAvailable -Name PSSQLite)) {
        throw "PSSQLite module required. Run: Install-Module PSSQLite"
    }

    if (-not $Path) {
        $Path = Join-Path $PSScriptRoot '../../vibe-state.db'
    }

    $schemaPath = Join-Path $PSScriptRoot '../schema.sql'
    $schema = Get-Content $schemaPath -Raw

    # Validate database integrity if it exists
    if (Test-Path $Path) {
        try {
            Invoke-SqliteQuery -DataSource $Path -Query "SELECT count(*) FROM sqlite_master" | Out-Null
        }
        catch {
            throw "Database appears corrupt. Delete '$Path' and restart. Error: $_"
        }
    }

    # Run schema (CREATE TABLE IF NOT EXISTS is idempotent)
    try {
        Invoke-SqliteQuery -DataSource $Path -Query $schema
    }
    catch {
        throw "Failed to initialize database at '$Path'. $_"
    }

    $script:StateDbPath = $Path

    return $Path
}
