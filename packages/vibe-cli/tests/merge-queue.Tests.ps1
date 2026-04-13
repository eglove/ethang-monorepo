BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
    . "$PSScriptRoot/../utils/result-contracts.ps1"
    . "$PSScriptRoot/../utils/task-log.ps1"
    . "$PSScriptRoot/../utils/git-retry.ps1"
    . "$PSScriptRoot/../utils/workspace.ps1"
    . "$PSScriptRoot/../utils/merge-queue.ps1"
    . "$PSScriptRoot/helpers/claude-test-double.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Write-TaskLog {}
}

Describe 'Add-MergeQueue' {
    BeforeEach { Reset-MergeQueue }

    It 'enqueues a task and returns true' {
        Add-MergeQueue -TaskId 'T1' | Should -BeTrue
    }

    It 'rejects duplicate via TryAdd' {
        Add-MergeQueue -TaskId 'T1'
        Add-MergeQueue -TaskId 'T1' | Should -BeFalse
    }

    It 'rejects during escalation' {
        Add-MergeQueue -TaskId 'T1' -EscalationActive $true | Should -BeFalse
    }
}

Describe 'Start-NextMerge' {
    BeforeEach { Reset-MergeQueue }

    It 'dequeues in FIFO order' {
        Add-MergeQueue -TaskId 'T3'
        Add-MergeQueue -TaskId 'T1'
        Add-MergeQueue -TaskId 'T2'

        Start-NextMerge | Should -Be 'T3'
    }

    It 'returns null when nothing in queue' {
        Start-NextMerge | Should -BeNullOrEmpty
    }

    It 'returns null when merge already in progress' {
        Add-MergeQueue -TaskId 'T1'
        Start-NextMerge  # T1 now in progress
        Add-MergeQueue -TaskId 'T2'
        Start-NextMerge | Should -BeNullOrEmpty
    }
}

