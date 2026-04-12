param(
    [string]$CoveragePath = "$PSScriptRoot/../coverage.xml",
    [string]$ConfigPath   = "$PSScriptRoot/../.pester.ps1"
)

[xml]$report = Get-Content $CoveragePath
$lineCounter = $report.report.counter | Where-Object { $_.type -eq 'LINE' }

$covered = [int]$lineCounter.covered
$missed  = [int]$lineCounter.missed
$total   = $covered + $missed

if ($total -eq 0) {
    Write-Host 'No coverage data found, skipping ratchet.'
    return
}

$actual = [Math]::Floor(($covered / $total) * 100)

$config  = Get-Content $ConfigPath -Raw
$match   = [regex]::Match($config, 'CoveragePercentTarget\s*=\s*(\d+)')

if (-not $match.Success) {
    Write-Warning 'Could not find CoveragePercentTarget in config.'
    return
}

$current = [int]$match.Groups[1].Value

if ($actual -gt $current) {
    $updated = $config -replace '(CoveragePercentTarget\s*=\s*)\d+', "`${1}$actual"
    Set-Content $ConfigPath $updated -NoNewline
    Write-Host "Ratcheted coverage: $current% -> $actual%"
} else {
    Write-Host "Coverage $actual% does not exceed threshold $current%, no ratchet."
}
