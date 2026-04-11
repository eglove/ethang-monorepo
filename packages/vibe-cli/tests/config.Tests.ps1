BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
}

Describe 'Write-PipelineLog' {
    BeforeEach {
        $script:testLog = [System.IO.Path]::GetTempFileName()
        $script:origLog = $global:PipelineLogFile
        $global:PipelineLogFile = $script:testLog
    }

    AfterEach {
        $global:PipelineLogFile = $script:origLog
        Remove-Item $script:testLog -ErrorAction SilentlyContinue
    }

    It 'writes a timestamped line to the log file' {
        Write-PipelineLog 'test message'
        $content = Get-Content $script:testLog -Raw
        $content | Should -Match '\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] test message'
    }

    It 'appends multiple lines' {
        Write-PipelineLog 'first'
        Write-PipelineLog 'second'
        $lines = Get-Content $script:testLog
        $lines.Count | Should -Be 2
        $lines[0] | Should -Match 'first'
        $lines[1] | Should -Match 'second'
    }
}

Describe 'Config values' {
    It 'has all required design-stage keys' {
        $Config.Keys | Should -Contain 'MaxDebateRounds'
        $Config.Keys | Should -Contain 'MaxTddCycles'
        $Config.Keys | Should -Contain 'CleanupPasses'
        $Config.Keys | Should -Contain 'MaxFixRounds'
        $Config.Keys | Should -Contain 'MaxTlcAttempts'
        $Config.Keys | Should -Contain 'MaxElicitorTurns'
        $Config.Keys | Should -Contain 'VerifyTest'
        $Config.Keys | Should -Contain 'VerifyLint'
        $Config.Keys | Should -Contain 'VerifyTsc'
    }

    It 'does not contain removed MaxGreenRetries key' {
        $Config.Keys | Should -Not -Contain 'MaxGreenRetries'
    }

    It 'has all required Stage 8 keys' {
        $Config.Keys | Should -Contain 'MaxRedRetries'
        $Config.Keys | Should -Contain 'MaxMergeRetries'
        $Config.Keys | Should -Contain 'JobTimeoutSeconds'
        $Config.Keys | Should -Contain 'TaskTimeouts'
        $Config.Keys | Should -Contain 'TaskMaxWallClockSeconds'
        $Config.Keys | Should -Contain 'PipelineTimeoutSeconds'
        $Config.Keys | Should -Contain 'VerifyCommandAllowlistPattern'
    }

    It 'has correct Stage 8 constant values' {
        $Config.MaxRedRetries | Should -Be 3
        $Config.MaxMergeRetries | Should -Be 3
        $Config.JobTimeoutSeconds | Should -Be 600
        $Config.TaskMaxWallClockSeconds | Should -Be 3600
        $Config.PipelineTimeoutSeconds | Should -Be 14400
    }

    It 'retains existing TDD/cleanup values' {
        $Config.MaxTddCycles | Should -Be 10
        $Config.MaxFixRounds | Should -Be 100
        $Config.CleanupPasses | Should -Be 2
    }

    It 'has TaskTimeouts hashtable with per-writer-type entries' {
        $Config.TaskTimeouts | Should -BeOfType [hashtable]
        $Config.TaskTimeouts.Keys | Should -Contain 'powershell-writer'
        $Config.TaskTimeouts.Keys | Should -Contain 'typescript-writer'
        $Config.TaskTimeouts.Keys | Should -Contain 'hono-writer'
        $Config.TaskTimeouts.Keys | Should -Contain 'ui-writer'
        $Config.TaskTimeouts.Keys | Should -Contain 'agent-writer'
        $Config.TaskTimeouts.Keys | Should -Contain 'merge-resolver'
    }

    It 'has positive integer values for all TaskTimeouts entries' {
        foreach ($key in $Config.TaskTimeouts.Keys) {
            $Config.TaskTimeouts[$key] | Should -BeOfType [int]
            $Config.TaskTimeouts[$key] | Should -BeGreaterThan 0 -Because "TaskTimeouts[$key] must be positive"
        }
    }

    It 'has positive integer values for all caps' {
        $intKeys = $Config.Keys | Where-Object { $Config[$_] -is [int] }
        foreach ($key in $intKeys) {
            $Config[$key] | Should -BeGreaterThan 0 -Because "$key must be positive"
        }
    }
}