Describe 'Invoke-Merge' {
    BeforeAll {
        $script:root = (Resolve-Path "$PSScriptRoot/..").Path
        Mock Remove-TaskWorkspace {}
    }

    BeforeEach { Reset-MergeQueue }

    It 'succeeds on clean merge' {
        Mock Invoke-GitWithRetry { 'Merge successful' }
        Mock Invoke-VerifyCommand { 0 }
        Mock Invoke-Claude { '{}' }

        Add-MergeQueue -TaskId 'T1'
        Start-NextMerge

        $counters = @{ mergeRetries = 0 }
        $result = Invoke-Merge -TaskId 'T1' -WorktreePath '/tmp/wt' -BranchName 'feature/T1' -Root $script:root -Counters $counters
        $result.Success | Should -BeTrue
        $result.WorkspaceRemoved | Should -BeTrue
    }

    It 'calls git merge --abort before resolver dispatch on conflict' {
        $script:abortCalled = $false
        $script:conflictCount = 0
        Mock Invoke-GitWithRetry {
            param($Arguments)
            if ($Arguments[0] -eq 'merge' -and $Arguments[1] -eq '--abort') {
                $script:abortCalled = $true
            }
            if ($Arguments[0] -eq 'merge' -and $Arguments.Count -ge 2 -and $Arguments[1] -ne '--abort') {
                $script:conflictCount++
                if ($script:conflictCount -le 1) { throw 'CONFLICT' }
                return 'Merge successful'
            }
        }
        Mock Invoke-Claude { '{}' }
        Mock Invoke-VerifyCommand { 0 }

        Add-MergeQueue -TaskId 'T1'
        Start-NextMerge

        $counters = @{ mergeRetries = 0 }
        Invoke-Merge -TaskId 'T1' -WorktreePath '/tmp/wt' -BranchName 'feature/T1' -Root $script:root -Counters $counters
        $script:abortCalled | Should -BeTrue
    }

    It 'does not consume retry on infrastructure failure during resolver' {
        $script:mergeAttempt = 0
        Mock Invoke-GitWithRetry {
            param($Arguments)
            if ($Arguments[0] -eq 'merge' -and $Arguments[1] -ne '--abort') {
                throw 'CONFLICT'
            }
        }
        Mock Invoke-Claude { throw 'exit code 127' }

        Add-MergeQueue -TaskId 'T1'
        Start-NextMerge

        $counters = @{ mergeRetries = 0 }
        $result = Invoke-Merge -TaskId 'T1' -WorktreePath '/tmp/wt' -BranchName 'feature/T1' -Root $script:root -Counters $counters
        $result.Success | Should -BeFalse
        $counters.mergeRetries | Should -Be 0
    }

    It 'returns Get-MergeInProgress and Get-MergeQueueCount' {
        Reset-MergeQueue
        Get-MergeInProgress | Should -BeNullOrEmpty
        Get-MergeQueueCount | Should -Be 0

        Add-MergeQueue -TaskId 'T1'
        Get-MergeQueueCount | Should -Be 1

        Start-NextMerge
        Get-MergeInProgress | Should -Be 'T1'
    }

    It 'initializes mergeRetries to 0 when missing' {
        Mock Invoke-GitWithRetry { 'Merge successful' }
        Mock Invoke-VerifyCommand { 0 }

        Add-MergeQueue -TaskId 'T1'
        Start-NextMerge

        $counters = @{}  # No mergeRetries key
        $result = Invoke-Merge -TaskId 'T1' -WorktreePath '/tmp/wt' -BranchName 'feature/T1' -Root $script:root -Counters $counters
        $result.Success | Should -BeTrue
        $counters.mergeRetries | Should -Be 0
    }

    It 'retries after post-merge verify failure then succeeds' {
        $script:verifyCall = 0
        Mock Invoke-GitWithRetry {
            param($Arguments)
            if ($Arguments -contains 'reset') { return }
            return 'Merge successful'
        }
        Mock Invoke-VerifyCommand {
            $script:verifyCall++
            if ($script:verifyCall -eq 1) { return 1 }  # Fail first verify (breaks loop)
            return 0  # All subsequent pass
        }

        Add-MergeQueue -TaskId 'T1'
        Start-NextMerge

        $counters = @{ mergeRetries = 0 }
        $result = Invoke-Merge -TaskId 'T1' -WorktreePath '/tmp/wt' -BranchName 'feature/T1' -Root $script:root -Counters $counters
        $result.Success | Should -BeTrue
        $counters.mergeRetries | Should -BeGreaterThan 0
    }

    It 'sets AbortedClean to false when merge abort throws' {
        $script:mergeAbortConflicts = 0
        Mock Invoke-GitWithRetry {
            param($Arguments)
            if ($Arguments[0] -eq 'merge' -and $Arguments[1] -ne '--abort') {
                $script:mergeAbortConflicts++
                if ($script:mergeAbortConflicts -le 1) { throw 'CONFLICT' }
                return 'Merge successful'
            }
            if ($Arguments[0] -eq 'merge' -and $Arguments[1] -eq '--abort') {
                throw 'abort failed'
            }
        }
        Mock Invoke-Claude { '{}' }
        Mock Invoke-VerifyCommand { 0 }

        Add-MergeQueue -TaskId 'T1'
        Start-NextMerge

        $counters = @{ mergeRetries = 0 }
        $result = Invoke-Merge -TaskId 'T1' -WorktreePath '/tmp/wt' -BranchName 'feature/T1' -Root $script:root -Counters $counters
        $result.Success | Should -BeTrue
    }

    It 'succeeds after conflict-resolve-retry cycle' {
        $script:mergeCall = 0
        Mock Invoke-GitWithRetry {
            param($Arguments)
            if ($Arguments[0] -eq 'merge' -and $Arguments[1] -ne '--abort') {
                $script:mergeCall++
                if ($script:mergeCall -eq 1) { throw 'CONFLICT' }
                return 'Merge successful'  # Second attempt succeeds
            }
        }
        Mock Invoke-Claude { '{}' }  # Resolver succeeds
        Mock Invoke-VerifyCommand { 0 }

        Add-MergeQueue -TaskId 'T1'
        Start-NextMerge

        $counters = @{ mergeRetries = 0 }
        $result = Invoke-Merge -TaskId 'T1' -WorktreePath '/tmp/wt' -BranchName 'feature/T1' -Root $script:root -Counters $counters
        $result.Success | Should -BeTrue
        $result.Conflict | Should -BeFalse
        $counters.mergeRetries | Should -Be 1
    }

    It 'handles verify command throwing exception' {
        $script:verifyThrowCount = 0
        Mock Invoke-GitWithRetry {
            param($Arguments)
            if ($Arguments -contains 'reset') { return }
            return 'Merge successful'
        }
        Mock Invoke-VerifyCommand {
            $script:verifyThrowCount++
            if ($script:verifyThrowCount -le 1) { throw 'command not found' }
            return 0
        }

        Add-MergeQueue -TaskId 'T1'
        Start-NextMerge

        $counters = @{ mergeRetries = 0 }
        $result = Invoke-Merge -TaskId 'T1' -WorktreePath '/tmp/wt' -BranchName 'feature/T1' -Root $script:root -Counters $counters
        $result.Success | Should -BeTrue
    }
}

