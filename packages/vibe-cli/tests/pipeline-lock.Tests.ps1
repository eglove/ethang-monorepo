BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-state.ps1"
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
}
