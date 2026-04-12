function Invoke-UnifiedDebateStage {
    param(
        [Parameter(Mandatory)][string]$FeatureDir,
        [Parameter(Mandatory)][string]$Root
    )

    $featureName = Split-Path $FeatureDir -Leaf

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
