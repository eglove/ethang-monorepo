function Start-BusAgent {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [string]$AgentId,
        [string]$Role,
        [scriptblock]$LaunchAgent,
        [scriptblock]$DbExecutor
    )
    throw "NOT IMPLEMENTED: Start-BusAgent"
}

function Stop-AllBusAgents {
    param(
        [scriptblock]$DbExecutor
    )
    throw "NOT IMPLEMENTED: Stop-AllBusAgents"
}
