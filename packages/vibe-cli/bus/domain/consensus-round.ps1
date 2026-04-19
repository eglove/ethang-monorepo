Import-Module PSSQLite -ErrorAction SilentlyContinue

function _Get-ConsensusKey {
    param($Connection, [string]$Key)
    $row = Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT value FROM consensus_state WHERE key = @k" -SqlParameters @{ k = $Key }
    if ($row) { return $row.value } else { return $null }
}

function _Set-ConsensusKey {
    param($Connection, [string]$Key, [string]$Value)
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query "UPDATE consensus_state SET value = @v WHERE key = @k" -SqlParameters @{ k = $Key; v = $Value }
}

function _Parse-JsonArray {
    param([string]$Json)
    if ([string]::IsNullOrWhiteSpace($Json) -or $Json -eq '[]') { return , @() }
    $arr = $Json | ConvertFrom-Json
    if ($null -eq $arr) { return , @() }
    return , @($arr)
}

function _Serialize-JsonArray {
    param([array]$Items)
    if ($null -eq $Items -or $Items.Count -eq 0) { return '[]' }
    return ($Items | ConvertTo-Json -Compress)
}

function Get-ConsensusRoundState {
    param([Parameter(Mandatory)]$Connection)
    $cs = _Get-ConsensusKey -Connection $Connection -Key 'consensusState'
    $re = _Get-ConsensusKey -Connection $Connection -Key 'consensusRoundStart'
    $uj = _Get-ConsensusKey -Connection $Connection -Key 'unresolvedObjections'
    $oj = _Get-ConsensusKey -Connection $Connection -Key 'overriddenObjections'
    $epoch = if ($re) { [int64]$re } else { 1 }
    return @{ ConsensusState=$cs; RoundEpoch=$epoch; UnresolvedObjections=(_Parse-JsonArray $uj); OverriddenObjections=(_Parse-JsonArray $oj) }
}

function Start-ConsensusRound {
    param([Parameter(Mandatory)]$Connection, [Parameter(Mandatory)][int64]$RoundEpochEvtId)
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query "UPDATE consensus_state SET value=@v WHERE key='consensusRoundStart' AND CAST(value AS INTEGER) <= @v" -SqlParameters @{v=$RoundEpochEvtId}
}

function Add-ConsensusObjection {
    param([Parameter(Mandatory)]$Connection, [Parameter(Mandatory)][int64]$EvtId)
    $json = _Get-ConsensusKey -Connection $Connection -Key 'unresolvedObjections'
    $arr = _Parse-JsonArray $json
    if ($arr -notcontains $EvtId) { $arr += $EvtId }
    _Set-ConsensusKey -Connection $Connection -Key 'unresolvedObjections' -Value (_Serialize-JsonArray $arr)
    return @($arr)
}

function Resolve-ConsensusObjection {
    param([Parameter(Mandatory)]$Connection, [Parameter(Mandatory)][int64]$EvtId)
    $json = _Get-ConsensusKey -Connection $Connection -Key 'unresolvedObjections'
    $arr = @(_Parse-JsonArray $json | Where-Object { $_ -ne $EvtId })
    _Set-ConsensusKey -Connection $Connection -Key 'unresolvedObjections' -Value (_Serialize-JsonArray $arr)
    return @($arr)
}

function Override-ConsensusObjection {
    param([Parameter(Mandatory)]$Connection, [Parameter(Mandatory)][int64]$EvtId)
    $uj = _Get-ConsensusKey -Connection $Connection -Key 'unresolvedObjections'
    $oj = _Get-ConsensusKey -Connection $Connection -Key 'overriddenObjections'
    $unresolved = @(_Parse-JsonArray $uj | Where-Object { $_ -ne $EvtId })
    $overridden = _Parse-JsonArray $oj
    if ($overridden -notcontains $EvtId) { $overridden += $EvtId }
    _Set-ConsensusKey -Connection $Connection -Key 'unresolvedObjections' -Value (_Serialize-JsonArray $unresolved)
    _Set-ConsensusKey -Connection $Connection -Key 'overriddenObjections' -Value (_Serialize-JsonArray $overridden)
    return @{ Unresolved=@($unresolved); Overridden=@($overridden) }
}

function Set-ConsensusStateCandidate {
    param([Parameter(Mandatory)]$Connection)
    _Set-ConsensusKey -Connection $Connection -Key 'consensusState' -Value 'candidate'
}

function Set-ConsensusRatified {
    param([Parameter(Mandatory)]$Connection)
    $unresolved = _Parse-JsonArray (_Get-ConsensusKey -Connection $Connection -Key 'unresolvedObjections')
    if ($unresolved.Count -gt 0) { throw "RatificationRequiresNoUnoverriddenObjections: $($unresolved.Count) unresolved" }
    _Set-ConsensusKey -Connection $Connection -Key 'consensusState' -Value 'ratified'
}

function Set-ConsensusFailed {
    param([Parameter(Mandatory)]$Connection)
    _Set-ConsensusKey -Connection $Connection -Key 'consensusState' -Value 'failed'
}

function Invoke-AdvanceRoundEpoch {
    param([Parameter(Mandatory)]$Connection, [Parameter(Mandatory)][int64]$NewEpochEvtId)
    $current = [int64](_Get-ConsensusKey -Connection $Connection -Key 'consensusRoundStart')
    if ($NewEpochEvtId -le $current) { throw "ConsensusRoundStartMonotone: $NewEpochEvtId <= $current" }
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query "UPDATE consensus_state SET value=@v WHERE key='consensusRoundStart'" -SqlParameters @{v=$NewEpochEvtId}
    _Set-ConsensusKey -Connection $Connection -Key 'consensusState' -Value 'open'
    _Set-ConsensusKey -Connection $Connection -Key 'unresolvedObjections' -Value '[]'
    _Set-ConsensusKey -Connection $Connection -Key 'overriddenObjections' -Value '[]'
}
