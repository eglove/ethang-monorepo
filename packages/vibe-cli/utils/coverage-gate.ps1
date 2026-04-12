function Test-CoverageGate {
    param(
        [Parameter(Mandatory)][hashtable]$CoverageResults,
        [Parameter(Mandatory)][int]$TddIter,
        [Parameter(Mandatory)][int]$CoverageIter,
        [Parameter(Mandatory)][int]$MaxTddCycles,
        [Parameter(Mandatory)][int]$MaxCoverageIter
    )

    $categories = @('pbt', 'contract', 'e2e')
    $failures = @()

    foreach ($cat in $categories) {
        $data = $CoverageResults[$cat]

        # Zero test files = failure (no vacuous 100%)
        if (-not $data -or $data.testFiles -le 0) {
            $failures += @{ category = $cat; reason = 'zero_test_files'; pct = 0 }
            continue
        }

        # Tool crash (no report) - not counted against cap
        if ($null -eq $data.covered -or $null -eq $data.total) {
            $failures += @{ category = $cat; reason = 'tool_crash'; pct = $null }
            continue
        }

        if ($data.total -eq 0) {
            $failures += @{ category = $cat; reason = 'zero_total'; pct = 0 }
            continue
        }

        # Truncation rounding (floor, not round)
        $pct = [Math]::Floor(($data.covered / $data.total) * 100)

        if ($pct -lt 100) {
            $failures += @{ category = $cat; reason = 'below_100'; pct = $pct; covered = $data.covered; total = $data.total }
        }
    }

    if ($failures.Count -eq 0) {
        return @{ passed = $true; failures = @() }
    }

    # Check caps - tool crashes don't count
    $nonCrashFailures = $failures | Where-Object { $_.reason -ne 'tool_crash' }

    $tddExhausted = $TddIter -ge $MaxTddCycles
    $coverageExhausted = $CoverageIter -ge $MaxCoverageIter

    $exhaustionType = $null
    if ($tddExhausted) { $exhaustionType = 'TDDCapExhausted' }
    if (-not $tddExhausted -and $coverageExhausted) { $exhaustionType = 'CoverageCapExhausted' }

    return @{
        passed = $false
        failures = $failures
        exhaustionType = $exhaustionType
        tddIter = $TddIter
        coverageIter = $CoverageIter
    }
}
