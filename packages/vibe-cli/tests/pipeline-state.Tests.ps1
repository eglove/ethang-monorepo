BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-state.ps1"
}

Describe 'Resolve-PipelineState' {
    BeforeAll {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "state-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        # Create elicitor.md (always needed for stage > 1)
        Set-Content (Join-Path $script:tempDir 'elicitor.md') -Value '# Briefing'
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns FeatureDir for stage 2' {
        $state = Resolve-PipelineState -FromStage 2 -Dir $script:tempDir
        $state.FeatureDir | Should -Be $script:tempDir
        $state.Briefing | Should -Match 'Briefing'
    }

    It 'throws when bdd.feature is missing for stage 3' {
        { Resolve-PipelineState -FromStage 3 -Dir $script:tempDir } |
            Should -Throw '*missing*bdd.feature*'
    }

    It 'returns GherkinFile for stage 3 when bdd.feature exists' {
        Set-Content (Join-Path $script:tempDir 'bdd.feature') -Value 'Feature: test'
        $state = Resolve-PipelineState -FromStage 3 -Dir $script:tempDir
        $state.GherkinFile | Should -Match 'bdd\.feature'
    }

    It 'throws when TLA+ spec is missing for stage 5' {
        { Resolve-PipelineState -FromStage 5 -Dir $script:tempDir } |
            Should -Throw '*missing TLA*'
    }

    It 'returns TlaFile for stage 5 when .tla exists' {
        $tlaDir = Join-Path $script:tempDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'

        $state = Resolve-PipelineState -FromStage 5 -Dir $script:tempDir
        $state.TlaFile | Should -Not -BeNullOrEmpty
        $state.TlaDir | Should -Match 'tla$'
    }

    It 'throws when impl plan is missing for stage 7' {
        { Resolve-PipelineState -FromStage 7 -Dir $script:tempDir } |
            Should -Throw '*missing*implementation-plan*'
    }

    It 'returns ImplFile and ImplJson for stage 7 when both exist' {
        Set-Content (Join-Path $script:tempDir 'implementation-plan.md') -Value '# Plan'
        Set-Content (Join-Path $script:tempDir 'implementation-plan.json') -Value '{"tiers":[{"tier":1,"tasks":[{"id":"T1","title":"A"}]}]}'

        $state = Resolve-PipelineState -FromStage 7 -Dir $script:tempDir
        $state.ImplFile | Should -Match 'implementation-plan\.md'
        $state.ImplJson | Should -Match 'implementation-plan\.json'
    }

    It 'does not load later artifacts for earlier stages' {
        $state = Resolve-PipelineState -FromStage 2 -Dir $script:tempDir
        $state.GherkinFile | Should -BeNullOrEmpty
        $state.TlaFile | Should -BeNullOrEmpty
        $state.ImplFile | Should -BeNullOrEmpty
    }

    Context 'Stage 8 resume' {
        BeforeAll {
            # Create logs directory with task logs
            $logsDir = Join-Path $script:tempDir 'logs'
            New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
            Set-Content (Join-Path $logsDir 'T1-log.txt') -Value "[2026-04-10] [T1] done | COMPLETED`n[2026-04-10] [T1] done | MERGED"
            Set-Content (Join-Path $logsDir 'T2-log.txt') -Value "[2026-04-10] [T2] green | running"

            # Sync-FallbackLog may not be loaded in this test context, define a stub
            if (-not (Get-Command Sync-FallbackLog -ErrorAction SilentlyContinue)) {
                function global:Sync-FallbackLog { }
            }
            Mock Sync-FallbackLog {}
        }

        It 'returns Plan and TlaFile for stage 8' {
            $state = Resolve-PipelineState -FromStage 8 -Dir $script:tempDir
            $state.Plan | Should -Not -BeNullOrEmpty
            $state.TlaFile | Should -Not -BeNullOrEmpty
        }

        It 'detects completed tasks from log files' {
            $state = Resolve-PipelineState -FromStage 8 -Dir $script:tempDir
            $state.CompletedTasks | Should -Contain 'T1'
            $state.CompletedTasks | Should -Not -Contain 'T2'
        }

        It 'detects merged tasks from log files' {
            $state = Resolve-PipelineState -FromStage 8 -Dir $script:tempDir
            $state.MergedTasks | Should -Contain 'T1'
            $state.MergedTasks | Should -Not -Contain 'T2'
        }

        It 'throws when logs directory missing' {
            $emptyDir = Join-Path ([System.IO.Path]::GetTempPath()) "empty-$(Get-Random)"
            New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
            Set-Content (Join-Path $emptyDir 'elicitor.md') -Value '# Briefing'
            Set-Content (Join-Path $emptyDir 'bdd.feature') -Value 'Feature: test'
            $tlaDir2 = Join-Path $emptyDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir2 -Force | Out-Null
            Set-Content (Join-Path $tlaDir2 'Spec.tla') -Value '---- MODULE ----'
            Set-Content (Join-Path $emptyDir 'implementation-plan.md') -Value '# Plan'
            Set-Content (Join-Path $emptyDir 'implementation-plan.json') -Value '{}'

            { Resolve-PipelineState -FromStage 8 -Dir $emptyDir } | Should -Throw '*logs*'
            Remove-Item $emptyDir -Recurse -Force
        }

        It 'calls Sync-FallbackLog before parsing logs' {
            Resolve-PipelineState -FromStage 8 -Dir $script:tempDir
            Should -Invoke Sync-FallbackLog
        }
    }
}

