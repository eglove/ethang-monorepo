function Set-MergeResult {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [string]$TaskId,
        [Parameter(Mandatory)]
        [string]$Status,
        [string]$Checkpoint,
        [int]$Conflict = 0
    )

    Assert-StateDatabaseOpen

    # Upsert
    $existing = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT id FROM merge_results WHERE feature_name = @f AND task_id = @tid" -SqlParameters @{ f = $FeatureName; tid = $TaskId }
    if ($existing) {
        Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "UPDATE merge_results SET status = @s, checkpoint = @cp, conflict = @c WHERE feature_name = @f AND task_id = @tid" -SqlParameters @{ f = $FeatureName; tid = $TaskId; s = $Status; cp = $Checkpoint; c = $Conflict }
    }
    else {
        Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "INSERT INTO merge_results (feature_name, task_id, status, checkpoint, conflict) VALUES (@f, @tid, @s, @cp, @c)" -SqlParameters @{ f = $FeatureName; tid = $TaskId; s = $Status; cp = $Checkpoint; c = $Conflict }
    }
}
