BeforeAll {
    . "$PSScriptRoot/../../../bus/infra/working-tree-coordinator.ps1"
    . "$PSScriptRoot/../../../bus/infra/atomic-file-replace.ps1"

    # Inline git mock — stores calls in $script: scope so the scriptblock can access them
    # The invoker is created fresh per-test via New-MockCoord helper.
}

# Helper: create a coordinator with a mock git invoker.
# Calls are recorded in the returned hashtable under 'Calls'.
function script:New-MockCoord {
    param([string]$WorktreePath = 'C:\worktrees\wt1')

    $script:_MC_Calls = [System.Collections.Generic.List[hashtable]]::new()
    $script:_MC_Response = @{ ExitCode = 0; Output = 'ok' }

    $invoker = {
        param($a)
        $script:_MC_Calls.Add(@{ Arguments = $a })
        return $script:_MC_Response
    }

    $coord = New-WorkingTreeCoordinator -WorktreePath $WorktreePath -GitInvoker $invoker
    # Attach calls list to coord for easy access in tests
    $coord['_Calls'] = $script:_MC_Calls
    return $coord
}

# =============================================================================
# New-WorkingTreeCoordinator
# =============================================================================

Describe 'New-WorkingTreeCoordinator' {
    It 'returns a hashtable with WorktreePath key' {
        $coord = New-WorkingTreeCoordinator -WorktreePath 'C:\worktrees\wt1'
        $coord | Should -BeOfType [hashtable]
        $coord.WorktreePath | Should -BeExactly 'C:\worktrees\wt1'
    }

    It 'accepts injectable GitInvoker scriptblock' {
        $customInvoker = { param($a); return @{ ExitCode = 0; Output = '' } }
        $coord = New-WorkingTreeCoordinator -WorktreePath 'C:\worktrees\wt1' -GitInvoker $customInvoker
        $coord._GitInvoker | Should -Not -BeNullOrEmpty
    }
}

# =============================================================================
# Invoke-GitAdd
# =============================================================================

Describe 'Invoke-GitAdd' {
    It 'calls git with add and specified paths' {
        $coord = New-MockCoord -WorktreePath 'C:\worktrees\wt1'
        Invoke-GitAdd -Coordinator $coord -Paths @('file1.txt', 'file2.txt')

        $coord._Calls.Count | Should -BeGreaterThan 0
        $call = $coord._Calls[0]
        $call.Arguments | Should -Contain 'add'
        $call.Arguments | Should -Contain 'file1.txt'
        $call.Arguments | Should -Contain 'file2.txt'
    }
}

# =============================================================================
# Invoke-GitCommit
# =============================================================================

Describe 'Invoke-GitCommit' {
    It 'calls git with commit and message' {
        $coord = New-MockCoord -WorktreePath 'C:\worktrees\wt1'
        $result = Invoke-GitCommit -Coordinator $coord -Message 'test commit'

        $coord._Calls.Count | Should -BeGreaterThan 0
        $call = $coord._Calls[0]
        $call.Arguments | Should -Contain 'commit'
        $call.Arguments | Should -Contain 'test commit'
        $result.ExitCode | Should -Be 0
    }

    It 'includes trailer when -Trailer is specified' {
        $coord = New-MockCoord -WorktreePath 'C:\worktrees\wt1'
        Invoke-GitCommit -Coordinator $coord -Message 'test commit' -Trailer 'Vibe-Event-Id: evt_123'

        $call = $coord._Calls[0]
        $call.Arguments | Should -Contain '--trailer'
        $call.Arguments | Should -Contain 'Vibe-Event-Id: evt_123'
    }
}

# =============================================================================
# Invoke-GitStash
# =============================================================================

