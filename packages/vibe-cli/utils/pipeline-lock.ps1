function Test-PipelineLockActive {
    <#
    .SYNOPSIS
        Checks whether the pipeline lock is currently held by a running process.
    .PARAMETER LockDir
        Directory containing the pipeline.lock file.
    .OUTPUTS
        [bool] $true if lock file exists and the PID is still running, $false otherwise.
    #>
    param(
        [Parameter(Mandatory)][string]$LockDir
    )

    $lockFile = Join-Path $LockDir 'pipeline.lock'
    if (-not (Test-Path $lockFile)) { return $false }

    $lockData = Get-Content $lockFile -Raw | ConvertFrom-Json
    try {
        Get-Process -Id $lockData.pid -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Lock-Pipeline {
    <#
    .SYNOPSIS
        TLA+ AcquireLock: idle → locked, lockHolder = 1.
        Creates a pipeline.lock file with the current PID and timestamp.
    .PARAMETER LockDir
        Directory where pipeline.lock will be created.
    .PARAMETER Resume
        When set, provides a resume-specific error message if the lock is active.
    .OUTPUTS
        [hashtable] A new pipeline state with pipelineState = 'locked' and lockHolder = 1.
    #>
    param(
        [Parameter(Mandatory)][string]$LockDir,
        [switch]$Resume
    )

    $lockFile = Join-Path $LockDir 'pipeline.lock'

    if (Test-Path $lockFile) {
        $lockData = Get-Content $lockFile -Raw | ConvertFrom-Json
        $holdingPid = $lockData.pid

        # Check if the holding process is still alive
        $isRunning = $false
        try {
            Get-Process -Id $holdingPid -ErrorAction Stop | Out-Null
            $isRunning = $true
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

        # Stale lock — the process crashed
        Write-Warning "Removing stale pipeline lock from crashed PID $holdingPid"
        Remove-Item $lockFile -Force
    }

    # Write new lock file as raw JSON.
    # Use extended fractional seconds (13+ digits) so ConvertFrom-Json preserves
    # the value as a string rather than auto-converting to DateTime.
    $now = Get-Date
    $ts = $now.ToString('yyyy-MM-ddTHH:mm:ss') + '.' + $now.ToString('fffffff') + '000000' + $now.ToString('zzz')
    $newLockData = "{`"pid`":$PID,`"startTime`":`"$ts`"}"
    Set-Content -Path $lockFile -Value $newLockData

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
