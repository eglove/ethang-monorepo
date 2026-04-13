function Clear-ActiveFeature {
    [CmdletBinding()]
    param()

    Assert-StateDatabaseOpen

    $session = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT active_feature FROM session WHERE id = 1"
    if (-not $session -or [System.DBNull]::Value.Equals($session.active_feature)) {
        return  # nothing to clear
    }

    $featureName = $session.active_feature
    $feature = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT status FROM features WHERE name = @n" -SqlParameters @{ n = $featureName }
    if ($feature -and $feature.status -notin @('complete', 'halted')) {
        throw "Only terminal features (complete/halted) may be cleared. Feature '$featureName' has status '$($feature.status)'."
    }

    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "UPDATE session SET active_feature = NULL WHERE id = 1"
}
