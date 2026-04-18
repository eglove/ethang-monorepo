Import-Module PSSQLite -ErrorAction SilentlyContinue
function Get-AliveSessions { param($Connection); return @(Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT * FROM agent_sessions WHERE status IN ('spawning','alive','checkpointing','renewing')") }
function Set-AgentSessionDead { param($Connection,[string]$SessionId,[int64]$DeathEpoch=0); Invoke-SqliteQuery -SQLiteConnection $Connection -Query "UPDATE agent_sessions SET status='dead',death_epoch=@de WHERE session_id=@id AND status IN ('alive','checkpointing','renewing')" -SqlParameters @{id=$SessionId;de=$DeathEpoch}|Out-Null }
function Get-AgentSession { param($Connection,[string]$SessionId); return Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT * FROM agent_sessions WHERE session_id='$SessionId'" }
