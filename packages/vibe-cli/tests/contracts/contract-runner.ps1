# =============================================================================
# contract-runner.ps1 — Snapshot-based bidirectional contract test runner
# Prevents "mock drift" by verifying test doubles produce stable, versioned output.
# =============================================================================

$ErrorActionPreference = 'Stop'

function New-ContractSnapshot {
    <#
    .SYNOPSIS
        Writes a snapshot JSON file to the given path.
    #>
    param(
        [Parameter(Mandatory)][string]$Content,
        [Parameter(Mandatory)][string]$Path
    )
    $dir = Split-Path $Path -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $Content)
}

function Get-ContractSnapshot {
    <#
    .SYNOPSIS
        Reads and parses a snapshot JSON file.
    .OUTPUTS
        Hashtable (deserialized from JSON), or $null if file missing.
    #>
    param(
        [Parameter(Mandatory)][string]$Path
    )
    if (-not (Test-Path $Path)) { return $null }
    $raw = [System.IO.File]::ReadAllText($Path)
    return $raw | ConvertFrom-Json
}

function Compare-ContractSnapshot {
    <#
    .SYNOPSIS
        Compares actual output to expected snapshot content.
    .OUTPUTS
        Hashtable @{ Match=$bool; Diff=$string }
    #>
    param(
        [Parameter(Mandatory)][string]$Actual,
        [Parameter(Mandatory)][string]$Expected,
        [Parameter(Mandatory)][string]$ContractName
    )
    if ($Actual -eq $Expected) {
        return @{ Match = $true; Diff = '' }
    }

    # Build a simple diff showing first diverging line
    $actualLines   = $Actual   -split "`n"
    $expectedLines = $Expected -split "`n"
    $diffLines     = [System.Collections.ArrayList]::new()
    $maxLen        = [Math]::Max($actualLines.Count, $expectedLines.Count)

    for ($i = 0; $i -lt $maxLen; $i++) {
        $a = if ($i -lt $actualLines.Count)   { $actualLines[$i]   } else { '<missing>' }
        $e = if ($i -lt $expectedLines.Count) { $expectedLines[$i] } else { '<missing>' }
        if ($a -ne $e) {
            $null = $diffLines.Add("Line $($i+1):`n  expected: $e`n  actual:   $a")
        }
    }

    $diff = "Contract '$ContractName' mismatch:`n" + ($diffLines -join "`n")
    return @{ Match = $false; Diff = $diff }
}

function Invoke-ContractTest {
    <#
    .SYNOPSIS
        Records or replays a snapshot-based contract test.
    .DESCRIPTION
        - If snapshot does not exist OR -UpdateSnapshot is set:
            Runs MockInvoker, serialises result, writes snapshot, returns Passed=$true.
        - Otherwise:
            Runs MockInvoker, serialises result, compares to snapshot.
            Returns Passed=$true/$false with Diff on mismatch.
    .PARAMETER ContractName
        Logical name of this contract (used in error messages).
    .PARAMETER MockInvoker
        Scriptblock that invokes the mock and returns any object.
        The result is serialised to JSON for comparison.
    .PARAMETER SnapshotPath
        Absolute path to the .json snapshot file.
    .PARAMETER UpdateSnapshot
        When set, always overwrite the snapshot (record phase).
    .PARAMETER Normalizer
        Optional scriptblock applied to the raw JSON string before comparison.
        Signature: param([string]$Json) returns [string]
    .OUTPUTS
        Hashtable @{ Passed=$bool; ContractName=$string; Diff=$string }
    #>
    param(
        [Parameter(Mandatory)][string]$ContractName,
        [Parameter(Mandatory)][scriptblock]$MockInvoker,
        [Parameter(Mandatory)][string]$SnapshotPath,
        [switch]$UpdateSnapshot,
        [scriptblock]$Normalizer
    )

    # Run the mock
    $rawResult = & $MockInvoker
    $actualJson = $rawResult | ConvertTo-Json -Depth 20 -Compress

    # Apply normalizer if provided
    if ($Normalizer) {
        $actualJson = & $Normalizer $actualJson
    }

    $snapshotExists = Test-Path $SnapshotPath

    # Record phase: write new snapshot
    if (-not $snapshotExists -or $UpdateSnapshot) {
        New-ContractSnapshot -Content $actualJson -Path $SnapshotPath
        return @{ Passed = $true; ContractName = $ContractName; Diff = '' }
    }

    # Replay phase: compare to existing snapshot
    $expectedJson = [System.IO.File]::ReadAllText($SnapshotPath)
    if ($Normalizer) {
        $expectedJson = & $Normalizer $expectedJson
    }

    $cmp = Compare-ContractSnapshot -Actual $actualJson -Expected $expectedJson -ContractName $ContractName
    return @{
        Passed       = $cmp.Match
        ContractName = $ContractName
        Diff         = $cmp.Diff
    }
}
