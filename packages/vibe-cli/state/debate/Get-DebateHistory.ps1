function Get-DebateHistory {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [int]$Stage
    )

    Assert-StateDatabaseOpen

    return Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM debate_state WHERE feature_name = @f AND stage = @s ORDER BY round ASC" -SqlParameters @{ f = $FeatureName; s = $Stage }
}
