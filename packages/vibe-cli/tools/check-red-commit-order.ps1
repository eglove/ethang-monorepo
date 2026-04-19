<#
.SYNOPSIS
    Verifies TDD commit ordering: red (failing test) before green (passing implementation).
.PARAMETER WhatIf
    Reports what would happen without failing.
#>
param(
    [switch]$WhatIf
)

$log = git log --oneline --no-merges 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Output "FAIL: Could not read git log."
    if (-not $WhatIf) { exit 1 }
    exit 0
}

$lines = $log -split "`n" | Where-Object { $_ -ne '' }
$violations = @()

for ($i = 0; $i -lt $lines.Count - 1; $i++) {
    $current = $lines[$i]
    $next = $lines[$i + 1]
    # green commit should follow a red commit
    if ($current -match '^[0-9a-f]+ green:' -and $next -notmatch '^[0-9a-f]+ red:') {
        # Only flag if the green commit has no preceding red
        $violations += "Green commit without preceding red: $current"
    }
}

if ($violations.Count -gt 0) {
    Write-Output "FAIL: TDD commit order violations found:"
    $violations | ForEach-Object { Write-Output "  - $_" }
    if (-not $WhatIf) { exit 1 }
} else {
    Write-Output "PASS: TDD commit order looks correct."
    exit 0
}
