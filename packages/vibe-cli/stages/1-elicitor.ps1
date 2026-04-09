function Invoke-Elicitor {
    param(
        [Parameter(Mandatory)]
        [string]$Seed,

        [Parameter(Mandatory)]
        [string]$Root
    )

    Write-Host "`n=== Stage 1: Elicitor ===" -ForegroundColor Cyan

    Invoke-Claude -Interactive `
        -AppendSystemPromptFile "$Root/agents/doc-writers/elicitor.md" `
        -Prompt "Interview me about: $Seed"

    $elicitorOutput = Get-ChildItem "$Root/docs/*/elicitor.md" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $elicitorOutput) { throw "No elicitor output found in $Root/docs/" }

    return @{
        FeatureDir = $elicitorOutput.DirectoryName
        Briefing   = Get-Content $elicitorOutput -Raw
    }
}
