# =============================================================================
# escalation-result-contract.ps1 — EscalationResult contract
# =============================================================================

. "$PSScriptRoot/../contract-engine.ps1"

$script:EscalationResultContract = New-ContractSchema `
    -Name 'EscalationResult' `
    -Consumer 'Invoke-ReviewEscalation / Invoke-CodingStage' `
    -Provider 'Read-Escalation' `
    -Fields @(
        (New-FieldSpec -Name 'Decision' -Type 'string' -AllowedValues @('KeepGoing', 'Stop', 'NoOp'))
        (New-FieldSpec -Name 'Source' -Type 'string' -AllowedValues @('task', 'merge', 'final', 'workspace'))
        (New-FieldSpec -Name 'TaskId' -Type 'null-or-string' -Required $false)
        (New-FieldSpec -Name 'Phase' -Type 'null-or-string' -Required $false)
        (New-FieldSpec -Name 'Reason' -Type 'null-or-string' -Required $false)
        (New-FieldSpec -Name 'PreStopSnapshot' -Type 'any' -Required $false)
    ) `
    -CrossFieldRules @(
        {
            param($D)
            $decision = if ($D -is [hashtable]) { $D['Decision'] } else { $D.Decision }
            $source = if ($D -is [hashtable]) { $D['Source'] } else { $D.Source }
            if ($decision -eq 'Stop' -and [string]::IsNullOrEmpty($source)) {
                return @{ Valid = $false; Message = "Stop decision must have Source field (BDD: escalation scenarios)" }
            }
            return @{ Valid = $true; Message = '' }
        }
    )
