. "$PSScriptRoot/result-contracts.ps1"
. "$PSScriptRoot/task-log.ps1"

$script:PhaseSet = @('idle', 'red', 'red_retry', 'green', 'green_retry', 'cleanup', 'cleanup_remed', 'agent_call', 'done')
$script:ValidSources = @('task', 'merge', 'final', 'workspace')

function Get-ResetDispatchKey {
    param(
        [Parameter(Mandatory)][string]$Source,
        [string]$Phase = ''
    )

    if ($Source -notin $script:ValidSources) {
        throw [System.ArgumentException]::new("Invalid escalation source: '$Source'. Must be one of: $($script:ValidSources -join ', ')")
    }

    if ($Phase -and $Phase -notin $script:PhaseSet) {
        throw [System.ArgumentException]::new("Invalid phase: '$Phase'. Must be one of: $($script:PhaseSet -join ', ')")
    }

    return "${Source}:${Phase}"
}

function Read-Escalation {
    param(
        [Parameter(Mandatory)][string]$Source,
        [string]$TaskId,
        [string]$Phase,
        [string]$Error_,
        [hashtable]$TaskStatuses,
        [string]$FeatureDir,
        [string]$RunId
    )

    # Thread-safety guard: Read-Host cannot be called from thread jobs
    if ([System.Threading.Thread]::CurrentThread.IsThreadPoolThread) {
        throw [System.InvalidOperationException]::new(
            "Read-Escalation cannot be called from a thread job. Return escalation result to the main thread."
        )
    }

    # Idempotency guard: skip if task already recovered
    if ($TaskId -and $TaskStatuses -and $TaskStatuses.ContainsKey($TaskId)) {
        $currentStatus = $TaskStatuses[$TaskId]
        if ($currentStatus -eq 'running' -or $currentStatus -eq 'completed') {
            return ConvertTo-EscalationResult @{
                Decision = 'NoOp'
                Source   = $Source
                TaskId   = $TaskId
                Phase    = $Phase
                Reason   = "Task already recovered (status: $currentStatus)"
            }
        }
    }

    # Routing guard: done-phase task should route to merge escalation
    if ($Source -eq 'task' -and $Phase -eq 'done') {
        $Source = 'merge'
    }

    # Display escalation context
    $reviewLabel = if ($TaskId) { $TaskId } else { $Source }
    Write-StatusNote -TaskId $reviewLabel -Status 'Review'
    Write-Host "`n========== ESCALATION ==========" -ForegroundColor Red
    Write-Host "Source:  $Source" -ForegroundColor Yellow
    if ($TaskId) { Write-Host "Task:   $TaskId" -ForegroundColor Yellow }
    if ($Phase) { Write-Host "Phase:  $Phase" -ForegroundColor Yellow }
    if ($Error_) {
        Write-Host "Error:" -ForegroundColor Yellow
        Write-Host $Error_ -ForegroundColor Gray
    }
    Write-Host "================================" -ForegroundColor Red

    $choice = Read-Host "`nKeep Going (k) or Stop (s)?"

    if ($choice -match '^[kK]') {
        return ConvertTo-EscalationResult @{
            Decision = 'KeepGoing'
            Source   = $Source
            TaskId   = $TaskId
            Phase    = $Phase
            Status   = 'running'
        }
    }
    else {
        $snapshot = if ($TaskStatuses) { $TaskStatuses.Clone() } else { $null }

        return ConvertTo-EscalationResult @{
            Decision        = 'Stop'
            Source           = $Source
            TaskId           = $TaskId
            Phase            = $Phase
            PreStopSnapshot  = $snapshot
        }
    }
}
