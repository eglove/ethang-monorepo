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
    param(
        [string]$AgentId,
        [scriptblock]$DbExecutor,
        [string]$DbPath
    )

    $resolvedDb = if ($DbPath) { $DbPath } elseif ($script:_BusDbPath) { $script:_BusDbPath } else { $null }
    $ts         = [datetime]::UtcNow.ToString('o')

    if ($resolvedDb) {
        Invoke-SqliteQuery -DataSource $resolvedDb -Query @"
UPDATE agent_sessions SET status='ended', ended_at=@ea WHERE agent_id=@aid AND status='active'
"@ -SqlParameters @{ ea = $ts; aid = $AgentId } | Out-Null
    }
}

function Stop-AllBusAgents {
    param(
        [scriptblock]$DbExecutor,
        [string]$DbPath
    )

    $resolvedDb = if ($DbPath) { $DbPath } elseif ($script:_BusDbPath) { $script:_BusDbPath } else { $null }
    $ts         = [datetime]::UtcNow.ToString('o')

    if ($resolvedDb) {
        Invoke-SqliteQuery -DataSource $resolvedDb -Query @"
UPDATE agent_sessions SET status='ended', ended_at=@ea WHERE status='active'
"@ -SqlParameters @{ ea = $ts } | Out-Null
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
