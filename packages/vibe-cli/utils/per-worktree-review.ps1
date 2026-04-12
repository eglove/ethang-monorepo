function Invoke-PerWorktreeReview {
    <#
    .SYNOPSIS
        Gets diff from worktree and runs Invoke-ReviewLoop. On fail, dispatches Claude
        to fix via TDD, resets double-pass counters, re-runs double-pass, and re-reviews.
    .OUTPUTS
        Hashtable: @{ Verdict = 'pass'|'escalated'; ReviewRound = [int]; Blockers = @() }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$WorktreePath,
        [Parameter(Mandatory)][string]$FeatureDir,
        [Parameter(Mandatory)][string]$Root,
        [int]$MaxReviewRounds = 3
    )

    $wtReviewRounds = 0

    while ($wtReviewRounds -lt $MaxReviewRounds) {
        $wtReviewRounds++

        # Get diff
        $diffContent = git -C $WorktreePath diff HEAD~1 2>&1 | Out-String
        if ([string]::IsNullOrWhiteSpace($diffContent)) {
            $diffContent = '(no diff available)'
        }

        # Call review loop
        $reviewResult = Invoke-ReviewLoop -DiffContent $diffContent -FeatureDir $FeatureDir -Root $Root -MaxReviewRounds 1 -CurrentRound 1

        if ($reviewResult.Verdict -eq 'pass') {
            return @{
                Verdict     = 'pass'
                ReviewRound = $wtReviewRounds
                Blockers    = @()
            }
        }

        # Review failed — check if we have rounds left
        if ($wtReviewRounds -ge $MaxReviewRounds) {
            return @{
                Verdict     = 'escalated'
                ReviewRound = $wtReviewRounds
                Blockers    = @($reviewResult.Blockers)
            }
        }

        # Claude fixes via TDD
        $blockerSummary = ($reviewResult.Blockers | ForEach-Object {
            if ($_ -is [hashtable] -or $_ -is [System.Management.Automation.PSCustomObject]) {
                $_.description
            } else { "$_" }
        }) -join "`n"

        $fixPrompt = @"
## Review Failure — Fix Required (round $wtReviewRounds/$MaxReviewRounds)

Worktree: $WorktreePath

### Blockers
$blockerSummary

Fix the review blockers using TDD approach: write failing test, make it pass, refactor.
"@
        Invoke-Claude -Prompt $fixPrompt -AddDir $WorktreePath

        # Re-run double-pass with reset counters
        $dpResult = Invoke-PerWorktreeDoublePass -WorktreePath $WorktreePath -Root $Root -Feature (Split-Path $FeatureDir -Leaf) -MaxDoublePassRetries 5

        if ($dpResult.Status -eq 'escalated') {
            return @{
                Verdict     = 'escalated'
                ReviewRound = $wtReviewRounds
                Blockers    = @($dpResult.LastError)
            }
        }
    }

    return @{
        Verdict     = 'escalated'
        ReviewRound = $wtReviewRounds
        Blockers    = @()
    }
}
