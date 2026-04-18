# halt.ps1 — Halt Conditions + Halt-Once Guard + SIGINT Drain
# Implements 13 TLA+ halt-triggering conditions per OBJ-R3-6

if (-not (Get-Command Invoke-BusHalt -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot/../domain/bus-lifecycle.ps1"
}
if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
    function Write-PipelineLog { param($Message, $Severity = 'INFO', $Gate, $StructuredData); Write-Host "[$Severity] $Message" }
}

function Reset-HaltState { Reset-BusLifecycleLatch }

function Invoke-HaltOnAgentCrash {
    param($Connection, [string]$AgentName, [scriptblock]$GetTimestamp = $null)
    $ts = if ($GetTimestamp) { & $GetTimestamp } else { [DateTime]::UtcNow }
    Invoke-BusHalt -Connection $Connection -HaltReason 'mechanical_error' -FailureCategory 'agent_crash'
    Write-PipelineLog -Severity 'ALARM' -Message "Agent crash: $AgentName triggered halt"
    return @{ Halted = $true; HaltReason = 'mechanical_error'; FailureCategory = 'agent_crash'; Timestamp = $ts }
}

function Invoke-HaltOnMechanicalError {
    param($Connection, [string]$ErrorMessage, [string]$FailureCategory, [scriptblock]$GetTimestamp = $null)
    $ts = if ($GetTimestamp) { & $GetTimestamp } else { [DateTime]::UtcNow }
    Invoke-BusHalt -Connection $Connection -HaltReason 'mechanical_error' -FailureCategory $FailureCategory
    Write-PipelineLog -Severity 'ALARM' -Message "Mechanical error: $ErrorMessage triggered halt"
    return @{ Halted = $true; HaltReason = 'mechanical_error'; FailureCategory = $FailureCategory; Timestamp = $ts }
}

function Invoke-HaltOnConsensusFailure {
    param($Connection, [string]$Reason, [scriptblock]$GetTimestamp = $null)
    $ts = if ($GetTimestamp) { & $GetTimestamp } else { [DateTime]::UtcNow }
    Invoke-BusHalt -Connection $Connection -HaltReason 'consensus_failure'
    Write-PipelineLog -Severity 'ALARM' -Message "Consensus failure: $Reason triggered halt"
    return @{ Halted = $true; HaltReason = 'consensus_failure'; FailureCategory = $null; Timestamp = $ts }
}

function Invoke-HaltOnAclViolation {
    param($Connection, [string]$SenderRole, [string]$EventType, [scriptblock]$GetTimestamp = $null)
    $ts = if ($GetTimestamp) { & $GetTimestamp } else { [DateTime]::UtcNow }
    Invoke-BusHalt -Connection $Connection -HaltReason 'mechanical_error' -FailureCategory 'acl_violation'
    Write-PipelineLog -Severity 'ALARM' -Message "ACL violation: $SenderRole attempted $EventType triggered halt"
    return @{ Halted = $true; HaltReason = 'mechanical_error'; FailureCategory = 'acl_violation'; Timestamp = $ts }
}

function Invoke-HaltOnLockHierarchyViolation {
    param($Connection, [scriptblock]$GetTimestamp = $null)
    $ts = if ($GetTimestamp) { & $GetTimestamp } else { [DateTime]::UtcNow }
    Invoke-BusHalt -Connection $Connection -HaltReason 'mechanical_error' -FailureCategory 'lock_hierarchy_violation'
    Write-PipelineLog -Severity 'ALARM' -Message "Lock hierarchy violation triggered halt"
    return @{ Halted = $true; HaltReason = 'mechanical_error'; FailureCategory = 'lock_hierarchy_violation'; Timestamp = $ts }
}

function Invoke-HaltOnSqliteError {
    param($Connection, [string]$ErrorMessage, [scriptblock]$GetTimestamp = $null)
    $ts = if ($GetTimestamp) { & $GetTimestamp } else { [DateTime]::UtcNow }
    Invoke-BusHalt -Connection $Connection -HaltReason 'mechanical_error' -FailureCategory 'sqlite_error'
    Write-PipelineLog -Severity 'ALARM' -Message "SQLite error: $ErrorMessage triggered halt"
    return @{ Halted = $true; HaltReason = 'mechanical_error'; FailureCategory = 'sqlite_error'; Timestamp = $ts }
}

function Invoke-HaltOnWalCheckpointFailure {
    param($Connection, [scriptblock]$GetTimestamp = $null)
    $ts = if ($GetTimestamp) { & $GetTimestamp } else { [DateTime]::UtcNow }
    Invoke-BusHalt -Connection $Connection -HaltReason 'mechanical_error' -FailureCategory 'sqlite_error'
    Write-PipelineLog -Severity 'ALARM' -Message "WAL checkpoint failure triggered halt"
    return @{ Halted = $true; HaltReason = 'mechanical_error'; FailureCategory = 'sqlite_error'; Timestamp = $ts }
}

