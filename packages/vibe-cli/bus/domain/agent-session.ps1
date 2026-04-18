Import-Module PSSQLite -ErrorAction SilentlyContinue

function New-AgentSession {
    param(
        $Connection,
        [string]$AgentName,
        [string]$Role,
        [string]$Worktree = $null,
        [int]$ProcessId = 0,
        [int]$RoleSchemaVersion = 1
    )
    $sessionId = [guid]::NewGuid().ToString()
    $sql = "INSERT INTO agent_sessions (session_id,agent_name,role,role_schema_version,status,worktree,pid) VALUES (@session_id,@agent_name,@role,@role_schema_version,'spawning',@worktree,@pid)"
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

function Set-AgentSessionAlive {
    param(
        $Connection,
        [string]$SessionId,
        [int64]$SpawnEpoch
    )
    $sql = "UPDATE agent_sessions SET status='alive', spawn_epoch=@spawn_epoch WHERE session_id=@session_id AND status='spawning'"
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query $sql -SqlParameters @{
        session_id  = $SessionId
        spawn_epoch = $SpawnEpoch
    } | Out-Null
}

function Set-AgentSessionDead {
    param(
        $Connection,
        [string]$SessionId,
        [int64]$DeathEpoch = 0
    )
    $sql = "UPDATE agent_sessions SET status='dead', death_epoch=@death_epoch WHERE session_id=@session_id AND status IN ('alive','checkpointing','renewing')"
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query $sql -SqlParameters @{
        session_id  = $SessionId
        death_epoch = $DeathEpoch
    } | Out-Null
}

function Get-AgentSession {
    param(
        $Connection,
        [string]$SessionId
    )
    return Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT * FROM agent_sessions WHERE session_id='$SessionId'"
}
