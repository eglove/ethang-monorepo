function Complete-TaskFailure {
    param(
        [Parameter(Mandatory)][hashtable]$TaskState,
        [string]$WorktreePath,
        [string]$TaskId
    )

    # 1. Remove worktree if active
    if ($TaskState.worktreeState -eq 'active' -and $WorktreePath) {
        try {
            if (Test-Path $WorktreePath) {
                git worktree remove $WorktreePath --force 2>$null
            }
            $TaskState.worktreeState = 'removed'
        }
        catch { Write-Warning "Failed to remove worktree for $TaskId`: $_" }
    }

    # 2. Tear down warden if active/configuring
    if ($TaskState.wardenState -in @('configuring', 'active')) {
        try {
            if ($WorktreePath -and (Get-Command Remove-WardenScope -ErrorAction SilentlyContinue)) {
                Remove-WardenScope -WorktreePath $WorktreePath -TaskId $TaskId
            }
            $TaskState.wardenState = 'unconfigured'
        }
        catch { Write-Warning "Failed to remove warden for $TaskId`: $_" }
    }

    # 3. Reset mergeState if in flight
    if ($TaskState.mergeState -in @('waiting', 'merging')) {
        $TaskState.mergeState = 'failed'
    }
}
