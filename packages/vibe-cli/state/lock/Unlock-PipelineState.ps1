function Unlock-PipelineState {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [switch]$Force
    )

    Assert-StateDatabaseOpen

    # Check lock exists
    $lock = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT pid FROM pipeline_lock WHERE feature_name = @f" -SqlParameters @{ f = $FeatureName }
    if (-not $lock) {
        throw "No lock is held for feature '$FeatureName'."
    }

    $feature = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT status FROM features WHERE name = @f" -SqlParameters @{ f = $FeatureName }
    $featureStatus = if ($feature) { $feature.status } else { 'idle' }

    if (-not $Force) {
        # Normal unlock requires terminal status
        if ($featureStatus -notin @('complete', 'halted')) {
            throw "Feature '$FeatureName' must be in a terminal status (complete/halted) to release the lock without force."
        }
    }
    else {
        # Force unlock on running feature performs HaltPipeline cleanup
        if ($featureStatus -eq 'running') {
            _Invoke-ForceUnlockCleanup -FeatureName $FeatureName
        }
    }

    # Delete lock row
    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "DELETE FROM pipeline_lock WHERE feature_name = @f" -SqlParameters @{ f = $FeatureName }
}

function _Invoke-ForceUnlockCleanup {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseApprovedVerbs', '')]
    param([string]$FeatureName)

    # Fail pending debates
    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "UPDATE debate_state SET consensus_status = 'failed' WHERE feature_name = @f AND consensus_status = 'pending'" -SqlParameters @{ f = $FeatureName }

    # Handle tiers
    $tiers = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT tier, status FROM tier_progress WHERE feature_name = @f" -SqlParameters @{ f = $FeatureName }
    if ($tiers) {
        foreach ($tier in @($tiers)) {
            if ($tier.status -eq 'running') {
                # Check if tier has tasks
                $tasks = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT id FROM task_results WHERE feature_name = @f AND tier = @t" -SqlParameters @{ f = $FeatureName; t = $tier.tier }
                if ($tasks) {
                    Set-TierStatus -FeatureName $FeatureName -Tier $tier.tier -Status 'failed'
                } else {
                    Set-TierStatus -FeatureName $FeatureName -Tier $tier.tier -Status 'none'
                }
            }
            elseif ($tier.status -eq 'pending') {
                Set-TierStatus -FeatureName $FeatureName -Tier $tier.tier -Status 'none'
            }
            # passed tiers are preserved
        }
    }

    # Reset pending merges to none
    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "UPDATE merge_results SET status = 'none' WHERE feature_name = @f AND status = 'pending'" -SqlParameters @{ f = $FeatureName }

    # Delete gate results
    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "DELETE FROM gate_results WHERE feature_name = @f" -SqlParameters @{ f = $FeatureName }

    # Transition to halted
    Update-PipelineState -FeatureName $FeatureName -PipelineState 'halted' -FeatureStatus 'halted'

    # Clear active feature
    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "UPDATE session SET active_feature = NULL WHERE id = 1"
}
