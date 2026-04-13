function Update-DebateState {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [int]$Stage,
        [Parameter(Mandatory)]
        [int]$Round,
        [Parameter(Mandatory)]
        [ValidateSet('pending', 'reached', 'failed')]
        [string]$ConsensusStatus,
        [string]$ModeratorJson,
        [int]$MaxDebateRound = 5
    )

    Assert-StateDatabaseOpen

    # Validate debate stage (only stages 3, 4, 5, 6 support debates)
    $debateStages = @(3, 4, 5, 6)
    if ($Stage -notin $debateStages) {
        throw "Stage $Stage does not support debate rounds."
    }

    # Check round limit
    if ($Round -gt $MaxDebateRound) {
        throw "Round $Round exceeds MaxDebateRound ($MaxDebateRound) - no further rounds allowed."
    }

    # Check premature failure
    if ($ConsensusStatus -eq 'failed' -and $Round -lt $MaxDebateRound) {
        throw "Consensus can only be set to 'failed' at MaxDebateRound (round $MaxDebateRound), not round $Round."
    }

    $now = (Get-Date).ToUniversalTime().ToString('o')

    # Check if this round already exists (update it)
    $existing = Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "SELECT id FROM debate_state WHERE feature_name = @f AND stage = @s AND round = @r" -SqlParameters @{ f = $FeatureName; s = $Stage; r = $Round }
    if ($existing) {
        Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "UPDATE debate_state SET consensus_status = @cs, moderator_json = @mj, created_at = @t WHERE feature_name = @f AND stage = @s AND round = @r" -SqlParameters @{ f = $FeatureName; s = $Stage; r = $Round; cs = $ConsensusStatus; mj = $ModeratorJson; t = $now }
    }
    else {
        Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "INSERT INTO debate_state (feature_name, stage, round, consensus_status, moderator_json, created_at) VALUES (@f, @s, @r, @cs, @mj, @t)" -SqlParameters @{ f = $FeatureName; s = $Stage; r = $Round; cs = $ConsensusStatus; mj = $ModeratorJson; t = $now }
    }

    # If debate failed at max round, halt the feature
    if ($ConsensusStatus -eq 'failed') {
        Update-PipelineState -FeatureName $FeatureName -PipelineState 'halted' -FeatureStatus 'halted'
    }
}
