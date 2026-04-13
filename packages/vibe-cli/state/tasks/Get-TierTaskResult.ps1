function Get-TierTaskResult {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [int]$Tier
    )

    Assert-StateDatabaseOpen

    return Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM task_results WHERE feature_name = @f AND tier = @t" -SqlParameters @{ f = $FeatureName; t = $Tier }
}
