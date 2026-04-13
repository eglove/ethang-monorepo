function Get-AllTierProgress {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName
    )

    Assert-StateDatabaseOpen

    return Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM tier_progress WHERE feature_name = @f ORDER BY tier ASC" -SqlParameters @{ f = $FeatureName }
}
