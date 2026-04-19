param(
    [Parameter(Mandatory)][string]$FeatureFile,
    [switch]$ErrorOnLeaks  # if set, exit non-zero when leaks found
)

# Locate bounded-context-glossary.psd1 by searching parent dirs from the script location
$glossaryPath = $null
$searchDir = $PSScriptRoot
for ($i = 0; $i -lt 6; $i++) {
    $candidate = Join-Path $searchDir "bus/bounded-context-glossary.psd1"
    if (Test-Path $candidate) {
        $glossaryPath = $candidate
        break
    }
    $parent = Split-Path $searchDir -Parent
    if (-not $parent -or $parent -eq $searchDir) { break }
    $searchDir = $parent
}

if (-not $glossaryPath) {
    Write-Warning "Could not find bounded-context-glossary.psd1 — using built-in TLA+ variable list"
    $tlaVariables = @('nextEvtId','eventLog','routedIds','agentStatus','agentWorktree','checkpointStored',
        'checkpointResponseInFlight','groundTruthDelivered','spawnedAtEvt','deadAtEvt','unresolvedObjections',
        'overriddenObjections','consensusState','commitLockHolder','committedDoneEvts','pendingDoneEvt',
        'busStatus','haltReason','failureCategory','groupMembers','groupReplies','groupViolationPending',
        'pendingProtocolError','handlerState','handlerPendingEvt','handlerPendingAgent','handlerPendingEpoch',
        'consensusRoundStart','pipeline_lock','snapshotExists','rollbackRequested','rollbackTargetWorktree')
} else {
    $glossary = Import-PowerShellDataFile -Path $glossaryPath
    $tlaVariables = $glossary.TlaVariables
}

if (-not (Test-Path $FeatureFile)) {
    Write-Error "Feature file not found: $FeatureFile"
    exit 2
}

$lines = Get-Content $FeatureFile
$leaks = @()

for ($lineNum = 0; $lineNum -lt $lines.Count; $lineNum++) {
    $line = $lines[$lineNum]
    # Only check Given/When/Then/And/But step lines
    if ($line -notmatch '^\s*(Given|When|Then|And|But)\s') { continue }

    foreach ($varName in $tlaVariables) {
        # Match exact word boundary
        if ($line -match "\b$([regex]::Escape($varName))\b") {
            $leaks += "[WARN] TLA+ identifier '$varName' found in BDD step text at line $($lineNum + 1): $($line.Trim())"
        }
    }
}

if ($leaks.Count -gt 0) {
    $leaks | ForEach-Object { Write-Host $_ }
    Write-Host ""
    Write-Host "Summary: $($leaks.Count) TLA+ identifier leak(s) found in $FeatureFile"
    if ($ErrorOnLeaks) {
        exit 1
    }
} else {
    Write-Host "Summary: 0 TLA+ identifier leaks found in $FeatureFile"
}

exit 0
