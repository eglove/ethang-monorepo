. "$PSScriptRoot/git-retry.ps1"
. "$PSScriptRoot/task-log.ps1"

function New-TaskWorkspace {
    param(
        [Parameter(Mandatory)][array]$Tasks,
        [Parameter(Mandatory)][string]$FeatureName,
        [Parameter(Mandatory)][string]$RunId,
        [string]$FeatureDir
    )

    # Prune stale worktree entries first
    try { $null = Invoke-GitWithRetry -Arguments @('worktree', 'prune') } catch { }

    if ($Tasks.Count -le 1) {
        # Single-task tier — no workspace needed
        return $null
    }

    $workspaces = @{}
    $created = [System.Collections.ArrayList]::new()
    $truncatedRunId = $RunId.Substring(0, [Math]::Min(8, $RunId.Length))

    for ($i = 0; $i -lt $Tasks.Count; $i++) {
        $task = $Tasks[$i]
        $taskId = $task.id
        $branchName = "feature/$FeatureName-$taskId-$truncatedRunId"
        $worktreePath = Join-Path (Get-Location) ".worktrees/$FeatureName-$taskId-$truncatedRunId"

        try {
            $null = Invoke-GitWithRetry -Arguments @('worktree', 'add', '-b', $branchName, $worktreePath)
            $workspaces[$taskId] = $worktreePath
            $null = $created.Add(@{ TaskId = $taskId; Path = $worktreePath; Branch = $branchName })

            if ($FeatureDir) {
                Write-TaskLog -TaskId $taskId -Phase 'idle' -Message "Workspace created: $worktreePath" -FeatureDir $FeatureDir -RunId $RunId
            }
        }
        catch {
            # Rollback all previously created worktrees
            $orphaned = [System.Collections.ArrayList]::new()
            foreach ($prev in $created) {
                try {
                    $null = Invoke-GitWithRetry -Arguments @('worktree', 'remove', '--force', $prev.Path)
                    $null = Invoke-GitWithRetry -Arguments @('branch', '-D', $prev.Branch)
                }
                catch {
                    $null = $orphaned.Add($prev.Path)
                }
            }

            $ex = [System.Exception]::new(
                "Workspace creation failed for $taskId (worktree $($i + 1)/$($Tasks.Count)): $($_.Exception.Message)"
            )
            $ex | Add-Member -MemberType NoteProperty -Name OrphanedWorktrees -Value @($orphaned)
            throw $ex
        }
    }

    return $workspaces
}

function Remove-TaskWorkspace {
    param(
        [Parameter(Mandatory)][string]$TaskId,
        [Parameter(Mandatory)][string]$WorktreePath,
        [string]$BranchName,
        [string]$FeatureDir,
        [string]$RunId
    )

    $null = Invoke-GitWithRetry -Arguments @('worktree', 'remove', '--force', $WorktreePath)

    if ($BranchName) {
        try { $null = Invoke-GitWithRetry -Arguments @('branch', '-D', $BranchName) } catch { }
    }

    if ($FeatureDir) {
        Write-TaskLog -TaskId $TaskId -Phase 'done' -Message "Workspace removed: $WorktreePath" -FeatureDir $FeatureDir -RunId $RunId
    }
}

function Test-WorkspaceExists {
    param([Parameter(Mandatory)][string]$WorktreePath)

    return (Test-Path $WorktreePath)
}

function Reset-WorktreeState {
    param(
        [Parameter(Mandatory)][string]$WorktreePath,
        [string]$TaskId,
        [string]$FeatureDir,
        [string]$RunId
    )

    # Check for uncommitted changes and warn
    try {
        $dirty = & git -C $WorktreePath status --porcelain 2>$null
        if ($dirty) {
            $fileCount = ($dirty | Measure-Object).Count
            if ($TaskId -and $FeatureDir) {
                Write-TaskLog -TaskId $TaskId -Phase 'idle' -Message "WARNING: Discarding $fileCount uncommitted file(s) before reset" -FeatureDir $FeatureDir -RunId $RunId
            }
        }
    }
    catch { }

    # Try clean reset
    try {
        $null = Invoke-GitWithRetry -Arguments @('-C', $WorktreePath, 'checkout', '--', '.')
        $null = Invoke-GitWithRetry -Arguments @('-C', $WorktreePath, 'clean', '-fd')
        return $true
    }
    catch {
        # Deeply corrupted — check for index lock
        $indexLock = Join-Path $WorktreePath '.git/index.lock'
        if (Test-Path $indexLock) {
            Remove-Item $indexLock -Force -ErrorAction SilentlyContinue
            try {
                $null = Invoke-GitWithRetry -Arguments @('-C', $WorktreePath, 'checkout', '--', '.')
                $null = Invoke-GitWithRetry -Arguments @('-C', $WorktreePath, 'clean', '-fd')
                return $true
            }
            catch { }
        }

        # Full recreation needed
        if ($TaskId -and $FeatureDir) {
            Write-TaskLog -TaskId $TaskId -Phase 'idle' -Message "Worktree corrupted, recreating..." -FeatureDir $FeatureDir -RunId $RunId
        }

        $branchName = & git -C $WorktreePath rev-parse --abbrev-ref HEAD 2>$null
        try {
            $null = Invoke-GitWithRetry -Arguments @('worktree', 'remove', '--force', $WorktreePath)
        }
        catch { }

        if ($branchName) {
            try {
                $null = Invoke-GitWithRetry -Arguments @('worktree', 'add', $WorktreePath, $branchName)
                return $false  # Recreated
            }
            catch {
                throw "Failed to recreate worktree at $WorktreePath : $($_.Exception.Message)"
            }
        }

        throw "Failed to reset worktree at $WorktreePath : cannot determine branch"
    }
}
