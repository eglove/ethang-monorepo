$VerifyProfiles = @{
    powershell = @{
        Test = 'pwsh -Command "Invoke-Pester -CI"'
        Lint = 'pwsh -Command "Get-ChildItem -Recurse -Filter *.ps1 | ForEach-Object { $f = $_.FullName; $raw = Get-Content $f -Raw; $fmt = Invoke-Formatter -ScriptDefinition $raw; if ($fmt -ne $raw) { Set-Content $f -Value $fmt -NoNewline } }; Invoke-ScriptAnalyzer -Path . -Recurse -EnableExit"'
        Tsc  = 'echo ok'
    }
    typescript = @{
        Test = 'pnpm test'
        Lint = 'pnpm lint'
        Tsc  = 'pnpm tsc'
    }
}

function Resolve-VerifyProfile {
    param(
        [Parameter(Mandatory)]
        [object]$Plan
    )

    $default = $VerifyProfiles.typescript

    $extensions = @{}
    foreach ($tier in $Plan.tiers) {
        foreach ($task in $tier.tasks) {
            foreach ($file in $task.files) {
                $ext = [System.IO.Path]::GetExtension($file).ToLower()
                if ($ext -and $ext -ne '.md') {
                    $extensions[$ext] = ($extensions[$ext] ?? 0) + 1
                }
            }
        }
    }

    if ($extensions.Count -eq 0) { return $default }

    $dominant = ($extensions.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key

    switch ($dominant) {
        { $_ -in '.ps1', '.psm1', '.psd1' } { return $VerifyProfiles.powershell }
        { $_ -in '.ts', '.tsx', '.js', '.jsx' } { return $VerifyProfiles.typescript }
        default { return $default }
    }
}

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

    $plan = Get-Content $ImplJson | ConvertFrom-Json
    $implPlanMarkdown = Get-Content $ImplFile -Raw
    $featureSlug = Split-Path $FeatureDir -Leaf
    $integrationBranch = "feature/$featureSlug"

    # Auto-detect verify commands from file extensions in the plan
    $verifyProfile = Resolve-VerifyProfile -Plan $plan
    $Config.VerifyTest = $verifyProfile.Test
    $Config.VerifyLint = $verifyProfile.Lint
    $Config.VerifyTsc = $verifyProfile.Tsc
    Write-PipelineLog "Verify profile: test=$($verifyProfile.Test) lint=$($verifyProfile.Lint) tsc=$($verifyProfile.Tsc)"

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
        $cfg = $Config

        $taskResults = $tier.tasks | ForEach-Object -Parallel {
            $task = $_
            $rootDir = $using:Root
            $implPlan = $using:implPlanMarkdown
            $Config = $using:cfg
            $wtPath = Join-Path $using:repoRoot "wt/$($task.id)"

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
