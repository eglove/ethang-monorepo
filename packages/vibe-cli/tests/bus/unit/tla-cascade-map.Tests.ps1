BeforeAll {
    $RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '../../..') | Select-Object -ExpandProperty Path
    $DocPath = Join-Path $RepoRoot 'docs/bidirectional-comms/tla-action-aggregate-cascade.md'

    $ValidPrimaryMovers = @(
        'AgentSession',
        'ConsensusRound',
        'BusLifecycle',
        'RollbackCoordinator',
        'CommitSerializer',
        'Router'
    )

    $ExpectedActions = @(
        'DeliverBootstrap(a, w)',
        'DeliverGroundTruth(a)',
        'AgentSendsDone(a, w)',
        'RouterCommitSucceeds(w)',
        'RouterCommitFails(w)',
        'AgentCrashes(a)',
        'RouterInitiatesCheckpoint(a)',
        'AgentCheckpointResponse(a)',
        'RouterRespawnsAgent(a)',
        'UserResumes',
        'RouterResumesAgent(a)',
        'BusResumed',
        'RouterEmitsProtocolError(a)',
        'AgentEmitsAfterProtocolError(a)',
        'AgentRaisesObjection(a)',
        'AgentResolvesObjection(a, objEvtId)',
        'ModeratorOverridesObjection(a, objEvtId)',
        'ModeratorEmitsCandidate(a)',
        'RouterRatifiesConsensus',
        'RouterFailsConsensus',
        'HandlerAdapterReceives(a, h)',
        'HandlerAdapterCompletes(h)',
        'HandlerFails(h)',
        'AgentRequestsReview(a, reviewer)',
        'ReviewerEmitsVerdict(reviewer, a, inReplyTo)',
        'RouterAddsAgentToGroup(a, g)',
        'AgentSendsToGroup(a, g)',
        'NonMemberSendsToGroup(a, g)',
        'RouterHaltsFeatureComplete',
        'RouterHaltsDuplicateId',
        'RouterHaltsGroupViolation',
        'UserInterrupts',
        'RouterHaltsBoundReached',
        'RouterHaltsSqliteError',
        'RouterHaltsRollbackSqliteError',
        'RouterAbortsStaleRollback',
        'RouterTakesSnapshot(w)',
        'UserRequestsRollback(w)',
        'RouterExecutesRollback',
        'ReleasePipelineLock'
    )
}

Describe 'TLA+ Action Aggregate Cascade Map' {

    It 'document file exists' {
        $DocPath | Should -Exist
    }

    Context 'table structure' {
        BeforeAll {
            $Content = Get-Content $DocPath -Raw
            # Extract only the Action Map table: find the section between the Action Map header row and the next blank line after the table
            # The Action Map table has exactly 5 columns: Action | Primary-Mover | Follower Aggregates | PowerShell Entry Point | Atomic Boundary
            # We identify rows that belong to the main action table by requiring exactly 5 non-empty pipe-delimited cells
            # and excluding header/separator rows
            $AllTableRows = ($Content -split "`n") | Where-Object {
                $_ -match '^\s*\|' -and
                $_ -notmatch '^\s*\|[-| :]+\|\s*$'
            }
            # Only keep rows where first cell is an action name (not a header cell like 'Action', 'Aggregate', 'Type')
            $HeaderWords = @('Action', 'Aggregate', 'Type', 'When Used', 'Responsibility')
            $TableRows = $AllTableRows | Where-Object {
                $cells = ($_ -split '\|') | Where-Object { $_ -ne '' } | ForEach-Object { $_.Trim() }
                $firstCell = $cells[0]
                # Must have 5 cells and first cell must not be a header word
                $cells.Count -ge 5 -and ($HeaderWords -notcontains $firstCell)
            }
            $script:TableRows = $TableRows
        }

        It 'contains exactly 40 data rows' {
            $script:TableRows.Count | Should -Be 40
        }

        It 'every row has at least 5 pipe-delimited cells' {
            $script:TableRows | ForEach-Object {
                $cells = $_ -split '\|' | Where-Object { $_ -ne '' }
                $cells.Count | Should -BeGreaterOrEqual 5
            }
        }

        It 'every action name matches one of the 40 expected actions' {
            $script:TableRows | ForEach-Object {
                $cells = ($_ -split '\|') | Where-Object { $_ -ne '' } | ForEach-Object { $_.Trim() }
                $actionName = $cells[0]
                $actionName | Should -BeIn $ExpectedActions
            }
        }

        It 'every Primary-Mover value is a valid aggregate name' {
            $script:TableRows | ForEach-Object {
                $cells = ($_ -split '\|') | Where-Object { $_ -ne '' } | ForEach-Object { $_.Trim() }
                $primaryMover = $cells[1]
                $primaryMover | Should -BeIn $ValidPrimaryMovers
            }
        }

        It 'no row is missing an atomic-boundary column value' {
            $script:TableRows | ForEach-Object {
                $cells = ($_ -split '\|') | Where-Object { $_ -ne '' } | ForEach-Object { $_.Trim() }
                # 5th cell (index 4) is Atomic Boundary
                $atomicBoundary = $cells[4]
                $atomicBoundary | Should -Not -BeNullOrEmpty
            }
        }
    }
}
