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

Describe 'Import-GraphState — default state when no file exists (Test 7)' {
    AfterEach { $env:VIBE_CLI_GRAPH_STATE = $null }

    It 'returns zero defaults when env var points to non-existent file' {
        $noFile = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), [System.IO.Path]::GetRandomFileName())
        $env:VIBE_CLI_GRAPH_STATE = $noFile
        $state = Import-GraphState
        $state.agentsCompleted | Should -Be 0
        $state.markdownState   | Should -Be 'none'
        $state.graphState      | Should -Be 'collecting'
    }
}

Describe 'Import-GraphState — reads state from existing file (Test 8)' {
    AfterEach { $env:VIBE_CLI_GRAPH_STATE = $null }

    It 'returns persisted values when state file exists' {
        $tempFile = [System.IO.Path]::GetTempFileName()
        try {
            $env:VIBE_CLI_GRAPH_STATE = $tempFile
            @{ agentsCompleted = 4; markdownState = 'current'; graphState = 'done' } |
                ConvertTo-Json | Set-Content $tempFile -Encoding UTF8
            $state = Import-GraphState
            $state.agentsCompleted | Should -Be 4
            $state.markdownState   | Should -Be 'current'
            $state.graphState      | Should -Be 'done'
        } finally {
            Remove-Item $tempFile -ErrorAction SilentlyContinue
        }
    }
}

Describe 'Save-GraphState — persists state (Test 9)' {
    AfterEach { $env:VIBE_CLI_GRAPH_STATE = $null }

    It 'writes state JSON to the env-var path' {
        $tempFile = [System.IO.Path]::GetTempFileName()
        try {
            $env:VIBE_CLI_GRAPH_STATE = $tempFile
            $state = @{ agentsCompleted = 6; markdownState = 'stale'; graphState = 'done' }
            Save-GraphState -State $state
            $json = Get-Content $tempFile -Raw | ConvertFrom-Json
            $json.agentsCompleted | Should -Be 6
            $json.markdownState   | Should -Be 'stale'
        } finally {
            Remove-Item $tempFile -ErrorAction SilentlyContinue
        }
    }
}

Describe 'Invoke-CloseHook — real tsx success path (Test 10)' {
    AfterEach { $env:VIBE_CLI_GRAPH_STATE = $null }

    It 'executes the tsx process path and marks markdown current on success' {
        $tempFile = [System.IO.Path]::GetTempFileName()
        try {
            $env:VIBE_CLI_GRAPH_STATE = $tempFile
            @{ agentsCompleted = 0; markdownState = 'none'; graphState = 'collecting' } |
                ConvertTo-Json | Set-Content $tempFile -Encoding UTF8

            $mockProc = [PSCustomObject]@{ ExitCode = 0 }
            $mockProc | Add-Member -MemberType ScriptMethod -Name 'WaitForExit' -Value { param($ms) return $true }
            $mockProc | Add-Member -MemberType ScriptMethod -Name 'Kill' -Value {}

            Mock Start-Process { return $mockProc }

            $result = Invoke-CloseHook -AgentIndex 0 -MaxAgents 1 -PipelineState 'running'

            $result.agentsCompleted | Should -Be 1
            $result.markdownState   | Should -Be 'current'
        } finally {
            Remove-Item $tempFile -ErrorAction SilentlyContinue
        }
    }
}

Describe 'Invoke-CloseHook — real tsx timeout kill path (Test 11)' {
    AfterEach { $env:VIBE_CLI_GRAPH_STATE = $null }

    It 'emits WARN and marks markdown stale when tsx process times out' {
        $tempFile = [System.IO.Path]::GetTempFileName()
        try {
            $env:VIBE_CLI_GRAPH_STATE = $tempFile
            @{ agentsCompleted = 0; markdownState = 'none'; graphState = 'collecting' } |
                ConvertTo-Json | Set-Content $tempFile -Encoding UTF8

            $mockProc = [PSCustomObject]@{ ExitCode = 1 }
            $mockProc | Add-Member -MemberType ScriptMethod -Name 'WaitForExit' -Value { param($ms) return $false }
            $mockProc | Add-Member -MemberType ScriptMethod -Name 'Kill' -Value {}

            Mock Start-Process { return $mockProc }

            $result = Invoke-CloseHook -AgentIndex 2 -MaxAgents 1 -PipelineState 'running' -TimeoutSeconds 1

            $result.warnEmitted   | Should -Be $true
            $result.markdownState | Should -Be 'stale'
            $result.warnMessage   | Should -Match 'WARN.*closeHookTimeout.*agent=2'
        } finally {
            Remove-Item $tempFile -ErrorAction SilentlyContinue
        }
    }
}

Describe 'Import-GraphState — default path when env var is unset' {
    AfterEach { Remove-Item Env:VIBE_CLI_GRAPH_STATE -ErrorAction SilentlyContinue }

    It 'falls back to state/graph-state.json under the script root' {
        Remove-Item Env:VIBE_CLI_GRAPH_STATE -ErrorAction SilentlyContinue
        $state = Import-GraphState
        $state.agentsCompleted | Should -BeOfType [int]
        $state.markdownState   | Should -Not -BeNullOrEmpty
        $state.graphState      | Should -Not -BeNullOrEmpty
    }
}

Describe 'Save-GraphState — default path and directory creation' {
    AfterEach { Remove-Item Env:VIBE_CLI_GRAPH_STATE -ErrorAction SilentlyContinue }

    It 'creates missing parent directories when writing state' {
        $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "gs-$(Get-Random)"
        $target = Join-Path $tempRoot 'nested/deep/graph-state.json'
        $env:VIBE_CLI_GRAPH_STATE = $target
        try {
            Save-GraphState -State @{ agentsCompleted = 1; markdownState = 'current'; graphState = 'done' }
            Test-Path $target | Should -BeTrue
            $restored = Get-Content $target -Raw | ConvertFrom-Json
            $restored.agentsCompleted | Should -Be 1
        } finally {
            Remove-Item $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
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
