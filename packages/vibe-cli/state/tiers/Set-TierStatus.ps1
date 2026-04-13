function Set-TierStatus {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [int]$Tier,
        [Parameter(Mandatory)]
        [ValidateSet('none', 'pending', 'running', 'passed', 'failed')]
        [string]$Status
    )

    Assert-StateDatabaseOpen

    $completedAt = if ($Status -eq 'passed') { (Get-Date).ToUniversalTime().ToString('o') } else { $null }

    $existing = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT tier FROM tier_progress WHERE feature_name = @f AND tier = @t" -SqlParameters @{ f = $FeatureName; t = $Tier }
    if ($existing) {
        Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "UPDATE tier_progress SET status = @s, completed_at = @c WHERE feature_name = @f AND tier = @t" -SqlParameters @{ f = $FeatureName; t = $Tier; s = $Status; c = $completedAt }
    }
    else {
        Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "INSERT INTO tier_progress (feature_name, tier, status, completed_at) VALUES (@f, @t, @s, @c)" -SqlParameters @{ f = $FeatureName; t = $Tier; s = $Status; c = $completedAt }
    }
}
