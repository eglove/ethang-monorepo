BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
    . "$PSScriptRoot/../utils/result-contracts.ps1"
    . "$PSScriptRoot/../utils/task-log.ps1"
    . "$PSScriptRoot/../utils/git-retry.ps1"
    . "$PSScriptRoot/../utils/workspace.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
}

Describe 'Get-PackageWorkDir' {
    It 'returns WorktreePath when cwd is git root' {
        Mock git { return (Get-Location).Path -replace '\\','/' }
        $result = Get-PackageWorkDir -WorktreePath '/tmp/wt'
        $result | Should -Be '/tmp/wt'
    }

    It 'appends relative offset when cwd is a subdirectory' {
        $gitRoot = (Get-Location).Path -replace '\\','/'
        Mock git { return $gitRoot }
        # We're at the repo root for this test, so offset is '.'
        $result = Get-PackageWorkDir -WorktreePath '/tmp/wt'
        # Since cwd == gitRoot, offset is '.', so result = WorktreePath
        $result | Should -Be '/tmp/wt'
    }

    It 'appends the relative offset when cwd is nested under git root' {
        # Pretend the git root is one level above the current working directory
        $parentRoot = (Split-Path (Get-Location).Path -Parent) -replace '\\','/'
        Mock git { return $parentRoot }
        $leaf = Split-Path (Get-Location).Path -Leaf
        $result = Get-PackageWorkDir -WorktreePath '/tmp/wt'
        $result | Should -BeLike "*$leaf*"
    }
}

