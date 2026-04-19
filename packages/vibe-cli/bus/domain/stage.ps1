$script:StageEventTypes = @{
    1 = @{ Name = 'elicitor';              Domain = 'stage' }
    2 = @{ Name = 'parallel-writers';      Domain = 'stage' }
    3 = @{ Name = 'unified-debate';        Domain = 'stage' }
    4 = @{ Name = 'post-debate';           Domain = 'stage' }
    5 = @{ Name = 'implementation-writer'; Domain = 'stage' }
    6 = @{ Name = 'implementation-debate'; Domain = 'stage' }
    7 = @{ Name = 'coding';               Domain = 'stage' }
}

$script:_StageDomainAccumulatedEvents = [System.Collections.Generic.List[hashtable]]::new()

function Send-StageStarted {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [Parameter(Mandatory)]
        [int]$StageNum,

        [Parameter(Mandatory)]
        [string]$FeatureName,

        [scriptblock]$DbExecutor
    )
    $event = @{
        EventType   = 'stage_started'
        StageNum    = $StageNum
        FeatureName = $FeatureName
        Timestamp   = [datetime]::UtcNow.ToString('o')
    }
    $script:_StageDomainAccumulatedEvents.Add($event)
    & Send-BusEvent -Event $event -DbExecutor $DbExecutor
}

function Send-StageCompleted {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [Parameter(Mandatory)]
        [int]$StageNum,

        [Parameter(Mandatory)]
        [string]$FeatureName,

        [scriptblock]$DbExecutor
    )
    $event = @{
        EventType   = 'stage_completed'
        StageNum    = $StageNum
        FeatureName = $FeatureName
        Timestamp   = [datetime]::UtcNow.ToString('o')
    }
    $script:_StageDomainAccumulatedEvents.Add($event)
    & Send-BusEvent -Event $event -DbExecutor $DbExecutor
}

function New-StageAgentHandlerMap {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [Parameter(Mandatory)]
        [int]$StageNum
    )
    if (-not $script:StageEventTypes.ContainsKey($StageNum)) {
        throw "Unknown stage number: $StageNum"
    }
    $meta = $script:StageEventTypes[$StageNum]
    return @{
        StageNum  = $StageNum
        StageName = $meta.Name
        Domain    = $meta.Domain
        Handlers  = @{}
    }
}

function Reset-StageDomainState {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param()
    $script:_StageDomainAccumulatedEvents = [System.Collections.Generic.List[hashtable]]::new()
}
