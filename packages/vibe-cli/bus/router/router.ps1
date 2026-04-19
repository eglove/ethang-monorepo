# bus/router/router.ps1
# Bus router — core append and state management.
#
# Supports two call styles for Invoke-BusAppendEvent:
#  - Connection:  production flow, passes an open ADO.NET SqliteConnection.
#  - DbPath:      property-test flow, opens PSSQLite against a file path.
#
# Both paths share the same ACL tables and halt-monotone latch so the TLA+
# invariants (InvEventIds, InvAclCompliant, InvHaltMonotone) hold uniformly.

. "$PSScriptRoot/../infra/evt-id-allocator.ps1"
Import-Module PSSQLite -ErrorAction SilentlyContinue

$script:_RoutedIds = [System.Collections.Generic.HashSet[int64]]::new()

# ---------------------------------------------------------------------------
# ACL tables (mirror of TLA+ TypeSenderACL)
# ---------------------------------------------------------------------------
$script:_RouterAclFrom = @{
    'bootstrap'          = @('router')
    'ground_truth'       = @('router')
    'checkpoint'         = @('router')
    'protocol_error'     = @('router')
    'consensus_ratified' = @('router', 'orchestrator')
    'consensus_failed'   = @('router', 'orchestrator')
    'done'               = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'objection'          = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'objection_response' = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'consensus_candidate'= @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'checkpoint_response'= @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'protocol_error_ack' = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'review_requested'   = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'review_verdict'     = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'verify'             = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'verify_result'      = @('tlc', 'tests', 'git')
}

$script:_RouterAclTo = @{
    'bootstrap'          = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'ground_truth'       = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'checkpoint'         = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'protocol_error'     = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'verify_result'      = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'review_verdict'     = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'done'               = @('router', 'orchestrator')
    'objection'          = @('router', 'orchestrator')
    'objection_response' = @('router', 'orchestrator')
    'consensus_candidate'= @('router', 'orchestrator')
    'checkpoint_response'= @('router', 'orchestrator')
    'protocol_error_ack' = @('router', 'orchestrator')
    'consensus_ratified' = @('broadcast')
    'consensus_failed'   = @('broadcast')
    'verify'             = @('tlc', 'tests', 'git')
    'review_requested'   = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer', 'broadcast')
}

$script:_RouterValidEventTypes = @(
    'bootstrap', 'ground_truth', 'done', 'objection', 'objection_response',
    'consensus_candidate', 'consensus_ratified', 'consensus_failed',
    'verify', 'verify_result', 'review_requested', 'review_verdict',
    'checkpoint', 'checkpoint_response', 'protocol_error', 'protocol_error_ack'
)

$script:_RouterHaltedByDb = @{}
$script:_RouterHaltTypes = @('consensus_ratified', 'consensus_failed')

# ---------------------------------------------------------------------------
# Initialize-RouterDatabase (T33a property-test flow)
# Creates event_log and agent_sessions tables in a SQLite file.
# ---------------------------------------------------------------------------
function Initialize-RouterDatabase {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [Parameter(Mandatory)]
        [string]$DbPath
    )

    $ddl = @(
        "CREATE TABLE IF NOT EXISTS event_log (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            evt_id     INTEGER NOT NULL,
            [from]     TEXT NOT NULL,
            [to]       TEXT NOT NULL,
            event_type TEXT NOT NULL,
            payload    TEXT,
            status     TEXT NOT NULL DEFAULT 'routed',
            created_at TEXT NOT NULL
        )",
        "CREATE TABLE IF NOT EXISTS agent_sessions (
            session_id            TEXT PRIMARY KEY,
            agent_id              TEXT NOT NULL,
            role                  TEXT NOT NULL,
            status                TEXT NOT NULL DEFAULT 'active',
            started_at            TEXT NOT NULL,
            ended_at              TEXT,
            ground_truth_delivered INTEGER NOT NULL DEFAULT 0
        )"
    )
    foreach ($sql in $ddl) {
        Invoke-SqliteQuery -DataSource $DbPath -Query $sql | Out-Null
    }
}

