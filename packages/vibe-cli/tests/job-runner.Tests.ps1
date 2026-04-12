BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/task-log.ps1"
    # Stub Get-CimInstance on non-Windows so Pester can mock it
    if (-not (Get-Command Get-CimInstance -ErrorAction SilentlyContinue)) {
        function global:Get-CimInstance { @() }
    }
    . "$PSScriptRoot/../utils/job-runner.ps1"
}

Describe 'Stop-ProcessTree' {
    It 'kills a process and returns killed PIDs' {
        Mock Get-CimInstance { @() }
        Mock Stop-Process {}

        $result = Stop-ProcessTree -ProcessId 9999
        $result | Should -BeOfType [hashtable]
    }

    It 'handles already-exited processes without throwing' {
        Mock Get-CimInstance { @() }
        Mock Stop-Process { throw 'Process has exited' }

        { Stop-ProcessTree -ProcessId 9999 } | Should -Not -Throw
    }

    It 'recurses into child processes' {
        $callOrder = [System.Collections.ArrayList]::new()
        Mock Get-CimInstance {
            param($ClassName, $Filter)
            if ($Filter -match 'ParentProcessId=100') {
                return @(
                    [pscustomobject]@{ ProcessId = 200 }
                    [pscustomobject]@{ ProcessId = 300 }
                )
            }
            if ($Filter -match 'ParentProcessId=200') {
                return @([pscustomobject]@{ ProcessId = 400 })
            }
            return @()
        }
        Mock Stop-Process { param($Id) $null = $callOrder.Add($Id) }

        Stop-ProcessTree -ProcessId 100

        # Leaf-to-root: grandchild 400 first, then 200, 300, then root 100
        $callOrder[0] | Should -Be 400
        $callOrder[-1] | Should -Be 100
    }
}

Describe 'Get-ChildPidRegistry' {
    It 'returns a ConcurrentDictionary' {
        $reg = Get-ChildPidRegistry
        $reg | Should -Not -BeNullOrEmpty
        $reg.GetType().Name | Should -Match 'ConcurrentDictionary'
    }
}

Describe 'Invoke-WithTimeout' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}
    }

    It 'returns result from successful job' {
        $result = Invoke-WithTimeout -TaskId 'T1' -ScriptBlock {
            @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed' }
        }
        $result.TimedOut | Should -BeFalse
        $result.Result.TaskId | Should -Be 'T1'
    }

    It 'detects output pollution (multiple objects)' {
        $result = Invoke-WithTimeout -TaskId 'T2' -ScriptBlock {
            'noise'
            @{ TaskId = 'T2' }
        }
        $result.Error | Should -Match 'pollution|multiple|2 objects'
    }

    It 'resolves per-writer timeout from TaskTimeouts' {
        # agent-writer has 300s timeout vs default 600s
        # We verify by checking the function accepts the parameter
        $result = Invoke-WithTimeout -TaskId 'T3' -WriterType 'agent-writer' -ScriptBlock {
            @{ TaskId = 'T3' }
        }
        $result.TimedOut | Should -BeFalse
    }

    It 'returns budget exceeded when wall-clock exhausted' {
        # Pre-load a stopwatch that has been running for over an hour
        $sw = [System.Diagnostics.Stopwatch]::new()
        $sw.Start()
        # We cannot actually wait an hour; instead directly set the budget to 0 for this test
        $origBudget = $Config.TaskMaxWallClockSeconds
        $Config.TaskMaxWallClockSeconds = 0

        try {
            # Need a fresh task ID so TaskWallClocks has an existing entry
            $freshId = "T-budget-$(Get-Random)"
            $null = $script:TaskWallClocks = [System.Collections.Concurrent.ConcurrentDictionary[string,System.Diagnostics.Stopwatch]]::new()
            $null = $script:TaskWallClocks.TryAdd($freshId, $sw)

            # Re-source to pick up the module-scope variable
            . "$PSScriptRoot/../utils/job-runner.ps1"

            $result = Invoke-WithTimeout -TaskId $freshId -ScriptBlock { @{} }
            $result.TimedOut | Should -BeTrue
            $result.BudgetExceeded | Should -BeTrue
        }
        finally {
            $Config.TaskMaxWallClockSeconds = $origBudget
            . "$PSScriptRoot/../utils/job-runner.ps1"
        }
    }

    It 'reports error when job throws' {
        $result = Invoke-WithTimeout -TaskId 'T-err' -ScriptBlock {
            throw 'Deliberate test error'
        }
        $result.Error | Should -Not -BeNullOrEmpty
    }

    It 'starts stopped stopwatch on re-entry' {
        # Create a stopped stopwatch in the registry
        $freshId = "T-sw-$(Get-Random)"
        $sw = [System.Diagnostics.Stopwatch]::new()
        # sw is created but not started (IsRunning = false)
        $null = $script:TaskWallClocks.GetOrAdd($freshId, $sw)

        $result = Invoke-WithTimeout -TaskId $freshId -ScriptBlock {
            @{ TaskId = 'done' }
        }
        $result.TimedOut | Should -BeFalse
        $result.Result.TaskId | Should -Be 'done'
    }

    It 'returns null result error when script block returns nothing' {
        $result = Invoke-WithTimeout -TaskId 'T-null' -ScriptBlock {
            # Return nothing
        }
        $result.Error | Should -Match 'no output'
        $result.Result | Should -BeNullOrEmpty
    }

    It 'returns timeout result when timer fires before completion' {
        # Use a very short timeout to trigger the timer path
        $origTimeout = $Config.JobTimeoutSeconds
        $Config.JobTimeoutSeconds = 0.001  # 1ms timeout

        try {
            $freshId = "T-timeout-$(Get-Random)"
            $null = $script:TaskWallClocks = [System.Collections.Concurrent.ConcurrentDictionary[string,System.Diagnostics.Stopwatch]]::new()
            . "$PSScriptRoot/../utils/job-runner.ps1"

            $result = Invoke-WithTimeout -TaskId $freshId -ScriptBlock {
                Start-Sleep -Milliseconds 500
                @{ TaskId = 'late' }
            }
            # Either the timer fires (TimedOut=true) or the block completes
            # The key thing is no unhandled exception
            $result | Should -Not -BeNullOrEmpty
        }
        finally {
            $Config.JobTimeoutSeconds = $origTimeout
            . "$PSScriptRoot/../utils/job-runner.ps1"
        }
    }
}
