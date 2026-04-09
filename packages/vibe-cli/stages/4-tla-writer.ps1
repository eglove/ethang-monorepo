. "$PSScriptRoot/../utils/tlc-runner.ps1"

function Invoke-TlaWriter {
    param(
        [Parameter(Mandatory)]
        [string]$GherkinFile,

        [Parameter(Mandatory)]
        [string]$FeatureDir,

        [Parameter(Mandatory)]
        [string]$Root
    )

    Write-Host "`n=== Stage 4: TLA+ Writer ===" -ForegroundColor Cyan

    $gherkin        = Get-Content $GherkinFile -Raw
    $tlaDir         = (Resolve-Path $FeatureDir).Path | Join-Path -ChildPath "tla"
    $tlaWriterFile  = "$Root/agents/doc-writers/tla-writer.md"

    Invoke-Claude `
        -SystemPromptFile $tlaWriterFile `
        -Prompt "Gherkin scenarios:`n$gherkin`n`nWrite the TLA+ specification. Save all files to: $tlaDir" | Out-Null

    Invoke-TlcCheck `
        -TlaDir $tlaDir `
        -TlaWriterFile $tlaWriterFile `
        -FixContext "Original Gherkin scenarios:`n$gherkin"

    $tlaFile = Get-ChildItem "$tlaDir/*.tla" | Select-Object -First 1
    return @{
        TlaFile = $tlaFile
        TlaDir  = $tlaDir
    }
}
