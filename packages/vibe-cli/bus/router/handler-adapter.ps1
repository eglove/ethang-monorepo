# Handler Adapter Interface + Dispatch Logic

$script:_EventTypesData = $null

function _GetEventTypes {
    if ($null -eq $script:_EventTypesData) {
        $psd1Path = Join-Path $PSScriptRoot '../event-types/event-types.psd1'
        if (Test-Path $psd1Path) {
            $script:_EventTypesData = Import-PowerShellDataFile -Path $psd1Path
        } else {
            # Fallback inline definition
            $script:_EventTypesData = @{
                AllEventTypes = @('bootstrap', 'ground_truth', 'done', 'objection', 'objection_response',
                                  'consensus_candidate', 'consensus_ratified', 'consensus_failed',
                                  'verify', 'verify_result', 'review_requested', 'review_verdict',
                                  'checkpoint', 'checkpoint_response', 'protocol_error', 'protocol_error_ack')
                ProtocolError = @('protocol_error', 'protocol_error_ack')
            }
        }
    }
    return $script:_EventTypesData
}

function Invoke-HandlerAdapter {
    <#
    .SYNOPSIS
        Dispatches an event envelope to the appropriate registered handler.
    .PARAMETER Envelope
        Hashtable with keys: EvtId, From, To, Type, Payload, etc.
    .PARAMETER HandlerMap
        Hashtable mapping event type strings to scriptblocks.
    .PARAMETER OnProtocolError
        Optional scriptblock invoked when Type is 'protocol_error' or 'protocol_error_ack'.
    #>
    param(
        [Parameter(Mandatory)][hashtable]$Envelope,
        [Parameter(Mandatory)][hashtable]$HandlerMap,
        [scriptblock]$OnProtocolError = $null
    )

    $eventTypes = _GetEventTypes
    $allTypes = $eventTypes.AllEventTypes
    $protocolErrorTypes = $eventTypes.ProtocolError

    $evtType = $Envelope.Type

    # Validate: must be a known event type
    if ($evtType -notin $allTypes) {
        throw "Unknown event type: '$evtType'. Valid types: $($allTypes -join ', ')"
    }

    # ProtocolError split: route protocol_error and protocol_error_ack exclusively to $OnProtocolError
    if ($evtType -in $protocolErrorTypes) {
        if ($null -ne $OnProtocolError) {
            $OnProtocolError.Invoke($Envelope) | Out-Null
            return @{ Handled = $true; Result = $null }
        } else {
            Write-PipelineLog -Severity 'ALARM' -Message "protocol_error event received but no OnProtocolError handler registered (evt_id=$($Envelope.EvtId))"
            return @{ Handled = $false; Reason = 'no_protocol_error_handler' }
        }
    }

    # Look up handler in HandlerMap
    $handler = $HandlerMap[$evtType]
    if ($null -eq $handler) {
        return @{ Handled = $false; Reason = 'no_handler_registered' }
    }

    # Invoke handler, catching any exceptions
    try {
        $handlerResult = $handler.Invoke($Envelope)
        return @{ Handled = $true; Result = $handlerResult }
    } catch {
        Write-PipelineLog -Severity 'ERROR' -Message "Handler exception for type='$evtType' evt_id=$($Envelope.EvtId): $($_.Exception.Message)"
        return @{ Handled = $false; Reason = 'handler_exception'; Error = $_.Exception.Message }
    }
}

function New-HandlerMap {
    <#
    .SYNOPSIS
        Builds a handler map from named handler scriptblocks.
    .PARAMETER TlcHandler
        Scriptblock handling 'verify' events.
    .PARAMETER TestsHandler
        Scriptblock handling 'review_requested' events.
    .PARAMETER GitHandler
        Scriptblock handling 'checkpoint' events.
    #>
    param(
        [scriptblock]$TlcHandler   = $null,
        [scriptblock]$TestsHandler = $null,
        [scriptblock]$GitHandler   = $null
    )

    return @{
        'verify'           = $TlcHandler
        'verify_result'    = $null
        'review_requested' = $TestsHandler
        'review_verdict'   = $null
        'checkpoint'       = $GitHandler
        'checkpoint_response' = $null
    }
}
