function Invoke-Elicitor {
    param(
        [Parameter(Mandatory)]
        [string]$Seed,

        [Parameter(Mandatory)]
        [string]$Root
    )

    Invoke-Claude -Interactive `
        -Role elicitor `
        -AppendSystemPromptFile "$Root/agents/doc-writers/elicitor.md" `
        -Prompt "Interview me about: $Seed"

    $elicitorOutput = Get-ChildItem "$Root/docs/*/elicitor.md" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $elicitorOutput) { throw "No elicitor output found in $Root/docs/" }

    $featureName = Split-Path $elicitorOutput.DirectoryName -Leaf
    Write-PipelineLog -Message "STAGE_COMPLETE:1:$featureName" -Root $Root

    return @{
        FeatureDir = $elicitorOutput.DirectoryName
        Briefing   = Get-Content $elicitorOutput -Raw
    }
}
