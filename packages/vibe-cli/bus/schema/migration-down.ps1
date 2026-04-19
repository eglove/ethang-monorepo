function Invoke-BusMigrationDown {
    <#
    .SYNOPSIS
        Rolls the bus database schema back by exactly one version.

    .DESCRIPTION
        OBJ-R9-13: Multi-stage rollback (delta > 1) is refused with a non-zero exit.

        Steps:
          1. Read current schema_version from settings table.
          2. Compute target version (default: current - 1).
          3. If delta > 1: emit [ERROR] and throw (non-zero).
          4. Create pre-rollback backup to .vibe/backups/<timestamp>/.
          5. Compute SHA-256 of backup file, write backup-manifest.json.
          6. Re-read backup and verify SHA-256 BEFORE any DROP TABLE.
          7. If hash mismatch: emit [ALARM] and throw (non-zero).
          8. If -Force not set: prompt confirmation showing row counts.
          9. DROP tables in reverse dependency order.
         10. Emit [INFO] Migration down complete.

    .PARAMETER DbPath
        Absolute path to the SQLite database file.

    .PARAMETER TargetVersion
        Version to roll back to.  -1 means current - 1 (default).

    .PARAMETER Force
        Skip interactive confirmation prompt.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$DbPath,

        [int]$TargetVersion = -1,

        [switch]$Force
    )

    # --- 1. Read current schema version -----------------------------------------
    $versionRow = Invoke-SqliteQuery -DataSource $DbPath `
        -Query "SELECT value FROM settings WHERE key='schema_version'"
    $currentVersion = if ($versionRow) { [int]$versionRow.value } else { 1 }

    # --- 2. Compute effective target version ------------------------------------
    $effectiveTarget = if ($TargetVersion -eq -1) { $currentVersion - 1 } else { $TargetVersion }

    # --- 3. Refuse multi-stage rollback (delta > 1) ----------------------------
    $delta = $currentVersion - $effectiveTarget
    if ($delta -gt 1) {
        $msg = "[ERROR] Multi-stage schema rollback from v$currentVersion to v$effectiveTarget is not supported. " +
               "Apply 'vibe schema-rollback' one version at a time."
        Write-Error $msg
        throw $msg
    }

    if ($effectiveTarget -lt 0) {
        $msg = "[ERROR] Cannot roll back below version 0. Current version: $currentVersion"
        Write-Error $msg
        throw $msg
    }

    # --- 4. Create pre-rollback backup ------------------------------------------
    $dbDir       = Split-Path $DbPath -Parent
    $timestamp   = (Get-Date -Format 'yyyyMMddTHHmmssZ')
    $backupDir   = Join-Path $dbDir ".vibe/backups/$timestamp"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    $backupPath  = Join-Path $backupDir 'vibe-bus.db'
    Copy-Item -Path $DbPath -Destination $backupPath -Force

    # --- 5. Compute SHA-256 of backup and write manifest -----------------------
    $backupBytes    = [System.IO.File]::ReadAllBytes($backupPath)
    $sha256         = [System.Security.Cryptography.SHA256]::Create()
    try { $hashBytes = $sha256.ComputeHash($backupBytes) }
    finally { $sha256.Dispose() }
    $backupHash = ([System.BitConverter]::ToString($hashBytes) -replace '-', '').ToLowerInvariant()

    $manifest = @{ BackupPath = $backupPath; Sha256 = $backupHash; CreatedAt = $timestamp }
    $manifest | ConvertTo-Json | Set-Content -Path (Join-Path $backupDir 'backup-manifest.json') -Encoding UTF8

    # --- 6. Verify backup integrity BEFORE any DROP ----------------------------
    $verifyBytes = [System.IO.File]::ReadAllBytes($backupPath)
    $sha256v     = [System.Security.Cryptography.SHA256]::Create()
    try { $verifyHashBytes = $sha256v.ComputeHash($verifyBytes) }
    finally { $sha256v.Dispose() }
    $verifyHash = ([System.BitConverter]::ToString($verifyHashBytes) -replace '-', '').ToLowerInvariant()

    # --- 7. Reject if hash mismatch --------------------------------------------
    if ($verifyHash -ne $backupHash) {
        $alarmMsg = "[ALARM] Migration backup integrity check failed — SHA-256 mismatch for '$backupPath'. Rollback aborted."
        Write-Error $alarmMsg
        throw $alarmMsg
    }

    # --- 8. Confirmation prompt ------------------------------------------------
    if (-not $Force) {
        $tables = @('rollback_state','consensus_state','bus_lifecycle_state','settings','agent_sessions','event_log')
        Write-Host "`nPre-rollback row counts:"
        foreach ($t in $tables) {
            try {
                $count = (Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT COUNT(*) AS n FROM $t").n
                Write-Host "  $t : $count rows"
            } catch {
                Write-Host "  $t : (not present)"
            }
        }
        $confirm = Read-Host "`nRoll back schema from v$currentVersion to v$effectiveTarget? (yes/no)"
        if ($confirm -notmatch '^yes$') {
            Write-Host "[INFO] Rollback cancelled."
            return
        }
    }

    # --- 9. DROP tables in reverse dependency order ----------------------------
    $dropOrder = @(
        'rollback_state',
        'consensus_state',
        'bus_lifecycle_state',
        'settings',
        'agent_sessions',
        'event_log'
    )
    foreach ($tbl in $dropOrder) {
        Invoke-SqliteQuery -DataSource $DbPath -Query "DROP TABLE IF EXISTS $tbl" | Out-Null
    }

    # --- 10. Emit completion ---------------------------------------------------
    Write-Host "[INFO] Migration down complete. Schema version: $effectiveTarget"
}
