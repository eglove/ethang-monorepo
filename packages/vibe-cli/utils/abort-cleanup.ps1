function Invoke-AbortCleanup {
    param(
        [Parameter(Mandatory)][AllowEmptyCollection()][hashtable[]]$Tasks,
        [Parameter(Mandatory)][string]$LockDir,
        [string]$LogPath,
        [string]$RunId,
        [System.IO.StreamWriter]$LogWriter
    )

    $results = @{
        abortMarkerWritten = $false
        agentsTerminated = 0
        mergesAborted = 0
        worktreesRemoved = 0
        lockReleased = $false
        errors = @()
    }

    # 1. Write ABORT marker FIRST (before lock release)
    try {
        if ($LogWriter) {
            $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
            $LogWriter.WriteLine("[$ts] ABORT signal=CancelKeyPress runId=$RunId")
            $LogWriter.Flush()
            $LogWriter.BaseStream.Flush()
        }
        $results.abortMarkerWritten = $true
    }
    catch { $results.errors += "ABORT marker: $_" }

    # 2. Terminate running agents (best effort)
    foreach ($task in $Tasks) {
        if ($task.agentPid) {
            try {
                Stop-Process -Id $task.agentPid -Force -ErrorAction SilentlyContinue
                $results.agentsTerminated++
            }
            catch { $results.errors += "Agent terminate $($task.taskId): $_" }
        }
    }

    # 3. Abort in-progress merges BEFORE worktree removal
    foreach ($task in $Tasks) {
        if ($task.mergeState -eq 'merging' -and $task.worktreePath) {
            try {
                if (Test-Path (Join-Path $task.worktreePath '.git')) {
                    Push-Location $task.worktreePath
                    git merge --abort 2>$null
                    Pop-Location
                    $results.mergesAborted++
                }
            }
            catch { $results.errors += "Merge abort $($task.taskId): $_" }
        }
        # Reset mergeState for failed tasks
        if ($task.mergeState -in @('waiting', 'merging')) {
            $task.mergeState = 'failed'
        }
    }

    # 4. Remove worktrees SEQUENTIALLY (not parallel)
    foreach ($task in $Tasks) {
        if ($task.worktreeState -eq 'active' -and $task.worktreePath) {
            try {
                if (Test-Path $task.worktreePath) {
                    git worktree remove $task.worktreePath --force 2>$null
                }
                $task.worktreeState = 'removed'
                $results.worktreesRemoved++
            }
            catch {
                Write-Warning "Worktree removal failed for $($task.taskId): $_"
                $results.errors += "Worktree $($task.taskId): $_"
            }
        }
    }

    # 5. Release pipeline lock
    try {
        $lockFile = Join-Path $LockDir 'pipeline.lock'
        if (Test-Path $lockFile) { Remove-Item $lockFile -Force }
        $results.lockReleased = $true
    }
    catch { $results.errors += "Lock release: $_" }

    return $results
}
