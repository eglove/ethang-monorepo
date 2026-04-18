BeforeAll {
    $script:LogCalls = @()
    function global:Write-PipelineLog { param($Message,$Severity='INFO',$Gate=$null,$StructuredData=$null); $script:LogCalls += @{Message=$Message;Severity=$Severity} }
    . "$PSScriptRoot/../../../bus/router/heartbeat.ps1"
}

Describe 'Invoke-EmitHeartbeat' {
    BeforeEach {
        $script:LogCalls = @()
        Reset-HeartbeatState
        [QueueDepthStore]::Reset() | Out-Null
    }

    It 'T01 - calls Write-PipelineLog with Severity INFO' {
        Invoke-EmitHeartbeat -Connection $null
        $script:LogCalls.Count | Should -BeGreaterThan 0
        $script:LogCalls[0].Severity | Should -Be 'INFO'
    }

    It 'T02 - banner contains [HEARTBEAT]' {
        Invoke-EmitHeartbeat -Connection $null
        $script:LogCalls[0].Message | Should -Match '\[HEARTBEAT\]'
    }

    It 'T03 - banner contains tick= value' {
        Invoke-EmitHeartbeat -Connection $null
        $script:LogCalls[0].Message | Should -Match 'tick=\d+'
    }

    It 'T04 - banner contains queue_depth= value' {
        Invoke-EmitHeartbeat -Connection $null
        $script:LogCalls[0].Message | Should -Match 'queue_depth=\d+'
    }

    It 'T05 - increments _TickCount each call' {
        Invoke-EmitHeartbeat -Connection $null
        Invoke-EmitHeartbeat -Connection $null
        $status = Get-HeartbeatStatus
        $status.TickCount | Should -Be 2
    }

    It 'T06 - sets _LastTickAt to virtual clock time' {
        $fakeTime = [DateTime]::new(2026, 4, 18, 12, 0, 0, [System.DateTimeKind]::Utc)
        $mockClock = { $fakeTime }
        Invoke-EmitHeartbeat -Connection $null -GetUtcNow $mockClock
        $status = Get-HeartbeatStatus
        $status.LastTickAt | Should -Be $fakeTime
    }

    It 'T07 - returns TickCount=1 on first call' {
        $result = Invoke-EmitHeartbeat -Connection $null
        $result.TickCount | Should -Be 1
    }

    It 'T08 - uses virtual clock: timestamp in result matches injected time' {
        $fakeTime = [DateTime]::new(2026, 1, 15, 9, 30, 0, [System.DateTimeKind]::Utc)
        $mockClock = { $fakeTime }
        $result = Invoke-EmitHeartbeat -Connection $null -GetUtcNow $mockClock
        $result.Timestamp | Should -Be $fakeTime
    }

    It 'T17 - QueueDepthStore.Read() is called and reflected in banner' {
        [QueueDepthStore]::Increment() | Out-Null
        [QueueDepthStore]::Increment() | Out-Null
        [QueueDepthStore]::Increment() | Out-Null
        $result = Invoke-EmitHeartbeat -Connection $null
        $result.QueueDepth | Should -Be 3
        $script:LogCalls[0].Message | Should -Match 'queue_depth=3'
    }
}

Describe 'Get-HeartbeatStatus' {
    BeforeEach {
        $script:LogCalls = @()
        Reset-HeartbeatState
        [QueueDepthStore]::Reset() | Out-Null
    }

    It 'T09 - returns Running=$false before start' {
        $status = Get-HeartbeatStatus
        $status.Running | Should -Be $false
    }

    It 'T10 - returns correct TickCount after multiple ticks' {
        Invoke-EmitHeartbeat -Connection $null
        Invoke-EmitHeartbeat -Connection $null
        Invoke-EmitHeartbeat -Connection $null
        $status = Get-HeartbeatStatus
        $status.TickCount | Should -Be 3
    }
}

Describe 'Test-CrashDetected' {
    BeforeEach {
        $script:LogCalls = @()
        Reset-HeartbeatState
        [QueueDepthStore]::Reset() | Out-Null
    }

    It 'T11 - returns $false when _LastTickAt is null (never started)' {
        Test-CrashDetected | Should -Be $false
    }

    It 'T12 - returns $false when tick is recent (1s ago, threshold 15s)' {
        $baseTime = [DateTime]::UtcNow
        $script:_LastTickAt = $baseTime.AddSeconds(-1)
        $mockClock = { $baseTime }
        Test-CrashDetected -StalenessThresholdMs 15000 -GetUtcNow $mockClock | Should -Be $false
    }

    It 'T13 - returns $true when tick is stale (20s ago, threshold 15s)' {
        $script:_LastTickAt = [DateTime]::UtcNow
        $mockClock = { [DateTime]::UtcNow.AddSeconds(20) }
        Test-CrashDetected -StalenessThresholdMs 15000 -GetUtcNow $mockClock | Should -Be $true
    }

    It 'T14 - uses virtual clock for "now" calculation' {
        $baseTime = [DateTime]::new(2026, 4, 18, 10, 0, 0, [System.DateTimeKind]::Utc)
        $script:_LastTickAt = $baseTime.AddSeconds(-30)
        $mockClock = { $baseTime }
        # 30s elapsed > 15s threshold => crash
        Test-CrashDetected -StalenessThresholdMs 15000 -GetUtcNow $mockClock | Should -Be $true
    }
}

Describe 'Reset-HeartbeatState' {
    BeforeEach {
        $script:LogCalls = @()
        Reset-HeartbeatState
        [QueueDepthStore]::Reset() | Out-Null
    }

    It 'T15 - resets TickCount to 0' {
        Invoke-EmitHeartbeat -Connection $null
        Invoke-EmitHeartbeat -Connection $null
        Reset-HeartbeatState
        $status = Get-HeartbeatStatus
        $status.TickCount | Should -Be 0
    }

    It 'T16 - resets _LastTickAt to null' {
        Invoke-EmitHeartbeat -Connection $null
        Reset-HeartbeatState
        $status = Get-HeartbeatStatus
        $status.LastTickAt | Should -BeNullOrEmpty
    }
}

Describe 'Stop-HeartbeatTimer' {
    BeforeEach {
        $script:LogCalls = @()
        Reset-HeartbeatState
        [QueueDepthStore]::Reset() | Out-Null
    }

    It 'T18 - unregisters VibeBus.Heartbeat event subscriber' {
        # Register a dummy event to simulate a registered subscriber
        $dummyTimer = [System.Timers.Timer]::new(60000)
        Register-ObjectEvent -InputObject $dummyTimer -EventName 'Elapsed' -SourceIdentifier 'VibeBus.Heartbeat' -Action {} | Out-Null
        $script:_HeartbeatTimer = $dummyTimer
        $script:_HeartbeatRunning = $true

        Stop-HeartbeatTimer

        $sub = Get-EventSubscriber -SourceIdentifier 'VibeBus.Heartbeat' -ErrorAction SilentlyContinue
        $sub | Should -BeNullOrEmpty
        $script:_HeartbeatRunning | Should -Be $false

        $dummyTimer.Dispose()
    }
}
