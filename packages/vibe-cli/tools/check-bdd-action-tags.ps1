<#
.SYNOPSIS
    Verifies each BDD scenario has a @tla-action-<ActionName> tag.

    Grandfathered: feature files introduced into git before the cutoff below
    are skipped. Any .feature file first committed on/after the cutoff must
    tag every scenario. Use --git-date=iso-strict to inspect a file's first
    commit.
.PARAMETER WhatIf
    Reports what would happen without failing.
.PARAMETER Cutoff
    ISO-8601 date. Files introduced before this are skipped. Default 2026-04-20
    (the day this convention was adopted repo-wide).
#>
param(
    [switch]$WhatIf,
    [string]$Cutoff = '2026-04-20'
)

$Root = Join-Path $PSScriptRoot '..'
$FeatureFiles = Get-ChildItem -Path $Root -Filter '*.feature' -Recurse

if ($FeatureFiles.Count -eq 0) {
    Write-Output "WARN: No .feature files found — skipping BDD action tag check."
    exit 0
}

$cutoffDate = Get-Date $Cutoff
$violations = @()
$skipped    = @()

foreach ($file in $FeatureFiles) {
    # Find the commit that introduced this file (--diff-filter=A, oldest match)
    $firstCommitIso = & git log --diff-filter=A --format=%aI --follow -- $file.FullName 2>$null |
        Select-Object -Last 1
    if ($firstCommitIso) {
        $firstCommit = Get-Date $firstCommitIso
        if ($firstCommit -lt $cutoffDate) {
            $skipped += "$($file.FullName) (grandfathered; created $($firstCommit.ToString('yyyy-MM-dd')))"
            continue
        }
    }
    # Fall through if the file isn't yet tracked — enforce tags by default.

    $lines = Get-Content $file.FullName
    $pendingScenario = $false
    $hasTlaTag = $false
    $scenarioLine = 0

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i].Trim()

        if ($line -match '^@') {
            if ($line -match '@tla-action-') { $hasTlaTag = $true }
        } elseif ($line -match '^Scenario') {
            if ($pendingScenario -and -not $hasTlaTag) {
                $violations += "$($file.FullName) (line $scenarioLine): scenario missing @tla-action-<ActionName> tag"
            }
            $pendingScenario = $true
            $hasTlaTag = $false
            $scenarioLine = $i + 1
        }
    }

    if ($pendingScenario -and -not $hasTlaTag) {
        $violations += "$($file.FullName) (line $scenarioLine): scenario missing @tla-action-<ActionName> tag"
    }
}

if ($skipped.Count -gt 0) {
    Write-Output "INFO: Skipped $($skipped.Count) grandfathered file(s):"
    $skipped | ForEach-Object { Write-Output "  - $_" }
}

if ($violations.Count -gt 0) {
    Write-Output "FAIL: BDD scenarios missing @tla-action tags:"
    $violations | ForEach-Object { Write-Output "  - $_" }
    if (-not $WhatIf) { exit 1 }
} else {
    Write-Output "PASS: All post-cutoff BDD scenarios have @tla-action tags."
    exit 0
}
