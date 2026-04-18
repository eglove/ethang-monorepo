#Requires -Modules Pester

BeforeAll {
    Import-Module PSSQLite -ErrorAction Stop

    # Stub Write-PipelineLog for integration context
    function global:Write-PipelineLog {
        param($Severity, $Message)
        # no-op
    }

    # Stub Invoke-BusHalt (allow real halt to be called but track it)
    $script:IntegrationHaltCalled = 0
    function global:Invoke-BusHalt {
        param($HaltReason = 'mechanical_error', $FailureCategory = $null)
        $script:IntegrationHaltCalled++
    }

    . "$PSScriptRoot/../../../bus/infra/evt-id-allocator.ps1"
    . "$PSScriptRoot/../../../bus/router/agent-lifecycle.ps1"
}

Describe 'Start-BusAgent Integration Tests' {

    BeforeEach {
        $script:TestDir = Join-Path $env:TEMP "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory -Path $script:TestDir -Force | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'
        $script:Conn = New-SQLiteConnection -DataSource $script:DbPath
        # Apply schema
        $schemaSql = Get-Content "$PSScriptRoot/../../../bus/schema/agent-sessions.sql" -Raw
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $schemaSql
        Initialize-EvtIdAllocator -StartValue 1
        Reset-AgentLifecycleState
        [QueueDepthStore]::Reset() | Out-Null
        $script:IntegrationHaltCalled = 0
    }

    AfterEach {
        if ($script:Conn) {
            try { $script:Conn.Close() } catch {}
        }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    Context 'Database state after Start-BusAgent' {

        It 'inserts spawning row then transitions to alive in agent_sessions' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 100; Process = $null }
            }
            $result = Start-BusAgent -Connection $script:Conn -AgentName 'int-agent-1' -Role 'coder' `
                -SystemPrompt 'write code' -LaunchAgent $mockLauncher -SpawnEpoch 10000

            $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn `
                -Query "SELECT * FROM agent_sessions WHERE session_id='$($result.SessionId)'"
            $row.status | Should -Be 'alive'
        }

        It 'returns result with SessionId matching what is in the DB' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 101; Process = $null }
            }
            $result = Start-BusAgent -Connection $script:Conn -AgentName 'int-agent-2' -Role 'reviewer' `
                -SystemPrompt 'review code' -LaunchAgent $mockLauncher -SpawnEpoch 10001

            $rows = Invoke-SqliteQuery -SQLiteConnection $script:Conn `
                -Query "SELECT * FROM agent_sessions WHERE session_id='$($result.SessionId)'"
            $rows | Should -Not -BeNullOrEmpty
            $rows.session_id | Should -Be $result.SessionId
        }

        It 'SpawnEpoch matches what was stored in DB' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 102; Process = $null }
            }
            $result = Start-BusAgent -Connection $script:Conn -AgentName 'int-agent-3' -Role 'coder' `
                -SystemPrompt 'code' -LaunchAgent $mockLauncher -SpawnEpoch 20000

            $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn `
                -Query "SELECT * FROM agent_sessions WHERE session_id='$($result.SessionId)'"
            $row.spawn_epoch | Should -Be 20000
        }

        It 'mock LaunchAgent with ProcessId 999 stores pid=999 in agent_sessions' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 999; Process = $null }
            }
            $result = Start-BusAgent -Connection $script:Conn -AgentName 'int-agent-pid' -Role 'coder' `
                -SystemPrompt 'code' -LaunchAgent $mockLauncher -SpawnEpoch 30000

            $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn `
                -Query "SELECT * FROM agent_sessions WHERE session_id='$($result.SessionId)'"
            $row.pid | Should -Be 999
        }
    }

    Context 'Message queue round-trip' {

        It 'Invoke-EnqueueAgentMessage + Invoke-DequeueAgentMessage round-trip preserves message' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 200; Process = $null }
            }
            Start-BusAgent -Connection $script:Conn -AgentName 'int-roundtrip' -Role 'coder' `
                -SystemPrompt 'code' -LaunchAgent $mockLauncher -SpawnEpoch 1000 | Out-Null

            $original = 'integration test message payload'
            Invoke-EnqueueAgentMessage -AgentName 'int-roundtrip' -Message $original | Out-Null
            $received = Invoke-DequeueAgentMessage -AgentName 'int-roundtrip' -TimeoutMs 2000
            $received | Should -Be $original
        }

        It 'queue depth is 1 after one enqueue before dequeue' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 201; Process = $null }
            }
            Start-BusAgent -Connection $script:Conn -AgentName 'int-depth1' -Role 'coder' `
                -SystemPrompt 'code' -LaunchAgent $mockLauncher -SpawnEpoch 1000 | Out-Null

            Invoke-EnqueueAgentMessage -AgentName 'int-depth1' -Message 'hello' | Out-Null
            $depth = Get-BackpressureQueueDepth
            $depth | Should -Be 1
        }

        It 'queue depth is 0 after enqueue + dequeue' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 202; Process = $null }
            }
            Start-BusAgent -Connection $script:Conn -AgentName 'int-depth0' -Role 'coder' `
                -SystemPrompt 'code' -LaunchAgent $mockLauncher -SpawnEpoch 1000 | Out-Null

            Invoke-EnqueueAgentMessage -AgentName 'int-depth0' -Message 'hello' | Out-Null
            Invoke-DequeueAgentMessage -AgentName 'int-depth0' -TimeoutMs 2000 | Out-Null
            $depth = Get-BackpressureQueueDepth
            $depth | Should -Be 0
        }
    }

    Context 'Multiple agents have independent queues' {

        It 'messages enqueued for agent-A are not visible to agent-B dequeue' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 300; Process = $null }
            }
            Start-BusAgent -Connection $script:Conn -AgentName 'int-multi-a' -Role 'coder' `
                -SystemPrompt 'code' -LaunchAgent $mockLauncher -SpawnEpoch 1000 | Out-Null
            Start-BusAgent -Connection $script:Conn -AgentName 'int-multi-b' -Role 'reviewer' `
                -SystemPrompt 'review' -LaunchAgent $mockLauncher -SpawnEpoch 1001 | Out-Null

            Invoke-EnqueueAgentMessage -AgentName 'int-multi-a' -Message 'for-a-only' | Out-Null
            $msgB = Invoke-DequeueAgentMessage -AgentName 'int-multi-b' -TimeoutMs 200
            $msgB | Should -BeNullOrEmpty
            $msgA = Invoke-DequeueAgentMessage -AgentName 'int-multi-a' -TimeoutMs 1000
            $msgA | Should -Be 'for-a-only'
        }
    }

    Context 'Reset-AgentLifecycleState' {

        It 'clears all agents from $script:_ActiveAgents' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 400; Process = $null }
            }
            Start-BusAgent -Connection $script:Conn -AgentName 'int-clear-a' -Role 'coder' `
                -SystemPrompt 'code' -LaunchAgent $mockLauncher -SpawnEpoch 1000 | Out-Null
            Start-BusAgent -Connection $script:Conn -AgentName 'int-clear-b' -Role 'reviewer' `
                -SystemPrompt 'review' -LaunchAgent $mockLauncher -SpawnEpoch 1001 | Out-Null

            Reset-AgentLifecycleState

            { Invoke-EnqueueAgentMessage -AgentName 'int-clear-a' -Message 'post-reset' } | Should -Throw
            { Invoke-EnqueueAgentMessage -AgentName 'int-clear-b' -Message 'post-reset' } | Should -Throw
        }

        It 'queue depth counter returns 0 after Reset-AgentLifecycleState and QueueDepthStore.Reset' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 401; Process = $null }
            }
            Start-BusAgent -Connection $script:Conn -AgentName 'int-depth-reset' -Role 'coder' `
                -SystemPrompt 'code' -LaunchAgent $mockLauncher -SpawnEpoch 1000 | Out-Null

            Invoke-EnqueueAgentMessage -AgentName 'int-depth-reset' -Message 'msg1' | Out-Null
            Invoke-EnqueueAgentMessage -AgentName 'int-depth-reset' -Message 'msg2' | Out-Null
            Reset-AgentLifecycleState
            [QueueDepthStore]::Reset() | Out-Null
            $depth = Get-BackpressureQueueDepth
            $depth | Should -Be 0
        }
    }

    Context 'Agent not in _ActiveAgents' {

        It 'throws on enqueue for unknown agent name' {
            { Invoke-EnqueueAgentMessage -AgentName 'totally-unknown-agent' -Message 'hello' } | Should -Throw
        }
    }

    Context 'Production path - null LaunchAgent' {

        It 'Start-BusAgent without $LaunchAgent (null) handles gracefully without crashing' {
            # When LaunchAgent is null, should not crash - just no process event wiring
            { Start-BusAgent -Connection $script:Conn -AgentName 'int-no-launcher' -Role 'coder' `
                -SystemPrompt 'code' -SpawnEpoch 5000 } | Should -Not -Throw
        }
    }
}
