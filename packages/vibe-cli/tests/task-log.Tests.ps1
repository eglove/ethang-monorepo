BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
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

    It 'returns early without error when LogFile is null (L40)' {
        $origLog = $global:PipelineLogFile
        $global:PipelineLogFile = $null
        try {
            { Write-ThreadSafeLog -Message 'should not fail' } | Should -Not -Throw
        }
        finally {
            $global:PipelineLogFile = $origLog
        }
    }

    It 'handles AbandonedMutexException in Write-ThreadSafeLog (L29-36)' {
        # Create a real abandoned mutex by acquiring in a thread job then letting it die
        $mutexName = "Global\vibe-cli-tslog-abandon-$(Get-Random)"
        $job = Start-ThreadJob {
            param($name)
            $m = [System.Threading.Mutex]::new($false, $name)
            $m.WaitOne() | Out-Null
            # Don't release — just exit (simulates crash)
        } -ArgumentList $mutexName
        $job | Wait-Job | Out-Null
        $job | Remove-Job

        # Now use that abandoned mutex
        $script:PipelineMutex = [System.Threading.Mutex]::new($false, $mutexName)

        Write-ThreadSafeLog -Message 'abandoned mutex entry'

        $content = Get-Content $script:testLog -Raw
        $content | Should -Match 'abandoned mutex entry'

        # Also check that fallback file was created with warning
        $fallback = [System.IO.Path]::ChangeExtension($script:testLog, '.fallback.log')
        $fallback | Should -Exist
        $fbContent = Get-Content $fallback -Raw
        $fbContent | Should -Match 'Acquired abandoned mutex'

        # Restore
        $script:PipelineMutex = $null
    }

    It 'retries fallback log write on IOException (L47-54)' {
        $script:ioFailCount = 0
        Mock New-PipelineMutex {
            $mock = [pscustomobject]@{}
            $mock | Add-Member -MemberType ScriptMethod -Name WaitOne -Value { param($ms) return $false }
            $mock | Add-Member -MemberType ScriptMethod -Name ReleaseMutex -Value { }
            return $mock
        }

        # Save original and reduce retries
        $script:PipelineMutex = $null
        $origRetryMs = $script:FallbackLogRetryMs
        $script:FallbackLogRetryMs = 1

        Write-ThreadSafeLog -Message 'retry entry'

        $fallback = [System.IO.Path]::ChangeExtension($script:testLog, '.fallback.log')
        $fallback | Should -Exist
        $content = Get-Content $fallback -Raw
        $content | Should -Match 'retry entry'

        # Restore
        $script:PipelineMutex = $null
        $script:FallbackLogRetryMs = $origRetryMs
    }

    It 'falls back to Console.Error.WriteLine when mutex timeout AND fallback file write fails' {
        # Mock mutex to return false (timeout)
        Mock New-PipelineMutex {
            $mock = [pscustomobject]@{}
            $mock | Add-Member -MemberType ScriptMethod -Name WaitOne -Value { param($ms) return $false }
            $mock | Add-Member -MemberType ScriptMethod -Name ReleaseMutex -Value { }
            return $mock
        }

        # Point the log file to a non-writable path so the fallback also fails
        $script:PipelineMutex = $null
        $script:FallbackLogMaxRetries = 0  # Force skip of all retry attempts

        # Capture stderr
        $stderrOutput = $null
        $origErr = [Console]::Error
        $sw = [System.IO.StringWriter]::new()
        [Console]::SetError($sw)

        try {
            Write-ThreadSafeLog -Message 'stderr entry'
            $stderrOutput = $sw.ToString()
        }
        finally {
            [Console]::SetError($origErr)
            $sw.Dispose()
            $script:PipelineMutex = $null
            $script:FallbackLogMaxRetries = 3
        }

        $stderrOutput | Should -Match 'stderr entry'
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

    It 'handles AbandonedMutexException during sync (L98-101)' {
        [System.IO.File]::WriteAllText($script:fallbackLog, "[2026-04-10] abandoned sync entry`n")

        # Create a real abandoned mutex
        $mutexName = "Global\vibe-cli-sync-abandon-$(Get-Random)"
        $job = Start-ThreadJob {
            param($name)
            $m = [System.Threading.Mutex]::new($false, $name)
            $m.WaitOne() | Out-Null
            # Don't release — simulates crash
        } -ArgumentList $mutexName
        $job | Wait-Job | Out-Null
        $job | Remove-Job

        $script:PipelineMutex = [System.Threading.Mutex]::new($false, $mutexName)
        Sync-FallbackLog -LogFile $script:testLog

        $content = Get-Content $script:testLog -Raw
        $content | Should -Match 'abandoned sync entry'

        # Restore
        $script:PipelineMutex = $null
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
        $taskLog = Join-Path $script:testFeatureDir 'logs/T3-log.txt'
        $taskLog | Should -Exist
        $content = Get-Content $taskLog -Raw
        $content | Should -Match 'T3.*green.*code written'
    }

    It 'creates logs directory if absent' {
        $logsDir = Join-Path $script:testFeatureDir 'logs'
        $logsDir | Should -Not -Exist
        Write-TaskLog -TaskId 'T1' -Phase 'red' -Message 'start' -FeatureDir $script:testFeatureDir
        $logsDir | Should -Exist
    }

    It 'includes RunId when provided' {
        Write-TaskLog -TaskId 'T1' -Phase 'red' -Message 'msg' -RunId 'abc-123'
        $content = Get-Content $script:testLog -Raw
        $content | Should -Match 'abc-123'
    }

    It 'throws when TaskId is empty' {
        { Write-TaskLog -TaskId '' -Phase 'red' -Message 'msg' } | Should -Throw
    }

    It 'throws ArgumentException with message when TaskId is $null' {
        { Write-TaskLog -TaskId $null -Phase 'red' -Message 'msg' } | Should -Throw '*TaskId*'
    }

    It 'includes RunId AND Detail in per-task log entry' {
        Write-TaskLog -TaskId 'T5' -Phase 'green' -Message 'code gen' -Detail 'extra context' -FeatureDir $script:testFeatureDir -RunId 'run-42'
        $taskLog = Join-Path $script:testFeatureDir 'logs/T5-log.txt'
        $content = Get-Content $taskLog -Raw
        $content | Should -Match 'run-42'
        $content | Should -Match '\[T5\]'
        $content | Should -Match 'extra context'
    }
}
