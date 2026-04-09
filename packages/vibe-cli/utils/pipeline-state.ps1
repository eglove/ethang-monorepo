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
    $state.TlaDir = "$Dir/tla"

    if ($FromStage -le 6) { return $state }
    $implFile = "$Dir/implementation-plan.md"
    $implJson = "$Dir/implementation-plan.json"
    if (-not (Test-Path $implFile)) { throw "Cannot resume at stage $FromStage — missing $implFile" }
    if (-not (Test-Path $implJson)) { throw "Cannot resume at stage $FromStage — missing $implJson" }
    $state.ImplFile = $implFile
    $state.ImplJson = $implJson

    return $state
}
