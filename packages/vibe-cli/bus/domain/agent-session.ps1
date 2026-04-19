#Requires -Module PSSQLite
<#
.SYNOPSIS
    AgentSession aggregate root for the bus domain (T11).
    Manages lifecycle state-machine transitions for agent sessions stored in SQLite.

    State machine:
        spawning -> alive -> checkpointing -> renewing -> alive (respawn)
        alive/checkpointing/renewing -> dead -> ended
        alive -> ended

    Invariants:
        2  DeadAgentReceivesNoMessages    — ended/dead sessions cannot return to alive
        7  SpawningAgentOnlyReceivesBootstrap — enforced by caller
        8  ExactlyOneBootstrapPerLifetime — spawn_epoch set once per lifetime in Set-AgentSessionAlive
        9  GroundTruthPrecedesAgentMessage — ground_truth_delivered flag on the row
#>

Import-Module PSSQLite -ErrorAction SilentlyContinue

# ---------------------------------------------------------------------------
# New-AgentSession
# ---------------------------------------------------------------------------
function New-AgentSession {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$AgentName,
        [Parameter(Mandatory)][string]$Role,
        [string]$Worktree = $null,
        [int]$ProcessId = 0,
        [int]$RoleSchemaVersion = 1
    )

    $sessionId = [guid]::NewGuid().ToString()
    $sql = @"
INSERT INTO agent_sessions (session_id, agent_name, role, role_schema_version, status, worktree, pid)
VALUES (@session_id, @agent_name, @role, @role_schema_version, 'spawning', @worktree, @pid)
"@
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query $sql -SqlParameters @{
        session_id          = $sessionId
        agent_name          = $AgentName
        role                = $Role
        role_schema_version = $RoleSchemaVersion
        worktree            = $Worktree
        pid                 = $ProcessId
    } | Out-Null

    return $sessionId
}

# ---------------------------------------------------------------------------
# Set-AgentSessionAlive  (spawning -> alive)
# ---------------------------------------------------------------------------
function Set-AgentSessionAlive {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$SessionId,
        [Parameter(Mandatory)][int64]$SpawnEpoch
    )

    $sql = @"
UPDATE agent_sessions
   SET status = 'alive', spawn_epoch = @spawn_epoch
 WHERE session_id = @session_id
   AND status = 'spawning'
"@
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query $sql -SqlParameters @{
        session_id  = $SessionId
        spawn_epoch = $SpawnEpoch
    } | Out-Null

    # Verify the row was actually updated: it should now be alive with this exact spawn_epoch
    $result = Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT COUNT(*) AS cnt FROM agent_sessions WHERE session_id='$SessionId' AND status='alive' AND spawn_epoch=$SpawnEpoch"
    if ($result.cnt -eq 0) {
        throw 'AgentSession not in spawning state'
    }
}

# ---------------------------------------------------------------------------
# Set-AgentSessionDead  (alive/checkpointing/renewing -> dead)
# ---------------------------------------------------------------------------
function Set-AgentSessionDead {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$SessionId,
        [int64]$DeathEpoch = 0
    )

    $sql = @"
UPDATE agent_sessions
   SET status = 'dead', death_epoch = @death_epoch
 WHERE session_id = @session_id
   AND status IN ('alive','checkpointing','renewing')
"@
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query $sql -SqlParameters @{
        session_id  = $SessionId
        death_epoch = $DeathEpoch
    } | Out-Null
}

# ---------------------------------------------------------------------------
# Set-AgentSessionCheckpointing  (alive -> checkpointing)
# ---------------------------------------------------------------------------
function Set-AgentSessionCheckpointing {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$SessionId,
        [int64]$CheckpointedAtMono = 0
    )

    $sql = @"
UPDATE agent_sessions
   SET status = 'checkpointing', checkpointed_at_mono = @mono
 WHERE session_id = @session_id
   AND status = 'alive'
"@
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query $sql -SqlParameters @{
        session_id = $SessionId
        mono       = $CheckpointedAtMono
    } | Out-Null
}

# ---------------------------------------------------------------------------
# Set-AgentSessionRenewing  (checkpointing -> renewing)
# ---------------------------------------------------------------------------
function Set-AgentSessionRenewing {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$SessionId,
        [string]$CheckpointJson = $null,
        [int64]$RenewEpoch = 0
    )

    $sql = @"
