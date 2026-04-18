# halt.Tests.ps1 — Unit tests for bus/router/halt.ps1
# 26 tests: 13 positive halt tests + 13 negative branch tests

BeforeAll {
    $global:_HaltCalls = [System.Collections.Generic.List[hashtable]]::new()
    $global:_LogCalls  = [System.Collections.Generic.List[hashtable]]::new()

    function global:Invoke-BusHalt {
        param($Connection, [string]$HaltReason = 'mechanical_error', [string]$FailureCategory = $null)
        $global:_HaltCalls.Add(@{ HaltReason = $HaltReason; FailureCategory = $FailureCategory })
    }
    function global:Get-BusLifecycleState {
        param($Connection)
        return @{ BusStatus = 'running'; HaltReason = $null }
    }
    function global:Write-PipelineLog {
        param($Message, $Severity = 'INFO', $Gate = $null, $StructuredData = $null)
        $global:_LogCalls.Add(@{ Message = $Message; Severity = $Severity })
    }
    function global:Reset-BusLifecycleLatch { <# no-op in unit: latch is in bus-lifecycle.ps1 which is mocked #> }

    . "$PSScriptRoot/../../../bus/router/halt.ps1"
}

# ============================================================
# 13 Positive Tests — one per halt function
# ============================================================
Describe 'Halt Unit: Positive Tests' {
    BeforeEach {
        $global:_HaltCalls.Clear()
        $global:_LogCalls.Clear()
        Reset-HaltState
    }

    It 'Invoke-HaltOnAgentCrash returns Halted=true with mechanical_error/agent_crash and calls Invoke-BusHalt' {
        $result = Invoke-HaltOnAgentCrash -Connection 'mock' -AgentName 'tla-writer'
        $result.Halted | Should -Be $true
        $result.HaltReason | Should -Be 'mechanical_error'
        $result.FailureCategory | Should -Be 'agent_crash'
        $global:_HaltCalls.Count | Should -Be 1
        $global:_HaltCalls[0].HaltReason | Should -Be 'mechanical_error'
        $global:_HaltCalls[0].FailureCategory | Should -Be 'agent_crash'
    }

    It 'Invoke-HaltOnMechanicalError returns Halted=true with mechanical_error and custom FailureCategory' {
        $result = Invoke-HaltOnMechanicalError -Connection 'mock' -ErrorMessage 'disk full' -FailureCategory 'io_error'
        $result.Halted | Should -Be $true
        $result.HaltReason | Should -Be 'mechanical_error'
        $result.FailureCategory | Should -Be 'io_error'
        $global:_HaltCalls.Count | Should -Be 1
    }

    It 'Invoke-HaltOnConsensusFailure returns Halted=true with consensus_failure and null FailureCategory' {
        $result = Invoke-HaltOnConsensusFailure -Connection 'mock' -Reason 'no quorum'
        $result.Halted | Should -Be $true
        $result.HaltReason | Should -Be 'consensus_failure'
        $result.FailureCategory | Should -BeNullOrEmpty
        $global:_HaltCalls.Count | Should -Be 1
        $global:_HaltCalls[0].HaltReason | Should -Be 'consensus_failure'
    }

    It 'Invoke-HaltOnAclViolation returns Halted=true with mechanical_error/acl_violation' {
        $result = Invoke-HaltOnAclViolation -Connection 'mock' -SenderRole 'reviewer' -EventType 'WRITE_COMMIT'
        $result.Halted | Should -Be $true
        $result.HaltReason | Should -Be 'mechanical_error'
        $result.FailureCategory | Should -Be 'acl_violation'
        $global:_HaltCalls.Count | Should -Be 1
    }

    It 'Invoke-HaltOnLockHierarchyViolation returns Halted=true with mechanical_error/lock_hierarchy_violation' {
        $result = Invoke-HaltOnLockHierarchyViolation -Connection 'mock'
        $result.Halted | Should -Be $true
        $result.HaltReason | Should -Be 'mechanical_error'
        $result.FailureCategory | Should -Be 'lock_hierarchy_violation'
        $global:_HaltCalls.Count | Should -Be 1
    }

    It 'Invoke-HaltOnSqliteError returns Halted=true with mechanical_error/sqlite_error' {
        $result = Invoke-HaltOnSqliteError -Connection 'mock' -ErrorMessage 'SQLITE_BUSY'
        $result.Halted | Should -Be $true
        $result.HaltReason | Should -Be 'mechanical_error'
        $result.FailureCategory | Should -Be 'sqlite_error'
        $global:_HaltCalls.Count | Should -Be 1
    }

    It 'Invoke-HaltOnWalCheckpointFailure returns Halted=true with mechanical_error/sqlite_error' {
        $result = Invoke-HaltOnWalCheckpointFailure -Connection 'mock'
        $result.Halted | Should -Be $true
        $result.HaltReason | Should -Be 'mechanical_error'
        $result.FailureCategory | Should -Be 'sqlite_error'
        $global:_HaltCalls.Count | Should -Be 1
    }

    It 'Invoke-HaltOnUserInterrupt returns Halted=true with user_interrupt and null FailureCategory' {
        $result = Invoke-HaltOnUserInterrupt -Connection 'mock'
        $result.Halted | Should -Be $true
        $result.HaltReason | Should -Be 'user_interrupt'
        $result.FailureCategory | Should -BeNullOrEmpty
        $global:_HaltCalls.Count | Should -Be 1
        $global:_HaltCalls[0].HaltReason | Should -Be 'user_interrupt'
    }

    It 'Invoke-HaltOnQueueOverflow returns Halted=true with mechanical_error/queue_overflow' {
        $result = Invoke-HaltOnQueueOverflow -Connection 'mock' -AgentName 'debate-agent'
        $result.Halted | Should -Be $true
        $result.HaltReason | Should -Be 'mechanical_error'
        $result.FailureCategory | Should -Be 'queue_overflow'
        $global:_HaltCalls.Count | Should -Be 1
    }

    It 'Invoke-HaltOnSnapshotCorruption returns Halted=true with mechanical_error/snapshot_corruption' {
        $result = Invoke-HaltOnSnapshotCorruption -Connection 'mock' -SnapshotPath '/tmp/snap.db'
        $result.Halted | Should -Be $true
        $result.HaltReason | Should -Be 'mechanical_error'
        $result.FailureCategory | Should -Be 'snapshot_corruption'
        $global:_HaltCalls.Count | Should -Be 1
    }

    It 'Invoke-HaltOnWriteSessionStarvation returns Halted=true with mechanical_error/sqlite_error' {
        $result = Invoke-HaltOnWriteSessionStarvation -Connection 'mock' -WorktreeLeaf 'agent-abc123'
        $result.Halted | Should -Be $true
        $result.HaltReason | Should -Be 'mechanical_error'
        $result.FailureCategory | Should -Be 'sqlite_error'
        $global:_HaltCalls.Count | Should -Be 1
    }

    It 'Invoke-HaltOnMaxRetriesExceeded returns Halted=true with mechanical_error/max_retries' {
        $result = Invoke-HaltOnMaxRetriesExceeded -Connection 'mock' -Operation 'write-commit'
        $result.Halted | Should -Be $true
        $result.HaltReason | Should -Be 'mechanical_error'
        $result.FailureCategory | Should -Be 'max_retries'
        $global:_HaltCalls.Count | Should -Be 1
    }

    It 'Invoke-HaltOnSchemaHashMismatch returns Halted=true with mechanical_error/schema_mismatch' {
        $result = Invoke-HaltOnSchemaHashMismatch -Connection 'mock' -ExpectedHash 'abc123' -ActualHash 'def456'
        $result.Halted | Should -Be $true
        $result.HaltReason | Should -Be 'mechanical_error'
        $result.FailureCategory | Should -Be 'schema_mismatch'
        $global:_HaltCalls.Count | Should -Be 1
    }
}

# ============================================================
# 13 Negative Branch Tests — non-default paths / virtual clock
# ============================================================
Describe 'Halt Unit: Negative Branch Tests' {
    BeforeEach {
        $global:_HaltCalls.Clear()
        $global:_LogCalls.Clear()
        Reset-HaltState
    }

    It 'AgentCrash virtual clock — timestamp matches injected clock, elapsed < 50ms' {
        $fixedTime = [DateTime]::new(2026, 1, 1, 0, 0, 0, [System.DateTimeKind]::Utc)
        $mockTs = { $fixedTime }
        $before = [DateTime]::UtcNow
        $result = Invoke-HaltOnAgentCrash -Connection 'mock' -AgentName 'agent1' -GetTimestamp $mockTs
        $result.Timestamp | Should -Be $fixedTime
        ([DateTime]::UtcNow - $before).TotalMilliseconds | Should -BeLessThan 50
    }

    It 'MechanicalError custom FailureCategory is passed through correctly' {
        $result = Invoke-HaltOnMechanicalError -Connection 'mock' -ErrorMessage 'OOM' -FailureCategory 'out_of_memory'
        $result.FailureCategory | Should -Be 'out_of_memory'
        $global:_HaltCalls[0].FailureCategory | Should -Be 'out_of_memory'
    }

    It 'ConsensusFailure FailureCategory is null' {
        $result = Invoke-HaltOnConsensusFailure -Connection 'mock' -Reason 'deadlock'
        $result.FailureCategory | Should -BeNullOrEmpty
        $global:_HaltCalls[0].HaltReason | Should -Be 'consensus_failure'
    }

    It 'AclViolation SenderRole appears in ALARM message' {
        Invoke-HaltOnAclViolation -Connection 'mock' -SenderRole 'unauthorized-agent' -EventType 'DEPLOY' | Out-Null
        $alarm = $global:_LogCalls | Where-Object { $_.Severity -eq 'ALARM' }
        $alarm | Should -Not -BeNullOrEmpty
        (@($alarm)[0]).Message | Should -Match 'unauthorized-agent'
    }

    It 'LockHierarchyViolation FailureCategory is lock_hierarchy_violation' {
        $result = Invoke-HaltOnLockHierarchyViolation -Connection 'mock'
        $result.FailureCategory | Should -Be 'lock_hierarchy_violation'
        $global:_HaltCalls[0].FailureCategory | Should -Be 'lock_hierarchy_violation'
    }

    It 'SqliteError FailureCategory is sqlite_error' {
        $result = Invoke-HaltOnSqliteError -Connection 'mock' -ErrorMessage 'SQLITE_CORRUPT'
        $result.FailureCategory | Should -Be 'sqlite_error'
    }

    It 'WalCheckpointFailure maps to sqlite_error category' {
        $result = Invoke-HaltOnWalCheckpointFailure -Connection 'mock'
        $result.FailureCategory | Should -Be 'sqlite_error'
        $result.HaltReason | Should -Be 'mechanical_error'
    }

    It 'UserInterrupt HaltReason is user_interrupt with null category and virtual clock' {
        $fixedTime = [DateTime]::new(2026, 6, 15, 12, 0, 0, [System.DateTimeKind]::Utc)
        $result = Invoke-HaltOnUserInterrupt -Connection 'mock' -GetTimestamp { $fixedTime }
        $result.HaltReason | Should -Be 'user_interrupt'
        $result.FailureCategory | Should -BeNullOrEmpty
        $result.Timestamp | Should -Be $fixedTime
    }

    It 'QueueOverflow AgentName appears in ALARM message' {
        Invoke-HaltOnQueueOverflow -Connection 'mock' -AgentName 'writer-agent-99' | Out-Null
        $alarm = $global:_LogCalls | Where-Object { $_.Severity -eq 'ALARM' }
        $alarm | Should -Not -BeNullOrEmpty
        (@($alarm)[0]).Message | Should -Match 'writer-agent-99'
    }

    It 'SnapshotCorruption SnapshotPath appears in ALARM message' {
        Invoke-HaltOnSnapshotCorruption -Connection 'mock' -SnapshotPath '/data/snap-42.db' | Out-Null
        $alarm = $global:_LogCalls | Where-Object { $_.Severity -eq 'ALARM' }
        $alarm | Should -Not -BeNullOrEmpty
        (@($alarm)[0]).Message | Should -Match '/data/snap-42.db'
    }

    It 'WriteSessionStarvation WorktreeLeaf appears in ALARM message' {
        $result = Invoke-HaltOnWriteSessionStarvation -Connection 'mock' -WorktreeLeaf 'agent-deadbeef'
        $result.HaltReason | Should -Be 'mechanical_error'
        $result.FailureCategory | Should -Be 'sqlite_error'
        $alarm = $global:_LogCalls | Where-Object { $_.Severity -eq 'ALARM' }
        (@($alarm)[0]).Message | Should -Match 'agent-deadbeef'
    }

    It 'MaxRetriesExceeded Operation name appears in ALARM log' {
        Invoke-HaltOnMaxRetriesExceeded -Connection 'mock' -Operation 'checkpoint-wal' | Out-Null
        $alarm = $global:_LogCalls | Where-Object { $_.Severity -eq 'ALARM' }
        $alarm | Should -Not -BeNullOrEmpty
        (@($alarm)[0]).Message | Should -Match 'checkpoint-wal'
    }

    It 'SchemaHashMismatch both hashes appear in ALARM log' {
        Invoke-HaltOnSchemaHashMismatch -Connection 'mock' -ExpectedHash 'hash-aaa' -ActualHash 'hash-bbb' | Out-Null
        $alarm = $global:_LogCalls | Where-Object { $_.Severity -eq 'ALARM' }
        $alarm | Should -Not -BeNullOrEmpty
        (@($alarm)[0]).Message | Should -Match 'hash-aaa'
        (@($alarm)[0]).Message | Should -Match 'hash-bbb'
    }
}
