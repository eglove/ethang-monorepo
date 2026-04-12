# =============================================================================
# verdict-contract.ps1 — Review verdict contract definition
# BDD source: docs/reviewers/bdd.feature "Reviewer Agent Output" scenarios
# =============================================================================

. "$PSScriptRoot/../contract-engine.ps1"

$script:VerdictContract = New-ContractSchema `
    -Name 'ReviewVerdict' `
    -Consumer 'Resolve-PreMergeVerdict / Resolve-FinalMergeVerdict' `
    -Provider 'New-ReviewVerdict (via Invoke-ReviewGate)' `
    -Fields @(
        (New-FieldSpec -Name 'Verdict' -Type 'string' -AllowedValues @('pass', 'fail', 'retry'))
        (New-FieldSpec -Name 'Blockers' -Type 'array')
        (New-FieldSpec -Name 'Notes' -Type 'array')
        (New-FieldSpec -Name 'SelectedReviewers' -Type 'array')
        (New-FieldSpec -Name 'ExcludedReviewers' -Type 'array')
    ) `
    -CrossFieldRules @(
        {
            param($D)
            $v = if ($D -is [hashtable]) { $D['Verdict'] } else { $D.Verdict }
            $b = if ($D -is [hashtable]) { $D['Blockers'] } else { $D.Blockers }
            if ($v -eq 'fail' -and @($b).Count -eq 0) {
                return @{ Valid = $false; Message = 'Fail verdict must have at least one blocker (BDD: fail verdict scenario)' }
            }
            return @{ Valid = $true; Message = '' }
        },
        {
            param($D)
            $v = if ($D -is [hashtable]) { $D['Verdict'] } else { $D.Verdict }
            $b = if ($D -is [hashtable]) { $D['Blockers'] } else { $D.Blockers }
            if ($v -eq 'pass' -and @($b).Count -gt 0) {
                return @{ Valid = $false; Message = 'Pass verdict must have empty blockers (BDD: pass verdict scenario)' }
            }
            return @{ Valid = $true; Message = '' }
        }
    )
