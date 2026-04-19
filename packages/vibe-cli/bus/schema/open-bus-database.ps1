# Minimal local logging stub (Write-PipelineLog may not exist in all contexts)
function Write-BusLog {
    param(
        [Parameter(Mandatory)][string]$Severity,
        [Parameter(Mandatory)][string]$Message
    )
    Write-Host "[$Severity] $Message"
}

# Canonical clock — can be overridden for testing
$script:GetUtcNow = { [DateTime]::UtcNow }

# WAL checkpoint circuit breaker state
$script:WalCheckpointConsecutiveFailures = 0
$script:WalCheckpointCircuitOpen = $false
$script:WalCheckpointCallCount = 0

# ---------------------------------------------------------------------------
# Internal helpers — thin wrappers so unit tests can mock them
# ---------------------------------------------------------------------------

function Open-SQLiteConnection {
    param([Parameter(Mandatory)][string]$DataSource)
    # Uses System.Data.SQLite if available, otherwise raises
    $connStr = "Data Source=$DataSource;Version=3;"
    $conn = [System.Data.SQLite.SQLiteConnection]::new($connStr)
    $conn.Open()
    return $conn
}

function Invoke-SQLiteQuery {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$Query
    )
    $cmd = $Connection.CreateCommand()
    $cmd.CommandText = $Query
    $reader = $cmd.ExecuteReader()
    $results = @()
    while ($reader.Read()) {
        $row = [ordered]@{}
        for ($i = 0; $i -lt $reader.FieldCount; $i++) {
            $row[$reader.GetName($i)] = $reader.GetValue($i)
        }
        $results += [PSCustomObject]$row
    }
    $reader.Close()
    $cmd.Dispose()
    if ($results.Count -eq 1) { return $results[0] }
    return $results
}

# ---------------------------------------------------------------------------
# Public: Open-BusDatabase
# ---------------------------------------------------------------------------

function Open-BusDatabase {
    param(
        [Parameter(Mandatory)][string]$Path,
        [scriptblock]$GetUtcNow = $null
    )

    # 1. Set the canonical clock override if provided
    if ($null -ne $GetUtcNow) {
        $script:GetUtcNow = $GetUtcNow
    }

    # 2. Validate path length (step 1 of the spec)
    $checkedPath = Invoke-LongPathCheck -Path $Path

    # 3. Normalize path via GetFullPath (expand 8.3 aliases)
    $normalizedPath = [System.IO.Path]::GetFullPath($checkedPath)

    # 4. Open SQLite connection
    $conn = Open-SQLiteConnection -DataSource $normalizedPath

    # 5. Assert WAL mode
    $walResult = Invoke-SQLiteQuery -Connection $conn -Query 'PRAGMA journal_mode=WAL'
    $walMode = if ($walResult -is [PSCustomObject]) { $walResult.journal_mode } else { $walResult }
    if ($walMode -ne 'wal') {
        Write-BusLog -Severity 'ALARM' -Message 'WAL mode assertion failed'
        throw '[ALARM] WAL mode assertion failed'
    }

    # 6. Disable auto-checkpointing
    Invoke-SQLiteQuery -Connection $conn -Query 'PRAGMA wal_autocheckpoint=0' | Out-Null

    # 7. Check WAL file size
    $walFilePath = "$normalizedPath-wal"
    if (Test-Path $walFilePath) {
        $walFile = Get-Item $walFilePath
        $walSizeMB = $walFile.Length / 1MB
        if ($walSizeMB -gt 50) {
            Write-BusLog -Severity 'ALARM' -Message "WAL file exceeds 50MB ($([math]::Round($walSizeMB, 1))MB). Running emergency checkpoint."
            Invoke-BusWalCheckpoint -Connection $conn
        }
        elseif ($walSizeMB -gt 10) {
            Write-BusLog -Severity 'WARN' -Message "WAL file exceeds 10MB ($([math]::Round($walSizeMB, 1))MB)"
        }
    }

    # 8. Validate schema hash
    $dbDir = [System.IO.Path]::GetDirectoryName($normalizedPath)
    $hashDir = if ($env:VIBE_BUS_DB_PATH) {
        [System.IO.Path]::GetDirectoryName([System.IO.Path]::GetFullPath($env:VIBE_BUS_DB_PATH))
    }
    else {
        $dbDir
    }
    $hashFile = Join-Path $hashDir 'schema.hash'
    if (Test-Path $hashFile) {
        $storedHash = (Get-Content $hashFile -Raw).Trim()
        $schemaHashFile = Join-Path $dbDir 'schema.hash'
        if (Test-Path $schemaHashFile) {
            $localHash = (Get-Content $schemaHashFile -Raw).Trim()
            if ($storedHash -ne $localHash) {
                Write-BusLog -Severity 'ALARM' -Message 'Schema hash mismatch'
                throw '[ALARM] Schema hash mismatch'
            }
        }
    }

    return $conn
}

# ---------------------------------------------------------------------------
# Public: Invoke-BusWalCheckpoint
# ---------------------------------------------------------------------------

function Invoke-BusWalCheckpoint {
    param(
        [Parameter(Mandatory)]$Connection
    )

    $script:WalCheckpointCallCount++

    # Circuit open: no-op except for half-open probe every 60th call
    if ($script:WalCheckpointCircuitOpen) {
        if (($script:WalCheckpointCallCount % 60) -ne 0) {
            return
        }
        # Half-open probe: try once
        try {
            Invoke-SQLiteQuery -Connection $Connection -Query 'PRAGMA wal_checkpoint(TRUNCATE)' | Out-Null
            $script:WalCheckpointCircuitOpen = $false
            $script:WalCheckpointConsecutiveFailures = 0
            Write-BusLog -Severity 'INFO' -Message 'WAL checkpoint circuit closed.'
        }
        catch {
            # Still failing — remain open
        }
        return
    }

    # Normal path: attempt checkpoint
    try {
        Invoke-SQLiteQuery -Connection $Connection -Query 'PRAGMA wal_checkpoint(TRUNCATE)' | Out-Null
        $script:WalCheckpointConsecutiveFailures = 0
    }
    catch {
        $errMsg = $_.Exception.Message
        if ($errMsg -match 'SQLITE_FULL') {
            $script:WalCheckpointConsecutiveFailures++

            if ($script:WalCheckpointConsecutiveFailures -eq 1) {
                # Attempt 2 is first retry — [WARN]
            }

            if ($script:WalCheckpointConsecutiveFailures -ge 3) {
                if (-not $script:WalCheckpointCircuitOpen) {
                    $script:WalCheckpointCircuitOpen = $true
                    Write-BusLog -Severity 'ALARM' -Message 'WAL checkpoint circuit open after 3 consecutive SQLITE_FULL failures. WAL file unbounded until disk space restored and process restarted.'
                }
            }
        }
        else {
            throw
        }
    }
}
