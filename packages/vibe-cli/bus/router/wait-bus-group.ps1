function New-BusGroup {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [string]$GroupId,
        [int]$ExpectedCount,
        [scriptblock]$DbExecutor
    )
    throw "NOT IMPLEMENTED: New-BusGroup"
}

function Send-BusGroupEvent {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [string]$GroupId,
        [string]$AgentId,
        [scriptblock]$DbExecutor
    )
    throw "NOT IMPLEMENTED: Send-BusGroupEvent"
}

function Wait-BusGroup {
    param(
        [string]$GroupId,
        [int]$TimeoutMs,
        [scriptblock]$DbExecutor
    )
    throw "NOT IMPLEMENTED: Wait-BusGroup"
}
