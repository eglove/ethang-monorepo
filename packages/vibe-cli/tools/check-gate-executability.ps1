<#
.SYNOPSIS
    Verifies all gate scripts exit with 0 on a clean repo.
.PARAMETER WhatIf
    Reports what would happen without failing.
#>
param(
    [switch]$WhatIf
)

$ToolsDir = $PSScriptRoot
$gateScripts = Get-ChildItem -Path $ToolsDir -Filter 'check-*.ps1' | Where-Object {
    $_.Name -ne 'check-gate-executability.ps1'
}

$results = @()
$failures = @()

foreach ($script in $gateScripts) {
    if ($WhatIf) {
        $results += [PSCustomObject]@{ Script = $script.Name; Status = 'WHATIF'; ExitCode = 'N/A' }
        continue
    }

    try {
        $output = & pwsh -NonInteractive -NoProfile -File $script.FullName -WhatIf 2>&1
        $code = $LASTEXITCODE
        $status = if ($code -eq 0) { 'PASS' } else { 'FAIL' }
        if ($code -ne 0) {
            $failures += $script.Name
        }
        $results += [PSCustomObject]@{ Script = $script.Name; Status = $status; ExitCode = $code }
    } catch {
        $failures += $script.Name
        $results += [PSCustomObject]@{ Script = $script.Name; Status = 'ERROR'; ExitCode = -1 }
    }
}

$results | Format-Table -AutoSize | Out-String | Write-Output

if ($failures.Count -gt 0) {
    Write-Output "FAIL: Some gate scripts failed: $($failures -join ', ')"
    if (-not $WhatIf) { exit 1 }
} else {
    Write-Output "PASS: All gate scripts executable and return 0."
    exit 0
}
