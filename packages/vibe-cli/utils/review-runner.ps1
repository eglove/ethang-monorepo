function Invoke-ReviewRunner {
    param(
        [Parameter(Mandatory)]
        [string]$WorktreePath,

        [Parameter(Mandatory)]
        [string]$AgentsDir,

        [Parameter(Mandatory)]
        [string]$UserNotesPath,

        [string]$Context = ""
    )

    $reviewSchema = @'
{"type":"object","properties":{"verdict":{"type":"string","enum":["PASS","FAIL"]},"reviewer":{"type":"string"},"issues":{"type":"array","items":{"type":"object","properties":{"file":{"type":"string"},"line":{"type":["integer","null"]},"issue":{"type":"string"},"recommendation":{"type":"string"},"severity":{"type":"string","enum":["critical","high","medium","low"]},"weight":{"type":"integer","minimum":1,"maximum":10}},"required":["file","issue","severity","weight"]}}},"required":["verdict","reviewer","issues"]}
'@

    # Get diff — use merge-base against master for full branch diff
    Push-Location $WorktreePath
    $mergeBase = git merge-base HEAD master 2>$null
    if ($LASTEXITCODE -eq 0 -and $mergeBase) {
        $diff = git diff $mergeBase HEAD 2>&1
    }
    else {
        # Fallback: show the latest commit
        $diff = git show HEAD --format="" 2>&1
    }
    if (-not $diff) { $diff = git diff --cached 2>&1 }
    Pop-Location

    $reviewerFiles = Get-ChildItem "$AgentsDir/reviewers/*.md"

    Write-Host "  Dispatching $($reviewerFiles.Count) reviewers in parallel..." -ForegroundColor Gray

    $results = $reviewerFiles | ForEach-Object -Parallel {
        $reviewerFile = $_.FullName
        $reviewerName = $_.BaseName
        $schema = $using:reviewSchema
        $diffContent = $using:diff
        $ctx = $using:Context
        $rootDir = $using:AgentsDir | Split-Path -Parent

        . "$rootDir/utils/config.ps1"
        $global:InvokeClaudeBatched = $true

        $result = Invoke-Claude `
            -SystemPromptFile $reviewerFile `
            -JsonSchema $schema `
            -Prompt "Review this diff. Return your reviewer name as '$reviewerName'.`n`nContext: $ctx`n`nDiff:`n$diffContent"

        try {
            $result | ConvertFrom-Json
        }
        catch {
            @{ verdict = 'PASS'; reviewer = $reviewerName; issues = @() }
        }
    } -ThrottleLimit $reviewerFiles.Count

    # Aggregate results
    $allIssues = @()
    $anyFail = $false

    foreach ($r in $results) {
        if ($r.verdict -eq 'FAIL') { $anyFail = $true }
        foreach ($issue in $r.issues) {
            $allIssues += @{
                reviewer       = $r.reviewer
                file           = $issue.file
                line           = $issue.line
                issue          = $issue.issue
                recommendation = $issue.recommendation
                severity       = $issue.severity
                weight         = $issue.weight
            }
        }
    }

    # Sort by weight descending
    $allIssues = $allIssues | Sort-Object { $_.weight } -Descending

    # Write all issues to user_notes.md
    if ($allIssues.Count -gt 0) {
        # Create file with header if it doesn't exist
        if (-not (Test-Path $UserNotesPath)) {
            Set-Content -Path $UserNotesPath -Value "# User Notes`n"
        }

        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        $entry = "`n## $Context — $timestamp`n"

        foreach ($issue in $allIssues) {
            $lineRef = if ($issue.line) { ":$($issue.line)" } else { "" }
            $entry += "`n- **[$($issue.severity)] w:$($issue.weight)** ``$($issue.file)$lineRef`` — $($issue.issue)"
            $entry += "`n  - Reviewer: $($issue.reviewer)"
            $entry += "`n  - Fix: $($issue.recommendation)"
        }

        Add-Content -Path $UserNotesPath -Value $entry
    }

    # Report
    $criticalCount = @($allIssues | Where-Object { $_.severity -eq 'critical' }).Count
    $highCount = @($allIssues | Where-Object { $_.severity -eq 'high' }).Count
    $mediumCount = @($allIssues | Where-Object { $_.severity -eq 'medium' }).Count
    $lowCount = @($allIssues | Where-Object { $_.severity -eq 'low' }).Count

    Write-Host "  Reviews complete: $criticalCount critical, $highCount high, $mediumCount medium, $lowCount low" -ForegroundColor $(if ($anyFail) { 'Red' } else { 'Green' })

    return @{
        Passed        = -not $anyFail
        Issues        = $allIssues
        BlockingCount = $criticalCount + $highCount
    }
}
