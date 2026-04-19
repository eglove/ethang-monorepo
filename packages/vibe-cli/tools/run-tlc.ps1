<#
.SYNOPSIS
    Runs the TLA+ TLC model checker against a single spec + config pair.
.PARAMETER Spec
    Path to the .tla spec file (required).
.PARAMETER Config
    Path to the .cfg config file. Defaults to <spec-dir>/<spec-basename>.cfg.
.PARAMETER Timeout
    Seconds before TLC self-terminates via `-Dtlc2.TLC.stopAfter`. Default 600.
.PARAMETER WhatIf
    Prints the java command without running it.
.NOTES
    Requires $env:TLC_JAR pointing to a tla2tools.jar and Java 11+ on PATH.
    Uses TLC's built-in stopAfter for timeout (no external process management).
    Exits 0 on "No error has been found", 1 on TLC errors, 2 on config problems.
#>
param(
    [Parameter(Mandatory)][string]$Spec,
    [string]$Config = '',
    [int]$Timeout = 600,
    [switch]$WhatIf
)

$tlcJar = $env:TLC_JAR
if (-not $tlcJar -or -not (Test-Path $tlcJar)) {
    Write-Output "FAIL: TLC_JAR env var is not set or points at a missing file: '$tlcJar'"
    exit 2
}
if (-not (Test-Path $Spec)) {
    Write-Output "FAIL: spec file not found: $Spec"
    exit 2
}
if (-not $Config) {
    $specDir = Split-Path $Spec -Parent
    $specBase = [System.IO.Path]::GetFileNameWithoutExtension($Spec)
    $Config = Join-Path $specDir "$specBase.cfg"
}
if (-not (Test-Path $Config)) {
    Write-Output "FAIL: config file not found: $Config"
    exit 2
}

# TLC derives the module name from the filename minus `.tla`, so we must
# run from the spec's directory and pass only the basename. Paths that
# include directory separators are rejected as "module-name mismatch".
$specDir   = Split-Path $Spec -Parent
$specName  = [System.IO.Path]::GetFileNameWithoutExtension($Spec)
$configAbs = (Resolve-Path $Config).Path
$tlcJarAbs = (Resolve-Path $tlcJar).Path

$javaArgs = @(
    "-Dtlc2.TLC.stopAfter=$Timeout"
    '-cp', $tlcJarAbs
    'tlc2.TLC'
    '-workers', 'auto'
    '-deadlock'
    '-config', $configAbs
    $specName
)

if ($WhatIf) {
    Write-Output "WHATIF: (cd $specDir) java $($javaArgs -join ' ')"
    exit 0
}

Push-Location $specDir
try {
    $output = & java @javaArgs 2>&1 | Out-String
    $exit = $LASTEXITCODE
} finally {
    Pop-Location
}
Write-Output $output

if ($exit -eq 0 -and $output -match 'No error has been found') {
    Write-Output "PASS: $Spec model-checked with no errors."
    exit 0
}
Write-Output "FAIL: TLC exit=$exit on $Spec"
exit 1
