. "$PSScriptRoot/router.ps1"
. "$PSScriptRoot/../domain/agent-session.ps1"

# Respawn path (Inv9): when an agent restarts, Set-AgentSessionRespawned resets
# ground_truth_delivered=0 in agent_sessions. The next Send-BusEvent call for that
# agent will hit Assert-GroundTruthDelivered and throw Inv9Violation until
# Send-GroundTruth is called again for the respawned agent.

$script:_GroundTruthState = $null

function Send-GroundTruth {
    param(
        $Connection,
        [Parameter(Mandatory)][string]$Payload,
        [string]$GroupId = $null,
        [scriptblock]$DbExecutor = $null,
        [scriptblock]$GetAliveSessions = $null,
        [scriptblock]$SetGroundTruthDeliveredFn = $null
    )

    # Step 1: Get all alive sessions
    $sessions = if ($null -ne $GetAliveSessions) {
        & $GetAliveSessions $Connection
    } else {
        Get-AliveSessions -Connection $Connection
    }

    $deliveredTo = [System.Collections.Generic.List[string]]::new()
    $eventIds    = [System.Collections.Generic.List[int64]]::new()

    # Step 2: Send ground_truth event to each alive session
    foreach ($session in $sessions) {
        $appendParams = @{
            Connection = $Connection
            From       = 'orchestrator'
            To         = $session.agent_name
            Type       = 'ground_truth'
            Payload    = $Payload
            DbExecutor = $DbExecutor
        }
        if ($null -ne $GroupId) { $appendParams['GroupId'] = $GroupId }

        $result = Invoke-BusAppendEvent @appendParams

        $deliveredTo.Add($session.agent_name)
        $eventIds.Add($result.EvtId)

        # Step 3: Mark ground truth as delivered
        if ($null -ne $SetGroundTruthDeliveredFn) {
            & $SetGroundTruthDeliveredFn $Connection $session.session_id
        } else {
            Set-GroundTruthDelivered -Connection $Connection -SessionId $session.session_id
        }
    }

    # Step 4: Return result
    return @{
        DeliveredTo = @($deliveredTo)
        EventIds    = @($eventIds)
    }
}

function Assert-GroundTruthDelivered {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$AgentName
    )

    $row = Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT ground_truth_delivered FROM agent_sessions WHERE agent_name = '$AgentName' AND status IN ('alive','checkpointing','renewing')"

    if ($null -eq $row -or ($row | Measure-Object).Count -eq 0) {
        throw "Inv9Violation: GroundTruth not delivered to agent '$AgentName' before sending message"
    }

    $delivered = if ($row -is [System.Array]) { $row[0].ground_truth_delivered } else { $row.ground_truth_delivered }

    if ($delivered -eq 0 -or $null -eq $delivered) {
        throw "Inv9Violation: GroundTruth not delivered to agent '$AgentName' before sending message"
    }

    return $true
}

function Reset-GroundTruthState {
    $script:_GroundTruthState = $null
}
