function Invoke-WorktreeCleanup {
    <#
    .SYNOPSIS
        Removes worktrees after merge, using checkpoint-first ordering:
        writes the tier completion marker BEFORE removing worktrees.
    .OUTPUTS
        Hashtable: @{ CleanedUp = @(); Failed = @(); TierCheckpoint = int }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][AllowEmptyCollection()][array]$WorktreePaths,
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][int]$CompletedTier
    )

    # FIRST: Write checkpoint marker before any cleanup
    Write-PipelineLog -Message ">>> MARKER TIER_${CompletedTier}_COMPLETE" -Root $Root

    $cleanedUp = @()
    $failed = @()

    # THEN: Remove each worktree
    foreach ($wtPath in $WorktreePaths) {
        try {
            $removeOutput = git -C $Root worktree remove $wtPath --force 2>&1 | Out-String
            if ($LASTEXITCODE -ne 0) {
                Write-PipelineLog -Message "WARNING: Failed to remove worktree $wtPath : $removeOutput" -Root $Root
                $failed += $wtPath
            }
            else {
                Write-PipelineLog -Message "WorktreeCleanup: removed $wtPath" -Root $Root
                $cleanedUp += $wtPath
            }
        }
        catch {
            Write-PipelineLog -Message "WARNING: Exception removing worktree $wtPath : $($_.Exception.Message)" -Root $Root
            $failed += $wtPath
        }
    }

    return @{
        CleanedUp      = $cleanedUp
        Failed         = $failed
        TierCheckpoint = $CompletedTier
    }
}
