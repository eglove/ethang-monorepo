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
. "$root/utils/debate-loop.ps1"
. "$root/utils/task-runner.ps1"
. "$root/utils/review-runner.ps1"

# Stages
. "$root/stages/1-elicitor.ps1"
. "$root/stages/2-bdd-writer.ps1"
. "$root/stages/3-bdd-debate.ps1"
. "$root/stages/4-tla-writer.ps1"
. "$root/stages/5-tla-debate.ps1"
. "$root/stages/6-implementation-writer.ps1"
. "$root/stages/7-implementation-debate.ps1"
. "$root/stages/8-coding.ps1"
. "$root/stages/9-global-review.ps1"

$debateSchema = @'
{"type":"object","properties":{"result":{"type":"string","enum":["CONSENSUS_REACHED","PARTIAL_CONSENSUS"]},"rounds":{"type":"integer"},"experts":{"type":"array","items":{"type":"string"}},"recommendation":{"type":"string"},"objections":{"type":"array","items":{"type":"string"}},"sessionFile":{"type":"string"}},"required":["result","rounds","experts","recommendation","objections","sessionFile"]}
'@

# --- Resolve feature directory ---
if ($Stage -gt 1) {
    if (-not $Feature) { throw "Resuming at stage $Stage requires -Feature <name> (e.g. -Feature lint-fixer)" }

    $featureDir = "$root/docs/$Feature"
    if (-not (Test-Path "$featureDir/elicitor.md")) { throw "Feature directory not found or missing elicitor.md: $featureDir" }

    Write-PipelineLog "=== RESUME at stage $Stage feature=$Feature ==="
    Write-Host "Resuming at stage $Stage — feature: $Feature" -ForegroundColor Cyan
    Write-Host "Feature dir: $featureDir" -ForegroundColor Gray
}
elseif (-not $Seed) {
    throw "A seed prompt is required for a fresh run. Usage: ./vibe.ps1 `"your prompt`""
}

# Clear log on fresh runs
if ($Stage -le 1) {
    Set-Content -Path $PipelineLogFile -Value ""
    Write-PipelineLog "=== PIPELINE START seed=`"$Seed`" ==="
}

# --- Reconstruct state from files ---
function Resolve-PipelineState {
    param([int]$FromStage, [string]$Dir)

    $state = @{ FeatureDir = $Dir }

    if ($FromStage -le 1) { return $state }
    $state.Briefing = Get-Content "$Dir/elicitor.md" -Raw

    if ($FromStage -le 2) { return $state }
    $gherkin = Get-ChildItem "$Dir/bdd.feature" -ErrorAction SilentlyContinue
    if (-not $gherkin) { throw "Cannot resume at stage $FromStage — missing $Dir/bdd.feature" }
    $state.GherkinFile = $gherkin.FullName

    if ($FromStage -le 4) { return $state }
    $tla = Get-ChildItem "$Dir/tla/*.tla" -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $tla) { throw "Cannot resume at stage $FromStage — missing TLA+ spec in $Dir/tla/" }
    $state.TlaFile = $tla
    $state.TlaDir  = "$Dir/tla"

    if ($FromStage -le 6) { return $state }
    $implFile = "$Dir/implementation-plan.md"
    $implJson = "$Dir/implementation-plan.json"
    if (-not (Test-Path $implFile)) { throw "Cannot resume at stage $FromStage — missing $implFile" }
    if (-not (Test-Path $implJson)) { throw "Cannot resume at stage $FromStage — missing $implJson" }
    $state.ImplFile = $implFile
    $state.ImplJson = $implJson

    return $state
}

# --- Run pipeline ---

