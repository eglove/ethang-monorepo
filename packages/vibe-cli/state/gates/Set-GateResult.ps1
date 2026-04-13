function Set-GateResult {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [string]$GateType,
        [string]$TaskId,
        [Parameter(Mandatory)]
        [string]$Status,
        [int]$Round = 1,
        [string]$VerdictJson
    )

    Assert-StateDatabaseOpen

    $now = (Get-Date).ToUniversalTime().ToString('o')
    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "INSERT INTO gate_results (feature_name, gate_type, task_id, status, round, verdict_json, created_at) VALUES (@f, @gt, @tid, @s, @r, @vj, @t)" -SqlParameters @{ f = $FeatureName; gt = $GateType; tid = $TaskId; s = $Status; r = $Round; vj = $VerdictJson; t = $now }
}
