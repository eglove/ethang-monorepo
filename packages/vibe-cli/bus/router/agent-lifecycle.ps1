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
    <#
    .SYNOPSIS
    Test helper: clears all active agents and resets module state.
    #>
    $script:_ActiveAgents.Clear()
}

function Get-BackpressureQueueDepth {
    <#
    .SYNOPSIS
    Returns current queue depth counter via Interlocked.Read (non-blocking).
    #>
    return [QueueDepthStore]::Read()
}

function Start-BusAgent {
    <#
    .SYNOPSIS
    Spawns an agent subprocess, creates session row, wires backpressure queue and crash handler.
    #>
    param(
        $Connection = $null,

        [Parameter(Mandatory)]
        [string]$AgentName,

        [Parameter(Mandatory)]
        [string]$Role,

        [Parameter(Mandatory)]
        [string]$SystemPrompt,

        [string]$Worktree = $null,

        [int]$QueueCapacity = 1000,

        [int64]$SpawnEpoch = 0,

        [scriptblock]$LaunchAgent = $null,

        [scriptblock]$GetUtcNow = $null
    )

    # 1. Create BlockingCollection with specified capacity
    $queue = [System.Collections.Concurrent.BlockingCollection[string]]::new($QueueCapacity)

    # 2. Create session (status = 'spawning')
    $sessionId = New-AgentSession -Connection $Connection -AgentName $AgentName -Role $Role -Worktree $Worktree -ProcessId 0

    # 3. Compute spawn epoch if not provided
    if ($SpawnEpoch -eq 0) {
        if ($null -ne $GetUtcNow) {
            $SpawnEpoch = & $GetUtcNow
        } else {
            $SpawnEpoch = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        }
    }

    # 4. Launch agent subprocess
    $processId = 0
    $processObj = $null
    if ($null -ne $LaunchAgent) {
        $launchResult = & $LaunchAgent $AgentName $Role $SystemPrompt $Worktree
        if ($null -ne $launchResult) {
            $processId = $launchResult.ProcessId
            $processObj = $launchResult.Process
        }
    }

    # Update session pid if we have one
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

    # 5. Transition session to 'alive'
    Set-AgentSessionAlive -Connection $Connection -SessionId $sessionId -SpawnEpoch $SpawnEpoch

    # 6. Register crash watcher if we have a real Process object
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

    # 7. Store agent entry in _ActiveAgents
    $agentEntry = @{
        Queue     = $queue
        SessionId = $sessionId
        AgentName = $AgentName
        Role      = $Role
    }
    $script:_ActiveAgents[$AgentName] = $agentEntry

    # 8. Return result
    return @{
        SessionId  = $sessionId
        AgentName  = $AgentName
        QueueDepth = 0
        SpawnEpoch = $SpawnEpoch
    }
}

function Invoke-EnqueueAgentMessage {
    <#
    .SYNOPSIS
    Enqueues a message to the named agent's backpressure queue.
    Returns $true on success, $false if queue is full (triggers halt).
    #>
    param(
        [string]$AgentName,
        [string]$Message
    )

    $agentEntry = $null
    if (-not $script:_ActiveAgents.TryGetValue($AgentName, [ref]$agentEntry)) {
        throw "Agent '$AgentName' not found in active agents registry"
    }

    $queue = $agentEntry.Queue

    # Increment BEFORE attempting to add
    [QueueDepthStore]::Increment() | Out-Null

    # Non-blocking add
    $added = $queue.TryAdd($Message, 0)
    if (-not $added) {
        # Rollback increment
        [QueueDepthStore]::Decrement() | Out-Null
        Write-PipelineLog -Severity 'ALARM' -Message "Queue full for agent $AgentName"
        Invoke-BusHalt -HaltReason 'mechanical_error' -FailureCategory 'queue_full'
        return $false
    }

    return $true
}

function Invoke-DequeueAgentMessage {
    <#
    .SYNOPSIS
    Dequeues a message from the named agent's backpressure queue.
    Returns the message string, or $null on timeout.
    #>
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
    <#
    .SYNOPSIS
    Drains pending messages for an agent and clears the BlockingCollection.
    #>
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
