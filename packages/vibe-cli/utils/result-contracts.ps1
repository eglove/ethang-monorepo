$script:PhaseSet = @('idle', 'red', 'red_retry', 'green', 'green_retry', 'cleanup', 'cleanup_remed', 'agent_call', 'done')
$script:StatusSet = @('pending', 'running', 'completed', 'escalated', 'skipped')
$script:DecisionSet = @('KeepGoing', 'Stop', 'NoOp')
$script:SourceSet = @('task', 'merge', 'final', 'workspace')
$script:ValidationStatusSet = @('valid', 'failed')

function ConvertTo-TaskResult {
    param([Parameter(Mandatory)][hashtable]$Input_)

    if (-not $Input_.ContainsKey('TaskId') -or $Input_.TaskId -isnot [string]) {
        throw [System.ArgumentException]::new("TaskResult requires 'TaskId' as [string]")
    }
    if (-not $Input_.ContainsKey('Phase') -or $Input_.Phase -notin $script:PhaseSet) {
        throw [System.ArgumentException]::new(
            "TaskResult requires 'Phase' in ($($script:PhaseSet -join ', ')). Got: '$($Input_.Phase)'"
        )
    }
    if (-not $Input_.ContainsKey('Status') -or $Input_.Status -notin $script:StatusSet) {
        throw [System.ArgumentException]::new(
            "TaskResult requires 'Status' in ($($script:StatusSet -join ', ')). Got: '$($Input_.Status)'"
        )
    }
    if (-not $Input_.ContainsKey('Counters') -or $Input_.Counters -isnot [hashtable]) {
        throw [System.ArgumentException]::new("TaskResult requires 'Counters' as [hashtable]")
    }
    if (-not $Input_.ContainsKey('Escalated') -or $Input_.Escalated -isnot [bool]) {
        throw [System.ArgumentException]::new("TaskResult requires 'Escalated' as [bool]")
    }

    return @{
        TaskId    = $Input_.TaskId
        Phase     = $Input_.Phase
        Status    = $Input_.Status
        Counters  = $Input_.Counters
        Escalated = $Input_.Escalated
        Error     = if ($Input_.ContainsKey('Error')) { $Input_.Error } else { $null }
        TimedOut  = if ($Input_.ContainsKey('TimedOut')) { $Input_.TimedOut } else { $false }
        TestFiles = if ($Input_.ContainsKey('TestFiles')) { @($Input_.TestFiles) } else { @() }
    }
}

function ConvertTo-EscalationResult {
    param([Parameter(Mandatory)][hashtable]$Input_)

    if (-not $Input_.ContainsKey('Decision') -or $Input_.Decision -notin $script:DecisionSet) {
        throw [System.ArgumentException]::new(
            "EscalationResult requires 'Decision' in ($($script:DecisionSet -join ', ')). Got: '$($Input_.Decision)'"
        )
    }
    if (-not $Input_.ContainsKey('Source') -or $Input_.Source -notin $script:SourceSet) {
        throw [System.ArgumentException]::new(
            "EscalationResult requires 'Source' in ($($script:SourceSet -join ', ')). Got: '$($Input_.Source)'"
        )
    }

    return @{
        Decision        = $Input_.Decision
        TaskId          = if ($Input_.ContainsKey('TaskId')) { $Input_.TaskId } else { $null }
        Phase           = if ($Input_.ContainsKey('Phase')) { $Input_.Phase } else { $null }
        Source          = $Input_.Source
        Reason          = if ($Input_.ContainsKey('Reason')) { $Input_.Reason } else { $null }
        PreStopSnapshot = if ($Input_.ContainsKey('PreStopSnapshot')) { $Input_.PreStopSnapshot } else { $null }
    }
}

function ConvertTo-MergeResult {
    param([Parameter(Mandatory)][hashtable]$Input_)

    if (-not $Input_.ContainsKey('TaskId') -or $Input_.TaskId -isnot [string]) {
        throw [System.ArgumentException]::new("MergeResult requires 'TaskId' as [string]")
    }
    if (-not $Input_.ContainsKey('Success') -or $Input_.Success -isnot [bool]) {
        throw [System.ArgumentException]::new("MergeResult requires 'Success' as [bool]")
    }
    if (-not $Input_.ContainsKey('Conflict') -or $Input_.Conflict -isnot [bool]) {
        throw [System.ArgumentException]::new("MergeResult requires 'Conflict' as [bool]")
    }
    if (-not $Input_.ContainsKey('RetryCount') -or $Input_.RetryCount -isnot [int]) {
        throw [System.ArgumentException]::new("MergeResult requires 'RetryCount' as [int]")
    }
    if (-not $Input_.ContainsKey('AbortedClean') -or $Input_.AbortedClean -isnot [bool]) {
        throw [System.ArgumentException]::new("MergeResult requires 'AbortedClean' as [bool]")
    }

    return @{
        TaskId           = $Input_.TaskId
        Success          = $Input_.Success
        Conflict         = $Input_.Conflict
        RetryCount       = $Input_.RetryCount
        AbortedClean     = $Input_.AbortedClean
        WorkspaceRemoved = if ($Input_.ContainsKey('WorkspaceRemoved')) { $Input_.WorkspaceRemoved } else { $false }
    }
}

function ConvertTo-ValidationResult {
    param([Parameter(Mandatory)][hashtable]$Input_)

    if (-not $Input_.ContainsKey('Status') -or $Input_.Status -notin $script:ValidationStatusSet) {
        throw [System.ArgumentException]::new(
            "ValidationResult requires 'Status' in ($($script:ValidationStatusSet -join ', ')). Got: '$($Input_.Status)'"
        )
    }
    if (-not $Input_.ContainsKey('Errors') -or $Input_.Errors -isnot [array]) {
        throw [System.ArgumentException]::new("ValidationResult requires 'Errors' as [array]")
    }
    if (-not $Input_.ContainsKey('Warnings') -or $Input_.Warnings -isnot [array]) {
        throw [System.ArgumentException]::new("ValidationResult requires 'Warnings' as [array]")
    }

    return @{
        Status   = $Input_.Status
        Errors   = $Input_.Errors
        Warnings = $Input_.Warnings
    }
}
