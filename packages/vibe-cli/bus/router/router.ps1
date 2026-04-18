$script:_RoutedIds = [System.Collections.Generic.HashSet[int64]]::new()

. "$PSScriptRoot/../infra/evt-id-allocator.ps1"

function Invoke-BusAppendEvent {
    param(
        $Connection,
        [string]$From,
        [string]$To,
        [string]$Type,
        [string]$Payload = $null,
        [int64]$InReplyTo = 0,
        [string]$GroupId = $null,
        [scriptblock]$DbExecutor = $null
    )
    if ($env:VIBE_BUS_COMMIT_IN_PROGRESS -eq '1') {
        throw 'LockHierarchyViolation: AppendEvent must not be called from pre-commit hooks'
    }
    $evtId = Get-NextEvtId
    if ($null -ne $DbExecutor) {
        $actualId = & $DbExecutor $Connection $From $To $InReplyTo $GroupId $Type $Payload
        if ($null -ne $actualId) { $evtId = $actualId }
    } else {
        $cmd = $Connection.CreateCommand()
        $cmd.CommandText = 'INSERT INTO event_log ("from","to",in_reply_to,group_id,type,payload,status) VALUES (@from,@to,@inReplyTo,@groupId,@type,@payload,''routed'')'
        $cmd.Parameters.AddWithValue('@from', $From) | Out-Null
        $cmd.Parameters.AddWithValue('@to', $To) | Out-Null
        $cmd.Parameters.AddWithValue('@inReplyTo', (if ($InReplyTo -eq 0) { [DBNull]::Value } else { $InReplyTo })) | Out-Null
        $cmd.Parameters.AddWithValue('@groupId', (if ([string]::IsNullOrEmpty($GroupId)) { [DBNull]::Value } else { $GroupId })) | Out-Null
        $cmd.Parameters.AddWithValue('@type', $Type) | Out-Null
        $cmd.Parameters.AddWithValue('@payload', (if ([string]::IsNullOrEmpty($Payload)) { [DBNull]::Value } else { $Payload })) | Out-Null
        $cmd.ExecuteNonQuery() | Out-Null
        $rowCmd = $Connection.CreateCommand()
        $rowCmd.CommandText = 'SELECT last_insert_rowid()'
        $evtId = $rowCmd.ExecuteScalar()
        $rowCmd.Dispose()
        $cmd.Dispose()
    }
    [void]$script:_RoutedIds.Add($evtId)
    return @{ EvtId = $evtId; Status = 'routed' }
}

function Reset-RouterState { $script:_RoutedIds.Clear() }
