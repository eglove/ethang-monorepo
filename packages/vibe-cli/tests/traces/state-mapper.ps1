# =============================================================================
# state-mapper.ps1 — Maps TLA+ state snapshots to PowerShell pipeline state
# =============================================================================

$ErrorActionPreference = 'Stop'

function ConvertFrom-TlaReviewerState {
    <#
    .SYNOPSIS
        Maps a TLA+ PipelineReviewers state snapshot to a PowerShell pipeline state hashtable.
    #>
    param([Parameter(Mandatory)][hashtable]$TlaState)

    # JSON null -> PowerShell $null; TLA+ "NULL" string -> $null
    $lh = $TlaState.lockHolder
    $lockVal = if ($null -eq $lh -or $lh -eq 'NULL') { $null } else { [int]$lh }

    $v = $TlaState.verdict
    $verdictVal = if ($null -eq $v -or $v -eq 'NULL') { $null } else { [string]$v }

    return @{
        pipelineState     = [string]$TlaState.pipelineState
        lockHolder        = $lockVal
        reviewRound       = [int]$TlaState.reviewRound
        keepGoingResets    = [int]$TlaState.keepGoingResets
        tddKeepGoingCount = [int]$TlaState.tddKeepGoingCount
        verdict           = $verdictVal
        tasksDone         = [int]$TlaState.tasksDone
        gateTimedOut      = [bool]$TlaState.gateTimedOut
        globalTimedOut    = [bool]$TlaState.globalTimedOut
        reviewGateType    = [string]$TlaState.reviewGateType
    }
}

function Compare-PipelineState {
    <#
    .SYNOPSIS
        Compares PowerShell state to expected TLA+ state. Returns array of mismatches.
    #>
    param(
        [Parameter(Mandatory)][hashtable]$Actual,
        [Parameter(Mandatory)][hashtable]$Expected,
        [int]$StepNum,
        [string]$ActionName
    )

    $mismatches = [System.Collections.ArrayList]::new()
    $fields = @('pipelineState', 'lockHolder', 'reviewRound', 'keepGoingResets',
                'tddKeepGoingCount', 'verdict', 'tasksDone', 'gateTimedOut',
                'globalTimedOut', 'reviewGateType')

    foreach ($field in $fields) {
        $act = $Actual[$field]
        $exp = $Expected[$field]

        # Handle null comparison
        $mismatch = $false
        if ($null -eq $act -and $null -eq $exp) { continue }
        if ($null -eq $act -or $null -eq $exp) { $mismatch = $true }
        elseif ($act -ne $exp) { $mismatch = $true }

        if ($mismatch) {
            $null = $mismatches.Add(@{
                StepNum    = $StepNum
                Action     = $ActionName
                Field      = $field
                Expected   = $exp
                Actual     = $act
            })
        }
    }

    return $mismatches.ToArray()
}
