. "$PSScriptRoot/router.ps1"
. "$PSScriptRoot/../domain/protocol-error-types.ps1"
if (-not (Get-Command Invoke-BusHalt -ErrorAction SilentlyContinue)) {
    function Invoke-BusHalt { param($HaltReason='mechanical_error',$FailureCategory=$null) }
}
if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
    function Write-PipelineLog { param($Message,$Severity='INFO',$Gate=$null,$StructuredData=$null); Write-Host "[$Severity] $Message" }
}

$script:_ProtocolErrorState = @{}

function Reset-ProtocolErrorState { $script:_ProtocolErrorState = @{} }

function Send-ProtocolError {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][hashtable]$ProtocolError,
        [string]$AffectedAgent = $null,
        [scriptblock]$DbExecutor = $null
    )
    $target = if ([string]::IsNullOrEmpty($AffectedAgent)) { 'broadcast' } else { $AffectedAgent }

    # Serialize error to JSON, converting Timestamp to ISO 8601 string
    $payload = @{
        Code              = $ProtocolError.Code
        Message           = $ProtocolError.Message
        AffectedAgentName = $ProtocolError.AffectedAgentName
        OriginalEvtId     = $ProtocolError.OriginalEvtId
        Context           = $ProtocolError.Context
        Timestamp         = if ($null -ne $ProtocolError.Timestamp) { $ProtocolError.Timestamp.ToString('O') } else { $null }
    }
    $jsonPayload = $payload | ConvertTo-Json -Compress -Depth 5

    return Invoke-BusAppendEvent `
        -Connection $Connection `
        -From 'orchestrator' `
        -To $target `
        -Type 'protocol_error' `
        -Payload $jsonPayload `
        -DbExecutor $DbExecutor
}

function Send-ProtocolErrorAck {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$FromAgent,
        [Parameter(Mandatory)][int64]$OriginalEvtId,
        [string]$Notes = $null,
        [scriptblock]$DbExecutor = $null
    )
    $payload = @{ Notes = $Notes; OriginalEvtId = $OriginalEvtId }
    $jsonPayload = $payload | ConvertTo-Json -Compress -Depth 3

    return Invoke-BusAppendEvent `
        -Connection $Connection `
        -From $FromAgent `
        -To 'orchestrator' `
        -Type 'protocol_error_ack' `
        -Payload $jsonPayload `
        -InReplyTo $OriginalEvtId `
        -DbExecutor $DbExecutor
}

function Invoke-ProtocolErrorRecovery {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][hashtable]$ProtocolError,
        [string]$AffectedAgent = $null,
        [switch]$ShouldHalt,
        [scriptblock]$DbExecutor = $null,
        [scriptblock]$OnHalt = $null
    )

    # Step 1: Send the protocol_error event
    $sendResult = Send-ProtocolError -Connection $Connection -ProtocolError $ProtocolError -AffectedAgent $AffectedAgent -DbExecutor $DbExecutor

    # Step 2: Emit ALARM log
    Write-PipelineLog -Severity 'ALARM' -Message "ProtocolError: $($ProtocolError.Code) — $($ProtocolError.Message)"

    # Step 3: Halt if requested
    if ($ShouldHalt) {
        if ($null -ne $OnHalt) {
            & $OnHalt $ProtocolError.Code
        } else {
            Invoke-BusHalt -HaltReason 'mechanical_error' -FailureCategory $ProtocolError.Code
        }
    }

    return @{
        SentEvtId = $sendResult.EvtId
        Halted    = $ShouldHalt.IsPresent
    }
}
