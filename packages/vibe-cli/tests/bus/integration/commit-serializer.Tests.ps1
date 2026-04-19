BeforeAll {
    Import-Module PSSQLite -ErrorAction SilentlyContinue
    . "$PSScriptRoot/../../../bus/infra/evt-id-allocator.ps1"
    . "$PSScriptRoot/../../../bus/infra/working-tree-coordinator.ps1"
    . "$PSScriptRoot/../../../bus/domain/agent-session.ps1"
    . "$PSScriptRoot/../../../bus/domain/bus-lifecycle.ps1"
    . "$PSScriptRoot/../../../bus/domain/write-session.ps1"
    . "$PSScriptRoot/../../../bus/router/commit-serializer.ps1"
    . "$PSScriptRoot/../../../bus/domain/crash-coordination-service.ps1"
    if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
        function global:Write-PipelineLog { param($Message,$Severity='INFO',$Gate=$null,$StructuredData=$null) }
    }

    function global:_MakeDb {
        $testDir = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory $testDir | Out-Null
        $dbPath = Join-Path $testDir 'vibe-bus.db'
        $conn = New-SQLiteConnection -DataSource $dbPath
        $eventLogSql = Get-Content "$PSScriptRoot/../../../bus/schema/event-log.sql" -Raw
        $agentSql = Get-Content "$PSScriptRoot/../../../bus/schema/agent-sessions.sql" -Raw
        Invoke-SqliteQuery -SQLiteConnection $conn -Query $eventLogSql
        Invoke-SqliteQuery -SQLiteConnection $conn -Query $agentSql
        return @{ Conn = $conn; Dir = $testDir }
    }

    function global:_TearDownDb {
        param($DbCtx)
        if ($DbCtx.Conn) { $DbCtx.Conn.Close() }
        Remove-Item -Recurse -Force $DbCtx.Dir -ErrorAction SilentlyContinue
    }

    function global:_InsertTestEvent {
        param($Conn, [string]$From='orchestrator',[string]$To='tla-writer',[string]$Type='done')
        $cmd = $Conn.CreateCommand()
        $cmd.CommandText = "INSERT INTO event_log (""from"",""to"",type,status) VALUES ('$From','$To','$Type','routed')"
        $cmd.ExecuteNonQuery() | Out-Null
        $r = $Conn.CreateCommand(); $r.CommandText='SELECT last_insert_rowid()'; $id=[int64]$r.ExecuteScalar(); $r.Dispose(); $cmd.Dispose()
        return $id
    }

    function global:_InsertTestAgentSession {
        param($Conn, [string]$SessionId,[string]$AgentName='test-agent',[string]$Role='worker',[string]$Status='alive')
        Invoke-SqliteQuery -SQLiteConnection $Conn -Query "INSERT INTO agent_sessions (session_id,agent_name,role,status) VALUES ('$SessionId','$AgentName','$Role','$Status')"
    }
}

Describe 'WriteSession Entity' {
    BeforeEach {
        $script:DbCtx = _MakeDb
        $script:Conn = $script:DbCtx.Conn
        Initialize-EvtIdAllocator -StartValue 1
        Reset-WriteSessionState
        Reset-CommitSerializerState
    }
    AfterEach {
        _TearDownDb -DbCtx $script:DbCtx
    }

    It 'T01: Start-WriteSession returns session with Status=Acquired' {
        $session = Start-WriteSession -WorktreeLeaf 'wt-t01'
        $session | Should -Not -BeNullOrEmpty
        $session.Status | Should -Be 'Acquired'
        $session.WorktreeLeaf | Should -Be 'wt-t01'
        $session.SessionId | Should -Not -BeNullOrEmpty
        Complete-WriteSession -SessionId $session.SessionId
    }

    It 'T02: Start-WriteSession sets VIBE_BUS_COMMIT_IN_PROGRESS env var' {
        $session = Start-WriteSession -WorktreeLeaf 'wt-t02'
        $env:VIBE_BUS_COMMIT_IN_PROGRESS | Should -Be '1'
        Complete-WriteSession -SessionId $session.SessionId
    }

    It 'T03: Complete-WriteSession sets Status=Committed and unsets env var' {
        $session = Start-WriteSession -WorktreeLeaf 'wt-t03'
        Complete-WriteSession -SessionId $session.SessionId
        $env:VIBE_BUS_COMMIT_IN_PROGRESS | Should -BeNullOrEmpty
        $retrieved = Get-WriteSession -SessionId $session.SessionId
        $retrieved | Should -BeNullOrEmpty
    }

    It 'T04: Fail-WriteSession sets Status=Failed and unsets env var' {
        $session = Start-WriteSession -WorktreeLeaf 'wt-t04'
        Fail-WriteSession -SessionId $session.SessionId -Reason 'test failure'
        $env:VIBE_BUS_COMMIT_IN_PROGRESS | Should -BeNullOrEmpty
        $retrieved = Get-WriteSession -SessionId $session.SessionId
        $retrieved | Should -BeNullOrEmpty
    }

    It 'T05: Recover-WriteSession unsets env var and sets Status=Released' {
        $session = Start-WriteSession -WorktreeLeaf 'wt-t05'
        $env:VIBE_BUS_COMMIT_IN_PROGRESS | Should -Be '1'
        Recover-WriteSession -SessionId $session.SessionId
        $env:VIBE_BUS_COMMIT_IN_PROGRESS | Should -BeNullOrEmpty
        $retrieved = Get-WriteSession -SessionId $session.SessionId
        $retrieved | Should -BeNullOrEmpty
    }

    It 'T06: Start-WriteSession throws WriteSessionStarvation when mutex cannot be acquired' {
        # Use a background job to hold the mutex from a different process (cross-process named mutex)
        $mutexName = 'VibeBus-Commit-starvation-t06'
        $job = Start-Job -ScriptBlock {
            param($name)
            $m = [System.Threading.Mutex]::new($true, $name)  # request initial ownership
            Start-Sleep -Seconds 10  # hold for 10s
            $m.ReleaseMutex()
            $m.Dispose()
        } -ArgumentList $mutexName
        # Give job time to acquire the mutex
        Start-Sleep -Milliseconds 200
        try {
            { Start-WriteSession -WorktreeLeaf 'starvation-t06' -MaxAcquireAttempts 2 -InitialBackoffMs 1 } | Should -Throw '*WriteSessionStarvation*'
        } finally {
            Stop-Job $job -ErrorAction SilentlyContinue
            Remove-Job $job -Force -ErrorAction SilentlyContinue
        }
    }

    It 'T20: Get-WriteSession returns null after Complete-WriteSession' {
        $session = Start-WriteSession -WorktreeLeaf 'wt-t20'
        $sessionId = $session.SessionId
        Get-WriteSession -SessionId $sessionId | Should -Not -BeNullOrEmpty
        Complete-WriteSession -SessionId $sessionId
        Get-WriteSession -SessionId $sessionId | Should -BeNullOrEmpty
    }
}

