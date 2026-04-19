<#
.SYNOPSIS
    Runs the TLA+ TLC model checker against a single spec + config pair.
    Self-bootstraps tla2tools.jar — downloads on first use, refreshes when
    the nightly build has a newer Last-Modified than the cached copy.

.PARAMETER Spec
    Path to the .tla spec file (required).
.PARAMETER Config
    Path to the .cfg config file. Defaults to <spec-dir>/<spec-basename>.cfg.
.PARAMETER Timeout
    Seconds before TLC self-terminates via `-Dtlc2.TLC.stopAfter`. Default 600.
.PARAMETER TlcJar
    Explicit path to tla2tools.jar. If omitted, $env:TLC_JAR is consulted,
    then ~/.cache/tlaplus/tla2tools.jar is used as the default cache location.
.PARAMETER TlcUrl
    Download URL. Default is the nightly build at nightly.tlapl.us.
.PARAMETER NoDownload
    If set, do not auto-download the jar. Fail if it's missing locally.
.PARAMETER WhatIf
    Print the java command without running it.

.NOTES
    Requires Java 11+ on PATH. Exits 0 on "No error has been found",
    1 on TLC-reported errors, 2 on config problems (missing spec/cfg).
#>
param(
    [Parameter(Mandatory)][string]$Spec,
    [string]$Config = '',
    [int]$Timeout = 600,
    [string]$TlcJar = '',
    [string]$TlcUrl = 'https://nightly.tlapl.us/dist/tla2tools.jar',
    [switch]$NoDownload,
    [switch]$WhatIf
)

function _Resolve-TlcJar {
    param([string]$Explicit, [string]$Url, [switch]$NoDownload)

    $target = if ($Explicit) {
        $Explicit
    } elseif ($env:TLC_JAR) {
        $env:TLC_JAR
    } else {
        $userHome = if ($env:HOME) { $env:HOME } else { $env:USERPROFILE }
        Join-Path $userHome '.cache/tlaplus/tla2tools.jar'
    }

    $exists = Test-Path $target
    $needDownload = -not $exists

    if ($exists -and -not $NoDownload) {
        # Refresh if server has a newer Last-Modified than our cached copy.
        try {
            $head = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -TimeoutSec 10
            $remoteRaw = $head.Headers['Last-Modified']
            if ($remoteRaw) {
                $remote = [datetime]::Parse($remoteRaw).ToUniversalTime()
                $local  = (Get-Item $target).LastWriteTimeUtc
                if ($remote -gt $local) {
                    Write-Output "TLC jar: remote $($remote.ToString('u')) > local $($local.ToString('u')) — refreshing."
                    $needDownload = $true
                }
            }
        } catch {
            # Offline or HEAD failed — keep using the cached jar.
            Write-Output "TLC jar: version check failed ($($_.Exception.Message)); using cached copy."
        }
    }

    if ($needDownload) {
        if ($NoDownload) {
            throw "TLC jar not found at $target and -NoDownload was specified."
        }
        $dir = Split-Path $target -Parent
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        Write-Output "Downloading TLC jar from $Url → $target"
        Invoke-WebRequest -Uri $Url -OutFile $target -UseBasicParsing
    }

    return (Resolve-Path $target).Path
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

try {
    $tlcJarAbs = _Resolve-TlcJar -Explicit $TlcJar -Url $TlcUrl -NoDownload:$NoDownload
} catch {
    Write-Output "FAIL: $($_.Exception.Message)"
    exit 2
}

# TLC derives the module name from the filename minus `.tla`, so we must
# run from the spec's directory and pass only the basename.
$specDir   = Split-Path $Spec -Parent
$specName  = [System.IO.Path]::GetFileNameWithoutExtension($Spec)
$configAbs = (Resolve-Path $Config).Path

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
