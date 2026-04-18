function Invoke-ImplementationWriterStage {
    param(
        [Parameter(Mandatory)][string]$FeatureDir,
        [Parameter(Mandatory)][string]$Root,
        [string]$BddFeaturePath,
        [string]$TlaSpecPath
    )

    $featureName = Split-Path $FeatureDir -Leaf
    $absDir = (Resolve-Path $FeatureDir).Path

    # Validate cumulative artifacts (stage 5)
    try {
        $null = Resolve-PipelineState -FromStage 5 -Dir $FeatureDir
    }
    catch {
        Write-PipelineLog -Message "Stage 5 validation failed: $_" -Root $Root
        return @{ Success = $false; Error = "$_" }
    }

    $unifiedDebatePath = Join-Path $absDir 'unified-debate.md'
    $elicitorPath = Join-Path $absDir 'elicitor.md'

    $implFile = Join-Path $absDir 'implementation-plan.md'
    $implJson = Join-Path $absDir 'implementation-plan.json'

    $contextFiles = @("- Elicitor briefing: $elicitorPath")
    if (Test-Path $unifiedDebatePath) { $contextFiles += "- Unified debate: $unifiedDebatePath" }
    if ($BddFeaturePath -and (Test-Path $BddFeaturePath)) { $contextFiles += "- BDD scenarios: $BddFeaturePath" }
    if ($TlaSpecPath -and (Test-Path $TlaSpecPath)) { $contextFiles += "- TLA+ spec: $TlaSpecPath" }
    $fileList = $contextFiles -join "`n"

    $prompt = @"
Read all artifacts in the feature directory: $absDir

Read these files for context:
$fileList

Save the markdown plan to: $implFile
Save the JSON manifest to: $implJson
"@

    Write-PipelineLog -Message "Stage 5: implementation writer" -Root $Root

    Invoke-Claude `
        -Role 'code-writer' `
        -SystemPromptFile "$Root/agents/doc-writers/implementation-writer.md" `
        -Prompt $prompt | Out-Null

    if (-not (Test-Path $implFile)) { throw "Implementation writer did not produce $implFile" }
    if (-not (Test-Path $implJson)) { throw "Implementation writer did not produce $implJson" }

    Write-PipelineLog -Message "STAGE_COMPLETE:5:$featureName" -Root $Root

    return @{
        Success  = $true
        ImplFile = $implFile
        ImplJson = $implJson
    }
}
