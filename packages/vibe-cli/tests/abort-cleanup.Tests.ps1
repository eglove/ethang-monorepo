BeforeAll {
    . "$PSScriptRoot/../utils/abort-cleanup.ps1"
}

Describe 'Invoke-AbortCleanup' {
    BeforeEach {
        $script:lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "abort-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
        Set-Content (Join-Path $script:lockDir 'pipeline.lock') -Value '{"pid":1}'
    }
    AfterEach {
        Remove-Item $script:lockDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'writes ABORT marker before lock release' {
        $logPath = Join-Path $script:lockDir 'test.log'
        $writer = [System.IO.StreamWriter]::new($logPath)
        $tasks = @(@{ taskId = 'T1'; worktreeState = 'none'; mergeState = 'none' })

        $result = Invoke-AbortCleanup -Tasks $tasks -LockDir $script:lockDir -LogWriter $writer -RunId 'test123'
        $writer.Close()

        $result.abortMarkerWritten | Should -BeTrue
        $result.lockReleased | Should -BeTrue
        $content = Get-Content $logPath -Raw
        $content | Should -Match 'ABORT'
    }

    It 'terminates agent processes' {
        $tasks = @(@{ taskId = 'T1'; agentPid = 99999999; worktreeState = 'none'; mergeState = 'none' })
        Mock Stop-Process {}

        $result = Invoke-AbortCleanup -Tasks $tasks -LockDir $script:lockDir
        $result.agentsTerminated | Should -Be 1
    }

    It 'resets mergeState from waiting to failed' {
        $tasks = @(@{ taskId = 'T1'; worktreeState = 'none'; mergeState = 'waiting' })
        Invoke-AbortCleanup -Tasks $tasks -LockDir $script:lockDir
        $tasks[0].mergeState | Should -BeExactly 'failed'
    }

    It 'resets mergeState from merging to failed' {
        $tasks = @(@{ taskId = 'T1'; worktreeState = 'none'; mergeState = 'merging' })
        Invoke-AbortCleanup -Tasks $tasks -LockDir $script:lockDir
        $tasks[0].mergeState | Should -BeExactly 'failed'
    }

    It 'removes active worktrees sequentially' {
        Mock git {}
        $tasks = @(
            @{ taskId = 'T1'; worktreeState = 'active'; worktreePath = 'C:\fake1'; mergeState = 'none' }
            @{ taskId = 'T2'; worktreeState = 'active'; worktreePath = 'C:\fake2'; mergeState = 'none' }
        )
        Mock Test-Path { $true }

        $result = Invoke-AbortCleanup -Tasks $tasks -LockDir $script:lockDir
        $result.worktreesRemoved | Should -Be 2
        $tasks[0].worktreeState | Should -BeExactly 'removed'
    }

    It 'releases pipeline lock' {
        $tasks = @()
        $result = Invoke-AbortCleanup -Tasks $tasks -LockDir $script:lockDir
        $result.lockReleased | Should -BeTrue
        Join-Path $script:lockDir 'pipeline.lock' | Should -Not -Exist
    }

    It 'is best-effort — one failure does not stop others' {
        Mock git { throw "git error" }
        Mock Test-Path { $true }
        $tasks = @(
            @{ taskId = 'T1'; worktreeState = 'active'; worktreePath = 'C:\fake1'; mergeState = 'none' }
        )
        Mock Write-Warning {}

        $result = Invoke-AbortCleanup -Tasks $tasks -LockDir $script:lockDir
        $result.lockReleased | Should -BeTrue  # Still releases lock despite worktree error
        $result.errors.Count | Should -BeGreaterThan 0
    }

    It 'post-cleanup invariant: no task has mergeState waiting/merging when cleanup done' {
        $tasks = @(
            @{ taskId = 'T1'; worktreeState = 'none'; mergeState = 'waiting' }
            @{ taskId = 'T2'; worktreeState = 'none'; mergeState = 'merging' }
            @{ taskId = 'T3'; worktreeState = 'none'; mergeState = 'merged' }
        )
        Invoke-AbortCleanup -Tasks $tasks -LockDir $script:lockDir
        $tasks | Where-Object { $_.mergeState -in @('waiting', 'merging') } | Should -BeNullOrEmpty
    }

    It 'handles zero active worktrees gracefully' {
        $tasks = @(@{ taskId = 'T1'; worktreeState = 'none'; mergeState = 'none' })
        $result = Invoke-AbortCleanup -Tasks $tasks -LockDir $script:lockDir
        $result.worktreesRemoved | Should -Be 0
    }
}
