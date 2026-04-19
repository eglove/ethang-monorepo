function Invoke-PostDebate {
    param(
        [Parameter(Mandatory)][string]$FeatureDir,
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$TargetRoot,
        [string]$DbPath,
        [scriptblock]$DbExecutor    # injectable for tests
    )

    $featureName = Split-Path $FeatureDir -Leaf

    # Bus path: enabled when feature flag set AND DbPath provided
    $busEnabled = (Get-Command Test-BusFeatureEnabled -ErrorAction SilentlyContinue) -and
                  (Test-BusFeatureEnabled -StageName 'Stage4') -and
                  ($DbPath -ne '')

    if ($busEnabled) {
        return _Invoke-PostDebateBusPath `
            -FeatureName $featureName `
            -FeatureDir $FeatureDir `
            -Root $Root `
            -TargetRoot $TargetRoot `
            -DbPath $DbPath `
            -DbExecutor $DbExecutor
    }

    # --- Legacy path ---

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

function _Invoke-PostDebateBusPath {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [string]$FeatureName,
        [string]$FeatureDir,
        [string]$Root,
        [string]$TargetRoot,
        [string]$DbPath,
        [scriptblock]$DbExecutor
    )

    # Resolve the DbExecutor — use injectable if provided, otherwise use DB path
    $dbExec = $DbExecutor

    # Open bus DB — auto-provision a per-run temp DB if caller didn't specify one.
    if ([string]::IsNullOrEmpty($DbPath)) {
        $DbPath = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-bus-$(New-Guid).db"
    }
    $null = Open-BusDatabase -Path $DbPath

    # Emit stage_started
    $null = Send-StageStarted -StageNum 4 -FeatureName $FeatureName -DbExecutor $dbExec

    # Execute existing logic (synchronous — no agents dispatched)
    $fixturePath = $null
    try {
        $bddFile = Join-Path $FeatureDir 'bdd.feature'

        $parsedGherkin = ConvertFrom-Gherkin -Path $bddFile
        $parsedGherkin.schemaVersion = 1

        $fixtureDir = Get-FixtureDir -Root $TargetRoot -FeatureName $FeatureName
        $fixturePath = Join-Path $fixtureDir 'bdd.json'

        Export-BddFixture -Fixture $parsedGherkin -OutputPath $fixturePath

        # Also write to feature dir for Resolve-PipelineState
        $featureFixturePath = Join-Path $FeatureDir 'bdd-fixture.json'
        Export-BddFixture -Fixture $parsedGherkin -OutputPath $featureFixturePath

        Write-PipelineLog -Message "Stage 4 (bus): fixture generated at $fixturePath" -Root $Root
    }
    catch {
        # Emit stage_completed with error payload before re-throwing
        $errorPayload = @{ error = "$_" }
        $null = Send-BusEvent -Event @{
            EventType   = 'stage_completed'
            StageNum    = 4
            FeatureName = $FeatureName
            Timestamp   = [datetime]::UtcNow.ToString('o')
            Payload     = $errorPayload
        } -DbExecutor $dbExec
        throw
    }

    # Emit verify event after fixture generation
    $null = Send-BusEvent -Event @{
        EventType   = 'verify'
        StageNum    = 4
        FeatureName = $FeatureName
        Timestamp   = [datetime]::UtcNow.ToString('o')
        Payload     = @{ artifact = 'bdd-fixture'; path = $fixturePath }
    } -DbExecutor $dbExec

    # Emit stage_completed
    $null = Send-StageCompleted -StageNum 4 -FeatureName $FeatureName -DbExecutor $dbExec

    Write-PipelineLog -Message "STAGE_COMPLETE:4:$FeatureName" -Root $Root

    return @{
        Success     = $true
        FixturePath = $fixturePath
    }
}