Describe 'CommitSerializer Aggregate' {
    BeforeEach {
        $script:DbCtx = _MakeDb
        $script:Conn = $script:DbCtx.Conn
        Initialize-EvtIdAllocator -StartValue 1
        Reset-WriteSessionState
        Reset-CommitSerializerState
    }
    AfterEach {
        _TearDownDb -DbCtx $script:DbCtx
    }

    It 'T07: Invoke-BusCommit updates event_log status to committed' {
        $evtId = _InsertTestEvent -Conn $script:Conn
        Invoke-BusCommit -Connection $script:Conn -WorktreeLeaf 'wt-t07' -EvtId $evtId -CommitMessage 'test commit'
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT status FROM event_log WHERE evt_id=$evtId"
        $row.status | Should -Be 'committed'
    }

    It 'T08: Invoke-BusCommit calls Invoke-GitCommit on the coordinator (inject mock coordinator)' {
        $evtId = _InsertTestEvent -Conn $script:Conn
        $mockCoordinator = New-WorkingTreeCoordinator -WorktreeLeaf 'wt-t08'
        Invoke-BusCommit -Connection $script:Conn -WorktreeLeaf 'wt-t08' -EvtId $evtId -CommitMessage 'test commit' -Coordinator $mockCoordinator
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT status FROM event_log WHERE evt_id=$evtId"
        $row.status | Should -Be 'committed'
    }

    It 'T09: Invoke-BusCommit calls Start-WriteSession and Complete-WriteSession (env var unset after)' {
        $evtId = _InsertTestEvent -Conn $script:Conn
        Invoke-BusCommit -Connection $script:Conn -WorktreeLeaf 'wt-t09' -EvtId $evtId -CommitMessage 'test commit'
        $env:VIBE_BUS_COMMIT_IN_PROGRESS | Should -BeNullOrEmpty
    }

    It 'T10: Invoke-BusCommit throws on InvCommitOrdering violation (same evt_id twice)' {
        $evtId = _InsertTestEvent -Conn $script:Conn
        Invoke-BusCommit -Connection $script:Conn -WorktreeLeaf 'wt-t10' -EvtId $evtId -CommitMessage 'first commit'
        { Invoke-BusCommit -Connection $script:Conn -WorktreeLeaf 'wt-t10' -EvtId $evtId -CommitMessage 'duplicate commit' } | Should -Throw '*InvCommitOrdering*'
    }

    It 'T11: Invoke-BusCommit with git failure calls Fail-WriteSession (env var unset after failure)' {
        $evtId = _InsertTestEvent -Conn $script:Conn
        # Use Pester Mock to intercept Invoke-GitCommit and throw
        Mock -CommandName Invoke-GitCommit -MockWith { throw 'git commit failed' }
        { Invoke-BusCommit -Connection $script:Conn -WorktreeLeaf 'wt-t11' -EvtId $evtId -CommitMessage 'test commit' } | Should -Throw
        $env:VIBE_BUS_COMMIT_IN_PROGRESS | Should -BeNullOrEmpty
    }

    It 'T12: Reset-CommitSerializerState resets LastCommittedEvtId to 0' {
        $evtId = _InsertTestEvent -Conn $script:Conn
        Invoke-BusCommit -Connection $script:Conn -WorktreeLeaf 'wt-t12' -EvtId $evtId -CommitMessage 'test commit'
        Get-LastCommittedEvtId | Should -BeGreaterThan 0
        Reset-CommitSerializerState
        Get-LastCommittedEvtId | Should -Be 0
    }

    It 'T19: Invoke-BusCommit returns @{ Status = committed } on success' {
        $evtId = _InsertTestEvent -Conn $script:Conn
        $result = Invoke-BusCommit -Connection $script:Conn -WorktreeLeaf 'wt-t19' -EvtId $evtId -CommitMessage 'test commit'
        $result | Should -Not -BeNullOrEmpty
        $result.Status | Should -Be 'committed'
        $result.EvtId | Should -Be $evtId
    }
}

