BeforeAll {
    . "$PSScriptRoot/../utils/result-contracts.ps1"
}

Describe 'ConvertTo-TaskResult' {
    It 'constructs a valid TaskResult' {
        $r = ConvertTo-TaskResult @{
            TaskId = 'T3'; Phase = 'green'; Status = 'running'
            Counters = @{ greenAttempts = 1 }; Escalated = $false
        }
        $r.TaskId | Should -Be 'T3'
        $r.Phase | Should -Be 'green'
        $r.Status | Should -Be 'running'
        $r.Escalated | Should -BeFalse
        $r.TimedOut | Should -BeFalse
        $r.Error | Should -BeNullOrEmpty
    }

    It 'throws on missing TaskId' {
        { ConvertTo-TaskResult @{
            Phase = 'red'; Status = 'running'
            Counters = @{}; Escalated = $false
        } } | Should -Throw '*TaskId*'
    }

    It 'throws on non-string TaskId' {
        { ConvertTo-TaskResult @{
            TaskId = 42; Phase = 'red'; Status = 'running'
            Counters = @{}; Escalated = $false
        } } | Should -Throw '*TaskId*string*'
    }

    It 'throws on invalid Phase' {
        { ConvertTo-TaskResult @{
            TaskId = 'T1'; Phase = 'banana'; Status = 'running'
            Counters = @{}; Escalated = $false
        } } | Should -Throw '*Phase*banana*'
    }

    It 'throws on invalid Status' {
        { ConvertTo-TaskResult @{
            TaskId = 'T1'; Phase = 'red'; Status = 'invalid'
            Counters = @{}; Escalated = $false
        } } | Should -Throw '*Status*invalid*'
    }

    It 'throws on missing Counters' {
        { ConvertTo-TaskResult @{
            TaskId = 'T1'; Phase = 'red'; Status = 'running'; Escalated = $false
        } } | Should -Throw '*Counters*'
    }

    It 'throws on missing Escalated' {
        { ConvertTo-TaskResult @{
            TaskId = 'T1'; Phase = 'red'; Status = 'running'; Counters = @{}
        } } | Should -Throw '*Escalated*'
    }

    It 'defaults TimedOut to false when omitted' {
        $r = ConvertTo-TaskResult @{
            TaskId = 'T1'; Phase = 'red'; Status = 'running'
            Counters = @{}; Escalated = $false
        }
        $r.TimedOut | Should -BeFalse
    }

    It 'preserves TimedOut when provided' {
        $r = ConvertTo-TaskResult @{
            TaskId = 'T1'; Phase = 'red'; Status = 'escalated'
            Counters = @{}; Escalated = $true; TimedOut = $true
        }
        $r.TimedOut | Should -BeTrue
    }

    It 'is idempotent' {
        $r1 = ConvertTo-TaskResult @{
            TaskId = 'T1'; Phase = 'done'; Status = 'completed'
            Counters = @{}; Escalated = $false
        }
        $r2 = ConvertTo-TaskResult $r1
        $r2.TaskId | Should -Be 'T1'
        $r2.Phase | Should -Be 'done'
    }

    It 'accepts all valid Phase values' {
        $phases = @('idle', 'red', 'red_retry', 'green', 'green_retry', 'cleanup', 'cleanup_remed', 'agent_call', 'done')
        foreach ($p in $phases) {
            $r = ConvertTo-TaskResult @{
                TaskId = 'T1'; Phase = $p; Status = 'running'
                Counters = @{}; Escalated = $false
            }
            $r.Phase | Should -Be $p
        }
    }
}

Describe 'ConvertTo-TaskResult — TestFiles passthrough' {
    It 'preserves TestFiles when provided' {
        $r = ConvertTo-TaskResult @{
            TaskId = 'T1'; Phase = 'green'; Status = 'running'
            Counters = @{}; Escalated = $false
            TestFiles = @('tests/config.Tests.ps1')
        }
        $r.TestFiles | Should -Not -BeNullOrEmpty
        $r.TestFiles | Should -Contain 'tests/config.Tests.ps1'
    }

    It 'defaults TestFiles to empty array when omitted' {
        $r = ConvertTo-TaskResult @{
            TaskId = 'T1'; Phase = 'green'; Status = 'running'
            Counters = @{}; Escalated = $false
        }
        $r.ContainsKey('TestFiles') | Should -BeTrue
        $r.TestFiles.Count | Should -Be 0
    }
}

