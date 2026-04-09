function Invoke-GlobalReview {
    param(
        [Parameter(Mandatory)]
        [string]$IntegrationBranch,

        [Parameter(Mandatory)]
        [string]$Root
    )

    Write-Host "`n=== Stage 9: Global Review ===" -ForegroundColor Cyan

    $userNotes = "$Root/user_notes.md"
    $globalCodeWriterFile = "$Root/agents/code-writers/typescript-writer.md"

    for ($globalRound = 1; $globalRound -le $Config.MaxGlobalFixRounds; $globalRound++) {
        Write-Host "Global review round $globalRound..." -ForegroundColor Yellow

        $globalReview = Invoke-ReviewRunner `
            -WorktreePath "." `
            -AgentsDir "$Root/agents" `
            -UserNotesPath $userNotes `
            -Context "Global review — $IntegrationBranch"

        if ($globalReview.Passed) {
            Write-Host "Global review passed." -ForegroundColor Green
            break
        }

        if ($globalRound -ge $Config.MaxGlobalFixRounds) {
            Write-Host "Global review: $($globalReview.BlockingCount) blocking issues remain after $($Config.MaxGlobalFixRounds) rounds." -ForegroundColor Yellow
            break
        }

        # Fix blocking issues
        $blockingIssues = $globalReview.Issues | Where-Object { $_.severity -in 'critical', 'high' }
        $issueList = ($blockingIssues | ForEach-Object {
                "[$($_.severity)] w:$($_.weight) $($_.file):$($_.line) — $($_.issue) (fix: $($_.recommendation))"
            }) -join "`n"

        Write-Host "Fixing $($blockingIssues.Count) blocking issues..." -ForegroundColor Yellow
        Invoke-Claude `
            -SystemPromptFile $globalCodeWriterFile `
            -Prompt "Fix these issues on the current branch. Run lint, test, and tsc after each fix to verify.`n`n$issueList" | Out-Null

        # Verify fixes
        $null = & ([scriptblock]::Create($Config.VerifyLint)) 2>&1; $lintPass = $LASTEXITCODE -eq 0
        $null = & ([scriptblock]::Create($Config.VerifyTest)) 2>&1; $testPass = $LASTEXITCODE -eq 0
        $null = & ([scriptblock]::Create($Config.VerifyTsc)) 2>&1; $tscPass = $LASTEXITCODE -eq 0

        if (-not ($lintPass -and $testPass -and $tscPass)) {
            Write-Host "Verify failed after global fix — continuing to next round." -ForegroundColor Yellow
        }
    }
}
