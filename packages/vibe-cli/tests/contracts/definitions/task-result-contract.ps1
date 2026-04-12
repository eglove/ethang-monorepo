# =============================================================================
# task-result-contract.ps1 — TaskResult contract (mirrors result-contracts.ps1)
# =============================================================================

. "$PSScriptRoot/../contract-engine.ps1"

$script:TaskResultContract = New-ContractSchema `
    -Name 'TaskResult' `
    -Consumer 'Invoke-CodingStage (orchestrator)' `
    -Provider 'TDD phase runners / Agent writer' `
    -Fields @(
        (New-FieldSpec -Name 'TaskId' -Type 'string')
        (New-FieldSpec -Name 'Phase' -Type 'string' -AllowedValues @(
            'idle', 'red', 'red_retry', 'green', 'green_retry',
            'cleanup', 'cleanup_remed', 'agent_call', 'done'))
        (New-FieldSpec -Name 'Status' -Type 'string' -AllowedValues @(
            'pending', 'running', 'completed', 'escalated', 'skipped'))
        (New-FieldSpec -Name 'Counters' -Type 'hashtable')
        (New-FieldSpec -Name 'Escalated' -Type 'bool')
        (New-FieldSpec -Name 'Error' -Type 'null-or-string' -Required $false)
        (New-FieldSpec -Name 'TimedOut' -Type 'bool' -Required $false)
        (New-FieldSpec -Name 'TestFiles' -Type 'null-or-array' -Required $false)
    ) `
    -CrossFieldRules @(
        {
            param($D)
            $phase = if ($D -is [hashtable]) { $D['Phase'] } else { $D.Phase }
            $status = if ($D -is [hashtable]) { $D['Status'] } else { $D.Status }
            if ($phase -eq 'done' -and $status -notin @('completed', 'escalated', 'skipped')) {
                return @{ Valid = $false; Message = "Phase 'done' requires Status in (completed, escalated, skipped), got '$status'" }
            }
            return @{ Valid = $true; Message = '' }
        }
    )
