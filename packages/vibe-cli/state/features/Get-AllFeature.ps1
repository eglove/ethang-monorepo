function Get-AllFeature {
    [CmdletBinding()]
    param()

    Assert-StateDatabaseOpen

    $rows = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM features ORDER BY created_at"
    return $rows
}
