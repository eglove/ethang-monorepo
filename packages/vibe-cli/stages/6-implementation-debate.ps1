function Invoke-ImplementationDebateStage {
    param(
        [Parameter(Mandatory)][string]$ImplFile,
        [Parameter(Mandatory)][string]$ImplJson,
        [string]$TlaFile,
        [Parameter(Mandatory)][string]$FeatureDir,
        [Parameter(Mandatory)][string]$Root,
        [string]$DbPath,
        [scriptblock]$LaunchAgent,    # injectable for tests
        [scriptblock]$DbExecutor      # injectable for tests
    )

    if (-not $TlaFile) {
        Write-PipelineLog -Message "Stage 6 failed: TlaFile is required for implementation debate" -Root $Root
        return @{ Success = $false; Error = "TlaFile is required for implementation debate" }
    }

    $featureName = Split-Path $FeatureDir -Leaf

    return _Invoke-ImplementationDebateBusPath `
        -FeatureName $featureName `
        -FeatureDir $FeatureDir `
        -Root $Root `
        -DbPath $DbPath `
        -LaunchAgent $LaunchAgent `
        -DbExecutor $DbExecutor
}

function _Invoke-ImplementationDebateBusPath {
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
    $null = Send-StageStarted -StageNum 6 -FeatureName $FeatureName -DbExecutor $DbExecutor

    # Start moderator agent
    $null = Start-BusAgent -AgentId "impl-debate-mod-$FeatureName" -Role 'moderator' -LaunchAgent $LaunchAgent -DbExecutor $DbExecutor

    # Create group with 1 agent
    $groupId = "stage6-$FeatureName"
    $group = New-BusGroup -GroupId $groupId -ExpectedCount 1 -DbExecutor $DbExecutor

    # Register agent in group
    $null = Send-BusGroupEvent -GroupId $group.GroupId -AgentId "impl-debate-mod-$FeatureName" -DbExecutor $DbExecutor

    # Wait for group completion
    $null = Wait-BusGroup -GroupId $groupId -TimeoutMs 900000 -DbExecutor $DbExecutor

    # Emit stage_completed
    $null = Send-StageCompleted -StageNum 6 -FeatureName $FeatureName -DbExecutor $DbExecutor

    Write-PipelineLog -Message "Stage 6 (bus): moderator dispatched" -Root $Root
    Write-PipelineLog -Message "STAGE_COMPLETE:6:$FeatureName" -Root $Root

    return @{ Success = $true }
}
