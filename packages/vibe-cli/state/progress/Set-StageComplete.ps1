function Set-StageComplete {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [int]$Stage
    )

    Assert-StateDatabaseOpen

    $maxStage = 7
    if ($Stage -lt 1 -or $Stage -gt $maxStage) {
        throw "Stage must be between 1 and $maxStage. Got: $Stage"
    }

    # Get last completed stage
    $last = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT MAX(stage) as max_stage FROM stage_progress WHERE feature_name = @f" -SqlParameters @{ f = $FeatureName }
    $lastCompleted = if ($last -and -not [System.DBNull]::Value.Equals($last.max_stage)) { [int]$last.max_stage } else { 0 }

    # Idempotent: re-completing the same stage is fine
    if ($Stage -eq $lastCompleted) {
        return
    }

    if ($Stage -lt $lastCompleted) {
        throw "Stage $Stage is below the last completed stage $lastCompleted."
    }

    if ($Stage -ne ($lastCompleted + 1)) {
        throw "Stage $Stage is not the next sequential stage after $lastCompleted (expected stage $($lastCompleted + 1))."
    }

    $now = (Get-Date).ToUniversalTime().ToString('o')
    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "INSERT OR REPLACE INTO stage_progress (feature_name, stage, completed_at) VALUES (@f, @s, @t)" -SqlParameters @{ f = $FeatureName; s = $Stage; t = $now }
}
