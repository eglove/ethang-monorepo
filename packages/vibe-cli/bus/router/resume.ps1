. "$PSScriptRoot/../domain/bus-lifecycle.ps1"
. "$PSScriptRoot/../domain/agent-session.ps1"
if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
    function Write-PipelineLog { param($Message,$Severity='INFO',$Gate,$StructuredData); Write-Host "[$Severity] $Message" }
}

function Test-ResumePreconditions {
    param([Parameter(Mandatory)]$Connection)

    $state = Get-BusLifecycleState -Connection $Connection
    $status = $state.BusStatus

    if ($status -ne 'halted') {
        throw "ResumeError: bus is not halted (status=$status)"
    }

    # pipeline_lock comes back as string from SQLite
    $lockRow = Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT value FROM bus_lifecycle_state WHERE key='pipeline_lock'"
    $lockVal = [int]($lockRow.value)
    if ($lockVal -ne 0) {
        throw "ResumeError: pipeline_lock is still held"
    }

    $warnings = @()

    # Check for sessions in checkpointing status — warn but don't throw
    $checkpointing = @(Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT COUNT(*) AS cnt FROM agent_sessions WHERE status='checkpointing'")
    if ($checkpointing[0].cnt -gt 0) {
        $warnings += "Sessions still in checkpointing status — may be mid-checkpoint"
        Write-Warning "ResumeWarning: $($warnings[-1])"
    }

    return @{ Safe=$true; Warnings=$warnings }
}

function Get-UncommittedEvents {
    param([Parameter(Mandatory)]$Connection)
    return @(Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT * FROM event_log WHERE status='routed' ORDER BY evt_id ASC")
}

function Invoke-ReplayUncommittedEvents {
    param([Parameter(Mandatory)]$Connection)

    $events = Get-UncommittedEvents -Connection $Connection
    $markedFailed = @()

    foreach ($evt in $events) {
        # Use raw SQLiteCommand to respect the trigger
        $cmd = $Connection.CreateCommand()
        $cmd.CommandText = "UPDATE event_log SET status='delivery_failed' WHERE evt_id=@id"
        $param = $cmd.CreateParameter()
        $param.ParameterName = '@id'
        $param.Value = $evt.evt_id
        [void]$cmd.Parameters.Add($param)
        [void]$cmd.ExecuteNonQuery()
        $markedFailed += $evt.evt_id
    }

    return @{ ReplayedCount=$markedFailed.Count; MarkedFailed=$markedFailed }
}

function Invoke-BusResumeRecovery {
    param(
        [Parameter(Mandatory)]$Connection,
        [switch]$Force,
        [scriptblock]$OnAgentRespawn = $null,
        [scriptblock]$GetUtcNow = $null
    )

    # Step 1: Precondition check (unless -Force)
    if (-not $Force) {
        Test-ResumePreconditions -Connection $Connection | Out-Null
    }

    # Step 2: Replay uncommitted events
    $replayResult = Invoke-ReplayUncommittedEvents -Connection $Connection
    $n = $replayResult.ReplayedCount

    # Step 3: Get alive sessions before marking them dead
    $aliveSessions = @(Get-AliveSessions -Connection $Connection)

    # Step 4: Mark alive sessions as dead
    foreach ($session in $aliveSessions) {
        Set-AgentSessionDead -Connection $Connection -SessionId $session.session_id -DeathEpoch 0
    }
    $m = $aliveSessions.Count

    # Step 5: Transition bus to running
    Invoke-BusResume -Connection $Connection

    # Step 6: Call OnAgentRespawn if provided
    if ($null -ne $OnAgentRespawn) {
        & $OnAgentRespawn $aliveSessions
    }

    # Step 7: Get timestamp
    $timestamp = if ($null -ne $GetUtcNow) {
        & $GetUtcNow
    } else {
        [System.DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
    }

    # Step 8: Log
    Write-PipelineLog -Severity 'INFO' -Message "Bus resumed. Replayed $n events, cleaned up $m sessions."

    # Step 9: Return result
    return @{
        ReplayedEvents = $n
        CleanedSessions = $m
        ResumedAt = $timestamp
        Status = 'running'
    }
}

function Reset-ResumeState {
    # Test helper — resets any module-level state
    Reset-BusLifecycleLatch
}
