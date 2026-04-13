BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
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
        $result.Result.TaskId | Should -Be 'T1'
    }

    It 'detects output pollution (multiple objects)' {
        $result = Invoke-WithTimeout -TaskId 'T2' -ScriptBlock {
            'noise'
            @{ TaskId = 'T2' }
        }
        $result.Error | Should -Match 'pollution|multiple|2 objects'
    }

    It 'reports error when job throws' {
        $result = Invoke-WithTimeout -TaskId 'T-err' -ScriptBlock {
            throw 'Deliberate test error'
        }
        $result.Error | Should -Not -BeNullOrEmpty
    }

    It 'returns null result error when script block returns nothing' {
        $result = Invoke-WithTimeout -TaskId 'T-null' -ScriptBlock {
            # Return nothing
        }
        $result.Error | Should -Match 'no output'
        $result.Result | Should -BeNullOrEmpty
    }

}
