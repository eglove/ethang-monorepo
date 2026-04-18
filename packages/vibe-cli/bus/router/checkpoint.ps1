. "$PSScriptRoot/router.ps1"
. "$PSScriptRoot/../domain/agent-session.ps1"
if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
    function Write-PipelineLog { param($Message,$Severity='INFO',$Gate,$StructuredData); Write-Host "[$Severity] $Message" }
}

$script:_CheckpointState = @{}

function Reset-CheckpointState {
    $script:_CheckpointState = @{}
}

function Invoke-CheckpointAgent {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$SessionId,
        [Parameter(Mandatory)][string]$AgentName,
        [int64]$CheckpointedAtMono = 0,
        [scriptblock]$DbExecutor = $null
    )

    if ($CheckpointedAtMono -eq 0) {
        $CheckpointedAtMono = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    }

    Set-AgentSessionCheckpointing -Connection $Connection -SessionId $SessionId -CheckpointedAtMono $CheckpointedAtMono

    $payload = @{ CheckpointedAtMono = $CheckpointedAtMono } | ConvertTo-Json -Compress
    Invoke-BusAppendEvent -Connection $Connection -From 'orchestrator' -To $AgentName -Type 'checkpoint' -Payload $payload -DbExecutor $DbExecutor | Out-Null

    Write-PipelineLog -Message "Checkpoint sent to $AgentName (session=$SessionId, mono=$CheckpointedAtMono)" -Severity 'INFO'

    return @{
        SessionId            = $SessionId
        AgentName            = $AgentName
        CheckpointedAtMono   = $CheckpointedAtMono
        Status               = 'checkpointing'
    }
}

function Invoke-RenewAgentSession {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$SessionId,
        [Parameter(Mandatory)][string]$AgentName,
        [int64]$RenewEpoch = 0,
        [int64]$NewSpawnEpoch = 0,
        [int]$NewProcessId = 0,
        [scriptblock]$RespawnAgent = $null,
        [scriptblock]$DbExecutor = $null
    )

    if ($RenewEpoch -eq 0) {
        $RenewEpoch = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    }

    Set-AgentSessionRenewing -Connection $Connection -SessionId $SessionId -RenewEpoch $RenewEpoch

    if ($null -ne $RespawnAgent) {
        $spawnResult = & $RespawnAgent $AgentName
    } else {
        $spawnResult = @{ ProcessId = 0 }
    }

    if ($NewSpawnEpoch -eq 0) {
        $NewSpawnEpoch = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    }

    Set-AgentSessionRespawned -Connection $Connection -SessionId $SessionId -NewSpawnEpoch $NewSpawnEpoch -NewProcessId $spawnResult.ProcessId

    $payload = @{ RenewEpoch = $RenewEpoch; NewSpawnEpoch = $NewSpawnEpoch } | ConvertTo-Json -Compress
    Invoke-BusAppendEvent -Connection $Connection -From $AgentName -To 'orchestrator' -Type 'checkpoint_response' -Payload $payload -InReplyTo 0 -DbExecutor $DbExecutor | Out-Null

    Write-PipelineLog -Message "Agent $AgentName renewed (session=$SessionId, renewEpoch=$RenewEpoch, newSpawnEpoch=$NewSpawnEpoch)" -Severity 'INFO'

    return @{
        SessionId     = $SessionId
        AgentName     = $AgentName
        RenewEpoch    = $RenewEpoch
        NewSpawnEpoch = $NewSpawnEpoch
        Status        = 'alive'
    }
}

function Test-ContextOverrunRisk {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$AgentName,
        [int64]$Threshold = 5000
    )

    $rows = Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT session_mono_epoch FROM agent_sessions WHERE agent_name='$AgentName' AND status IN ('alive','checkpointing','renewing')"

    if ($null -eq $rows -or ($rows | Measure-Object).Count -eq 0) {
        return @{ Risk = $false; Reason = 'no_active_session' }
    }

    $row = $rows | Select-Object -First 1
    $epoch = if ($null -eq $row.session_mono_epoch) { 0 } else { [int64]$row.session_mono_epoch }

    if ($epoch -ge $Threshold) {
        return @{ Risk = $true; SessionMonoEpoch = $epoch; Threshold = $Threshold }
    } else {
        return @{ Risk = $false; SessionMonoEpoch = $epoch; Threshold = $Threshold }
    }
}

function Invoke-CheckpointAll {
    param(
        [Parameter(Mandatory)]$Connection,
        [scriptblock]$DbExecutor = $null
    )

    $sessions = Get-AliveSessions -Connection $Connection
    $sessionList = @($sessions)
    $count = 0
    $sessionIds = @()

    foreach ($session in $sessionList) {
        Invoke-CheckpointAgent -Connection $Connection -SessionId $session.session_id -AgentName $session.agent_name -DbExecutor $DbExecutor | Out-Null
        $count++
        $sessionIds += $session.session_id
    }

    Write-PipelineLog -Message "CheckpointAll completed: $count sessions checkpointed" -Severity 'INFO'

    return @{
        CheckpointedCount = $count
        Sessions          = $sessionIds
    }
}