function Invoke-HaltOnUserInterrupt {
    param($Connection, [scriptblock]$GetTimestamp = $null)
    $ts = if ($GetTimestamp) { & $GetTimestamp } else { [DateTime]::UtcNow }
    Invoke-BusHalt -Connection $Connection -HaltReason 'user_interrupt'
    Write-PipelineLog -Severity 'ALARM' -Message "User interrupt (SIGINT) triggered halt"
    return @{ Halted = $true; HaltReason = 'user_interrupt'; FailureCategory = $null; Timestamp = $ts }
}

function Invoke-HaltOnQueueOverflow {
    param($Connection, [string]$AgentName, [scriptblock]$GetTimestamp = $null)
    $ts = if ($GetTimestamp) { & $GetTimestamp } else { [DateTime]::UtcNow }
    Invoke-BusHalt -Connection $Connection -HaltReason 'mechanical_error' -FailureCategory 'queue_overflow'
    Write-PipelineLog -Severity 'ALARM' -Message "Queue overflow for agent $AgentName triggered halt"
    return @{ Halted = $true; HaltReason = 'mechanical_error'; FailureCategory = 'queue_overflow'; Timestamp = $ts }
}

function Invoke-HaltOnSnapshotCorruption {
    param($Connection, [string]$SnapshotPath, [scriptblock]$GetTimestamp = $null)
    $ts = if ($GetTimestamp) { & $GetTimestamp } else { [DateTime]::UtcNow }
    Invoke-BusHalt -Connection $Connection -HaltReason 'mechanical_error' -FailureCategory 'snapshot_corruption'
    Write-PipelineLog -Severity 'ALARM' -Message "Snapshot corruption at $SnapshotPath triggered halt"
    return @{ Halted = $true; HaltReason = 'mechanical_error'; FailureCategory = 'snapshot_corruption'; Timestamp = $ts }
}

function Invoke-HaltOnWriteSessionStarvation {
    param($Connection, [string]$WorktreeLeaf, [scriptblock]$GetTimestamp = $null)
    $ts = if ($GetTimestamp) { & $GetTimestamp } else { [DateTime]::UtcNow }
    Invoke-BusHalt -Connection $Connection -HaltReason 'mechanical_error' -FailureCategory 'sqlite_error'
    Write-PipelineLog -Severity 'ALARM' -Message "Write session starvation for $WorktreeLeaf triggered halt"
    return @{ Halted = $true; HaltReason = 'mechanical_error'; FailureCategory = 'sqlite_error'; Timestamp = $ts }
}

function Invoke-HaltOnMaxRetriesExceeded {
    param($Connection, [string]$Operation, [scriptblock]$GetTimestamp = $null)
    $ts = if ($GetTimestamp) { & $GetTimestamp } else { [DateTime]::UtcNow }
    Invoke-BusHalt -Connection $Connection -HaltReason 'mechanical_error' -FailureCategory 'max_retries'
    Write-PipelineLog -Severity 'ALARM' -Message "Max retries exceeded for $Operation triggered halt"
    return @{ Halted = $true; HaltReason = 'mechanical_error'; FailureCategory = 'max_retries'; Timestamp = $ts }
}

function Invoke-HaltOnSchemaHashMismatch {
    param($Connection, [string]$ExpectedHash, [string]$ActualHash, [scriptblock]$GetTimestamp = $null)
    $ts = if ($GetTimestamp) { & $GetTimestamp } else { [DateTime]::UtcNow }
    Invoke-BusHalt -Connection $Connection -HaltReason 'mechanical_error' -FailureCategory 'schema_mismatch'
    Write-PipelineLog -Severity 'ALARM' -Message "Schema hash mismatch: expected $ExpectedHash got $ActualHash triggered halt"
    return @{ Halted = $true; HaltReason = 'mechanical_error'; FailureCategory = 'schema_mismatch'; Timestamp = $ts }
}

function Invoke-SigintDrain {
    param($Connection, [scriptblock]$GetTimestamp = $null)
    # Step 0: Drain engine-event queue — unregister bus events before agent teardown
    Get-EventSubscriber | Where-Object { $_.SourceIdentifier -like 'VibeBus.*' } | ForEach-Object {
        Unregister-Event -SourceIdentifier $_.SourceIdentifier -ErrorAction SilentlyContinue
    }
    Invoke-HaltOnUserInterrupt -Connection $Connection -GetTimestamp $GetTimestamp | Out-Null
    return @{ Drained = $true; HaltReason = 'user_interrupt' }
}
