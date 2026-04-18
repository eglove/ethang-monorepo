function Invoke-UnifiedDebateStage {
    param(
        [Parameter(Mandatory)][string]$FeatureDir,
        [Parameter(Mandatory)][string]$Root,
        [string]$DbPath,
        [scriptblock]$LaunchAgent,    # injectable for tests
        [scriptblock]$DbExecutor      # injectable for tests
    )

    $featureName = Split-Path $FeatureDir -Leaf

    # Bus path: enabled when feature flag set AND DbPath provided
    $busEnabled = (Get-Command Test-BusFeatureEnabled -ErrorAction SilentlyContinue) -and
                  (Test-BusFeatureEnabled -StageName 'Stage3') -and
                  ($DbPath -ne '')

    if ($busEnabled) {
        return _Invoke-UnifiedDebateStageBusPath `
            -FeatureName $featureName `
            -FeatureDir $FeatureDir `
            -Root $Root `
            -DbPath $DbPath `
            -LaunchAgent $LaunchAgent `
            -DbExecutor $DbExecutor
    }

    # --- Legacy path ---

    # Validate cumulative artifacts (stage 3 requires elicitor.md, bdd.feature, .tla)
    try {
        $state = Resolve-PipelineState -FromStage 3 -Dir $FeatureDir
    }
    catch {
        Write-PipelineLog -Message "Stage 3 validation failed: $_" -Root $Root
        return @{ Success = $false; Error = "$_" }
    }

    $gherkinFile = $state.GherkinFile
    $tlaDir = $state.TlaDir

    Write-PipelineLog -Message "Stage 3: unified debate" -Root $Root

    $debateResult = Invoke-UnifiedDebateLoop `
        -GherkinFile $gherkinFile `
        -TlaDir $tlaDir `
        -FeatureDir $FeatureDir `
        -Root $Root

    # On failure results, do NOT write the stage-complete marker
    if ($debateResult.Result -eq 'CONSENSUS_REVISION_FAILED' -or $debateResult.Result -eq 'REVISION_FAILED' -or $debateResult.Result -eq 'ALL_ROUNDS_FAILED') {
        Write-PipelineLog -Message "Stage 3 failed: $($debateResult.Error)" -Root $Root
        return @{
            Success = $false
            Error   = $debateResult.Error
            Result  = $debateResult
        }
    }

    # Write marker on consensus or max-rounds exit
    Write-PipelineLog -Message "STAGE_COMPLETE:3:$featureName" -Root $Root

    return @{
        Success = $true
        Result  = $debateResult
    }
}

function _Invoke-UnifiedDebateStageBusPath {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [string]$FeatureName,
        [string]$FeatureDir,
        [string]$Root,
        [string]$DbPath,
        [scriptblock]$LaunchAgent,
        [scriptblock]$DbExecutor
    )

    # Open bus DB
    $null = Open-BusDatabase -Path $DbPath

    # Emit stage_started
    $null = Send-StageStarted -StageNum 3 -FeatureName $FeatureName -DbExecutor $DbExecutor

    # Start moderator agent
    $null = Start-BusAgent -AgentId "unified-moderator-$FeatureName" -Role 'moderator' -LaunchAgent $LaunchAgent -DbExecutor $DbExecutor

    # Create group with 1 agent
    $groupId = "stage3-$FeatureName"
    $group = New-BusGroup -GroupId $groupId -ExpectedCount 1 -DbExecutor $DbExecutor

    # Register agent in group
    $null = Send-BusGroupEvent -GroupId $group.GroupId -AgentId "unified-moderator-$FeatureName" -DbExecutor $DbExecutor

    # Wait for group completion
    $null = Wait-BusGroup -GroupId $groupId -TimeoutMs 600000 -DbExecutor $DbExecutor

    # Emit stage_completed
    $null = Send-StageCompleted -StageNum 3 -FeatureName $FeatureName -DbExecutor $DbExecutor

    Write-PipelineLog -Message "Stage 3 (bus): moderator dispatched" -Root $Root
    Write-PipelineLog -Message "STAGE_COMPLETE:3:$FeatureName" -Root $Root

    return @{
        Success = $true
        Result  = @{ Result = 'BUS_DISPATCHED'; RoundsCompleted = 0 }
    }
}
