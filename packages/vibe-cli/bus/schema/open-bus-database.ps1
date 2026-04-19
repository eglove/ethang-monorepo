Import-Module PSSQLite -ErrorAction SilentlyContinue

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
# Public: Open-BusDatabase
# ---------------------------------------------------------------------------

function Open-BusDatabase {
    param(
        [Parameter(Mandatory)][string]$Path,
        [scriptblock]$GetUtcNow = $null
    )

    Import-Module PSSQLite -ErrorAction SilentlyContinue

    if ($null -ne $GetUtcNow) {
        $script:GetUtcNow = $GetUtcNow
    }

    $checkedPath = Invoke-LongPathCheck -Path $Path
    $normalizedPath = [System.IO.Path]::GetFullPath($checkedPath)

    $parentDir = Split-Path $normalizedPath -Parent
    if ($parentDir -and -not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }

    $conn = New-SQLiteConnection -DataSource $normalizedPath

    $walResult = Invoke-SqliteQuery -SQLiteConnection $conn -Query 'PRAGMA journal_mode=WAL'
    $walMode = if ($walResult -is [PSCustomObject]) { $walResult.journal_mode } else { $walResult }
    if ($walMode -ne 'wal') {
        Write-BusLog -Severity 'ALARM' -Message 'WAL mode assertion failed'
        throw '[ALARM] WAL mode assertion failed'
    }

    Invoke-SqliteQuery -SQLiteConnection $conn -Query 'PRAGMA wal_autocheckpoint=0' | Out-Null

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

    # Make the path discoverable to PSSQLite-based helpers (Send-BusEvent -DbPath etc.)
    $script:_BusDbPath = $normalizedPath

    return $conn
}

# ---------------------------------------------------------------------------
# Public: Close-BusDatabase
# Clears the module-level DB path used by PSSQLite-based helpers. The ADO.NET
# $conn returned by Open-BusDatabase is owned by the caller and disposed there.
# ---------------------------------------------------------------------------

function Close-BusDatabase {
    $script:_BusDbPath = $null
}

# ---------------------------------------------------------------------------
# Public: Invoke-BusWalCheckpoint
# ---------------------------------------------------------------------------

function Invoke-BusWalCheckpoint {
    param(
        [Parameter(Mandatory)]$Connection
    )

    $script:WalCheckpointCallCount++

    if ($script:WalCheckpointCircuitOpen) {
        if (($script:WalCheckpointCallCount % 60) -ne 0) {
            return
        }
        try {
            Invoke-SqliteQuery -SQLiteConnection $Connection -Query 'PRAGMA wal_checkpoint(TRUNCATE)' | Out-Null
            $script:WalCheckpointCircuitOpen = $false
            $script:WalCheckpointConsecutiveFailures = 0
            Write-BusLog -Severity 'INFO' -Message 'WAL checkpoint circuit closed.'
        }
        catch {
            # Still failing — remain open
        }
        return
    }

    try {
        Invoke-SqliteQuery -SQLiteConnection $Connection -Query 'PRAGMA wal_checkpoint(TRUNCATE)' | Out-Null
        $script:WalCheckpointConsecutiveFailures = 0
    }
    catch {
        $errMsg = $_.Exception.Message
        if ($errMsg -match 'SQLITE_FULL') {
            $script:WalCheckpointConsecutiveFailures++

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
