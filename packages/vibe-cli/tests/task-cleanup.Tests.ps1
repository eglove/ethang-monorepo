BeforeAll { . "$PSScriptRoot/../utils/task-cleanup.ps1" }

Describe 'Complete-TaskFailure' {
    It 'removes worktree and sets state to removed' {
        $task = @{ worktreeState = 'active'; wardenState = 'unconfigured'; mergeState = 'none' }
        $wt = Join-Path ([System.IO.Path]::GetTempPath()) "cleanup-$(Get-Random)"
        New-Item -ItemType Directory -Path $wt -Force | Out-Null
        Mock git {}
        Complete-TaskFailure -TaskState $task -WorktreePath $wt -TaskId 'T1'
        $task.worktreeState | Should -BeExactly 'removed'
    }

    It 'tears down warden and sets state to unconfigured' {
        $task = @{ worktreeState = 'none'; wardenState = 'active'; mergeState = 'none' }
        function Remove-WardenScope { param($WorktreePath, $TaskId) }
        Complete-TaskFailure -TaskState $task -WorktreePath 'C:\fake' -TaskId 'T1'
        $task.wardenState | Should -BeExactly 'unconfigured'
    }

    It 'resets mergeState from waiting to failed' {
        $task = @{ worktreeState = 'none'; wardenState = 'unconfigured'; mergeState = 'waiting' }
        Complete-TaskFailure -TaskState $task -TaskId 'T1'
        $task.mergeState | Should -BeExactly 'failed'
    }

    It 'resets mergeState from merging to failed' {
        $task = @{ worktreeState = 'none'; wardenState = 'unconfigured'; mergeState = 'merging' }
        Complete-TaskFailure -TaskState $task -TaskId 'T1'
        $task.mergeState | Should -BeExactly 'failed'
    }

    It 'is no-op for worktreeState=none' {
        $task = @{ worktreeState = 'none'; wardenState = 'unconfigured'; mergeState = 'none' }
        { Complete-TaskFailure -TaskState $task -TaskId 'T1' } | Should -Not -Throw
        $task.worktreeState | Should -BeExactly 'none'
    }

    It 'handles worktree removal failure gracefully' {
        $task = @{ worktreeState = 'active'; wardenState = 'unconfigured'; mergeState = 'none' }
        Mock git { throw "removal failed" }
        Mock Write-Warning {}
        { Complete-TaskFailure -TaskState $task -WorktreePath 'C:\fake' -TaskId 'T1' } | Should -Not -Throw
    }

    It 'cleans up warden for WardenConfigFailed' {
        $task = @{ worktreeState = 'active'; wardenState = 'configuring'; mergeState = 'none' }
        Mock git {}
        Complete-TaskFailure -TaskState $task -WorktreePath 'C:\fake' -TaskId 'T1'
        $task.wardenState | Should -BeExactly 'unconfigured'
    }

    It 'warns on worktree removal failure and does not change worktreeState' {
        $task = @{ worktreeState = 'active'; wardenState = 'unconfigured'; mergeState = 'none' }
        Mock Test-Path { $true }
        Mock git { throw "worktree removal error" }
        Mock Write-Warning {}

        Complete-TaskFailure -TaskState $task -WorktreePath 'C:\fake' -TaskId 'T-wt'

        # worktreeState stays 'active' because the catch block doesn't change it
        $task.worktreeState | Should -BeExactly 'active'
        Should -Invoke Write-Warning -Times 1 -ParameterFilter { $Message -match 'T-wt' }
    }

    It 'warns on warden removal failure and does not change wardenState' {
        $task = @{ worktreeState = 'none'; wardenState = 'active'; mergeState = 'none' }
        function Remove-WardenScope { param($WorktreePath, $TaskId) throw "warden error" }
        Mock Write-Warning {}

        Complete-TaskFailure -TaskState $task -WorktreePath 'C:\fake' -TaskId 'T-wd'

        # wardenState stays 'active' because the catch block doesn't change it
        $task.wardenState | Should -BeExactly 'active'
        Should -Invoke Write-Warning -Times 1 -ParameterFilter { $Message -match 'T-wd' }
    }
}
