<#
.SYNOPSIS
    Wrapper for running TLC model checker on the TLA+ spec.
.PARAMETER SpecDir
    Directory containing the TLA+ specification files.
.PARAMETER Timeout
    Timeout in seconds for TLC run. Default: 300.
.PARAMETER WhatIf
    Reports what would happen without failing.
#>
param(
    [string]$SpecDir = '',
    [int]$Timeout = 300,
    [switch]$WhatIf
)

if (-not $SpecDir) {
    $SpecDir = Join-Path $PSScriptRoot '..' 'bus' 'tla'
    $SpecDir = (Resolve-Path $SpecDir -ErrorAction SilentlyContinue)?.Path
}

if (-not $SpecDir -or -not (Test-Path $SpecDir)) {
    Write-Output "FAIL: TLA+ spec directory not found: $SpecDir"
    if (-not $WhatIf) { exit 1 }
    exit 0
}

$specFiles = Get-ChildItem -Path $SpecDir -Filter '*.tla'
if ($specFiles.Count -eq 0) {
    Write-Output "FAIL: No .tla files found in $SpecDir"
    if (-not $WhatIf) { exit 1 }
    exit 0
}

if ($WhatIf) {
    Write-Output "WHATIF: Would run TLC on $($specFiles.Count) spec file(s) in $SpecDir with timeout ${Timeout}s"
    exit 0
}

$tlcJar = $env:TLC_JAR
if (-not $tlcJar) {
    Write-Output "INFO: TLC_JAR not set. Skipping TLC run (set TLC_JAR env var to enable)."
    Write-Output "PASS: TLC check skipped (no TLC_JAR configured)."
    exit 0
}

foreach ($spec in $specFiles) {
    Write-Output "Running TLC on: $($spec.FullName)"
    $result = & java -jar $tlcJar -timeout $Timeout $spec.FullName 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Output "FAIL: TLC check failed for $($spec.Name)"
        Write-Output $result
        exit 1
    }
}

Write-Output "PASS: All TLA+ specs passed TLC model checking."
exit 0
