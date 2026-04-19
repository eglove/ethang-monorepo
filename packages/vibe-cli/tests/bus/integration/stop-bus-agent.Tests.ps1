BeforeAll {
    Import-Module PSSQLite -ErrorAction SilentlyContinue
    # $PSScriptRoot = .../tests/bus/integration  -> go 3 levels up to package root, then into bus/
    $script:PkgRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../../')).Path
    $busRoot = Join-Path $script:PkgRoot 'bus'
    . (Join-Path $busRoot 'infra/evt-id-allocator.ps1')
    . (Join-Path $busRoot 'domain/agent-session.ps1')
    . (Join-Path $busRoot 'domain/bus-lifecycle.ps1')
    . (Join-Path $busRoot 'router/agent-lifecycle.ps1')

    if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
        function global:Write-PipelineLog { param($Message, $Severity='INFO', $Gate=$null, $StructuredData=$null) }
    }

    function global:_StartTestAgent {
        param([string]$Name = 'test-agent', [string]$Role = 'coding-worker')
        $mockLaunch = { param($n,$r,$p,$w) return @{ ProcessId = 42; Process = $null } }
        return Start-BusAgent -Connection $script:Conn -AgentName $Name -Role $Role -SystemPrompt 'test' -LaunchAgent $mockLaunch
    }

    function global:_SetupTestDb {
        $testDir = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory -Path $testDir | Out-Null
        $dbPath = Join-Path $testDir 'vibe-bus.db'
        $conn = New-SQLiteConnection -DataSource $dbPath
        $schemaPath = Join-Path $script:PkgRoot 'bus/schema/agent-sessions.sql'
        $schemaSql = Get-Content $schemaPath -Raw
        Invoke-SqliteQuery -SQLiteConnection $conn -Query $schemaSql
        return @{ Dir = $testDir; Conn = $conn }
    }
}

Describe 'Stop-BusAgent' {
    BeforeEach {
        $db = _SetupTestDb
        $script:TestDir = $db.Dir
        $script:Conn = $db.Conn
        Initialize-EvtIdAllocator -StartValue 1
        Reset-AgentLifecycleState
        [QueueDepthStore]::Reset() | Out-Null
    }

    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    It 'T01: transitions agent_session status through dead to ended' {
        $startResult = _StartTestAgent -Name 'agent-1'
        $sessionId = $startResult.SessionId

        $stopResult = Stop-BusAgent -Connection $script:Conn -AgentName 'agent-1'

        $row = Get-AgentSession -Connection $script:Conn -SessionId $sessionId
        $row.status | Should -Be 'ended'
        $stopResult | Should -Not -BeNullOrEmpty
    }

    It 'T02: removes agent from _ActiveAgents' {
        _StartTestAgent -Name 'agent-2' | Out-Null

        Stop-BusAgent -Connection $script:Conn -AgentName 'agent-2' | Out-Null

        { Stop-BusAgent -Connection $script:Conn -AgentName 'agent-2' } | Should -Throw -ExpectedMessage '*AgentNotFound*'
    }

    It 'T03: completes the BlockingCollection after stop so enqueue throws' {
        _StartTestAgent -Name 'agent-3' | Out-Null

        Stop-BusAgent -Connection $script:Conn -AgentName 'agent-3' | Out-Null

        { Invoke-EnqueueAgentMessage -AgentName 'agent-3' -Message 'hello' } | Should -Throw
    }

    It 'T04: returns correct hashtable with AgentName, SessionId, DeathEpoch' {
        $startResult = _StartTestAgent -Name 'agent-4'
        $sessionId = $startResult.SessionId

        $result = Stop-BusAgent -Connection $script:Conn -AgentName 'agent-4'

        $result.AgentName | Should -Be 'agent-4'
        $result.SessionId | Should -Be $sessionId
        $result.DeathEpoch | Should -BeGreaterThan 0
    }

    It 'T05: throws AgentNotFound for unknown agent name' {
        { Stop-BusAgent -Connection $script:Conn -AgentName 'nonexistent-agent' } | Should -Throw -ExpectedMessage '*AgentNotFound*'
    }

    It 'T06: -Graceful drains queue before marking dead (3 messages enqueued, all drained)' {
        _StartTestAgent -Name 'agent-6' | Out-Null
        Invoke-EnqueueAgentMessage -AgentName 'agent-6' -Message 'msg1' | Out-Null
        Invoke-EnqueueAgentMessage -AgentName 'agent-6' -Message 'msg2' | Out-Null
        Invoke-EnqueueAgentMessage -AgentName 'agent-6' -Message 'msg3' | Out-Null

        $depthBefore = Get-BackpressureQueueDepth
        $depthBefore | Should -BeGreaterOrEqual 3

        Stop-BusAgent -Connection $script:Conn -AgentName 'agent-6' -Graceful -DrainTimeoutMs 5000 | Out-Null

        Get-BackpressureQueueDepth | Should -BeLessOrEqual 0
    }

    It 'T07: calls $KillProcess injectable when provided' {
        _StartTestAgent -Name 'agent-7' | Out-Null
        $killCalled = @{ Called = $false; Name = $null }
        $killScript = { param($n) $killCalled.Called = $true; $killCalled.Name = $n }

        Stop-BusAgent -Connection $script:Conn -AgentName 'agent-7' -KillProcess $killScript | Out-Null

        $killCalled.Called | Should -Be $true
        $killCalled.Name | Should -Be 'agent-7'
    }

    It 'T08: does NOT call $KillProcess when not provided' {
        _StartTestAgent -Name 'agent-8' | Out-Null
        $killCalled = @{ Called = $false }

        { Stop-BusAgent -Connection $script:Conn -AgentName 'agent-8' } | Should -Not -Throw

        $killCalled.Called | Should -Be $false
    }

    It 'T12: after Stop-BusAgent, Invoke-EnqueueAgentMessage throws' {
        _StartTestAgent -Name 'agent-12' | Out-Null

        Stop-BusAgent -Connection $script:Conn -AgentName 'agent-12' | Out-Null

        { Invoke-EnqueueAgentMessage -AgentName 'agent-12' -Message 'late-msg' } | Should -Throw
    }

    It 'T13: custom $DeathEpoch is stored exactly and returned' {
        _StartTestAgent -Name 'agent-13b' | Out-Null
        $customEpoch = 9999999999999

        $result = Stop-BusAgent -Connection $script:Conn -AgentName 'agent-13b' -DeathEpoch $customEpoch

        $result.DeathEpoch | Should -Be $customEpoch
    }
}

