function Invoke-SequentialMerge {
    <#
    .SYNOPSIS
        Merges worktree branches into the feature branch in task order (T1, T2, T3...).
        On merge conflict, dispatches Claude to resolve and runs a double-pass on the feature branch.
        On unresolvable conflict, escalates to user.
    .OUTPUTS
        Hashtable: @{ Status = 'merged'|'escalated_stop'|'escalated_keepgoing'; MergedBranches = @(); SkippedBranches = @(); Checkpoint = string }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][array]$WorktreeBranches,
        [Parameter(Mandatory)][string]$FeatureBranch,
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$Feature
    )

    $checkpoint = git -C $Root rev-parse HEAD
    $mergedBranches = @()
    $skippedBranches = @()

    foreach ($branch in $WorktreeBranches) {
        Write-PipelineLog -Message "SequentialMerge: merging $branch into $FeatureBranch" -Root $Root

        $mergeOutput = git -C $Root merge $branch --no-ff 2>&1 | Out-String
        $mergeExitCode = $LASTEXITCODE

        # Clean merge
        if ($mergeExitCode -eq 0 -and $mergeOutput -notmatch 'CONFLICT') {
            Write-PipelineLog -Message "SequentialMerge: $branch merged cleanly" -Root $Root
            $mergedBranches += $branch
            continue
        }

        # Merge conflict detected
        Write-PipelineLog -Message "SequentialMerge: conflict merging $branch" -Root $Root

        $conflictFiles = git -C $Root diff --name-only --diff-filter=U 2>&1 | Out-String

        $conflictPrompt = @"
## Merge Conflict Resolution

Feature: $Feature
Branch being merged: $branch
Target: $FeatureBranch

### Conflict Output
$mergeOutput

### Conflicting Files
$conflictFiles

Resolve the merge conflicts. If you cannot resolve them, respond with exactly: UNRESOLVABLE
"@

        $claudeResult = Invoke-Claude -Role 'code-writer' -Prompt $conflictPrompt -AddDir $Root
        $claudeResultStr = if ($claudeResult) { "$claudeResult" } else { '' }

        # Check for unresolvable signal
        if ($claudeResultStr -match 'UNRESOLVABLE') {
            Write-PipelineLog -Message "SequentialMerge: Claude cannot resolve conflict for $branch" -Root $Root
            git -C $Root merge --abort 2>&1 | Out-Null

            $escalationChoice = Read-Host "Unresolvable conflict on $branch. Conflicting files: $conflictFiles`nKeep Going (k) or Stop (s)?"

            if ($escalationChoice -match '^[kK]') {
                Write-PipelineLog -Message "SequentialMerge: skipping $branch (user chose Keep Going)" -Root $Root
                $skippedBranches += $branch
                continue
            }
            else {
                Write-PipelineLog -Message "SequentialMerge: stopping — rolling back to checkpoint" -Root $Root
                git -C $Root reset --hard $checkpoint
                return @{
                    Status          = 'escalated_stop'
                    MergedBranches  = $mergedBranches
                    SkippedBranches = $skippedBranches
                    Checkpoint      = $checkpoint
                }
            }
        }

        # Claude resolved — check for remaining conflicts
        $stillConflicted = git -C $Root diff --name-only --diff-filter=U 2>&1 | Out-String
        if (-not [string]::IsNullOrWhiteSpace($stillConflicted)) {
            git -C $Root merge --abort 2>&1 | Out-Null

            $escalationChoice = Read-Host "Conflict on $branch persists after Claude resolution. Keep Going (k) or Stop (s)?"

            if ($escalationChoice -match '^[kK]') {
                $skippedBranches += $branch
                continue
            }
            else {
                git -C $Root reset --hard $checkpoint
                return @{
                    Status          = 'escalated_stop'
                    MergedBranches  = $mergedBranches
                    SkippedBranches = $skippedBranches
                    Checkpoint      = $checkpoint
                }
            }
        }

        # Run MergeConflictDP (double-pass on feature branch after conflict resolution)
        $mergeConsecPasses = 0
        $mergeDoublePassRetries = 0

        while ($true) {
            $testOutput = $null
            try {
                $testOutput = & pnpm test 2>&1 | Out-String
                $testExitCode = $LASTEXITCODE
            }
            catch {
                $testOutput = $_.Exception.Message
                $testExitCode = 1
            }

            if ($testExitCode -ne 0) {
                $mergeConsecPasses = 0
                $mergeDoublePassRetries++
                Write-PipelineLog -Message "MergeConflictDP: test failed (retry $mergeDoublePassRetries)" -Root $Root

                $fixPrompt = @"
## MergeConflictDP Test Failure (attempt $mergeDoublePassRetries)

Feature: $Feature
Branch merged: $branch

### Error Output
$testOutput

Fix the failing tests after merge conflict resolution.
"@
                Invoke-Claude -Role 'code-writer' -Prompt $fixPrompt -AddDir $Root
                continue
            }

            $lintOutput = $null
            try {
                $lintOutput = & pnpm lint 2>&1 | Out-String
                $lintExitCode = $LASTEXITCODE
            }
            catch {
                $lintOutput = $_.Exception.Message
                $lintExitCode = 1
            }

            if ($lintExitCode -ne 0) {
                $mergeConsecPasses = 0
                $mergeDoublePassRetries++
                Write-PipelineLog -Message "MergeConflictDP: lint failed (retry $mergeDoublePassRetries)" -Root $Root

                $fixPrompt = @"
## MergeConflictDP Lint Failure (attempt $mergeDoublePassRetries)

Feature: $Feature
Branch merged: $branch

### Error Output
$lintOutput

Fix the lint errors after merge conflict resolution.
"@
                Invoke-Claude -Role 'code-writer' -Prompt $fixPrompt -AddDir $Root
                continue
            }

            $mergeConsecPasses++
            Write-PipelineLog -Message "MergeConflictDP: consecutive pass $mergeConsecPasses/2" -Root $Root

            if ($mergeConsecPasses -ge 2) {
                break
            }
        }

        # NO re-review per S7 invariant
        Write-PipelineLog -Message "SequentialMerge: $branch merged and verified" -Root $Root
        $mergedBranches += $branch
    }

    $finalStatus = if ($skippedBranches.Count -gt 0) { 'escalated_keepgoing' } else { 'merged' }

    return @{
        Status          = $finalStatus
        MergedBranches  = $mergedBranches
        SkippedBranches = $skippedBranches
        Checkpoint      = $checkpoint
    }
}
