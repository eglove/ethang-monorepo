. "$PSScriptRoot/../domain/bus-lifecycle.ps1"
if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
    function Write-PipelineLog { param($Message,$Severity='INFO',$Gate,$StructuredData); Write-Host "[$Severity] $Message" }
}

function Reset-BusStatusState { }  # stateless - state is entirely in DB

function Get-BusStatus {
    param(
        [Parameter(Mandatory)]$Connection,
        [scriptblock]$GetUtcNow = $null
    )

    # 1. Read lifecycle state
    $lifecycle = Get-BusLifecycleState -Connection $Connection

    # 2. Count events by status using GROUP BY
    $eventRows = @(Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT status, COUNT(*) as cnt FROM event_log GROUP BY status")
    $eventMap = @{}
    foreach ($row in $eventRows) {
        $eventMap[$row.status] = [int]$row.cnt
    }
    $eventCounts = @{
        Routed         = if ($eventMap.ContainsKey('routed')) { $eventMap['routed'] } else { 0 }
        Committed      = if ($eventMap.ContainsKey('committed')) { $eventMap['committed'] } else { 0 }
        DeliveryFailed = if ($eventMap.ContainsKey('delivery_failed')) { $eventMap['delivery_failed'] } else { 0 }
        Total          = ($eventMap.Values | Measure-Object -Sum).Sum
    }
    if ($null -eq $eventCounts.Total -or $eventCounts.Total -isnot [int]) {
        $eventCounts.Total = [int]($eventCounts.Routed + $eventCounts.Committed + $eventCounts.DeliveryFailed)
    }
    else {
        $eventCounts.Total = [int]$eventCounts.Total
    }

    # 3. Count agents by alive/dead category
    $agentRows = @(Invoke-SqliteQuery -SQLiteConnection $Connection -Query @"
SELECT CASE WHEN status IN ('spawning','alive','checkpointing','renewing') THEN 'alive' ELSE 'dead' END as category, COUNT(*) as cnt
FROM agent_sessions
GROUP BY category
"@)
    $agentMap = @{}
    foreach ($row in $agentRows) {
        $agentMap[$row.category] = [int]$row.cnt
    }
    $aliveCount = if ($agentMap.ContainsKey('alive')) { $agentMap['alive'] } else { 0 }
    $deadCount  = if ($agentMap.ContainsKey('dead'))  { $agentMap['dead']  } else { 0 }
    $agentCounts = @{
        Alive = $aliveCount
        Dead  = $deadCount
        Total = $aliveCount + $deadCount
    }

    # 4. Set timestamp
    $timestamp = if ($GetUtcNow) { & $GetUtcNow } else { [DateTime]::UtcNow }

    # 5. Return composite hashtable
    return @{
        BusStatus       = $lifecycle.BusStatus
        HaltReason      = $lifecycle.HaltReason
        FailureCategory = $lifecycle.FailureCategory
        PipelineLock    = $lifecycle.PipelineLock
        EventCounts     = $eventCounts
        AgentCounts     = $agentCounts
        Timestamp       = $timestamp
    }
}

function Format-BusStatusReport {
    param([Parameter(Mandatory)][hashtable]$Status)

    $haltReason      = if ($Status.HaltReason)      { $Status.HaltReason }      else { 'none' }
    $failureCategory = if ($Status.FailureCategory) { $Status.FailureCategory } else { 'none' }
    $ts = if ($Status.Timestamp -is [DateTime]) { $Status.Timestamp.ToString('o') } else { "$($Status.Timestamp)" }

    $ec = $Status.EventCounts
    $ac = $Status.AgentCounts

    return @"
Bus Status: $($Status.BusStatus)
  Halt Reason: $haltReason
  Failure Category: $failureCategory
  Pipeline Lock: $($Status.PipelineLock)
Events:
  Total: $($ec.Total) | Routed: $($ec.Routed) | Committed: $($ec.Committed) | Failed: $($ec.DeliveryFailed)
Agents:
  Alive: $($ac.Alive) | Dead: $($ac.Dead)
Timestamp: $ts
"@
}
