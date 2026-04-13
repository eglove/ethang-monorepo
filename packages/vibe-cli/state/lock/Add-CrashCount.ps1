function Add-CrashCount {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName
    )

    Assert-StateDatabaseOpen

    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "UPDATE pipeline_lock SET crash_count = crash_count + 1 WHERE feature_name = @f" -SqlParameters @{ f = $FeatureName }
}
