. "$PSScriptRoot/routing-rules.ps1"
. "$PSScriptRoot/router.ps1"
Import-Module PSSQLite -ErrorAction SilentlyContinue

$script:_EventTypesData = $null
$script:_BusEvtCounter = 0

function _Get-EventTypesData {
    if ($null -eq $script:_EventTypesData) {
        $script:_EventTypesData = Import-PowerShellDataFile "$PSScriptRoot/../event-types/event-types.psd1"
    }
    return $script:_EventTypesData
}

function Send-BusEvent {
    [CmdletBinding(DefaultParameterSetName = 'Connection')]
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [Parameter(Mandatory, ParameterSetName = 'Connection')]$Connection,
        [Parameter(Mandatory, ParameterSetName = 'Connection')][string]$From,
        [Parameter(Mandatory, ParameterSetName = 'Connection')][string]$FromRole,
        [Parameter(Mandatory, ParameterSetName = 'Connection')][string]$Type,
        [Parameter(ParameterSetName = 'Connection')][string]$To          = $null,
        [Parameter(ParameterSetName = 'Connection')][string]$Payload     = $null,
        [Parameter(ParameterSetName = 'Connection')][int64]$InReplyTo    = 0,
        [Parameter(ParameterSetName = 'Connection')][string]$GroupId     = $null,
        [Parameter(ParameterSetName = 'Connection')][string]$ActiveModeratorName = $null,
        [Parameter(ParameterSetName = 'Connection')]
        [Parameter(ParameterSetName = 'DbPath')]
        [scriptblock]$DbExecutor = $null,

        [Parameter(Mandatory, ParameterSetName = 'DbPath')]
        [hashtable]$Event,
        [Parameter(ParameterSetName = 'DbPath')]
        [string]$DbPath
    )

    if ($PSCmdlet.ParameterSetName -eq 'DbPath') {
        $resolvedDb = if ($DbPath) { $DbPath } elseif ($script:_BusDbPath) { $script:_BusDbPath } else { $null }

        if (-not $resolvedDb) {
            $script:_BusEvtCounter++
            return $script:_BusEvtCounter
        }

        $evt_id = [System.Threading.Interlocked]::Increment([ref]$script:_BusEvtCounter)
        $payload = $Event | ConvertTo-Json -Compress -Depth 5
        $eventType = if ($Event.EventType) { $Event.EventType } else { 'bus_event' }
        $fromVal = if ($Event.From) { $Event.From } else { 'pipeline' }
        $toVal   = if ($Event.To)   { $Event.To }   else { 'bus' }
        $ts      = [datetime]::UtcNow.ToString('o')

        Invoke-SqliteQuery -DataSource $resolvedDb -Query @"
INSERT INTO event_log (evt_id, [from], [to], event_type, payload, status, created_at)
VALUES (@id, @f, @t, @et, @pl, 'routed', @ca)
"@ -SqlParameters @{ id = $evt_id; f = $fromVal; t = $toVal; et = $eventType; pl = $payload; ca = $ts } | Out-Null

        return $evt_id
    }

    # Connection (production) flow
    $etData = _Get-EventTypesData
    if ($etData.AllEventTypes -notcontains $Type) {
        throw "UnknownEventType: '$Type' is not a recognized event type"
    }

    if (-not (Test-TypeSenderACL -SenderRole $FromRole -EventType $Type)) {
        throw "ACLViolation: role '$FromRole' is not authorized to send event type '$Type'"
    }

    $resolvedTarget = Resolve-EventTarget -EventType $Type -ExplicitTo $To -ActiveModeratorName $ActiveModeratorName -SenderName $From
    $targetTo = if ($resolvedTarget -eq 'broadcast') { 'broadcast' } else { $resolvedTarget }

    $appendParams = @{
        Connection  = $Connection
        From        = $From
        To          = $targetTo
        Type        = $Type
        InReplyTo   = $InReplyTo
        DbExecutor  = $DbExecutor
    }
    if ($null -ne $Payload) { $appendParams['Payload'] = $Payload }
    if ($null -ne $GroupId) { $appendParams['GroupId'] = $GroupId }

    return Invoke-BusAppendEvent @appendParams
}

function Send-GroundTruth {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [string]$AgentId,
        [hashtable]$Payload,
        [scriptblock]$DbExecutor,
        [string]$DbPath
    )

    $resolvedDb = if ($DbPath) { $DbPath } elseif ($script:_BusDbPath) { $script:_BusDbPath } else { $null }

    if ($resolvedDb) {
        Invoke-SqliteQuery -DataSource $resolvedDb -Query @"
UPDATE agent_sessions SET ground_truth_delivered=1 WHERE agent_id=@aid
"@ -SqlParameters @{ aid = $AgentId } | Out-Null
    }
}

function Reset-BusEventCounter {
    $script:_BusEvtCounter = 0
}

function Reset-SendBusEventState {
    $script:_EventTypesData = $null
    Reset-RouterState
    $script:_BusEvtCounter = 0
}
