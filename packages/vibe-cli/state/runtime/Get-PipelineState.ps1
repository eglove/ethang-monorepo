function Get-PipelineState {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName
    )

    Assert-StateDatabaseOpen

    $row = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM pipeline_state WHERE feature_name = @f" -SqlParameters @{ f = $FeatureName }
    return $row
}
