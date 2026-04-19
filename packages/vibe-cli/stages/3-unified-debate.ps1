function Invoke-UnifiedDebateStage {
    param(
        [Parameter(Mandatory)][string]$FeatureDir,
        [Parameter(Mandatory)][string]$Root,
        [string]$DbPath,
        [scriptblock]$LaunchAgent,    # injectable for tests
        [scriptblock]$DbExecutor      # injectable for tests
    )

    $featureName = Split-Path $FeatureDir -Leaf

    return _Invoke-UnifiedDebateStageBusPath `
        -FeatureName $featureName `
        -FeatureDir $FeatureDir `
        -Root $Root `
        -DbPath $DbPath `
        -LaunchAgent $LaunchAgent `
        -DbExecutor $DbExecutor
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

    # Open bus DB — auto-provision a per-run temp DB if caller didn't specify one.
    if ([string]::IsNullOrEmpty($DbPath)) {
        $DbPath = Join-Path ([System.IO.Path]::GetTempPath()) "vibe-bus-$(New-Guid).db"
    }
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
