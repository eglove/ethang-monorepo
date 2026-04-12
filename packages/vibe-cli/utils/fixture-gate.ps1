function Get-FixtureDir {
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$FeatureName
    )
    return Join-Path $Root "fixtures/$FeatureName"
}

function Test-FixturePrecondition {
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$FeatureName
    )

    $fixtureBase = Get-FixtureDir -Root $Root -FeatureName $FeatureName
    $bddPath = Join-Path $fixtureBase 'bdd.json'

    $result = @{ bddValid = $false; canProceed = $false }

    # Check BDD fixture
    if (Test-Path $bddPath) {
        try {
            $json = Get-Content $bddPath -Raw | ConvertFrom-Json
            if ($json.schemaVersion -eq 1) { $result.bddValid = $true }
        }
        catch { }
    }

    $result.canProceed = $result.bddValid
    return $result
}