Describe 'ConvertTo-EscalationResult' {
    It 'constructs a valid KeepGoing result' {
        $r = ConvertTo-EscalationResult @{
            Decision = 'KeepGoing'; Source = 'task'; TaskId = 'T3'; Phase = 'green'
        }
        $r.Decision | Should -Be 'KeepGoing'
        $r.Source | Should -Be 'task'
        $r.TaskId | Should -Be 'T3'
        $r.PreStopSnapshot | Should -BeNullOrEmpty
    }

    It 'constructs a valid Stop result with PreStopSnapshot' {
        $snapshot = @{ T1 = 'running'; T2 = 'completed' }
        $r = ConvertTo-EscalationResult @{
            Decision = 'Stop'; Source = 'task'; PreStopSnapshot = $snapshot
        }
        $r.Decision | Should -Be 'Stop'
        $r.PreStopSnapshot | Should -Not -BeNullOrEmpty
    }

    It 'constructs a valid NoOp result' {
        $r = ConvertTo-EscalationResult @{
            Decision = 'NoOp'; Source = 'task'; Reason = 'Task already recovered'
        }
        $r.Decision | Should -Be 'NoOp'
        $r.Reason | Should -Be 'Task already recovered'
    }

    It 'throws on invalid Decision' {
        { ConvertTo-EscalationResult @{
            Decision = 'Retry'; Source = 'task'
        } } | Should -Throw '*Decision*Retry*'
    }

    It 'throws on invalid Source' {
        { ConvertTo-EscalationResult @{
            Decision = 'KeepGoing'; Source = 'unknown'
        } } | Should -Throw '*Source*unknown*'
    }

    It 'throws on missing Decision' {
        { ConvertTo-EscalationResult @{ Source = 'task' } } | Should -Throw '*Decision*'
    }

    It 'accepts all valid Source values' {
        foreach ($s in @('task', 'merge', 'final', 'workspace')) {
            $r = ConvertTo-EscalationResult @{ Decision = 'KeepGoing'; Source = $s }
            $r.Source | Should -Be $s
        }
    }
}

Describe 'ConvertTo-MergeResult' {
    It 'constructs a valid MergeResult' {
        $r = ConvertTo-MergeResult @{
            TaskId = 'T2'; Success = $true; Conflict = $false
            RetryCount = 0; AbortedClean = $true
        }
        $r.TaskId | Should -Be 'T2'
        $r.Success | Should -BeTrue
        $r.WorkspaceRemoved | Should -BeFalse
    }

    It 'includes WorkspaceRemoved when provided' {
        $r = ConvertTo-MergeResult @{
            TaskId = 'T2'; Success = $true; Conflict = $false
            RetryCount = 0; AbortedClean = $true; WorkspaceRemoved = $true
        }
        $r.WorkspaceRemoved | Should -BeTrue
    }

    It 'defaults WorkspaceRemoved to false' {
        $r = ConvertTo-MergeResult @{
            TaskId = 'T1'; Success = $false; Conflict = $true
            RetryCount = 2; AbortedClean = $true
        }
        $r.WorkspaceRemoved | Should -BeFalse
    }

    It 'throws on missing TaskId' {
        { ConvertTo-MergeResult @{
            Success = $true; Conflict = $false; RetryCount = 0; AbortedClean = $true
        } } | Should -Throw '*TaskId*'
    }

    It 'throws on non-int RetryCount' {
        { ConvertTo-MergeResult @{
            TaskId = 'T1'; Success = $true; Conflict = $false
            RetryCount = 'two'; AbortedClean = $true
        } } | Should -Throw '*RetryCount*int*'
    }

    It 'throws on missing AbortedClean' {
        { ConvertTo-MergeResult @{
            TaskId = 'T1'; Success = $true; Conflict = $false; RetryCount = 0
        } } | Should -Throw '*AbortedClean*'
    }
}

Describe 'ConvertTo-ValidationResult' {
    It 'constructs a valid result' {
        $r = ConvertTo-ValidationResult @{
            Status = 'valid'; Errors = @(); Warnings = @()
        }
        $r.Status | Should -Be 'valid'
        $r.Errors.Count | Should -Be 0
        $r.Warnings.Count | Should -Be 0
    }

    It 'includes Warnings array' {
        $r = ConvertTo-ValidationResult @{
            Status = 'valid'; Errors = @()
            Warnings = @('File overlap: T1 and T2 both modify config.ps1')
        }
        $r.Warnings.Count | Should -Be 1
        $r.Warnings[0] | Should -Match 'overlap'
    }

    It 'throws on invalid Status' {
        { ConvertTo-ValidationResult @{
            Status = 'pending'; Errors = @(); Warnings = @()
        } } | Should -Throw '*Status*pending*'
    }

    It 'throws on missing Errors' {
        { ConvertTo-ValidationResult @{
            Status = 'valid'; Warnings = @()
        } } | Should -Throw '*Errors*'
    }

    It 'throws on missing Warnings' {
        { ConvertTo-ValidationResult @{
            Status = 'valid'; Errors = @()
        } } | Should -Throw '*Warnings*'
    }

    It 'throws when Errors is not an array' {
        { ConvertTo-ValidationResult @{
            Status = 'failed'; Errors = 'single error'; Warnings = @()
        } } | Should -Throw '*Errors*array*'
    }

    It 'is idempotent' {
        $r1 = ConvertTo-ValidationResult @{
            Status = 'failed'; Errors = @('bad'); Warnings = @()
        }
        $r2 = ConvertTo-ValidationResult $r1
        $r2.Status | Should -Be 'failed'
        $r2.Errors[0] | Should -Be 'bad'
    }
}
