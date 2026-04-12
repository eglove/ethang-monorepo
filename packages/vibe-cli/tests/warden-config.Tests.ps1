BeforeAll {
    . "$PSScriptRoot/../utils/warden-config.ps1"
}

Describe 'Set-WardenScope' {
    BeforeEach {
        $script:worktree = Join-Path ([System.IO.Path]::GetTempPath()) "warden-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:worktree -Force | Out-Null
    }
    AfterEach {
        Remove-Item $script:worktree -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'creates warden.yaml in worktree .claude directory' {
        Mock git { return 'C:/repo' }
        $result = Set-WardenScope -WorktreePath $script:worktree -TaskId 'T1'
        $result.WardenFile | Should -Exist
        $result.State | Should -BeExactly 'active'
    }

    It 'warden config references worktree path for write access' {
        Mock git { return 'C:/repo' }
        Set-WardenScope -WorktreePath $script:worktree -TaskId 'T1'
        $content = Get-Content (Join-Path $script:worktree '.claude/warden.yaml') -Raw
        $content | Should -Match ([regex]::Escape(($script:worktree -replace '\\','/')))
    }

    It 'warden config includes read-only repo access' {
        Mock git { return 'C:/repo' }
        Set-WardenScope -WorktreePath $script:worktree -TaskId 'T1' -RepoRoot 'C:/repo'
        $content = Get-Content (Join-Path $script:worktree '.claude/warden.yaml') -Raw
        $content | Should -Match 'read_only:\s*true'
    }

    It 'each task has independent warden scope' {
        Mock git { return 'C:/repo' }
        $wt2 = Join-Path ([System.IO.Path]::GetTempPath()) "warden-test2-$(Get-Random)"
        New-Item -ItemType Directory -Path $wt2 -Force | Out-Null
        try {
            $r1 = Set-WardenScope -WorktreePath $script:worktree -TaskId 'T1'
            $r2 = Set-WardenScope -WorktreePath $wt2 -TaskId 'T2'
            $r1.TaskId | Should -BeExactly 'T1'
            $r2.TaskId | Should -BeExactly 'T2'
            $r1.WardenFile | Should -Not -Be $r2.WardenFile
        }
        finally { Remove-Item $wt2 -Recurse -Force -ErrorAction SilentlyContinue }
    }
}

Describe 'Remove-WardenScope' {
    BeforeEach {
        $script:worktree = Join-Path ([System.IO.Path]::GetTempPath()) "warden-rm-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:worktree -Force | Out-Null
        Mock git { return 'C:/repo' }
        Set-WardenScope -WorktreePath $script:worktree -TaskId 'T1'
    }
    AfterEach {
        Remove-Item $script:worktree -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'removes .claude directory from worktree' {
        Remove-WardenScope -WorktreePath $script:worktree -TaskId 'T1'
        Join-Path $script:worktree '.claude' | Should -Not -Exist
    }

    It 'returns unconfigured state' {
        $result = Remove-WardenScope -WorktreePath $script:worktree -TaskId 'T1'
        $result.State | Should -BeExactly 'unconfigured'
    }

    It 'is idempotent — no error on missing .claude dir' {
        Remove-WardenScope -WorktreePath $script:worktree
        { Remove-WardenScope -WorktreePath $script:worktree } | Should -Not -Throw
    }
}

Describe 'Test-WardenActive' {
    It 'returns true when warden.yaml exists' {
        $wt = Join-Path ([System.IO.Path]::GetTempPath()) "warden-active-$(Get-Random)"
        New-Item -ItemType Directory -Path "$wt/.claude" -Force | Out-Null
        Set-Content "$wt/.claude/warden.yaml" -Value 'rules: []'
        try {
            Test-WardenActive -WorktreePath $wt | Should -BeTrue
        }
        finally { Remove-Item $wt -Recurse -Force -ErrorAction SilentlyContinue }
    }

    It 'returns false when warden.yaml does not exist' {
        $wt = Join-Path ([System.IO.Path]::GetTempPath()) "warden-none-$(Get-Random)"
        New-Item -ItemType Directory -Path $wt -Force | Out-Null
        try {
            Test-WardenActive -WorktreePath $wt | Should -BeFalse
        }
        finally { Remove-Item $wt -Recurse -Force -ErrorAction SilentlyContinue }
    }
}
