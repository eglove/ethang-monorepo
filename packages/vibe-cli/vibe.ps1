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
# Stub: pipeline-state.ps1 was removed in code-simplify
if (-not (Get-Command New-PipelineState -ErrorAction SilentlyContinue)) {
    function New-PipelineState {
        return @{
            pipelineState      = 'idle'
            lockHolder         = $null
            reviewRound        = [int]0
            keepGoingResets    = [int]0
            tddKeepGoingCount = [int]0
            verdict            = $null
            tasksDone          = [int]0
            gateTimedOut       = $false
            globalTimedOut     = $false
            reviewGateType     = 'none'
        }
    }
}
if (-not (Get-Command Resolve-PipelineState -ErrorAction SilentlyContinue)) {
    function Resolve-PipelineState {
        param([int]$FromStage, [string]$Dir)
        $result = @{}
        $result.FeatureDir = $Dir
        if ($FromStage -le 1) { return $result }
        $elicitor = Join-Path $Dir 'elicitor.md'
        if (-not (Test-Path $elicitor)) { throw "missing elicitor.md in $Dir" }
        $result.Briefing = Get-Content $elicitor -Raw
        if ($FromStage -le 2) { return $result }
        $bdd = Join-Path $Dir 'bdd.feature'
        if (-not (Test-Path $bdd)) { throw "missing bdd.feature in $Dir" }
        $result.GherkinFile = $bdd
        if ($FromStage -le 4) { return $result }
        $tlaDir = Join-Path $Dir 'tla'
        $tlaFile = Get-ChildItem $tlaDir -Filter '*.tla' -ErrorAction SilentlyContinue | Select-Object -First 1
        if (-not $tlaFile) { throw "missing TLA+ spec in $Dir" }
        $result.TlaFile = $tlaFile.FullName
        $result.TlaDir = $tlaDir
        if ($FromStage -le 6) { return $result }
        $implMd = Join-Path $Dir 'implementation-plan.md'
        if (-not (Test-Path $implMd)) { throw "missing implementation-plan.md in $Dir" }
        $result.ImplFile = $implMd
        $implJson = Join-Path $Dir 'implementation-plan.json'
        if (-not (Test-Path $implJson)) { throw "missing implementation-plan.json in $Dir" }
        $result.ImplJson = $implJson
        if ($FromStage -le 7) { return $result }
        $logsDir = Join-Path $Dir 'logs'
        if (-not (Test-Path $logsDir)) { throw "missing logs directory in $Dir" }
        $implJsonContent = Get-Content $implJson -Raw | ConvertFrom-Json
        $result.Plan = $implJsonContent
        $result.CompletedTasks = @()
        $result.MergedTasks = @()
        return $result
    }
}
. "$root/utils/debate-loop.ps1"
. "$root/utils/gherkin-parser.ps1"
. "$root/utils/tlc-parser.ps1"
. "$root/utils/fixture-gate.ps1"

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
    $featureName = $Feature
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
        $featureName = Split-Path $featureDir -Leaf
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

        # Generate BDD fixture after debate consensus (T10)
        if ($gherkinFile -and (Test-Path $gherkinFile)) {
            Write-PipelineLog "Generating BDD test fixtures..." -Color Yellow
            $bddFixturePath = Join-Path (Get-FixtureDir -Root $root -FeatureName $featureName) 'bdd/fixture.json'
            $parsedGherkin = ConvertFrom-Gherkin -Path $gherkinFile
            $parsedGherkin.schemaVersion = 1
            Export-BddFixture -Fixture $parsedGherkin -OutputPath $bddFixturePath
            Write-PipelineLog "BDD fixture generated: $bddFixturePath" -Color Green
        }
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
        # Pass BDD and TLA+ spec paths to implementation writer (T11)
        $bddPath = if ($gherkinFile) { $gherkinFile } else { $null }
        $tlaPath = if ($tlaFile) { $tlaFile.FullName } else { $null }
        $implResult = Invoke-ImplementationWriter -FeatureDir $featureDir -Root $root -BddFeaturePath $bddPath -TlaSpecPath $tlaPath
        $implFile = $implResult.ImplFile
        $implJson = $implResult.ImplJson
    }

    if ($Stage -le 7) {
        Write-PipelineLog "--- Stage 7: Implementation Debate ---" -Color Cyan
        Invoke-ImplementationDebate -ImplFile $implFile -ImplJson $implJson -TlaFile $tlaFile -FeatureDir $featureDir -Root $root
    }

    if ($Stage -le 8) {
        # Verify BDD fixture precondition before coding stage
        $fixtureCheck = Test-FixturePrecondition -Root $root -FeatureName $featureName
        if (-not $fixtureCheck.canProceed) {
            throw "Cannot enter coding stage — missing or invalid BDD fixture. Run stage 3 first."
        }
        Write-PipelineLog "Fixture precondition OK (BDD valid)" -Color Green

        Write-PipelineLog "--- Stage 8: Coding ---" -Color Cyan
        $codingResult = Invoke-CodingStage -Feature $featureName -Root $root
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
