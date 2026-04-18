. "$PSScriptRoot/routing-rules.ps1"
. "$PSScriptRoot/router.ps1"

$script:_EventTypesData = $null

function _Get-EventTypesData {
    if ($null -eq $script:_EventTypesData) {
        $script:_EventTypesData = Import-PowerShellDataFile "$PSScriptRoot/../event-types/event-types.psd1"
    }
    return $script:_EventTypesData
}

function Send-BusEvent {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$From,
        [Parameter(Mandatory)][string]$FromRole,
        [Parameter(Mandatory)][string]$Type,
        [string]$To          = $null,
        [string]$Payload     = $null,
        [int64]$InReplyTo    = 0,
        [string]$GroupId     = $null,
        [string]$ActiveModeratorName = $null,
        [scriptblock]$DbExecutor = $null
    )

    # Step 1: Validate type is known
    $etData = _Get-EventTypesData
    if ($etData.AllEventTypes -notcontains $Type) {
        throw "UnknownEventType: '$Type' is not a recognized event type"
    }

    # Step 2: Check TypeSenderACL
    if (-not (Test-TypeSenderACL -SenderRole $FromRole -EventType $Type)) {
        throw "ACLViolation: role '$FromRole' is not authorized to send event type '$Type'"
    }

    # Step 3: Resolve target
    $resolvedTarget = Resolve-EventTarget -EventType $Type -ExplicitTo $To -ActiveModeratorName $ActiveModeratorName -SenderName $From

    # For broadcast: store 'broadcast' as To
    $targetTo = if ($resolvedTarget -eq 'broadcast') { 'broadcast' } else { $resolvedTarget }

    # Step 4: Append event
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

function Reset-SendBusEventState {
    $script:_EventTypesData = $null
    Reset-RouterState
}
