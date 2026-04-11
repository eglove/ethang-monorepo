function Invoke-BddDebate {
    param(
        [Parameter(Mandatory)]
        [string]$GherkinFile,

        [Parameter(Mandatory)]
        [string]$FeatureDir,

        [Parameter(Mandatory)]
        [string]$Root
    )

    $absFeatureDir = (Resolve-Path $FeatureDir).Path

    Invoke-DebateLoop `
        -DebateModFile "$Root/agents/debate-moderator.md" `
        -WriterFile "$Root/agents/doc-writers/bdd-writer.md" `
        -DebateContext "Debate the BDD scenarios against the original briefing. Focus on completeness, correctness, and whether all edge cases and error states have scenarios." `
        -SessionFile "$FeatureDir/bdd-debate.md" `
        -ArtifactFile $GherkinFile `
        -FeatureDir $FeatureDir `
        -StageName "BDD" `
        -BuildRevisionPrompt {
        param($artifactPath, $objections)
        "Read all artifacts in the feature directory for context: $absFeatureDir`n`nRead the previous scenarios from: $artifactPath`n`nDebate objections:`n- $objections`n`nRevise the scenarios to address all objections. Save to $GherkinFile"
    }.GetNewClosure()
}
