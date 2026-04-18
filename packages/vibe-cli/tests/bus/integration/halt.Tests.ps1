# halt.Tests.ps1 — Integration tests for halt conditions using real SQLite
# 15 tests with real bus_lifecycle_state table

BeforeAll {
    Import-Module PSSQLite -ErrorAction SilentlyContinue
    . "$PSScriptRoot/../../../bus/domain/bus-lifecycle.ps1"
    . "$PSScriptRoot/../../../bus/router/halt.ps1"
    if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
        function global:Write-PipelineLog { param($Message, $Severity = 'INFO', $Gate = $null, $StructuredData = $null) }
    }
}

Describe 'Halt Integration Tests' {
    BeforeEach {
        $script:TestDir = Join-Path $env:TEMP "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory $script:TestDir | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'
        $script:Conn = New-SQLiteConnection -DataSource $script:DbPath
        $sql = Get-Content "$PSScriptRoot/../../../bus/schema/bus-lifecycle-state.sql" -Raw
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $sql
        Reset-HaltState
    }

    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    It 'Invoke-HaltOnAgentCrash sets busStatus=halted in DB' {
        Invoke-HaltOnAgentCrash -Connection $script:Conn -AgentName 'tla-writer'
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.BusStatus | Should -Be 'halted'
    }

    It 'Invoke-HaltOnAgentCrash sets halt_reason=mechanical_error in DB' {
        Invoke-HaltOnAgentCrash -Connection $script:Conn -AgentName 'tla-writer'
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.HaltReason | Should -Be 'mechanical_error'
    }

    It 'Invoke-HaltOnAgentCrash sets failure_category=agent_crash in DB' {
        Invoke-HaltOnAgentCrash -Connection $script:Conn -AgentName 'tla-writer'
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.FailureCategory | Should -Be 'agent_crash'
    }

    It 'Invoke-HaltOnUserInterrupt sets halt_reason=user_interrupt in DB' {
        Invoke-HaltOnUserInterrupt -Connection $script:Conn
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.HaltReason | Should -Be 'user_interrupt'
        $state.BusStatus | Should -Be 'halted'
    }

    It 'Invoke-HaltOnConsensusFailure sets halt_reason=consensus_failure in DB' {
        Invoke-HaltOnConsensusFailure -Connection $script:Conn -Reason 'no quorum'
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.HaltReason | Should -Be 'consensus_failure'
        $state.BusStatus | Should -Be 'halted'
    }

    It 'Halt-once guard: second Invoke-BusHalt call is no-op; first HaltReason wins' {
        Invoke-BusHalt -Connection $script:Conn -HaltReason 'consensus_failure'
        Invoke-BusHalt -Connection $script:Conn -HaltReason 'mechanical_error' -FailureCategory 'agent_crash'
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.HaltReason | Should -Be 'consensus_failure'
        $state.BusStatus | Should -Be 'halted'
    }

    It 'After halt, Invoke-BusResume resets busStatus=running and clears halt_reason' {
        Invoke-HaltOnAgentCrash -Connection $script:Conn -AgentName 'tla-writer'
        Invoke-BusResume -Connection $script:Conn
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.BusStatus | Should -Be 'running'
        $state.HaltReason | Should -BeNullOrEmpty
    }

    It 'Invoke-SigintDrain sets halted with user_interrupt in DB' {
        $result = Invoke-SigintDrain -Connection $script:Conn
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.BusStatus | Should -Be 'halted'
        $state.HaltReason | Should -Be 'user_interrupt'
        $result.Drained | Should -Be $true
        $result.HaltReason | Should -Be 'user_interrupt'
    }

    It 'Invoke-SigintDrain unregisters VibeBus.* event subscribers before halting' {
        Register-EngineEvent -SourceIdentifier 'VibeBus.test-event' -Action { } | Out-Null
        $before = Get-EventSubscriber | Where-Object { $_.SourceIdentifier -like 'VibeBus.*' }
        $before.Count | Should -BeGreaterThan 0
        Invoke-SigintDrain -Connection $script:Conn | Out-Null
        $after = Get-EventSubscriber | Where-Object { $_.SourceIdentifier -like 'VibeBus.*' }
        $after.Count | Should -Be 0
    }

    It 'Invoke-HaltOnSqliteError sets failure_category=sqlite_error in DB' {
        Invoke-HaltOnSqliteError -Connection $script:Conn -ErrorMessage 'SQLITE_BUSY'
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.FailureCategory | Should -Be 'sqlite_error'
        $state.BusStatus | Should -Be 'halted'
    }

    It 'Invoke-HaltOnAclViolation sets failure_category=acl_violation in DB' {
        Invoke-HaltOnAclViolation -Connection $script:Conn -SenderRole 'reviewer' -EventType 'DEPLOY'
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.FailureCategory | Should -Be 'acl_violation'
        $state.BusStatus | Should -Be 'halted'
    }

    It 'Invoke-HaltOnSchemaHashMismatch sets failure_category=schema_mismatch in DB' {
        Invoke-HaltOnSchemaHashMismatch -Connection $script:Conn -ExpectedHash 'abc' -ActualHash 'xyz'
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.FailureCategory | Should -Be 'schema_mismatch'
        $state.BusStatus | Should -Be 'halted'
    }

    It 'Virtual clock in halt function: returned Timestamp matches injected clock' {
        $fixedTime = [DateTime]::new(2026, 3, 14, 9, 26, 53, [System.DateTimeKind]::Utc)
        $result = Invoke-HaltOnAgentCrash -Connection $script:Conn -AgentName 'clock-test' -GetTimestamp { $fixedTime }
        $result.Timestamp | Should -Be $fixedTime
    }

    It 'All halt functions reset pipeline_lock=0 in DB after halt' {
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "UPDATE bus_lifecycle_state SET value='1' WHERE key='pipeline_lock'" | Out-Null
        Invoke-HaltOnAgentCrash -Connection $script:Conn -AgentName 'lock-test'
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.PipelineLock | Should -Be 0
    }

    It 'Reset-HaltState resets _HaltLatch allowing re-halt after resume' {
        Invoke-HaltOnAgentCrash -Connection $script:Conn -AgentName 'first-halt'
        Invoke-BusResume -Connection $script:Conn
        Reset-HaltState
        Invoke-HaltOnConsensusFailure -Connection $script:Conn -Reason 'second halt'
        $state = Get-BusLifecycleState -Connection $script:Conn
        $state.BusStatus | Should -Be 'halted'
        $state.HaltReason | Should -Be 'consensus_failure'
    }
}
