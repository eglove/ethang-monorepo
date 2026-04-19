function Invoke-ParallelWriter {
    param(
        [Parameter(Mandatory)]
        [string]$FeatureDir,

        [Parameter(Mandatory)]
        [string]$Root,

        [string]$DbPath,

        [scriptblock]$LaunchAgent,

        [scriptblock]$DbExecutor
    )

    $featureName = Split-Path $FeatureDir -Leaf
    $absFeatureDir = (Resolve-Path $FeatureDir).Path
    $briefingPath = Join-Path $absFeatureDir 'elicitor.md'

    if (-not (Test-Path $briefingPath)) {
        throw "Elicitor briefing not found: $briefingPath"
    }

    Write-PipelineLog -Message "Stage 2: dispatching BDD and TLA+ writers in parallel" -Root $Root

    return _Invoke-ParallelWriterBusPath `
        -FeatureName $featureName `
        -FeatureDir $absFeatureDir `
        -BriefingPath $briefingPath `
        -Root $Root `
        -DbPath $DbPath `
        -LaunchAgent $LaunchAgent `
        -DbExecutor $DbExecutor
}

function _Invoke-ParallelWriterBusPath {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [string]$FeatureName,
        [string]$FeatureDir,
        [string]$BriefingPath,
        [string]$Root,
        [string]$DbPath,
        [scriptblock]$LaunchAgent,
        [scriptblock]$DbExecutor
    )

    # Open bus DB
    Open-BusDatabase -Path $DbPath

    # Create group for the two agents
    $groupId = "stage2-$FeatureName"
    $group = New-BusGroup -GroupId $groupId -ExpectedCount 2 -DbExecutor $DbExecutor

    # Emit stage_started
    Send-StageStarted -StageNum 2 -FeatureName $FeatureName -DbExecutor $DbExecutor

    # Start agents
    Start-BusAgent -AgentId "bdd-$FeatureName" -Role 'doc-writer' -LaunchAgent $LaunchAgent -DbExecutor $DbExecutor
    Start-BusAgent -AgentId "tla-$FeatureName" -Role 'doc-writer' -LaunchAgent $LaunchAgent -DbExecutor $DbExecutor

    # Register both in the group
    Send-BusGroupEvent -GroupId $group.GroupId -AgentId "bdd-$FeatureName" -DbExecutor $DbExecutor
    Send-BusGroupEvent -GroupId $group.GroupId -AgentId "tla-$FeatureName" -DbExecutor $DbExecutor

    # Wait for group completion
    $waitResult = Wait-BusGroup -GroupId $groupId -TimeoutMs 300000 -DbExecutor $DbExecutor

    # Emit stage_completed
    Send-StageCompleted -StageNum 2 -FeatureName $FeatureName -DbExecutor $DbExecutor

    Write-PipelineLog -Message "Stage 2 (bus): both writers completed" -Root $Root
    Write-PipelineLog -Message "STAGE_COMPLETE:2:$FeatureName" -Root $Root

    # Resolve output files — look for artefacts produced by agents
    $bddFile = Join-Path $FeatureDir 'bdd.feature'
    $tlaDir  = Join-Path $FeatureDir 'tla'
    $tlaFile = Get-ChildItem "$tlaDir/*.tla" -ErrorAction SilentlyContinue | Select-Object -First 1

    return @{
        Success     = $true
        GherkinFile = if (Test-Path $bddFile) { $bddFile } else { $null }
        TlaFile     = if ($tlaFile) { $tlaFile.FullName } else { $null }
        TlaDir      = $tlaDir
    }
}
