function Update-PipelineState {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [string]$PipelineState,
        [int]$LockHolder,
        [int]$ReviewRound = -1,
        [int]$KeepGoingResets = -1,
        [int]$TddKeepGoingCount = -1,
        [string]$Verdict,
        [int]$TasksDone = -1,
        [string]$ReviewGateType,
        [string]$FeatureStatus
    )

    Assert-StateDatabaseOpen

    # Ensure row exists (upsert)
    $existing = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT feature_name FROM pipeline_state WHERE feature_name = @f" -SqlParameters @{ f = $FeatureName }
    if (-not $existing) {
        Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "INSERT INTO pipeline_state (feature_name) VALUES (@f)" -SqlParameters @{ f = $FeatureName }
    }

    # Build dynamic SET clause
    $sets = @()
    $params = @{ f = $FeatureName }

    if ($PSBoundParameters.ContainsKey('PipelineState')) {
        $sets += "pipeline_state = @ps"
        $params['ps'] = $PipelineState
    }
    if ($PSBoundParameters.ContainsKey('LockHolder')) {
        $sets += "lock_holder = @lh"
        $params['lh'] = $LockHolder
    }
    if ($ReviewRound -ge 0) {
        $sets += "review_round = @rr"
        $params['rr'] = $ReviewRound
    }
    if ($KeepGoingResets -ge 0) {
        $sets += "keep_going_resets = @kgr"
        $params['kgr'] = $KeepGoingResets
    }
    if ($TddKeepGoingCount -ge 0) {
        $sets += "tdd_keep_going_count = @tkgc"
        $params['tkgc'] = $TddKeepGoingCount
    }
    if ($PSBoundParameters.ContainsKey('Verdict')) {
        $sets += "verdict = @v"
        $params['v'] = $Verdict
    }
    if ($TasksDone -ge 0) {
        $sets += "tasks_done = @td"
        $params['td'] = $TasksDone
    }
    if ($PSBoundParameters.ContainsKey('ReviewGateType')) {
        $sets += "review_gate_type = @rgt"
        $params['rgt'] = $ReviewGateType
    }

    if ($sets.Count -gt 0) {
        $sql = "UPDATE pipeline_state SET $($sets -join ', ') WHERE feature_name = @f"
        Invoke-SqliteQuery -DataSource $script:StateDbPath -Query $sql -SqlParameters $params
    }

    # Sync feature status if specified
    if ($PSBoundParameters.ContainsKey('FeatureStatus')) {
        Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "UPDATE features SET status = @s WHERE name = @f" -SqlParameters @{ f = $FeatureName; s = $FeatureStatus }
    }
}
