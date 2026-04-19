Import-Module PSSQLite -ErrorAction SilentlyContinue

# Load dependencies only if not already overridden (allows unit test injection)
if (-not (Get-Command 'New-AgentSession' -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot/../domain/agent-session.ps1"
}

# QueueDepthStore C# static class for Interlocked int64 operations
if (-not ([System.Management.Automation.PSTypeName]'QueueDepthStore').Type) {
    Add-Type -TypeDefinition @'
using System.Threading;
public static class QueueDepthStore {
    private static long _depth = 0;
    public static long Increment() { return Interlocked.Increment(ref _depth); }
    public static long Decrement() { return Interlocked.Decrement(ref _depth); }
    public static long Read() { return Interlocked.Read(ref _depth); }
    public static long Reset() { return Interlocked.Exchange(ref _depth, 0); }
}
'@
}

# Module-level state
$script:_ActiveAgents = [System.Collections.Concurrent.ConcurrentDictionary[string, hashtable]]::new()

function Reset-AgentLifecycleState {
    $script:_ActiveAgents.Clear()
}

function Get-BackpressureQueueDepth {
    return [QueueDepthStore]::Read()
}

function Start-BusAgent {
    [CmdletBinding(DefaultParameterSetName = 'Connection')]
    param(
        [Parameter(ParameterSetName = 'Connection')]
        $Connection = $null,

        [Parameter(Mandatory, ParameterSetName = 'Connection')]
        [string]$AgentName,

        [Parameter(Mandatory, ParameterSetName = 'Connection')]
        [Parameter(Mandatory, ParameterSetName = 'DbPath')]
        [string]$Role,

        [Parameter(Mandatory, ParameterSetName = 'Connection')]
        [string]$SystemPrompt,

        [Parameter(ParameterSetName = 'Connection')]
        [string]$Worktree = $null,

        [Parameter(ParameterSetName = 'Connection')]
        [int]$QueueCapacity = 1000,

        [Parameter(ParameterSetName = 'Connection')]
        [int64]$SpawnEpoch = 0,

        [Parameter(ParameterSetName = 'Connection')]
        [Parameter(ParameterSetName = 'DbPath')]
        [scriptblock]$LaunchAgent = $null,

        [Parameter(ParameterSetName = 'Connection')]
        [scriptblock]$GetUtcNow = $null,

        [Parameter(Mandatory, ParameterSetName = 'DbPath')]
        [string]$AgentId,

        [Parameter(ParameterSetName = 'DbPath')]
        [string]$DbPath,

        [Parameter(ParameterSetName = 'DbPath')]
        [scriptblock]$DbExecutor = $null
    )

    if ($PSCmdlet.ParameterSetName -eq 'DbPath') {
        $resolvedDb = if ($DbPath) { $DbPath } elseif ($script:_BusDbPath) { $script:_BusDbPath } else { $null }
        $sessionId  = "session-$AgentId-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        $ts         = [datetime]::UtcNow.ToString('o')

        if ($resolvedDb) {
            Invoke-SqliteQuery -DataSource $resolvedDb -Query @"
INSERT OR REPLACE INTO agent_sessions (session_id, agent_id, role, status, started_at, ground_truth_delivered)
VALUES (@sid, @aid, @role, 'active', @sa, 0)
"@ -SqlParameters @{ sid = $sessionId; aid = $AgentId; role = $Role; sa = $ts } | Out-Null
        }

        $evt = @{ EventType = 'agent_started'; AgentId = $AgentId; Role = $Role; From = 'pipeline'; To = 'bus' }
        Send-BusEvent -Event $evt -DbPath $resolvedDb | Out-Null

        if ($LaunchAgent) { & $LaunchAgent -AgentId $AgentId -Role $Role }

        return @{ SessionId = $sessionId; AgentId = $AgentId; Role = $Role; Status = 'active' }
    }

    # Connection (production) flow
    $queue = [System.Collections.Concurrent.BlockingCollection[string]]::new($QueueCapacity)
    $sessionId = New-AgentSession -Connection $Connection -AgentName $AgentName -Role $Role -Worktree $Worktree -ProcessId 0

    if ($SpawnEpoch -eq 0) {
        if ($null -ne $GetUtcNow) {
            $SpawnEpoch = & $GetUtcNow
        } else {
            $SpawnEpoch = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        }
    }

    $processId = 0
    $processObj = $null
    if ($null -ne $LaunchAgent) {
        $launchResult = & $LaunchAgent $AgentName $Role $SystemPrompt $Worktree
        if ($null -ne $launchResult) {
            $processId = $launchResult.ProcessId
            $processObj = $launchResult.Process
        }
    }

    if ($processId -ne 0 -and $null -ne $Connection) {
        try {
            $updateSql = "UPDATE agent_sessions SET pid=@pid WHERE session_id=@session_id"
            Invoke-SqliteQuery -SQLiteConnection $Connection -Query $updateSql -SqlParameters @{
                pid        = $processId
                session_id = $sessionId
            } | Out-Null
        } catch {
            # If update fails (e.g. mock connection), continue
        }
    }

    Set-AgentSessionAlive -Connection $Connection -SessionId $sessionId -SpawnEpoch $SpawnEpoch

    if ($null -ne $processObj -and $processObj -is [System.Diagnostics.Process]) {
        try {
            $processObj.EnableRaisingEvents = $true
            $capturedSessionId = $sessionId
            $capturedConnection = $Connection
            Register-ObjectEvent -InputObject $processObj -EventName 'Exited' -Action {
                Invoke-BusHalt -HaltReason 'mechanical_error' -FailureCategory 'agent_crash'
                Set-AgentSessionDead -Connection $capturedConnection -SessionId $capturedSessionId -DeathEpoch ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
            } | Out-Null
        } catch {
            # If event registration fails, continue gracefully
        }
    }

    $agentEntry = @{
        Queue     = $queue
        SessionId = $sessionId
        AgentName = $AgentName
        Role      = $Role
    }
    $script:_ActiveAgents[$AgentName] = $agentEntry

    return @{
        SessionId  = $sessionId
        AgentName  = $AgentName
        QueueDepth = 0
        SpawnEpoch = $SpawnEpoch
    }
}

function Stop-BusAgent {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        $Connection = $null,
        [string]$AgentName = $null,
        [switch]$Graceful,
        [int]$DrainTimeoutMs = 5000,
        [scriptblock]$KillProcess = $null,
        [int64]$DeathEpoch = 0,
        # Legacy params retained for backward compatibility:
        [string]$AgentId = $null,
        [scriptblock]$DbExecutor = $null,
        [string]$DbPath = $null
    )

    # Legacy code path — no AgentName provided: behave as the old DbPath-based no-op.
    if ([string]::IsNullOrEmpty($AgentName)) {
        $resolvedDb = if ($DbPath) { $DbPath } elseif ($script:_BusDbPath) { $script:_BusDbPath } else { $null }
        if ($resolvedDb -and $AgentId) {
            $ts = [datetime]::UtcNow.ToString('o')
            Invoke-SqliteQuery -DataSource $resolvedDb -Query "UPDATE agent_sessions SET status='ended' WHERE agent_id=@aid AND status='active'" `
                -SqlParameters @{ aid = $AgentId } | Out-Null
        }
        return
    }

    $agentEntry = $null
    if (-not $script:_ActiveAgents.TryGetValue($AgentName, [ref]$agentEntry)) {
        throw "AgentNotFound: '$AgentName' is not registered in active agents"
    }

    if ($Graceful) {
        # Drain this agent's queue until it's empty or the deadline elapses. Use the
        # BlockingCollection.Count (per-agent) rather than the global QueueDepthStore,
        # because another agent's messages would keep the global count non-zero and
        # waste our drain budget.
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        while ($sw.ElapsedMilliseconds -lt $DrainTimeoutMs -and $agentEntry.Queue.Count -gt 0) {
            $msg = $null
            if ($agentEntry.Queue.TryTake([ref]$msg, 50)) {
                [QueueDepthStore]::Decrement() | Out-Null
            }
        }
        $sw.Stop()
    }

    # CompleteAdding so subsequent TryAdd throws InvalidOperationException.
    try { $agentEntry.Queue.CompleteAdding() } catch { }

    $epoch = if ($DeathEpoch -gt 0) { $DeathEpoch } else { [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() }

    if ($null -ne $Connection) {
        Set-AgentSessionDead -Connection $Connection -SessionId $agentEntry.SessionId -DeathEpoch $epoch
        # Transition dead -> ended.
        $cmd = $Connection.CreateCommand()
        $cmd.CommandText = "UPDATE agent_sessions SET status='ended' WHERE session_id=@sid AND status='dead'"
        $cmd.Parameters.AddWithValue('@sid', $agentEntry.SessionId) | Out-Null
        $cmd.ExecuteNonQuery() | Out-Null
        $cmd.Dispose()
    }

    if ($null -ne $KillProcess) {
        & $KillProcess $AgentName
    }

    $removed = $null
    [void]$script:_ActiveAgents.TryRemove($AgentName, [ref]$removed)

    return @{
        AgentName  = $AgentName
        SessionId  = $agentEntry.SessionId
        DeathEpoch = $epoch
    }
}

function Stop-AllBusAgents {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        $Connection = $null,
        [switch]$Graceful,
        [int]$DrainTimeoutMs = 5000,
        [scriptblock]$KillProcess = $null,
        [scriptblock]$DbExecutor = $null,
        [string]$DbPath = $null
    )

    # Legacy DbPath path — used by e2e tests that spawn agents via Start-BusAgent's DbPath
    # branch (writes directly to agent_sessions, no _ActiveAgents registration).
    if (-not [string]::IsNullOrEmpty($DbPath)) {
        Invoke-SqliteQuery -DataSource $DbPath -Query "UPDATE agent_sessions SET status='ended' WHERE status='active'" | Out-Null
        return @{ StoppedCount = 0; Agents = @() }
    }

    # Modern Connection path — iterate in-memory agent registry.
    $names = @($script:_ActiveAgents.Keys)
    $stopped = @()
    foreach ($name in $names) {
        $res = Stop-BusAgent -Connection $Connection -AgentName $name -Graceful:$Graceful -DrainTimeoutMs $DrainTimeoutMs -KillProcess $KillProcess
        if ($res) { $stopped += $res.AgentName }
    }
    return @{
        StoppedCount = $stopped.Count
        Agents       = $stopped
    }
}

function Invoke-EmitHeartbeat {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [string]$AgentId,
        [scriptblock]$DbExecutor,
        [string]$DbPath
    )

    $resolvedDb = if ($DbPath) { $DbPath } elseif ($script:_BusDbPath) { $script:_BusDbPath } else { $null }
    $ts         = [datetime]::UtcNow.ToString('o')

    if ($resolvedDb) {
        $key = "heartbeat_$AgentId"
        Invoke-SqliteQuery -DataSource $resolvedDb -Query @"
INSERT OR REPLACE INTO rollback_state (key, value) VALUES (@k, @v)
"@ -SqlParameters @{ k = $key; v = $ts } | Out-Null
    }

    return @{ AgentId = $AgentId; LastTickAt = $ts }
}

function Invoke-EnqueueAgentMessage {
    param(
        [string]$AgentName,
        [string]$Message
    )

    $agentEntry = $null
    if (-not $script:_ActiveAgents.TryGetValue($AgentName, [ref]$agentEntry)) {
        throw "Agent '$AgentName' not found in active agents registry"
    }

    $queue = $agentEntry.Queue

    [QueueDepthStore]::Increment() | Out-Null

    $added = $queue.TryAdd($Message, 0)
    if (-not $added) {
        [QueueDepthStore]::Decrement() | Out-Null
        Write-PipelineLog -Severity 'ALARM' -Message "Queue full for agent $AgentName"
        Invoke-BusHalt -HaltReason 'mechanical_error' -FailureCategory 'queue_full'
        return $false
    }

    return $true
}

function Invoke-DequeueAgentMessage {
    param(
        [string]$AgentName,
        [int]$TimeoutMs = 5000
    )

    $agentEntry = $null
    if (-not $script:_ActiveAgents.TryGetValue($AgentName, [ref]$agentEntry)) {
        throw "Agent '$AgentName' not found in active agents registry"
    }

    $queue = $agentEntry.Queue
    $msg = $null
    $took = $queue.TryTake([ref]$msg, $TimeoutMs)

    if ($took) {
        [QueueDepthStore]::Decrement() | Out-Null
        return $msg
    }

    return $null
}

function Stop-MessageDispatch {
    param([string]$AgentName)

    $agentEntry = $null
    if (-not $script:_ActiveAgents.TryGetValue($AgentName, [ref]$agentEntry)) {
        return
    }

    $queue = $agentEntry.Queue
    $drained = $null
    while ($queue.TryTake([ref]$drained, 0)) {
        [QueueDepthStore]::Decrement() | Out-Null
    }
}
