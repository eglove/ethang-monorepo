function Invoke-ImplementationWriter {
    param(
        [Parameter(Mandatory)]
        [string]$FeatureDir,

        [Parameter(Mandatory)]
        [string]$Root
    )

    $absDir = (Resolve-Path $FeatureDir).Path
    $implFile = Join-Path $absDir "implementation-plan.md"
    $implJson = Join-Path $absDir "implementation-plan.json"

    Invoke-Claude `
        -SystemPromptFile "$Root/agents/doc-writers/implementation-writer.md" `
        -Prompt "Read all artifacts in the feature directory: $absDir`n`nSave the markdown plan to: $implFile`nSave the JSON manifest to: $implJson" | Out-Null

    if (-not (Test-Path $implFile)) { throw "Implementation writer did not produce $implFile" }
    if (-not (Test-Path $implJson)) { throw "Implementation writer did not produce $implJson" }

    return @{
        ImplFile = $implFile
        ImplJson = $implJson
    }
}