# ---------------------------------------------------------------------------
# Reset-RouterState
# No-arg form: clears the in-memory routed-id set (production flow).
# -DbPath form: also clears event_log and halt latch for that DB (tests).
# ---------------------------------------------------------------------------
function Reset-RouterState {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [string]$DbPath
    )
    $script:_RoutedIds.Clear()
    if ($PSBoundParameters.ContainsKey('DbPath') -and $DbPath) {
        Invoke-SqliteQuery -DataSource $DbPath -Query "DELETE FROM event_log" | Out-Null
        $script:_RouterHaltedByDb[$DbPath] = $false
    }
}

# ---------------------------------------------------------------------------
# _Test-RouterAcl — internal ACL check shared by both call styles.
# ---------------------------------------------------------------------------
function _Test-RouterAcl {
    param(
        [string]$EventType,
        [string]$From,
        [string]$To
    )
    if (-not $script:_RouterAclFrom.ContainsKey($EventType)) { return $false }
    if ($From -notin $script:_RouterAclFrom[$EventType]) { return $false }
    if ($To   -notin $script:_RouterAclTo[$EventType])   { return $false }
    return $true
}

# ---------------------------------------------------------------------------
# Invoke-BusAppendEvent
# Production (Connection): takes open SqliteConnection + explicit fields.
# Property-test (DbPath):  takes a DB file path + an Envelope hashtable.
# ---------------------------------------------------------------------------
function Invoke-BusAppendEvent {
    [CmdletBinding(DefaultParameterSetName = 'Connection')]
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [Parameter(ParameterSetName = 'Connection')]
        $Connection,
        [Parameter(ParameterSetName = 'Connection')]
        [string]$From,
        [Parameter(ParameterSetName = 'Connection')]
        [AllowNull()]
        [AllowEmptyString()]
        $To,
        [Parameter(ParameterSetName = 'Connection')]
        [string]$Type,
        [Parameter(ParameterSetName = 'Connection')]
        [string]$Payload = $null,
        [Parameter(ParameterSetName = 'Connection')]
        [int64]$InReplyTo = 0,
        [Parameter(ParameterSetName = 'Connection')]
        [string]$GroupId = $null,
        [Parameter(ParameterSetName = 'Connection')]
        [scriptblock]$DbExecutor = $null,

        [Parameter(Mandatory, ParameterSetName = 'DbPath')]
        [string]$DbPath,
        [Parameter(Mandatory, ParameterSetName = 'DbPath')]
        [hashtable]$Envelope
    )

    if ($PSCmdlet.ParameterSetName -eq 'DbPath') {
        $type = $Envelope.EventType
        $from = $Envelope.From
        $to   = $Envelope.To

        if ($type -notin $script:_RouterValidEventTypes) {
            throw "AclViolation: unknown event type '$type'"
        }
        if (-not (_Test-RouterAcl -EventType $type -From $from -To $to)) {
            throw "AclViolation: From='$from' To='$to' not allowed for type='$type'"
        }

        $isHaltEvent = $type -in $script:_RouterHaltTypes
        $isDbHalted  = $script:_RouterHaltedByDb.ContainsKey($DbPath) -and $script:_RouterHaltedByDb[$DbPath]
        if ($isDbHalted -and -not $isHaltEvent) {
            throw "AclViolation: bus is halted; non-halt event '$type' rejected (InvHaltMonotone)"
        }
        if ($isHaltEvent) { $script:_RouterHaltedByDb[$DbPath] = $true }

        $ts      = [datetime]::UtcNow.ToString('o')
        $envPayload = if ($Envelope.ContainsKey('Payload')) { $Envelope.Payload | ConvertTo-Json -Compress } else { '{}' }

        Invoke-SqliteQuery -DataSource $DbPath -Query `
            "INSERT INTO event_log (evt_id, [from], [to], event_type, payload, status, created_at)
             VALUES ((SELECT COALESCE(MAX(evt_id),0)+1 FROM event_log), @fr, @to, @et, @pl, 'routed', @ca)" `
            -SqlParameters @{ fr = $from; to = $to; et = $type; pl = $envPayload; ca = $ts } | Out-Null

        $rowIdRow = Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT MAX(evt_id) as mx FROM event_log"
        return [int]($rowIdRow.mx)
    }

    # Connection (production) flow
    if ($env:VIBE_BUS_COMMIT_IN_PROGRESS -eq '1') {
        Write-PipelineLog -Severity 'ERROR' -Message 'LockHierarchyViolation: AppendEvent called while VIBE_BUS_COMMIT_IN_PROGRESS=1'
        throw 'LockHierarchyViolation: AppendEvent must not be called from pre-commit hooks'
    }
    if ([string]::IsNullOrEmpty($From)) { throw "ValidationError: From is required" }
    # Distinguish explicit empty string (caller error — validation fires) from $null
    # (upstream unresolved target — allowed; coerced to '' at SQL bind time to satisfy
    # the "to" NOT NULL column).
    if ($null -ne $To -and $To -is [string] -and $To.Length -eq 0) {
        throw "ValidationError: To is required"
    }
    if ($Type -notin $script:_RouterValidEventTypes) {
        throw "ValidationError: unknown event type '$Type'"
    }
    if (-not [string]::IsNullOrEmpty($Payload)) {
        try { $null = $Payload | ConvertFrom-Json -ErrorAction Stop }
        catch { throw "ValidationError: invalid JSON payload: $($_.Exception.Message)" }
    }
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
            # Coerce null To to empty string so the schema's NOT NULL constraint is satisfied.
            # T15 exercises this: 'done' with no active moderator resolves to a null target but
            # must still persist a row.
            $toVal = if ($null -eq $To) { '' } else { $To }
            $cmd.Parameters.AddWithValue('@to', $toVal) | Out-Null
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