UPDATE agent_sessions
   SET status = 'renewing',
       checkpoint_json = COALESCE(@checkpoint_json, checkpoint_json),
       renew_epoch = @renew_epoch
 WHERE session_id = @session_id
   AND status = 'checkpointing'
"@
    $cjVal = if ([string]::IsNullOrEmpty($CheckpointJson)) { [DBNull]::Value } else { $CheckpointJson }
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query $sql -SqlParameters @{
        session_id      = $SessionId
        checkpoint_json = $cjVal
        renew_epoch     = $RenewEpoch
    } | Out-Null
}

# ---------------------------------------------------------------------------
# Set-AgentSessionRespawned  (renewing -> alive)
# ---------------------------------------------------------------------------
function Set-AgentSessionRespawned {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$SessionId,
        [Parameter(Mandatory)][int64]$NewSpawnEpoch,
        [int]$NewProcessId = 0
    )

    # Reset ground_truth_delivered on respawn — after renew the agent needs fresh ground truth.
    $sql = @"
UPDATE agent_sessions
   SET status = 'alive',
       spawn_epoch = @new_spawn_epoch,
       pid = @new_pid,
       ground_truth_delivered = 0
 WHERE session_id = @session_id
   AND status = 'renewing'
"@
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query $sql -SqlParameters @{
        session_id      = $SessionId
        new_spawn_epoch = $NewSpawnEpoch
        new_pid         = $NewProcessId
    } | Out-Null
}

# ---------------------------------------------------------------------------
# Set-AgentSessionEnded  (alive/dead -> ended)
# ---------------------------------------------------------------------------
function Set-AgentSessionEnded {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$SessionId
    )

    $sql = @"
UPDATE agent_sessions
   SET status = 'ended'
 WHERE session_id = @session_id
   AND status IN ('alive','dead')
"@
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query $sql -SqlParameters @{
        session_id = $SessionId
    } | Out-Null
}

# ---------------------------------------------------------------------------
# Get-AliveSessions
# ---------------------------------------------------------------------------
function Get-AliveSessions {
    param([Parameter(Mandatory)]$Connection)

    $sql = "SELECT * FROM agent_sessions WHERE status IN ('spawning','alive','checkpointing','renewing')"
    $rows = Invoke-SqliteQuery -SQLiteConnection $Connection -Query $sql
    if ($null -eq $rows) { return @() }
    # Ensure we always return an array
    return @($rows)
}

# ---------------------------------------------------------------------------
# Get-AgentSession
# ---------------------------------------------------------------------------
function Get-AgentSession {
    param(
        [Parameter(Mandatory)]$Connection,
        [string]$AgentName = $null,
        [string]$SessionId = $null
    )

    if (-not [string]::IsNullOrEmpty($SessionId)) {
        # Lookup by session id — used by checkpoint/renew tests that track a specific session
        # regardless of current status.
        $rows = Invoke-SqliteQuery -SQLiteConnection $Connection `
            -Query "SELECT * FROM agent_sessions WHERE session_id = @sid LIMIT 1" `
            -SqlParameters @{ sid = $SessionId }
        if ($null -eq $rows -or @($rows).Count -eq 0) { return $null }
        return $rows
    }

    if ([string]::IsNullOrEmpty($AgentName)) {
        throw "Get-AgentSession requires -AgentName or -SessionId"
    }

    $sql = @"
SELECT * FROM agent_sessions
 WHERE agent_name = @agent_name
   AND status IN ('spawning','alive','checkpointing','renewing')
 LIMIT 1
"@
    $rows = Invoke-SqliteQuery -SQLiteConnection $Connection -Query $sql -SqlParameters @{
        agent_name = $AgentName
    }
    if ($null -eq $rows -or @($rows).Count -eq 0) { return $null }
    return $rows
}

function Set-GroundTruthDelivered { param($Connection,[string]$SessionId); Invoke-SqliteQuery -SQLiteConnection $Connection -Query "UPDATE agent_sessions SET ground_truth_delivered=1 WHERE session_id='$SessionId'" | Out-Null }
