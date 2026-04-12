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

    # Read the unified debate (replaces separate debate files from the old pipeline)
    $unifiedDebatePath = Join-Path $absDir 'unified-debate.md'
    $unifiedDebate = if (Test-Path $unifiedDebatePath) { Get-Content $unifiedDebatePath -Raw } else { '' }

    $implFile = Join-Path $absDir 'implementation-plan.md'
    $implJson = Join-Path $absDir 'implementation-plan.json'

    # Read spec files
    $briefing = Get-Content (Join-Path $absDir 'elicitor.md') -Raw
    $bddContent = if ($BddFeaturePath -and (Test-Path $BddFeaturePath)) { Get-Content $BddFeaturePath -Raw } else { $null }
    $tlaContent = if ($TlaSpecPath -and (Test-Path $TlaSpecPath)) { Get-Content $TlaSpecPath -Raw } else { $null }

    $prompt = @"
Briefing: $briefing

Read all artifacts in the feature directory: $absDir

Unified Debate Summary:
$unifiedDebate

BDD Feature ($BddFeaturePath):
$bddContent

TLA+ Spec ($TlaSpecPath):
$tlaContent

Save the markdown plan to: $implFile
Save the JSON manifest to: $implJson
"@

    Write-PipelineLog -Message "Stage 5: implementation writer" -Root $Root

    Invoke-Claude `
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