Describe 'Test-VerifyCommand' {
    It 'accepts valid commands' {
        { Test-VerifyCommand -Command 'pnpm test' } | Should -Not -Throw
        { Test-VerifyCommand -Command 'pnpm lint' } | Should -Not -Throw
        { Test-VerifyCommand -Command 'pnpm tsc' } | Should -Not -Throw
        { Test-VerifyCommand -Command 'npx vitest run' } | Should -Not -Throw
    }

    It 'rejects commands with semicolons' {
        { Test-VerifyCommand -Command 'pnpm test; rm -rf /' } | Should -Throw '*disallowed*'
    }

    It 'rejects commands with pipe' {
        { Test-VerifyCommand -Command 'pnpm test | grep fail' } | Should -Throw '*disallowed*'
    }

    It 'rejects commands with ampersand' {
        { Test-VerifyCommand -Command 'pnpm test & echo done' } | Should -Throw '*disallowed*'
    }

    It 'rejects commands with backtick' {
        { Test-VerifyCommand -Command 'cmd /c `malicious`' } | Should -Throw '*disallowed*'
    }

    It 'rejects commands with dollar sign subexpression' {
        { Test-VerifyCommand -Command 'echo $(whoami)' } | Should -Throw '*disallowed*'
    }
}

# =============================================================================
# T2 — runId Generation (RED: New-RunId must be implemented)
# =============================================================================

Describe 'New-RunId' {
    It 'returns a string matching format "<yyyyMMddTHHmmss>-<4 hex chars>"' {
        $runId = New-RunId
        $runId | Should -Match '^\d{8}T\d{6}-[0-9a-f]{4}$'
    }

    It 'uses current timestamp in the prefix' {
        $before = Get-Date -Format 'yyyyMMddTHHmmss'
        $runId = New-RunId
        $after = Get-Date -Format 'yyyyMMddTHHmmss'

        $prefix = $runId.Split('-')[0]
        # The timestamp prefix must be between before and after
        $prefix | Should -BeGreaterOrEqual $before
        $prefix | Should -BeLessOrEqual $after
    }

    It 'generates different hex suffixes on successive calls' {
        $ids = 1..10 | ForEach-Object { New-RunId }
        $suffixes = $ids | ForEach-Object { $_.Split('-')[1] }
        # At least 2 unique suffixes out of 10 calls (randomness check)
        ($suffixes | Select-Object -Unique).Count | Should -BeGreaterThan 1
    }

    It 'hex suffix contains only lowercase hex characters' {
        $runId = New-RunId
        $suffix = $runId.Split('-')[1]
        $suffix | Should -Match '^[0-9a-f]{4}$'
    }

    It 'returns exactly one string (not an array)' {
        $runId = New-RunId
        $runId | Should -BeOfType [string]
    }
}

Describe 'Get-RunIdFromLog' {
    BeforeEach {
        $script:testLog = [System.IO.Path]::GetTempFileName()
    }

    AfterEach {
        Remove-Item $script:testLog -ErrorAction SilentlyContinue
    }

    It 'extracts runId from PIPELINE START line in log' {
        $logContent = @(
            '[2026-04-11 11:28:13] [20260411T112813-a3f1] PIPELINE START feature=auth-flow'
        )
        Set-Content -Path $script:testLog -Value $logContent

        $runId = Get-RunIdFromLog -LogPath $script:testLog
        $runId | Should -BeExactly '20260411T112813-a3f1'
    }

    It 'returns the LAST runId when multiple PIPELINE START entries exist' {
        $logContent = @(
            '[2026-04-11 10:00:00] [20260411T100000-1111] PIPELINE START feature=auth-flow'
            '[2026-04-11 10:00:00] [20260411T100000-1111] STAGE 1 START'
            '[2026-04-11 11:28:13] [20260411T112813-a3f1] PIPELINE START feature=auth-flow'
        )
        Set-Content -Path $script:testLog -Value $logContent

        $runId = Get-RunIdFromLog -LogPath $script:testLog
        $runId | Should -BeExactly '20260411T112813-a3f1'
    }

    It 'returns $null when log file does not contain PIPELINE START' {
        $logContent = @(
            '[2026-04-11 10:00:00] [20260411T100000-1111] STAGE 1 START'
            '[2026-04-11 10:00:00] [20260411T100000-1111] STAGE 1 COMPLETE'
        )
        Set-Content -Path $script:testLog -Value $logContent

        $runId = Get-RunIdFromLog -LogPath $script:testLog
        $runId | Should -BeNullOrEmpty
    }

    It 'returns $null when log file does not exist' {
        $runId = Get-RunIdFromLog -LogPath 'C:\nonexistent\path\pipeline.log'
        $runId | Should -BeNullOrEmpty
    }
}

