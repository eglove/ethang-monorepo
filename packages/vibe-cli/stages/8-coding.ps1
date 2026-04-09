function Invoke-CodingStage {
    param(
        [Parameter(Mandatory)]
        [string]$ImplJson,

        [Parameter(Mandatory)]
        [string]$ImplFile,

        [Parameter(Mandatory)]
        [string]$FeatureDir,

        [Parameter(Mandatory)]
        [string]$Root
    )

    Write-Host "`n=== Stage 8: Coding ===" -ForegroundColor Cyan

    $plan             = Get-Content $ImplJson | ConvertFrom-Json
    $implPlanMarkdown = Get-Content $ImplFile -Raw
    $featureSlug      = Split-Path $FeatureDir -Leaf
    $integrationBranch = "feature/$featureSlug"

    git checkout -b $integrationBranch 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Failed to create branch $integrationBranch — does it already exist?" }

    foreach ($tier in $plan.tiers) {
        Write-Host "`n--- Tier $($tier.tier): $($tier.title) ---" -ForegroundColor Cyan

        # Create worktrees for this tier
        foreach ($task in $tier.tasks) {
            git worktree add "wt/$($task.id)" -b "task/$($task.id)" 2>&1
            if ($LASTEXITCODE -ne 0) { throw "Failed to create worktree for task/$($task.id) — branch or directory may already exist" }
            Write-Host "  Worktree created: wt/$($task.id)" -ForegroundColor Gray
        }

        # Dispatch all tasks in parallel
        $repoRoot = $PWD.Path
        $throttle = $Config.WorktreeThrottleLimit
        $cfg      = $Config

        $taskResults = $tier.tasks | ForEach-Object -Parallel {
            $task     = $_
            $rootDir  = $using:Root
            $implPlan = $using:implPlanMarkdown
            $Config   = $using:cfg
            $wtPath   = Join-Path $using:repoRoot "wt/$($task.id)"

            . "$rootDir/utils/config.ps1"
            . "$rootDir/utils/task-runner.ps1"

            $global:InvokeClaudeBatched = $true
            $Config = $using:cfg

            $result = Invoke-TaskRunner `
                -Task $task `
                -ImplPlanMarkdown $implPlan `
                -WorktreePath $wtPath `
                -AgentsDir "$rootDir/agents"

            @{ TaskId = $task.id; Title = $task.title; Result = $result }

        } -ThrottleLimit $throttle

        # Tier summary
        Write-Host "`nTier $($tier.tier) summary:" -ForegroundColor Cyan
        foreach ($tr in $taskResults) {
            $issueCount = if ($tr.Result.Reviews.Issues) { $tr.Result.Reviews.Issues.Count } else { 0 }
            Write-Host "  [$($tr.TaskId)] $($tr.Title) — $issueCount issues, $($tr.Result.FixRounds) fix rounds" -ForegroundColor Green
        }

        # Merge sequentially
        Write-Host "`nMerging tier $($tier.tier)..." -ForegroundColor Cyan
        foreach ($task in $tier.tasks) {
            Write-Host "  Merging task/$($task.id)..." -ForegroundColor Gray
            git merge --no-ff "task/$($task.id)" -m "merge($($task.id)): $($task.title)" 2>&1
            if ($LASTEXITCODE -ne 0) { throw "Merge conflict on task/$($task.id) — resolve manually" }
            git worktree remove "wt/$($task.id)" 2>&1
            if ($LASTEXITCODE -ne 0) { Write-Host "  WARNING: failed to remove worktree wt/$($task.id)" -ForegroundColor Yellow }
            git branch -d "task/$($task.id)" 2>&1
            if ($LASTEXITCODE -ne 0) { Write-Host "  WARNING: failed to delete branch task/$($task.id)" -ForegroundColor Yellow }
        }
        Write-Host "Tier $($tier.tier) merged." -ForegroundColor Green
    }

    return $integrationBranch
}
