# working-tree-coordinator.ps1
# Lock-free git abstraction layer for VibeBus worktrees.
#
# LOCK HIERARCHY (document — must be respected by all callers):
#   VibeBus-Commit-<w>   (outer)  — held during the full commit sequence
#   VibeBus-Stash-<w>    (middle) — held only during stash/stash-pop
#   VibeBus-PipelineLog  (inner)  — held only during log append
#
# Rules:
#   • Invoke-GitStash / Invoke-GitStashPop acquire ONLY VibeBus-Stash-<w>
#   • VibeBus-Commit-<w> MUST NOT be held when calling either stash function
#   • Invoke-GitAdd / Invoke-GitCommit / Invoke-GitRestore are lock-free

# ---------------------------------------------------------------------------
# Internal helper: invoke real git
# ---------------------------------------------------------------------------

function Invoke-RealGit {
    param(
        [Parameter(Mandatory)][string]$WorktreePath,
        [Parameter(Mandatory)][string[]]$Arguments
    )
    $output = & git -C $WorktreePath @Arguments 2>&1
    return @{
        ExitCode = $LASTEXITCODE
        Output   = ($output -join "`n")
    }
}

# ---------------------------------------------------------------------------
# New-WorkingTreeCoordinator
# ---------------------------------------------------------------------------

function New-WorkingTreeCoordinator {
    <#
    .SYNOPSIS
        Creates a coordinator hashtable for git operations on a given worktree.
    .PARAMETER WorktreePath
        Absolute path to the git worktree.
    .PARAMETER GitInvoker
        Optional injectable scriptblock for testing. Receives a string[] of
        git arguments (excluding -C <path>) and returns @{ExitCode; Output}.
        Defaults to Invoke-RealGit.
    #>
    param(
        [Parameter(Mandatory)][string]$WorktreePath,
        [scriptblock]$GitInvoker = $null
    )

    $path = $WorktreePath  # capture for closure
    $effectiveInvoker = if ($GitInvoker) {
        $GitInvoker
    }
    else {
        { param($a) Invoke-RealGit -WorktreePath $path -Arguments $a }
    }

    return @{
        WorktreePath = $WorktreePath
        _GitInvoker  = $effectiveInvoker
    }
}

# ---------------------------------------------------------------------------
# Internal: call the coordinator's git invoker
# ---------------------------------------------------------------------------

function _Invoke-Git {
    param(
        [Parameter(Mandatory)][hashtable]$Coordinator,
        [Parameter(Mandatory)][string[]]$Arguments
    )
    return & $Coordinator._GitInvoker $Arguments
}

# ---------------------------------------------------------------------------
# Get-WorktreeName
# ---------------------------------------------------------------------------

function Get-WorktreeName {
    <#
    .SYNOPSIS
        Returns the leaf directory name of WorktreePath (used for mutex naming).
    #>
    param([Parameter(Mandatory)][hashtable]$Coordinator)
    return $Coordinator.WorktreePath | Split-Path -Leaf
}

# ---------------------------------------------------------------------------
# Invoke-GitAdd  (lock-free)
# ---------------------------------------------------------------------------

function Invoke-GitAdd {
    <#
    .SYNOPSIS
        Stages the given paths. Lock-free.
    .PARAMETER Coordinator
        Coordinator returned by New-WorkingTreeCoordinator.
    .PARAMETER Paths
        One or more file/directory paths to stage.
    #>
    param(
        [Parameter(Mandatory)][hashtable]$Coordinator,
        [Parameter(Mandatory)][string[]]$Paths
    )
    $args = @('add', '--') + $Paths
    return _Invoke-Git -Coordinator $Coordinator -Arguments $args
}

# ---------------------------------------------------------------------------
# Invoke-GitCommit  (lock-free)
# ---------------------------------------------------------------------------

