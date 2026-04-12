function Test-FixturePrecondition {
    param(
        [Parameter(Mandatory)][string]$FeatureDir
    )

    $bddPath = Join-Path $FeatureDir 'tests/fixtures/bdd/fixture.json'
    $tlcPath = Join-Path $FeatureDir 'tests/fixtures/tla/fixture.json'

    $result = @{ bddValid = $false; tlcValid = $false; canProceed = $false }

    # Check BDD fixture
    if (Test-Path $bddPath) {
        try {
            $json = Get-Content $bddPath -Raw | ConvertFrom-Json
            if ($json.schemaVersion -eq 1) { $result.bddValid = $true }
        }
        catch { }
    }

    # Check TLC fixture
    if (Test-Path $tlcPath) {
        try {
            $json = Get-Content $tlcPath -Raw | ConvertFrom-Json
            if ($json.schemaVersion -eq 1) { $result.tlcValid = $true }
        }
        catch { }
    }

    $result.canProceed = $result.bddValid -and $result.tlcValid
    return $result
}
