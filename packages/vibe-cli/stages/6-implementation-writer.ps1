function Invoke-ImplementationWriter {
    param(
        [string]$Briefing,

        [Parameter(Mandatory)]
        [string]$FeatureDir,

        [Parameter(Mandatory)]
        [string]$Root,

        [string]$BddFeaturePath,

        [string]$TlaSpecPath
    )

    $absDir = (Resolve-Path $FeatureDir).Path
    $implFile = Join-Path $absDir "implementation-plan.md"
    $implJson = Join-Path $absDir "implementation-plan.json"

    # Read spec files if provided (T11: explicit paths)
    $bddContent = $null
    $tlaContent = $null
    if ($BddFeaturePath) { $bddContent = Get-Content $BddFeaturePath -Raw }
    if ($TlaSpecPath) { $tlaContent = Get-Content $TlaSpecPath -Raw }

    $prompt = @"
Briefing: $Briefing

Read all artifacts in the feature directory: $absDir

BDD Feature ($BddFeaturePath):
$bddContent

TLA+ Spec ($TlaSpecPath):
$tlaContent

Save the markdown plan to: $implFile
Save the JSON manifest to: $implJson
"@

    Invoke-Claude `
        -SystemPromptFile "$Root/agents/doc-writers/implementation-writer.md" `
        -Prompt $prompt | Out-Null

    if (-not (Test-Path $implFile)) { throw "Implementation writer did not produce $implFile" }
    if (-not (Test-Path $implJson)) { throw "Implementation writer did not produce $implJson" }

    return @{
        ImplFile = $implFile
        ImplJson = $implJson
    }
}
