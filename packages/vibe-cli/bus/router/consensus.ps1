. "$PSScriptRoot/router.ps1"
. "$PSScriptRoot/../domain/consensus-round.ps1"
. "$PSScriptRoot/../domain/protocol-error-types.ps1"
if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
    function Write-PipelineLog { param($Message,$Severity='INFO',$Gate,$StructuredData); Write-Host "[$Severity] $Message" }
}

function Reset-ConsensusState { }

function Invoke-ConsensusObjectionReceived {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][int64]$ObjectionEvtId,
        [string]$FromAgent = $null,
        [scriptblock]$DbExecutor = $null
    )
    Start-ConsensusRound -Connection $Connection -RoundEpochEvtId $ObjectionEvtId
    Add-ConsensusObjection -Connection $Connection -EvtId $ObjectionEvtId | Out-Null
    Write-PipelineLog -Severity 'INFO' -Message "Objection $ObjectionEvtId received from $FromAgent"
    return @{ ObjectionEvtId = $ObjectionEvtId; State = 'objecting' }
}

function Invoke-ConsensusObjectionResponseReceived {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][int64]$OriginalEvtId,
        [Parameter(Mandatory)][string]$Response,
        [scriptblock]$DbExecutor = $null
    )
    if ($Response -eq 'accepted') {
        Resolve-ConsensusObjection -Connection $Connection -EvtId $OriginalEvtId | Out-Null
    } elseif ($Response -eq 'rejected') {
        Override-ConsensusObjection -Connection $Connection -EvtId $OriginalEvtId | Out-Null
    } else {
        Write-PipelineLog -Severity 'WARN' -Message "Unknown objection response: $Response"
        New-ProtocolError -Code 'unknown_event_type' -Message "Unknown objection response: $Response" | Out-Null
    }
    return @{ OriginalEvtId = $OriginalEvtId; Response = $Response; Resolved = $true }
}

function Invoke-ConsensusCandidate {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][int64]$CandidateEvtId,
        [string]$ProposedBy = $null,
        [scriptblock]$DbExecutor = $null
    )
    Set-ConsensusStateCandidate -Connection $Connection
    $from = if ($ProposedBy) { $ProposedBy } else { 'debate-moderator' }
    Invoke-BusAppendEvent -Connection $Connection -From $from -To 'orchestrator' -Type 'consensus_candidate' -Payload (@{CandidateEvtId=$CandidateEvtId}|ConvertTo-Json -Compress) -DbExecutor $DbExecutor | Out-Null
    return @{ CandidateEvtId = $CandidateEvtId; State = 'candidate' }
}

function Invoke-ConsensusRatify {
    param(
        [Parameter(Mandatory)]$Connection,
        [scriptblock]$DbExecutor = $null
    )
    try {
        Set-ConsensusRatified -Connection $Connection
        Invoke-BusAppendEvent -Connection $Connection -From 'orchestrator' -To 'broadcast' -Type 'consensus_ratified' -DbExecutor $DbExecutor | Out-Null
        return @{ Ratified = $true; State = 'ratified' }
    } catch {
        $failResult = Invoke-ConsensusFail -Connection $Connection -DbExecutor $DbExecutor
        return @{ Ratified = $false; Reason = $_.Exception.Message }
    }
}

function Invoke-ConsensusFail {
    param(
        [Parameter(Mandatory)]$Connection,
        [string]$Reason = 'unresolved_objections',
        [scriptblock]$DbExecutor = $null
    )
    Set-ConsensusFailed -Connection $Connection
    Invoke-BusAppendEvent -Connection $Connection -From 'orchestrator' -To 'broadcast' -Type 'consensus_failed' -Payload (@{Reason=$Reason}|ConvertTo-Json -Compress) -DbExecutor $DbExecutor | Out-Null
    Write-PipelineLog -Severity 'WARN' -Message "Consensus failed: $Reason"
    return @{ Failed = $true; Reason = $Reason }
}

function Invoke-ConsensusReset {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][int64]$NewEpochEvtId
    )
    Invoke-AdvanceRoundEpoch -Connection $Connection -NewEpochEvtId $NewEpochEvtId
    Write-PipelineLog -Severity 'INFO' -Message "Consensus reset to epoch $NewEpochEvtId"
    return @{ NewEpoch = $NewEpochEvtId; State = 'open' }
}
