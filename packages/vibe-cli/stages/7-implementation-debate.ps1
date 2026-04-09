function Invoke-ImplementationDebate {
    param(
        [Parameter(Mandatory)]
        [string]$ImplFile,

        [Parameter(Mandatory)]
        [string]$ImplJson,

        [Parameter(Mandatory)]
        [object]$TlaFile,

        [Parameter(Mandatory)]
        [string]$FeatureDir,

        [Parameter(Mandatory)]
        [string]$Root,

        [Parameter(Mandatory)]
        [string]$DebateSchema
    )

    Write-Host "`n=== Stage 7: Implementation Debate ===" -ForegroundColor Cyan

    $tlaSpec = Get-Content $TlaFile -Raw

    Invoke-DebateLoop `
        -DebateModFile "$Root/agents/debate-moderator.md" `
        -DebateSchema $DebateSchema `
        -WriterFile "$Root/agents/doc-writers/implementation-writer.md" `
        -DebateContext "Review this implementation plan against the TLA+ specification. Focus on whether every state and transition is covered, whether step ordering respects dependencies, whether test descriptions are specific enough, and whether the execution tiers are correctly parallelized." `
        -SessionFile "$FeatureDir/impl-debate.md" `
        -ArtifactFile $ImplFile `
        -BriefingFile "$FeatureDir/elicitor.md" `
        -ReferenceFile $TlaFile.FullName `
        -StageName "Implementation" `
        -BuildRevisionPrompt {
        param($current, $objections)
        "TLA+ specification:`n$tlaSpec`n`nCurrent plan:`n$current`n`nDebate objections:`n- $objections`n`nRevise the plan to address all objections. Save markdown to $ImplFile and JSON manifest to $ImplJson"
    }.GetNewClosure()
}
