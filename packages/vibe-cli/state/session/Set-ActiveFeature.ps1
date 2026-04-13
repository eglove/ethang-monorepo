function Set-ActiveFeature {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Name
    )

    Assert-StateDatabaseOpen

    # Verify feature exists
    $feature = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT name, status FROM features WHERE name = @n" -SqlParameters @{ n = $Name }
    if (-not $feature) {
        throw "Feature '$Name' does not exist."
    }

    # Check current active feature
    $session = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT active_feature FROM session WHERE id = 1"
    if ($session -and $session.active_feature) {
        $currentName = $session.active_feature
        if ($currentName -eq $Name) {
            return  # no-op if same feature
        }
        # Check if current feature is in a terminal state
        $currentFeature = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT status FROM features WHERE name = @n" -SqlParameters @{ n = $currentName }
        if ($currentFeature -and $currentFeature.status -notin @('complete', 'halted')) {
            throw "Active feature '$currentName' must reach a terminal status (complete/halted) before switching."
        }
    }

    $now = (Get-Date).ToUniversalTime().ToString('o')
    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "INSERT OR REPLACE INTO session (id, active_feature, started_at) VALUES (1, @n, @t)" -SqlParameters @{ n = $Name; t = $now }
}
