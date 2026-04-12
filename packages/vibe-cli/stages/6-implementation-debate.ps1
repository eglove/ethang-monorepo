function Invoke-ImplementationDebateStage {
    param(
        [Parameter(Mandatory)][string]$ImplFile,
        [Parameter(Mandatory)][string]$ImplJson,
        [string]$TlaFile,
        [Parameter(Mandatory)][string]$FeatureDir,
        [Parameter(Mandatory)][string]$Root
    )

    if (-not $TlaFile) {
        Write-PipelineLog -Message "Stage 6 failed: TlaFile is required for implementation debate" -Root $Root
        return @{ Success = $false; Error = "TlaFile is required for implementation debate" }
    }

    $featureName = Split-Path $FeatureDir -Leaf

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
