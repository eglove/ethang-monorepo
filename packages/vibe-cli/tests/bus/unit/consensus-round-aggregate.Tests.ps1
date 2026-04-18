#Requires -Module PSSQLite

BeforeAll {
    # Load the domain module under test
    . (Join-Path $PSScriptRoot '../../../bus/domain/consensus-round.ps1')

    # Helper: create a fresh temp DB with both schemas applied
    function New-TestDb {
        $dbPath = Join-Path ([System.IO.Path]::GetTempPath()) "consensus-test-$(New-Guid).db"
        $schemaDir = Join-Path $PSScriptRoot '../../../bus/schema'
        $consensusSql = Get-Content (Join-Path $schemaDir 'consensus-state.sql') -Raw
        $eventLogSql  = Get-Content (Join-Path $schemaDir 'event-log.sql') -Raw
        Invoke-SqliteQuery -DataSource $dbPath -Query $consensusSql
        Invoke-SqliteQuery -DataSource $dbPath -Query $eventLogSql
        return $dbPath
    }
}

Describe 'ConsensusRound Aggregate' {

    BeforeEach {
        $script:db = New-TestDb
    }

    AfterEach {
        if ($script:db -and (Test-Path $script:db)) {
            Remove-Item $script:db -Force
        }
    }

    # -------------------------------------------------------------------------
    # 1. Get-ConsensusRoundState — initial state
    # -------------------------------------------------------------------------
    It '1. Get-ConsensusRoundState returns initial state' {
        $state = Get-ConsensusRoundState -Connection $script:db
        $state.ConsensusState           | Should -BeExactly 'open'
        $state.RoundEpoch               | Should -Be 1
        $state.UnresolvedObjections     | Should -BeNullOrEmpty
        $state.OverriddenObjections     | Should -BeNullOrEmpty
    }

    # -------------------------------------------------------------------------
    # 2. Start-ConsensusRound — sets RoundEpoch (monotone advance)
    # -------------------------------------------------------------------------
    It '2. Start-ConsensusRound sets RoundEpoch to provided evtId when evtId > current' {
        Start-ConsensusRound -Connection $script:db -RoundEpochEvtId 42
        $state = Get-ConsensusRoundState -Connection $script:db
        $state.RoundEpoch | Should -Be 42
    }

    # -------------------------------------------------------------------------
    # 3. Start-ConsensusRound — idempotent when evtId <= current
    # -------------------------------------------------------------------------
    It '3. Start-ConsensusRound is no-op when evtId <= current RoundEpoch' {
        Start-ConsensusRound -Connection $script:db -RoundEpochEvtId 100
        Start-ConsensusRound -Connection $script:db -RoundEpochEvtId 50   # lower — no-op
        $state = Get-ConsensusRoundState -Connection $script:db
        $state.RoundEpoch | Should -Be 100
    }

    # -------------------------------------------------------------------------
    # 4. Add-ConsensusObjection — adds objection
    # -------------------------------------------------------------------------
    It '4. Add-ConsensusObjection adds objection to unresolvedObjections' {
        $result = Add-ConsensusObjection -Connection $script:db -ObjectionEvtId 7
        $state  = Get-ConsensusRoundState -Connection $script:db
        $state.UnresolvedObjections | Should -Contain 7
        $result | Should -Contain 7
    }

    # -------------------------------------------------------------------------
    # 5. Add-ConsensusObjection — idempotent
    # -------------------------------------------------------------------------
    It '5. Add-ConsensusObjection is idempotent (same evtId twice yields one entry)' {
        Add-ConsensusObjection -Connection $script:db -ObjectionEvtId 7
        Add-ConsensusObjection -Connection $script:db -ObjectionEvtId 7
        $state = Get-ConsensusRoundState -Connection $script:db
        ($state.UnresolvedObjections | Where-Object { $_ -eq 7 }).Count | Should -Be 1
    }

    # -------------------------------------------------------------------------
    # 6. Resolve-ConsensusObjection — removes from unresolved
    # -------------------------------------------------------------------------
    It '6. Resolve-ConsensusObjection removes objection from unresolvedObjections' {
        Add-ConsensusObjection -Connection $script:db -ObjectionEvtId 7
        Add-ConsensusObjection -Connection $script:db -ObjectionEvtId 8
        Resolve-ConsensusObjection -Connection $script:db -ObjectionEvtId 7
        $state = Get-ConsensusRoundState -Connection $script:db
        $state.UnresolvedObjections | Should -Not -Contain 7
        $state.UnresolvedObjections | Should -Contain 8
    }

    # -------------------------------------------------------------------------
    # 7. Resolve-ConsensusObjection — no-op if not found
    # -------------------------------------------------------------------------
    It '7. Resolve-ConsensusObjection is no-op if objection not found' {
        { Resolve-ConsensusObjection -Connection $script:db -ObjectionEvtId 999 } | Should -Not -Throw
        $state = Get-ConsensusRoundState -Connection $script:db
        $state.UnresolvedObjections | Should -BeNullOrEmpty
    }

    # -------------------------------------------------------------------------
    # 8. Override-ConsensusObjection — moves unresolved -> overridden
    # -------------------------------------------------------------------------
    It '8. Override-ConsensusObjection moves objection from unresolved to overridden' {
        Add-ConsensusObjection -Connection $script:db -ObjectionEvtId 7
        Override-ConsensusObjection -Connection $script:db -ObjectionEvtId 7
        $state = Get-ConsensusRoundState -Connection $script:db
        $state.UnresolvedObjections | Should -Not -Contain 7
        $state.OverriddenObjections | Should -Contain 7
    }

    # -------------------------------------------------------------------------
    # 9. Override-ConsensusObjection — throws on double override (OverrideIntegrity)
    # -------------------------------------------------------------------------
    It '9. Override-ConsensusObjection throws when same objection overridden twice (OverrideIntegrity)' {
        Add-ConsensusObjection -Connection $script:db -ObjectionEvtId 7
        Override-ConsensusObjection -Connection $script:db -ObjectionEvtId 7
        { Override-ConsensusObjection -Connection $script:db -ObjectionEvtId 7 } | Should -Throw '*ObjectionAlreadyOverridden*'
    }

    # -------------------------------------------------------------------------
    # 10. Set-ConsensusStateCandidate — transitions open -> candidate
    # -------------------------------------------------------------------------
    It '10. Set-ConsensusStateCandidate transitions state from open to candidate' {
        # Insert a consensus_candidate event so invariant 17 can be checked (caller responsibility)
        Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO event_log ([from],[to],type,status) VALUES ('moderator','bus','consensus_candidate','routed')
"@
        $evtId = (Invoke-SqliteQuery -DataSource $script:db -Query "SELECT last_insert_rowid() AS id").id
        Set-ConsensusStateCandidate -Connection $script:db -CandidateEvtId $evtId
        $state = Get-ConsensusRoundState -Connection $script:db
        $state.ConsensusState | Should -BeExactly 'candidate'
    }

    # -------------------------------------------------------------------------
    # 11. Set-ConsensusRatified — succeeds when no unresolved objections
    # -------------------------------------------------------------------------
    It '11. Set-ConsensusRatified succeeds when unresolvedObjections is empty' {
        Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO event_log ([from],[to],type,status) VALUES ('moderator','bus','consensus_candidate','routed')
"@
        $evtId = (Invoke-SqliteQuery -DataSource $script:db -Query "SELECT last_insert_rowid() AS id").id
        Set-ConsensusStateCandidate -Connection $script:db -CandidateEvtId $evtId
        { Set-ConsensusRatified -Connection $script:db -RatificationEvtId 99 } | Should -Not -Throw
        $state = Get-ConsensusRoundState -Connection $script:db
        $state.ConsensusState | Should -BeExactly 'ratified'
    }

    # -------------------------------------------------------------------------
    # 12. Set-ConsensusRatified — throws with unresolved objections (invariant 3)
    # -------------------------------------------------------------------------
    It '12. Set-ConsensusRatified throws when unresolvedObjections is non-empty (invariant 3)' {
        Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO event_log ([from],[to],type,status) VALUES ('moderator','bus','consensus_candidate','routed')
"@
        $evtId = (Invoke-SqliteQuery -DataSource $script:db -Query "SELECT last_insert_rowid() AS id").id
        Set-ConsensusStateCandidate -Connection $script:db -CandidateEvtId $evtId
        Add-ConsensusObjection -Connection $script:db -ObjectionEvtId 5
        { Set-ConsensusRatified -Connection $script:db -RatificationEvtId 99 } | Should -Throw '*ConsensusHasUnresolvedObjections*'
    }

    # -------------------------------------------------------------------------
    # 13. Set-ConsensusFailed — transitions candidate -> failed
    # -------------------------------------------------------------------------
    It '13. Set-ConsensusFailed transitions candidate to failed' {
        Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO event_log ([from],[to],type,status) VALUES ('moderator','bus','consensus_candidate','routed')
"@
        $evtId = (Invoke-SqliteQuery -DataSource $script:db -Query "SELECT last_insert_rowid() AS id").id
        Set-ConsensusStateCandidate -Connection $script:db -CandidateEvtId $evtId
        Set-ConsensusFailed -Connection $script:db
        $state = Get-ConsensusRoundState -Connection $script:db
        $state.ConsensusState | Should -BeExactly 'failed'
    }

    # -------------------------------------------------------------------------
    # 14. Invoke-AdvanceRoundEpoch — advances epoch and resets state
    # -------------------------------------------------------------------------
    It '14. Invoke-AdvanceRoundEpoch advances RoundEpoch and resets state to open with empty objections' {
        # Set some state first
        Add-ConsensusObjection -Connection $script:db -ObjectionEvtId 3
        Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO event_log ([from],[to],type,status) VALUES ('moderator','bus','consensus_candidate','routed')
"@
        $evtId = (Invoke-SqliteQuery -DataSource $script:db -Query "SELECT last_insert_rowid() AS id").id
        Set-ConsensusStateCandidate -Connection $script:db -CandidateEvtId $evtId
        # Now advance
        Invoke-AdvanceRoundEpoch -Connection $script:db -NewEvtId 200
        $state = Get-ConsensusRoundState -Connection $script:db
        $state.RoundEpoch               | Should -Be 200
        $state.ConsensusState           | Should -BeExactly 'open'
        $state.UnresolvedObjections     | Should -BeNullOrEmpty
        $state.OverriddenObjections     | Should -BeNullOrEmpty
    }

    # -------------------------------------------------------------------------
    # 15. Invoke-AdvanceRoundEpoch — no-op when new evtId <= current
    # -------------------------------------------------------------------------
    It '15. Invoke-AdvanceRoundEpoch is no-op when new evtId <= current (ConsensusRoundStartMonotone)' {
        Invoke-AdvanceRoundEpoch -Connection $script:db -NewEvtId 500
        Invoke-AdvanceRoundEpoch -Connection $script:db -NewEvtId 100   # lower — no-op
        $state = Get-ConsensusRoundState -Connection $script:db
        $state.RoundEpoch | Should -Be 500
    }

    # -------------------------------------------------------------------------
    # 16. After ratification, Invoke-AdvanceRoundEpoch opens next round
    # -------------------------------------------------------------------------
    It '16. After Set-ConsensusRatified, Invoke-AdvanceRoundEpoch advances epoch for next round' {
        Invoke-SqliteQuery -DataSource $script:db -Query @"
INSERT INTO event_log ([from],[to],type,status) VALUES ('moderator','bus','consensus_candidate','routed')
"@
        $evtId = (Invoke-SqliteQuery -DataSource $script:db -Query "SELECT last_insert_rowid() AS id").id
        Set-ConsensusStateCandidate -Connection $script:db -CandidateEvtId $evtId
        Set-ConsensusRatified -Connection $script:db -RatificationEvtId 50
        # Advance to next round
        Invoke-AdvanceRoundEpoch -Connection $script:db -NewEvtId 1000
        $state = Get-ConsensusRoundState -Connection $script:db
        $state.RoundEpoch     | Should -Be 1000
        $state.ConsensusState | Should -BeExactly 'open'
    }
}
