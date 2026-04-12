# Stage 8 — Coding Stage (thin orchestrator)
# Each function lives in its own file under utils/.

. "$PSScriptRoot/../utils/pipeline-lock.ps1"
. "$PSScriptRoot/../utils/pipeline-log.ps1"
. "$PSScriptRoot/../utils/invoke-claude.ps1"
. "$PSScriptRoot/../utils/review-loop.ps1"
. "$PSScriptRoot/../utils/per-worktree-double-pass.ps1"
. "$PSScriptRoot/../utils/per-worktree-review.ps1"
. "$PSScriptRoot/../utils/per-worktree-gates.ps1"
. "$PSScriptRoot/../utils/sequential-merge.ps1"
. "$PSScriptRoot/../utils/worktree-cleanup.ps1"
. "$PSScriptRoot/../utils/global-double-pass.ps1"
. "$PSScriptRoot/../utils/global-review.ps1"
. "$PSScriptRoot/../utils/complete-pipeline.ps1"

function Invoke-CodingStage {
    param(
        [Parameter(Mandatory)][string]$Feature,
        [string]$Root = (Resolve-Path "$PSScriptRoot/..").Path,
        [switch]$Resume
    )

    # ── Resume: parse last marker from pipeline.log ──
    $startTier = 1
    $skipToGlobal = $false

    if ($Resume) {
        # Re-validate inputs (R2-6)
        $planPath = Join-Path $Root "docs/$Feature/implementation-plan.json"
        if (-not (Test-Path $planPath)) {
            Write-PipelineLog -Message "HALTED: resume failed — implementation-plan.json not found" -Root $Root
            return @{
                Status  = 'halted_validation'
                Message = "Resume failed: implementation-plan.json not found at $planPath"
            }
        }

        $bddFixture = Join-Path $Root "fixtures/$Feature/bdd.json"
        if (-not (Test-Path $bddFixture)) {
            Write-PipelineLog -Message "HALTED: resume failed — BDD fixture not found" -Root $Root
            return @{
                Status  = 'halted_validation'
                Message = "Resume failed: BDD fixture not found at $bddFixture"
            }
        }

        $tlaFixture = Join-Path $Root "fixtures/$Feature/tla.json"
        if (-not (Test-Path $tlaFixture)) {
            Write-PipelineLog -Message "HALTED: resume failed — TLA fixture not found" -Root $Root
            return @{
                Status  = 'halted_validation'
                Message = "Resume failed: TLA fixture not found at $tlaFixture"
            }
        }

        $logPath = Join-Path $Root 'pipeline.log'
        $lastCompletedTier = 0

        if (Test-Path $logPath) {
            $logContent = Get-Content $logPath -Raw
            $markerMatches = [regex]::Matches($logContent, '>>> MARKER TIER_(\d+)_COMPLETE')
            if ($markerMatches.Count -gt 0) {
                $lastCompletedTier = [int]$markerMatches[$markerMatches.Count - 1].Groups[1].Value
            }
        }

        # Read plan to get MaxTiers
        $planRaw = Get-Content $planPath -Raw
        $planObj = $planRaw | ConvertFrom-Json
        $maxTiers = @($planObj.tiers).Count

        if (-not (Test-Path $logPath)) {
            Write-PipelineLog -Message "WARNING: --resume with no pipeline.log — starting fresh" -Root $Root
            $startTier = 1
        }
        elseif ($lastCompletedTier -eq 0) {
            Write-PipelineLog -Message "WARNING: --resume with no completed tiers — starting fresh" -Root $Root
            $startTier = 1
        }
        elseif ($lastCompletedTier -ge $maxTiers) {
            Write-PipelineLog -Message "Resume: all $maxTiers tier(s) complete — jumping to GlobalDoublePass" -Root $Root
            $skipToGlobal = $true
        }
        else {
            $startTier = $lastCompletedTier + 1
            Write-PipelineLog -Message "Resume: last completed tier=$lastCompletedTier — resuming from tier $startTier" -Root $Root
        }

        # Clean up orphan worktrees (R1-4)
        $worktreeOutput = git -C $Root worktree list 2>&1
        $worktreeLines = @($worktreeOutput | Where-Object { $_ -and $_ -notmatch '\(bare\)' })
        if ($worktreeLines.Count -gt 1) {
            Write-PipelineLog -Message "Resume: detected $($worktreeLines.Count - 1) orphan worktree(s) — cleaning up" -Root $Root
            foreach ($wtLine in $worktreeLines) {
                if ($wtLine -eq $worktreeLines[0]) { continue }
                $wtPath = ($wtLine -split '\s+')[0]
                git -C $Root worktree remove $wtPath --force 2>&1 | Out-Null
            }
        }

        # Detect already-merged branches (R1-4)
        $mergedBranches = git -C $Root branch --merged 2>&1
        $script:AlreadyMergedBranches = @($mergedBranches | ForEach-Object { $_.Trim().TrimStart('* ') } | Where-Object { $_ })

        # Reclaim stale lock
        try {
            $lockState = Lock-Pipeline -LockDir $Root -Feature $Feature -Resume
        }
        catch {
            Write-PipelineLog -Message "Resume: reclaiming stale lock" -Root $Root
            Unlock-Pipeline -LockDir $Root
            $lockState = Lock-Pipeline -LockDir $Root -Feature $Feature
        }
    }

    if (-not $Resume) {
        # ── Phase 1: Pre-Coding Gate ──
        $gitStatus = git -C $Root status --porcelain
        if ($gitStatus) {
            $response = Read-Host "Uncommitted changes found. Commit now? (y/n)"
            if ($response -eq 'y') {
                git -C $Root add -A
                git -C $Root commit -m "Pre-Stage8 auto-commit"
            }
            else {
                Write-PipelineLog -Message "Pipeline halted: uncommitted changes must be committed before Stage 8 can proceed." -Root $Root
                return @{
                    Status  = 'halted_uncommitted'
                    Message = 'Pipeline halted: uncommitted changes must be committed before Stage 8 can proceed.'
                }
            }
        }

        # ── Phase 2: Pipeline Lock ──
        try {
            $lockState = Lock-Pipeline -LockDir $Root -Feature $Feature
        }
        catch {
            Write-PipelineLog -Message "Lock acquisition failed: $($_.Exception.Message)" -Root $Root
            return @{
                Status  = 'halted_lock'
                Message = $_.Exception.Message
            }
        }
    }

    try {
        # ── Phase 3: Input Validation ──

        $planPath = Join-Path $Root "docs/$Feature/implementation-plan.json"
        if (-not (Test-Path $planPath)) {
            Write-PipelineLog -Message "Halted: implementation-plan.json not found at $planPath" -Root $Root
            return @{
                Status  = 'halted_validation'
                Message = "implementation-plan.json not found at $planPath"
            }
        }

        $planRaw = Get-Content $planPath -Raw
        try {
            $planObj = $planRaw | ConvertFrom-Json
        }
        catch {
            Write-PipelineLog -Message "Halted: implementation-plan.json failed to parse as JSON" -Root $Root
            return @{
                Status  = 'halted_validation'
                Message = "implementation-plan.json is malformed JSON: $($_.Exception.Message)"
            }
        }

        if (-not $planObj.tiers -or @($planObj.tiers).Count -eq 0) {
            Write-PipelineLog -Message "Halted: plan has no tiers" -Root $Root
            return @{
                Status  = 'halted_validation'
                Message = 'implementation-plan.json has empty tiers array'
            }
        }

        foreach ($tier in @($planObj.tiers)) {
            if (-not $tier.tasks -or @($tier.tasks).Count -eq 0) {
                Write-PipelineLog -Message "Halted: tier $($tier.tier) has zero tasks" -Root $Root
                return @{
                    Status  = 'halted_validation'
                    Message = "Tier $($tier.tier) has zero tasks"
                }
            }
        }

        $bddFixture = Join-Path $Root "fixtures/$Feature/bdd.json"
        if (-not (Test-Path $bddFixture)) {
            Write-PipelineLog -Message "Halted: BDD fixture not found at $bddFixture" -Root $Root
            return @{
                Status  = 'halted_validation'
                Message = "BDD fixture not found: $bddFixture"
            }
        }

        $tlaFixture = Join-Path $Root "fixtures/$Feature/tla.json"
        if (-not (Test-Path $tlaFixture)) {
            Write-PipelineLog -Message "Halted: TLA fixture not found at $tlaFixture" -Root $Root
            return @{
                Status  = 'halted_validation'
                Message = "TLA fixture not found: $tlaFixture"
            }
        }

        # ── Phase 4: Config Snapshot ──
        $PlanSnapshot = $planRaw | ConvertFrom-Json

        Write-PipelineLog -Message "Stage 8 initialized for feature '$Feature' with $(@($PlanSnapshot.tiers).Count) tier(s)" -Root $Root

        # ── Phase 5: Fixture Coverage Check ──
        $bddFixtureData = Get-Content $bddFixture -Raw | ConvertFrom-Json
        $tlaFixtureData = Get-Content $tlaFixture -Raw | ConvertFrom-Json

        $bddEntries = if ($null -eq $bddFixtureData) { @() } else { @($bddFixtureData) }
        $tlaEntries = if ($null -eq $tlaFixtureData) { @() } else { @($tlaFixtureData) }

        $bddIsEmpty = ($bddEntries.Count -eq 0) -or ($bddEntries.Count -eq 1 -and $null -eq $bddEntries[0]) -or ($bddEntries.Count -eq 1 -and $bddEntries[0] -is [System.Management.Automation.PSCustomObject] -and @($bddEntries[0].PSObject.Properties).Count -eq 0)
        $tlaIsEmpty = ($tlaEntries.Count -eq 0) -or ($tlaEntries.Count -eq 1 -and $null -eq $tlaEntries[0]) -or ($tlaEntries.Count -eq 1 -and $tlaEntries[0] -is [System.Management.Automation.PSCustomObject] -and @($tlaEntries[0].PSObject.Properties).Count -eq 0)

        $uncoveredFixtures = @()

        $testDir = Join-Path $Root 'tests'
        $testFileContents = @()
        if (Test-Path $testDir) {
            $testFiles = Get-ChildItem -Path $testDir -Recurse -File -ErrorAction SilentlyContinue |
                Where-Object { $_.FullName -notmatch '[/\\]fixtures[/\\]' }
            foreach ($tf in $testFiles) {
                $testFileContents += (Get-Content $tf.FullName -Raw -ErrorAction SilentlyContinue)
            }
        }
        $allTestContent = $testFileContents -join "`n"

        if ($bddIsEmpty -and $tlaIsEmpty) {
            Write-PipelineLog -Message "WARNING: Both BDD and TLA+ fixture files are empty — skipping fixture coverage" -Root $Root
        }
        else {
            if ($bddIsEmpty) {
                Write-PipelineLog -Message "WARNING: BDD fixture file is empty — skipping BDD coverage check" -Root $Root
            }
            else {
                foreach ($entry in $bddEntries) {
                    $name = if ($entry.name) { $entry.name } elseif ($entry.title) { $entry.title } else { $entry.ToString() }
                    if ($allTestContent -notmatch [regex]::Escape($name)) {
                        $uncoveredFixtures += @{ Type = 'BDD'; Name = $name }
                    }
                }
            }

            if ($tlaIsEmpty) {
                Write-PipelineLog -Message "WARNING: TLA+ fixture file is empty — skipping TLA+ coverage check" -Root $Root
            }
            else {
                foreach ($entry in $tlaEntries) {
                    $name = if ($entry.name) { $entry.name } elseif ($entry.title) { $entry.title } else { $entry.ToString() }
                    if ($allTestContent -notmatch [regex]::Escape($name)) {
                        $uncoveredFixtures += @{ Type = 'TLA'; Name = $name }
                    }
                }
            }
        }

        if ($uncoveredFixtures.Count -gt 0) {
            Write-PipelineLog -Message "Fixture coverage gaps: $($uncoveredFixtures.Count) uncovered fixture(s)" -Root $Root
        }
        else {
            Write-PipelineLog -Message "Fixture coverage: all fixtures covered" -Root $Root
        }

        Write-PipelineLog -Message ">>> MARKER FIXTURE_COVERAGE_COMPLETE" -Root $Root

        # ── Phase 6: Single Claude Dispatch (all tiers at once) ──

        Write-PipelineLog -Message ">>> MARKER PRE_CODING_GATE" -Root $Root

        $featureDocsPath = Join-Path $Root "docs/$Feature"
        $MaxTiers = @($PlanSnapshot.tiers).Count

        if ($skipToGlobal) {
            Write-PipelineLog -Message "Skipping all tiers — resuming at GlobalDoublePass" -Root $Root
        }
        else {
            # Build single prompt with ALL tiers and dispatch Claude once
            $uncoveredSummary = if ($uncoveredFixtures.Count -gt 0) {
                ($uncoveredFixtures | ForEach-Object { "$($_.Type): $($_.Name)" }) -join "`n"
            }
            else { 'None' }

            $planPath = Join-Path $Root "docs/$Feature/implementation-plan.json"

            $prompt = @"
## Stage 8 — Implementation

Implement ALL tiers from the implementation plan, dispatching parallel agents per tier in worktrees. Tiers execute sequentially — complete tier N before starting tier N+1.

### Files to Read
- Implementation plan: $planPath
- Feature docs directory: $featureDocsPath
- BDD fixtures: $bddFixture
- TLA+ fixtures: $tlaFixture

### Uncovered Fixtures
$uncoveredSummary

### Instructions
- Read the implementation plan and feature docs before starting
- For each tier, create worktrees for parallel tasks and implement them
- Follow TDD: write tests first, then implement
- Each worktree should contain the completed work for one task
- Do NOT merge worktrees — the pipeline handles merging after verification gates
"@

            Write-PipelineLog -Message "Dispatching Claude for all $MaxTiers tier(s)" -Root $Root
            $claudeResult = Invoke-Claude -Prompt $prompt -AddDir $Root

            # Check for worktrees after Claude completes
            $worktreeOutput = git -C $Root worktree list
            $worktreeLines = @($worktreeOutput | Where-Object { $_ -and $_ -notmatch '\(bare\)' })
            $worktreeDetected = ($worktreeLines.Count -gt 1)

            if ($worktreeDetected) {
                Write-PipelineLog -Message "Worktrees detected after Claude dispatch — flagging for per-worktree gates" -Root $Root
            }
            else {
                Write-PipelineLog -Message "No worktrees after Claude dispatch — single-task cleanup path" -Root $Root
            }

            Write-PipelineLog -Message ">>> MARKER TIER_${MaxTiers}_COMPLETE" -Root $Root
        }

        Write-PipelineLog -Message "All $MaxTiers tier(s) dispatched for feature '$Feature'" -Root $Root
        Write-PipelineLog -Message ">>> MARKER GLOBAL_DOUBLEPASS_COMPLETE" -Root $Root

        return @{
            Status             = 'tiers_dispatched'
            Feature            = $Feature
            PlanSnapshot       = $PlanSnapshot
            LockState          = $lockState
            UncoveredFixtures  = $uncoveredFixtures
            WorktreeDetected   = $worktreeDetected
        }
    }
    finally {
        Unlock-Pipeline -LockDir $Root
    }
}
