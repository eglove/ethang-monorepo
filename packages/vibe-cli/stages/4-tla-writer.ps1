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

    $gherkinPath = (Resolve-Path $GherkinFile).Path
    $tlaDir = (Resolve-Path $FeatureDir).Path | Join-Path -ChildPath "tla"
    New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
    $tlaWriterFile = "$Root/agents/doc-writers/tla-writer.md"

    Invoke-Claude `
        -SystemPromptFile $tlaWriterFile `
        -Prompt "Read the Gherkin scenarios from: $gherkinPath`n`nWrite the TLA+ specification. Save all files to: $tlaDir" | Out-Null

    Invoke-TlcCheck `
        -TlaDir $tlaDir `
        -TlaWriterFile $tlaWriterFile `
        -FixContext "Original Gherkin scenarios are in: $gherkinPath"

    $tlaFile = Get-ChildItem "$tlaDir/*.tla" | Select-Object -First 1
    return @{
        TlaFile = $tlaFile
        TlaDir  = $tlaDir
    }
}
