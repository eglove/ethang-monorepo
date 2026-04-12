function Invoke-PostDebate {
    param(
        [Parameter(Mandatory)][string]$FeatureDir,
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$TargetRoot
    )

    $featureName = Split-Path $FeatureDir -Leaf

    # Validate cumulative artifacts (stage 4 requires everything through stage 3 + unified-debate.md)
    try {
        $null = Resolve-PipelineState -FromStage 4 -Dir $FeatureDir
    }
    catch {
        Write-PipelineLog -Message "Stage 4 validation failed: $_" -Root $Root
        return @{ Success = $false; Error = "$_" }
    }

    $bddFile = Join-Path $FeatureDir 'bdd.feature'
    if (-not (Test-Path $bddFile)) {
        Write-PipelineLog -Message "Stage 4 failed: bdd.feature not found" -Root $Root
        return @{ Success = $false; Error = "bdd.feature not found in $FeatureDir" }
    }

    Write-PipelineLog -Message "Stage 4: generating post-debate artifacts" -Root $Root

    # Parse Gherkin and generate fixture
    try {
        $parsedGherkin = ConvertFrom-Gherkin -Path $bddFile
        $parsedGherkin.schemaVersion = 1

        $fixtureDir = Get-FixtureDir -Root $TargetRoot -FeatureName $featureName
        $fixturePath = Join-Path $fixtureDir 'bdd.json'

        Export-BddFixture -Fixture $parsedGherkin -OutputPath $fixturePath

        # Also write to feature dir for Resolve-PipelineState
        $featureFixturePath = Join-Path $FeatureDir 'bdd-fixture.json'
        Export-BddFixture -Fixture $parsedGherkin -OutputPath $featureFixturePath

        Write-PipelineLog -Message "Stage 4: fixture generated at $fixturePath" -Root $Root
        Write-PipelineLog -Message "STAGE_COMPLETE:4:$featureName" -Root $Root

        return @{
            Success     = $true
            FixturePath = $fixturePath
        }
    }
    catch {
        Write-PipelineLog -Message "Stage 4 failed: $_" -Root $Root
        return @{ Success = $false; Error = "$_" }
    }
}
