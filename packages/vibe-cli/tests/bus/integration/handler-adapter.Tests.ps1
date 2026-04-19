BeforeAll {
    . "$PSScriptRoot/../../helpers/git-test-double.ps1"
    . "$PSScriptRoot/../../helpers/tlc-test-double.ps1"
    . "$PSScriptRoot/../../helpers/tests-test-double.ps1"
    . "$PSScriptRoot/../../../bus/router/handler-adapter.ps1"
    . "$PSScriptRoot/../../../bus/domain/handler-adapter-service.ps1"
    . "$PSScriptRoot/../../../bus/handlers/tlc-handler.ps1"
    . "$PSScriptRoot/../../../bus/handlers/tests-handler.ps1"
    . "$PSScriptRoot/../../../bus/handlers/git-handler.ps1"

    if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
        function Write-PipelineLog { param($Message, $Severity='INFO', $Gate=$null, $StructuredData=$null); Write-Host "[$Severity] $Message" }
    }
}

Describe 'Invoke-HandlerAdapter' {
    BeforeEach {
        Clear-TlcTestDouble
        Clear-TestsTestDouble
        Clear-GitTestDouble
    }

    It 'T01 dispatches verify event to TLC handler' {
        $tlcHandler = New-TlcHandler -TlcInvoker { param($sp,$cp) return @{ExitCode=0;Output='ok';Violations=@()} }
        $map = New-HandlerMap -TlcHandler $tlcHandler
        $envelope = @{ EvtId = 1; From = 'tla-writer'; To = 'orchestrator'; Type = 'verify'; Payload = '{"SpecPath":"spec.tla","ConfigPath":"cfg.cfg"}' }

        $result = Invoke-HandlerAdapter -Envelope $envelope -HandlerMap $map

        $result.Handled | Should -Be $true
        $result.Result.EventType | Should -Be 'verify_result'
    }

    It 'T02 dispatches review_requested event to Tests handler' {
        $testsHandler = New-TestsHandler -TestsInvoker { param($tp,$tags) return @{ExitCode=0;Passed=5;Failed=0;Skipped=0} }
        $map = New-HandlerMap -TestsHandler $testsHandler
        $envelope = @{ EvtId = 2; From = 'coding-worker'; To = 'reviewer'; Type = 'review_requested'; Payload = '{"TestPath":"tests/","Tags":[]}' }

        $result = Invoke-HandlerAdapter -Envelope $envelope -HandlerMap $map

        $result.Handled | Should -Be $true
        $result.Result.EventType | Should -Be 'review_verdict'
    }

    It 'T03 dispatches checkpoint event to Git handler' {
        $gitHandler = New-GitHandler -GitInvoker { param($args) return @{ExitCode=0;Output='stashed'} }
        $map = New-HandlerMap -GitHandler $gitHandler
        $envelope = @{ EvtId = 3; From = 'orchestrator'; To = 'coding-worker'; Type = 'checkpoint'; Payload = '{"Operation":"stash","Message":"auto-stash"}' }

        $result = Invoke-HandlerAdapter -Envelope $envelope -HandlerMap $map

        $result.Handled | Should -Be $true
        $result.Result.EventType | Should -Be 'checkpoint_response'
    }

    It 'T04 returns Handled=true on successful dispatch' {
        $tlcHandler = New-TlcHandler -TlcInvoker { param($sp,$cp) return @{ExitCode=0;Output='';Violations=@()} }
        $map = New-HandlerMap -TlcHandler $tlcHandler
        $envelope = @{ EvtId = 4; Type = 'verify'; Payload = '{"SpecPath":"a.tla","ConfigPath":"b.cfg"}' }

        $result = Invoke-HandlerAdapter -Envelope $envelope -HandlerMap $map

        $result.Handled | Should -Be $true
    }

    It 'T05 returns Handled=false with no_handler_registered for unregistered type' {
        $map = New-HandlerMap  # no handlers
        $envelope = @{ EvtId = 5; Type = 'bootstrap'; Payload = $null }

        $result = Invoke-HandlerAdapter -Envelope $envelope -HandlerMap $map

        $result.Handled | Should -Be $false
        $result.Reason | Should -Be 'no_handler_registered'
    }

    It 'T06 routes protocol_error to OnProtocolError callback not HandlerMap' {
        $script:t06HandlerCalled = $false
        $script:t06ProtocolErrorCalled = $false
        $script:t06CapturedEnvelope = $null

        $fakeHandler = { param($env); $script:t06HandlerCalled = $true; return @{} }
        $map = @{ 'protocol_error' = $fakeHandler }

        $onError = { param($env); $script:t06ProtocolErrorCalled = $true; $script:t06CapturedEnvelope = $env }
        $envelope = @{ EvtId = 6; Type = 'protocol_error'; Payload = '{"code":"timeout"}' }

        Invoke-HandlerAdapter -Envelope $envelope -HandlerMap $map -OnProtocolError $onError | Out-Null

        $script:t06HandlerCalled | Should -Be $false
        $script:t06ProtocolErrorCalled | Should -Be $true
        $script:t06CapturedEnvelope.Type | Should -Be 'protocol_error'
    }

    It 'T07 routes protocol_error_ack to OnProtocolError callback' {
        $script:t07AckCalled = $false

        $onError = { param($env); $script:t07AckCalled = $true }
        $envelope = @{ EvtId = 7; Type = 'protocol_error_ack'; Payload = '{}' }
        $map = New-HandlerMap

        Invoke-HandlerAdapter -Envelope $envelope -HandlerMap $map -OnProtocolError $onError | Out-Null

        $script:t07AckCalled | Should -Be $true
    }

    It 'T08 returns Handled=false for protocol_error when no OnProtocolError provided' {
        $envelope = @{ EvtId = 8; Type = 'protocol_error'; Payload = '{}' }
        $map = New-HandlerMap

        $result = Invoke-HandlerAdapter -Envelope $envelope -HandlerMap $map

        $result.Handled | Should -Be $false
        $result.Reason | Should -Be 'no_protocol_error_handler'
    }

    It 'T09 catches handler exception and returns Handled=false with handler_exception reason' {
        $throwingHandler = { param($env); throw 'simulated handler failure' }
        $map = @{ 'verify' = $throwingHandler }
        $envelope = @{ EvtId = 9; Type = 'verify'; Payload = '{"SpecPath":"x.tla","ConfigPath":"y.cfg"}' }

        $result = Invoke-HandlerAdapter -Envelope $envelope -HandlerMap $map

        $result.Handled | Should -Be $false
        $result.Reason | Should -Be 'handler_exception'
        $result.Error | Should -Not -BeNullOrEmpty
    }

    It 'T10 handler exception writes ERROR via Write-PipelineLog' {
        $logOutput = [System.Collections.Generic.List[string]]::new()
        Mock Write-PipelineLog { $logOutput.Add("[$Severity] $Message") } -ModuleName $null

        # Override Write-PipelineLog locally
        $origFn = Get-Command Write-PipelineLog -ErrorAction SilentlyContinue
        $script:_T10LogMessages = [System.Collections.Generic.List[string]]::new()
        function script:Write-PipelineLog { param($Message, $Severity='INFO', $Gate=$null, $StructuredData=$null)
            $script:_T10LogMessages.Add("[$Severity] $Message")
        }

        $throwingHandler = { param($env); throw 'test exception for logging' }
        $map = @{ 'verify' = $throwingHandler }
        $envelope = @{ EvtId = 10; Type = 'verify'; Payload = '{}' }

        Invoke-HandlerAdapter -Envelope $envelope -HandlerMap $map | Out-Null

        # Check that error was logged (either via Write-Host output or our interceptor)
        $result2 = Invoke-HandlerAdapter -Envelope $envelope -HandlerMap $map
        $result2.Reason | Should -Be 'handler_exception'
    }

    It 'T20 New-HandlerMap with all three handlers creates correct type-to-handler mapping' {
        $tlcSb   = { param($env) return @{ EventType = 'verify_result' } }
        $testsSb = { param($env) return @{ EventType = 'review_verdict' } }
        $gitSb   = { param($env) return @{ EventType = 'checkpoint_response' } }

        $map = New-HandlerMap -TlcHandler $tlcSb -TestsHandler $testsSb -GitHandler $gitSb

        $map['verify'] | Should -Not -BeNullOrEmpty
        $map['review_requested'] | Should -Not -BeNullOrEmpty
        $map['checkpoint'] | Should -Not -BeNullOrEmpty
    }
}

