# CommitSerializer Aggregate — owns: acquire VibeBus-Commit-<w>, call WorkingTreeCoordinator.Invoke-GitCommit,
# update event_log status, release lock.
# Does NOT own: snapshot integrity, SQLite state reset, drain check (RollbackCoordinator).

$script:_LastCommittedEvtId = [int64]0

function Reset-CommitSerializerState { $script:_LastCommittedEvtId = [int64]0 }
function Get-LastCommittedEvtId { return $script:_LastCommittedEvtId }

function Invoke-BusCommit {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$WorktreeLeaf,
        [Parameter(Mandatory)][int64]$EvtId,         # the event to mark as committed
        [Parameter(Mandatory)][string]$CommitMessage,
        [hashtable]$Coordinator = $null,              # WorkingTreeCoordinator; if null, create one
        [scriptblock]$GitInvoker = $null,             # injectable git for tests
        [scriptblock]$GetUtcNow = $null
    )

    # InvCommitOrdering check: BEFORE acquiring the mutex (OBJ-R6-4)
    if ($EvtId -le $script:_LastCommittedEvtId) {
        throw "InvCommitOrdering: EvtId $EvtId must be > last committed $script:_LastCommittedEvtId"
    }

    $session = Start-WriteSession -WorktreeLeaf $WorktreeLeaf -GetUtcNow $GetUtcNow

    try {
        # Create coordinator if not provided
        if (-not $Coordinator) {
            $Coordinator = New-WorkingTreeCoordinator -WorktreeLeaf $WorktreeLeaf -GitInvoker $GitInvoker
        }

        # Call git commit
        Invoke-GitCommit -Coordinator $Coordinator -Message $CommitMessage | Out-Null

        # Update event_log status using raw SQLiteCommand so trigger fires
        $cmd = $Connection.CreateCommand()
        $cmd.CommandText = "UPDATE event_log SET status='committed' WHERE evt_id=@evtId"
        $p = $cmd.CreateParameter(); $p.ParameterName = '@evtId'; $p.Value = $EvtId; $cmd.Parameters.Add($p) | Out-Null
        $cmd.ExecuteNonQuery() | Out-Null
        $cmd.Dispose()

        $script:_LastCommittedEvtId = $EvtId

        Complete-WriteSession -SessionId $session.SessionId
    }
    catch {
        Fail-WriteSession -SessionId $session.SessionId -Reason $_.Exception.Message
        throw
    }

    return @{
        EvtId         = $EvtId
        Status        = 'committed'
        CommitMessage = $CommitMessage
    }
}
