Import-Module PSSQLite -ErrorAction SilentlyContinue
function New-AgentSession {
    param($Connection, [string]$AgentName, [string]$Role, [string]$Worktree=$null, [int]$ProcessId=0, [int]$RoleSchemaVersion=1)
    $sessionId = [guid]::NewGuid().ToString()
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query "INSERT INTO agent_sessions (session_id,agent_name,role,role_schema_version,status,worktree,pid) VALUES (@session_id,@agent_name,@role,@role_schema_version,'spawning',@worktree,@pid)" -SqlParameters @{session_id=$sessionId;agent_name=$AgentName;role=$Role;role_schema_version=$RoleSchemaVersion;worktree=$Worktree;pid=$ProcessId} | Out-Null
    return $sessionId
}
function Set-AgentSessionAlive { param($Connection,[string]$SessionId,[int64]$SpawnEpoch); Invoke-SqliteQuery -SQLiteConnection $Connection -Query "UPDATE agent_sessions SET status='alive',spawn_epoch=@se WHERE session_id=@id AND status='spawning'" -SqlParameters @{id=$SessionId;se=$SpawnEpoch} | Out-Null }
function Get-AliveSessions { param($Connection); return Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT * FROM agent_sessions WHERE status IN ('spawning','alive','checkpointing','renewing')" }
function Get-AgentSession { param($Connection,[string]$SessionId); return Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT * FROM agent_sessions WHERE session_id='$SessionId'" }
function Set-GroundTruthDelivered { param($Connection,[string]$SessionId); Invoke-SqliteQuery -SQLiteConnection $Connection -Query "UPDATE agent_sessions SET ground_truth_delivered=1 WHERE session_id='$SessionId'" | Out-Null }
