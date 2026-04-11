function Invoke-BddDebate {
    param(
        [Parameter(Mandatory)]
        [string]$GherkinFile,

        [Parameter(Mandatory)]
        [string]$FeatureDir,

        [Parameter(Mandatory)]
        [string]$Root
    )

    $briefingPath = (Resolve-Path "$FeatureDir/elicitor.md").Path

    Invoke-DebateLoop `
        -DebateModFile "$Root/agents/debate-moderator.md" `
        -WriterFile "$Root/agents/doc-writers/bdd-writer.md" `
        -DebateContext "Debate the BDD scenarios against the original briefing. Focus on completeness, correctness, and whether all edge cases and error states have scenarios." `
        -SessionFile "$FeatureDir/bdd-debate.md" `
        -ArtifactFile $GherkinFile `
        -BriefingFile "$FeatureDir/elicitor.md" `
        -StageName "BDD" `
        -BuildRevisionPrompt {
        param($artifactPath, $objections)
        "Read the briefing from: $briefingPath`n`nRead the previous scenarios from: $artifactPath`n`nDebate objections:`n- $objections`n`nRevise the scenarios to address all objections. Save to $GherkinFile"
    }.GetNewClosure()
}
