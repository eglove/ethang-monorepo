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

    It 'catches ABORT marker write error and records it' {
        # Create a closed/disposed StreamWriter so writing throws
        $logPath = Join-Path $script:lockDir 'bad.log'
        $writer = [System.IO.StreamWriter]::new($logPath)
        $writer.Close()

        $tasks = @()
        $result = Invoke-AbortCleanup -Tasks $tasks -LockDir $script:lockDir -LogWriter $writer -RunId 'err-run'

        $result.abortMarkerWritten | Should -BeFalse
        $result.errors | Should -Not -BeNullOrEmpty
        $result.errors[0] | Should -Match 'ABORT marker'
    }

    It 'catches agent terminate error and records taskId in error' {
        Mock Stop-Process { throw "Access denied" }
        $tasks = @(@{ taskId = 'T-term'; agentPid = 99999; worktreeState = 'none'; mergeState = 'none' })

        $result = Invoke-AbortCleanup -Tasks $tasks -LockDir $script:lockDir

        $result.agentsTerminated | Should -Be 0
        $result.errors | Should -Not -BeNullOrEmpty
        $result.errors[0] | Should -Match 'Agent terminate T-term'
    }

    It 'aborts in-progress merge when .git exists' {
        Mock Test-Path { $true }
        Mock Push-Location {}
        Mock Pop-Location {}
        Mock git {}

        $tasks = @(@{
            taskId       = 'T-merge'
            worktreeState = 'none'
            mergeState   = 'merging'
            worktreePath = 'C:\fakeworktree'
        })

        $result = Invoke-AbortCleanup -Tasks $tasks -LockDir $script:lockDir
        $result.mergesAborted | Should -Be 1
        Should -Invoke git -Times 1
    }

    It 'catches merge abort error and records taskId in error' {
        Mock Test-Path { throw "disk error" }
        $tasks = @(@{
            taskId       = 'T-merr'
            worktreeState = 'none'
            mergeState   = 'merging'
            worktreePath = 'C:\fakeworktree'
        })

        $result = Invoke-AbortCleanup -Tasks $tasks -LockDir $script:lockDir
        $result.errors | Should -Not -BeNullOrEmpty
        $result.errors[0] | Should -Match 'Merge abort T-merr'
    }

    It 'catches lock release error and records it' {
        # Lock the file by keeping a FileStream open so Remove-Item throws
        $fakeLockDir = Join-Path ([System.IO.Path]::GetTempPath()) "abort-lock-err-$(Get-Random)"
        New-Item -ItemType Directory -Path $fakeLockDir -Force | Out-Null
        $lockFile = Join-Path $fakeLockDir 'pipeline.lock'
        Set-Content $lockFile -Value '{"pid":1}'

        # Hold an exclusive lock on the file to force Remove-Item to throw
        $stream = [System.IO.File]::Open($lockFile, [System.IO.FileMode]::Open, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
        try {
            $tasks = @()
            $result = Invoke-AbortCleanup -Tasks $tasks -LockDir $fakeLockDir
            $result.lockReleased | Should -BeFalse
            $result.errors | Should -Not -BeNullOrEmpty
            $result.errors[0] | Should -Match 'Lock release'
        }
        finally {
            $stream.Close()
            $stream.Dispose()
            Remove-Item $fakeLockDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}