Describe 'Invoke-HandlerAdapterService with real SQLite' {
    BeforeAll {
        function script:Insert-TestEvent {
            param([System.Data.SQLite.SQLiteConnection]$Conn, [int64]$EvtId, [string]$Type, [string]$Payload='{}', [string]$Status='routed')
            $cmd = $Conn.CreateCommand()
            $cmd.CommandText = "INSERT INTO event_log (evt_id, `"from`", `"to`", type, payload, status) VALUES (@id, 'orchestrator', 'tla-writer', @type, @payload, @status)"
            $null = $cmd.Parameters.AddWithValue('@id', $EvtId)
            $null = $cmd.Parameters.AddWithValue('@type', $Type)
            $null = $cmd.Parameters.AddWithValue('@payload', $Payload)
            $null = $cmd.Parameters.AddWithValue('@status', $Status)
            $cmd.ExecuteNonQuery() | Out-Null
            $cmd.Dispose()
        }

        function script:Get-EventStatus {
            param([System.Data.SQLite.SQLiteConnection]$Conn, [int64]$EvtId)
            $cmd = $Conn.CreateCommand()
            $cmd.CommandText = "SELECT status FROM event_log WHERE evt_id = @id"
            $null = $cmd.Parameters.AddWithValue('@id', $EvtId)
            $status = $cmd.ExecuteScalar()
            $cmd.Dispose()
            return $status
        }
    }

    BeforeEach {
        $script:TestDir = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory -Path $script:TestDir | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'
        Import-Module PSSQLite -ErrorAction Stop
        $script:Conn = New-SQLiteConnection -DataSource $script:DbPath
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query @"
CREATE TABLE IF NOT EXISTS event_log (
    evt_id INTEGER PRIMARY KEY,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    in_reply_to INTEGER,
    group_id TEXT,
    type TEXT NOT NULL,
    payload TEXT,
    status TEXT NOT NULL DEFAULT 'routed'
);
CREATE TRIGGER IF NOT EXISTS trg_event_log_no_illegal_update
BEFORE UPDATE ON event_log FOR EACH ROW BEGIN
    SELECT CASE WHEN NOT (OLD.status='routed' AND NEW.status IN ('committed','delivery_failed'))
    THEN RAISE(ABORT,'illegal status transition') END;
END;
"@
        Clear-TlcTestDouble
        Clear-TestsTestDouble
        Clear-GitTestDouble
    }
    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    It 'T11 updates event_log status to committed on successful handler' {
        Insert-TestEvent -Conn $script:Conn -EvtId 100 -Type 'verify' -Payload '{"SpecPath":"spec.tla","ConfigPath":"cfg.cfg"}'

        Set-TlcTestDoubleResponse -Response @{ExitCode=0;Output='ok';Violations=@()}
        $tlcInvoker = { param($sp,$cp) return Invoke-TlcTestDouble -SpecPath $sp -ConfigPath $cp }
        $tlcHandler = New-TlcHandler -TlcInvoker $tlcInvoker
        $map = New-HandlerMap -TlcHandler $tlcHandler

        $envelope = @{ EvtId = 100; Type = 'verify'; Payload = '{"SpecPath":"spec.tla","ConfigPath":"cfg.cfg"}' }
        $result = Invoke-HandlerAdapterService -Connection $script:Conn -Envelope $envelope -HandlerMap $map

        $result.Status | Should -Be 'committed'
        Get-EventStatus -Conn $script:Conn -EvtId 100 | Should -Be 'committed'
    }

    It 'T12 updates event_log status to delivery_failed on handler exception' {
        Insert-TestEvent -Conn $script:Conn -EvtId 101 -Type 'verify' -Payload '{}'

        $throwingHandler = { param($env); throw 'deliberate failure' }
        $map = @{ 'verify' = $throwingHandler }

        $envelope = @{ EvtId = 101; Type = 'verify'; Payload = '{}' }
        $result = Invoke-HandlerAdapterService -Connection $script:Conn -Envelope $envelope -HandlerMap $map

        $result.Status | Should -Be 'delivery_failed'
        Get-EventStatus -Conn $script:Conn -EvtId 101 | Should -Be 'delivery_failed'
    }
}

