# =============================================================================
# review-fix-input-contract.ps1 — ReviewFixCycle input contract
# BDD: "Review-Fix Cycle" scenarios — blockers must be non-empty
# =============================================================================

. "$PSScriptRoot/../contract-engine.ps1"

$script:ReviewFixInputContract = New-ContractSchema `
    -Name 'ReviewFixInput' `
    -Consumer 'Invoke-ReviewFixCycle' `
    -Provider 'Resolve-PreMergeVerdict / Resolve-FinalMergeVerdict (on fail)' `
    -Fields @(
        (New-FieldSpec -Name 'Action' -Type 'string' -AllowedValues @('reviewFix', 'finalReviewFix'))
        (New-FieldSpec -Name 'Blockers' -Type 'array')
    ) `
    -CrossFieldRules @(
        {
            param($D)
            $blockers = if ($D -is [hashtable]) { $D['Blockers'] } else { $D.Blockers }
            if (@($blockers).Count -eq 0) {
                return @{ Valid = $false; Message = 'ReviewFixInput requires non-empty Blockers array (BDD: review-fix cycle)' }
            }
            return @{ Valid = $true; Message = '' }
        }
    )