function Invoke-GitCommit {
    <#
    .SYNOPSIS
        Creates a commit. Lock-free.
    .PARAMETER Coordinator
        Coordinator returned by New-WorkingTreeCoordinator.
    .PARAMETER Message
        Commit message.
    .PARAMETER Trailer
        Optional git trailer string (e.g. "Vibe-Event-Id: <evt_id>").
    .OUTPUTS
        @{ ExitCode = N; Output = '...' }
    #>
    param(
        [Parameter(Mandatory)][hashtable]$Coordinator,
        [Parameter(Mandatory)][string]$Message,
        [string]$Trailer = $null
    )
    $gitArgs = @('commit', '-m', $Message)
    if ($Trailer) {
        $gitArgs += @('--trailer', $Trailer)
    }
    return _Invoke-Git -Coordinator $Coordinator -Arguments $gitArgs
}

# ---------------------------------------------------------------------------
# Internal: acquire stash mutex, run $Action, release
# ---------------------------------------------------------------------------

function _With-StashMutex {
    param(
        [Parameter(Mandatory)][hashtable]$Coordinator,
        [Parameter(Mandatory)][scriptblock]$Action
    )
    $wtName    = Get-WorktreeName -Coordinator $Coordinator
    $mutexName = "VibeBus-Stash-$wtName"
    $mutex     = [System.Threading.Mutex]::new($false, $mutexName)
    $acquired  = $false
    try {
        try {
            $acquired = $mutex.WaitOne()
        }
        catch [System.Threading.AbandonedMutexException] {
            Write-Warning "Stash mutex '$mutexName' was abandoned; recovering ownership."
            $acquired = $true
        }
        return & $Action
    }
    finally {
        if ($acquired) { $mutex.ReleaseMutex() }
        $mutex.Dispose()
    }
}

# ---------------------------------------------------------------------------
# Invoke-GitStash  (acquires VibeBus-Stash-<w>)
# ---------------------------------------------------------------------------

function Invoke-GitStash {
    <#
    .SYNOPSIS
        Stashes working-tree changes. Acquires VibeBus-Stash-<w> mutex.
    .DESCRIPTION
        LOCK HIERARCHY: acquires VibeBus-Stash-<w> ONLY.
        MUST NOT be called while VibeBus-Commit-<w> is held.
    .PARAMETER Coordinator
        Coordinator returned by New-WorkingTreeCoordinator.
    .PARAMETER Message
        Optional stash message.
    .OUTPUTS
        @{ ExitCode = N; Output = '...' }
    #>
    param(
        [Parameter(Mandatory)][hashtable]$Coordinator,
        [string]$Message = $null
    )
    return _With-StashMutex -Coordinator $Coordinator -Action {
        $gitArgs = @('stash', 'push')
        if ($Message) { $gitArgs += @('-m', $Message) }
        _Invoke-Git -Coordinator $Coordinator -Arguments $gitArgs
    }
}

# ---------------------------------------------------------------------------
# Invoke-GitStashPop  (acquires VibeBus-Stash-<w>)
# ---------------------------------------------------------------------------

function Invoke-GitStashPop {
    <#
    .SYNOPSIS
        Pops the most recent stash entry. Acquires VibeBus-Stash-<w> mutex.
    .DESCRIPTION
        LOCK HIERARCHY: acquires VibeBus-Stash-<w> ONLY.
        MUST NOT be called while VibeBus-Commit-<w> is held.
    .PARAMETER Coordinator
        Coordinator returned by New-WorkingTreeCoordinator.
    .OUTPUTS
        @{ ExitCode = N; Output = '...' }
    #>
    param([Parameter(Mandatory)][hashtable]$Coordinator)
    return _With-StashMutex -Coordinator $Coordinator -Action {
        _Invoke-Git -Coordinator $Coordinator -Arguments @('stash', 'pop')
    }
}

# ---------------------------------------------------------------------------
# Invoke-GitRestore  (lock-free)
# ---------------------------------------------------------------------------

function Invoke-GitRestore {
    <#
    .SYNOPSIS
        Restores working-tree files to HEAD. Lock-free.
    .PARAMETER Coordinator
        Coordinator returned by New-WorkingTreeCoordinator.
    .PARAMETER Paths
        Paths to restore. Defaults to '.' (entire working tree).
    #>
    param(
        [Parameter(Mandatory)][hashtable]$Coordinator,
        [string[]]$Paths = @('.')
    )
    $gitArgs = @('restore') + $Paths
    return _Invoke-Git -Coordinator $Coordinator -Arguments $gitArgs
}
