param(
    [Parameter(Position = 0)]
    [string]$Seed,

    [switch]$Resume
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

# ── Double Ctrl+C force close ──
$script:_ctrlCTime = [datetime]::MinValue
$script:_ctrlCHandler = [ConsoleCancelEventHandler]{
    param($_sender, $e)
    $now = [datetime]::UtcNow
    if (($now - $script:_ctrlCTime).TotalSeconds -le 5) {
        # Second press within 5s — let it kill the process
        return
    }
    $e.Cancel = $true
    $script:_ctrlCTime = $now
    Write-Host "`nCtrl+C received — press again within 5s to force quit" -ForegroundColor Yellow
}
[Console]::add_CancelKeyPress($script:_ctrlCHandler)

# UTF-8 encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Utilities
. "$root/utils/invoke-claude.ps1"
. "$root/utils/invoke-verify.ps1"
. "$root/utils/pipeline-log.ps1"
. "$root/utils/resolve-pipeline-state.ps1"
. "$root/utils/invoke-parallel.ps1"
. "$root/utils/unified-debate-loop.ps1"
. "$root/utils/debate-loop.ps1"
. "$root/utils/gherkin-parser.ps1"
. "$root/utils/tlc-parser.ps1"
. "$root/utils/fixture-gate.ps1"
. "$root/utils/resume.ps1"
. "$root/utils/resolve-target-root.ps1"

# Stub: pipeline-state.ps1 was removed in code-simplify
if (-not (Get-Command New-PipelineState -ErrorAction SilentlyContinue)) {
    function New-PipelineState { # PSScriptAnalyzer suppress — stub only
        [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
        param()
        return @{
            pipelineState      = 'idle'
            lockHolder         = $null
            reviewRound        = [int]0
            keepGoingResets    = [int]0
            tddKeepGoingCount = [int]0
            verdict            = $null
            tasksDone          = [int]0
            reviewGateType     = 'none'
        }
    }
}

# Stages
. "$root/stages/1-elicitor.ps1"
. "$root/stages/2-parallel-writers.ps1"
. "$root/stages/3-unified-debate.ps1"
. "$root/stages/4-post-debate.ps1"
. "$root/stages/5-implementation-writer.ps1"
. "$root/stages/6-implementation-debate.ps1"
. "$root/stages/7-coding.ps1"

# --- Parameter validation ---
if ($Seed -and $Resume) {
    throw "Cannot specify both `$Seed and -Resume. Use `$Seed for a fresh run or -Resume to continue."
}
if (-not $Seed -and -not $Resume) {
    throw "A seed prompt is required for a fresh run. Usage: ./vibe.ps1 `"your prompt`" or ./vibe.ps1 -Resume"
}

# --- Resume mode ---
$startStage = 1
if ($Resume) {
    $logPath = Join-Path $root 'pipeline.log'
    $resumeState = Resume-Pipeline -Root $root -LogPath $logPath

    if ($resumeState.Completed) {
        Write-PipelineLog -Message "Pipeline already complete for feature '$($resumeState.Feature)'. Nothing to resume." -Root $root
        return
    }

    $featureName = $resumeState.Feature
    $featureDir = "$root/docs/$featureName"
    $startStage = $resumeState.ResumeStage

    if (-not (Test-Path "$featureDir/elicitor.md")) {
        throw "Feature directory not found or missing elicitor.md: $featureDir"
    }

    Write-PipelineLog -Message "=== RESUME at stage $startStage feature=$featureName ===" -Root $root
    Write-PipelineLog -Message "Feature dir: $featureDir" -Root $root

    # Resolve state from prior stages
    $pState = Resolve-PipelineState -FromStage $startStage -Dir $featureDir
    $gherkinFile = $pState.GherkinFile
    $tlaFile = $pState.TlaFile
    $implFile = $pState.ImplFile
    $implJson = $pState.ImplJson
}

# --- Fresh run ---
if (-not $Resume) {
    Set-Content -Path (Join-Path $root 'pipeline.log') -Value ""
    Write-PipelineLog -Message "=== PIPELINE START seed=`"$Seed`" ===" -Root $root
}

# --- Run pipeline ---
try {

    # Stage 1: Elicitor
    if ($startStage -le 1) {
        Write-PipelineLog -Message "--- Stage 1: Elicitor ---" -Root $root
        $elicitorResult = Invoke-Elicitor -Seed $Seed -Root $root
        $featureDir = $elicitorResult.FeatureDir
        $featureName = Split-Path $featureDir -Leaf
    }

    # Resolve target package root
    $monorepoRoot = (Resolve-Path "$root/../..").Path
    $targetRoot = Resolve-TargetRoot -FeatureDir $featureDir -MonorepoRoot $monorepoRoot -FallbackRoot $root
    Write-PipelineLog -Message "Target root: $targetRoot" -Root $root

    # Stage 2: Parallel Writers
    if ($startStage -le 2) {
        Write-PipelineLog -Message "--- Stage 2: Parallel Writers ---" -Root $root
        $writerResult = Invoke-ParallelWriter -FeatureDir $featureDir -Root $root
        if (-not $writerResult.Success) {
            throw "Stage 2 failed: $($writerResult.Error)"
        }
        $gherkinFile = $writerResult.GherkinFile
        $tlaFile = $writerResult.TlaFile
    }

    # Stage 3: Unified Debate
    if ($startStage -le 3) {
        Write-PipelineLog -Message "--- Stage 3: Unified Debate ---" -Root $root
        $debateResult = Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $root
        if (-not $debateResult.Success) {
            throw "Stage 3 failed: $($debateResult.Error)"
        }
    }

    # Stage 4: Post-Debate Artifacts
    if ($startStage -le 4) {
        Write-PipelineLog -Message "--- Stage 4: Post-Debate Artifacts ---" -Root $root
        $postDebateResult = Invoke-PostDebate -FeatureDir $featureDir -Root $root -TargetRoot $targetRoot
        if (-not $postDebateResult.Success) {
            throw "Stage 4 failed: $($postDebateResult.Error)"
        }
    }

    # Stage 5: Implementation Writer
    if ($startStage -le 5) {
        Write-PipelineLog -Message "--- Stage 5: Implementation Writer ---" -Root $root
        $bddPath = if ($gherkinFile) { $gherkinFile } else { Join-Path $featureDir 'bdd.feature' }
        $tlaPath = if ($tlaFile) {
            if ($tlaFile -is [string]) { $tlaFile } else { $tlaFile.FullName }
        }
        else {
            $found = Get-ChildItem (Join-Path $featureDir 'tla') -Filter '*.tla' -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { $found.FullName } else { $null }
        }
        $implResult = Invoke-ImplementationWriterStage -FeatureDir $featureDir -Root $root -BddFeaturePath $bddPath -TlaSpecPath $tlaPath
        if (-not $implResult.Success) {
            throw "Stage 5 failed: $($implResult.Error)"
        }
        $implFile = $implResult.ImplFile
        $implJson = $implResult.ImplJson
    }

    # Stage 6: Implementation Debate
    if ($startStage -le 6) {
        Write-PipelineLog -Message "--- Stage 6: Implementation Debate ---" -Root $root
        $tlaFileForDebate = if ($tlaFile) {
            if ($tlaFile -is [string]) { $tlaFile } else { $tlaFile.FullName }
        }
        else {
            $found = Get-ChildItem (Join-Path $featureDir 'tla') -Filter '*.tla' -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { $found.FullName } else { $null }
        }
        if (-not $implFile) { $implFile = Join-Path $featureDir 'implementation-plan.md' }
        if (-not $implJson) { $implJson = Join-Path $featureDir 'implementation-plan.json' }
        $debateStageResult = Invoke-ImplementationDebateStage -ImplFile $implFile -ImplJson $implJson -TlaFile $tlaFileForDebate -FeatureDir $featureDir -Root $root
        if (-not $debateStageResult.Success) {
            throw "Stage 6 failed: $($debateStageResult.Error)"
        }
    }

    # Stage 7: Coding
    if ($startStage -le 7) {
        # Verify BDD fixture precondition
        $fixtureCheck = Test-FixturePrecondition -Root $targetRoot -FeatureName $featureName
        if (-not $fixtureCheck.canProceed) {
            throw "Cannot enter coding stage — missing or invalid BDD fixture."
        }
        Write-PipelineLog -Message "Fixture precondition OK" -Root $root

        Write-PipelineLog -Message "--- Stage 7: Coding ---" -Root $root
        $codingResult = Invoke-CodingStage -Feature $featureName -Root $targetRoot
        Write-PipelineLog -Message "Stage 7 result: $($codingResult.Status)" -Root $root

        if ($codingResult.Status -match '^halted_') {
            throw "Stage 7 halted: $($codingResult.Status)"
        }
    }

    # Done
    Write-PipelineLog -Message "=== PIPELINE COMPLETE ===" -Root $root
    Write-PipelineLog -Message "Feature dir: $featureDir" -Root $root

}
catch {
    Write-PipelineLog -Message "ERROR: $_" -Root $root
    Write-PipelineLog -Message "  at: $($_.InvocationInfo.PositionMessage)" -Root $root
    throw
}
finally {
    [Console]::remove_CancelKeyPress($script:_ctrlCHandler)
}
