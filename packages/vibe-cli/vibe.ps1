param(
    [Parameter(Position = 0)]
    [string]$Seed,

    [int]$Stage = 1,

    [string]$Feature
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

# Config and shared functions
. "$root/utils/config.ps1"
. "$root/utils/pipeline-state.ps1"
. "$root/utils/debate-loop.ps1"

Start-HeadroomProxy

# Stages
. "$root/stages/1-elicitor.ps1"
. "$root/stages/2-bdd-writer.ps1"
. "$root/stages/3-bdd-debate.ps1"
. "$root/stages/4-tla-writer.ps1"
. "$root/stages/5-tla-debate.ps1"
. "$root/stages/6-implementation-writer.ps1"
. "$root/stages/7-implementation-debate.ps1"
. "$root/stages/8-coding.ps1"

# --- Resolve feature directory ---
if ($Stage -gt 1) {
    if (-not $Feature) { throw "Resuming at stage $Stage requires -Feature <name> (e.g. -Feature lint-fixer)" }

    $featureDir = "$root/docs/$Feature"
    if (-not (Test-Path "$featureDir/elicitor.md")) { throw "Feature directory not found or missing elicitor.md: $featureDir" }

    Write-PipelineLog "=== RESUME at stage $Stage feature=$Feature ===" -Color Cyan
    Write-PipelineLog "Feature dir: $featureDir"
}
elseif (-not $Seed) {
    throw "A seed prompt is required for a fresh run. Usage: ./vibe.ps1 `"your prompt`""
}

# Clear log on fresh runs
if ($Stage -le 1) {
    Set-Content -Path $PipelineLogFile -Value ""
    Write-PipelineLog "=== PIPELINE START seed=`"$Seed`" ===" -Color Cyan
}

# --- Run pipeline ---

try {

    if ($Stage -le 1) {
        Write-PipelineLog "--- Stage 1: Elicitor ---" -Color Cyan
        $elicitorResult = Invoke-Elicitor -Seed $Seed -Root $root
        $featureDir = $elicitorResult.FeatureDir
        $briefing = $elicitorResult.Briefing
    }

    if ($Stage -gt 1) {
        $pState = Resolve-PipelineState -FromStage $Stage -Dir $featureDir
        $briefing = $pState.Briefing
        $gherkinFile = $pState.GherkinFile
        $tlaFile = $pState.TlaFile
        $tlaDir = $pState.TlaDir
        $implFile = $pState.ImplFile
        $implJson = $pState.ImplJson
    }

    if ($Stage -le 2) {
        Write-PipelineLog "--- Stage 2: BDD Writer ---" -Color Cyan
        $gherkinFile = Invoke-BddWriter -Briefing $briefing -FeatureDir $featureDir -Root $root
    }

    if ($Stage -le 3) {
        Write-PipelineLog "--- Stage 3: BDD Debate ---" -Color Cyan
        Invoke-BddDebate -GherkinFile $gherkinFile -FeatureDir $featureDir -Root $root
    }

    if ($Stage -le 4) {
        Write-PipelineLog "--- Stage 4: TLA+ Writer ---" -Color Cyan
        $tlaResult = Invoke-TlaWriter -GherkinFile $gherkinFile -FeatureDir $featureDir -Root $root
        $tlaFile = $tlaResult.TlaFile
        $tlaDir = $tlaResult.TlaDir
    }

    if ($Stage -le 5) {
        Write-PipelineLog "--- Stage 5: TLA+ Debate ---" -Color Cyan
        Invoke-TlaDebate -TlaFile $tlaFile -TlaDir $tlaDir -GherkinFile $gherkinFile -FeatureDir $featureDir -Root $root
    }

    if ($Stage -le 6) {
        Write-PipelineLog "--- Stage 6: Implementation Writer ---" -Color Cyan
        $implResult = Invoke-ImplementationWriter -TlaFile $tlaFile -FeatureDir $featureDir -Root $root
        $implFile = $implResult.ImplFile
        $implJson = $implResult.ImplJson
    }

    if ($Stage -le 7) {
        Write-PipelineLog "--- Stage 7: Implementation Debate ---" -Color Cyan
        Invoke-ImplementationDebate -ImplFile $implFile -ImplJson $implJson -TlaFile $tlaFile -FeatureDir $featureDir -Root $root
    }

    if ($Stage -le 8) {
        Write-PipelineLog "--- Stage 8: Coding ---" -Color Cyan
        if (-not $implJson) {
            $implJson = "$featureDir/implementation-plan.json"
        }
        $codingResult = Invoke-CodingStage -PlanJsonPath $implJson -Root $root -FeatureDir $featureDir
        Write-PipelineLog "Stage 8 result: $($codingResult.PipelineStatus)" -Color $(if ($codingResult.PipelineStatus -eq 'completed') { 'Green' } else { 'Red' })
    }

    # Done
    Write-PipelineLog "=== PIPELINE COMPLETE ===" -Color Green
    Write-PipelineLog "Feature dir:  $featureDir" -Color Green
    Write-PipelineLog "  Briefing:       $featureDir/elicitor.md"
    if ($gherkinFile) { Write-PipelineLog "  BDD Scenarios:  $gherkinFile" }
    if ($tlaFile) { Write-PipelineLog "  TLA+ Spec:      $($tlaFile.FullName)" }
    if ($implFile) { Write-PipelineLog "  Impl Plan:      $implFile" }
    if ($implJson) { Write-PipelineLog "  Impl Manifest:  $implJson" }

}
catch {
    Write-PipelineLog "ERROR: $_" -Color Red
    Write-PipelineLog "  at: $($_.InvocationInfo.PositionMessage)" -Color Red
    throw
}
