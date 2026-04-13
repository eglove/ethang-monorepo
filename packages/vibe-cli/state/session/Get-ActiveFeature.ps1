function Get-ActiveFeature {
    [CmdletBinding()]
    param()

    Assert-StateDatabaseOpen

    $session = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT active_feature FROM session WHERE id = 1"
    if (-not $session -or [System.DBNull]::Value.Equals($session.active_feature)) {
        return $null
    }
    return $session.active_feature
}
