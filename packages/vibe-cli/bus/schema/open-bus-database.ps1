function Open-BusDatabase {
    param([Parameter(Mandatory)][string]$Path, [scriptblock]$GetUtcNow = { [DateTime]::UtcNow })
    Import-Module PSSQLite -ErrorAction SilentlyContinue
    $conn = New-SQLiteConnection -DataSource $Path
    return $conn
}
$script:GetUtcNow = { [DateTime]::UtcNow }
