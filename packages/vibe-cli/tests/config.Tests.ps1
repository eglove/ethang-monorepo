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
    It 'has all required keys' {
        $Config.Keys | Should -Contain 'MaxDebateRounds'
        $Config.Keys | Should -Contain 'MaxTddCycles'
        $Config.Keys | Should -Contain 'MaxGreenRetries'
        $Config.Keys | Should -Contain 'CleanupPasses'
        $Config.Keys | Should -Contain 'MaxFixRounds'
        $Config.Keys | Should -Contain 'WorktreeThrottleLimit'
        $Config.Keys | Should -Contain 'MaxTlcAttempts'
        $Config.Keys | Should -Contain 'MaxGlobalFixRounds'
        $Config.Keys | Should -Contain 'MaxElicitorTurns'
        $Config.Keys | Should -Contain 'VerifyTest'
        $Config.Keys | Should -Contain 'VerifyLint'
        $Config.Keys | Should -Contain 'VerifyTsc'
    }

    It 'has positive integer values for all caps' {
        foreach ($key in $Config.Keys) {
            $Config[$key] | Should -BeGreaterThan 0 -Because "$key must be positive"
        }
    }
}
