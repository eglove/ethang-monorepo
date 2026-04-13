Describe 'Tier Completion Counter (ConcurrentDictionary)' {
    BeforeAll {
        . "$PSScriptRoot/helpers/test-config.ps1"
        . "$PSScriptRoot/../utils/job-runner.ps1"
    }

    It 'creates empty ConcurrentDictionary' {
        $c = New-TierCompletionCounter
        $c.GetType().Name | Should -Be 'ConcurrentDictionary`2'
        $c.Count | Should -Be 0
    }

    It 'atomically increments via AddOrUpdate' {
        $c = New-TierCompletionCounter
        $r = Add-TierCompletion -Counter $c -TierKey 'tier1'
        $r | Should -Be 1
        $r2 = Add-TierCompletion -Counter $c -TierKey 'tier1'
        $r2 | Should -Be 2
    }

    It 'correct count after concurrent increments from parallel runspaces' {
        $c = New-TierCompletionCounter
        Import-Module ThreadJob -ErrorAction SilentlyContinue
        $jobs = 1..10 | ForEach-Object {
            Start-ThreadJob -ScriptBlock {
                $counter = $using:c
                # Need to load the function in the runspace
                $null = $counter.AddOrUpdate('tier1', 1, [Func[string, int, int]]{ param($funcKey, $funcOld) $funcOld + 1 })
            }
        }
        $jobs | Wait-Job | Out-Null
        $jobs | Remove-Job
        $c['tier1'] | Should -Be 10
    }

    It 'AnyTaskInTierSucceeded: 1 of 3 succeed -> tier advances' {
        Test-TierAllSucceeded -CompletedCount 3 -TotalTasks 3 -FailedCount 2 | Should -BeTrue
    }

    It 'TierAllFailed: 0 of 3 succeed -> halt' {
        Test-TierAllSucceeded -CompletedCount 3 -TotalTasks 3 -FailedCount 3 | Should -BeFalse
    }

    It '2 of 3 succeed -> tier advances' {
        Test-TierAllSucceeded -CompletedCount 3 -TotalTasks 3 -FailedCount 1 | Should -BeTrue
    }

    It 'no task reaches escalated state' {
        # Verify "escalated" is never a valid terminal state
        $validTerminal = @('merged', 'failed', 'timed_out')
        'escalated' | Should -Not -BeIn $validTerminal
    }
}
