function Get-PipelineLockState {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName
    )

    Assert-StateDatabaseOpen

    $lock = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM pipeline_lock WHERE feature_name = @f" -SqlParameters @{ f = $FeatureName }
    if (-not $lock) { return $null }

    # Check if PID is still running (stale detection)
    $isStale = $false
    try {
        $proc = Get-Process -Id $lock.pid -ErrorAction SilentlyContinue
        if (-not $proc) { $isStale = $true }
    }
    catch {
        $isStale = $true
    }

    # Add stale property
    $lock | Add-Member -NotePropertyName 'is_stale' -NotePropertyValue $isStale -Force

    return $lock
}