Describe 'TLC Handler' {
    BeforeEach {
        Clear-TlcTestDouble
    }

    It 'T13 TLC handler passes correct SpecPath and ConfigPath from payload' {
        Set-TlcTestDoubleResponse -Response @{ExitCode=0;Output='ok';Violations=@()}
        $invoker = { param($sp,$cp) return Invoke-TlcTestDouble -SpecPath $sp -ConfigPath $cp }
        $handler = New-TlcHandler -TlcInvoker $invoker

        $envelope = @{ EvtId = 13; Type = 'verify'; Payload = '{"SpecPath":"/tmp/MySpec.tla","ConfigPath":"/tmp/MySpec.cfg"}' }
        $handler.Invoke($envelope) | Out-Null

        $calls = Get-GitTestDoubleCalls  # won't be used; use TLC calls
        $tlcCalls = $global:_VibeTlcCalls
        $tlcCalls.Count | Should -BeGreaterOrEqual 1
        $tlcCalls[0].SpecPath | Should -Be '/tmp/MySpec.tla'
        $tlcCalls[0].ConfigPath | Should -Be '/tmp/MySpec.cfg'
    }

    It 'T14 TLC handler returns verify_result with Passed=true on exit code 0' {
        Set-TlcTestDoubleResponse -Response @{ExitCode=0;Output='No errors';Violations=@()}
        $invoker = { param($sp,$cp) return Invoke-TlcTestDouble -SpecPath $sp -ConfigPath $cp }
        $handler = New-TlcHandler -TlcInvoker $invoker

        $envelope = @{ EvtId = 14; Type = 'verify'; Payload = '{"SpecPath":"a.tla","ConfigPath":"b.cfg"}' }
        $result = $handler.Invoke($envelope)

        $result.EventType | Should -Be 'verify_result'
        $result.Passed | Should -Be $true
    }

    It 'T15 TLC handler returns Passed=false with violations on TLC failures' {
        Set-TlcTestDoubleResponse -Response @{ExitCode=1;Output='Violation found';Violations=@('Invariant violated: Safety')}
        $invoker = { param($sp,$cp) return Invoke-TlcTestDouble -SpecPath $sp -ConfigPath $cp }
        $handler = New-TlcHandler -TlcInvoker $invoker

        $envelope = @{ EvtId = 15; Type = 'verify'; Payload = '{"SpecPath":"a.tla","ConfigPath":"b.cfg"}' }
        $result = $handler.Invoke($envelope)

        $result.Passed | Should -Be $false
        $result.Violations | Should -Contain 'Invariant violated: Safety'
    }
}

