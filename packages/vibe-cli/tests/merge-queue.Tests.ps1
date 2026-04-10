BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
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
        Mock Invoke-GitWithRetry {
            param($Arguments)
            if ($Arguments[0] -eq 'merge' -and $Arguments[1] -eq '--abort') {
                $script:abortCalled = $true
            }
            if ($Arguments[0] -eq 'merge' -and $Arguments.Count -ge 2 -and $Arguments[1] -ne '--abort') {
                throw 'CONFLICT'
            }
        }
        Mock Invoke-Claude { '{}' }

        Add-MergeQueue -TaskId 'T1'
        Start-NextMerge

        $counters = @{ mergeRetries = $Config.MaxMergeRetries }
        Invoke-Merge -TaskId 'T1' -WorktreePath '/tmp/wt' -BranchName 'feature/T1' -Root $script:root -Counters $counters
        $script:abortCalled | Should -BeTrue
    }

    It 'escalates at MaxMergeRetries boundary' {
        Mock Invoke-GitWithRetry { throw 'CONFLICT' }
        Mock Invoke-Claude { '{}' }

        Add-MergeQueue -TaskId 'T1'
        Start-NextMerge

        $counters = @{ mergeRetries = $Config.MaxMergeRetries }
        $result = Invoke-Merge -TaskId 'T1' -WorktreePath '/tmp/wt' -BranchName 'feature/T1' -Root $script:root -Counters $counters
        $result.Success | Should -BeFalse
        $result.Conflict | Should -BeTrue
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
}

Describe 'Reset-MergeCounters' {
    It 'resets mergeRetries and restores completed status' {
        $state = @{ mergeRetries = 3; taskStatus = 'escalated'; taskId = 'T1' }
        $result = Reset-MergeCounters -State $state
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
