function Invoke-GlobalReview {
    <#
    .SYNOPSIS
        Gets full diff against base branch and runs Invoke-ReviewLoop. On fail, dispatches
        Claude to fix, resets global double-pass counters (per TLA+ GlobalReviewFail), re-runs
        global double-pass, and re-reviews.
    .OUTPUTS
        Hashtable: @{ Verdict = 'pass'; ReviewRound = [int]; Blockers = @() }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$FeatureDir,
        [Parameter(Mandatory)][string]$BaseBranch
    )

    $glReviewRounds = 0

    while ($true) {
        $glReviewRounds++

        $diffContent = git -C $Root diff "$BaseBranch...HEAD" 2>&1 | Out-String
        if ([string]::IsNullOrWhiteSpace($diffContent)) {
            $diffContent = '(no diff available)'
        }

        $reviewResult = Invoke-ReviewLoop -DiffContent $diffContent -FeatureDir $FeatureDir -Root $Root -CurrentRound 1

        if ($reviewResult.Verdict -eq 'pass') {
            return @{
                Verdict     = 'pass'
                ReviewRound = $glReviewRounds
                Blockers    = @()
            }
        }

        $blockerSummary = ($reviewResult.Blockers | ForEach-Object {
            if ($_ -is [hashtable] -or $_ -is [System.Management.Automation.PSCustomObject]) {
                $_.description
            } else { "$_" }
        }) -join "`n"

        $fixPrompt = @"
## Global Review Failure — Fix Required (round $glReviewRounds)

Root: $Root

### Blockers
$blockerSummary

Fix the review blockers using TDD approach: write failing test, make it pass, refactor.
"@
        Invoke-Claude -Role reviewer -Prompt $fixPrompt -AddDir $Root

        # Re-run global double-pass with RESET counters (per TLA+ GlobalReviewFail: R2-1)
        Invoke-GlobalDoublePass -Root $Root -Feature (Split-Path $FeatureDir -Leaf) | Out-Null
    }
}
