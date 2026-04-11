BeforeAll {
    # Stub external dependencies before sourcing production modules
    function Invoke-Claude { }
    function Write-PipelineLog { }

    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-state.ps1"
    . "$PSScriptRoot/../utils/result-contracts.ps1"
    . "$PSScriptRoot/../utils/task-log.ps1"
    . "$PSScriptRoot/../utils/git-retry.ps1"
    . "$PSScriptRoot/../utils/merge-queue.ps1"

    Mock Write-Host {}
    Mock Write-TaskLog {}
}

# =============================================================================
# Complete-TaskMerge — TLA+ TaskMerged transition
# BDD: "Merge queue — task merges successfully"
#   tasksDone' = tasksDone + 1
#   pipelineState' = "running"
#   All other state variables UNCHANGED
# =============================================================================

Describe 'Complete-TaskMerge' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        # Pre-condition: pipeline is in mergeQueue state with lock held
        $script:state.pipelineState  = 'mergeQueue'
        $script:state.lockHolder     = 1
        $script:state.reviewGateType = 'none'
        $script:state.tasksDone      = 0
    }

    It 'increments tasksDone by 1 after successful merge' {
        Complete-TaskMerge -State $script:state -Config $script:cfg

        $script:state.tasksDone | Should -Be 1
    }

    It 'transitions pipelineState back to running' {
        Complete-TaskMerge -State $script:state -Config $script:cfg

        $script:state.pipelineState | Should -Be 'running'
    }

    It 'preserves lockHolder (UNCHANGED)' {
        Complete-TaskMerge -State $script:state -Config $script:cfg

        $script:state.lockHolder | Should -Be 1
    }

    It 'preserves reviewRound (UNCHANGED)' {
        $script:state.reviewRound = 2
        Complete-TaskMerge -State $script:state -Config $script:cfg

        $script:state.reviewRound | Should -Be 2
    }

    It 'preserves keepGoingResets (UNCHANGED)' {
        $script:state.keepGoingResets = 1
        Complete-TaskMerge -State $script:state -Config $script:cfg

        $script:state.keepGoingResets | Should -Be 1
    }

    It 'preserves tddKeepGoingCount (UNCHANGED)' {
        $script:state.tddKeepGoingCount = 3
        Complete-TaskMerge -State $script:state -Config $script:cfg

        $script:state.tddKeepGoingCount | Should -Be 3
    }

    It 'preserves verdict as null (UNCHANGED)' {
        Complete-TaskMerge -State $script:state -Config $script:cfg

        $script:state.verdict | Should -BeNullOrEmpty
    }

    It 'preserves gateTimedOut (UNCHANGED)' {
        Complete-TaskMerge -State $script:state -Config $script:cfg

        $script:state.gateTimedOut | Should -BeFalse
    }

    It 'preserves globalTimedOut (UNCHANGED)' {
        Complete-TaskMerge -State $script:state -Config $script:cfg

        $script:state.globalTimedOut | Should -BeFalse
    }

    It 'increments tasksDone from 2 to 3 on third merge' {
        $script:state.tasksDone = 2
        Complete-TaskMerge -State $script:state -Config $script:cfg

        $script:state.tasksDone | Should -Be 3
    }

    It 'maintains TypeOK after transition' {
        Complete-TaskMerge -State $script:state -Config $script:cfg

        Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
    }

    It 'throws terminal state error when pipeline is COMPLETE' {
        $script:state.pipelineState = 'COMPLETE'
        $script:state.lockHolder = $null

        { Complete-TaskMerge -State $script:state -Config $script:cfg } | Should -Throw -ExpectedMessage '*terminal*'
    }

    It 'throws terminal state error when pipeline is HALTED' {
        $script:state.pipelineState = 'HALTED'
        $script:state.lockHolder = $null

        { Complete-TaskMerge -State $script:state -Config $script:cfg } | Should -Throw -ExpectedMessage '*terminal*'
    }

    It 'throws guard error when pipelineState is not mergeQueue' {
        $script:state.pipelineState = 'running'

        { Complete-TaskMerge -State $script:state -Config $script:cfg } | Should -Throw -ExpectedMessage '*mergeQueue*'
    }
}

# =============================================================================
# Test-AllTasksDone — guard for EnterFinalReview vs EnterPreMergeReview
# TLA+: EnterFinalReview guard is tasksDone = NumTasks
#        EnterPreMergeReview guard is tasksDone < NumTasks
# =============================================================================

