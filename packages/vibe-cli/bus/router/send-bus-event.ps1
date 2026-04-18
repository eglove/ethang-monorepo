function Send-BusEvent {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [hashtable]$Event,
        [scriptblock]$DbExecutor
    )
    throw "NOT IMPLEMENTED: Send-BusEvent"
}

function Send-GroundTruth {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [string]$AgentId,
        [hashtable]$Payload,
        [scriptblock]$DbExecutor
    )
    throw "NOT IMPLEMENTED: Send-GroundTruth"
}
