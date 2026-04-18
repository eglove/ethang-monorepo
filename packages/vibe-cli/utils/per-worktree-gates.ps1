function Invoke-PerWorktreeGate {
    <#
    .SYNOPSIS
        Orchestrates per-worktree gates: for each worktree task, run double-pass then review.
        On success, advance to next task or signal ready for SequentialMerge.
    .OUTPUTS
        Hashtable: @{ Status = 'all_passed'|'escalated'; Results = @(...) }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string[]]$WorktreePaths,
        [Parameter(Mandatory)][string]$FeatureDir,
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$Feature
    )

    $results = @()

    for ($i = 0; $i -lt $WorktreePaths.Count; $i++) {
        $wtPath = $WorktreePaths[$i]
        $isLastTask = ($i -eq ($WorktreePaths.Count - 1))

        Write-PipelineLog -Message "Per-worktree gate: double-pass for $wtPath" -Root $Root

        $dpResult = Invoke-PerWorktreeDoublePass -WorktreePath $wtPath -Root $Root -Feature $Feature
        try { Set-TaskResult -FeatureName $Feature -TaskId (Split-Path $wtPath -Leaf) -Tier ($i + 1) -Phase 'double-pass' -Status $dpResult.Status } catch { }

        if ($dpResult.Status -eq 'escalated') {
            $results += @{
                WorktreePath = $wtPath
                DoublePass   = $dpResult
                Review       = $null
                Status       = 'escalated'
            }
            return @{
                Status  = 'escalated'
                Results = $results
            }
        }

        Write-PipelineLog -Message "Per-worktree gate: review for $wtPath" -Root $Root

        $reviewResult = Invoke-PerWorktreeReview -WorktreePath $wtPath -FeatureDir $FeatureDir -Root $Root
        try { Set-TaskResult -FeatureName $Feature -TaskId (Split-Path $wtPath -Leaf) -Tier ($i + 1) -Phase 'review' -Status $reviewResult.Verdict } catch { }

        if ($reviewResult.Verdict -eq 'escalated') {
            $results += @{
                WorktreePath = $wtPath
                DoublePass   = $dpResult
                Review       = $reviewResult
                Status       = 'escalated'
            }
            return @{
                Status  = 'escalated'
                Results = $results
            }
        }

        $results += @{
            WorktreePath = $wtPath
            DoublePass   = $dpResult
            Review       = $reviewResult
            Status       = 'passed'
        }

        if ($isLastTask) {
            Write-PipelineLog -Message "Per-worktree gate: all tasks passed — ready for SequentialMerge" -Root $Root
        }
        else {
            Write-PipelineLog -Message "Per-worktree gate: $wtPath passed — advancing to next task" -Root $Root
        }
    }

    return @{
        Status  = 'all_passed'
        Results = $results
    }
}
