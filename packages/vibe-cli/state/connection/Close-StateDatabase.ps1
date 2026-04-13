function Close-StateDatabase {
    [CmdletBinding()]
    param()

    Assert-StateDatabaseOpen

    # Check no active feature is set
    $session = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT active_feature FROM session WHERE id = 1"
    if ($session -and $session.active_feature) {
        throw "Cannot close database: active feature '$($session.active_feature)' must be cleared before closing."
    }

    # Check no lock is held
    $lock = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT feature_name, pid FROM pipeline_lock LIMIT 1"
    if ($lock) {
        throw "Cannot close database: pipeline lock is held for feature '$($lock.feature_name)' (PID $($lock.pid)). Release the lock before closing."
    }

    $script:StateDbPath = $null
}
