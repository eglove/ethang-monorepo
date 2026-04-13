function Reset-StateDatabase {
    [CmdletBinding()]
    param(
        [switch]$InMemory,
        [string]$TempPath
    )

    $schemaPath = Join-Path $PSScriptRoot '../schema.sql'
    $schema = Get-Content $schemaPath -Raw

    if ($InMemory) {
        # Use a temp file instead of :memory: because PSSQLite creates a new
        # connection per Invoke-SqliteQuery call, which loses in-memory state
        $dbPath = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-state-mem-$(New-Guid).db"
    }
    elseif ($TempPath) {
        $dbPath = $TempPath
    }
    else {
        $dbPath = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-state-test-$(New-Guid).db"
    }

    Invoke-SqliteQuery -DataSource $dbPath -Query $schema

    $script:StateDbPath = $dbPath

    return $dbPath
}
