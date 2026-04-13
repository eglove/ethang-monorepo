function Get-GateResults {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseSingularNouns', '')]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [string]$GateType
    )

    Assert-StateDatabaseOpen

    if ($PSBoundParameters.ContainsKey('GateType')) {
        return Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM gate_results WHERE feature_name = @f AND gate_type = @gt ORDER BY round ASC" -SqlParameters @{ f = $FeatureName; gt = $GateType }
    }
    return Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM gate_results WHERE feature_name = @f ORDER BY created_at ASC" -SqlParameters @{ f = $FeatureName }
}
