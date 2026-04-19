# Envelope value object for the bidirectional event bus.
# Invariants enforced at construction:
#   1. NoDuplicateEvtId   — EvtId must be > 0 and not already seen in this process
#   6. EvtIdMonotone      — EvtId must be strictly greater than the last seen EvtId

$script:_EventTypesData = $null

function _Get-AllEventTypes {
    if ($null -eq $script:_EventTypesData) {
        $psd1Path = "$PSScriptRoot/../event-types/event-types.psd1"
        $script:_EventTypesData = Import-PowerShellDataFile -Path $psd1Path
    }
    return $script:_EventTypesData.AllEventTypes
}

$script:_SeenEvtIds = [System.Collections.Generic.HashSet[int64]]::new()
$script:_LastEvtId  = [int64]0

function Reset-EnvelopeState {
    $script:_SeenEvtIds.Clear()
    $script:_LastEvtId = [int64]0
    # Force reload of event-types on next call (supports test isolation)
    $script:_EventTypesData = $null
}

function New-Envelope {
    param(
        [Parameter(Mandatory)][int64]$EvtId,
        [Parameter(Mandatory)][AllowEmptyString()][string]$From,
        [Parameter(Mandatory)][AllowEmptyString()][string]$To,
        [Parameter(Mandatory)][string]$Type,
        [string]$Payload    = $null,
        [int64]$InReplyTo   = 0,
        [string]$GroupId    = $null
    )

    # Validate EvtId > 0
    if ($EvtId -le 0) {
        throw 'EvtId must be positive'
    }

    # Validate From / To not empty
    if ([string]::IsNullOrEmpty($From)) {
        throw 'From cannot be empty'
    }
    if ([string]::IsNullOrEmpty($To)) {
        throw 'To cannot be empty'
    }

    # Validate Type is known
    $allTypes = _Get-AllEventTypes
    if ($Type -notin $allTypes) {
        throw "Unknown event type: $Type"
    }

    # NoDuplicateEvtId invariant
    if ($script:_SeenEvtIds.Contains($EvtId)) {
        throw "Duplicate EvtId: $EvtId"
    }

    # EvtIdMonotone invariant — must be strictly greater than last seen
    if ($EvtId -le $script:_LastEvtId) {
        throw 'EvtId violates monotone invariant'
    }

    # Record EvtId
    [void]$script:_SeenEvtIds.Add($EvtId)
    $script:_LastEvtId = $EvtId

    return @{
        EvtId      = $EvtId
        From       = $From
        To         = $To
        Type       = $Type
        Payload    = $Payload
        InReplyTo  = $InReplyTo
        GroupId    = $GroupId
        CreatedAt  = [DateTime]::UtcNow
    }
}

function Test-EnvelopeValid {
    param([Parameter(Mandatory)][hashtable]$Envelope)

    $required = @('EvtId','From','To','Type','Payload','InReplyTo','GroupId','CreatedAt')
    foreach ($key in $required) {
        if (-not $Envelope.ContainsKey($key)) {
            return $false
        }
    }

    if ($Envelope.EvtId -isnot [int64] -and $Envelope.EvtId -isnot [int] -and $Envelope.EvtId -isnot [long]) {
        return $false
    }

    return $true
}

function Get-EnvelopeJson {
    param([Parameter(Mandatory)][hashtable]$Envelope)

    $ordered = [ordered]@{
        EvtId     = $Envelope.EvtId
        From      = $Envelope.From
        To        = $Envelope.To
        Type      = $Envelope.Type
        Payload   = $Envelope.Payload
        InReplyTo = $Envelope.InReplyTo
        GroupId   = $Envelope.GroupId
        CreatedAt = $Envelope.CreatedAt.ToString('o')
    }

    return ($ordered | ConvertTo-Json -Compress)
}
