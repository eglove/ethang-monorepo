# CrashCoordinationDomainService — OBJ-R5-4
# Cross-aggregate crash coordination. Invoke-AgentSessionCrash does NOT directly call
# CommitSerializer or HandlerAdapter; coordination routes through Invoke-BusCrashCoordination.

function Invoke-BusCrashCoordination {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$AgentName,
        [Parameter(Mandatory)][string]$SessionId,
        [Parameter(Mandatory)][int64]$DeathEpoch,
        [scriptblock]$OnHandlerCleanup = $null,  # injectable for tests
        [scriptblock]$OnCommitCleanup = $null    # injectable for tests
    )

    # 1. Mark session as dead
    Set-AgentSessionDead -Connection $Connection -SessionId $SessionId -DeathEpoch $DeathEpoch

    # 2. Call handler cleanup if provided
    if ($OnHandlerCleanup) {
        & $OnHandlerCleanup $AgentName
    }

    # 3. Call commit cleanup if provided
    if ($OnCommitCleanup) {
        & $OnCommitCleanup $AgentName
    }

    # 4. Mark session as ended
    Set-AgentSessionEnded -Connection $Connection -SessionId $SessionId

    # 5. Emit log
    Write-PipelineLog -Severity 'WARN' -Message "Crash coordination complete for agent '$AgentName' session '$SessionId'"

    # 6. Return result
    return @{
        AgentName   = $AgentName
        SessionId   = $SessionId
        DeathEpoch  = $DeathEpoch
        Coordinated = $true
    }
}

function Test-CommitLockEventuallyReleased {
    param(
        [Parameter(Mandatory)][string]$WorktreeLeaf,
        [int]$MaxWaitMs = 5000,
        [scriptblock]$GetUtcNow = $null
    )

    $startTime = if ($GetUtcNow) { & $GetUtcNow } else { [DateTime]::UtcNow }

    while ($true) {
        # Check if any session is held for this worktree
        $hasActiveSession = $false
        foreach ($kv in $script:_ActiveSessions.GetEnumerator()) {
            if ($kv.Value.WorktreeLeaf -eq $WorktreeLeaf -and $kv.Value.Status -eq 'Acquired') {
                $hasActiveSession = $true
                break
            }
        }

        if (-not $hasActiveSession) {
            return $true
        }

        # Check timeout using virtual or real clock
        $now = if ($GetUtcNow) { & $GetUtcNow } else { [DateTime]::UtcNow }
        $elapsed = ($now - $startTime).TotalMilliseconds
        if ($elapsed -ge $MaxWaitMs) {
            return $false
        }

        Start-Sleep -Milliseconds 10
    }
}
