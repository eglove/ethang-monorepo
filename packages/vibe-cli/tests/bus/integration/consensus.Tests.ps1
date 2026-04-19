Describe 'Consensus Machinery — Integration Tests' {
    BeforeAll {
        Import-Module PSSQLite -ErrorAction SilentlyContinue
        . "$PSScriptRoot/../../../bus/infra/evt-id-allocator.ps1"
        . "$PSScriptRoot/../../../bus/domain/consensus-round.ps1"
        . "$PSScriptRoot/../../../bus/domain/protocol-error-types.ps1"
        . "$PSScriptRoot/../../../bus/router/consensus.ps1"
        if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
            function global:Write-PipelineLog { param($Message,$Severity='INFO',$Gate=$null,$StructuredData=$null) }
        }
    }
    BeforeEach {
        $script:TestDir = Join-Path $env:TEMP "vibe-test-$(New-Guid)"
        New-Item -ItemType Directory $script:TestDir | Out-Null
        $script:DbPath = Join-Path $script:TestDir 'vibe-bus.db'
        $script:Conn = New-SQLiteConnection -DataSource $script:DbPath
        $evtSql = Get-Content "$PSScriptRoot/../../../bus/schema/event-log.sql" -Raw
        $conSql = Get-Content "$PSScriptRoot/../../../bus/schema/consensus-state.sql" -Raw
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $evtSql
        Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query $conSql
        Initialize-EvtIdAllocator -StartValue 1
        Reset-RouterState
        Reset-ConsensusState
    }
    AfterEach {
        if ($script:Conn) { $script:Conn.Close() }
        Remove-Item -Recurse -Force $script:TestDir -ErrorAction SilentlyContinue
    }

    Context 'Invoke-ConsensusObjectionReceived' {
        It 'T01 — adds objection to unresolvedObjections in DB' {
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 5 -FromAgent 'agent-A'
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.UnresolvedObjections | Should -Contain 5
        }

        It 'T02 — calls Start-ConsensusRound (roundEpoch updated in DB)' {
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 7 -FromAgent 'agent-B'
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.RoundEpoch | Should -Be 7
        }

        It 'T03 — returns @{ State = "objecting" }' {
            $result = Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 3 -FromAgent 'agent-C'
            $result.State | Should -Be 'objecting'
        }

        It 'T04 — ObjectionEvtId is included in return value' {
            $result = Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 4 -FromAgent 'agent-D'
            $result.ObjectionEvtId | Should -Be 4
        }
    }

    Context 'Invoke-ConsensusObjectionResponseReceived — accepted' {
        It 'T05 — accepted response removes objection from unresolvedObjections' {
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 10 -FromAgent 'agent-X'
            Invoke-ConsensusObjectionResponseReceived -Connection $script:Conn -OriginalEvtId 10 -Response 'accepted'
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.UnresolvedObjections | Should -Not -Contain 10
        }

        It 'T06 — accepted response returns Resolved = $true' {
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 11 -FromAgent 'agent-X'
            $result = Invoke-ConsensusObjectionResponseReceived -Connection $script:Conn -OriginalEvtId 11 -Response 'accepted'
            $result.Resolved | Should -Be $true
        }
    }

    Context 'Invoke-ConsensusObjectionResponseReceived — rejected' {
        It 'T07 — rejected response moves objection to overriddenObjections' {
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 20 -FromAgent 'agent-Y'
            Invoke-ConsensusObjectionResponseReceived -Connection $script:Conn -OriginalEvtId 20 -Response 'rejected'
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.OverriddenObjections | Should -Contain 20
        }

        It 'T08 — rejected response removes from unresolvedObjections' {
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 21 -FromAgent 'agent-Y'
            Invoke-ConsensusObjectionResponseReceived -Connection $script:Conn -OriginalEvtId 21 -Response 'rejected'
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.UnresolvedObjections | Should -Not -Contain 21
        }

        It 'T09 — rejected response returns Resolved = $true' {
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 22 -FromAgent 'agent-Y'
            $result = Invoke-ConsensusObjectionResponseReceived -Connection $script:Conn -OriginalEvtId 22 -Response 'rejected'
            $result.Resolved | Should -Be $true
        }
    }

    Context 'Invoke-ConsensusCandidate' {
        It 'T10 — sets consensusState to candidate in DB' {
            Invoke-ConsensusCandidate -Connection $script:Conn -CandidateEvtId 30 -ProposedBy 'moderator'
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.ConsensusState | Should -Be 'candidate'
        }

        It 'T11 — appends consensus_candidate row to event_log' {
            Invoke-ConsensusCandidate -Connection $script:Conn -CandidateEvtId 31 -ProposedBy 'moderator'
            $rows = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT * FROM event_log WHERE type = 'consensus_candidate'"
            $rows | Should -Not -BeNullOrEmpty
        }

        It 'T12 — consensus_candidate event has correct to field (orchestrator)' {
            Invoke-ConsensusCandidate -Connection $script:Conn -CandidateEvtId 32 -ProposedBy 'moderator'
            $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT * FROM event_log WHERE type = 'consensus_candidate'" | Select-Object -First 1
            $row.to | Should -Be 'orchestrator'
        }

        It 'T13 — uses debate-moderator as default from when ProposedBy is null' {
            Invoke-ConsensusCandidate -Connection $script:Conn -CandidateEvtId 33
            $row = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT * FROM event_log WHERE type = 'consensus_candidate'" | Select-Object -First 1
            $row.from | Should -Be 'debate-moderator'
        }

        It 'T14 — returns @{ State = "candidate" }' {
            $result = Invoke-ConsensusCandidate -Connection $script:Conn -CandidateEvtId 34 -ProposedBy 'moderator'
            $result.State | Should -Be 'candidate'
        }
    }

    Context 'Invoke-ConsensusRatify — no objections' {
        It 'T15 — sets consensusState to ratified in DB when no objections' {
            Set-ConsensusStateCandidate -Connection $script:Conn
            Invoke-ConsensusRatify -Connection $script:Conn
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.ConsensusState | Should -Be 'ratified'
        }

        It 'T16 — appends consensus_ratified row to event_log' {
            Set-ConsensusStateCandidate -Connection $script:Conn
            Invoke-ConsensusRatify -Connection $script:Conn
            $rows = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT * FROM event_log WHERE type = 'consensus_ratified'"
            $rows | Should -Not -BeNullOrEmpty
        }

        It 'T17 — returns @{ Ratified = $true }' {
            Set-ConsensusStateCandidate -Connection $script:Conn
            $result = Invoke-ConsensusRatify -Connection $script:Conn
            $result.Ratified | Should -Be $true
        }
    }

    Context 'Invoke-ConsensusRatify — with unresolved objections' {
        It 'T18 — with unresolved objections sets consensusState to failed' {
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 40 -FromAgent 'agent-Z'
            Set-ConsensusStateCandidate -Connection $script:Conn
            Invoke-ConsensusRatify -Connection $script:Conn
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.ConsensusState | Should -Be 'failed'
        }

        It 'T19 — with unresolved objections returns @{ Ratified = $false }' {
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 41 -FromAgent 'agent-Z'
            Set-ConsensusStateCandidate -Connection $script:Conn
            $result = Invoke-ConsensusRatify -Connection $script:Conn
            $result.Ratified | Should -Be $false
        }
    }

    Context 'Invoke-ConsensusFail' {
        It 'T20 — sets consensusState to failed in DB' {
            Invoke-ConsensusFail -Connection $script:Conn -Reason 'test_reason'
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.ConsensusState | Should -Be 'failed'
        }

        It 'T21 — appends consensus_failed row to event_log' {
            Invoke-ConsensusFail -Connection $script:Conn -Reason 'test_reason'
            $rows = Invoke-SqliteQuery -SQLiteConnection $script:Conn -Query "SELECT * FROM event_log WHERE type = 'consensus_failed'"
            $rows | Should -Not -BeNullOrEmpty
        }

        It 'T22 — returns @{ Failed = $true }' {
            $result = Invoke-ConsensusFail -Connection $script:Conn -Reason 'test_reason'
            $result.Failed | Should -Be $true
        }
    }

    Context 'Invoke-ConsensusReset' {
        It 'T23 — sets consensusState to open in DB' {
            Set-ConsensusFailed -Connection $script:Conn
            Invoke-ConsensusReset -Connection $script:Conn -NewEpochEvtId 100
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.ConsensusState | Should -Be 'open'
        }

        It 'T24 — clears unresolvedObjections to []' {
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 50 -FromAgent 'agent-A'
            Invoke-ConsensusReset -Connection $script:Conn -NewEpochEvtId 100
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.UnresolvedObjections.Count | Should -Be 0
        }

        It 'T25 — clears overriddenObjections to []' {
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 51 -FromAgent 'agent-A'
            Invoke-ConsensusObjectionResponseReceived -Connection $script:Conn -OriginalEvtId 51 -Response 'rejected'
            Invoke-ConsensusReset -Connection $script:Conn -NewEpochEvtId 100
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.OverriddenObjections.Count | Should -Be 0
        }

        It 'T26 — advances consensusRoundStart to new epoch' {
            Invoke-ConsensusReset -Connection $script:Conn -NewEpochEvtId 200
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.RoundEpoch | Should -Be 200
        }

        It 'T27 — returns @{ NewEpoch = $NewEpochEvtId }' {
            $result = Invoke-ConsensusReset -Connection $script:Conn -NewEpochEvtId 150
            $result.NewEpoch | Should -Be 150
        }

        It 'T28 — returns @{ State = "open" }' {
            $result = Invoke-ConsensusReset -Connection $script:Conn -NewEpochEvtId 160
            $result.State | Should -Be 'open'
        }
    }

    Context 'Multiple objections and override scenarios' {
        It 'T29 — multiple objections are all tracked in unresolvedObjections' {
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 60 -FromAgent 'agent-1'
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 61 -FromAgent 'agent-2'
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 62 -FromAgent 'agent-3'
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.UnresolvedObjections.Count | Should -Be 3
            $state.UnresolvedObjections | Should -Contain 60
            $state.UnresolvedObjections | Should -Contain 61
            $state.UnresolvedObjections | Should -Contain 62
        }

        It 'T30 — override then ratify: overridden objection does not block ratification' {
            Invoke-ConsensusObjectionReceived -Connection $script:Conn -ObjectionEvtId 70 -FromAgent 'agent-A'
            Invoke-ConsensusObjectionResponseReceived -Connection $script:Conn -OriginalEvtId 70 -Response 'rejected'
            Set-ConsensusStateCandidate -Connection $script:Conn
            $result = Invoke-ConsensusRatify -Connection $script:Conn
            $result.Ratified | Should -Be $true
            $state = Get-ConsensusRoundState -Connection $script:Conn
            $state.ConsensusState | Should -Be 'ratified'
        }
    }
}
