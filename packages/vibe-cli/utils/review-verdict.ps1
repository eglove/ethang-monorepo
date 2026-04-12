# =============================================================================
# review-verdict.ps1 — Review verdict data model
# Transforms moderator JSON into normalized PowerShell objects,
# validates schema, and classifies severity levels.
# =============================================================================

$ErrorActionPreference = 'Stop'

# Valid verdict values (TLA+ Verdicts constant)
$script:ValidVerdicts = @('pass', 'fail')

# Required fields for a finding (blocker or note)
$script:RequiredFindingFields = @('reviewer', 'severity', 'description', 'files', 'suggestion')

# Required top-level fields in moderator response
$script:RequiredTopLevelFields = @('selectedReviewers', 'excludedReviewers', 'verdict', 'blockers', 'notes')

# Blocker-level severities (critical/high → blocker, medium/low → note)
$script:BlockerSeverities = @('critical', 'high')

function New-ReviewVerdict {
    <#
    .SYNOPSIS
        Creates a normalized verdict object from moderator JSON response.
    .DESCRIPTION
        Transforms camelCase moderator response keys into PascalCase PowerShell
        properties. Normalizes blockers and notes into structured finding objects.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [hashtable]$ModeratorResponse
    )

    $blockers = @($ModeratorResponse.blockers | ForEach-Object {
        [PSCustomObject]@{
            Reviewer    = $_.reviewer
            Severity    = $_.severity
            Description = $_.description
            Files       = @($_.files)
            Suggestion  = $_.suggestion
        }
    })

    $notes = @($ModeratorResponse.notes | ForEach-Object {
        [PSCustomObject]@{
            Reviewer    = $_.reviewer
            Severity    = $_.severity
            Description = $_.description
            Files       = @($_.files)
            Suggestion  = $_.suggestion
        }
    })

    $excluded = @($ModeratorResponse.excludedReviewers | ForEach-Object {
        [PSCustomObject]@{
            Reviewer = $_.reviewer
            Reason   = $_.reason
        }
    })

    [PSCustomObject]@{
        Verdict           = $ModeratorResponse.verdict
        Blockers          = $blockers
        Notes             = $notes
        SelectedReviewers = @($ModeratorResponse.selectedReviewers)
        ExcludedReviewers = $excluded
    }
}

function Test-ReviewVerdict {
    <#
    .SYNOPSIS
        Validates a moderator response against the expected schema.
    .DESCRIPTION
        Returns $true if the response has all required fields and valid values,
        $false otherwise. Maps to the TLA+ TypeOK invariant.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $false)]
        $ModeratorResponse
    )

    # Null or non-hashtable guard
    if ($null -eq $ModeratorResponse -or $ModeratorResponse -isnot [hashtable]) {
        return $false
    }

    # Check required top-level fields exist
    foreach ($field in $script:RequiredTopLevelFields) {
        if (-not $ModeratorResponse.ContainsKey($field)) {
            return $false
        }
    }

    # Validate verdict value
    if ($ModeratorResponse.verdict -notin $script:ValidVerdicts) {
        return $false
    }

    # Validate each blocker has required finding fields
    foreach ($blocker in $ModeratorResponse.blockers) {
        foreach ($field in $script:RequiredFindingFields) {
            if (-not $blocker.ContainsKey($field)) {
                return $false
            }
        }
    }

    # Validate each note has required finding fields
    foreach ($note in $ModeratorResponse.notes) {
        foreach ($field in $script:RequiredFindingFields) {
            if (-not $note.ContainsKey($field)) {
                return $false
            }
        }
    }

    return $true
}

function Get-VerdictSummary {
    <#
    .SYNOPSIS
        Returns a human-readable one-line summary of a verdict.
    .DESCRIPTION
        Format: "Verdict: <verdict> | <N> blocker(s) | <N> note(s)"
        Used for pipeline.log output.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        $Verdict
    )

    $blockerCount = @($Verdict.Blockers).Count
    $noteCount    = @($Verdict.Notes).Count
    $blockerLabel = if ($blockerCount -eq 1) { '1 blocker' } else { "$blockerCount blockers" }
    $noteLabel    = if ($noteCount -eq 1) { '1 note' } else { "$noteCount notes" }

    "Verdict: $($Verdict.Verdict) | $blockerLabel | $noteLabel"
}

function ConvertTo-ReviewVerdict {
    <#
    .SYNOPSIS
        Parses a raw JSON string into a validated verdict object.
    .DESCRIPTION
        Combines JSON parsing, schema validation, and verdict construction.
        Returns $null if parsing or validation fails.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $false)]
        [AllowEmptyString()]
        [AllowNull()]
        [string]$JsonString
    )

    if ([string]::IsNullOrWhiteSpace($JsonString)) {
        return $null
    }

    try {
        $parsed = $JsonString | ConvertFrom-Json -AsHashtable
    }
    catch {
        return $null
    }

    if (-not (Test-ReviewVerdict -ModeratorResponse $parsed)) {
        return $null
    }

    New-ReviewVerdict -ModeratorResponse $parsed
}

function Test-BlockerSeverity {
    <#
    .SYNOPSIS
        Returns $true if the severity level qualifies as a blocker.
    .DESCRIPTION
        Critical and high severities are blockers; medium, low, and
        anything else are not.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Severity
    )

    $Severity -in $script:BlockerSeverities
}
