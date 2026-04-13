function Lock-PipelineState {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [int]$ProcessId
    )

    Assert-StateDatabaseOpen

    # Verify active feature matches
    $activeFeature = Get-ActiveFeature
    if ($activeFeature -ne $FeatureName) {
        throw "Lock target '$FeatureName' must match the active feature '$activeFeature'."
    }

    # Check feature is not in terminal state
    $feature = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT status FROM features WHERE name = @f" -SqlParameters @{ f = $FeatureName }
    if ($feature -and $feature.status -in @('complete', 'halted')) {
        throw "Feature '$FeatureName' is in terminal status '$($feature.status)' and cannot be resumed."
    }

    # Check no existing lock
    $existingLock = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT pid FROM pipeline_lock WHERE feature_name = @f" -SqlParameters @{ f = $FeatureName }
    if ($existingLock) {
        throw "Lock is already held for feature '$FeatureName' by PID $($existingLock.pid)."
    }

    $now = (Get-Date).ToUniversalTime().ToString('o')
    $startTime = (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue | Select-Object -ExpandProperty StartTime -ErrorAction SilentlyContinue)
    $startTimeStr = if ($startTime) { $startTime.ToUniversalTime().ToString('o') } else { $now }

    # Insert lock and update pipeline state atomically
    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "INSERT INTO pipeline_lock (feature_name, pid, start_time, crash_count, locked_at) VALUES (@f, @p, @st, 0, @t)" -SqlParameters @{ f = $FeatureName; p = $ProcessId; st = $startTimeStr; t = $now }

    # Transition feature to running and create/update pipeline_state
    Update-PipelineState -FeatureName $FeatureName -PipelineState 'running' -LockHolder $ProcessId -FeatureStatus 'running'
}
