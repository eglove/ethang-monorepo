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
        $Config.MaxTddCycles | Should -Be 100
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

Describe 'Invoke-VerifyCommand' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}
    }

    It 'rejects invalid commands before execution' {
        { Invoke-VerifyCommand -Command 'test; rm -rf /' } | Should -Throw '*disallowed*'
    }

    It 'splits and executes valid commands via call operator' {
        # Define stub so Mock works even when pnpm is not installed (CI)
        function pnpm { $global:LASTEXITCODE = 0 }
        Mock pnpm { $global:LASTEXITCODE = 0 } -Verifiable
        $result = Invoke-VerifyCommand -Command 'pnpm test'
        $result | Should -Be 0
        Should -InvokeVerifiable
    }
}
