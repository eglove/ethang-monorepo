. "$PSScriptRoot/../infra/evt-id-allocator.ps1"
$script:_RoutedIds = [System.Collections.Generic.HashSet[int64]]::new()
function Invoke-BusAppendEvent {
    param(
        $Connection,
        [string]$From,
        [string]$To,
        [string]$Type,
        [string]$Payload=$null,
        [int64]$InReplyTo=0,
        [string]$GroupId=$null,
        [scriptblock]$DbExecutor=$null
    )
    $evtId = Get-NextEvtId
    if ($null -ne $DbExecutor) {
        $r = & $DbExecutor $Connection $From $To $InReplyTo $GroupId $Type $Payload
        if ($null -ne $r) { $evtId = $r }
    } else {
        $tx = $Connection.BeginTransaction([System.Data.IsolationLevel]::Unspecified)
        try {
            $cmd = $Connection.CreateCommand()
            $cmd.Transaction = $tx
            $cmd.CommandText = 'INSERT INTO event_log ("from","to",in_reply_to,group_id,type,payload,status) VALUES (@f,@t,@ir,@gi,@ty,@p,''routed'')'
            $cmd.Parameters.AddWithValue('@f', $From) | Out-Null
            $cmd.Parameters.AddWithValue('@t', $To) | Out-Null
            $irVal = if ($InReplyTo -eq 0) { [DBNull]::Value } else { $InReplyTo }
            $cmd.Parameters.AddWithValue('@ir', $irVal) | Out-Null
            $giVal = if ([string]::IsNullOrEmpty($GroupId)) { [DBNull]::Value } else { $GroupId }
            $cmd.Parameters.AddWithValue('@gi', $giVal) | Out-Null
            $cmd.Parameters.AddWithValue('@ty', $Type) | Out-Null
            $pVal = if ([string]::IsNullOrEmpty($Payload)) { [DBNull]::Value } else { $Payload }
            $cmd.Parameters.AddWithValue('@p', $pVal) | Out-Null
            $cmd.ExecuteNonQuery() | Out-Null
            $r2 = $Connection.CreateCommand()
            $r2.Transaction = $tx
            $r2.CommandText = 'SELECT last_insert_rowid()'
            $evtId = [int64]$r2.ExecuteScalar()
            $r2.Dispose()
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
    return @{ EvtId=$evtId; Status='routed' }
}
function Reset-RouterState { $script:_RoutedIds.Clear() }
