. "$PSScriptRoot/result-contracts.ps1"

$script:RequiredAgentSections = @('## Role', '## Expected Inputs', '## Output Format')

function Test-ImplementationPlan {
    param(
        [Parameter(Mandatory)][string]$PlanJsonPath,
        [Parameter(Mandatory)][string]$Root,
        [string]$FeatureDir,
        [string]$PipelineRunId
    )

    $errors = [System.Collections.ArrayList]::new()
    $warnings = [System.Collections.ArrayList]::new()

    # Parse JSON
    if (-not (Test-Path $PlanJsonPath)) {
        $null = $errors.Add("Plan file not found: $PlanJsonPath")
        return ConvertTo-ValidationResult @{ Status = 'failed'; Errors = @($errors); Warnings = @($warnings) }
    }

    try {
        $plan = Get-Content $PlanJsonPath -Raw | ConvertFrom-Json
    }
    catch {
        $null = $errors.Add("Invalid JSON in plan file: $($_.Exception.Message)")
        return ConvertTo-ValidationResult @{ Status = 'failed'; Errors = @($errors); Warnings = @($warnings) }
    }

    if (-not $plan.tiers) {
        # Zero-tier plan is valid
        return ConvertTo-ValidationResult @{ Status = 'valid'; Errors = @(); Warnings = @() }
    }

    # Collect all task IDs and build tier map
    $allTasks = @{}
    $taskTierMap = @{}

    foreach ($tier in $plan.tiers) {
        foreach ($task in $tier.tasks) {
            $taskId = $task.id
            if (-not $taskId) {
                $null = $errors.Add("Task missing 'id' field in tier $($tier.tier)")
                continue
            }

            if ($allTasks.ContainsKey($taskId)) {
                $null = $errors.Add("Duplicate task ID: $taskId")
                continue
            }

            $allTasks[$taskId] = $task
            $taskTierMap[$taskId] = $tier.tier

            # Validate required fields
            foreach ($field in @('step', 'title', 'files')) {
                if (-not $task.$field) {
                    $null = $errors.Add("Task $taskId missing required field: $field")
                }
            }
        }
    }

    # Check dependencies
    foreach ($tier in $plan.tiers) {
        foreach ($task in $tier.tasks) {
            $taskId = $task.id
            if (-not $task.dependencies) { continue }

            foreach ($depId in $task.dependencies) {
                if (-not $allTasks.ContainsKey($depId)) {
                    $null = $errors.Add("Task $taskId depends on non-existent task: $depId")
                    continue
                }

                $depTier = $taskTierMap[$depId]
                if ($depTier -ge $tier.tier) {
                    $null = $errors.Add(
                        "Intra-tier or forward dependency: $taskId (tier $($tier.tier)) depends on $depId (tier $depTier)"
                    )
                }
            }
        }
    }

    # File-overlap advisory warnings
    foreach ($tier in $plan.tiers) {
        $fileToTasks = @{}
        foreach ($task in $tier.tasks) {
            foreach ($file in $task.files) {
                if (-not $fileToTasks.ContainsKey($file)) {
                    $fileToTasks[$file] = [System.Collections.ArrayList]::new()
                }
                $null = $fileToTasks[$file].Add($task.id)
            }
        }

        foreach ($file in $fileToTasks.Keys) {
            if ($fileToTasks[$file].Count -gt 1) {
                $taskIds = $fileToTasks[$file] -join ', '
                $null = $warnings.Add("Tier $($tier.tier): Tasks $taskIds both reference file '$file' — potential merge conflict")
            }
        }
    }

    # Orphaned workspace detection
    try {
        $existingWorktrees = & git worktree list --porcelain 2>$null |
            Where-Object { $_ -match '^branch refs/heads/feature/' } |
            ForEach-Object { ($_ -split '/')[-1] }

        foreach ($wt in $existingWorktrees) {
            foreach ($taskId in $allTasks.Keys) {
                if ($wt -match "-$taskId-") {
                    $null = $errors.Add("Orphaned workspace detected: worktree branch contains '$taskId' — run 'git worktree prune' first")
                }
            }
        }
    }
    catch { }

    $status = if ($errors.Count -gt 0) { 'failed' } else { 'valid' }
    return ConvertTo-ValidationResult @{ Status = $status; Errors = @($errors); Warnings = @($warnings) }
}

function New-PipelineLock {
    param(
        [Parameter(Mandatory)][string]$LockPath,
        [Parameter(Mandatory)][string]$PipelineRunId
    )

    try {
        $fs = [System.IO.File]::Open($LockPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
        $writer = [System.IO.StreamWriter]::new($fs)
        $writer.WriteLine("PID=$PID")
        $writer.WriteLine("ProcessName=$((Get-Process -Id $PID).ProcessName)")
        $writer.WriteLine("RunId=$PipelineRunId")
        $writer.WriteLine("StartTime=$(Get-Date -Format 'o')")
        $writer.Close()
        $fs.Close()
        return $true
    }
    catch [System.IO.IOException] {
        # File exists — check if stale
        if (Test-Path $LockPath) {
            $lockContent = Get-Content $LockPath -Raw
            $lockPid = if ($lockContent -match 'PID=(\d+)') { [int]$Matches[1] } else { 0 }
            $lockProcess = if ($lockContent -match 'ProcessName=(.+)') { $Matches[1].Trim() } else { '' }

            $existingProcess = Get-Process -Id $lockPid -ErrorAction SilentlyContinue
            if ($existingProcess -and $existingProcess.ProcessName -eq $lockProcess) {
                $lockRunId = if ($lockContent -match 'RunId=(.+)') { $Matches[1].Trim() } else { 'unknown' }
                throw "Another pipeline run is already active (PID: $lockPid, RunId: $lockRunId, Process: $lockProcess)"
            }

            # Stale lock — clean up and retry
            Write-PipelineLog "Cleaning up stale lock file (PID $lockPid no longer running)" -Color Yellow
            [System.IO.File]::Delete($LockPath)
            return New-PipelineLock -LockPath $LockPath -PipelineRunId $PipelineRunId
        }
        throw
    }
}

function Remove-PipelineLock {
    param([Parameter(Mandatory)][string]$LockPath)

    if (Test-Path $LockPath) {
        [System.IO.File]::Delete($LockPath)
    }
}
