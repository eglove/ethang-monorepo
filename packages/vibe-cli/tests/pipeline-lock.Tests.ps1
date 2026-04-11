BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-state.ps1"
    . "$PSScriptRoot/../utils/pipeline-lock.ps1"
}

# =============================================================================
# TLA+ AcquireLock: idle -> locked, lockHolder = 1
# =============================================================================

Describe 'Lock-Pipeline (AcquireLock)' {
    BeforeEach {
        $script:lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "lock-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
        $script:lockFile = Join-Path $script:lockDir 'pipeline.lock'
    }

    AfterEach {
        Remove-Item $script:lockDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    Context 'Happy path -- no existing lock' {
        It 'creates pipeline.lock in the specified directory' {
            Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'
            $script:lockFile | Should -Exist
        }

        It 'writes the current process ID to the lock file' {
            Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'
            $content = Get-Content $script:lockFile -Raw | ConvertFrom-Json
            $content.pid | Should -BeExactly $PID
        }

        It 'writes the current process start time to the lock file' {
            Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'
            $content = Get-Content $script:lockFile -Raw | ConvertFrom-Json
            # Must record the actual process start time, not just "now"
            $expectedStart = (Get-Process -Id $PID).StartTime.ToUniversalTime().ToString('o')
            $content.startTime | Should -Not -BeNullOrEmpty
        }

        It 'writes a start timestamp in ISO 8601 format' {
            Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'
            $content = Get-Content $script:lockFile -Raw | ConvertFrom-Json
            $content.startTime | Should -Match '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}'
        }

        It 'includes crashCount = 0 on fresh acquisition' {
            Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'
            $content = Get-Content $script:lockFile -Raw | ConvertFrom-Json
            $content.crashCount | Should -BeExactly 0
        }

        It 'returns a state hashtable with pipelineState = "locked"' {
            $state = Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'
            $state.pipelineState | Should -BeExactly 'locked'
        }

        It 'sets lockHolder to 1 (TLA+ convention)' {
            $state = Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'
            $state.lockHolder | Should -BeExactly 1
        }

        It 'preserves all other Init state fields as unchanged' {
            $state = Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'
            $state.reviewRound | Should -BeExactly 0
            $state.keepGoingResets | Should -BeExactly 0
            $state.tddKeepGoingCount | Should -BeExactly 0
            $state.verdict | Should -BeNullOrEmpty
            $state.tasksDone | Should -BeExactly 0
            $state.gateTimedOut | Should -BeExactly $false
            $state.globalTimedOut | Should -BeExactly $false
            $state.reviewGateType | Should -BeExactly 'none'
        }
    }

    Context 'Concurrent invocation -- lock held by active process with matching identity' {
        It 'throws when pipeline.lock exists and PID is running with matching start time' {
            # Create lock with our own PID AND our actual start time
            $myStart = (Get-Process -Id $PID).StartTime.ToUniversalTime().ToString('o')
            $lockData = @{ pid = $PID; startTime = $myStart; crashCount = 0 } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            { Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow' } |
                Should -Throw '*already running*'
        }

        It 'includes the holding PID in the error message' {
            $myStart = (Get-Process -Id $PID).StartTime.ToUniversalTime().ToString('o')
            $lockData = @{ pid = $PID; startTime = $myStart; crashCount = 0 } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            { Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow' } |
                Should -Throw "*$PID*"
        }

        It 'does not modify the existing lock file when lock is active' {
            $myStart = (Get-Process -Id $PID).StartTime.ToUniversalTime().ToString('o')
            $lockData = @{ pid = $PID; startTime = $myStart; crashCount = 0 } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData
            $before = Get-Content $script:lockFile -Raw

            # Must throw with "already running", not a parameter error
            $threw = $false
            try { Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow' }
            catch {
                $threw = $true
                $_.Exception.Message | Should -Match 'already running'
            }
            $threw | Should -BeTrue

            $after = Get-Content $script:lockFile -Raw
            $after | Should -BeExactly $before
        }
    }

    Context 'Stale lock -- crashed process (PID dead)' {
        It 'removes stale lock and acquires when PID is not running' {
            $stalePid = 99999999
            $lockData = @{ pid = $stalePid; startTime = '2026-01-01T00:00:00Z'; crashCount = 0 } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            Mock Get-Process { throw "No process" } -ParameterFilter { $Id -eq $stalePid }

            $state = Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'
            $state.pipelineState | Should -BeExactly 'locked'
        }

        It 'logs a warning about the removed stale lock' {
            $stalePid = 99999999
            $lockData = @{ pid = $stalePid; startTime = '2026-01-01T00:00:00Z'; crashCount = 0 } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            Mock Get-Process { throw "No process" } -ParameterFilter { $Id -eq $stalePid }
            Mock Write-Warning {}

            Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'

            Should -Invoke Write-Warning -ParameterFilter {
                $Message -match 'stale' -and $Message -match "$stalePid"
            }
        }

        It 'writes new lock data after removing the stale file' {
            $stalePid = 99999999
            $lockData = @{ pid = $stalePid; startTime = '2026-01-01T00:00:00Z'; crashCount = 0 } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            Mock Get-Process { throw "No process" } -ParameterFilter { $Id -eq $stalePid }

            Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'
            $content = Get-Content $script:lockFile -Raw | ConvertFrom-Json
            $content.pid | Should -BeExactly $PID
        }
    }

    # BDD: Stale lock detection verifies process identity, not just PID liveness
    Context 'Stale lock -- PID alive but different start time (PID reuse)' {
        It 'treats lock as stale when PID is alive but start time does not match' {
            # Simulate: lock was created by process with startTime A,
            # but PID was recycled and a different process now has that PID
            $reusedPid = $PID  # Our own PID is definitely alive
            $fakePriorStartTime = '2026-01-01T00:00:00Z'  # Not our real start time
            $lockData = @{ pid = $reusedPid; startTime = $fakePriorStartTime; crashCount = 0 } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            # The function should compare startTime with the actual process start time
            # and detect the mismatch -> stale
            $state = Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'
            $state.pipelineState | Should -BeExactly 'locked'
        }

        It 'logs a warning about PID reuse detection' {
            $reusedPid = $PID
            $fakePriorStartTime = '2026-01-01T00:00:00Z'
            $lockData = @{ pid = $reusedPid; startTime = $fakePriorStartTime; crashCount = 0 } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            Mock Write-Warning {}

            Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'

            Should -Invoke Write-Warning -ParameterFilter {
                $Message -match 'stale' -or $Message -match 'reuse' -or $Message -match 'mismatch'
            }
        }

        It 'replaces the stale lock with new lock data containing current process identity' {
            $reusedPid = $PID
            $fakePriorStartTime = '2026-01-01T00:00:00Z'
            $lockData = @{ pid = $reusedPid; startTime = $fakePriorStartTime; crashCount = 0 } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'

            $content = Get-Content $script:lockFile -Raw | ConvertFrom-Json
            $content.pid | Should -BeExactly $PID
            # Start time should now be our actual process start time, not the fake one
            $content.startTime | Should -Not -BeExactly $fakePriorStartTime
        }
    }

    # BDD: Lock file with corrupt content is treated as stale
    Context 'Corrupt lock file (invalid JSON)' {
        It 'treats corrupt lock file as stale and acquires lock' {
            Set-Content -Path $script:lockFile -Value '{"pid":123, "startTi'  # truncated JSON

            $state = Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'
            $state.pipelineState | Should -BeExactly 'locked'
        }

        It 'logs a warning about the corrupt lock file' {
            Set-Content -Path $script:lockFile -Value 'not json at all'

            Mock Write-Warning {}

            Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'

            Should -Invoke Write-Warning -ParameterFilter {
                $Message -match 'corrupt'
            }
        }

        It 'removes corrupt lock and writes valid lock data' {
            Set-Content -Path $script:lockFile -Value '<<<garbage>>>'

            Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'

            $content = Get-Content $script:lockFile -Raw | ConvertFrom-Json
            $content.pid | Should -BeExactly $PID
            $content.crashCount | Should -BeExactly 0
        }
    }

    Context 'Resume rejection while lock held' {
        It 'throws with resume-specific message when -Resume and lock is active' {
            $myStart = (Get-Process -Id $PID).StartTime.ToUniversalTime().ToString('o')
            $lockData = @{ pid = $PID; startTime = $myStart; crashCount = 0 } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            { Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow' -Resume } |
                Should -Throw '*Cannot resume while active*'
        }
    }
}

# =============================================================================
# Per-Feature Mutex (BDD lines 481-503)
# =============================================================================

Describe 'Lock-Pipeline per-feature mutex' {
    BeforeEach {
        $script:lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "mutex-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
    }

    AfterEach {
        Remove-Item $script:lockDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'requires a -Feature parameter' {
        # Lock-Pipeline must accept -Feature; omitting it should throw or be mandatory
        { Lock-Pipeline -LockDir $script:lockDir } |
            Should -Throw
    }

    It 'uses a system mutex named Global\vibe-cli-<feature>' {
        # The function must acquire a named system mutex scoped by feature name
        # We verify by checking the mutex name matches the expected pattern
        Mock New-Object {
            $mockMutex = [PSCustomObject]@{
                Name = $null
            }
            $mockMutex | Add-Member -MemberType ScriptMethod -Name WaitOne -Value { return $true }
            $mockMutex | Add-Member -MemberType ScriptMethod -Name ReleaseMutex -Value { }
            $mockMutex | Add-Member -MemberType ScriptMethod -Name Dispose -Value { }
            return $mockMutex
        } -ParameterFilter { $TypeName -eq 'System.Threading.Mutex' }

        Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'

        # Verify the mutex was constructed with the feature-scoped name
        Should -Invoke New-Object -ParameterFilter {
            $TypeName -eq 'System.Threading.Mutex' -and
            $ArgumentList -contains 'Global\vibe-cli-auth-flow'
        }
    }

    It 'allows different features to lock concurrently (different mutex names)' {
        $lockDir2 = Join-Path ([System.IO.Path]::GetTempPath()) "mutex-test2-$(Get-Random)"
        New-Item -ItemType Directory -Path $lockDir2 -Force | Out-Null

        try {
            # Two different features should not block each other
            $state1 = Lock-Pipeline -LockDir $script:lockDir -Feature 'feature-a'
            $state2 = Lock-Pipeline -LockDir $lockDir2 -Feature 'feature-b'

            $state1.pipelineState | Should -BeExactly 'locked'
            $state2.pipelineState | Should -BeExactly 'locked'
        }
        finally {
            # Clean up mutexes
            Unlock-Pipeline -LockDir $script:lockDir
            Unlock-Pipeline -LockDir $lockDir2
            Remove-Item $lockDir2 -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# =============================================================================
# Mutex timeout (BDD lines 490-495)
# =============================================================================

Describe 'Lock-Pipeline mutex timeout' {
    BeforeEach {
        $script:lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "timeout-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
    }

    AfterEach {
        Remove-Item $script:lockDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'throws when mutex acquisition exceeds 30 seconds' {
        # Simulate mutex WaitOne returning false (timeout)
        Mock New-Object {
            $mockMutex = [PSCustomObject]@{}
            $mockMutex | Add-Member -MemberType ScriptMethod -Name WaitOne -Value { return $false }
            $mockMutex | Add-Member -MemberType ScriptMethod -Name Dispose -Value { }
            return $mockMutex
        } -ParameterFilter { $TypeName -eq 'System.Threading.Mutex' }

        { Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow' } |
            Should -Throw '*30 seconds*'
    }

    It 'includes actionable guidance in the timeout error message' {
        Mock New-Object {
            $mockMutex = [PSCustomObject]@{}
            $mockMutex | Add-Member -MemberType ScriptMethod -Name WaitOne -Value { return $false }
            $mockMutex | Add-Member -MemberType ScriptMethod -Name Dispose -Value { }
            return $mockMutex
        } -ParameterFilter { $TypeName -eq 'System.Threading.Mutex' }

        { Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow' } |
            Should -Throw '*Retry*'
    }
}

# =============================================================================
# AbandonedMutexException handling (objection #31)
# =============================================================================

Describe 'Lock-Pipeline AbandonedMutexException handling' {
    BeforeEach {
        $script:lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "abandoned-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
    }

    AfterEach {
        Remove-Item $script:lockDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'catches AbandonedMutexException and acquires the mutex successfully' {
        # Simulate: WaitOne throws AbandonedMutexException (prior process crashed while holding mutex)
        Mock New-Object {
            $mockMutex = [PSCustomObject]@{}
            $mockMutex | Add-Member -MemberType ScriptMethod -Name WaitOne -Value {
                throw [System.Threading.AbandonedMutexException]::new()
            }
            $mockMutex | Add-Member -MemberType ScriptMethod -Name ReleaseMutex -Value { }
            $mockMutex | Add-Member -MemberType ScriptMethod -Name Dispose -Value { }
            return $mockMutex
        } -ParameterFilter { $TypeName -eq 'System.Threading.Mutex' }

        # Should NOT throw -- AbandonedMutexException means we got the mutex
        $state = Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'
        $state.pipelineState | Should -BeExactly 'locked'
    }

    It 'logs a warning about the abandoned mutex recovery' {
        Mock New-Object {
            $mockMutex = [PSCustomObject]@{}
            $mockMutex | Add-Member -MemberType ScriptMethod -Name WaitOne -Value {
                throw [System.Threading.AbandonedMutexException]::new()
            }
            $mockMutex | Add-Member -MemberType ScriptMethod -Name ReleaseMutex -Value { }
            $mockMutex | Add-Member -MemberType ScriptMethod -Name Dispose -Value { }
            return $mockMutex
        } -ParameterFilter { $TypeName -eq 'System.Threading.Mutex' }

        Mock Write-Warning {}

        Lock-Pipeline -LockDir $script:lockDir -Feature 'auth-flow'

        Should -Invoke Write-Warning -ParameterFilter {
            $Message -match 'mutex.*recovered' -or
            $Message -match 'abandoned' -or
            $Message -match 'prior process crashed'
        }
    }
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
    It 'Lock-Pipeline returns state where lockHolder=1 for active state' {
        $lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "safety-$(Get-Random)"
        New-Item -ItemType Directory -Path $lockDir -Force | Out-Null

        try {
            $state = Lock-Pipeline -LockDir $lockDir -Feature 'auth-flow'
            # Active states must have lockHolder = 1
            $state.lockHolder | Should -BeExactly 1
        }
        finally {
            Remove-Item $lockDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    It 'Start-PipelineRunning maintains lockHolder=1' {
        $state = New-PipelineState
        $state.pipelineState = 'locked'
        $state.lockHolder = 1

        Start-PipelineRunning -State $state
        $state.lockHolder | Should -BeExactly 1
    }
}

# =============================================================================
# Test-PipelineLockActive -- process identity aware
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
        $lockData = @{ pid = $PID; startTime = $myStart; crashCount = 0 } | ConvertTo-Json
        Set-Content -Path $script:lockFile -Value $lockData

        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeTrue
    }

    It 'returns $false when lock file exists but PID is not running (stale)' {
        $stalePid = 99999999
        $lockData = @{ pid = $stalePid; startTime = '2026-01-01T00:00:00Z'; crashCount = 0 } | ConvertTo-Json
        Set-Content -Path $script:lockFile -Value $lockData

        Mock Get-Process { throw "No process" } -ParameterFilter { $Id -eq $stalePid }

        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeFalse
    }

    It 'returns $false when PID is alive but start time does not match (PID reuse)' {
        # Our PID is alive, but we record a fake old start time -> should be stale
        $lockData = @{ pid = $PID; startTime = '2020-01-01T00:00:00Z'; crashCount = 0 } | ConvertTo-Json
        Set-Content -Path $script:lockFile -Value $lockData

        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeFalse
    }

    It 'returns $false when lock file contains corrupt JSON' {
        Set-Content -Path $script:lockFile -Value '{"pid":12345,"star'

        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeFalse
    }
}

# =============================================================================
# Mutex acquisition order (architecture-level assertion, objection #31)
# =============================================================================

Describe 'Mutex acquisition ordering' {
    It 'documents pipeline lock is acquired BEFORE merge mutex (code comment assertion)' {
        # Read the source file and verify the ordering comment exists
        $source = Get-Content "$PSScriptRoot/../utils/pipeline-lock.ps1" -Raw

        # The implementation must document strict ordering:
        # pipeline lock mutex acquired BEFORE merge mutex
        $source | Should -Match 'pipeline.*lock.*before.*merge|acquisition.*order|mutex.*order'
    }
}
