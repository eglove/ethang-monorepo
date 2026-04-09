function Invoke-BddDebate {
    param(
        [Parameter(Mandatory)]
        [string]$GherkinFile,

        [Parameter(Mandatory)]
        [string]$Briefing,

        [Parameter(Mandatory)]
        [string]$FeatureDir,

        [Parameter(Mandatory)]
        [string]$Root,

        [Parameter(Mandatory)]
        [string]$DebateSchema
    )

    Write-Host "`n=== Stage 3: BDD Debate ===" -ForegroundColor Cyan

    Invoke-DebateLoop `
        -DebateModFile "$Root/agents/debate-moderator.md" `
        -DebateSchema $DebateSchema `
        -WriterFile "$Root/agents/doc-writers/bdd-writer.md" `
        -DebateContext "Debate the BDD scenarios against the original briefing. Focus on completeness, correctness, and whether all edge cases and error states have scenarios." `
        -SessionFile "$FeatureDir/bdd-debate.md" `
        -ArtifactFile $GherkinFile `
        -BriefingFile "$FeatureDir/elicitor.md" `
        -StageName "BDD" `
        -BuildRevisionPrompt {
        param($current, $objections)
        "Briefing:`n$Briefing`n`nPrevious scenarios:`n$current`n`nDebate objections:`n- $objections`n`nRevise the scenarios to address all objections. Save to $GherkinFile"
    }.GetNewClosure()
}
