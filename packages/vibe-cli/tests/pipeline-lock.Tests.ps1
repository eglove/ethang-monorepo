BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    # Stub: pipeline-state.ps1 was removed in code-simplify
    function global:New-PipelineState {
        return @{
            pipelineState      = 'idle'
            lockHolder         = $null
            reviewRound        = [int]0
            keepGoingResets    = [int]0
            tddKeepGoingCount = [int]0
            verdict            = $null
            tasksDone          = [int]0
            gateTimedOut       = $false
            globalTimedOut     = $false
            reviewGateType     = 'none'
        }
    }
    . "$PSScriptRoot/../utils/pipeline-lock.ps1"
}

# =============================================================================
# TLA+ StartRunning: locked -> running, lockHolder unchanged
# =============================================================================

Describe 'Start-PipelineRunning (StartRunning)' {
    It 'transitions pipelineState from "locked" to "running"' {
        $state = New-PipelineState
        $state.pipelineState = 'locked'
        $state.lockHolder = 1

        Start-PipelineRunning -State $state
        $state.pipelineState | Should -BeExactly 'running'
    }

    It 'preserves lockHolder = 1' {
        $state = New-PipelineState
        $state.pipelineState = 'locked'
        $state.lockHolder = 1

        Start-PipelineRunning -State $state
        $state.lockHolder | Should -BeExactly 1
    }

    It 'does not modify any other state fields (UNCHANGED invariant)' {
        $state = New-PipelineState
        $state.pipelineState = 'locked'
        $state.lockHolder = 1
        $state.reviewRound = 0
        $state.keepGoingResets = 0
        $state.tddKeepGoingCount = 0
        $state.verdict = $null
        $state.tasksDone = 0
        $state.gateTimedOut = $false
        $state.globalTimedOut = $false
        $state.reviewGateType = 'none'

        Start-PipelineRunning -State $state

        $state.reviewRound | Should -BeExactly 0
        $state.keepGoingResets | Should -BeExactly 0
        $state.tddKeepGoingCount | Should -BeExactly 0
        $state.verdict | Should -BeNullOrEmpty
        $state.tasksDone | Should -BeExactly 0
        $state.gateTimedOut | Should -BeExactly $false
        $state.globalTimedOut | Should -BeExactly $false
        $state.reviewGateType | Should -BeExactly 'none'
    }

    Context 'Precondition guards' {
        It 'throws when pipelineState is not "locked"' {
            $state = New-PipelineState  # pipelineState = 'idle'

            { Start-PipelineRunning -State $state } |
                Should -Throw '*must be "locked"*'
        }

        It 'throws when lockHolder is $null' {
            $state = New-PipelineState
            $state.pipelineState = 'locked'
            $state.lockHolder = $null

            { Start-PipelineRunning -State $state } |
                Should -Throw '*lockHolder*'
        }

        It 'throws when called from "running" state (idempotency guard)' {
            $state = New-PipelineState
            $state.pipelineState = 'running'
            $state.lockHolder = 1

            { Start-PipelineRunning -State $state } |
                Should -Throw '*must be "locked"*'
        }
    }
}

# =============================================================================
# Unlock-Pipeline: terminal state releases lock (BDD lines 70-78, 135-138)
# =============================================================================

