# Stage 7 — Coding Stage (renumbered from old Stage 8)
# Each function lives in its own file under utils/.

function _SyncDb {
    param([scriptblock]$Block)
    try { & $Block }
    catch { Write-Warning "DB sync: $_" }
}

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

    # ── Resume: DB-based tier progress ──
    $startTier = 1
    $skipToGlobal = $false

    if ($Resume) {
        $featureBranch = "feature/$Feature"
        $currentBranch = (git -C $Root rev-parse --abbrev-ref HEAD 2>$null)
        if ($currentBranch) { $currentBranch = $currentBranch.Trim() }
        if ($currentBranch -ne $featureBranch) {
            $branchExists = git -C $Root branch --list $featureBranch 2>$null
            if (-not $branchExists) {
                Write-PipelineLog -Message "HALTED: resume failed — branch '$featureBranch' does not exist" -Root $Root
                return @{
                    Status  = 'halted_no_branch'
                    Message = "Resume failed: expected branch '$featureBranch' does not exist."
                }
            }
            $null = git -C $Root checkout $featureBranch
            Write-PipelineLog -Message "Resume: switched to branch $featureBranch" -Root $Root
        }

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

        # DB-based tier progress (replaces log marker parsing)
        $tierProgress = Get-AllTierProgress -FeatureName $Feature
        $lastCompletedTier = 0
        if ($tierProgress) {
            $passedTiers = @($tierProgress | Where-Object { $_.status -eq 'passed' })
            if ($passedTiers.Count -gt 0) {
                $lastCompletedTier = ($passedTiers | Measure-Object -Property tier -Maximum).Maximum
            }
        }

        $planRaw = Get-Content $planPath -Raw
        $planObj = $planRaw | ConvertFrom-Json
        $maxTiers = @($planObj.tiers).Count

        if ($lastCompletedTier -eq 0) {
            Write-PipelineLog -Message "WARNING: --resume with no completed tiers in DB — starting fresh" -Root $Root
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

        # Verify DB lock exists (acquired by vibe.ps1 at Stage 1)
        try {
            $dbLock = Get-PipelineLockState -FeatureName $Feature
            if (-not $dbLock) {
                Write-PipelineLog -Message "Resume: re-acquiring DB lock" -Root $Root
                Lock-PipelineState -FeatureName $Feature -ProcessId $PID
            }
        } catch {
            Write-PipelineLog -Message "DB lock check skipped: $_" -Root $Root
        }

        # File-based lock for cross-process mutex safety
        try {
            $lockState = Lock-Pipeline -LockDir $Root -Feature $Feature -Resume
        }
        catch {
            Write-PipelineLog -Message "Resume: reclaiming stale file lock" -Root $Root
            Unlock-Pipeline -LockDir $Root
            $lockState = Lock-Pipeline -LockDir $Root -Feature $Feature
        }
    }

    if (-not $Resume) {
        $previousBranch = git -C $Root rev-parse --abbrev-ref HEAD
        if ($previousBranch) { $previousBranch = $previousBranch.Trim() }
        $featureBranch = "feature/$Feature"
        $branchExists = git -C $Root branch --list $featureBranch 2>$null
        if ($branchExists) {
            Write-PipelineLog -Message "Pipeline halted: branch '$featureBranch' already exists. Use -Resume or delete the branch." -Root $Root
            return @{
                Status  = 'halted_branch_exists'
                Message = "Branch '$featureBranch' already exists. Use -Resume to continue, or delete the branch for a fresh run."
            }
        }
        $null = git -C $Root checkout -b $featureBranch
        Write-PipelineLog -Message "Created feature branch: $featureBranch" -Root $Root

        $gitStatus = git -C $Root status --porcelain
        if ($gitStatus) {
            $response = Read-Host "Uncommitted changes found. Commit now? (y/n)"
            if ($response -eq 'y') {
                git -C $Root add -A
                git -C $Root commit -m "Pre-Stage7 auto-commit"
            }
            else {
                $null = git -C $Root checkout $previousBranch
                $null = git -C $Root branch -D $featureBranch
                Write-PipelineLog -Message "Pipeline halted: uncommitted changes must be committed before Stage 7 can proceed." -Root $Root
                return @{
                    Status  = 'halted_uncommitted'
                    Message = 'Pipeline halted: uncommitted changes must be committed before Stage 7 can proceed.'
                }
            }
        }

        # Verify DB lock exists (acquired by vibe.ps1 at Stage 1)
        try {
            $dbLock = Get-PipelineLockState -FeatureName $Feature
            if (-not $dbLock) {
                Write-PipelineLog -Message "Acquiring DB lock for Stage 7" -Root $Root
                Lock-PipelineState -FeatureName $Feature -ProcessId $PID
            }
        } catch {
            Write-PipelineLog -Message "DB lock check skipped: $_" -Root $Root
        }

        # File-based lock for cross-process mutex safety
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

    # Set pipeline state to running for Stage 7
    _SyncDb { Update-PipelineState -FeatureName $Feature -PipelineState 'coding' }

    try {
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

        $PlanSnapshot = $planRaw | ConvertFrom-Json

        Write-PipelineLog -Message "Stage 7 initialized for feature '$Feature' with $(@($PlanSnapshot.tiers).Count) tier(s)" -Root $Root

        $bddFixtureData = Get-Content $bddFixture -Raw | ConvertFrom-Json

        $bddEntries = if ($null -eq $bddFixtureData) { @() } else { @($bddFixtureData) }

        $bddIsEmpty = ($bddEntries.Count -eq 0) -or ($bddEntries.Count -eq 1 -and $null -eq $bddEntries[0]) -or ($bddEntries.Count -eq 1 -and $bddEntries[0] -is [System.Management.Automation.PSCustomObject] -and @($bddEntries[0].PSObject.Properties).Count -eq 0)

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

        if ($bddIsEmpty) {
            Write-PipelineLog -Message "WARNING: BDD fixture is empty — skipping fixture coverage" -Root $Root
        }
        else {
            foreach ($entry in $bddEntries) {
                $name = if ($entry.name) { $entry.name } elseif ($entry.title) { $entry.title } else { $entry.ToString() }
                if ($allTestContent -notmatch [regex]::Escape($name)) {
                    $uncoveredFixtures += @{ Type = 'BDD'; Name = $name }
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
        Write-PipelineLog -Message ">>> MARKER PRE_CODING_GATE" -Root $Root

        $featureDocsPath = Join-Path $Root "docs/$Feature"
        $MaxTiers = @($PlanSnapshot.tiers).Count

        if ($skipToGlobal) {
            Write-PipelineLog -Message "Skipping all tiers — resuming at global verification" -Root $Root
        }
        else {  # Normal tier dispatch path
            $uncoveredSummary = if ($uncoveredFixtures.Count -gt 0) {
                ($uncoveredFixtures | ForEach-Object { "$($_.Type): $($_.Name)" }) -join "`n"
            }
            else { 'None' }

            $planPath = Join-Path $Root "docs/$Feature/implementation-plan.json"

            $prompt = @"
## Stage 7 — Implementation

Implement ALL tiers from the implementation plan, dispatching parallel agents per tier in worktrees. Tiers execute sequentially — complete tier N before starting tier N+1.

### Files to Read
- Implementation plan: $planPath
- Feature docs directory: $featureDocsPath
- BDD fixtures: $bddFixture

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
            $claudeResult = Invoke-Claude -Role 'code-writer' -Prompt $prompt -AddDir $Root

            $worktreeOutput = git -C $Root worktree list
            $worktreeLines = @($worktreeOutput | Where-Object { $_ -and $_ -notmatch '\(bare\)' })
            $worktreeDetected = ($worktreeLines.Count -gt 1)

            if ($worktreeDetected) {
                Write-PipelineLog -Message "Worktrees detected after Claude dispatch — running per-worktree gates" -Root $Root

                # Parse worktree paths and branches (skip the main worktree — first line)
                $wtPaths = @()
                $wtBranches = @()
                for ($wtIdx = 1; $wtIdx -lt $worktreeLines.Count; $wtIdx++) {
                    $wtLine = $worktreeLines[$wtIdx]
                    $wtPath = ($wtLine -split '\s+')[0]
                    $wtPaths += $wtPath
                    if ($wtLine -match '\[(.+?)\]') {
                        $wtBranches += $Matches[1]
                    }
                }

                # Per-worktree gates: double-pass + review for each worktree
                $gateResult = Invoke-PerWorktreeGate -WorktreePaths $wtPaths -FeatureDir $featureDocsPath -Root $Root -Feature $Feature
                _SyncDb { Set-GateResult -FeatureName $Feature -GateType 'perWorktree' -Status $gateResult.Status }
                if ($gateResult.Status -eq 'escalated') {
                    Write-PipelineLog -Message "Per-worktree gate escalated — halting pipeline" -Root $Root
                    _SyncDb { Update-PipelineState -FeatureName $Feature -PipelineState 'halted' -FeatureStatus 'halted' }
                    $null = Complete-Pipeline -Root $Root -Status halted
                    return @{
                        Status    = 'halted_gate'
                        Feature   = $Feature
                        GateResult = $gateResult
                    }
                }

                # Sequential merge: merge worktree branches into feature branch
                $featureBranchName = "feature/$Feature"
                $mergeResult = Invoke-SequentialMerge -WorktreeBranches $wtBranches -FeatureBranch $featureBranchName -Root $Root -Feature $Feature
                _SyncDb { Set-MergeResult -FeatureName $Feature -TaskId 'sequential-merge' -Status $mergeResult.Status }
                if ($mergeResult.Status -ne 'merged') {
                    Write-PipelineLog -Message "SequentialMerge escalated ($($mergeResult.Status)) — halting pipeline" -Root $Root
                    _SyncDb { Update-PipelineState -FeatureName $Feature -PipelineState 'halted' -FeatureStatus 'halted' }
                    $null = Complete-Pipeline -Root $Root -Status halted
                    return @{
                        Status      = 'halted_merge'
                        Feature     = $Feature
                        MergeResult = $mergeResult
                    }
                }

                # Worktree cleanup (writes TIER marker internally)
                $null = Invoke-WorktreeCleanup -WorktreePaths $wtPaths -Root $Root -CompletedTier $MaxTiers
            }
            else {
                Write-PipelineLog -Message "No worktrees after Claude dispatch — single-task cleanup path" -Root $Root
                Write-PipelineLog -Message ">>> MARKER TIER_${MaxTiers}_COMPLETE" -Root $Root
            }

            # Record all tiers as passed in DB
            for ($tierIdx = 1; $tierIdx -le $MaxTiers; $tierIdx++) {
                _SyncDb { Set-TierStatus -FeatureName $Feature -Tier $tierIdx -Status 'passed' }
            }
        }

        # ── Global verification ──
        _SyncDb { Update-PipelineState -FeatureName $Feature -PipelineState 'globalVerification' }
        Write-PipelineLog -Message "All $MaxTiers tier(s) complete — running global double-pass" -Root $Root

        $gdpResult = Invoke-GlobalDoublePass -Root $Root -Feature $Feature
        _SyncDb { Set-GateResult -FeatureName $Feature -GateType 'globalDoublePass' -Status $gdpResult.Status }
        if ($gdpResult.Status -eq 'escalated') {
            Write-PipelineLog -Message "Global double-pass escalated after $($gdpResult.Retries) retries — halting" -Root $Root
            _SyncDb { Update-PipelineState -FeatureName $Feature -PipelineState 'halted' -FeatureStatus 'halted' }
            $null = Complete-Pipeline -Root $Root -Status halted
            return @{
                Status          = 'halted_doublepass'
                Feature         = $Feature
                DoublePassResult = $gdpResult
            }
        }
        Write-PipelineLog -Message ">>> MARKER GLOBAL_DOUBLEPASS_COMPLETE" -Root $Root

        # Global review: full diff against base branch
        $baseBranch = 'master'
        Write-PipelineLog -Message "Running global review against $baseBranch" -Root $Root

        $grResult = Invoke-GlobalReview -Root $Root -FeatureDir $featureDocsPath -BaseBranch $baseBranch
        _SyncDb { Set-GateResult -FeatureName $Feature -GateType 'globalReview' -Status $grResult.Verdict }
        if ($grResult.Verdict -eq 'escalated') {
            Write-PipelineLog -Message "Global review escalated after $($grResult.ReviewRound) round(s) — halting" -Root $Root
            _SyncDb { Update-PipelineState -FeatureName $Feature -PipelineState 'halted' -FeatureStatus 'halted' }
            $null = Complete-Pipeline -Root $Root -Status halted
            return @{
                Status       = 'halted_review'
                Feature      = $Feature
                ReviewResult = $grResult
            }
        }
        Write-PipelineLog -Message ">>> MARKER GLOBAL_REVIEW_COMPLETE" -Root $Root

        _SyncDb { Update-PipelineState -FeatureName $Feature -PipelineState 'complete' -FeatureStatus 'complete' }
        $null = Complete-Pipeline -Root $Root -Status complete
        Write-PipelineLog -Message "STAGE_COMPLETE:7:$Feature" -Root $Root

        return @{
            Status             = 'tiers_dispatched'
            Feature            = $Feature
            PlanSnapshot       = $PlanSnapshot
            LockState          = $lockState
            UncoveredFixtures  = $uncoveredFixtures
        }
    }
    finally {
        Unlock-Pipeline -LockDir $Root
    }
}
