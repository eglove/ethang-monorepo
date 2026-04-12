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

    It 'has MaxCrashes key' {
        $Config.Keys | Should -Contain 'MaxCrashes'
    }

    It 'has MaxCrashes equal to 3' {
        $Config.MaxCrashes | Should -Be 3
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

Describe 'Invoke-VerifyCommand' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}
    }

    It 'rejects invalid commands before execution' {
        { Invoke-VerifyCommand -Command 'test; rm -rf /' } | Should -Throw '*disallowed*'
    }

    It 'splits and executes valid commands via call operator' {
        function pnpm { $global:LASTEXITCODE = 0 }
        Mock pnpm { $global:LASTEXITCODE = 0 } -Verifiable
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

Describe 'Invoke-ScopedTestVerify' {
    It 'returns 0 when all tests pass' {
        Mock Invoke-Pester { return @{ FailedCount = 0 } }
        Mock New-PesterConfiguration { return [PesterConfiguration]::new() }
        $result = Invoke-ScopedTestVerify -TestFiles @('fake.Tests.ps1')
        $result | Should -Be 0
    }

    It 'returns 1 when tests fail' {
        Mock Invoke-Pester { return @{ FailedCount = 2 } }
        Mock New-PesterConfiguration { return [PesterConfiguration]::new() }
        $result = Invoke-ScopedTestVerify -TestFiles @('fake.Tests.ps1')
        $result | Should -Be 1
    }

    It 'uses Push-Location/Pop-Location when WorkingDirectory is specified' {
        Mock Invoke-Pester { return @{ FailedCount = 0 } }
        Mock New-PesterConfiguration { return [PesterConfiguration]::new() }
        Mock Push-Location {}
        Mock Pop-Location {}
        $result = Invoke-ScopedTestVerify -TestFiles @('fake.Tests.ps1') -WorkingDirectory 'C:\temp'
        $result | Should -Be 0
        Should -Invoke Push-Location -Times 1 -ParameterFilter { $Path -eq 'C:\temp' }
        Should -Invoke Pop-Location -Times 1
    }
}

Describe 'Invoke-VerifyCommand with WorkingDirectory' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}
    }

    It 'changes directory when WorkingDirectory is provided' {
        function pnpm { $global:LASTEXITCODE = 0 }
        Mock pnpm { $global:LASTEXITCODE = 0 }
        Mock Set-Location {}
        Mock Get-Location { return 'C:\original' }

        $result = Invoke-VerifyCommand -Command 'pnpm test' -WorkingDirectory 'C:\workdir'
        $result | Should -Be 0
        Should -Invoke Set-Location -Times 2
    }
}

Describe 'New-RunId' {
    It 'matches format yyyyMMddTHHmmss-4hex' {
        New-RunId | Should -Match '^\d{8}T\d{6}-[0-9a-f]{4}$'
    }
    It 'generates unique values on consecutive calls' {
        $id1 = New-RunId; $id2 = New-RunId
        $id1 | Should -Not -Be $id2
    }
    It 'timestamp portion reflects current time' {
        $before = Get-Date -Format 'yyyyMMddTHHmmss'
        $id = New-RunId
        $tsPart = $id.Split('-')[0]
        $tsPart | Should -BeGreaterOrEqual $before
    }
}

Describe 'Get-RunIdFromLog' {
    BeforeEach { $script:testLog = [System.IO.Path]::GetTempFileName() }
    AfterEach { Remove-Item $script:testLog -ErrorAction SilentlyContinue }

    It 'extracts runId from PIPELINE START line' {
        Set-Content $script:testLog -Value '[2026-04-11 12:00:00] PIPELINE START runId=20260411T120000-abcd version=1'
        Get-RunIdFromLog -LogPath $script:testLog | Should -BeExactly '20260411T120000-abcd'
    }
    It 'throws when log file does not exist' {
        { Get-RunIdFromLog -LogPath 'C:\nonexistent\log.txt' } | Should -Throw '*not found*'
    }
    It 'throws when log has no PIPELINE START line' {
        Set-Content $script:testLog -Value '[2026-04-11] some other line'
        { Get-RunIdFromLog -LogPath $script:testLog } | Should -Throw '*No valid runId*'
    }
    It 'throws on malformed runId — missing hex suffix' {
        Set-Content $script:testLog -Value '[2026-04-11 12:00:00] PIPELINE START runId=20260411T120000 version=1'
        { Get-RunIdFromLog -LogPath $script:testLog } | Should -Throw '*No valid runId*'
    }
    It 'throws on truncated runId' {
        Set-Content $script:testLog -Value '[2026-04-11 12:00:00] PIPELINE START runId=20260411T1 version=1'
        { Get-RunIdFromLog -LogPath $script:testLog } | Should -Throw '*No valid runId*'
    }
    It 'rejects runId with extra characters after valid portion' {
        Set-Content $script:testLog -Value '[2026-04-11 12:00:00] PIPELINE START runId=20260411T120000-abcd-extra version=1'
        { Get-RunIdFromLog -LogPath $script:testLog } | Should -Throw '*No valid runId*'
    }
    It 'extracts runId from multi-line log' {
        $lines = @('[2026-04-11 12:00:00] PIPELINE START runId=20260411T120000-beef version=1', '[2026-04-11 12:01:00] Stage 1 complete')
        Set-Content $script:testLog -Value ($lines -join "`n")
        Get-RunIdFromLog -LogPath $script:testLog | Should -BeExactly '20260411T120000-beef'
    }
}
