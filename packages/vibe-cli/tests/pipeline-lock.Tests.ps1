BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-state.ps1"
    . "$PSScriptRoot/../utils/pipeline-lock.ps1"
}

# =============================================================================
# TLA+ AcquireLock: idle → locked, lockHolder = 1
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

    Context 'Happy path — no existing lock' {
        It 'creates pipeline.lock in the specified directory' {
            Lock-Pipeline -LockDir $script:lockDir
            $script:lockFile | Should -Exist
        }

        It 'writes the current process ID to the lock file' {
            Lock-Pipeline -LockDir $script:lockDir
            $content = Get-Content $script:lockFile -Raw | ConvertFrom-Json
            $content.pid | Should -BeExactly $PID
        }

        It 'writes a start timestamp in ISO 8601 format' {
            Lock-Pipeline -LockDir $script:lockDir
            $content = Get-Content $script:lockFile -Raw | ConvertFrom-Json
            $content.startTime | Should -Match '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}'
        }

        It 'returns a state hashtable with pipelineState = "locked"' {
            $state = Lock-Pipeline -LockDir $script:lockDir
            $state.pipelineState | Should -BeExactly 'locked'
        }

        It 'sets lockHolder to 1 (TLA+ convention)' {
            $state = Lock-Pipeline -LockDir $script:lockDir
            $state.lockHolder | Should -BeExactly 1
        }

        It 'preserves all other Init state fields as unchanged' {
            $state = Lock-Pipeline -LockDir $script:lockDir
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

    Context 'Concurrent invocation — lock held by active process' {
        It 'throws when pipeline.lock exists and the PID is running' {
            # Create a lock file pointing to our own PID (which is definitely running)
            $lockData = @{ pid = $PID; startTime = (Get-Date).ToString('o') } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            { Lock-Pipeline -LockDir $script:lockDir } |
                Should -Throw '*already running*'
        }

        It 'includes the holding PID in the error message' {
            $lockData = @{ pid = $PID; startTime = (Get-Date).ToString('o') } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            { Lock-Pipeline -LockDir $script:lockDir } |
                Should -Throw "*$PID*"
        }

        It 'does not modify the existing lock file' {
            $lockData = @{ pid = $PID; startTime = '2026-01-01T00:00:00' } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData
            $before = Get-Content $script:lockFile -Raw

            try { Lock-Pipeline -LockDir $script:lockDir } catch { }

            $after = Get-Content $script:lockFile -Raw
            $after | Should -BeExactly $before
        }
    }

    Context 'Stale lock — crashed process' {
        It 'removes stale lock and acquires when PID is not running' {
            # Use a PID that almost certainly does not exist
            $stalePid = 99999999
            $lockData = @{ pid = $stalePid; startTime = '2026-01-01T00:00:00' } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            Mock Get-Process { throw "No process" } -ParameterFilter { $Id -eq $stalePid }

            $state = Lock-Pipeline -LockDir $script:lockDir
            $state.pipelineState | Should -BeExactly 'locked'
        }

        It 'logs a warning about the removed stale lock' {
            $stalePid = 99999999
            $lockData = @{ pid = $stalePid; startTime = '2026-01-01T00:00:00' } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            Mock Get-Process { throw "No process" } -ParameterFilter { $Id -eq $stalePid }
            Mock Write-Warning {}

            Lock-Pipeline -LockDir $script:lockDir

            Should -Invoke Write-Warning -ParameterFilter {
                $Message -match 'stale' -and $Message -match "$stalePid"
            }
        }

        It 'writes new lock data after removing the stale file' {
            $stalePid = 99999999
            $lockData = @{ pid = $stalePid; startTime = '2026-01-01T00:00:00' } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            Mock Get-Process { throw "No process" } -ParameterFilter { $Id -eq $stalePid }

            Lock-Pipeline -LockDir $script:lockDir
            $content = Get-Content $script:lockFile -Raw | ConvertFrom-Json
            $content.pid | Should -BeExactly $PID
        }
    }

    Context 'Resume rejection while lock held' {
        It 'throws with resume-specific message when -Resume and lock is active' {
            $lockData = @{ pid = $PID; startTime = (Get-Date).ToString('o') } | ConvertTo-Json
            Set-Content -Path $script:lockFile -Value $lockData

            { Lock-Pipeline -LockDir $script:lockDir -Resume } |
                Should -Throw '*Cannot resume while active*'
        }
    }
}

# =============================================================================
# TLA+ StartRunning: locked → running, lockHolder unchanged
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
        $lockData = @{ pid = $PID; startTime = (Get-Date).ToString('o') } | ConvertTo-Json
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
# TLA+ Safety: LockHeldWhileActive — lock held in all non-idle, non-terminal states
# =============================================================================

Describe 'Safety invariant: LockHeldWhileActive' {
    It 'Lock-Pipeline returns state where lockHolder=1 for active state' {
        $lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "safety-$(Get-Random)"
        New-Item -ItemType Directory -Path $lockDir -Force | Out-Null

        try {
            $state = Lock-Pipeline -LockDir $lockDir
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
# Test-PipelineLockActive — checks if lock is currently held
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

    It 'returns $true when lock file exists and PID is running' {
        $lockData = @{ pid = $PID; startTime = (Get-Date).ToString('o') } | ConvertTo-Json
        Set-Content -Path $script:lockFile -Value $lockData

        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeTrue
    }

    It 'returns $false when lock file exists but PID is not running (stale)' {
        $stalePid = 99999999
        $lockData = @{ pid = $stalePid; startTime = '2026-01-01T00:00:00' } | ConvertTo-Json
        Set-Content -Path $script:lockFile -Value $lockData

        Mock Get-Process { throw "No process" } -ParameterFilter { $Id -eq $stalePid }

        Test-PipelineLockActive -LockDir $script:lockDir | Should -BeFalse
    }
}
