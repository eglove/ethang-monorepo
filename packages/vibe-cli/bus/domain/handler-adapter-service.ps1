# Handler Adapter Domain Service Coordinator

function Invoke-HandlerAdapterService {
    <#
    .SYNOPSIS
        Coordinates handler execution with event_log status updates.
    .PARAMETER Connection
        SQLite connection object.
    .PARAMETER Envelope
        Event envelope hashtable with at minimum EvtId and Type.
    .PARAMETER HandlerMap
        Hashtable mapping event type strings to handler scriptblocks.
    .PARAMETER OnProtocolError
        Optional scriptblock for protocol error events.
    .PARAMETER AppendEventExecutor
        Injectable scriptblock for testing event appending. Not used for status updates.
    #>
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][hashtable]$Envelope,
        [Parameter(Mandatory)][hashtable]$HandlerMap,
        [scriptblock]$OnProtocolError      = $null,
        [scriptblock]$AppendEventExecutor  = $null
    )

    $adapterResult = Invoke-HandlerAdapter -Envelope $Envelope -HandlerMap $HandlerMap -OnProtocolError $OnProtocolError

    if ($adapterResult.Handled -eq $true) {
        # Update status from 'routed' to 'committed'
        _UpdateEventStatus -Connection $Connection -EvtId $Envelope.EvtId -NewStatus 'committed'
        return @{
            EvtId         = $Envelope.EvtId
            Status        = 'committed'
            HandlerResult = $adapterResult.Result
        }
    } elseif ($adapterResult.Reason -eq 'handler_exception') {
        # Update status to 'delivery_failed'
        _UpdateEventStatus -Connection $Connection -EvtId $Envelope.EvtId -NewStatus 'delivery_failed'
        Write-PipelineLog -Severity 'ERROR' -Message "Handler failed for evt_id=$($Envelope.EvtId)"
        return @{
            EvtId         = $Envelope.EvtId
            Status        = 'delivery_failed'
            HandlerResult = $null
        }
    } else {
        # Not handled (no handler registered, protocol error without callback, etc.)
        return @{
            EvtId         = $Envelope.EvtId
            Status        = 'unhandled'
            HandlerResult = $null
            Reason        = $adapterResult.Reason
        }
    }
}

function _UpdateEventStatus {
    param(
        $Connection,
        [int64]$EvtId,
        [string]$NewStatus
    )
    # Use raw SQLiteCommand to respect trigger constraints (not PSSQLite Invoke-SqliteQuery)
    $cmd = $Connection.CreateCommand()
    $cmd.CommandText = "UPDATE event_log SET status = @status WHERE evt_id = @id"
    $null = $cmd.Parameters.AddWithValue('@status', $NewStatus)
    $null = $cmd.Parameters.AddWithValue('@id', $EvtId)
    try {
        $cmd.ExecuteNonQuery() | Out-Null
    } finally {
        $cmd.Dispose()
    }
}
