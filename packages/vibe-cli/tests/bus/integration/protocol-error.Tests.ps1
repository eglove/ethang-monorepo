BeforeAll {
    Import-Module PSSQLite -ErrorAction SilentlyContinue
    # Define tracking Write-PipelineLog BEFORE dot-sourcing so protocol-error.ps1 picks it up
    function global:Write-PipelineLog { param($Message,$Severity='INFO',$Gate=$null,$StructuredData=$null); $script:LogCalls += @{Message=$Message;Severity=$Severity} }
    $busRoot = (Get-Item (Join-Path $PSScriptRoot "..\..\..")).FullName
    $busInfra = Join-Path $busRoot "bus\infra\evt-id-allocator.ps1"
    $busProtocolError = Join-Path $busRoot "bus\router\protocol-error.ps1"
    . $busInfra
    . $busProtocolError
}

Describe "Protocol Error Recovery Integration" {
    BeforeEach {
        $script:LogCalls = @()
        $script:TestDir = Join-Path $env:TEMP "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory $script:TestDir | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'
        $script:Conn = New-SQLiteConnection -DataSource $script:DbPath
        $busRoot2 = (Get-Item (Join-Path $PSScriptRoot "..\..\..")).FullName
        $sqlPath = Join-Path $busRoot2 "bus\schema\event-log.sql"
        $sql = Get-Content $sqlPath -Raw
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $sql
        Initialize-EvtIdAllocator -StartValue 1
        Reset-RouterState
        Reset-ProtocolErrorState
    }

    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    Context "New-ProtocolError" {
        It "returns hashtable with correct Code, Message, and Timestamp" {
            $err = New-ProtocolError -Code 'acl_violation' -Message 'ACL check failed'
            $err | Should -Not -BeNullOrEmpty
            $err.Code | Should -Be 'acl_violation'
            $err.Message | Should -Be 'ACL check failed'
            $err.Timestamp | Should -Not -BeNullOrEmpty
            $err.Timestamp | Should -BeOfType [DateTime]
        }

        It "returns hashtable with AffectedAgentName, OriginalEvtId, Context" {
            $ctx = @{ Detail = 'extra' }
            $err = New-ProtocolError -Code 'agent_not_found' -Message 'Agent missing' -AffectedAgentName 'tla-writer' -OriginalEvtId 42 -Context $ctx
            $err.AffectedAgentName | Should -Be 'tla-writer'
            $err.OriginalEvtId | Should -Be 42
            $err.Context.Detail | Should -Be 'extra'
        }

        It "throws UnknownProtocolErrorCode for unknown code" {
            { New-ProtocolError -Code 'totally_made_up' -Message 'bad' } | Should -Throw -ExpectedMessage '*UnknownProtocolErrorCode*'
        }
    }

    Context "Get-ProtocolErrorCodes" {
        It "returns all 10 codes" {
            $codes = Get-ProtocolErrorCodes
            $codes | Should -Not -BeNullOrEmpty
            $codes.Count | Should -Be 10
        }

        It "contains all expected code keys" {
            $codes = Get-ProtocolErrorCodes
            $codes.ContainsKey('UnknownEventType') | Should -BeTrue
            $codes.ContainsKey('AclViolation') | Should -BeTrue
            $codes.ContainsKey('MissingExplicitTarget') | Should -BeTrue
            $codes.ContainsKey('AgentNotFound') | Should -BeTrue
            $codes.ContainsKey('DeadAgentReceived') | Should -BeTrue
            $codes.ContainsKey('Inv9Violation') | Should -BeTrue
            $codes.ContainsKey('LockHierarchyViolation') | Should -BeTrue
            $codes.ContainsKey('BusHalted') | Should -BeTrue
            $codes.ContainsKey('HandlerException') | Should -BeTrue
            $codes.ContainsKey('DeliveryFailed') | Should -BeTrue
        }
    }

    Context "Test-IsKnownProtocolErrorCode" {
        It "returns true for a known code value" {
            $result = Test-IsKnownProtocolErrorCode -Code 'acl_violation'
            $result | Should -BeTrue
        }

        It "returns false for an unknown code value" {
            $result = Test-IsKnownProtocolErrorCode -Code 'totally_made_up'
            $result | Should -BeFalse
        }
    }

    Context "Send-ProtocolError" {
        It "inserts a protocol_error row in event_log" {
            $err = New-ProtocolError -Code 'acl_violation' -Message 'ACL failed'
            $result = Send-ProtocolError -Connection $script:Conn -ProtocolError $err
            $result | Should -Not -BeNullOrEmpty
            $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT * FROM event_log WHERE type='protocol_error'" | Select-Object -First 1
            $row | Should -Not -BeNullOrEmpty
        }

        It "stores JSON-encoded error as payload" {
            $err = New-ProtocolError -Code 'bus_halted' -Message 'Bus is halted'
            Send-ProtocolError -Connection $script:Conn -ProtocolError $err | Out-Null
            $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT payload FROM event_log WHERE type='protocol_error'" | Select-Object -First 1
            $row.payload | Should -Not -BeNullOrEmpty
            $parsed = $row.payload | ConvertFrom-Json
            $parsed.Code | Should -Be 'bus_halted'
            $parsed.Message | Should -Be 'Bus is halted'
        }

        It "uses from='orchestrator' always" {
            $err = New-ProtocolError -Code 'delivery_failed' -Message 'Delivery failed'
            Send-ProtocolError -Connection $script:Conn -ProtocolError $err | Out-Null
            $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT [from] FROM event_log WHERE type='protocol_error'" | Select-Object -First 1
            $row.from | Should -Be 'orchestrator'
        }

        It "uses AffectedAgent as to when provided" {
            $err = New-ProtocolError -Code 'agent_not_found' -Message 'Missing agent'
            Send-ProtocolError -Connection $script:Conn -ProtocolError $err -AffectedAgent 'tla-writer' | Out-Null
            $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT [to] FROM event_log WHERE type='protocol_error'" | Select-Object -First 1
            $row.to | Should -Be 'tla-writer'
        }

        It "uses to='broadcast' when AffectedAgent is not provided" {
            $err = New-ProtocolError -Code 'unknown_event_type' -Message 'Unknown type'
            Send-ProtocolError -Connection $script:Conn -ProtocolError $err | Out-Null
            $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT [to] FROM event_log WHERE type='protocol_error'" | Select-Object -First 1
            $row.to | Should -Be 'broadcast'
        }
    }

    Context "Send-ProtocolErrorAck" {
        It "inserts a protocol_error_ack row" {
            $err = New-ProtocolError -Code 'acl_violation' -Message 'ACL failed'
            $sendResult = Send-ProtocolError -Connection $script:Conn -ProtocolError $err
            $ackResult = Send-ProtocolErrorAck -Connection $script:Conn -FromAgent 'tla-writer' -OriginalEvtId $sendResult.EvtId
            $ackResult | Should -Not -BeNullOrEmpty
            $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT * FROM event_log WHERE type='protocol_error_ack'" | Select-Object -First 1
            $row | Should -Not -BeNullOrEmpty
        }

        It "sets in_reply_to to the original protocol_error evt_id" {
            $err = New-ProtocolError -Code 'handler_exception' -Message 'Handler failed'
            $sendResult = Send-ProtocolError -Connection $script:Conn -ProtocolError $err
            Send-ProtocolErrorAck -Connection $script:Conn -FromAgent 'coding-worker' -OriginalEvtId $sendResult.EvtId | Out-Null
            $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT in_reply_to FROM event_log WHERE type='protocol_error_ack'" | Select-Object -First 1
            $row.in_reply_to | Should -Be $sendResult.EvtId
        }
    }

    Context "Invoke-ProtocolErrorRecovery" {
        It "sends the protocol_error event" {
            $err = New-ProtocolError -Code 'inv9_violation' -Message 'INV9 violated'
            $result = Invoke-ProtocolErrorRecovery -Connection $script:Conn -ProtocolError $err
            $result | Should -Not -BeNullOrEmpty
            $result.SentEvtId | Should -BeGreaterThan 0
            $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT * FROM event_log WHERE type='protocol_error'" | Select-Object -First 1
            $row | Should -Not -BeNullOrEmpty
        }

        It "emits ALARM via Write-PipelineLog" {
            $err = New-ProtocolError -Code 'lock_hierarchy_violation' -Message 'Lock violated'
            Invoke-ProtocolErrorRecovery -Connection $script:Conn -ProtocolError $err | Out-Null
            $alarmCalls = @($script:LogCalls | Where-Object { $_.Severity -eq 'ALARM' })
            $alarmCalls | Should -Not -BeNullOrEmpty
            $alarmCalls[0].Message | Should -Match 'lock_hierarchy_violation'
        }

        It "calls OnHalt injectable when -ShouldHalt is set" {
            $err = New-ProtocolError -Code 'bus_halted' -Message 'Bus halted'
            $script:haltCalled = $false
            $script:haltCode = $null
            $onHalt = { param($code); $script:haltCalled = $true; $script:haltCode = $code }
            Invoke-ProtocolErrorRecovery -Connection $script:Conn -ProtocolError $err -ShouldHalt -OnHalt $onHalt | Out-Null
            $script:haltCalled | Should -BeTrue
            $script:haltCode | Should -Be 'bus_halted'
        }

        It "does NOT call OnHalt when -ShouldHalt is not set" {
            $err = New-ProtocolError -Code 'delivery_failed' -Message 'Delivery failed'
            $script:haltCalled = $false
            $onHalt = { param($code); $script:haltCalled = $true }
            Invoke-ProtocolErrorRecovery -Connection $script:Conn -ProtocolError $err -OnHalt $onHalt | Out-Null
            $script:haltCalled | Should -BeFalse
        }

        It "returns Halted=true when -ShouldHalt is set" {
            $err = New-ProtocolError -Code 'agent_not_found' -Message 'Agent not found'
            $onHalt = { param($code) }
            $result = Invoke-ProtocolErrorRecovery -Connection $script:Conn -ProtocolError $err -ShouldHalt -OnHalt $onHalt
            $result.Halted | Should -BeTrue
        }

        It "returns Halted=false when -ShouldHalt is not set" {
            $err = New-ProtocolError -Code 'missing_explicit_target' -Message 'No target'
            $result = Invoke-ProtocolErrorRecovery -Connection $script:Conn -ProtocolError $err
            $result.Halted | Should -BeFalse
        }
    }
}