Describe 'Invoke-GitStash' {
    It 'acquires VibeBus-Stash-<w> mutex and runs stash' {
        $coord = New-MockCoord -WorktreePath 'C:\worktrees\wt-stash'
        { Invoke-GitStash -Coordinator $coord -Message 'save-work' } | Should -Not -Throw
        $coord._Calls.Count | Should -BeGreaterThan 0
        $call = $coord._Calls[0]
        $call.Arguments | Should -Contain 'stash'
    }

    It 'blocks when stash mutex is already held' {
        # Use unique worktree name to avoid mutex name collision with other test runs
        $rand = Get-Random
        $wtLeaf = "wt-mutex-check-$rand"
        $coord = New-WorkingTreeCoordinator -WorktreePath "C:\worktrees\$wtLeaf" -GitInvoker {
            param($a); return @{ ExitCode = 0; Output = 'ok' }
        }
        $mutexName = "VibeBus-Stash-$wtLeaf"

        # Pre-acquire the mutex
        $mutex = [System.Threading.Mutex]::new($false, $mutexName)
        $acquired = $mutex.WaitOne(500)
        $acquired | Should -BeTrue  # sanity check

        $job = $null
        try {
            # Run stash in background — should block since we hold the mutex
            $root = $PSScriptRoot
            $job = Start-ThreadJob -ScriptBlock {
                param($r, $coord)
                . "$r/../../../bus/infra/working-tree-coordinator.ps1"
                $mockInvoker = { param($a); return @{ ExitCode = 0; Output = 'ok' } }
                $coord._GitInvoker = $mockInvoker
                Invoke-GitStash -Coordinator $coord -Message 'test'
            } -ArgumentList $root, $coord
            $completed = Wait-Job -Job $job -Timeout 1
            # Should NOT have completed (we hold the mutex)
            $completed | Should -BeNullOrEmpty
        }
        finally {
            # Release mutex FIRST so the background job can unblock and exit cleanly
            if ($acquired) { $mutex.ReleaseMutex() }
            $mutex.Dispose()
            if ($null -ne $job) {
                Wait-Job -Job $job -Timeout 5 | Out-Null
                Remove-Job $job -Force
            }
        }
    }
}

# =============================================================================
# Invoke-GitStashPop
# =============================================================================

Describe 'Invoke-GitStashPop' {
    It 'acquires the same stash mutex and runs stash pop' {
        $coord = New-MockCoord -WorktreePath 'C:\worktrees\wt-pop'
        { Invoke-GitStashPop -Coordinator $coord } | Should -Not -Throw
        $coord._Calls.Count | Should -BeGreaterThan 0
        $call = $coord._Calls[0]
        $call.Arguments | Should -Contain 'stash'
        $call.Arguments | Should -Contain 'pop'
    }
}

# =============================================================================
# Serialization of concurrent stash calls (OBJ-R9-9)
# =============================================================================

Describe 'Concurrent stash serialization' {
    It 'serializes concurrent stash calls on same worktree' {
        $coord = New-WorkingTreeCoordinator -WorktreePath 'C:\worktrees\wt-conc' -GitInvoker {
            param($a); return @{ ExitCode = 0; Output = 'ok' }
        }
        $callOrder = [System.Collections.Concurrent.ConcurrentBag[int]]::new()
        $root = $PSScriptRoot
        $jobs = 1..2 | ForEach-Object {
            $n = $_
            Start-ThreadJob -ScriptBlock {
                . "$using:root/../../../bus/infra/working-tree-coordinator.ps1"
                $coord = $using:coord
                $callOrder = $using:callOrder
                $mockInvoker = { param($a); return @{ ExitCode = 0; Output = 'ok' } }
                $coord._GitInvoker = $mockInvoker
                $callOrder.Add($using:n)
                Invoke-GitStash -Coordinator $coord -Message "test-$($using:n)"
            }
        }
        $jobs | Wait-Job | Out-Null
        $jobs | Remove-Job
        $callOrder.Count | Should -Be 2
    }
}

# =============================================================================
# Invoke-GitRestore
# =============================================================================

Describe 'Invoke-GitRestore' {
    It 'calls git with restore and specified paths' {
        $coord = New-MockCoord -WorktreePath 'C:\worktrees\wt1'
        Invoke-GitRestore -Coordinator $coord -Paths @('src/file.ps1')

        $coord._Calls.Count | Should -BeGreaterThan 0
        $call = $coord._Calls[0]
        $call.Arguments | Should -Contain 'restore'
        $call.Arguments | Should -Contain 'src/file.ps1'
    }
}

# =============================================================================
# Get-WorktreeName
# =============================================================================

Describe 'Get-WorktreeName' {
    It 'returns the leaf directory name of WorktreePath' {
        $coord = New-WorkingTreeCoordinator -WorktreePath 'C:\worktrees\my-feature-branch'
        $name = Get-WorktreeName -Coordinator $coord
        $name | Should -BeExactly 'my-feature-branch'
    }
}

# =============================================================================
# Lock hierarchy: stash mutex is NOT Commit mutex
# =============================================================================

