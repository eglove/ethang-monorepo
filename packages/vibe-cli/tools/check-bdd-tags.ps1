[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Resolve paths relative to this script's location
$GlossaryPath     = Join-Path $PSScriptRoot '../bus/bounded-context-glossary.psd1'
$NoneReasonsPath  = Join-Path $PSScriptRoot 'none-reason-tokens.psd1'

if (-not (Test-Path $GlossaryPath)) {
    Write-Error "Cannot find bounded-context-glossary.psd1 at: $GlossaryPath"
    exit 1
}
if (-not (Test-Path $NoneReasonsPath)) {
    Write-Error "Cannot find none-reason-tokens.psd1 at: $NoneReasonsPath"
    exit 1
}
if (-not (Test-Path $Path)) {
    Write-Error "Feature file not found: $Path"
    exit 1
}

$glossary     = Import-PowerShellDataFile $GlossaryPath
$noneReasons  = Import-PowerShellDataFile $NoneReasonsPath
$tlaVariables = $glossary['TlaVariables']
$validTokens  = $noneReasons['ValidTokens']

$lines   = Get-Content $Path
$hasFail = $false

# State machine: track pending tags for the next Scenario line
$pendingTags = @()
$lineIndex   = 0

foreach ($line in $lines) {
    $lineIndex++
    $trimmed = $line.Trim()

    # Collect tag lines (lines starting with @)
    if ($trimmed -match '^@') {
        $pendingTags += $trimmed
        continue
    }

    # Scenario line
    if ($trimmed -match '^Scenario\s*:\s*(.+)$') {
        $scenarioTitle = $Matches[1].Trim()
        $tagsForScenario = $pendingTags -join ' '

        # Check for @tla-action-none
        if ($tagsForScenario -match '@tla-action-none\b') {
            # Must also have @tla-action-none-reason="<token>"
            if ($tagsForScenario -match '@tla-action-none-reason="([^"]+)"') {
                $token = $Matches[1]
                if ($validTokens -notcontains $token) {
                    Write-Output "[FAIL] BDD tag invalid none-reason token: Scenario '$scenarioTitle' at line $lineIndex has @tla-action-none-reason=""$token"" which is not a valid token. Valid tokens: $($validTokens -join ', ')"
                    $hasFail = $true
                }
            } else {
                Write-Output "[FAIL] BDD tag missing none-reason: Scenario '$scenarioTitle' at line $lineIndex has @tla-action-none but no @tla-action-none-reason=""<token>"" tag."
                $hasFail = $true
            }
        } elseif ($tagsForScenario -notmatch '@tla-action-\w+') {
            # No @tla-action-* tag at all
            Write-Output "[FAIL] BDD tag missing: Scenario '$scenarioTitle' at line $lineIndex has no @tla-action-<ActionName> or @invariant-M tag."
            $hasFail = $true
        }

        $pendingTags = @()
        continue
    }

    # Non-tag, non-Scenario line clears pending tags
    if ($trimmed -ne '' -and $trimmed -notmatch '^Feature\s*:' -and $trimmed -notmatch '^#') {
        $pendingTags = @()
    }

    # Scan Given/When/Then step text for TLA+ identifier leaks
    if ($trimmed -match '^(Given|When|Then|And|But)\s+(.+)$') {
        $stepText = $Matches[2]
        foreach ($tlaVar in $tlaVariables) {
            # Match TLA+ identifier as word boundary match
            if ($stepText -match "\b$([regex]::Escape($tlaVar))\b") {
                Write-Output "[WARN] TLA+ identifier '$tlaVar' found in BDD step text at line $lineIndex. Use the PowerShell name from bounded-context-glossary.psd1 instead."
            }
        }
    }
}

if ($hasFail) {
    exit 1
}
exit 0