try {

if ($Stage -le 1) {
    Write-PipelineLog "--- Stage 1: Elicitor ---"
    $elicitorResult = Invoke-Elicitor -Seed $Seed -Root $root
    $featureDir = $elicitorResult.FeatureDir
    $briefing   = $elicitorResult.Briefing
}

if ($Stage -gt 1) {
    $pState     = Resolve-PipelineState -FromStage $Stage -Dir $featureDir
    $briefing    = $pState.Briefing
    $gherkinFile = $pState.GherkinFile
    $tlaFile     = $pState.TlaFile
    $tlaDir      = $pState.TlaDir
    $implFile    = $pState.ImplFile
    $implJson    = $pState.ImplJson
}

if ($Stage -le 2) {
    Write-PipelineLog "--- Stage 2: BDD Writer ---"
    $gherkinFile = Invoke-BddWriter -Briefing $briefing -FeatureDir $featureDir -Root $root
}

if ($Stage -le 3) {
    Write-PipelineLog "--- Stage 3: BDD Debate ---"
    Invoke-BddDebate -GherkinFile $gherkinFile -Briefing $briefing -FeatureDir $featureDir -Root $root -DebateSchema $debateSchema
}

if ($Stage -le 4) {
    Write-PipelineLog "--- Stage 4: TLA+ Writer ---"
    $tlaResult = Invoke-TlaWriter -GherkinFile $gherkinFile -FeatureDir $featureDir -Root $root
    $tlaFile = $tlaResult.TlaFile
    $tlaDir  = $tlaResult.TlaDir
}

if ($Stage -le 5) {
    Write-PipelineLog "--- Stage 5: TLA+ Debate ---"
    Invoke-TlaDebate -TlaFile $tlaFile -TlaDir $tlaDir -GherkinFile $gherkinFile -FeatureDir $featureDir -Root $root -DebateSchema $debateSchema
}

if ($Stage -le 6) {
    Write-PipelineLog "--- Stage 6: Implementation Writer ---"
    $implResult = Invoke-ImplementationWriter -TlaFile $tlaFile -FeatureDir $featureDir -Root $root
    $implFile = $implResult.ImplFile
    $implJson = $implResult.ImplJson
}

if ($Stage -le 7) {
    Write-PipelineLog "--- Stage 7: Implementation Debate ---"
    Invoke-ImplementationDebate -ImplFile $implFile -ImplJson $implJson -TlaFile $tlaFile -FeatureDir $featureDir -Root $root -DebateSchema $debateSchema
}

if ($Stage -le 8) {
    Write-PipelineLog "--- Stage 8: Coding ---"
    $integrationBranch = Invoke-CodingStage -ImplJson $implJson -ImplFile $implFile -FeatureDir $featureDir -Root $root
}

if ($Stage -le 9) {
    Write-PipelineLog "--- Stage 9: Global Review ---"
    if (-not $integrationBranch) {
        $featureSlug = Split-Path $featureDir -Leaf
        $integrationBranch = "feature/$featureSlug"
    }
    Invoke-GlobalReview -IntegrationBranch $integrationBranch -Root $root
}

# Done
Write-PipelineLog "=== PIPELINE COMPLETE ==="
Write-Host "`n=== Pipeline Complete ===" -ForegroundColor Green
Write-Host "Feature dir:  $featureDir" -ForegroundColor Green
if ($integrationBranch) { Write-Host "Branch:       $integrationBranch" -ForegroundColor Green }
Write-Host "Artifacts:" -ForegroundColor Gray
Write-Host "  Briefing:       $featureDir/elicitor.md" -ForegroundColor Gray
if ($gherkinFile) { Write-Host "  BDD Scenarios:  $gherkinFile" -ForegroundColor Gray }
if ($tlaFile)     { Write-Host "  TLA+ Spec:      $($tlaFile.FullName)" -ForegroundColor Gray }
if ($implFile)    { Write-Host "  Impl Plan:      $implFile" -ForegroundColor Gray }
if ($implJson)    { Write-Host "  Impl Manifest:  $implJson" -ForegroundColor Gray }
Write-Host "  User Notes:     $root/user_notes.md" -ForegroundColor Gray

} catch {
    Write-PipelineLog "ERROR: $_"
    Write-PipelineLog "  at: $($_.InvocationInfo.PositionMessage)"
    throw
}
