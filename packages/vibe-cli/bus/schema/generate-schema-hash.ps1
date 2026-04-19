function Invoke-GenerateSchemaHash {
    <#
    .SYNOPSIS
        Computes a canonical SHA-256 hash of all CREATE TABLE and CREATE TRIGGER
        statements in the bus database, then persists it in the settings table.

    .DESCRIPTION
        Algorithm: sha256-canonical-v1
          - Reads all CREATE TABLE / CREATE TRIGGER rows from sqlite_master
          - Sorts alphabetically by the object name
          - Normalises: UTF-8 (no BOM), CRLF -> LF
          - Concatenates with newline separator
          - Computes SHA-256 using [System.Security.Cryptography.SHA256]
          - Stores result in settings.schema_hash

    .PARAMETER DbPath
        Absolute path to the SQLite database file.

    .OUTPUTS
        [string] — hex SHA-256 hash
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory)]
        [string]$DbPath
    )

    # Gather CREATE TABLE and CREATE TRIGGER statements, sorted by name
    $rows = Invoke-SqliteQuery -DataSource $DbPath -Query @'
SELECT name, sql
FROM   sqlite_master
WHERE  type IN ('table', 'trigger')
  AND  sql IS NOT NULL
ORDER BY name
'@

    # Build canonical text
    $parts = foreach ($row in $rows) {
        # Normalise: CRLF -> LF, trim trailing whitespace per line
        $normalised = $row.sql -replace "`r`n", "`n" -replace "`r", "`n"
        $normalised.TrimEnd()
    }
    $canonical = $parts -join "`n"

    # Compute SHA-256
    $bytes  = [System.Text.Encoding]::UTF8.GetBytes($canonical)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $hashBytes = $sha256.ComputeHash($bytes)
    }
    finally {
        $sha256.Dispose()
    }
    $hash = [System.BitConverter]::ToString($hashBytes) -replace '-', ''
    $hash = $hash.ToLowerInvariant()

    # Persist to settings table
    Invoke-SqliteQuery -DataSource $DbPath -Query @"
UPDATE settings SET value = '$hash' WHERE key = 'schema_hash'
"@ | Out-Null

    return $hash
}
