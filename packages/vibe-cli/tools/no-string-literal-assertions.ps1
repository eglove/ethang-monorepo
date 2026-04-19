<#
.SYNOPSIS
    Alias/wrapper for test-fail-assertion.ps1.
    Verifies no test uses string literals in Should -Be assertions.
.PARAMETER WhatIf
    Reports what would happen without failing.
#>
param(
    [switch]$WhatIf
)

$target = Join-Path $PSScriptRoot 'test-fail-assertion.ps1'
if ($WhatIf) {
    & pwsh -NonInteractive -NoProfile -File $target -WhatIf
} else {
    & pwsh -NonInteractive -NoProfile -File $target
    exit $LASTEXITCODE
}
