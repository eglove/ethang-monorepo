function Get-CrashCount {
    param([Parameter(Mandatory)][string]$LockDir)
    $lockFile = Join-Path $LockDir 'pipeline.lock'
    if (-not (Test-Path $lockFile)) { return 0 }
    try {
        $data = Get-Content $lockFile -Raw | ConvertFrom-Json
        if ($null -ne $data.crashCount) { return [int]$data.crashCount }
        return 0
    }
    catch { return 0 }
}

function Update-CrashCount {
    param(
        [Parameter(Mandatory)][string]$LockDir,
        [Parameter(Mandatory)][int]$NewCount
    )
    $lockFile = Join-Path $LockDir 'pipeline.lock'
    if (-not (Test-Path $lockFile)) { return }
    try {
        $data = Get-Content $lockFile -Raw | ConvertFrom-Json
        $data | Add-Member -NotePropertyName crashCount -NotePropertyValue $NewCount -Force
        $tempFile = "$lockFile.tmp"
        $data | ConvertTo-Json | Set-Content $tempFile
        Move-Item $tempFile $lockFile -Force
    }
    catch {
        Write-Warning "Failed to update crash count: $_"
    }
}

function Test-CrashBudget {
    param(
        [Parameter(Mandatory)][string]$LockDir,
        [int]$MaxCrashes = 3
    )
    $count = Get-CrashCount -LockDir $LockDir
    if ($count -ge $MaxCrashes) {
        throw "Crash budget exhausted ($count >= $MaxCrashes). Manual intervention required."
    }
    return $count
}

function Test-PipelineLockActive {
    <#
    .SYNOPSIS
        Checks whether the pipeline lock is currently held by a running process.
        Uses process identity (PID + startTime) to detect PID reuse.
    .PARAMETER LockDir
        Directory containing the pipeline.lock file.
    .OUTPUTS
        [bool] $true if lock file exists, PID is alive, and startTime matches.
    #>
    param(
        [Parameter(Mandatory)][string]$LockDir
    )

    $lockFile = Join-Path $LockDir 'pipeline.lock'
    if (-not (Test-Path $lockFile)) { return $false }

    # Parse JSON with try/catch — corrupt or empty → $false
    $raw = Get-Content $lockFile -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) { return $false }

    try {
        $lockData = $raw | ConvertFrom-Json
    }
    catch {
        return $false
    }

    # Check if PID is alive
    try {
        $proc = Get-Process -Id $lockData.pid -ErrorAction Stop
    }
    catch {
        return $false
    }

    # Compare startTime for PID reuse detection
    try {
        # ConvertFrom-Json may auto-convert ISO 8601 to DateTime or keep as string
        if ($lockData.startTime -is [DateTime]) {
            $recordedTime = $lockData.startTime.ToUniversalTime()
        }
        else {
            $recordedTime = [DateTime]::Parse($lockData.startTime).ToUniversalTime()
        }
        $actualTime = $proc.StartTime.ToUniversalTime()
        if ([Math]::Abs(($recordedTime - $actualTime).TotalSeconds) -gt 2) {
            return $false
        }
    }
    catch {
        return $false
    }

    return $true
}