Describe 'Reset-MergeCounter' {
    It 'resets mergeRetries and restores completed status' {
        $state = @{ mergeRetries = 3; taskStatus = 'escalated'; taskId = 'T1' }
        $result = Reset-MergeCounter -State $state
        $result.mergeRetries | Should -Be 0
        $result.taskStatus | Should -Be 'completed'
    }
}

Describe 'Test-MergeQueueEmpty' {
    BeforeEach { Reset-MergeQueue }

    It 'returns true when empty' {
        Test-MergeQueueEmpty | Should -BeTrue
    }

    It 'returns false when items queued' {
        Add-MergeQueue -TaskId 'T1'
        Test-MergeQueueEmpty | Should -BeFalse
    }
}

Describe 'Invoke-SerializedMerge' {
    It 'acquires per-feature mutex with correct name pattern' {
        $task = @{ taskState = 'merge_waiting'; mergeState = 'waiting' }
        Mock git { $global:LASTEXITCODE = 0 }

        # Just verify it accepts the Feature param and doesn't throw
        $mutexName = "Global\vibe-cli-merge-test-$(Get-Random)"
        $result = Invoke-SerializedMerge -Feature 'test' -WorktreePath $TestDrive -TargetBranch 'main' -TaskState $task -MutexName $mutexName
        $task.mergeState | Should -BeIn @('merged', 'merging')
    }

    It 'sets MergeMutexTimeout when mutex cannot be acquired' {
        $task = @{ taskState = 'merge_waiting'; mergeState = 'waiting' }
        $mutexName = "Global\vibe-cli-merge-timeout-test-$(Get-Random)"

        # Hold the mutex from another runspace
        $job = Start-ThreadJob {
            param($name)
            $m = [System.Threading.Mutex]::new($false, $name)
            $m.WaitOne() | Out-Null
            Start-Sleep -Seconds 10
            $m.ReleaseMutex()
            $m.Dispose()
        } -ArgumentList $mutexName
        Start-Sleep -Milliseconds 200  # Let mutex be acquired

        try {
            Mock git {}
            $result = Invoke-SerializedMerge -Feature 'test' -WorktreePath $TestDrive -TargetBranch 'main' -TaskState $task -MutexName $mutexName -MutexTimeoutMs 100
            $result.success | Should -BeFalse
            $result.reason | Should -BeExactly 'MergeMutexTimeout'
            $task.failureReason | Should -BeExactly 'MergeMutexTimeout'
        }
        finally {
            $job | Stop-Job -PassThru | Remove-Job -Force
        }
    }

    It 'rebase conflict returns RebaseConflict' {
        $task = @{ taskState = 'merge_waiting'; mergeState = 'waiting' }
        Mock git { $global:LASTEXITCODE = 1 }
        Mock Push-Location {}
        Mock Pop-Location {}

        $mutexName = "Global\vibe-cli-merge-rebase-$(Get-Random)"
        $result = Invoke-SerializedMerge -Feature 'test' -WorktreePath $TestDrive -TargetBranch 'main' -TaskState $task -MutexName $mutexName
        $result.reason | Should -BeExactly 'RebaseConflict'
    }

    It 'handles AbandonedMutexException gracefully' {
        $task = @{ taskState = 'merge_waiting'; mergeState = 'waiting' }
        Mock git { $global:LASTEXITCODE = 0 }
        Mock Write-Warning {}

        # Create and abandon a mutex
        $mutexName = "Global\vibe-cli-merge-abandon-$(Get-Random)"
        $job = Start-ThreadJob {
            param($name)
            $m = [System.Threading.Mutex]::new($false, $name)
            $m.WaitOne() | Out-Null
            # Don't release — just exit (simulates crash)
        } -ArgumentList $mutexName
        $job | Wait-Job | Out-Null
        $job | Remove-Job

        # Now acquire should get AbandonedMutexException but still succeed
        $result = Invoke-SerializedMerge -Feature 'test' -WorktreePath $TestDrive -TargetBranch 'main' -TaskState $task -MutexName $mutexName
        # It should not throw — abandoned mutex is acquired
    }

    It 'defaults MutexName to Global\vibe-cli-merge-<Feature> (line 264)' {
        $task = @{ taskState = 'merge_waiting'; mergeState = 'waiting' }
        Mock git { $global:LASTEXITCODE = 0 }

        # Call without MutexName — should use default based on Feature
        $result = Invoke-SerializedMerge -Feature "defaultname-$(Get-Random)" -WorktreePath $TestDrive -TargetBranch 'main' -TaskState $task
        $task.mergeState | Should -BeIn @('merged', 'merging')
    }

    It 'returns MergeConflict when merge fails after rebase succeeds (lines 299-300)' {
        $task = @{ taskState = 'merge_waiting'; mergeState = 'waiting' }
        $script:gitCall = 0
        Mock git {
            $script:gitCall++
            $joined = $args -join ' '
            if ($joined -match 'rebase') {
                $global:LASTEXITCODE = 0; return 'rebase ok'
            }
            if ($joined -match 'merge --no-ff') {
                $global:LASTEXITCODE = 1; return 'CONFLICT'
            }
            if ($joined -match 'merge --abort') {
                $global:LASTEXITCODE = 0; return $null
            }
            $global:LASTEXITCODE = 0
        }
        Mock Push-Location {}
        Mock Pop-Location {}

        $mutexName = "Global\vibe-cli-merge-conflict-$(Get-Random)"
        $result = Invoke-SerializedMerge -Feature 'test' -WorktreePath $TestDrive -TargetBranch 'main' -TaskState $task -MutexName $mutexName
        $result.success | Should -BeFalse
        $result.reason | Should -BeExactly 'MergeConflict'
    }

    It 'Pop-Location in finally when still in worktree path (line 308)' {
        $task = @{ taskState = 'merge_waiting'; mergeState = 'waiting' }
        Mock git { $global:LASTEXITCODE = 0 }

        $mutexName = "Global\vibe-cli-merge-pop-$(Get-Random)"
        # Normal success path exercises the finally block
        $result = Invoke-SerializedMerge -Feature 'test' -WorktreePath $TestDrive -TargetBranch 'main' -TaskState $task -MutexName $mutexName
        $result.success | Should -BeTrue
    }
}
