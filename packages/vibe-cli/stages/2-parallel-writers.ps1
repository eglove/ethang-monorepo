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

    # Bus path: enabled when feature flag set AND DbPath provided
    $busEnabled = (Get-Command Test-BusFeatureEnabled -ErrorAction SilentlyContinue) -and
                  (Test-BusFeatureEnabled -StageName 'Stage2') -and
                  ($DbPath -ne '')

    if ($busEnabled) {
        return _Invoke-ParallelWriterBusPath `
            -FeatureName $featureName `
            -FeatureDir $absFeatureDir `
            -BriefingPath $briefingPath `
            -Root $Root `
            -DbPath $DbPath `
            -LaunchAgent $LaunchAgent `
            -DbExecutor $DbExecutor
    }

    # --- Legacy path ---
    $jobs = @{
        bdd = @{
            Script = {
                $rootArg = $args[0]
                $featureDirArg = $args[1]
                $briefingPathArg = $args[2]

                . "$rootArg/utils/pipeline-log.ps1"
                . "$rootArg/utils/invoke-claude.ps1"

                $outputFile = Join-Path $featureDirArg 'bdd.feature'

                Invoke-Claude `
                    -Role 'doc-writer' `
                    -SystemPromptFile "$rootArg/agents/doc-writers/bdd-writer.md" `
                    -Prompt "Read the elicitor briefing from: $briefingPathArg`nSave to: $outputFile" | Out-Null

                if (-not (Test-Path $outputFile)) { throw "BDD writer did not produce $outputFile" }
                return $outputFile
            }
            Args = @($Root, $absFeatureDir, $briefingPath)
        }
        tla = @{
            Script = {
                $rootArg = $args[0]
                $featureDirArg = $args[1]
                $briefingPathArg = $args[2]

                . "$rootArg/utils/pipeline-log.ps1"
                . "$rootArg/utils/invoke-claude.ps1"
                . "$rootArg/utils/tlc-runner.ps1"

                $tlaDir = Join-Path $featureDirArg 'tla'
                New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null

                Invoke-Claude `
                    -Role 'doc-writer' `
                    -SystemPromptFile "$rootArg/agents/doc-writers/tla-writer.md" `
                    -Prompt "Read the elicitor briefing from: $briefingPathArg`n`nWrite the TLA+ specification. Save all files to: $tlaDir" | Out-Null

                Invoke-TlcCheck `
                    -TlaDir $tlaDir `
                    -TlaWriterFile "$rootArg/agents/doc-writers/tla-writer.md" `
                    -FixContext "Elicitor briefing: $briefingPathArg"

                $tlaFile = Get-ChildItem "$tlaDir/*.tla" | Select-Object -First 1
                return @{ TlaFile = $tlaFile.FullName; TlaDir = $tlaDir }
            }
            Args = @($Root, $absFeatureDir, $briefingPath)
        }
    }

    $results = Invoke-Parallel -Jobs $jobs

    $failures = @()
    if (-not $results['bdd'].Success) { $failures += "bdd: $($results['bdd'].Error)" }
    if (-not $results['tla'].Success) { $failures += "tla: $($results['tla'].Error)" }

    if ($failures.Count -gt 0) {
        $errorMsg = "Stage 2 failed — writer(s) failed: $($failures -join '; ')"
        Write-PipelineLog -Message $errorMsg -Root $Root
        return @{
            Success     = $false
            Error       = $errorMsg
            BddResult   = $results['bdd']
            TlaResult   = $results['tla']
        }
    }

    Write-PipelineLog -Message "Stage 2: both writers completed successfully" -Root $Root
    Write-PipelineLog -Message "STAGE_COMPLETE:2:$featureName" -Root $Root

    return @{
        Success     = $true
        GherkinFile = $results['bdd'].Output
        TlaFile     = $results['tla'].Output.TlaFile
        TlaDir      = $results['tla'].Output.TlaDir
    }
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
