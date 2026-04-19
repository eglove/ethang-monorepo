#Requires -Modules Pester

BeforeAll {
    # Track mock calls
    $script:MockNewSessionCalls = [System.Collections.Generic.List[hashtable]]::new()
    $script:MockAliveSessionCalls = [System.Collections.Generic.List[hashtable]]::new()
    $script:MockDeadSessionCalls = [System.Collections.Generic.List[hashtable]]::new()
    $script:HaltCalled = 0
    $script:HaltReasons = [System.Collections.Generic.List[string]]::new()

    # Override AgentSession functions with tracking stubs
    function global:New-AgentSession {
        param($Connection, $AgentName, $Role, $Worktree = $null, $ProcessId = 0, $RoleSchemaVersion = 1)
        $script:MockNewSessionCalls.Add(@{ AgentName = $AgentName; Role = $Role; Worktree = $Worktree })
        return 'mock-session-id'
    }

    function global:Set-AgentSessionAlive {
        param($Connection, $SessionId, $SpawnEpoch)
        $script:MockAliveSessionCalls.Add(@{ SessionId = $SessionId; SpawnEpoch = $SpawnEpoch })
    }

    function global:Set-AgentSessionDead {
        param($Connection, $SessionId, $DeathEpoch = 0)
        $script:MockDeadSessionCalls.Add(@{ SessionId = $SessionId; DeathEpoch = $DeathEpoch })
    }

    function global:Invoke-BusHalt {
        param($HaltReason = 'mechanical_error', $FailureCategory = $null)
        $script:HaltCalled++
        $script:HaltReasons.Add($HaltReason)
    }

    function global:Write-PipelineLog {
        param($Severity, $Message)
        # no-op for tests
    }

    # Load the implementation
    . "$PSScriptRoot/../../../bus/router/agent-lifecycle.ps1"
}

