BeforeAll {
    Import-Module PSSQLite -Force

    $script:SchemaDir = Join-Path $PSScriptRoot '../../../bus/schema'
    $script:DomainScript = Join-Path $PSScriptRoot '../../../bus/domain/bus-lifecycle.ps1'

    . $script:DomainScript

    function script:New-TestDatabase {
        $dbPath = Join-Path ([System.IO.Path]::GetTempPath()) "bus-lifecycle-test-$(New-Guid).db"

        $lifecycleSql = Get-Content (Join-Path $script:SchemaDir 'bus-lifecycle-state.sql') -Raw
        $settingsSql  = Get-Content (Join-Path $script:SchemaDir 'settings.sql') -Raw

        Invoke-SqliteQuery -DataSource $dbPath -Query $lifecycleSql
        Invoke-SqliteQuery -DataSource $dbPath -Query $settingsSql

        return $dbPath
    }
}

Describe 'BusLifecycle aggregate' {
    BeforeEach {
        $script:db = New-TestDatabase
        # Reset halt latch so each test starts clean (dot-sourced, so script scope is shared)
        $script:_HaltLatch = [int]0
    }

    AfterEach {
        if ($script:db -and (Test-Path $script:db)) {
            Remove-Item $script:db -Force
        }
    }

    # -------------------------------------------------------------------------
    # Test 1: Get-BusLifecycleState returns initial state
    # -------------------------------------------------------------------------
    It 'Get-BusLifecycleState returns initial state BusStatus=running PipelineLock=0' {
        $state = Get-BusLifecycleState -Connection $script:db
        $state.BusStatus      | Should -BeExactly 'running'
        $state.PipelineLock   | Should -BeExactly 0
        $state.HaltReason     | Should -BeNullOrEmpty
        $state.FailureCategory | Should -BeNullOrEmpty
    }

    # -------------------------------------------------------------------------
    # Test 2: Invoke-BusAcquirePipelineLock returns $true on first call
    # -------------------------------------------------------------------------
    It 'Invoke-BusAcquirePipelineLock returns $true on first call' {
        $result = Invoke-BusAcquirePipelineLock -Connection $script:db
        $result | Should -BeTrue
    }

    # -------------------------------------------------------------------------
    # Test 3: Invoke-BusAcquirePipelineLock returns $false when already locked
    # -------------------------------------------------------------------------
    It 'Invoke-BusAcquirePipelineLock returns $false when already locked' {
        Invoke-BusAcquirePipelineLock -Connection $script:db | Out-Null
        $second = Invoke-BusAcquirePipelineLock -Connection $script:db
        $second | Should -BeFalse
    }

    # -------------------------------------------------------------------------
    # Test 4: Invoke-BusReleasePipelineLock releases the lock
    # -------------------------------------------------------------------------
    It 'Invoke-BusReleasePipelineLock releases the lock' {
        Invoke-BusAcquirePipelineLock -Connection $script:db | Out-Null
        Invoke-BusReleasePipelineLock -Connection $script:db
        $state = Get-BusLifecycleState -Connection $script:db
        $state.PipelineLock | Should -BeExactly 0
    }

    # -------------------------------------------------------------------------
    # Test 5: Invoke-BusHalt 'feature_complete' sets busStatus and halt_reason
    # -------------------------------------------------------------------------
    It 'Invoke-BusHalt feature_complete sets busStatus=halted halt_reason=feature_complete' {
        Invoke-BusHalt -Connection $script:db -HaltReason 'feature_complete'
        $state = Get-BusLifecycleState -Connection $script:db
        $state.BusStatus   | Should -BeExactly 'halted'
        $state.HaltReason  | Should -BeExactly 'feature_complete'
    }

    # -------------------------------------------------------------------------
    # Test 6: Invoke-BusHalt 'mechanical_error' with FailureCategory sets failure_category
    # -------------------------------------------------------------------------
    It 'Invoke-BusHalt mechanical_error with FailureCategory sets failure_category=agent_crash' {
        Invoke-BusHalt -Connection $script:db -HaltReason 'mechanical_error' -FailureCategory 'agent_crash'
        $state = Get-BusLifecycleState -Connection $script:db
        $state.FailureCategory | Should -BeExactly 'agent_crash'
    }

    # -------------------------------------------------------------------------
    # Test 7: Invoke-BusHalt 'mechanical_error' WITHOUT FailureCategory throws (invariant 15)
    # -------------------------------------------------------------------------
    It 'Invoke-BusHalt mechanical_error without FailureCategory throws invariant 15' {
        { Invoke-BusHalt -Connection $script:db -HaltReason 'mechanical_error' } |
            Should -Throw '*mechanical_error requires FailureCategory*'
    }

    # -------------------------------------------------------------------------
    # Test 8: Halt-once guard — second call is no-op
    # -------------------------------------------------------------------------
    It 'Halt-once guard: second Invoke-BusHalt is a no-op' {
        Invoke-BusHalt -Connection $script:db -HaltReason 'feature_complete'
        # Reset status to running in DB to prove second call won't re-halt with a different reason
        Invoke-SqliteQuery -DataSource $script:db -Query "UPDATE bus_lifecycle_state SET value='running' WHERE key='busStatus'"
        Invoke-SqliteQuery -DataSource $script:db -Query "UPDATE bus_lifecycle_state SET value=NULL WHERE key='halt_reason'"

        # Second call should be a no-op (latch is set)
        Invoke-BusHalt -Connection $script:db -HaltReason 'user_interrupt'

        # busStatus should still be 'running' because latch prevented the halt
        $state = Get-BusLifecycleState -Connection $script:db
        $state.BusStatus | Should -BeExactly 'running'
    }

    # -------------------------------------------------------------------------
    # Test 9: Invoke-BusResume transitions halted -> resuming
    # -------------------------------------------------------------------------
    It 'Invoke-BusResume transitions halted to resuming' {
        Invoke-BusHalt -Connection $script:db -HaltReason 'user_interrupt'
        Invoke-BusResume -Connection $script:db
        $state = Get-BusLifecycleState -Connection $script:db
        $state.BusStatus | Should -BeExactly 'resuming'
    }

    # -------------------------------------------------------------------------
    # Test 10: Invoke-BusResume throws when bus is not halted
    # -------------------------------------------------------------------------
    It 'Invoke-BusResume throws when bus is not halted' {
        { Invoke-BusResume -Connection $script:db } |
            Should -Throw '*Cannot resume: bus is not halted*'
    }

    # -------------------------------------------------------------------------
    # Test 11: Invoke-BusResumed transitions resuming -> running, clears halt fields
    # -------------------------------------------------------------------------
    It 'Invoke-BusResumed transitions resuming to running and clears halt_reason and failure_category' {
        Invoke-BusHalt -Connection $script:db -HaltReason 'mechanical_error' -FailureCategory 'agent_crash'
        Invoke-BusResume -Connection $script:db
        Invoke-BusResumed -Connection $script:db
        $state = Get-BusLifecycleState -Connection $script:db
        $state.BusStatus       | Should -BeExactly 'running'
        $state.HaltReason      | Should -BeNullOrEmpty
        $state.FailureCategory | Should -BeNullOrEmpty
    }

    # -------------------------------------------------------------------------
    # Test 12: InvHaltLatchMonotonic — after halt, $script:_HaltLatch equals 1
    # -------------------------------------------------------------------------
    It 'InvHaltLatchMonotonic: after Invoke-BusHalt _HaltLatch equals 1' {
        Invoke-BusHalt -Connection $script:db -HaltReason 'user_interrupt'
        # dot-sourced, so $script:_HaltLatch is accessible directly in this scope
        $script:_HaltLatch | Should -BeExactly 1
    }

    # -------------------------------------------------------------------------
    # Test 13: BusRunningImpliesLockHeld — after halt, pipeline_lock is released
    # -------------------------------------------------------------------------
    It 'BusRunningImpliesLockHeld invariant 13: after Invoke-BusHalt pipeline_lock is released' {
        Invoke-BusAcquirePipelineLock -Connection $script:db | Out-Null
        Invoke-BusHalt -Connection $script:db -HaltReason 'feature_complete'
        $state = Get-BusLifecycleState -Connection $script:db
        $state.PipelineLock | Should -BeExactly 0
    }

    # -------------------------------------------------------------------------
    # Test 14: Get-BusLifecycleState after halt returns correct HaltReason
    # -------------------------------------------------------------------------
    It 'Get-BusLifecycleState after halt returns correct HaltReason' {
        Invoke-BusHalt -Connection $script:db -HaltReason 'user_rollback'
        $state = Get-BusLifecycleState -Connection $script:db
        $state.HaltReason | Should -BeExactly 'user_rollback'
    }

    # -------------------------------------------------------------------------
    # Test 15: Get-BusReadProjection returns snapshot including BusStatus field
    # -------------------------------------------------------------------------
    It 'Get-BusReadProjection returns snapshot including BusStatus field' {
        $projection = Get-BusReadProjection -Connection $script:db
        $projection | Should -Not -BeNullOrEmpty
        $projection.BusStatus | Should -Not -BeNullOrEmpty
        $projection.BusStatus | Should -BeExactly 'running'
    }
}
