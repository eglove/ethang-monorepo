function Get-DebateState {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [int]$Stage
    )

    Assert-StateDatabaseOpen

    $row = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM debate_state WHERE feature_name = @f AND stage = @s ORDER BY round DESC LIMIT 1" -SqlParameters @{ f = $FeatureName; s = $Stage }
    return $row
}
