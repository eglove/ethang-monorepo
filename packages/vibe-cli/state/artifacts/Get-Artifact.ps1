function Get-Artifact {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [int]$Stage
    )

    Assert-StateDatabaseOpen

    if ($PSBoundParameters.ContainsKey('Stage')) {
        return Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM artifacts WHERE feature_name = @f AND stage = @s" -SqlParameters @{ f = $FeatureName; s = $Stage }
    }
    return Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM artifacts WHERE feature_name = @f" -SqlParameters @{ f = $FeatureName }
}
