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

    # Bus path: enabled when feature flag set AND DbPath provided
    $busEnabled = (Get-Command Test-BusFeatureEnabled -ErrorAction SilentlyContinue) -and
                  (Test-BusFeatureEnabled -StageName 'Stage6') -and
                  ($DbPath -ne '')

    if ($busEnabled) {
        return _Invoke-ImplementationDebateBusPath `
            -FeatureName $featureName `
            -FeatureDir $FeatureDir `
            -Root $Root `
            -DbPath $DbPath `
            -LaunchAgent $LaunchAgent `
            -DbExecutor $DbExecutor
    }

    # --- Legacy path ---

    # Validate cumulative artifacts (stage 6)
    try {
        $null = Resolve-PipelineState -FromStage 6 -Dir $FeatureDir
    }
    catch {
        Write-PipelineLog -Message "Stage 6 validation failed: $_" -Root $Root
        return @{ Success = $false; Error = "$_" }
    }

    $tlaPath = $TlaFile

    Write-PipelineLog -Message "Stage 6: implementation debate" -Root $Root

    Invoke-DebateLoop `
        -DebateModFile "$Root/agents/debate-moderator.md" `
        -WriterFile "$Root/agents/doc-writers/implementation-writer.md" `
        -DebateContext "Review this implementation plan against the TLA+ specification. Focus on whether every state and transition is covered, whether step ordering respects dependencies, whether test descriptions are specific enough, and whether the execution tiers are correctly parallelized." `
        -SessionFile "$FeatureDir/impl-debate.md" `
        -ArtifactFile $ImplFile `
        -FeatureDir $FeatureDir `
        -ReferenceFile $tlaPath `
        -StageName "Implementation" `
        -BuildRevisionPrompt {
        param($artifactPath, $objections)
        "Read the TLA+ specification from: $tlaPath`n`nRead the current plan from: $artifactPath`n`nDebate objections:`n- $objections`n`nRevise the plan to address all objections. Save markdown to $ImplFile and JSON manifest to $ImplJson"
    }.GetNewClosure()

    Write-PipelineLog -Message "STAGE_COMPLETE:6:$featureName" -Root $Root

    return @{ Success = $true }
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

    # Open bus DB
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
