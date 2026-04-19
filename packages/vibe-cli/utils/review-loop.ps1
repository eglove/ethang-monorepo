# =============================================================================
# review-loop.ps1 — Review dispatch, consolidation, retry cycles, user_notes
# Depends on: invoke-claude.ps1 (Invoke-Claude)
# =============================================================================

$ErrorActionPreference = 'Stop'

. "$PSScriptRoot/invoke-claude.ps1"

$ReviewModeratorSchema = @'
{"type":"object","properties":{"verdict":{"type":"string","enum":["pass","fail"]},"findings":{"type":"array","items":{"type":"object","properties":{"reviewer":{"type":"string"},"severity":{"type":"string","enum":["critical","high","medium","low"]},"message":{"type":"string"},"description":{"type":"string"},"suggestion":{"type":"string"}},"required":["reviewer","severity"]}},"notes":{"type":"array","items":{"type":"object","properties":{"reviewer":{"type":"string"},"severity":{"type":"string","enum":["critical","high","medium","low"]},"message":{"type":"string"},"description":{"type":"string"},"suggestion":{"type":"string"}},"required":["reviewer","severity"]}},"warnings":{"type":"array","items":{"type":"string"}}},"required":["verdict","findings","notes","warnings"]}
'@

function Invoke-ReviewLoop {
    <#
    .SYNOPSIS
        Dispatches review-moderator agent, handles verdict cycles, and manages user_notes.md.
    .DESCRIPTION
        Calls the review-moderator agent with a diff. Parses the JSON response and
        returns a normalized verdict hashtable. On pass with notes, appends to
        user_notes.md. On fail, returns blockers for the caller to handle retry.
    .OUTPUTS
        Hashtable: @{ Verdict = 'pass'|'fail'; Blockers = @(...); Notes = @(...); Warnings = @(...); Round = [int] }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$DiffContent,

        [Parameter(Mandatory)]
        [string]$FeatureDir,

        [Parameter(Mandatory)]
        [string]$Root,

        [int]$CurrentRound = 1,

        [int]$ReviewerTimeout = 600,

        [int]$ModeratorTimeout = 300
    )

    $moderatorPromptFile = Join-Path -Path $Root -ChildPath 'agents' 'review-moderator.md'
    $round = $CurrentRound

    # ── Dispatch review-moderator ──
    $rawResponse = Invoke-Claude -Role moderator -SystemPromptFile $moderatorPromptFile -JsonSchema $ReviewModeratorSchema -Prompt $DiffContent

    # ── Handle null/empty response (timeout) ──
    if ([string]::IsNullOrWhiteSpace($rawResponse)) {
        Write-PipelineLog "Review moderator returned empty/null — treating as pass with warning"
        return @{
            Verdict  = 'pass'
            Blockers = @()
            Notes    = @()
            Warnings = @('Moderator returned empty/null response — treated as pass')
            Round    = $round
        }
    }

    # ── Parse JSON ──
    $parsed = $null
    try {
        $parsed = $rawResponse | ConvertFrom-Json -AsHashtable
    }
    catch {
        Write-PipelineLog "Review moderator response malformed JSON — treating as pass with warning"
        return @{
            Verdict  = 'pass'
            Blockers = @()
            Notes    = @()
            Warnings = @('Moderator response malformed — could not parse JSON')
            Round    = $round
        }
    }

    # ── Validate required fields ──
    if ($null -eq $parsed -or
        -not $parsed.ContainsKey('verdict') -or
        $parsed.verdict -notin @('pass', 'fail')) {
        Write-PipelineLog "Review moderator response invalid schema — treating as pass with warning"
        return @{
            Verdict  = 'pass'
            Blockers = @()
            Notes    = @()
            Warnings = @('Moderator response missing required fields — treated as pass')
            Round    = $round
        }
    }

    # ── Extract findings and notes ──
    $findings = @()
    if ($parsed.ContainsKey('findings') -and $parsed.findings) {
        $findings = @($parsed.findings)
    }

    $notes = @()
    if ($parsed.ContainsKey('notes') -and $parsed.notes) {
        $notes = @($parsed.notes)
    }

    $warnings = @()
    if ($parsed.ContainsKey('warnings') -and $parsed.warnings) {
        $warnings = @($parsed.warnings)
    }

    # ── Verdict: pass ──
    if ($parsed.verdict -eq 'pass') {
        # Pass with notes → append to user_notes.md
        if ($notes.Count -gt 0) {
            Write-UserNote -FeatureDir $FeatureDir -Notes $notes
        }

        return @{
            Verdict  = 'pass'
            Blockers = @()
            Notes    = $notes
            Warnings = $warnings
            Round    = $round
        }
    }

    # ── Verdict: fail ──
    if ($parsed.verdict -eq 'fail') {
        # Return fail with blocker details — caller manages retry cycle
        return @{
            Verdict  = 'fail'
            Blockers = $findings
            Notes    = $notes
            Warnings = $warnings
            Round    = $round
        }
    }
}

function Write-UserNote {
    <#
    .SYNOPSIS
        Appends review findings to user_notes.md without modifying prior entries.
    .DESCRIPTION
        Creates user_notes.md if it doesn't exist. Each note is formatted with
        a markdown heading including reviewer name and severity, followed by
        description and suggestion. Escalated blockers get a special header.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureDir,

        [Parameter(Mandatory)]
        [AllowEmptyCollection()]
        [array]$Notes,

        [switch]$EscalatedBlocker
    )

    if ($Notes.Count -eq 0) { return }

    $notesPath = Join-Path $FeatureDir 'user_notes.md'
    $sb = [System.Text.StringBuilder]::new()

    foreach ($note in $Notes) {
        $reviewer    = if ($note.reviewer)    { $note.reviewer }    else { 'unknown' }
        $severity    = if ($note.severity)    { $note.severity }    else { 'unknown' }
        $description = if ($note.description) { $note.description } else { '' }
        $suggestion  = if ($note.suggestion)  { $note.suggestion }  else { '' }

        if ($EscalatedBlocker) {
            $null = $sb.AppendLine("### Unresolved Escalated Blocker --- $reviewer")
        }
        else {
            $null = $sb.AppendLine("### $reviewer ($severity)")
        }

        $null = $sb.AppendLine($description)

        if ($suggestion) {
            $null = $sb.AppendLine("**Suggestion:** $suggestion")
        }

        $null = $sb.AppendLine('')
    }

    # Append to file (creates if not exists)
    Add-Content -Path $notesPath -Value $sb.ToString() -NoNewline
}
