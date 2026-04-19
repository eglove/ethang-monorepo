<#
.SYNOPSIS
    Verifies no test uses string literals in Should -Be assertions (must use variables).
.PARAMETER WhatIf
    Reports what would happen without failing.
#>
param(
    [switch]$WhatIf
)

$Root = Join-Path $PSScriptRoot '..'
$TestsDir = Join-Path $Root 'tests'

if (-not (Test-Path $TestsDir)) {
    Write-Output "FAIL: Tests directory not found: $TestsDir"
    if (-not $WhatIf) { exit 1 }
    exit 0
}

$violations = @()

Get-ChildItem -Path $TestsDir -Filter '*.Tests.ps1' -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $file = $_.FullName

    # Find Should -Be with string literals (not variables)
    $matches = [regex]::Matches($content, '(?i)Should\s+-Be\s+[''"]([^''"]+)[''"]')
    foreach ($m in $matches) {
        $line = ($content.Substring(0, $m.Index) -split "`n").Count
        $violations += "$file (line ~$line): literal string in Should -Be: '$($m.Groups[1].Value)'"
    }
}

if ($violations.Count -gt 0) {
    Write-Output "FAIL: String literal assertions found (use variables instead):"
    $violations | ForEach-Object { Write-Output "  - $_" }
    if (-not $WhatIf) { exit 1 }
} else {
    Write-Output "PASS: No string literal assertions found in tests."
    exit 0
}
