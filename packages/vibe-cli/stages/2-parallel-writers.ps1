function Invoke-ParallelWriter {
    param(
        [Parameter(Mandatory)]
        [string]$FeatureDir,

        [Parameter(Mandatory)]
        [string]$Root
    )

    $featureName = Split-Path $FeatureDir -Leaf
    $absFeatureDir = (Resolve-Path $FeatureDir).Path
    $briefingPath = Join-Path $absFeatureDir 'elicitor.md'

    if (-not (Test-Path $briefingPath)) {
        throw "Elicitor briefing not found: $briefingPath"
    }

    Write-PipelineLog -Message "Stage 2: dispatching BDD and TLA+ writers in parallel" -Root $Root

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
                    -SystemPromptFile "$rootArg/agents/doc-writers/tla-writer.md" `
                    -Prompt "Read the elicitor briefing from: $briefingPathArg`n`nWrite the TLA+ specification. Save all files to: $tlaDir" | Out-Null

                Invoke-TlcCheck `
                    -TlaDir $tlaDir `
                    -TlaWriterFile "$rootArg/agents/doc-writers/tla-writer.md" `
                    -FixContext "Elicitor briefing: $briefingPathArg"

                $tlaFile = Get-ChildItem "$tlaDir/*.tla" | Select-Object -First 1
                return @{ TlaFile = $tlaFile; TlaDir = $tlaDir }
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