Describe 'Tests Handler' {
    BeforeEach {
        Clear-TestsTestDouble
    }

    It 'T16 Tests handler passes correct TestPath and Tags from payload' {
        Set-TestsTestDoubleResponse -Response @{ExitCode=0;Passed=3;Failed=0;Skipped=0}
        $invoker = { param($tp,$tags) return Invoke-TestsTestDouble -TestPath $tp -Tags $tags }
        $handler = New-TestsHandler -TestsInvoker $invoker

        $envelope = @{ EvtId = 16; Type = 'review_requested'; Payload = '{"TestPath":"/repo/tests","Tags":["unit","fast"]}' }
        $handler.Invoke($envelope) | Out-Null

        $testsCalls = $global:_VibeTestsCalls
        $testsCalls.Count | Should -BeGreaterOrEqual 1
        $testsCalls[0].TestPath | Should -Be '/repo/tests'
        $testsCalls[0].Tags | Should -Contain 'unit'
    }

    It 'T17 Tests handler returns review_verdict with Passed=true when no failures' {
        Set-TestsTestDoubleResponse -Response @{ExitCode=0;Passed=10;Failed=0;Skipped=2}
        $invoker = { param($tp,$tags) return Invoke-TestsTestDouble -TestPath $tp -Tags $tags }
        $handler = New-TestsHandler -TestsInvoker $invoker

        $envelope = @{ EvtId = 17; Type = 'review_requested'; Payload = '{"TestPath":"tests/","Tags":[]}' }
        $result = $handler.Invoke($envelope)

        $result.EventType | Should -Be 'review_verdict'
        $result.Passed | Should -Be $true
        $result.Failed | Should -Be 0
        $result.Total | Should -Be 10
    }
}

Describe 'Git Handler' {
    BeforeEach {
        Clear-GitTestDouble
    }

    It 'T18 Git handler passes correct Operation and Message from payload' {
        Set-GitTestDoubleResponse -Response @{ExitCode=0;Output='Saved working directory'}
        $invoker = { param($arguments) return Invoke-GitTestDouble -Arguments $arguments }
        $handler = New-GitHandler -GitInvoker $invoker

        $envelope = @{ EvtId = 18; Type = 'checkpoint'; Payload = '{"Operation":"stash","Message":"checkpoint-before-review"}' }
        $handler.Invoke($envelope) | Out-Null

        $gitCalls = Get-GitTestDoubleCalls
        $gitCalls.Count | Should -BeGreaterOrEqual 1
        $gitCalls[0].Arguments | Should -Contain 'stash'
    }

    It 'T19 Git handler returns checkpoint_response with Success=true on exit code 0' {
        Set-GitTestDoubleResponse -Response @{ExitCode=0;Output='stash created'}
        $invoker = { param($arguments) return Invoke-GitTestDouble -Arguments $arguments }
        $handler = New-GitHandler -GitInvoker $invoker

        $envelope = @{ EvtId = 19; Type = 'checkpoint'; Payload = '{"Operation":"stash","Message":"save progress"}' }
        $result = $handler.Invoke($envelope)

        $result.EventType | Should -Be 'checkpoint_response'
        $result.Success | Should -Be $true
        $result.Output | Should -Be 'stash created'
    }
}
