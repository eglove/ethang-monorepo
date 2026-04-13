function New-Feature {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Name
    )

    Assert-StateDatabaseOpen

    if ([string]::IsNullOrWhiteSpace($Name)) {
        throw "Feature name must be a non-empty string."
    }

    $existing = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT name FROM features WHERE name = @n" -SqlParameters @{ n = $Name }
    if ($existing) {
        throw "Feature '$Name' already exists. Feature name must be unique."
    }

    $now = (Get-Date).ToUniversalTime().ToString('o')
    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "INSERT INTO features (name, created_at, status) VALUES (@n, @t, 'idle')" -SqlParameters @{ n = $Name; t = $now }
}
