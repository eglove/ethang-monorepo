BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
    . "$PSScriptRoot/../utils/close-hook.ps1"
}

Describe 'Invoke-CloseHook — successful tsx run (Test 1)' {
    It 'increments agentsCompleted by 1 after successful tsx run (S18, S25)' {
        $initialState = @{
            agentsCompleted = 0
            markdownState   = 'none'
            graphState      = 'collecting'
        }

        $successRunner = { <# tsx succeeds: no throw #> }

        $result = Invoke-CloseHook `
            -AgentIndex 0 `
            -OutputPath 'CLAUDE.md' `
            -MaxAgents 1 `
            -TimeoutSeconds 30 `
            -PipelineState 'running' `
            -TsxRunner $successRunner `
            -InitialState $initialState

        $result.agentsCompleted | Should -Be 1
        $result.markdownState   | Should -Be 'current'
    }
}

Describe 'Invoke-CloseHook — failing tsx run (Test 2)' {
    It 'still increments agentsCompleted AND marks markdownState stale on tsx failure (GraphWriteFail)' {
        $initialState = @{
            agentsCompleted = 0
            markdownState   = 'none'
            graphState      = 'collecting'
        }

        $failRunner = { throw 'tsx exited with code 1' }

        $result = Invoke-CloseHook `
            -AgentIndex 0 `
            -OutputPath 'CLAUDE.md' `
            -MaxAgents 1 `
            -TimeoutSeconds 30 `
            -PipelineState 'running' `
            -TsxRunner $failRunner `
            -InitialState $initialState

        $result.agentsCompleted | Should -Be 1
        $result.markdownState   | Should -Be 'stale'
    }
}

Describe 'Invoke-CloseHook — agentsCompleted incremented only AFTER tsx exits (Test 3)' {
    It 'does not increment agentsCompleted before tsx runner executes (S32 CloseHookPrecedesNextEpoch)' {
        $initialState = @{
            agentsCompleted = 0
            markdownState   = 'none'
            graphState      = 'collecting'
        }

        $script:duringExecution = $null

        # Capture agentsCompleted mid-run (inside the tsx runner)
        $capturingRunner = {
            # The runner captures the state BEFORE the caller increments it.
            # We signal this via a shared variable read by the test.
            $script:duringExecution = $initialState.agentsCompleted
        }

        $result = Invoke-CloseHook `
            -AgentIndex 0 `
            -OutputPath 'CLAUDE.md' `
            -MaxAgents 1 `
            -TimeoutSeconds 30 `
            -PipelineState 'running' `
            -TsxRunner $capturingRunner `
            -InitialState $initialState

        # During tsx execution agentsCompleted was still 0
        $script:duringExecution | Should -Be 0
        # After tsx exits it is 1
        $result.agentsCompleted | Should -Be 1
    }
}

Describe 'Invoke-CloseHook — timeout handling (Test 4)' {
    It 'kills hung tsx, emits WARN message, and still increments agentsCompleted' {
        $initialState = @{
            agentsCompleted = 0
            markdownState   = 'none'
            graphState      = 'collecting'
        }

        # Simulate a hanging process by throwing a timeout sentinel
        $hangRunner = { throw 'TIMEOUT' }

        $output = Invoke-CloseHook `
            -AgentIndex 3 `
            -OutputPath 'CLAUDE.md' `
            -MaxAgents 5 `
            -TimeoutSeconds 1 `
            -PipelineState 'running' `
            -TsxRunner $hangRunner `
            -InitialState $initialState `
            -SimulateTimeout $true

        # Pipeline continues — agentsCompleted incremented
        $output.agentsCompleted | Should -Be 1
        # WARN was captured in result
        $output.warnEmitted | Should -Be $true
        $output.warnMessage | Should -Match '\[WARN: closeHookTimeout agent=3\]'
    }
}

Describe 'Invoke-CloseHook — halted pipeline (Test 5)' {
    It 'does NOT increment agentsCompleted and does NOT modify markdownState when pipeline is halted (GraphHaltCleanup)' {
        $initialState = @{
            agentsCompleted = 2
            markdownState   = 'current'
            graphState      = 'collecting'
        }

        $result = Invoke-CloseHook `
            -AgentIndex 0 `
            -OutputPath 'CLAUDE.md' `
            -MaxAgents 3 `
            -TimeoutSeconds 30 `
            -PipelineState 'halted' `
            -InitialState $initialState

        $result.agentsCompleted | Should -Be 2
        $result.markdownState   | Should -Be 'current'
        $result.graphState      | Should -Be 'warn'
    }
}

Describe 'Invoke-CloseHook — two consecutive close hooks (Test 6, integration)' {
    It 'agentsCompleted reaches 2 and graphState becomes done after both hooks complete (S25, L1)' {
        $state = @{
            agentsCompleted = 0
            markdownState   = 'none'
            graphState      = 'collecting'
        }

        $successRunner = { <# no-op success #> }

        # First hook (agent 0 of 2)
        $state = Invoke-CloseHook `
            -AgentIndex 0 `
            -OutputPath 'CLAUDE.md' `
            -MaxAgents 2 `
            -TimeoutSeconds 30 `
            -PipelineState 'running' `
            -TsxRunner $successRunner `
            -InitialState $state

        $state.agentsCompleted | Should -Be 1
        $state.graphState      | Should -Be 'collecting'

        # Second hook (agent 1 of 2)
        $state = Invoke-CloseHook `
            -AgentIndex 1 `
            -OutputPath 'CLAUDE.md' `
            -MaxAgents 2 `
            -TimeoutSeconds 30 `
            -PipelineState 'running' `
            -TsxRunner $successRunner `
            -InitialState $state

        $state.agentsCompleted | Should -Be 2
        $state.graphState      | Should -Be 'done'
    }
}
