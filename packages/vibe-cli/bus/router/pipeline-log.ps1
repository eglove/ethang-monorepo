# bus/router/pipeline-log.ps1
# Mutex-protected pipeline log with severity routing and telemetry buffering.
#
# Lock hierarchy (MUST NOT violate):
#   VibeBus-Commit-<w> (outer)  >  VibeBus-Stash-<w> (middle)  >  VibeBus-PipelineLog (inner)
#
# Rule 1: Never acquire VibeBus-PipelineLog while holding VibeBus-Commit-<w>
# Rule 2: Commit serializer logs only AFTER releasing commit mutex
# Rule 3: No bus calls from pre-commit hooks (enforced separately by AppendEvent env-var check)
# Rule 4: VibeBus-Stash-<w> is NEVER held when VibeBus-Commit-<w> is needed
# Rule 5: VibeBus-PipelineLog telemetry buffers inside transactions, flushed post-COMMIT

$script:_InsideTransaction = $false
$script:_PendingTelemetry = [System.Collections.Generic.List[string]]::new()

function _Get-AlarmLogPath {
    if ($env:VIBE_BUS_ALARM_LOG_PATH) {
        return $env:VIBE_BUS_ALARM_LOG_PATH
    }
    return Join-Path (Get-Location) '.vibe/alarms.log'
}

function _Write-AlarmEntry {
    param(
        [string]$Severity,
        [string]$Gate,
        [string]$Message,
        [hashtable]$StructuredData
    )
    $alarmPath = _Get-AlarmLogPath
    $dir = Split-Path $alarmPath -Parent
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $entry = [ordered]@{
        timestamp_utc  = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        severity       = $Severity
        gate           = $Gate
        message        = $Message
        structured_data = $StructuredData
    }
    $jsonLine = $entry | ConvertTo-Json -Compress -Depth 5

    # Write with FileStream FileShare.ReadWrite for concurrent-safe append
    $fs = [System.IO.FileStream]::new(
        $alarmPath,
        [System.IO.FileMode]::Append,
        [System.IO.FileAccess]::Write,
        [System.IO.FileShare]::ReadWrite
    )
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonLine + [System.Environment]::NewLine)
        $fs.Write($bytes, 0, $bytes.Length)
    }
    finally {
        $fs.Dispose()
    }
}

function Write-PipelineLog {
    param(
        [Parameter(Mandatory)][string]$Message,
        [ValidateSet('TELEMETRY', 'INFO', 'WARN', 'ERROR', 'ALARM')]
        [string]$Severity = 'INFO',
        [string]$Gate = $null,
        [hashtable]$StructuredData = $null
    )

    # Build formatted output line
    $gateStr = if ($Gate) { " [gate=$Gate]" } else { '' }
    $dataStr = if ($StructuredData) {
        ' ' + ($StructuredData.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" } | Join-String -Separator ' ')
    } else { '' }

    if ($Severity -eq 'TELEMETRY') {
        $line = "[TELEMETRY]$gateStr $Message$dataStr"
    } else {
        $ts = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
        $line = "[$ts][$Severity]$gateStr $Message$dataStr"
    }

    # Buffer TELEMETRY inside transactions
    if ($Severity -eq 'TELEMETRY' -and $script:_InsideTransaction) {
        $script:_PendingTelemetry.Add($line)
        return
    }

    # Thread-safe write via named mutex VibeBus-PipelineLog
    $mutex = [System.Threading.Mutex]::new($false, 'VibeBus-PipelineLog')
    $acquired = $false
    try {
        try {
            $acquired = $mutex.WaitOne(5000)
        }
        catch [System.Threading.AbandonedMutexException] {
            # Mutex was abandoned by a prior holder — we now own it; proceed
            $acquired = $true
            Write-Host "[WARN] PipelineLog mutex was abandoned. Discarding partial write." -ForegroundColor Yellow
            # Discard partial write: just log warning and return without writing
            return
        }

        if (-not $acquired) {
            Write-Warning "PipelineLog mutex WaitOne timed out after 5000ms"
            return
        }

        # Severity routing: ALARM/ERROR → alarms.log AND stdout; others → stdout only
        if ($Severity -eq 'ALARM' -or $Severity -eq 'ERROR') {
            _Write-AlarmEntry -Severity $Severity -Gate $Gate -Message $Message -StructuredData $StructuredData
        }

        Write-Host $line
    }
    finally {
        if ($acquired) {
            try { $mutex.ReleaseMutex() } catch {}
        }
        $mutex.Dispose()
    }
}

# Transaction boundary helpers (for use by AppendEvent)
function Enter-BusTransaction {
    $script:_InsideTransaction = $true
    $script:_PendingTelemetry = [System.Collections.Generic.List[string]]::new()
}

function Exit-BusTransaction {
    $script:_InsideTransaction = $false
    Flush-PendingTelemetry
}

function Flush-PendingTelemetry {
    foreach ($msg in $script:_PendingTelemetry) {
        Write-Host $msg
    }
    $script:_PendingTelemetry.Clear()
}
