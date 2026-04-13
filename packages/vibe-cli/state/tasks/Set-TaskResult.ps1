function Set-TaskResult {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [string]$TaskId,
        [Parameter(Mandatory)]
        [int]$Tier,
        [string]$Phase,
        [Parameter(Mandatory)]
        [string]$Status,
        [string]$CountersJson,
        [int]$Escalated = 0,
        [string]$ErrorMessage,
        [string]$TestFilesJson
    )

    Assert-StateDatabaseOpen

    # Upsert: check if task already exists
    $existing = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT id FROM task_results WHERE feature_name = @f AND task_id = @tid AND tier = @t" -SqlParameters @{ f = $FeatureName; tid = $TaskId; t = $Tier }
    if ($existing) {
        Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "UPDATE task_results SET phase = @ph, status = @s, counters_json = @cj, escalated = @e, error = @err, test_files_json = @tfj WHERE feature_name = @f AND task_id = @tid AND tier = @t" -SqlParameters @{ f = $FeatureName; tid = $TaskId; t = $Tier; ph = $Phase; s = $Status; cj = $CountersJson; e = $Escalated; err = $ErrorMessage; tfj = $TestFilesJson }
    }
    else {
        Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "INSERT INTO task_results (feature_name, task_id, tier, phase, status, counters_json, escalated, error, test_files_json) VALUES (@f, @tid, @t, @ph, @s, @cj, @e, @err, @tfj)" -SqlParameters @{ f = $FeatureName; tid = $TaskId; t = $Tier; ph = $Phase; s = $Status; cj = $CountersJson; e = $Escalated; err = $ErrorMessage; tfj = $TestFilesJson }
    }
}
