function Invoke-GlobalReview {
    <#
    .SYNOPSIS
        Gets full diff against base branch and runs Invoke-ReviewLoop. On fail, dispatches
        Claude to fix, resets global double-pass counters (per TLA+ GlobalReviewFail), re-runs
        global double-pass, and re-reviews.
    .OUTPUTS
        Hashtable: @{ Verdict = 'pass'|'escalated'; ReviewRound = [int]; Blockers = @() }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$FeatureDir,
        [Parameter(Mandatory)][string]$BaseBranch,
        [int]$MaxReviewRounds = 3
    )

    $glReviewRounds = 0

    while ($glReviewRounds -lt $MaxReviewRounds) {
        $glReviewRounds++

        $diffContent = git -C $Root diff "$BaseBranch...HEAD" 2>&1 | Out-String
        if ([string]::IsNullOrWhiteSpace($diffContent)) {
            $diffContent = '(no diff available)'
        }

        $reviewResult = Invoke-ReviewLoop -DiffContent $diffContent -FeatureDir $FeatureDir -Root $Root -MaxReviewRounds 1 -CurrentRound 1

        if ($reviewResult.Verdict -eq 'pass') {
            return @{
                Verdict     = 'pass'
                ReviewRound = $glReviewRounds
                Blockers    = @()
            }
        }

        if ($glReviewRounds -ge $MaxReviewRounds) {
            return @{
                Verdict     = 'escalated'
                ReviewRound = $glReviewRounds
                Blockers    = @($reviewResult.Blockers)
            }
        }

        $blockerSummary = ($reviewResult.Blockers | ForEach-Object {
            if ($_ -is [hashtable] -or $_ -is [System.Management.Automation.PSCustomObject]) {
                $_.description
            } else { "$_" }
        }) -join "`n"

        $fixPrompt = @"
## Global Review Failure — Fix Required (round $glReviewRounds/$MaxReviewRounds)

Root: $Root

### Blockers
$blockerSummary

Fix the review blockers using TDD approach: write failing test, make it pass, refactor.
"@
        Invoke-Claude -Prompt $fixPrompt -AddDir $Root

        # Re-run global double-pass with RESET counters (per TLA+ GlobalReviewFail: R2-1)
        $dpResult = Invoke-GlobalDoublePass -Root $Root -Feature (Split-Path $FeatureDir -Leaf) -MaxDoublePassRetries 5

        if ($dpResult.Status -eq 'escalated') {
            return @{
                Verdict     = 'escalated'
                ReviewRound = $glReviewRounds
                Blockers    = @($dpResult.LastError)
            }
        }
    }

    return @{
        Verdict     = 'escalated'
        ReviewRound = $glReviewRounds
        Blockers    = @()
    }
}