Describe 'New-PipelineLogWriter' {
    It 'creates a StreamWriter opened with FileShare.Read' {
        $logPath = Join-Path ([System.IO.Path]::GetTempPath()) "plog-$(Get-Random).log"
        try {
            $writer = New-PipelineLogWriter -LogPath $logPath
            $writer | Should -BeOfType [System.IO.StreamWriter]
            # Verify concurrent reader can open
            $reader = [System.IO.File]::Open($logPath, 'Open', 'Read', 'ReadWrite')
            $reader.Close()
            $writer.Close()
        }
        finally { Remove-Item $logPath -ErrorAction SilentlyContinue }
    }

    It 'creates directory if missing' {
        $logPath = Join-Path ([System.IO.Path]::GetTempPath()) "plog-nested-$(Get-Random)/sub/pipeline.log"
        try {
            $writer = New-PipelineLogWriter -LogPath $logPath
            $writer.Close()
            $logPath | Should -Exist
        }
        finally { Remove-Item (Split-Path $logPath -Parent) -Recurse -Force -ErrorAction SilentlyContinue }
    }
}

Describe 'Write-PipelineLogEntry' {
    It 'writes a single line via one WriteLine call' {
        $logPath = Join-Path ([System.IO.Path]::GetTempPath()) "entry-$(Get-Random).log"
        try {
            $writer = New-PipelineLogWriter -LogPath $logPath
            Write-PipelineLogEntry -Writer $writer -Entry 'test line 1'
            Write-PipelineLogEntry -Writer $writer -Entry 'test line 2'
            $writer.Close()
            $lines = Get-Content $logPath
            $lines.Count | Should -Be 2
            $lines[0] | Should -BeExactly 'test line 1'
        }
        finally { Remove-Item $logPath -ErrorAction SilentlyContinue }
    }
}

Describe 'Write-IdempotencyToken' {
    It 'writes INVOKE token with stage name' {
        $logPath = Join-Path ([System.IO.Path]::GetTempPath()) "idem-$(Get-Random).log"
        try {
            $writer = New-PipelineLogWriter -LogPath $logPath
            Write-IdempotencyToken -Writer $writer -Stage 'stage3' -Status 'INVOKE'
            $writer.Close()
            $content = Get-Content $logPath -Raw
            $content | Should -Match 'INVOKE-CLAUDE INVOKE stage=stage3'
        }
        finally { Remove-Item $logPath -ErrorAction SilentlyContinue }
    }

    It 'writes COMPLETE token with runId' {
        $logPath = Join-Path ([System.IO.Path]::GetTempPath()) "idem-$(Get-Random).log"
        try {
            $writer = New-PipelineLogWriter -LogPath $logPath
            Write-IdempotencyToken -Writer $writer -Stage 'stage3' -Status 'COMPLETE' -RunId '20260411T120000-abcd'
            $writer.Close()
            $content = Get-Content $logPath -Raw
            $content | Should -Match 'runId=20260411T120000-abcd'
            $content | Should -Match 'INVOKE-CLAUDE COMPLETE stage=stage3'
        }
        finally { Remove-Item $logPath -ErrorAction SilentlyContinue }
    }
}

