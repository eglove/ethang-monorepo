BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/task-log.ps1"
}

Describe 'New-PipelineMutex' {
    It 'returns a mutex object' {
        $m = New-PipelineMutex
        $m | Should -Not -BeNullOrEmpty
        $m | Should -BeOfType [System.Threading.Mutex]
    }

    It 'returns the same instance on repeated calls' {
        $m1 = New-PipelineMutex
        $m2 = New-PipelineMutex
        [object]::ReferenceEquals($m1, $m2) | Should -BeTrue
    }
}

Describe 'Write-ThreadSafeLog' {
    BeforeEach {
        $script:testLog = Join-Path ([System.IO.Path]::GetTempPath()) "tslog-test-$(Get-Random).log"
        $script:origLog = $global:PipelineLogFile
        $global:PipelineLogFile = $script:testLog
    }

    AfterEach {
        $global:PipelineLogFile = $script:origLog
        Remove-Item $script:testLog -ErrorAction SilentlyContinue
        $fallback = [System.IO.Path]::ChangeExtension($script:testLog, '.fallback.log')
        Remove-Item $fallback -ErrorAction SilentlyContinue
    }

    It 'writes a timestamped line to the log file' {
        Write-ThreadSafeLog -Message 'test entry'
        $content = Get-Content $script:testLog -Raw
        $content | Should -Match '\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] test entry'
    }

    It 'uses AppendAllText for atomic writes' {
        Write-ThreadSafeLog -Message 'line1'
        Write-ThreadSafeLog -Message 'line2'
        $lines = Get-Content $script:testLog
        $lines.Count | Should -Be 2
    }

    It 'writes to fallback log on mutex timeout' {
        # Mock the mutex to simulate timeout
        Mock New-PipelineMutex {
            $mock = [pscustomobject]@{}
            $mock | Add-Member -MemberType ScriptMethod -Name WaitOne -Value { param($ms) return $false }
            $mock | Add-Member -MemberType ScriptMethod -Name ReleaseMutex -Value { }
            return $mock
        }

        # Re-initialize to use the mock
        $script:PipelineMutex = $null
        Write-ThreadSafeLog -Message 'fallback entry'

        $fallback = [System.IO.Path]::ChangeExtension($script:testLog, '.fallback.log')
        $fallback | Should -Exist
        $content = Get-Content $fallback -Raw
        $content | Should -Match 'fallback entry'

        # Restore
        $script:PipelineMutex = $null
    }
}

Describe 'Sync-FallbackLog' {
    BeforeEach {
        $script:testLog = Join-Path ([System.IO.Path]::GetTempPath()) "sync-test-$(Get-Random).log"
        $script:fallbackLog = [System.IO.Path]::ChangeExtension($script:testLog, '.fallback.log')
        $script:origLog = $global:PipelineLogFile
        $global:PipelineLogFile = $script:testLog
        [System.IO.File]::WriteAllText($script:testLog, '')
    }

    AfterEach {
        $global:PipelineLogFile = $script:origLog
        Remove-Item $script:testLog -ErrorAction SilentlyContinue
        Remove-Item $script:fallbackLog -ErrorAction SilentlyContinue
    }

    It 'flushes entries from fallback to main log' {
        [System.IO.File]::WriteAllText($script:fallbackLog, "[2026-04-10] orphaned entry`n")
        Sync-FallbackLog -LogFile $script:testLog
        $content = Get-Content $script:testLog -Raw
        $content | Should -Match 'orphaned entry'
    }

    It 'truncates fallback file after flush' {
        [System.IO.File]::WriteAllText($script:fallbackLog, "[2026-04-10] entry`n")
        Sync-FallbackLog -LogFile $script:testLog
        $remaining = [System.IO.File]::ReadAllText($script:fallbackLog)
        $remaining | Should -Be ''
    }

    It 'is a no-op when fallback file does not exist' {
        { Sync-FallbackLog -LogFile $script:testLog } | Should -Not -Throw
    }
}

Describe 'Write-TaskLog' {
    BeforeEach {
        $script:testLog = Join-Path ([System.IO.Path]::GetTempPath()) "tasklog-test-$(Get-Random).log"
        $script:testFeatureDir = Join-Path ([System.IO.Path]::GetTempPath()) "feat-test-$(Get-Random)"
        $script:origLog = $global:PipelineLogFile
        $global:PipelineLogFile = $script:testLog
        New-Item -ItemType Directory -Path $script:testFeatureDir -Force | Out-Null
    }

    AfterEach {
        $global:PipelineLogFile = $script:origLog
        Remove-Item $script:testLog -ErrorAction SilentlyContinue
        Remove-Item $script:testFeatureDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'writes to pipeline log via Write-ThreadSafeLog' {
        Write-TaskLog -TaskId 'T3' -Phase 'red' -Message 'tests written'
        $content = Get-Content $script:testLog -Raw
        $content | Should -Match '\[T3\] red: tests written'
    }

    It 'writes to per-task log file when FeatureDir provided' {
        Write-TaskLog -TaskId 'T3' -Phase 'green' -Message 'code written' -FeatureDir $script:testFeatureDir
        $taskLog = Join-Path $script:testFeatureDir 'tickets/T3-log.txt'
        $taskLog | Should -Exist
        $content = Get-Content $taskLog -Raw
        $content | Should -Match 'T3.*green.*code written'
    }

    It 'creates tickets directory if absent' {
        $ticketsDir = Join-Path $script:testFeatureDir 'tickets'
        $ticketsDir | Should -Not -Exist
        Write-TaskLog -TaskId 'T1' -Phase 'red' -Message 'start' -FeatureDir $script:testFeatureDir
        $ticketsDir | Should -Exist
    }

    It 'includes RunId when provided' {
        Write-TaskLog -TaskId 'T1' -Phase 'red' -Message 'msg' -RunId 'abc-123'
        $content = Get-Content $script:testLog -Raw
        $content | Should -Match 'abc-123'
    }

    It 'throws when TaskId is empty' {
        { Write-TaskLog -TaskId '' -Phase 'red' -Message 'msg' } | Should -Throw
    }
}