Describe 'CrashCoordinationDomainService' {
    BeforeEach {
        $script:DbCtx = _MakeDb
        $script:Conn = $script:DbCtx.Conn
        Initialize-EvtIdAllocator -StartValue 1
        Reset-WriteSessionState
        Reset-CommitSerializerState
    }
    AfterEach {
        _TearDownDb -DbCtx $script:DbCtx
    }

    It 'T13: Invoke-BusCrashCoordination marks session as dead then ended in DB' {
        $sessionId = [guid]::NewGuid().ToString()
        _InsertTestAgentSession -Conn $script:Conn -SessionId $sessionId -Status 'alive'
        Invoke-BusCrashCoordination -Connection $script:Conn -AgentName 'test-agent' -SessionId $sessionId -DeathEpoch 12345
        $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT status FROM agent_sessions WHERE session_id='$sessionId'"
        $row.status | Should -Be 'ended'
    }

    It 'T14: Invoke-BusCrashCoordination calls OnHandlerCleanup injectable' {
        $sessionId = [guid]::NewGuid().ToString()
        _InsertTestAgentSession -Conn $script:Conn -SessionId $sessionId -Status 'alive'
        $script:handlerCleanupCalled = $false
        $script:handlerCleanupAgent = $null
        $onHandlerCleanup = { param($AgentName); $script:handlerCleanupCalled = $true; $script:handlerCleanupAgent = $AgentName }
        Invoke-BusCrashCoordination -Connection $script:Conn -AgentName 'test-agent' -SessionId $sessionId -DeathEpoch 12345 -OnHandlerCleanup $onHandlerCleanup
        $script:handlerCleanupCalled | Should -Be $true
        $script:handlerCleanupAgent | Should -Be 'test-agent'
    }

    It 'T15: Invoke-BusCrashCoordination calls OnCommitCleanup injectable' {
        $sessionId = [guid]::NewGuid().ToString()
        _InsertTestAgentSession -Conn $script:Conn -SessionId $sessionId -Status 'alive'
        $script:commitCleanupCalled = $false
        $script:commitCleanupAgent = $null
        $onCommitCleanup = { param($AgentName); $script:commitCleanupCalled = $true; $script:commitCleanupAgent = $AgentName }
        Invoke-BusCrashCoordination -Connection $script:Conn -AgentName 'test-agent' -SessionId $sessionId -DeathEpoch 12345 -OnCommitCleanup $onCommitCleanup
        $script:commitCleanupCalled | Should -Be $true
        $script:commitCleanupAgent | Should -Be 'test-agent'
    }

    It 'T16: Invoke-BusCrashCoordination returns @{ Coordinated = true }' {
        $sessionId = [guid]::NewGuid().ToString()
        _InsertTestAgentSession -Conn $script:Conn -SessionId $sessionId -Status 'alive'
        $result = Invoke-BusCrashCoordination -Connection $script:Conn -AgentName 'test-agent' -SessionId $sessionId -DeathEpoch 12345
        $result | Should -Not -BeNullOrEmpty
        $result.Coordinated | Should -Be $true
        $result.AgentName | Should -Be 'test-agent'
        $result.SessionId | Should -Be $sessionId
        $result.DeathEpoch | Should -Be 12345
    }
}

Describe 'Test-CommitLockEventuallyReleased' {
    BeforeEach {
        Reset-WriteSessionState
        Reset-CommitSerializerState
    }

    It 'T17: Test-CommitLockEventuallyReleased returns true when no sessions held for worktree' {
        $result = Test-CommitLockEventuallyReleased -WorktreeLeaf 'wt-t17' -MaxWaitMs 100
        $result | Should -Be $true
    }

    It 'T18: Test-CommitLockEventuallyReleased returns false on timeout (virtual clock)' {
        $session = Start-WriteSession -WorktreeLeaf 'wt-t18'
        try {
            # Virtual clock set 60s in future => immediately past MaxWaitMs
            $result = Test-CommitLockEventuallyReleased -WorktreeLeaf 'wt-t18' -MaxWaitMs 100 -GetUtcNow { [DateTime]::UtcNow.AddSeconds(60) }
            $result | Should -Be $false
        } finally {
            Recover-WriteSession -SessionId $session.SessionId
        }
    }
}