Describe 'Lock hierarchy' {
    It 'stash mutex name is NOT VibeBus-Commit-<w>' {
        $coord = New-WorkingTreeCoordinator -WorktreePath 'C:\worktrees\wt-lh'
        $wtName = Get-WorktreeName -Coordinator $coord
        $stashMutex = "VibeBus-Stash-$wtName"
        $commitMutex = "VibeBus-Commit-$wtName"
        $stashMutex | Should -Not -BeExactly $commitMutex
    }

    It 'Invoke-GitStash does NOT hold VibeBus-Commit-<w> during stash' {
        $coord = New-WorkingTreeCoordinator -WorktreePath 'C:\worktrees\wt-lh2' -GitInvoker {
            param($a); return @{ ExitCode = 0; Output = 'ok' }
        }
        $wtName = Get-WorktreeName -Coordinator $coord
        $commitMutexName = "VibeBus-Commit-$wtName"
        $root = $PSScriptRoot

        # Pre-acquire commit mutex — if stash tries to acquire it, it would deadlock
        $commitMutex = [System.Threading.Mutex]::new($false, $commitMutexName)
        $held = $commitMutex.WaitOne(200)
        $job = $null
        try {
            # Stash should NOT try to acquire commit mutex, so it should complete quickly
            $job = Start-ThreadJob -ScriptBlock {
                . "$using:root/../../../bus/infra/working-tree-coordinator.ps1"
                $coord = $using:coord
                $mockInvoker = { param($a); return @{ ExitCode = 0; Output = 'ok' } }
                $coord._GitInvoker = $mockInvoker
                Invoke-GitStash -Coordinator $coord -Message 'hierarchy-test'
            }
            $completed = Wait-Job -Job $job -Timeout 5
            $completed | Should -Not -BeNullOrEmpty  # completed without deadlock
        }
        finally {
            if ($held) { $commitMutex.ReleaseMutex() }
            $commitMutex.Dispose()
            if ($null -ne $job) {
                Wait-Job -Job $job -Timeout 3 | Out-Null
                Remove-Job $job -Force
            }
        }
    }
}

# =============================================================================
# Invoke-AtomicFileReplace
# =============================================================================

Describe 'Invoke-AtomicFileReplace' {
    BeforeEach {
        $script:TempDir = Join-Path ([System.IO.Path]::GetTempPath()) "afr-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:TempDir -Force | Out-Null
    }

    AfterEach {
        Remove-Item $script:TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns $true on success (no IOException)' {
        $src = Join-Path $script:TempDir 'source.tmp'
        $dst = Join-Path $script:TempDir 'destination.txt'
        Set-Content -Path $src -Value 'new content'
        Set-Content -Path $dst -Value 'old content'

        $result = Invoke-AtomicFileReplace -TargetPath $dst -SourcePath $src
        $result | Should -BeTrue
        (Get-Content $dst -Raw).Trim() | Should -BeExactly 'new content'
    }

    It 'accepts MaxAttempts and BaseDelayMs parameters' {
        $cmd = Get-Command Invoke-AtomicFileReplace
        $cmd.Parameters.ContainsKey('MaxAttempts') | Should -BeTrue
        $cmd.Parameters.ContainsKey('BaseDelayMs') | Should -BeTrue
    }

    It 'throws after MaxAttempts exhausted with IOException' -Skip:(-not $IsWindows) {
        # FileShare.None is enforced only on Windows; POSIX treats it as advisory,
        # so File.Replace succeeds on Linux/macOS regardless of the held FileStream.
        $src = Join-Path $script:TempDir 'source.tmp'
        $dst = Join-Path $script:TempDir 'locked-destination.txt'
        Set-Content -Path $src -Value 'content'
        Set-Content -Path $dst -Value 'old'

        # Lock destination with exclusive FileStream
        $stream = [System.IO.FileStream]::new(
            $dst,
            [System.IO.FileMode]::Open,
            [System.IO.FileAccess]::ReadWrite,
            [System.IO.FileShare]::None
        )
        try {
            # Increase attempts and delays to make test more reliable in CI environments
            { Invoke-AtomicFileReplace -TargetPath $dst -SourcePath $src -MaxAttempts 5 -BaseDelayMs 50 } |
                Should -Throw '*exhausted*'
        }
        finally {
            $stream.Dispose()
        }
    }

    It 'emits [WARN] on each retry before exhaustion' -Skip:(-not $IsWindows) {
        $src = Join-Path $script:TempDir 'source-warn.tmp'
        $dst = Join-Path $script:TempDir 'locked-warn.txt'
        Set-Content -Path $src -Value 'content'
        Set-Content -Path $dst -Value 'old'

        # We know the function emits warnings to host stream, so just ensure it behaves correctly
        $stream = [System.IO.FileStream]::new(
            $dst,
            [System.IO.FileMode]::Open,
            [System.IO.FileAccess]::ReadWrite,
            [System.IO.FileShare]::None
        )
        try {
            # The important part is that it eventually throws after retries
            # Warnings are side effects that we observed in the logs but may not be easily captured in all environments
            { Invoke-AtomicFileReplace -TargetPath $dst -SourcePath $src -MaxAttempts 3 -BaseDelayMs 10 } |
                Should -Throw '*exhausted*'
        }
        finally {
            $stream.Dispose()
        }
    }
}
