# WriteSession Entity — OBJ-R5-5, OBJ-R6-18
# Lifecycle: Created -> Acquired(mutex held) -> Committed/Failed -> Released

$script:_ActiveSessions = @{}   # sessionId -> WriteSession hashtable

function Start-WriteSession {
    param(
        [Parameter(Mandatory)][string]$WorktreeLeaf,
        $Connection = $null,
        [int]$MaxAcquireAttempts = 8,               # OBJ-R6-19: randomized exp backoff
        [int]$InitialBackoffMs = 10,
        [scriptblock]$GetUtcNow = $null
    )

    $sessionId = [guid]::NewGuid().ToString()
    $mutexName = "VibeBus-Commit-$WorktreeLeaf"
    $mutex = [System.Threading.Mutex]::new($false, $mutexName)

    $backoffMs = $InitialBackoffMs
    $acquired = $false

    for ($attempt = 1; $attempt -le $MaxAcquireAttempts; $attempt++) {
        $acquired = $mutex.WaitOne($backoffMs)
        if ($acquired) { break }

        # Compute next backoff with jitter: double + ±5ms jitter
        $jitter = Get-Random -Minimum -5 -Maximum 5
        $backoffMs = [int]($backoffMs * 2) + $jitter
        if ($backoffMs -lt 0) { $backoffMs = 1 }
    }

    if (-not $acquired) {
        $mutex.Dispose()
        if ($Connection) {
            Invoke-BusHalt -Connection $Connection -HaltReason 'mechanical_error' -FailureCategory 'sqlite_error'
        }
        Write-PipelineLog -Severity 'ALARM' -Message "[ALARM] WriteSessionStarvation: Could not acquire $mutexName after $MaxAcquireAttempts attempts"
        throw "WriteSessionStarvation: Could not acquire VibeBus-Commit-$WorktreeLeaf after $MaxAcquireAttempts attempts"
    }

    # Set env var AFTER mutex acquired (OBJ-R5-14)
    $env:VIBE_BUS_COMMIT_IN_PROGRESS = '1'

    $utcNow = if ($GetUtcNow) { & $GetUtcNow } else { [DateTime]::UtcNow }

    $session = @{
        SessionId    = $sessionId
        WorktreeLeaf = $WorktreeLeaf
        Status       = 'Acquired'
        Mutex        = $mutex
        StartedAt    = $utcNow
        CompletedAt  = $null
    }

    $script:_ActiveSessions[$sessionId] = $session
    return $session
}

function Complete-WriteSession {
    param([Parameter(Mandatory)][string]$SessionId)

    $session = $script:_ActiveSessions[$SessionId]
    if (-not $session) {
        throw "WriteSession '$SessionId' not found"
    }

    $session.Status = 'Committed'
    $session.CompletedAt = [DateTime]::UtcNow

    # Unset env var BEFORE mutex released
    Remove-Item Env:VIBE_BUS_COMMIT_IN_PROGRESS -ErrorAction SilentlyContinue

    $session.Mutex.ReleaseMutex()
    $session.Mutex.Dispose()
    $script:_ActiveSessions.Remove($SessionId)
}

function Fail-WriteSession {
    param([Parameter(Mandatory)][string]$SessionId, [string]$Reason = '')

    $session = $script:_ActiveSessions[$SessionId]
    if (-not $session) {
        throw "WriteSession '$SessionId' not found"
    }

    $session.Status = 'Failed'
    $session.CompletedAt = [DateTime]::UtcNow

    # Unset env var BEFORE mutex released
    Remove-Item Env:VIBE_BUS_COMMIT_IN_PROGRESS -ErrorAction SilentlyContinue

    $session.Mutex.ReleaseMutex()
    $session.Mutex.Dispose()
    $script:_ActiveSessions.Remove($SessionId)
}

function Recover-WriteSession {
    param([Parameter(Mandatory)][string]$SessionId)

    $session = $script:_ActiveSessions[$SessionId]
    if (-not $session) {
        # Nothing to recover
        return
    }

    if ($session.Status -eq 'Acquired' -and $session.Mutex) {
        Remove-Item Env:VIBE_BUS_COMMIT_IN_PROGRESS -ErrorAction SilentlyContinue
        try { $session.Mutex.ReleaseMutex() } catch {}
        try { $session.Mutex.Dispose() } catch {}
    }

    $session.Status = 'Released'
    $script:_ActiveSessions.Remove($SessionId)
}

function Reset-WriteSessionState { $script:_ActiveSessions = @{} }

function Get-WriteSession {
    param([string]$SessionId)
    return $script:_ActiveSessions[$SessionId]
}
