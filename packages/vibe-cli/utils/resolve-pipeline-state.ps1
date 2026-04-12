function Resolve-PipelineState {
    param(
        [Parameter(Mandatory)][int]$FromStage,
        [Parameter(Mandatory)][string]$Dir
    )

    $result = @{ FeatureDir = $Dir }

    if ($FromStage -le 1) { return $result }

    # Stage 2+: requires elicitor.md
    $elicitor = Join-Path $Dir 'elicitor.md'
    if (-not (Test-Path $elicitor)) { throw "missing elicitor.md in $Dir" }
    $result.Briefing = Get-Content $elicitor -Raw

    if ($FromStage -le 2) { return $result }

    # Stage 3+: requires bdd.feature and .tla file
    $bdd = Join-Path $Dir 'bdd.feature'
    if (-not (Test-Path $bdd)) { throw "missing bdd.feature in $Dir" }
    $result.GherkinFile = $bdd

    $tlaDir = Join-Path $Dir 'tla'
    $tlaFile = Get-ChildItem $tlaDir -Filter '*.tla' -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $tlaFile) { throw "missing TLA+ spec in $Dir/tla/" }
    $result.TlaFile = $tlaFile.FullName
    $result.TlaDir = $tlaDir

    if ($FromStage -le 3) { return $result }

    # Stage 4+: requires unified-debate.md
    $unifiedDebate = Join-Path $Dir 'unified-debate.md'
    if (-not (Test-Path $unifiedDebate)) { throw "missing unified-debate.md in $Dir" }
    $result.UnifiedDebateFile = $unifiedDebate

    if ($FromStage -le 4) { return $result }

    # Stage 5+: requires fixture JSON
    $fixtureJson = Join-Path $Dir 'bdd-fixture.json'
    if (-not (Test-Path $fixtureJson)) {
        # Also check legacy path pattern
        $featureName = Split-Path $Dir -Leaf
        $altPath = Join-Path (Split-Path $Dir -Parent) "../fixtures/$featureName/bdd.json"
        if (Test-Path $altPath) {
            $fixtureJson = (Resolve-Path $altPath).Path
        }
        else {
            throw "missing fixture JSON (bdd-fixture.json) in $Dir"
        }
    }
    $result.FixtureJson = $fixtureJson

    if ($FromStage -le 5) { return $result }

    # Stage 6+: requires implementation-plan.md and .json
    $implMd = Join-Path $Dir 'implementation-plan.md'
    if (-not (Test-Path $implMd)) { throw "missing implementation-plan.md in $Dir" }
    $result.ImplFile = $implMd

    $implJson = Join-Path $Dir 'implementation-plan.json'
    if (-not (Test-Path $implJson)) { throw "missing implementation-plan.json in $Dir" }
    $result.ImplJson = $implJson

    if ($FromStage -le 6) { return $result }

    # Stage 7+: requires implementation debate output
    $implDebate = Join-Path $Dir 'impl-debate.md'
    if (-not (Test-Path $implDebate)) { throw "missing impl-debate.md in $Dir" }
    $result.ImplDebateFile = $implDebate

    return $result
}
