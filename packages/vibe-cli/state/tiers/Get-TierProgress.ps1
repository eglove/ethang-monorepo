function Get-TierProgress {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [int]$Tier
    )

    Assert-StateDatabaseOpen

    return Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM tier_progress WHERE feature_name = @f AND tier = @t" -SqlParameters @{ f = $FeatureName; t = $Tier }
}
