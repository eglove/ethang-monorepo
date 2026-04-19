# atomic-file-replace.ps1
# Atomically replaces a target file with a source (temp) file.
# Uses System.IO.File.Replace (swap) when target exists, or File.Move when it doesn't.
# Retry logic handles transient sharing violations from AV/indexers.
#
# LOCK HIERARCHY NOTE:
#   This function is lock-free; callers may hold any outer lock when invoking it.

function Invoke-AtomicFileReplace {
    <#
    .SYNOPSIS
        Atomically replaces $TargetPath with $SourcePath.
    .DESCRIPTION
        Uses [System.IO.File]::Replace when the target already exists (atomic swap),
        or [System.IO.File]::Move($src, $dst, $true) when the target does not exist.
        On IOException (e.g. AV/indexer sharing violation) retries with exponential
        backoff + ±25ms jitter, emitting [WARN] on each intermediate attempt.
        After MaxAttempts retries throws with [ALARM] prefix.
    .PARAMETER TargetPath
        Final destination path.
    .PARAMETER SourcePath
        Temporary file to atomically rename to target.
    .PARAMETER MaxAttempts
        Maximum number of attempts (default 8).
    .PARAMETER BaseDelayMs
        Base delay in milliseconds for exponential backoff (default 100).
    .OUTPUTS
        $true on success.
    #>
    param(
        [Parameter(Mandatory)][string]$TargetPath,
        [Parameter(Mandatory)][string]$SourcePath,
        [int]$MaxAttempts = 8,
        [int]$BaseDelayMs = 100
    )

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            if (Test-Path $TargetPath) {
                # Atomic swap: Replace source→target, no backup.
                # Use [NullString]::Value instead of $null — PowerShell converts $null
                # to empty string for .NET string parameters, causing ArgumentException.
                [System.IO.File]::Replace($SourcePath, $TargetPath, [NullString]::Value)
            }
            else {
                # Target does not exist: atomic move (overwrite = $true)
                [System.IO.File]::Move($SourcePath, $TargetPath, $true)
            }
            return $true
        }
        catch [System.IO.IOException] {
            if ($attempt -ge $MaxAttempts) {
                throw "[ALARM] Atomic file replace exhausted after $MaxAttempts attempts: $_"
            }
            $delay = $BaseDelayMs * [Math]::Pow(2, $attempt - 1)
            $jitter = Get-Random -Minimum -25 -Maximum 25
            Start-Sleep -Milliseconds ([Math]::Max(1, $delay + $jitter))
            Write-Host "[WARN] Atomic file replace retry ${attempt}/${MaxAttempts}: $_"
        }
    }
}
