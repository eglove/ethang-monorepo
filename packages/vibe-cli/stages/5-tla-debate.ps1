function Invoke-TlaDebate {
    param(
        [Parameter(Mandatory)]
        [object]$TlaFile,

        [Parameter(Mandatory)]
        [string]$TlaDir,

        [Parameter(Mandatory)]
        [string]$GherkinFile,

        [Parameter(Mandatory)]
        [string]$FeatureDir,

        [Parameter(Mandatory)]
        [string]$Root
    )

    . "$Root/utils/tlc-runner.ps1"

    $gherkinPath = (Resolve-Path $GherkinFile).Path
    $tlaWriterFile = "$Root/agents/doc-writers/tla-writer.md"

    Invoke-DebateLoop `
        -DebateModFile "$Root/agents/debate-moderator.md" `
        -WriterFile $tlaWriterFile `
        -DebateContext "Review this TLA+ specification against the BDD scenarios. Focus on whether the spec correctly captures all states, transitions, safety properties, and liveness properties. Identify any scenarios missing from the spec or spec behaviors contradicting the scenarios." `
        -SessionFile "$FeatureDir/tla-debate.md" `
        -ArtifactFile $TlaFile.FullName `
        -BriefingFile "$FeatureDir/elicitor.md" `
        -ReferenceFile $GherkinFile `
        -PostRevision {
        . "$Root/utils/config.ps1"
        . "$Root/utils/invoke-claude.ps1"
        . "$Root/utils/tlc-runner.ps1"
        Invoke-TlcCheck `
            -TlaDir $TlaDir `
            -TlaWriterFile $tlaWriterFile `
            -FixContext "Original Gherkin scenarios are in: $gherkinPath"
    }.GetNewClosure() `
        -StageName "TLA+" `
        -BuildRevisionPrompt {
        param($artifactPath, $objections)
        "Read the Gherkin scenarios from: $gherkinPath`n`nRead the current spec from: $artifactPath`n`nDebate objections:`n- $objections`n`nRevise the specification to address all objections. Save all files to $TlaDir"
    }.GetNewClosure()
}
