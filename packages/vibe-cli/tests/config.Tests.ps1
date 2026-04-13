BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
}

Describe 'Write-PipelineLog' {
    BeforeEach {
        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "plog-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:testLog = Join-Path $script:testRoot 'pipeline.log'
    }

    AfterEach {
        Remove-Item $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'writes a timestamped line to the log file' {
        Write-PipelineLog 'test message' -Root $script:testRoot
        $content = Get-Content $script:testLog -Raw
        $content | Should -Match '\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] test message'
    }

    It 'appends multiple lines' {
        Write-PipelineLog 'first' -Root $script:testRoot
        Write-PipelineLog 'second' -Root $script:testRoot
        $lines = Get-Content $script:testLog
        $lines.Count | Should -Be 2
        $lines[0] | Should -Match 'first'
        $lines[1] | Should -Match 'second'
    }
}

Describe 'Invoke-VerifyCommand' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}
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
