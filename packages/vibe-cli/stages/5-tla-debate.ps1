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
        [string]$Root,

        [Parameter(Mandatory)]
        [string]$DebateSchema
    )

    Write-Host "`n=== Stage 5: TLA+ Debate ===" -ForegroundColor Cyan

    . "$Root/utils/tlc-runner.ps1"

    $gherkin = Get-Content $GherkinFile -Raw
    $tlaWriterFile = "$Root/agents/doc-writers/tla-writer.md"

    Invoke-DebateLoop `
        -DebateModFile "$Root/agents/debate-moderator.md" `
        -DebateSchema $DebateSchema `
        -WriterFile $tlaWriterFile `
        -DebateContext "Review this TLA+ specification against the BDD scenarios. Focus on whether the spec correctly captures all states, transitions, safety properties, and liveness properties. Identify any scenarios missing from the spec or spec behaviors contradicting the scenarios." `
        -SessionFile "$FeatureDir/tla-debate.md" `
        -ArtifactFile $TlaFile.FullName `
        -BriefingFile "$FeatureDir/elicitor.md" `
        -ReferenceFile $GherkinFile `
        -PostRevision {
        Write-Host "  Running TLC after debate revision..." -ForegroundColor Yellow
        Invoke-TlcCheck `
            -TlaDir $TlaDir `
            -TlaWriterFile $tlaWriterFile `
            -FixContext "Original Gherkin scenarios:`n$gherkin"
    }.GetNewClosure() `
        -StageName "TLA+" `
        -BuildRevisionPrompt {
        param($current, $objections)
        "Gherkin scenarios:`n$gherkin`n`nCurrent spec:`n$current`n`nDebate objections:`n- $objections`n`nRevise the specification to address all objections. Save all files to $TlaDir"
    }.GetNewClosure()
}
