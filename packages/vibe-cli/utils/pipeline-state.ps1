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

    if ($FromStage -le 7) { return $state }

    # ── Stage 8: Coding Stage resume ──

    # Flush orphaned fallback log entries first
    if (Get-Command Sync-FallbackLog -ErrorAction SilentlyContinue) {
        Sync-FallbackLog
    }

    # Prune stale worktree entries
    try { & git worktree prune 2>$null } catch { }

    # Parse the plan JSON
    $state.Plan = Get-Content $implJson -Raw | ConvertFrom-Json

    # Scan task logs for completed/merged tasks (partial-tier resume)
    $logsDir = "$Dir/logs"
    if (-not (Test-Path $logsDir)) {
        throw "Cannot resume at stage $FromStage — missing logs directory: $logsDir"
    }

    $state.CompletedTasks = [System.Collections.Generic.HashSet[string]]::new()
    $state.MergedTasks = [System.Collections.Generic.HashSet[string]]::new()
    $state.DirtyMergeCleanedTasks = [System.Collections.ArrayList]::new()
    $state.UnrecoverableWorktrees = [System.Collections.ArrayList]::new()
    $state.StaleMergeCleared = [System.Collections.ArrayList]::new()

    $taskLogs = Get-ChildItem "$logsDir/T*-log.txt" -ErrorAction SilentlyContinue
    foreach ($logFile in $taskLogs) {
        $content = Get-Content $logFile.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }

        $taskIdMatch = [regex]::Match($logFile.Name, '^(T\d+)')
        if (-not $taskIdMatch.Success) { continue }
        $logTaskId = $taskIdMatch.Groups[1].Value

        if ($content -match 'COMPLETED') {
            $null = $state.CompletedTasks.Add($logTaskId)
        }
        if ($content -match 'MERGED') {
            $null = $state.MergedTasks.Add($logTaskId)
        }
    }

    # Detect dirty merge state in existing worktrees
    try {
        $worktreeList = & git worktree list --porcelain 2>$null
        $currentWorktree = $null

        foreach ($line in $worktreeList) {
            if ($line -match '^worktree (.+)') {
                $currentWorktree = $Matches[1]
            }
            if ($line -match '^branch refs/heads/(.+)' -and $currentWorktree) {
                $branch = $Matches[1]

                # Check for unmerged files in this worktree
                $unmerged = & git -C $currentWorktree diff --name-only --diff-filter=U 2>$null
                if ($unmerged) {
                    # Attempt git merge --abort
                    try {
                        & git -C $currentWorktree merge --abort 2>$null
                        $taskIdMatch = [regex]::Match($branch, '-(T\d+)-')
                        if ($taskIdMatch.Success) {
                            $null = $state.DirtyMergeCleanedTasks.Add($taskIdMatch.Groups[1].Value)
                        }
                    }
                    catch {
                        $null = $state.UnrecoverableWorktrees.Add($currentWorktree)
                    }
                }

                $currentWorktree = $null
            }
        }
    }
    catch { }

    return $state
}
