function Get-GateResult {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [string]$GateType
    )

    Assert-StateDatabaseOpen

    return Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM gate_results WHERE feature_name = @f AND gate_type = @gt ORDER BY created_at DESC LIMIT 1" -SqlParameters @{ f = $FeatureName; gt = $GateType }
}
