function Set-StageOutput {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [int]$Stage,
        [Parameter(Mandatory)]
        [string]$OutputType,
        [Parameter(Mandatory)]
        [string]$JsonData
    )

    Assert-StateDatabaseOpen

    $now = (Get-Date).ToUniversalTime().ToString('o')

    # Upsert by deleting old and inserting new
    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "DELETE FROM stage_outputs WHERE feature_name = @f AND output_type = @t" -SqlParameters @{ f = $FeatureName; t = $OutputType }
    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "INSERT INTO stage_outputs (feature_name, stage, output_type, json_data, created_at) VALUES (@f, @s, @t, @j, @c)" -SqlParameters @{ f = $FeatureName; s = $Stage; t = $OutputType; j = $JsonData; c = $now }
}
