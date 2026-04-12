# =============================================================================
# merge-result-contract.ps1 — MergeResult contract
# =============================================================================

. "$PSScriptRoot/../contract-engine.ps1"

$script:MergeResultContract = New-ContractSchema `
    -Name 'MergeResult' `
    -Consumer 'Invoke-CodingStage (merge queue drain)' `
    -Provider 'Merge queue runner' `
    -Fields @(
        (New-FieldSpec -Name 'TaskId' -Type 'string')
        (New-FieldSpec -Name 'Success' -Type 'bool')
        (New-FieldSpec -Name 'Conflict' -Type 'bool')
        (New-FieldSpec -Name 'RetryCount' -Type 'int')
        (New-FieldSpec -Name 'AbortedClean' -Type 'bool')
        (New-FieldSpec -Name 'WorkspaceRemoved' -Type 'bool' -Required $false)
    ) `
    -CrossFieldRules @(
        {
            param($D)
            $conflict = if ($D -is [hashtable]) { $D['Conflict'] } else { $D.Conflict }
            $aborted = if ($D -is [hashtable]) { $D['AbortedClean'] } else { $D.AbortedClean }
            # If conflict and not aborted clean, that's a valid state (conflict was resolved)
            # No cross-field violation needed here
            return @{ Valid = $true; Message = '' }
        }
    )