# ---------------------------------------------------------------------------
# Get-RouterEventCount / Get-RouterEventIds / New-RouterAgentSession
# Property-test helpers (PSSQLite flow).
# ---------------------------------------------------------------------------
function Get-RoutedEventIds {
    return , $script:_RoutedIds
}

# Rebuilds in-memory router state from a crash/restart: scans event_log, adds every
# existing evt_id to _RoutedIds, and re-seeds the allocator to max(evt_id) + 1.
# Spec: `RouterStartupRecovery` — see docs/bidirectional-comms/refinement-mapping.md.
function Invoke-RouterStartupRecovery {
    param([Parameter(Mandatory)]$Connection)
    $maxId = [int64]0
    $cmd = $Connection.CreateCommand()
    $cmd.CommandText = 'SELECT evt_id FROM event_log'
    $reader = $cmd.ExecuteReader()
    try {
        while ($reader.Read()) {
            $id = [int64]$reader['evt_id']
            [void]$script:_RoutedIds.Add($id)
            if ($id -gt $maxId) { $maxId = $id }
        }
    } finally {
        $reader.Dispose()
        $cmd.Dispose()
    }
    Initialize-EvtIdAllocator -StartValue ($maxId + 1)
}

function Get-RouterEventCount {
    param([Parameter(Mandatory)][string]$DbPath)
    $row = Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT COUNT(*) as cnt FROM event_log"
    return [int]($row.cnt)
}

function Get-RouterEventIds {
    param([Parameter(Mandatory)][string]$DbPath)
    $rows = Invoke-SqliteQuery -DataSource $DbPath -Query "SELECT evt_id FROM event_log ORDER BY id"
    return @($rows | ForEach-Object { [int]$_.evt_id })
}

function New-RouterAgentSession {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [Parameter(Mandatory)][string]$DbPath,
        [Parameter(Mandatory)][string]$SessionId,
        [string]$AgentId = 'agent-default',
        [string]$Role    = 'writer'
    )
    $ts = [datetime]::UtcNow.ToString('o')
    Invoke-SqliteQuery -DataSource $DbPath -Query `
        "INSERT OR REPLACE INTO agent_sessions (session_id, agent_id, role, status, started_at, ground_truth_delivered)
         VALUES (@sid, @aid, @role, 'active', @sa, 0)" `
        -SqlParameters @{ sid = $SessionId; aid = $AgentId; role = $Role; sa = $ts } | Out-Null
}