Describe 'Invoke-VerifyCommand' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}
    }

    It 'rejects invalid commands before execution' {
        { Invoke-VerifyCommand -Command 'test; rm -rf /' } | Should -Throw '*disallowed*'
    }

    It 'splits and executes valid commands via call operator' {
        function pnpm { cmd /c "exit 0" }
        Mock pnpm { cmd /c "exit 0" } -Verifiable
        $result = Invoke-VerifyCommand -Command 'pnpm test'
        $result | Should -Be 0
        Should -InvokeVerifiable
    }

    It 'returns 0 when LASTEXITCODE is null after execution' {
        $global:LASTEXITCODE = $null
        function pnpm {}
        Mock pnpm {}
        $result = Invoke-VerifyCommand -Command 'pnpm test'
        $result | Should -Be 0
    }

    It 'returns scalar integer when command writes stdout and exits 0' {
        function pnpm {
            Write-Output 'Scope: all 17 workspace projects'
            Write-Output 'packages/app: lint passed'
            Write-Output 'packages/lib: lint passed'
            $global:LASTEXITCODE = 0
        }
        Mock pnpm {
            Write-Output 'Scope: all 17 workspace projects'
            Write-Output 'packages/app: lint passed'
            Write-Output 'packages/lib: lint passed'
            $global:LASTEXITCODE = 0
        }
        $result = Invoke-VerifyCommand -Command 'pnpm lint'
        $result | Should -BeOfType [int]
        $result | Should -Be 0
    }

    It 'returns scalar integer when command writes stdout and exits non-zero' {
        function pnpm {
            Write-Output 'Scope: all 17 workspace projects'
            Write-Output 'packages/app: lint FAILED'
            $global:LASTEXITCODE = 1
        }
        Mock pnpm {
            Write-Output 'Scope: all 17 workspace projects'
            Write-Output 'packages/app: lint FAILED'
            $global:LASTEXITCODE = 1
        }
        $result = Invoke-VerifyCommand -Command 'pnpm lint'
        $result | Should -BeOfType [int]
        $result | Should -Be 1
    }

    It 'does not leak command output into return value' {
        function pnpm {
            Write-Output 'line1'
            Write-Output 'line2'
            $global:LASTEXITCODE = 0
        }
        Mock pnpm {
            Write-Output 'line1'
            Write-Output 'line2'
            $global:LASTEXITCODE = 0
        }
        $result = Invoke-VerifyCommand -Command 'pnpm lint'
        $result.GetType().Name | Should -Not -Be 'Object[]'
        $result | Should -Not -Contain 'line1'
        $result | Should -Not -Contain 'line2'
    }

    It 'exit code 0 with stdout does not falsely trigger -ne 0 check' {
        function pnpm {
            Write-Output 'noisy output'
            $global:LASTEXITCODE = 0
        }
        Mock pnpm {
            Write-Output 'noisy output'
            $global:LASTEXITCODE = 0
        }
        $result = Invoke-VerifyCommand -Command 'pnpm lint'
        # This is the exact check tdd-cleanup.ps1 uses — must be $false for exit code 0
        ($result -ne 0) | Should -Be $false
    }
}
