function Get-MergeResult {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName
    )

    Assert-StateDatabaseOpen

    return Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM merge_results WHERE feature_name = @f" -SqlParameters @{ f = $FeatureName }
}
