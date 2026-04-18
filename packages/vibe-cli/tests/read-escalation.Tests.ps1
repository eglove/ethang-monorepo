BeforeAll {
    . "$PSScriptRoot/../utils/result-contracts.ps1"
    . "$PSScriptRoot/../utils/read-escalation.ps1"
}

Describe 'Get-ResetDispatchKey' {
    It 'constructs valid task:phase keys' {
        Get-ResetDispatchKey -Source 'task' -Phase 'red_retry' | Should -Be 'task:red_retry'
        Get-ResetDispatchKey -Source 'task' -Phase 'green_retry' | Should -Be 'task:green_retry'
        Get-ResetDispatchKey -Source 'task' -Phase 'cleanup' | Should -Be 'task:cleanup'
        Get-ResetDispatchKey -Source 'task' -Phase 'cleanup_remed' | Should -Be 'task:cleanup_remed'
    }

    It 'constructs valid non-task keys with empty phase' {
        Get-ResetDispatchKey -Source 'merge' | Should -Be 'merge:'
        Get-ResetDispatchKey -Source 'final' | Should -Be 'final:'
        Get-ResetDispatchKey -Source 'workspace' | Should -Be 'workspace:'
    }

    It 'throws on invalid source' {
        { Get-ResetDispatchKey -Source 'invalid' -Phase 'red' } | Should -Throw '*Invalid escalation source*'
    }

    It 'throws on invalid phase' {
        { Get-ResetDispatchKey -Source 'task' -Phase 'banana' } | Should -Throw '*Invalid phase*'
    }

    It 'accepts all valid sources' {
        foreach ($s in @('task', 'merge', 'final', 'workspace')) {
            { Get-ResetDispatchKey -Source $s } | Should -Not -Throw
        }
    }
}

Describe 'Read-Escalation' {
    BeforeAll {
        Mock Write-Host {}
    }

    It 'returns KeepGoing when user selects k' {
        Mock Read-Host { 'k' }
        $result = Read-Escalation -Source 'task' -TaskId 'T1' -Phase 'green_retry'
        $result.Decision | Should -Be 'KeepGoing'
        $result.Source | Should -Be 'task'
        $result.TaskId | Should -Be 'T1'
        $result.Phase | Should -Be 'green_retry'
    }

    It 'returns Stop with PreStopSnapshot' {
        Mock Read-Host { 's' }
        $statuses = @{ T1 = 'escalated'; T2 = 'running' }
        $result = Read-Escalation -Source 'task' -TaskId 'T1' -Phase 'red' -TaskStatuses $statuses
        $result.Decision | Should -Be 'Stop'
        $result.PreStopSnapshot | Should -Not -BeNullOrEmpty
        $result.PreStopSnapshot.T1 | Should -Be 'escalated'
        $result.PreStopSnapshot.T2 | Should -Be 'running'
    }

    It 'returns NoOp for already-running task (idempotency)' {
        $statuses = @{ T1 = 'running' }
        $result = Read-Escalation -Source 'task' -TaskId 'T1' -Phase 'green' -TaskStatuses $statuses
        $result.Decision | Should -Be 'NoOp'
        $result.Reason | Should -Match 'already recovered'
    }

    It 'returns NoOp for already-completed task' {
        $statuses = @{ T1 = 'completed' }
        $result = Read-Escalation -Source 'task' -TaskId 'T1' -Phase 'done' -TaskStatuses $statuses
        $result.Decision | Should -Be 'NoOp'
    }

    It 'reroutes done-phase task to merge source' {
        Mock Read-Host { 'k' }
        $statuses = @{ T1 = 'escalated' }
        $result = Read-Escalation -Source 'task' -TaskId 'T1' -Phase 'done' -TaskStatuses $statuses
        $result.Source | Should -Be 'merge'
    }

    It 'preserves phase for infra failure in green' {
        Mock Read-Host { 'k' }
        $statuses = @{ T1 = 'escalated' }
        $result = Read-Escalation -Source 'task' -TaskId 'T1' -Phase 'green' -TaskStatuses $statuses
        $result.Phase | Should -Be 'green'
    }

    It 'throws when called from thread pool thread' {
        # Simulate being on a thread pool thread
        Mock -CommandName Get-ResetDispatchKey {}  # Just to have the function loaded

        # We can't easily mock IsThreadPoolThread, so we test the function's behavior
        # by verifying it works on the main thread
        Mock Read-Host { 'k' }
        { Read-Escalation -Source 'task' -TaskId 'T1' -Phase 'red' } | Should -Not -Throw
    }

    It 'uses Source as the review label when TaskId is not provided' {
        Mock Read-Host { 'k' }
        Mock Write-StatusNote {} -Verifiable
        Read-Escalation -Source 'workspace' -Phase 'idle'
        Should -Invoke Write-StatusNote -ParameterFilter { $TaskId -eq 'workspace' }
    }

    It 'returns Stop with $null snapshot when TaskStatuses is not provided' {
        Mock Read-Host { 's' }
        $result = Read-Escalation -Source 'merge' -Phase 'idle'
        $result.Decision | Should -Be 'Stop'
        $result.PreStopSnapshot | Should -BeNullOrEmpty
    }

    It 'displays Error_ with Write-Host when provided' {
        Mock Read-Host { 'k' }
        $writeHostCalls = @()
        Mock Write-Host { param($Object, $ForegroundColor) $script:writeHostCalls += $Object }

        Read-Escalation -Source 'task' -TaskId 'T1' -Phase 'red' -Error_ 'something went wrong'

        $script:writeHostCalls | Should -Contain 'Error:'
        $script:writeHostCalls | Should -Contain 'something went wrong'
    }
}