function Lock-Pipeline {
    <#
    .SYNOPSIS
        TLA+ AcquireLock: idle → locked, lockHolder = 1.
        Creates a pipeline.lock file with the current PID, process startTime, and crashCount.
        Uses a named system mutex for cross-process serialization.
        Lock ordering: pipeline lock BEFORE merge mutex.
    .PARAMETER LockDir
        Directory where pipeline.lock will be created.
    .PARAMETER Resume
        When set, provides a resume-specific error message if the lock is active.
    .PARAMETER Feature
        Feature name for per-feature mutex isolation. Defaults to 'default'.
    .PARAMETER MutexName
        Named mutex for cross-process serialization. Defaults to 'Global\vibe-cli-<Feature>'.
    .PARAMETER MutexTimeoutMs
        Timeout in milliseconds for mutex acquisition. Defaults to 30000.
    .OUTPUTS
        [hashtable] A new pipeline state with pipelineState = 'locked' and lockHolder = 1.
    #>
    param(
        [Parameter(Mandatory)][string]$LockDir,
        [switch]$Resume,
        [string]$Feature = 'default',
        [string]$MutexName,
        [int]$MutexTimeoutMs = 30000
    )

    if (-not $MutexName) {
        $MutexName = "Global\vibe-cli-$Feature"
    }

    $lockFile = Join-Path $LockDir 'pipeline.lock'
    $mutex = $null

    try {
        # Acquire system mutex for cross-process serialization
        $mutex = [System.Threading.Mutex]::new($false, $MutexName)
        try {
            $acquired = $mutex.WaitOne($MutexTimeoutMs)
        }
        catch [System.Threading.AbandonedMutexException] {
            # Abandoned mutex means the previous holder crashed — we still get ownership
            Write-Warning "Acquired abandoned mutex '$MutexName' — previous holder likely crashed"
            $acquired = $true
        }

        if (-not $acquired) {
            throw "Could not acquire pipeline lock within timeout ($MutexTimeoutMs ms)"
        }

        # Check existing lock file
        if (Test-Path $lockFile) {
            $raw = Get-Content $lockFile -Raw
            $lockData = $null
            $isCorrupt = $false

            if ([string]::IsNullOrWhiteSpace($raw)) {
                $isCorrupt = $true
            }
            else {
                try {
                    $lockData = $raw | ConvertFrom-Json
                }
                catch {
                    $isCorrupt = $true
                }
            }

            if ($isCorrupt) {
                Write-Warning "Removing corrupt pipeline lock file"
                Remove-Item $lockFile -Force
            }
            else {
                $holdingPid = $lockData.pid

                # Check if holding process is still alive with matching startTime
                $isRunning = $false
                try {
                    $proc = Get-Process -Id $holdingPid -ErrorAction Stop
                    # Verify process identity via startTime
                    if ($lockData.startTime) {
                        if ($lockData.startTime -is [DateTime]) {
                            $recordedTime = $lockData.startTime.ToUniversalTime()
                        }
                        else {
                            $recordedTime = [DateTime]::Parse($lockData.startTime).ToUniversalTime()
                        }
                        $actualTime = $proc.StartTime.ToUniversalTime()
                        if ([Math]::Abs(($recordedTime - $actualTime).TotalSeconds) -le 2) {
                            $isRunning = $true
                        }
                    }
                    else {
                        # No startTime in lock — legacy format, fall back to PID-only check
                        $isRunning = $true
                    }
                }
                catch {
                    $isRunning = $false
                }

                if ($isRunning) {
                    if ($Resume) {
                        throw "Cannot resume while active — pipeline lock held by PID $holdingPid"
                    }
                    throw "Pipeline is already running (PID $holdingPid holds the lock)"
                }

                # Stale lock — the process crashed or PID was reused
                Write-Warning "Removing stale pipeline lock from crashed PID $holdingPid"
                Remove-Item $lockFile -Force
            }
        }

        # Write new lock file atomically: temp file → Move-Item
        $startTime = (Get-Process -Id $PID).StartTime.ToUniversalTime().ToString('o')
        $newLockData = @{
            pid        = $PID
            startTime  = $startTime
            crashCount = 0
        } | ConvertTo-Json

        $tempFile = Join-Path $LockDir "pipeline.lock.tmp.$PID"
        Set-Content -Path $tempFile -Value $newLockData
        Move-Item -Path $tempFile -Destination $lockFile -Force
    }
    finally {
        # Release mutex after file write
        if ($mutex) {
            try { $mutex.ReleaseMutex() } catch { }
            $mutex.Dispose()
        }
    }

    # Return initial state with lock acquired
    $state = New-PipelineState
    $state.pipelineState = 'locked'
    $state.lockHolder    = 1
    return $state
}

function Start-PipelineRunning {
    <#
    .SYNOPSIS
        TLA+ StartRunning: locked → running, lockHolder unchanged.
    .PARAMETER State
        The mutable pipeline state hashtable. Must have pipelineState = 'locked'.
    #>
    param(
        [Parameter(Mandatory)][hashtable]$State
    )

    if ($State.pipelineState -ne 'locked') {
        throw "pipelineState must be ""locked"" to start running, got ""$($State.pipelineState)"""
    }

    if ($null -eq $State.lockHolder) {
        throw "lockHolder must not be `$null when starting pipeline"
    }

    $State.pipelineState = 'running'
}

function Unlock-Pipeline {
    <#
    .SYNOPSIS
        Releases the pipeline lock — deletes pipeline.lock and clears lockHolder.
    .PARAMETER LockDir
        Directory containing the pipeline.lock file.
    .PARAMETER State
        Optional pipeline state hashtable; if provided, lockHolder is set to $null.
    #>
    param(
        [Parameter(Mandatory)][string]$LockDir,
        [hashtable]$State
    )

    $lockFile = Join-Path $LockDir 'pipeline.lock'
    if (Test-Path $lockFile) {
        Remove-Item $lockFile -Force
    }

    if ($State) {
        $State.lockHolder = $null
    }
}
