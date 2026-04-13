function Get-LastCompletedStage {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName
    )

    Assert-StateDatabaseOpen

    $rows = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT stage FROM stage_progress WHERE feature_name = @f ORDER BY stage DESC LIMIT 1" -SqlParameters @{ f = $FeatureName }
    if (-not $rows) {
        return $null
    }
    return [int]$rows.stage
}