Describe 'Stop-AllBusAgents' {
    BeforeEach {
        $db = _SetupTestDb
        $script:TestDir = $db.Dir
        $script:Conn = $db.Conn
        Initialize-EvtIdAllocator -StartValue 1
        Reset-AgentLifecycleState
        [QueueDepthStore]::Reset() | Out-Null
    }

    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    It 'T09: stops all active agents' {
        _StartTestAgent -Name 'multi-1' -Role 'worker' | Out-Null
        _StartTestAgent -Name 'multi-2' -Role 'worker' | Out-Null
        _StartTestAgent -Name 'multi-3' -Role 'worker' | Out-Null

        $result = Stop-AllBusAgents -Connection $script:Conn

        $result.StoppedCount | Should -Be 3
        { Stop-BusAgent -Connection $script:Conn -AgentName 'multi-1' } | Should -Throw
        { Stop-BusAgent -Connection $script:Conn -AgentName 'multi-2' } | Should -Throw
        { Stop-BusAgent -Connection $script:Conn -AgentName 'multi-3' } | Should -Throw
    }

    It 'T10: returns correct StoppedCount and Agents list' {
        _StartTestAgent -Name 'count-1' -Role 'worker' | Out-Null
        _StartTestAgent -Name 'count-2' -Role 'worker' | Out-Null

        $result = Stop-AllBusAgents -Connection $script:Conn

        $result.StoppedCount | Should -Be 2
        $result.Agents | Should -HaveCount 2
    }

    It 'T11: handles empty _ActiveAgents gracefully (StoppedCount = 0)' {
        $result = Stop-AllBusAgents -Connection $script:Conn

        $result.StoppedCount | Should -Be 0
        $result.Agents | Should -HaveCount 0
    }

    It 'T14: -Graceful drains all queues before stopping' {
        _StartTestAgent -Name 'grace-1' | Out-Null
        _StartTestAgent -Name 'grace-2' | Out-Null
        Invoke-EnqueueAgentMessage -AgentName 'grace-1' -Message 'a' | Out-Null
        Invoke-EnqueueAgentMessage -AgentName 'grace-2' -Message 'b' | Out-Null

        Stop-AllBusAgents -Connection $script:Conn -Graceful -DrainTimeoutMs 5000 | Out-Null

        Get-BackpressureQueueDepth | Should -BeLessOrEqual 0
    }

    It 'T15: after Stop-AllBusAgents, _ActiveAgents is empty' {
        _StartTestAgent -Name 'empty-1' | Out-Null
        _StartTestAgent -Name 'empty-2' | Out-Null

        Stop-AllBusAgents -Connection $script:Conn | Out-Null

        { Stop-BusAgent -Connection $script:Conn -AgentName 'empty-1' } | Should -Throw -ExpectedMessage '*AgentNotFound*'
        { Stop-BusAgent -Connection $script:Conn -AgentName 'empty-2' } | Should -Throw -ExpectedMessage '*AgentNotFound*'
    }
}
