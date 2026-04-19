. "$PSScriptRoot/../infra/evt-id-allocator.ps1"
$script:_RoutedIds = [System.Collections.Generic.HashSet[int64]]::new()

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
    if ($env:VIBE_BUS_COMMIT_IN_PROGRESS -eq '1') { throw 'LockHierarchyViolation: AppendEvent must not be called from pre-commit hooks' }
    $evtId = Get-NextEvtId
    if ($null -ne $DbExecutor) {
        $actualId = & $DbExecutor $Connection $From $To $InReplyTo $GroupId $Type $Payload
        if ($null -ne $actualId) { $evtId = $actualId }
    } else {
        $tx = $Connection.BeginTransaction([System.Data.IsolationLevel]::Unspecified)
        try {
            $cmd = $Connection.CreateCommand()
            $cmd.Transaction = $tx
            $cmd.CommandText = 'INSERT INTO event_log ("from","to",in_reply_to,group_id,type,payload,status) VALUES (@from,@to,@inReplyTo,@groupId,@type,@payload,''routed'')'
            $cmd.Parameters.AddWithValue('@from', $From) | Out-Null
            $cmd.Parameters.AddWithValue('@to', $To) | Out-Null
            $inReplyToVal = if ($InReplyTo -eq 0) { [DBNull]::Value } else { $InReplyTo }
            $groupIdVal   = if ([string]::IsNullOrEmpty($GroupId)) { [DBNull]::Value } else { $GroupId }
            $payloadVal   = if ([string]::IsNullOrEmpty($Payload)) { [DBNull]::Value } else { $Payload }
            $cmd.Parameters.AddWithValue('@inReplyTo', $inReplyToVal) | Out-Null
            $cmd.Parameters.AddWithValue('@groupId', $groupIdVal) | Out-Null
            $cmd.Parameters.AddWithValue('@type', $Type) | Out-Null
            $cmd.Parameters.AddWithValue('@payload', $payloadVal) | Out-Null
            $cmd.ExecuteNonQuery() | Out-Null
            $rowCmd = $Connection.CreateCommand()
            $rowCmd.Transaction = $tx
            $rowCmd.CommandText = 'SELECT last_insert_rowid()'
            $evtId = [int64]$rowCmd.ExecuteScalar()
            $rowCmd.Dispose()
            $cmd.Dispose()
            $tx.Commit()
        } catch {
            $tx.Rollback()
            throw
        } finally {
            $tx.Dispose()
        }
    }
    [void]$script:_RoutedIds.Add($evtId)
    return @{ EvtId = $evtId; Status = 'routed' }
}

function Reset-RouterState { $script:_RoutedIds.Clear() }
