function Get-StageOutput {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [string]$OutputType
    )

    Assert-StateDatabaseOpen

    $row = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM stage_outputs WHERE feature_name = @f AND output_type = @t ORDER BY created_at DESC LIMIT 1" -SqlParameters @{ f = $FeatureName; t = $OutputType }
    if (-not $row) { return $null }

    # Parse JSON
    try {
        $parsed = $row.json_data | ConvertFrom-Json
        return $parsed
    }
    catch {
        return $row.json_data
    }
}
