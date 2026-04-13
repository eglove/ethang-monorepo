function Get-Feature {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Name
    )

    Assert-StateDatabaseOpen

    $row = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT * FROM features WHERE name = @n" -SqlParameters @{ n = $Name }
    return $row
}