Describe 'Test-AllTasksDone' {
    BeforeEach {
        $script:cfg = Get-PipelineConfig
    }

    It 'returns false when tasksDone is 0 and NumTasks is 3' {
        $state = New-PipelineState
        $state.tasksDone = 0

        # Override NumTasks via env for this test
        $env:VIBE_NUM_TASKS = '3'
        try {
            $cfg = Get-PipelineConfig
            Test-AllTasksDone -State $state -Config $cfg | Should -BeFalse
        }
        finally { $env:VIBE_NUM_TASKS = $null }
    }

    It 'returns false when tasksDone < NumTasks' {
        $state = New-PipelineState
        $state.tasksDone = 2

        $env:VIBE_NUM_TASKS = '3'
        try {
            $cfg = Get-PipelineConfig
            Test-AllTasksDone -State $state -Config $cfg | Should -BeFalse
        }
        finally { $env:VIBE_NUM_TASKS = $null }
    }

    It 'returns true when tasksDone equals NumTasks' {
        $state = New-PipelineState
        $state.tasksDone = 3

        $env:VIBE_NUM_TASKS = '3'
        try {
            $cfg = Get-PipelineConfig
            Test-AllTasksDone -State $state -Config $cfg | Should -BeTrue
        }
        finally { $env:VIBE_NUM_TASKS = $null }
    }

    It 'returns true when tasksDone equals NumTasks for single-task tier' {
        $state = New-PipelineState
        $state.tasksDone = 1

        $env:VIBE_NUM_TASKS = '1'
        try {
            $cfg = Get-PipelineConfig
            Test-AllTasksDone -State $state -Config $cfg | Should -BeTrue
        }
        finally { $env:VIBE_NUM_TASKS = $null }
    }
}

# =============================================================================
# Merge queue + tasksDone integration — multi-task tier progression
# BDD: "Task enters merge queue after review pass and awaits its turn"
#      EnterPreMergeReview requires tasksDone < NumTasks
#      EnterFinalReview requires tasksDone = NumTasks
# =============================================================================

Describe 'Merge queue task counting integration' {
    BeforeEach {
        $env:VIBE_NUM_TASKS = '3'
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        $script:state.pipelineState = 'running'
        $script:state.lockHolder    = 1
        Reset-MergeQueue
    }

    AfterEach {
        $env:VIBE_NUM_TASKS = $null
    }

    It 'allows pre-merge review entry when tasksDone < NumTasks' {
        $script:state.tasksDone = 0

        # Guard should pass — more tasks remain
        Test-AllTasksDone -State $script:state -Config $script:cfg | Should -BeFalse
    }

    It 'blocks pre-merge review entry when tasksDone = NumTasks' {
        $script:state.tasksDone = 3

        # Guard should fail — all tasks done, final review next
        Test-AllTasksDone -State $script:state -Config $script:cfg | Should -BeTrue
    }

    It 'progresses tasksDone through sequential merges to completion' {
        # Simulate 3 tasks merging sequentially
        for ($i = 0; $i -lt 3; $i++) {
            $script:state.pipelineState = 'mergeQueue'
            Complete-TaskMerge -State $script:state -Config $script:cfg
            $script:state.tasksDone | Should -Be ($i + 1)
            $script:state.pipelineState | Should -Be 'running'
        }

        # After all 3 tasks, tasksDone = NumTasks
        Test-AllTasksDone -State $script:state -Config $script:cfg | Should -BeTrue
    }

    It 'resets review counters for next task after merge (fresh gate)' {
        # First task goes through review with some rounds used
        $script:state.reviewRound      = 2
        $script:state.keepGoingResets   = 1
        $script:state.tddKeepGoingCount = 3
        $script:state.pipelineState    = 'mergeQueue'

        Complete-TaskMerge -State $script:state -Config $script:cfg

        # After merge, state is 'running' — the next EnterPreMergeReview
        # will reset these counters (tested in review-gate), but tasksDone persists
        $script:state.tasksDone | Should -Be 1
        $script:state.pipelineState | Should -Be 'running'
    }

    It 'TypeOK holds at every step of multi-task progression' {
        for ($i = 0; $i -lt 3; $i++) {
            $script:state.pipelineState = 'mergeQueue'
            Complete-TaskMerge -State $script:state -Config $script:cfg
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }
    }

    It 'tasksDone never exceeds NumTasks (boundary guard)' {
        $script:state.tasksDone = 3
        $script:state.pipelineState = 'mergeQueue'

        # Attempting to merge when all tasks are done should be rejected with boundary message
        { Complete-TaskMerge -State $script:state -Config $script:cfg } | Should -Throw -ExpectedMessage '*tasksDone*'
    }
}

# =============================================================================
# Complete-MergeRelease — releases merge-in-progress lock after task completes
# Ensures the queue can proceed to the next task after a merge finishes
# =============================================================================

Describe 'Complete-MergeRelease' {
    BeforeEach {
        Reset-MergeQueue
    }

    It 'clears merge-in-progress so next task can dequeue' {
        Add-MergeQueue -TaskId 'T1'
        Add-MergeQueue -TaskId 'T2'
        Start-NextMerge  # T1 in progress

        Complete-MergeRelease -TaskId 'T1'

        # T1 released, T2 should be dequeueable
        Get-MergeInProgress | Should -BeNullOrEmpty
        Start-NextMerge | Should -Be 'T2'
    }

    It 'is idempotent when called with non-active task' {
        Add-MergeQueue -TaskId 'T1'
        Start-NextMerge

        # Releasing a task that is not in progress should not error
        { Complete-MergeRelease -TaskId 'T99' } | Should -Not -Throw
        Get-MergeInProgress | Should -Be 'T1'
    }

    It 'allows re-enqueue of a released task (for retry scenarios)' {
        Add-MergeQueue -TaskId 'T1'
        Start-NextMerge
        Complete-MergeRelease -TaskId 'T1'

        # After release, should be able to re-enqueue
        Add-MergeQueue -TaskId 'T1' | Should -BeTrue
    }
}
