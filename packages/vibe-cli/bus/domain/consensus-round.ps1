Import-Module PSSQLite -ErrorAction SilentlyContinue

# Dispatches to -DataSource when $Connection is a string path, else -SQLiteConnection.
function _Invoke-ConsensusQuery {
    param($Connection, [string]$Query, [hashtable]$SqlParameters = @{})
    if ($Connection -is [string]) {
        return Invoke-SqliteQuery -DataSource $Connection -Query $Query -SqlParameters $SqlParameters
    }
    return Invoke-SqliteQuery -SQLiteConnection $Connection -Query $Query -SqlParameters $SqlParameters
}

function _Get-ConsensusKey {
    param($Connection, [string]$Key)
    $row = _Invoke-ConsensusQuery -Connection $Connection -Query "SELECT value FROM consensus_state WHERE key = @k" -SqlParameters @{ k = $Key }
    if ($row) { return $row.value } else { return $null }
}

function _Set-ConsensusKey {
    param($Connection, [string]$Key, [string]$Value)
    _Invoke-ConsensusQuery -Connection $Connection -Query "UPDATE consensus_state SET value = @v WHERE key = @k" -SqlParameters @{ k = $Key; v = $Value }
}

function _Parse-JsonArray {
    param([string]$Json)
    if ([string]::IsNullOrWhiteSpace($Json) -or $Json -eq '[]') { return , @() }
    $arr = $Json | ConvertFrom-Json
    if ($null -eq $arr) { return , @() }
    return , @($arr)   # unary comma prevents single-element unwrap; caller otherwise gets scalar for '[7]'.
}

function _Serialize-JsonArray {
    param([array]$Items)
    if ($null -eq $Items -or $Items.Count -eq 0) { return '[]' }
    return '[' + (($Items | ForEach-Object { [int64]$_ }) -join ',') + ']'
}

function Get-ConsensusRoundState {
    param([Parameter(Mandatory)]$Connection)
    $cs = _Get-ConsensusKey -Connection $Connection -Key 'consensusState'
    $re = _Get-ConsensusKey -Connection $Connection -Key 'consensusRoundStart'
    $uj = _Get-ConsensusKey -Connection $Connection -Key 'unresolvedObjections'
    $oj = _Get-ConsensusKey -Connection $Connection -Key 'overriddenObjections'
    $epoch = if ($re) { [int64]$re } else { 1 }
    return @{
        ConsensusState       = if ($cs) { $cs } else { 'open' }
        RoundEpoch           = $epoch
        UnresolvedObjections = (_Parse-JsonArray $uj)
        OverriddenObjections = (_Parse-JsonArray $oj)
    }
}

function Start-ConsensusRound {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][int64]$RoundEpochEvtId
    )
    _Invoke-ConsensusQuery -Connection $Connection `
        -Query "UPDATE consensus_state SET value=@v WHERE key='consensusRoundStart' AND CAST(value AS INTEGER) <= @v" `
        -SqlParameters @{ v = $RoundEpochEvtId }
}

function Add-ConsensusObjection {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][int64]$ObjectionEvtId
    )
    $json = _Get-ConsensusKey -Connection $Connection -Key 'unresolvedObjections'
    $arr = _Parse-JsonArray $json
    if ($arr -notcontains $ObjectionEvtId) { $arr += $ObjectionEvtId }
    _Set-ConsensusKey -Connection $Connection -Key 'unresolvedObjections' -Value (_Serialize-JsonArray $arr)
    return @($arr)
}

function Resolve-ConsensusObjection {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][int64]$ObjectionEvtId
    )
    $json = _Get-ConsensusKey -Connection $Connection -Key 'unresolvedObjections'
    $current = _Parse-JsonArray $json
    $arr = @($current | Where-Object { $_ -ne $ObjectionEvtId })
    _Set-ConsensusKey -Connection $Connection -Key 'unresolvedObjections' -Value (_Serialize-JsonArray $arr)
    return @($arr)
}

function Override-ConsensusObjection {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][int64]$ObjectionEvtId
    )
    $uj = _Get-ConsensusKey -Connection $Connection -Key 'unresolvedObjections'
    $oj = _Get-ConsensusKey -Connection $Connection -Key 'overriddenObjections'
    $overridden = _Parse-JsonArray $oj
    if ($overridden -contains $ObjectionEvtId) {
        throw "ObjectionAlreadyOverridden: evtId=$ObjectionEvtId"
    }
    $currentUnresolved = _Parse-JsonArray $uj
    $unresolved = @($currentUnresolved | Where-Object { $_ -ne $ObjectionEvtId })
    $overridden = @($overridden) + $ObjectionEvtId
    _Set-ConsensusKey -Connection $Connection -Key 'unresolvedObjections' -Value (_Serialize-JsonArray $unresolved)
    _Set-ConsensusKey -Connection $Connection -Key 'overriddenObjections' -Value (_Serialize-JsonArray $overridden)
    return @{ Unresolved = @($unresolved); Overridden = @($overridden) }
}

function Set-ConsensusStateCandidate {
    param(
        [Parameter(Mandatory)]$Connection,
        [int64]$CandidateEvtId = 0
    )
    $null = $CandidateEvtId   # caller-supplied causal marker (audit trail); state transition is unconditional
    _Set-ConsensusKey -Connection $Connection -Key 'consensusState' -Value 'candidate'
}

function Set-ConsensusRatified {
    param(
        [Parameter(Mandatory)]$Connection,
        [int64]$RatificationEvtId = 0
    )
    $null = $RatificationEvtId
    $unresolved = _Parse-JsonArray (_Get-ConsensusKey -Connection $Connection -Key 'unresolvedObjections')
    if ($unresolved.Count -gt 0) {
        throw "ConsensusHasUnresolvedObjections: $($unresolved.Count) unresolved"
    }
    _Set-ConsensusKey -Connection $Connection -Key 'consensusState' -Value 'ratified'
}

function Set-ConsensusFailed {
    param([Parameter(Mandatory)]$Connection)
    _Set-ConsensusKey -Connection $Connection -Key 'consensusState' -Value 'failed'
}

function Invoke-AdvanceRoundEpoch {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][int64]$NewEvtId
    )
    $current = [int64](_Get-ConsensusKey -Connection $Connection -Key 'consensusRoundStart')
    if ($NewEvtId -le $current) { return }   # ConsensusRoundStartMonotone: silent no-op
    _Invoke-ConsensusQuery -Connection $Connection `
        -Query "UPDATE consensus_state SET value=@v WHERE key='consensusRoundStart'" `
        -SqlParameters @{ v = $NewEvtId }
    _Set-ConsensusKey -Connection $Connection -Key 'consensusState' -Value 'open'
    _Set-ConsensusKey -Connection $Connection -Key 'unresolvedObjections' -Value '[]'
    _Set-ConsensusKey -Connection $Connection -Key 'overriddenObjections' -Value '[]'
}