Describe 'Backpressure Queue Unit Tests' {

    BeforeEach {
        Reset-AgentLifecycleState
        [QueueDepthStore]::Reset() | Out-Null
        $script:MockNewSessionCalls.Clear()
        $script:MockAliveSessionCalls.Clear()
        $script:MockDeadSessionCalls.Clear()
        $script:HaltCalled = 0
        $script:HaltReasons.Clear()
    }

    Context 'Invoke-EnqueueAgentMessage' {

        It 'increments queue depth counter before Add - depth is 1 after one enqueue' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            Start-BusAgent -Connection $null -AgentName 'agent-a' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 1000 | Out-Null

            Invoke-EnqueueAgentMessage -AgentName 'agent-a' -Message 'hello'
            $depth = Get-BackpressureQueueDepth
            $depth | Should -Be 1
        }

        It 'returns $true on successful enqueue' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            Start-BusAgent -Connection $null -AgentName 'agent-b' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 1000 | Out-Null

            $result = Invoke-EnqueueAgentMessage -AgentName 'agent-b' -Message 'hello'
            $result | Should -Be $true
        }

        It 'returns $false when queue is full' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            # Use capacity of 2 for this test
            Start-BusAgent -Connection $null -AgentName 'agent-full' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 1000 -QueueCapacity 2 | Out-Null

            Invoke-EnqueueAgentMessage -AgentName 'agent-full' -Message 'msg1' | Out-Null
            Invoke-EnqueueAgentMessage -AgentName 'agent-full' -Message 'msg2' | Out-Null
            $result = Invoke-EnqueueAgentMessage -AgentName 'agent-full' -Message 'msg3-overflow'
            $result | Should -Be $false
        }

        It 'queue full triggers Invoke-BusHalt' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            Start-BusAgent -Connection $null -AgentName 'agent-halt' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 1000 -QueueCapacity 1 | Out-Null

            Invoke-EnqueueAgentMessage -AgentName 'agent-halt' -Message 'fill-it' | Out-Null
            $haltBefore = $script:HaltCalled
            Invoke-EnqueueAgentMessage -AgentName 'agent-halt' -Message 'overflow' | Out-Null
            $script:HaltCalled | Should -BeGreaterThan $haltBefore
        }

        It 'queue depth counter rolls back on full queue (increment then decrement)' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            Start-BusAgent -Connection $null -AgentName 'agent-rollback' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 1000 -QueueCapacity 1 | Out-Null

            Invoke-EnqueueAgentMessage -AgentName 'agent-rollback' -Message 'fill' | Out-Null
            $depthBeforeOverflow = Get-BackpressureQueueDepth
            Invoke-EnqueueAgentMessage -AgentName 'agent-rollback' -Message 'overflow' | Out-Null
            # After rollback on failed add, depth should stay same as before the overflow attempt
            $depthAfterOverflow = Get-BackpressureQueueDepth
            $depthAfterOverflow | Should -Be $depthBeforeOverflow
        }

        It 'throws when agent name is not in _ActiveAgents' {
            { Invoke-EnqueueAgentMessage -AgentName 'nonexistent-agent' -Message 'hello' } | Should -Throw
        }

        It 'queue capacity is respected - 1001st message returns $false with capacity 1000' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            Start-BusAgent -Connection $null -AgentName 'agent-cap' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 1000 -QueueCapacity 1000 | Out-Null

            for ($i = 1; $i -le 1000; $i++) {
                Invoke-EnqueueAgentMessage -AgentName 'agent-cap' -Message "msg-$i" | Out-Null
            }
            $result = Invoke-EnqueueAgentMessage -AgentName 'agent-cap' -Message 'msg-1001'
            $result | Should -Be $false
        }
    }

    Context 'Invoke-DequeueAgentMessage' {

        It 'decrements counter on successful take' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            Start-BusAgent -Connection $null -AgentName 'agent-deq' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 1000 | Out-Null

            Invoke-EnqueueAgentMessage -AgentName 'agent-deq' -Message 'hello' | Out-Null
            $depthBefore = Get-BackpressureQueueDepth
            $msg = Invoke-DequeueAgentMessage -AgentName 'agent-deq' -TimeoutMs 1000
            $depthAfter = Get-BackpressureQueueDepth
            $depthAfter | Should -Be ($depthBefore - 1)
        }

        It 'does NOT decrement counter on timeout (returns $null)' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            Start-BusAgent -Connection $null -AgentName 'agent-timeout' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 1000 | Out-Null

            $depthBefore = Get-BackpressureQueueDepth
            $msg = Invoke-DequeueAgentMessage -AgentName 'agent-timeout' -TimeoutMs 100
            $msg | Should -BeNullOrEmpty
            $depthAfter = Get-BackpressureQueueDepth
            $depthAfter | Should -Be $depthBefore
        }

        It 'queue depth counter is correct after 3 enqueue + 2 dequeue' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            Start-BusAgent -Connection $null -AgentName 'agent-math' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 1000 | Out-Null

            Invoke-EnqueueAgentMessage -AgentName 'agent-math' -Message 'msg1' | Out-Null
            Invoke-EnqueueAgentMessage -AgentName 'agent-math' -Message 'msg2' | Out-Null
            Invoke-EnqueueAgentMessage -AgentName 'agent-math' -Message 'msg3' | Out-Null
            Invoke-DequeueAgentMessage -AgentName 'agent-math' -TimeoutMs 1000 | Out-Null
            Invoke-DequeueAgentMessage -AgentName 'agent-math' -TimeoutMs 1000 | Out-Null
            $depth = Get-BackpressureQueueDepth
            $depth | Should -Be 1
        }
    }

    Context 'Get-BackpressureQueueDepth' {

        It 'returns 0 after Reset-AgentLifecycleState' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            Start-BusAgent -Connection $null -AgentName 'agent-reset-depth' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 1000 | Out-Null

            Invoke-EnqueueAgentMessage -AgentName 'agent-reset-depth' -Message 'hello' | Out-Null
            Reset-AgentLifecycleState
            [QueueDepthStore]::Reset() | Out-Null
            $depth = Get-BackpressureQueueDepth
            $depth | Should -Be 0
        }

        It 'returns current counter via Interlocked.Read (non-blocking)' {
            $depth = Get-BackpressureQueueDepth
            $depth | Should -BeOfType [long]
            $depth | Should -BeGreaterOrEqual 0
        }
    }

    Context 'Halt-once behavior' {

        It 'two queue-full events only call Invoke-BusHalt twice (one per overflow) but halt-once is in bus-lifecycle' {
            # This test verifies enqueue calls Invoke-BusHalt on overflow
            # The halt-once CAS guard lives in bus-lifecycle.ps1 stub
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            Start-BusAgent -Connection $null -AgentName 'agent-halt2' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 1000 -QueueCapacity 1 | Out-Null

            Invoke-EnqueueAgentMessage -AgentName 'agent-halt2' -Message 'fill' | Out-Null
            $haltBefore = $script:HaltCalled
            Invoke-EnqueueAgentMessage -AgentName 'agent-halt2' -Message 'overflow1' | Out-Null
            Invoke-EnqueueAgentMessage -AgentName 'agent-halt2' -Message 'overflow2' | Out-Null
            # Each overflow attempt calls Invoke-BusHalt (real halt-once is in bus-lifecycle stub)
            ($script:HaltCalled - $haltBefore) | Should -Be 2
        }
    }

    Context 'Start-BusAgent' {

        It 'with mock LaunchAgent returns correct SessionId' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            $result = Start-BusAgent -Connection $null -AgentName 'agent-sid' -Role 'reviewer' -SystemPrompt 'review code' `
                -LaunchAgent $mockLauncher -SpawnEpoch 2000

            $result.SessionId | Should -Be 'mock-session-id'
        }

        It 'creates entry in $script:_ActiveAgents for AgentName' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            Start-BusAgent -Connection $null -AgentName 'agent-active' -Role 'coder' -SystemPrompt 'code stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 1000 | Out-Null

            # Verify by enqueuing - if agent not in _ActiveAgents, this would throw
            { Invoke-EnqueueAgentMessage -AgentName 'agent-active' -Message 'probe' } | Should -Not -Throw
        }

        It 'calls Set-AgentSessionAlive after New-AgentSession' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            Start-BusAgent -Connection $null -AgentName 'agent-alive-check' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 5000 | Out-Null

            $script:MockNewSessionCalls.Count | Should -BeGreaterThan 0
            $script:MockAliveSessionCalls.Count | Should -BeGreaterThan 0
            $script:MockAliveSessionCalls[0].SessionId | Should -Be 'mock-session-id'
        }

        It 'SpawnEpoch in result matches provided SpawnEpoch' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            $result = Start-BusAgent -Connection $null -AgentName 'agent-epoch' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 9999

            $result.SpawnEpoch | Should -Be 9999
        }

        It 'returns QueueDepth of 0 on initial start' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            $result = Start-BusAgent -Connection $null -AgentName 'agent-qdepth' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 1000

            $result.QueueDepth | Should -Be 0
        }
    }

    Context 'Reset-AgentLifecycleState' {

        It 'clears all active agents so subsequent enqueue throws' {
            $mockLauncher = { param($AgentName, $Role, $SystemPrompt, $Worktree)
                return @{ ProcessId = 42; Process = $null }
            }
            Start-BusAgent -Connection $null -AgentName 'agent-clear' -Role 'coder' -SystemPrompt 'do stuff' `
                -LaunchAgent $mockLauncher -SpawnEpoch 1000 | Out-Null

            Reset-AgentLifecycleState
            { Invoke-EnqueueAgentMessage -AgentName 'agent-clear' -Message 'post-reset' } | Should -Throw
        }
    }
}
