function Invoke-BddWriter {
    param(
        [Parameter(Mandatory)]
        [string]$Briefing,

        [Parameter(Mandatory)]
        [string]$FeatureDir,

        [Parameter(Mandatory)]
        [string]$Root
    )

    Write-Host "`n=== Stage 2: BDD Writer ===" -ForegroundColor Cyan

    $outputFile = (Resolve-Path $FeatureDir).Path | Join-Path -ChildPath "bdd.feature"

    Invoke-Claude `
        -SystemPromptFile "$Root/agents/doc-writers/bdd-writer.md" `
        -Prompt "Briefing:`n$Briefing`nSave to: $outputFile" | Out-Null

    $gherkinFile = $outputFile
    if (-not (Test-Path $gherkinFile)) { throw "BDD writer did not produce $gherkinFile" }

    return $gherkinFile
}
