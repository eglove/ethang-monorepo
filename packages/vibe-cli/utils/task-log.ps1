$script:PipelineMutex = $null
$script:FallbackLogRetryMs = 100
$script:FallbackLogMaxRetries = 3
$script:MutexTimeoutMs = 5000

function New-PipelineMutex {
    if (-not $script:PipelineMutex) {
        $script:PipelineMutex = [System.Threading.Mutex]::new($false, 'Global\VibePipelineLog')
    }
    return $script:PipelineMutex
}

function Write-ThreadSafeLog {
    param(
        [Parameter(Mandatory)][string]$Message,
        [string]$LogFile = $global:PipelineLogFile
    )

    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$ts] $Message`n"

    $mutex = New-PipelineMutex
    $acquired = $false

    try {
        try {
            $acquired = $mutex.WaitOne($script:MutexTimeoutMs)
        }
        catch [System.Threading.AbandonedMutexException] {
            # Previous holder crashed — we now own the mutex
            $acquired = $true
            $fallbackPath = [System.IO.Path]::ChangeExtension($LogFile, '.fallback.log')
            try {
                [System.IO.File]::AppendAllText($fallbackPath, "[$ts] WARNING: Acquired abandoned mutex`n")
            }
            catch { }
        }

        if ($acquired) {
            [System.IO.File]::AppendAllText($LogFile, $line)
        }
        else {
            # Mutex timeout — write to fallback log
            $fallbackPath = [System.IO.Path]::ChangeExtension($LogFile, '.fallback.log')
            $written = $false
            for ($i = 0; $i -lt $script:FallbackLogMaxRetries; $i++) {
                try {
                    [System.IO.File]::AppendAllText($fallbackPath, $line)
                    $written = $true
                    break
                }
                catch [System.IO.IOException] {
                    Start-Sleep -Milliseconds $script:FallbackLogRetryMs
                }
            }
            if (-not $written) {
                [Console]::Error.WriteLine($line)
            }
        }
    }
    finally {
        if ($acquired) {
            try { $mutex.ReleaseMutex() } catch { }
        }
    }
}

function Sync-FallbackLog {
    param([string]$LogFile = $global:PipelineLogFile)

    $fallbackPath = [System.IO.Path]::ChangeExtension($LogFile, '.fallback.log')

    if (-not [System.IO.File]::Exists($fallbackPath)) { return }

    $stream = $null
    try {
        $stream = [System.IO.FileStream]::new(
            $fallbackPath,
            [System.IO.FileMode]::Open,
            [System.IO.FileAccess]::ReadWrite,
            [System.IO.FileShare]::None
        )

        $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8, $true, 4096, $true)
        $content = $reader.ReadToEnd()
        $reader.Dispose()

        if ($content) {
            $mutex = New-PipelineMutex
            $acquired = $false
            try {
                $acquired = $mutex.WaitOne($script:MutexTimeoutMs)
                if ($acquired) {
                    [System.IO.File]::AppendAllText($LogFile, $content)
                }
            }
            catch [System.Threading.AbandonedMutexException] {
                $acquired = $true
                [System.IO.File]::AppendAllText($LogFile, $content)
            }
            finally {
                if ($acquired) {
                    try { $mutex.ReleaseMutex() } catch { }
                }
            }
        }

        $stream.SetLength(0)
    }
    catch [System.IO.IOException] {
        # File locked by another process — skip this flush
    }
    finally {
        if ($stream) { $stream.Dispose() }
    }
}

function Write-StatusNote {
    param(
        [Parameter(Mandatory)][string]$TaskId,
        [Parameter(Mandatory)][string]$Status,
        [string]$Detail
    )

    $banner = ">>> $TaskId $Status"
    if ($Detail) { $banner += " - $Detail" }
    $banner += ' <<<'

    Write-Host $banner -ForegroundColor Cyan
    Write-ThreadSafeLog -Message $banner
}

function Write-TaskLog {
    param(
        [Parameter(Mandatory)][string]$TaskId,
        [Parameter(Mandatory)][string]$Phase,
        [Parameter(Mandatory)][string]$Message,
        [string]$Detail,
        [string]$FeatureDir,
        [string]$RunId
    )

    if (-not $TaskId) { throw [System.ArgumentException]::new('TaskId is required') }

    $summary = "[$TaskId] ${Phase}: $Message"
    if ($RunId) { $summary = "[$RunId] $summary" }
    Write-ThreadSafeLog -Message $summary

    if ($FeatureDir) {
        $logsDir = Join-Path $FeatureDir 'logs'
        if (-not (Test-Path $logsDir)) {
            New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
        }

        $logPath = Join-Path $logsDir "$TaskId-log.txt"
        $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        $entry = "[$ts] [$TaskId] $Phase | $Message"
        if ($RunId) { $entry = "[$ts] [$RunId] [$TaskId] $Phase | $Message" }
        if ($Detail) { $entry += "`n  $Detail" }
        $entry += "`n"

        [System.IO.File]::AppendAllText($logPath, $entry)
    }
}