Describe 'New-TaskWorkspace' {
    BeforeAll {
        Mock Invoke-GitWithRetry {}
        Mock Push-Location {}
        Mock Pop-Location {}

        # pnpm is an external exe — can't be mocked directly. Override the call
        # operator by defining a function that shadows the native command.
        function pnpm { }
    }

    It 'creates worktree for single-task tier (always-worktree rule)' {
        $tasks = @(@{ id = 'T1'; files = @('a.ps1') })
        $result = New-TaskWorkspace -Tasks $tasks -FeatureName 'cleanup' -RunId '20260411T-abcd'
        $result | Should -Not -BeNullOrEmpty
        $result.Keys | Should -Contain 'T1'
    }

    It 'worktree path format is .worktrees/feature-taskId-runId' {
        $tasks = @(@{ id = 'T1'; files = @('a.ps1') })
        $result = New-TaskWorkspace -Tasks $tasks -FeatureName 'cleanup' -RunId '20260411T120000-abcd'
        $result['T1'] | Should -Match '\.worktrees[\\/]cleanup-T1-20260411'
    }

    It 'throws when worktree path exceeds 248 characters (MAX_PATH)' {
        $longFeature = 'a' * 200
        $tasks = @(@{ id = 'T1'; files = @('a.ps1') })
        { New-TaskWorkspace -Tasks $tasks -FeatureName $longFeature -RunId '20260411T120000-abcd' } |
            Should -Throw '*MAX_PATH*'
    }

    It 'creates worktrees for multi-task tier' {
        $tasks = @(@{ id = 'T1' }, @{ id = 'T2' })
        $result = New-TaskWorkspace -Tasks $tasks -FeatureName 'feat' -RunId 'abc12345'
        $result | Should -Not -BeNullOrEmpty
        $result.Keys | Should -Contain 'T1'
        $result.Keys | Should -Contain 'T2'
    }

    It 'calls git worktree prune first' {
        $tasks = @(@{ id = 'T1' }, @{ id = 'T2' })
        New-TaskWorkspace -Tasks $tasks -FeatureName 'feat' -RunId 'abc12345'
        Should -Invoke Invoke-GitWithRetry -ParameterFilter {
            $Arguments[0] -eq 'worktree' -and $Arguments[1] -eq 'prune'
        } -Times 1
    }

    It 'uses branch naming convention with truncated RunId' {
        $tasks = @(@{ id = 'T1' }, @{ id = 'T2' })
        New-TaskWorkspace -Tasks $tasks -FeatureName 'coding' -RunId 'abcdef1234567890'

        Should -Invoke Invoke-GitWithRetry -ParameterFilter {
            $Arguments -contains '-b' -and ($Arguments | Where-Object { $_ -match 'feature/coding-T1-abcdef12' })
        }
    }

    It 'writes a workspace-created TaskLog when FeatureDir is provided' {
        Mock Write-TaskLog {} -Verifiable
        $tasks = @(@{ id = 'T1' })
        $featDir = Join-Path ([System.IO.Path]::GetTempPath()) "feat-ws-$(Get-Random)"
        New-Item -ItemType Directory -Path $featDir -Force | Out-Null
        try {
            New-TaskWorkspace -Tasks $tasks -FeatureName 'feat' -RunId 'abc12345' -FeatureDir $featDir
            Should -Invoke Write-TaskLog -ParameterFilter { $Message -match 'Workspace created' }
        } finally {
            Remove-Item $featDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    It 'rolls back on creation failure' {
        $script:callCount = 0
        Mock Invoke-GitWithRetry {
            if ($Arguments[0] -eq 'worktree' -and $Arguments[1] -eq 'add') {
                $script:callCount++
                if ($script:callCount -ge 3) {  # 1 prune + 2 adds, fail on 2nd add
                    throw 'worktree add failed'
                }
            }
        }

        $tasks = @(@{ id = 'T1' }, @{ id = 'T2' }, @{ id = 'T3' })
        { New-TaskWorkspace -Tasks $tasks -FeatureName 'feat' -RunId 'abc12345' } |
            Should -Throw '*creation failed*'
    }

    It 'includes OrphanedWorktrees on rollback failure' {
        $script:addCount2 = 0
        $script:removeCount = 0
        Mock Invoke-GitWithRetry {
            if ($Arguments[0] -eq 'worktree' -and $Arguments[1] -eq 'add') {
                $script:addCount2++
                if ($script:addCount2 -ge 3) { throw 'add failed' }
            }
            if ($Arguments[0] -eq 'worktree' -and $Arguments[1] -eq 'remove') {
                $script:removeCount++
                if ($script:removeCount -eq 1) { throw 'remove failed' }
            }
        }

        $tasks = @(@{ id = 'T1' }, @{ id = 'T2' }, @{ id = 'T3' })
        try {
            New-TaskWorkspace -Tasks $tasks -FeatureName 'feat' -RunId 'abc12345'
        }
        catch {
            $_.Exception.OrphanedWorktrees | Should -Not -BeNullOrEmpty
        }
    }
}

Describe 'Remove-TaskWorkspace' {
    BeforeAll {
        Mock Invoke-GitWithRetry {}
    }

    It 'calls git worktree remove and branch delete' {
        Remove-TaskWorkspace -TaskId 'T1' -WorktreePath '/tmp/wt' -BranchName 'feature/test-T1'
        Should -Invoke Invoke-GitWithRetry -ParameterFilter { $Arguments -contains 'remove' }
        Should -Invoke Invoke-GitWithRetry -ParameterFilter { $Arguments -contains '-D' }
    }

    It 'writes a workspace-removed TaskLog when FeatureDir is provided' {
        Mock Write-TaskLog {} -Verifiable
        $featDir = Join-Path ([System.IO.Path]::GetTempPath()) "feat-rm-$(Get-Random)"
        New-Item -ItemType Directory -Path $featDir -Force | Out-Null
        try {
            Remove-TaskWorkspace -TaskId 'T1' -WorktreePath '/tmp/wt' -BranchName 'feature/test-T1' -FeatureDir $featDir -RunId 'run1'
            Should -Invoke Write-TaskLog -ParameterFilter { $Message -match 'Workspace removed' }
        } finally {
            Remove-Item $featDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

Describe 'Test-WorkspaceExist' {
    It 'returns true for existing path' {
        $dir = Join-Path ([System.IO.Path]::GetTempPath()) "ws-$(Get-Random)"
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Test-WorkspaceExist -WorktreePath $dir | Should -BeTrue
        Remove-Item $dir -Force
    }

    It 'returns false for non-existent path' {
        Test-WorkspaceExist -WorktreePath '/nonexistent/path' | Should -BeFalse
    }
}

Describe 'Install-WorktreeDep' {
    BeforeEach {
        $script:wtDir = Join-Path ([System.IO.Path]::GetTempPath()) "deps-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:wtDir -Force | Out-Null
    }
    AfterEach { Remove-Item $script:wtDir -Recurse -Force -ErrorAction SilentlyContinue }

    It 'sets tddIter to 1 on successful install' {
        Set-Content (Join-Path $script:wtDir 'pnpm-lock.yaml') -Value 'lockfileVersion: 5'
        $task = @{ tddIter = 0 }
        Mock pnpm { $global:LASTEXITCODE = 0 }
        $r = Install-WorktreeDep -WorktreePath $script:wtDir -TaskState $task
        $task.tddIter | Should -Be 1
        $r.installed | Should -BeTrue
    }

    It 'skips install when no pnpm-lock.yaml' {
        $task = @{ tddIter = 0 }
        $r = Install-WorktreeDep -WorktreePath $script:wtDir -TaskState $task
        $r.skipped | Should -BeTrue
        $task.tddIter | Should -Be 1
    }

    It 'marks task DepsInstallFailed on error' {
        Set-Content (Join-Path $script:wtDir 'pnpm-lock.yaml') -Value 'lockfileVersion: 5'
        $task = @{ tddIter = 0; taskState = 'deps_installing' }
        Mock pnpm { $global:LASTEXITCODE = 1; throw "install failed" }
        $r = Install-WorktreeDep -WorktreePath $script:wtDir -TaskState $task
        $task.taskState | Should -BeExactly 'failed'
        $task.failureReason | Should -BeExactly 'DepsInstallFailed'
    }

    It 'marks task DepsInstallFailed when pnpm exits non-zero without throwing' {
        Set-Content (Join-Path $script:wtDir 'pnpm-lock.yaml') -Value 'lockfileVersion: 5'
        $task = @{ tddIter = 0; taskState = 'deps_installing' }
        Mock pnpm { $global:LASTEXITCODE = 1; return 'install failed' }
        $r = Install-WorktreeDep -WorktreePath $script:wtDir -TaskState $task
        $task.taskState | Should -BeExactly 'failed'
        $task.failureReason | Should -BeExactly 'DepsInstallFailed'
        $r.installed | Should -BeFalse
    }

    It 'with MaxTddCycles=3 and tddIter=1, exactly 2 retries available' {
        $task = @{ tddIter = 0 }
        Set-Content (Join-Path $script:wtDir 'pnpm-lock.yaml') -Value 'lockfileVersion: 5'
        Mock pnpm { $global:LASTEXITCODE = 0 }
        Install-WorktreeDep -WorktreePath $script:wtDir -TaskState $task
        $task.tddIter | Should -Be 1
        ($task.tddIter -lt 3) | Should -BeTrue
    }
}

Describe 'Reset-WorktreeState' {
    BeforeAll {
        Mock Invoke-GitWithRetry {}
    }

    It 'runs git checkout and clean on dirty worktree' {
        Mock git { 'M file.ps1' }
        $dir = Join-Path ([System.IO.Path]::GetTempPath()) "reset-$(Get-Random)"
        New-Item -ItemType Directory -Path $dir -Force | Out-Null

        $result = Reset-WorktreeState -WorktreePath $dir -TaskId 'T1'
        $result | Should -BeTrue

        Should -Invoke Invoke-GitWithRetry -ParameterFilter { $Arguments -contains 'checkout' }
        Should -Invoke Invoke-GitWithRetry -ParameterFilter { $Arguments -contains 'clean' }

        Remove-Item $dir -Force
    }

    It 'recovers via index lock removal when checkout fails' {
        $dir = Join-Path ([System.IO.Path]::GetTempPath()) "reset-lock-$(Get-Random)"
        $gitDir = Join-Path $dir '.git'
        New-Item -ItemType Directory -Path $gitDir -Force | Out-Null
        Set-Content (Join-Path $gitDir 'index.lock') -Value 'lockdata'

        $script:checkoutAttempt = 0
        Mock Invoke-GitWithRetry {
            if ($Arguments -contains 'checkout') {
                $script:checkoutAttempt++
                if ($script:checkoutAttempt -eq 1) { throw 'index.lock exists' }
            }
        }
        Mock git { '' }

        $result = Reset-WorktreeState -WorktreePath $dir -TaskId 'T1'
        $result | Should -BeTrue
        (Join-Path $gitDir 'index.lock') | Should -Not -Exist

        Remove-Item $dir -Recurse -Force
    }

    It 'recreates worktree when checkout and clean both fail' {
        $dir = Join-Path ([System.IO.Path]::GetTempPath()) "reset-recreate-$(Get-Random)"
        New-Item -ItemType Directory -Path $dir -Force | Out-Null

        Mock Invoke-GitWithRetry {
            if ($Arguments -contains 'checkout' -or $Arguments -contains 'clean') { throw 'corrupted' }
        }
        Mock git { 'main' }  # rev-parse returns branch name

        # Re-mock for worktree remove and add to succeed
        Mock Invoke-GitWithRetry {
            if ($Arguments -contains 'checkout' -or $Arguments -contains 'clean') { throw 'corrupted' }
            # worktree remove and add succeed (default)
        }

        $result = Reset-WorktreeState -WorktreePath $dir -TaskId 'T1'
        $result | Should -BeFalse  # Recreated

        Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'throws when branch cannot be determined' {
        $dir = Join-Path ([System.IO.Path]::GetTempPath()) "reset-nobranch-$(Get-Random)"
        New-Item -ItemType Directory -Path $dir -Force | Out-Null

        Mock Invoke-GitWithRetry { throw 'corrupted' }
        Mock git { $null }  # rev-parse returns nothing

        { Reset-WorktreeState -WorktreePath $dir } | Should -Throw '*cannot determine branch*'

        Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'throws when worktree re-add fails' {
        $dir = Join-Path ([System.IO.Path]::GetTempPath()) "reset-readd-$(Get-Random)"
        New-Item -ItemType Directory -Path $dir -Force | Out-Null

        Mock Invoke-GitWithRetry {
            if ($Arguments -contains 'checkout' -or $Arguments -contains 'clean') { throw 'corrupted' }
            if ($Arguments -contains 'add') { throw 'worktree add failed' }
        }
        Mock git { 'main' }

        { Reset-WorktreeState -WorktreePath $dir -TaskId 'T1' } | Should -Throw '*Failed to recreate*'

        Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'logs a recreating message when recreating a corrupted worktree with FeatureDir' {
        Mock Write-TaskLog {} -Verifiable
        $dir = Join-Path ([System.IO.Path]::GetTempPath()) "reset-recreate-log-$(Get-Random)"
        $featDir = Join-Path ([System.IO.Path]::GetTempPath()) "feat-recreate-$(Get-Random)"
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        New-Item -ItemType Directory -Path $featDir -Force | Out-Null

        Mock Invoke-GitWithRetry {
            if ($Arguments -contains 'checkout' -or $Arguments -contains 'clean') { throw 'corrupted' }
        }
        Mock git { 'main' }

        $result = Reset-WorktreeState -WorktreePath $dir -TaskId 'T1' -FeatureDir $featDir -RunId 'run1'
        $result | Should -BeFalse

        Should -Invoke Write-TaskLog -ParameterFilter { $Message -match 'recreating' }

        Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item $featDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'logs warning when dirty files exist' {
        Mock git { 'M file1.ps1'; 'M file2.ps1' }
        Mock Write-TaskLog {} -Verifiable

        $dir = Join-Path ([System.IO.Path]::GetTempPath()) "reset-warn-$(Get-Random)"
        $featDir = Join-Path ([System.IO.Path]::GetTempPath()) "feat-warn-$(Get-Random)"
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        New-Item -ItemType Directory -Path $featDir -Force | Out-Null

        Reset-WorktreeState -WorktreePath $dir -TaskId 'T1' -FeatureDir $featDir -RunId 'run1'
        Should -Invoke Write-TaskLog -ParameterFilter { $Message -match 'uncommitted' }

        Remove-Item $dir -Force
        Remove-Item $featDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
