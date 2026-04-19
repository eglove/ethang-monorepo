<#
.SYNOPSIS
    Validates docs/bidirectional-comms/cascade-order.md contains sections for all 6 stages (2-7).
.PARAMETER WhatIf
    Reports what would happen without failing.
#>
param(
    [switch]$WhatIf
)

$Root = Join-Path $PSScriptRoot '..'
$CascadeFile = Join-Path $Root 'docs' 'bidirectional-comms' 'cascade-order.md'

if (-not (Test-Path $CascadeFile)) {
    Write-Output "FAIL: cascade-order.md not found at $CascadeFile"
    if (-not $WhatIf) { exit 1 }
    exit 0
}

$content = Get-Content $CascadeFile -Raw
$requiredStages = 2..7
$missing = @()

foreach ($stage in $requiredStages) {
    if ($content -notmatch "## Stage $stage") {
        $missing += "Stage $stage"
    }
}

if ($missing.Count -gt 0) {
    Write-Output "FAIL: cascade-order.md missing sections for: $($missing -join ', ')"
    if (-not $WhatIf) { exit 1 }
} else {
    Write-Output "PASS: cascade-order.md contains all 6 stage sections (2-7)."
    exit 0
}
