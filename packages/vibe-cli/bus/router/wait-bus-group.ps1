$script:_BusGroups = @{}

function New-BusGroup {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [string]$GroupId,
        [int]$ExpectedCount,
        [scriptblock]$DbExecutor
    )

    $script:_BusGroups[$GroupId] = @{
        GroupId       = $GroupId
        ExpectedCount = $ExpectedCount
        Arrived       = [System.Collections.Generic.List[string]]::new()
    }
    return @{ GroupId = $GroupId; ExpectedCount = $ExpectedCount }
}

function Send-BusGroupEvent {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [string]$GroupId,
        [string]$AgentId,
        [scriptblock]$DbExecutor
    )

    if ($script:_BusGroups.ContainsKey($GroupId)) {
        $script:_BusGroups[$GroupId].Arrived.Add($AgentId)
    }
}

function Wait-BusGroup {
    param(
        [string]$GroupId,
        [int]$TimeoutMs,
        [scriptblock]$DbExecutor
    )

    # In the E2E stub, agents are synchronous (LaunchAgent is a mock).
    # All agents have already been registered via Send-BusGroupEvent; just check count.
    if ($script:_BusGroups.ContainsKey($GroupId)) {
        $group = $script:_BusGroups[$GroupId]
        return @{
            GroupId   = $GroupId
            Completed = ($group.Arrived.Count -ge $group.ExpectedCount)
            Count     = $group.Arrived.Count
        }
    }
    return @{ GroupId = $GroupId; Completed = $true; Count = 0 }
}

function Reset-BusGroupState {
    $script:_BusGroups = @{}
}