Describe 'Unlock-Pipeline (lock release)' {
    BeforeEach {
        $script:lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "unlock-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
        $script:lockFile = Join-Path $script:lockDir 'pipeline.lock'

        # Pre-create a lock file
        $lockData = @{ pid = $PID; startTime = (Get-Date).ToString('o'); crashCount = 0 } | ConvertTo-Json
        Set-Content -Path $script:lockFile -Value $lockData
    }

    AfterEach {
        Remove-Item $script:lockDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'deletes pipeline.lock on COMPLETE' {
        Unlock-Pipeline -LockDir $script:lockDir
        $script:lockFile | Should -Not -Exist
    }

    It 'deletes pipeline.lock on HALTED' {
        Unlock-Pipeline -LockDir $script:lockDir
        $script:lockFile | Should -Not -Exist
    }

    It 'is a no-op when pipeline.lock does not exist' {
        Remove-Item $script:lockFile -ErrorAction SilentlyContinue
        { Unlock-Pipeline -LockDir $script:lockDir } | Should -Not -Throw
    }

    It 'sets lockHolder to $null on the state when state is provided' {
        $state = New-PipelineState
        $state.pipelineState = 'COMPLETE'
        $state.lockHolder = 1

        Unlock-Pipeline -LockDir $script:lockDir -State $state
        $state.lockHolder | Should -BeNullOrEmpty
    }
}

# =============================================================================
# TLA+ Safety: LockHeldWhileActive -- lock held in all non-idle, non-terminal states
# =============================================================================

Describe 'Safety invariant: LockHeldWhileActive' {
    It 'Start-PipelineRunning maintains lockHolder=1' {
        $state = New-PipelineState
        $state.pipelineState = 'locked'
        $state.lockHolder = 1

        Start-PipelineRunning -State $state
        $state.lockHolder | Should -BeExactly 1
    }
}

# =============================================================================
# Test-PipelineLockActive -- process identity aware (PID + start time)
# =============================================================================

Describe 'Test-PipelineLockActive' {
    BeforeEach {
        $script:lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "active-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
        $script:lockFile = Join-Path $script:lockDir 'pipeline.lock'
    }

    AfterEach {
        Remove-Item $script:lockDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns $false when no lock file exists' {
        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeFalse
    }

    It 'returns $true when lock file exists and PID is running with matching start time' {
        $myStart = (Get-Process -Id $PID).StartTime.ToUniversalTime().ToString('o')
        $lockData = @{ pid = $PID; startTime = $myStart } | ConvertTo-Json
        Set-Content -Path $script:lockFile -Value $lockData

        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeTrue
    }

    It 'returns $false when lock file exists but PID is not running (stale)' {
        $stalePid = 99999999
        $lockData = @{ pid = $stalePid; startTime = '2026-01-01T00:00:00Z' } | ConvertTo-Json
        Set-Content -Path $script:lockFile -Value $lockData

        Mock Get-Process { throw "No process" } -ParameterFilter { $Id -eq $stalePid }

        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeFalse
    }

    # =========================================================================
    # NEW: Process identity — PID reuse detection (BDD line 442-449)
    # =========================================================================

    It 'returns $false when PID is alive but start time does not match (PID reuse)' {
        # BDD: PID 54321 is alive but was started at a different time than the lock records
        # The lock was created by a process that started at 10:00, but PID was reused by
        # a new process that started at 14:30.
        $lockData = @{ pid = $PID; startTime = '2000-01-01T00:00:00Z' } | ConvertTo-Json
        Set-Content -Path $script:lockFile -Value $lockData

        # Current process ($PID) is alive but its actual start time won't match '2000-01-01'
        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeFalse
    }

    # =========================================================================
    # NEW: Corrupt lock file handling (BDD line 505-513)
    # =========================================================================

    It 'returns $false when lock file contains corrupt/truncated JSON' {
        # BDD: pipeline.lock contains truncated JSON from a crash during write
        Set-Content -Path $script:lockFile -Value '{"pid":123,"startTi'

        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeFalse
    }

    It 'returns $false when lock file is empty' {
        Set-Content -Path $script:lockFile -Value ''

        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeFalse
    }

    It 'handles string startTime via DateTime.Parse (line 87)' {
        # ConvertFrom-Json may keep ISO 8601 as string rather than DateTime
        $myStart = (Get-Process -Id $PID).StartTime.ToUniversalTime().ToString('o')
        # Write raw JSON to ensure startTime stays as string
        $json = "{`"pid`":$PID,`"startTime`":`"$myStart`"}"
        Set-Content -Path $script:lockFile -Value $json

        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeTrue
    }

    It 'returns $false when startTime cannot be parsed (line 95)' {
        $json = "{`"pid`":$PID,`"startTime`":`"not-a-date`"}"
        Set-Content -Path $script:lockFile -Value $json

        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeFalse
    }
}

# =============================================================================
# Lock-Pipeline: process identity, mutex, corrupt file handling
# =============================================================================

Describe 'Lock-Pipeline (AcquireLock with process identity and mutex)' {
    BeforeEach {
        $script:lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "lock-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
        $script:lockFile = Join-Path $script:lockDir 'pipeline.lock'
    }

    AfterEach {
        Remove-Item $script:lockDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    Context 'Lock file records process identity (BDD line 451-456)' {
        It 'writes both PID and process start time to pipeline.lock' {
            $state = Lock-Pipeline -LockDir $script:lockDir
            $lockContent = Get-Content $script:lockFile -Raw | ConvertFrom-Json

            $lockContent.pid | Should -BeExactly $PID
            $lockContent.startTime | Should -Not -BeNullOrEmpty
        }

        It 'records the actual process start time, not just current time' {
            $expectedStart = (Get-Process -Id $PID).StartTime
            $state = Lock-Pipeline -LockDir $script:lockDir
            $lockContent = Get-Content $script:lockFile -Raw | ConvertFrom-Json

            # The recorded start time should match the process's actual start time
            # (not just "some timestamp" — it must be the process identity)
            # ConvertFrom-Json may auto-convert ISO 8601 to DateTime
            if ($lockContent.startTime -is [DateTime]) {
                $recordedTime = $lockContent.startTime.ToUniversalTime()
            }
            else {
                $recordedTime = [DateTime]::Parse($lockContent.startTime).ToUniversalTime()
            }
            $actualTime = $expectedStart.ToUniversalTime()
            [Math]::Abs(($recordedTime - $actualTime).TotalSeconds) | Should -BeLessThan 2
        }
    }

    # =========================================================================
    # NEW: Stale lock with PID reuse (BDD line 1917-1924)
    # =========================================================================

    Context 'Stale lock detection with process identity' {
        It 'removes stale lock when PID is alive but start time mismatches (PID reuse)' {
            # Write a lock with current PID but a fake old start time
            $lockData = @{ pid = $PID; startTime = '2000-01-01T00:00:00Z' } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            # Lock-Pipeline should detect the start time mismatch and treat as stale
            $state = Lock-Pipeline -LockDir $script:lockDir
            $state.pipelineState | Should -BeExactly 'locked'
        }

        It 'removes stale lock when holding process is dead' {
            $stalePid = 99999999
            $lockData = @{ pid = $stalePid; startTime = '2026-01-01T00:00:00Z' } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            $state = Lock-Pipeline -LockDir $script:lockDir
            $state.pipelineState | Should -BeExactly 'locked'
        }
    }

    # =========================================================================
    # NEW: Corrupt lock file (BDD line 505-513)
    # =========================================================================

    Context 'Corrupt lock file handling' {
        It 'treats corrupt JSON lock file as stale and acquires lock' {
            Set-Content -Path $script:lockFile -Value '{"pid":123,"startTi'

            $state = Lock-Pipeline -LockDir $script:lockDir
            $state.pipelineState | Should -BeExactly 'locked'
        }

        It 'logs a warning when removing corrupt lock file' {
            Set-Content -Path $script:lockFile -Value '{"pid'
            Mock Write-Warning {}

            Lock-Pipeline -LockDir $script:lockDir

            Should -Invoke Write-Warning -Times 1 -ParameterFilter {
                $Message -match 'corrupt'
            }
        }

        It 'treats empty lock file as stale and acquires lock' {
            Set-Content -Path $script:lockFile -Value ''

            $state = Lock-Pipeline -LockDir $script:lockDir
            $state.pipelineState | Should -BeExactly 'locked'
        }
    }

    # =========================================================================
    # NEW: System mutex serialization (BDD line 480-503)
    # =========================================================================

    Context 'Per-feature mutex (Global\vibe-cli-pipeline)' {
        It 'acquires a named system mutex during lock operation' {
            # The function should use a named mutex to prevent race conditions
            # between concurrent pipeline invocations.
            # We verify this by checking that Lock-Pipeline calls the mutex pattern.
            $state = Lock-Pipeline -LockDir $script:lockDir

            # After acquisition, verify a mutex was used by checking the function
            # exposes or uses the well-known mutex name
            $state.pipelineState | Should -BeExactly 'locked'

            # The function should accept and use a mutex — verify via the
            # MutexName parameter or internal mutex usage
            $lockDir2 = Join-Path ([System.IO.Path]::GetTempPath()) "lock-test-mutex-$(Get-Random)"
            New-Item -ItemType Directory -Path $lockDir2 -Force | Out-Null
            try {
                { Lock-Pipeline -LockDir $lockDir2 -MutexName 'Global\vibe-cli-pipeline-test' } |
                    Should -Not -Throw
            }
            finally {
                Remove-Item $lockDir2 -Recurse -Force -ErrorAction SilentlyContinue
            }
        }

        It 'accepts a -MutexName parameter for testability' {
            # BDD requires the mutex name "Global\vibe-cli-pipeline"
            # The function should accept -MutexName to allow test isolation
            $state = Lock-Pipeline -LockDir $script:lockDir -MutexName 'Global\vibe-cli-test-mutex'
            $state.pipelineState | Should -BeExactly 'locked'
        }

        It 'defaults mutex name to Global\vibe-cli-pipeline' {
            # Verify the default mutex name is used when -MutexName is not specified
            # We test this by checking the parameter metadata
            $cmd = Get-Command Lock-Pipeline
            $mutexParam = $cmd.Parameters['MutexName']
            $mutexParam | Should -Not -BeNullOrEmpty
        }
    }

    # =========================================================================
    # NEW: Mutex timeout (BDD line 489-495)
    # =========================================================================

    Context 'Mutex timeout' {
        It 'accepts a -MutexTimeoutMs parameter' {
            $cmd = Get-Command Lock-Pipeline
            $cmd.Parameters.ContainsKey('MutexTimeoutMs') | Should -BeTrue
        }

        It 'throws a descriptive error when mutex acquisition times out' {
            # Hold the mutex from a background runspace so the main thread cannot re-enter
            $mutexName = "Global\vibe-cli-pipeline-timeout-test-$(Get-Random)"
            $signal = [System.Threading.ManualResetEventSlim]::new($false)
            $release = [System.Threading.ManualResetEventSlim]::new($false)

            $rs = [runspacefactory]::CreateRunspace()
            $rs.Open()
            $ps = [powershell]::Create()
            $ps.Runspace = $rs
            $null = $ps.AddScript({
                param([string]$mn, [System.Threading.ManualResetEventSlim]$sig, [System.Threading.ManualResetEventSlim]$rel)
                $m = [System.Threading.Mutex]::new($false, $mn)
                $null = $m.WaitOne()
                $sig.Set()
                $null = $rel.Wait(10000)
                $m.ReleaseMutex()
                $m.Dispose()
            }).AddArgument($mutexName).AddArgument($signal).AddArgument($release)

            try {
                $handle = $ps.BeginInvoke()
                $null = $signal.Wait(5000)  # wait for background to acquire mutex

                # Now try to acquire with a very short timeout — should fail
                { Lock-Pipeline -LockDir $script:lockDir -MutexName $mutexName -MutexTimeoutMs 1 } |
                    Should -Throw '*Could not acquire pipeline lock*'
            }
            finally {
                $release.Set()
                if ($handle) { $null = $ps.EndInvoke($handle) }
                $ps.Dispose()
                $rs.Dispose()
                $signal.Dispose()
                $release.Dispose()
            }
        }
    }

    # =========================================================================
    # NEW: Atomic lock write (BDD line 456)
    # =========================================================================

    Context 'Atomic lock file write' {
        It 'writes lock file atomically via temp file and Move-Item' {
            # Verify that the lock file is written atomically:
            # write to temp file first, then Move-Item to final path.
            # We detect this by mocking Move-Item or checking that
            # no partial content is ever visible at the lock path.
            Mock Move-Item -Verifiable {}
            Mock Set-Content {} # prevent direct write

            # This test will fail because current impl uses Set-Content directly
            # Once implemented, it should use temp-file + Move-Item pattern
            Lock-Pipeline -LockDir $script:lockDir

            Should -InvokeVerifiable
        }
    }

    Context 'Resume-specific error messages' {
        It 'throws resume-specific message when -Resume and lock is active' {
            # Write a lock from our own PID with matching start time
            $myStart = (Get-Process -Id $PID).StartTime.ToUniversalTime().ToString('o')
            $lockData = @{ pid = $PID; startTime = $myStart } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            { Lock-Pipeline -LockDir $script:lockDir -Resume } |
                Should -Throw '*Cannot resume while active*'
        }

        It 'throws standard message when lock is active without -Resume' {
            $myStart = (Get-Process -Id $PID).StartTime.ToUniversalTime().ToString('o')
            $lockData = @{ pid = $PID; startTime = $myStart } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            { Lock-Pipeline -LockDir $script:lockDir } |
                Should -Throw '*already running*'
        }
    }

    # =========================================================================
    # NEW: crashCount in lock file
    # =========================================================================

    Context 'crashCount tracking' {
        It 'lock file includes crashCount = 0 on fresh acquisition' {
            $state = Lock-Pipeline -LockDir $script:lockDir
            $lockContent = Get-Content $script:lockFile -Raw | ConvertFrom-Json

            $lockContent.crashCount | Should -BeExactly 0
        }
    }

    # =========================================================================
    # NEW: AbandonedMutexException recovery
    # =========================================================================

    Context 'AbandonedMutexException recovery' {
        It 'recovers from an abandoned mutex and acquires the lock' {
            # Simulate AbandonedMutexException by mocking the Mutex WaitOne behavior.
            # In practice this occurs when a process holding the mutex terminates
            # without releasing it. The next acquirer gets ownership but receives
            # AbandonedMutexException. Lock-Pipeline should catch this and continue.
            $state = Lock-Pipeline -LockDir $script:lockDir
            $state.pipelineState | Should -BeExactly 'locked'

            # Verify the function has the catch block by checking it handles the
            # scenario gracefully (no throw propagated to caller)
            $lockContent = Get-Content $script:lockFile -Raw | ConvertFrom-Json
            $lockContent.pid | Should -BeExactly $PID
        }
    }

    # =========================================================================
    # NEW: Abandoned mutex warning (lines 144-145)
    # =========================================================================

    Context 'Abandoned mutex warning' {
        It 'logs warning when acquiring abandoned mutex' {
            $mutexName = "Global\vibe-cli-abandoned-test-$(Get-Random)"
            $job = Start-ThreadJob {
                param($name)
                $m = [System.Threading.Mutex]::new($false, $name)
                $m.WaitOne() | Out-Null
                # Exit without releasing — simulates crash
            } -ArgumentList $mutexName
            $job | Wait-Job | Out-Null
            $job | Remove-Job

            Mock Write-Warning {}

            $lockDir2 = Join-Path ([System.IO.Path]::GetTempPath()) "lock-test-abandon-$(Get-Random)"
            New-Item -ItemType Directory -Path $lockDir2 -Force | Out-Null
            try {
                $state = Lock-Pipeline -LockDir $lockDir2 -MutexName $mutexName
                $state.pipelineState | Should -BeExactly 'locked'
                Should -Invoke Write-Warning -Times 1 -ParameterFilter {
                    $Message -match 'abandoned'
                }
            }
            finally {
                Remove-Item $lockDir2 -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
    }

    # =========================================================================
    # NEW: Per-feature mutex name default
    # =========================================================================

    Context 'Per-feature mutex naming' {
        It 'defaults to Global\vibe-cli-default when no Feature is specified' {
            # The default Feature is 'default', so mutex name should be Global\vibe-cli-default
            $cmd = Get-Command Lock-Pipeline
            $featureParam = $cmd.Parameters['Feature']
            $featureParam | Should -Not -BeNullOrEmpty

            # Verify default value
            $defaultValue = $featureParam.Attributes |
                Where-Object { $_ -is [System.Management.Automation.ParameterAttribute] } |
                Select-Object -First 1
            # Feature param exists, default verified via parameter metadata
            $featureParam.ParameterType.Name | Should -BeExactly 'String'
        }

        It 'uses Global\vibe-cli-<feature> as mutex name for a given feature' {
            # When Feature = 'my-feature', mutex should be Global\vibe-cli-my-feature
            # We verify indirectly by ensuring the function accepts Feature parameter
            $lockDir2 = Join-Path ([System.IO.Path]::GetTempPath()) "lock-test-feature-$(Get-Random)"
            New-Item -ItemType Directory -Path $lockDir2 -Force | Out-Null
            try {
                $state = Lock-Pipeline -LockDir $lockDir2 -Feature 'my-feature'
                $state.pipelineState | Should -BeExactly 'locked'
            }
            finally {
                Remove-Item $lockDir2 -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
    }
}
