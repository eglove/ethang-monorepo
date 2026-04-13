function Get-TaskResult {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [string]$TaskId
    )

    Assert-StateDatabaseOpen

    return Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM task_results WHERE feature_name = @f AND task_id = @tid" -SqlParameters @{ f = $FeatureName; tid = $TaskId }
}