Describe 'Read-IdempotencyTokens' {
    It 'loads INVOKE and COMPLETE tokens from log' {
        $logPath = Join-Path ([System.IO.Path]::GetTempPath()) "tokens-$(Get-Random).log"
        try {
            $lines = @(
                '[2026-04-11 12:00:00] INVOKE-CLAUDE INVOKE stage=stage1'
                '[2026-04-11 12:01:00] INVOKE-CLAUDE COMPLETE stage=stage1'
                '[2026-04-11 12:02:00] INVOKE-CLAUDE INVOKE stage=stage2'
            )
            Set-Content $logPath -Value ($lines -join "`n")
            $tokens = Read-IdempotencyTokens -LogPath $logPath
            $tokens.Contains('INVOKE:stage1') | Should -BeTrue
            $tokens.Contains('COMPLETE:stage1') | Should -BeTrue
            $tokens.Contains('INVOKE:stage2') | Should -BeTrue
            $tokens.Contains('COMPLETE:stage2') | Should -BeFalse
        }
        finally { Remove-Item $logPath -ErrorAction SilentlyContinue }
    }

    It 'ignores truncated final line without opening bracket' {
        $logPath = Join-Path ([System.IO.Path]::GetTempPath()) "trunc-$(Get-Random).log"
        try {
            # Simulate truncated write: last line has no opening bracket
            Set-Content $logPath -Value "[2026-04-11 12:00:00] INVOKE-CLAUDE INVOKE stage=s1`nINVOKE-CLAUDE COMPLETE stag"
            $tokens = Read-IdempotencyTokens -LogPath $logPath
            $tokens.Contains('INVOKE:s1') | Should -BeTrue
            $tokens.Count | Should -Be 1  # truncated line ignored
        }
        finally { Remove-Item $logPath -ErrorAction SilentlyContinue }
    }

    It 'returns empty set for missing log file' {
        $tokens = Read-IdempotencyTokens -LogPath 'C:\nonexistent\log.txt'
        $tokens.Count | Should -Be 0
    }

    It 'returns empty set for log with only truncated content' {
        $logPath = Join-Path ([System.IO.Path]::GetTempPath()) "trunc2-$(Get-Random).log"
        try {
            Set-Content $logPath -Value 'partial content no bracket'
            $tokens = Read-IdempotencyTokens -LogPath $logPath
            $tokens.Count | Should -Be 0
        }
        finally { Remove-Item $logPath -ErrorAction SilentlyContinue }
    }
}

Describe 'Test-IdempotencyComplete' {
    It 'returns true when both INVOKE and COMPLETE exist for stage' {
        $tokens = [System.Collections.Generic.HashSet[string]]::new()
        $null = $tokens.Add('INVOKE:stage1')
        $null = $tokens.Add('COMPLETE:stage1')
        Test-IdempotencyComplete -Tokens $tokens -Stage 'stage1' | Should -BeTrue
    }

    It 'returns false when only INVOKE exists' {
        $tokens = [System.Collections.Generic.HashSet[string]]::new()
        $null = $tokens.Add('INVOKE:stage1')
        Test-IdempotencyComplete -Tokens $tokens -Stage 'stage1' | Should -BeFalse
    }

    It 'returns false for unknown stage' {
        $tokens = [System.Collections.Generic.HashSet[string]]::new()
        Test-IdempotencyComplete -Tokens $tokens -Stage 'unknown' | Should -BeFalse
    }
}
