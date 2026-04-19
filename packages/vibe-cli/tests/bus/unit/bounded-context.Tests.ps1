BeforeAll {
    # PSScriptRoot = packages/vibe-cli/tests/bus/unit
    # PackageRoot  = packages/vibe-cli  (3 levels up)
    $script:PackageRoot = Resolve-Path "$PSScriptRoot/../../.."
    $script:BusDir = Join-Path $script:PackageRoot 'bus'
    $script:ToolsDir = Join-Path $script:PackageRoot 'tools'

    $script:GlossaryPath      = Join-Path $script:BusDir 'bounded-context-glossary.psd1'
    $script:EventMapPath      = Join-Path $script:BusDir 'event-types/event-context-map.psd1'
    $script:ContractsPath     = Join-Path $script:BusDir 'bounded-context-contracts.psd1'
    $script:ContextMapMdPath  = Join-Path $script:BusDir 'bounded-context-map.md'
    $script:CheckTlaScript    = Join-Path $script:ToolsDir 'check-tla-name-leaks.ps1'
    $script:CheckBddScript    = Join-Path $script:ToolsDir 'check-bdd-tags.ps1'
    $script:NoneReasonPath    = Join-Path $script:ToolsDir 'none-reason-tokens.psd1'

    # All TLA+ variable names that must never appear as PS identifiers
    $script:TlaVariables = @(
        'nextEvtId','eventLog','routedIds','agentStatus','agentWorktree',
        'checkpointStored','checkpointResponseInFlight','groundTruthDelivered',
        'spawnedAtEvt','deadAtEvt','unresolvedObjections','overriddenObjections',
        'consensusState','commitLockHolder','committedDoneEvts','pendingDoneEvt',
        'busStatus','haltReason','failureCategory','groupMembers','groupReplies',
        'groupViolationPending','pendingProtocolError','handlerState',
        'handlerPendingEvt','handlerPendingAgent','handlerPendingEpoch',
        'consensusRoundStart','pipeline_lock','snapshotExists',
        'rollbackRequested','rollbackTargetWorktree'
    )

    $script:AllEventTypes = @(
        'bootstrap','ground_truth','done','checkpoint','checkpoint_response',
        'objection','objection_response','consensus_candidate','consensus_ratified','consensus_failed',
        'verify','verify_result','review_requested','review_verdict',
        'protocol_error','protocol_error_ack'
    )

    $script:ContextNames = @('AgentLifecycle','Consensus','Verification','ProtocolError')
}

Describe 'bounded-context-glossary.psd1' {
    It 'exists' {
        $script:GlossaryPath | Should -Exist
    }

    It 'contains an entry for every TLA+ variable name' {
        $glossary = Import-PowerShellDataFile $script:GlossaryPath
        $tlaVars  = $glossary['TlaVariables']
        foreach ($name in $script:TlaVariables) {
            $tlaVars | Should -Contain $name -Because "TLA+ variable '$name' must be listed"
        }
    }

    It 'has a BddTagSchema key' {
        $glossary = Import-PowerShellDataFile $script:GlossaryPath
        $glossary.ContainsKey('BddTagSchema') | Should -BeTrue
    }
}

Describe 'event-context-map.psd1' {
    It 'exists' {
        $script:EventMapPath | Should -Exist
    }

    It 'covers exactly 16 event types with no gaps' {
        $map = Import-PowerShellDataFile $script:EventMapPath
        $allMapped = @()
        foreach ($ctx in $map.Keys) {
            $allMapped += $map[$ctx]
        }
        $allMapped.Count | Should -Be 16
        foreach ($evt in $script:AllEventTypes) {
            $allMapped | Should -Contain $evt -Because "event type '$evt' must be mapped"
        }
    }

    It 'has no event type appearing in more than one context (partition check)' {
        $map = Import-PowerShellDataFile $script:EventMapPath
        $seen = @{}
        foreach ($ctx in $map.Keys) {
            foreach ($evt in $map[$ctx]) {
                $seen.ContainsKey($evt) | Should -BeFalse -Because "event '$evt' appears in multiple contexts"
                $seen[$evt] = $ctx
            }
        }
    }

    It 'has exactly the four expected context names' {
        $map = Import-PowerShellDataFile $script:EventMapPath
        foreach ($name in $script:ContextNames) {
            $map.ContainsKey($name) | Should -BeTrue -Because "context '$name' must be present"
        }
        $map.Keys.Count | Should -Be 4
    }
}

Describe 'bounded-context-contracts.psd1' {
    It 'exists' {
        $script:ContractsPath | Should -Exist
    }

    It 'contract graph has no cycles (topological sort)' {
        $contracts = Import-PowerShellDataFile $script:ContractsPath
        # Build adjacency: publisher -> subscriber contexts
        $adj = @{}
        foreach ($edge in $contracts['Edges']) {
            $pub = $edge['Publisher']
            $sub = $edge['Subscriber']
            if (-not $adj.ContainsKey($pub)) { $adj[$pub] = @() }
            $adj[$pub] += $sub
        }
        # Kahn's algorithm
        $allNodes = ($contracts['Edges'] | ForEach-Object { $_['Publisher']; $_['Subscriber'] }) | Sort-Object -Unique
        $inDegree = @{}
        foreach ($n in $allNodes) { $inDegree[$n] = 0 }
        foreach ($pub in $adj.Keys) {
            foreach ($sub in $adj[$pub]) {
                $inDegree[$sub]++
            }
        }
        $queue = [System.Collections.Queue]::new()
        foreach ($n in $allNodes) {
            if ($inDegree[$n] -eq 0) { $queue.Enqueue($n) }
        }
        $visited = 0
        while ($queue.Count -gt 0) {
            $node = $queue.Dequeue()
            $visited++
            if ($adj.ContainsKey($node)) {
                foreach ($nb in $adj[$node]) {
                    $inDegree[$nb]--
                    if ($inDegree[$nb] -eq 0) { $queue.Enqueue($nb) }
                }
            }
        }
        $visited | Should -Be $allNodes.Count -Because 'a cycle would leave nodes unvisited'
    }
}

Describe 'bounded-context-map.md' {
    It 'exists' {
        $script:ContextMapMdPath | Should -Exist
    }

    It 'contains section Upstream/Downstream' {
        $content = Get-Content $script:ContextMapMdPath -Raw
        $content | Should -Match 'Upstream/Downstream'
    }

    It 'contains section ACL Boundaries' {
        $content = Get-Content $script:ContextMapMdPath -Raw
        $content | Should -Match 'ACL Boundaries'
    }

    It 'contains section Integration Patterns' {
        $content = Get-Content $script:ContextMapMdPath -Raw
        $content | Should -Match 'Integration Patterns'
    }

    It 'mentions all four context names' {
        $content = Get-Content $script:ContextMapMdPath -Raw
        foreach ($name in $script:ContextNames) {
            $content | Should -Match $name -Because "context map must mention '$name'"
        }
    }
}

Describe 'check-tla-name-leaks.ps1' {
    It 'flags a file containing $nextEvtId (exact TLA+ name as variable)' {
        $tmpFile = [System.IO.Path]::GetTempFileName() + '.ps1'
        Set-Content $tmpFile '$nextEvtId = 1'
        $output = & pwsh -NoProfile -File $script:CheckTlaScript -Path $tmpFile 2>&1
        $LASTEXITCODE | Should -Not -Be 0 -Because 'should flag a TLA+ variable name'
        Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
    }

    It 'does NOT flag $NextEventId (correct PowerShell name)' {
        $tmpFile = [System.IO.Path]::GetTempFileName() + '.ps1'
        Set-Content $tmpFile '$NextEventId = 1'
        $output = & pwsh -NoProfile -File $script:CheckTlaScript -Path $tmpFile 2>&1
        $LASTEXITCODE | Should -Be 0 -Because 'NextEventId is the correct PowerShell name'
        Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
    }
}

Describe 'check-bdd-tags.ps1' {
    It 'emits [FAIL] for a Scenario block missing @tla-action- tag' {
        $tmpFile = [System.IO.Path]::GetTempFileName() + '.feature'
        Set-Content $tmpFile @'
Feature: Example
  Scenario: some scenario without tags
    Given something happens
    When an action occurs
    Then the result is observed
'@
        $output = & pwsh -NoProfile -File $script:CheckBddScript -Path $tmpFile 2>&1
        ($output -join "`n") | Should -Match '\[FAIL\]'
        $LASTEXITCODE | Should -Not -Be 0
        Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
    }

    It 'exits 0 for a Scenario with both @tla-action-RouterHaltsFeatureComplete and @invariant-4 tags' {
        $tmpFile = [System.IO.Path]::GetTempFileName() + '.feature'
        Set-Content $tmpFile @'
Feature: Example
  @tla-action-RouterHaltsFeatureComplete @invariant-4
  Scenario: router halts on feature complete
    Given the pipeline is running
    When all features are complete
    Then the bus status is halted
'@
        $output = & pwsh -NoProfile -File $script:CheckBddScript -Path $tmpFile 2>&1
        $LASTEXITCODE | Should -Be 0
        Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
    }

    It 'emits [WARN] for step text containing nextEvtId (TLA+ identifier)' {
        $tmpFile = [System.IO.Path]::GetTempFileName() + '.feature'
        Set-Content $tmpFile @'
Feature: Example
  @tla-action-SomeAction @invariant-1
  Scenario: scenario with tla leak in step
    Given the nextEvtId is incremented
    When something happens
    Then something is observed
'@
        $output = & pwsh -NoProfile -File $script:CheckBddScript -Path $tmpFile 2>&1
        ($output -join "`n") | Should -Match '\[WARN\]'
        Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
    }

    It 'fails when @tla-action-none is present without @tla-action-none-reason' {
        $tmpFile = [System.IO.Path]::GetTempFileName() + '.feature'
        Set-Content $tmpFile @'
Feature: Example
  @tla-action-none
  Scenario: scenario with none but no reason
    Given something
    When something happens
    Then something is observed
'@
        $output = & pwsh -NoProfile -File $script:CheckBddScript -Path $tmpFile 2>&1
        ($output -join "`n") | Should -Match '\[FAIL\]'
        $LASTEXITCODE | Should -Not -Be 0
        Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
    }
}

Describe 'none-reason-tokens.psd1' {
    It 'exists' {
        $script:NoneReasonPath | Should -Exist
    }

    It 'contains all 5 valid tokens' {
        $tokens = Import-PowerShellDataFile $script:NoneReasonPath
        $validTokens = $tokens['ValidTokens']
        $validTokens | Should -Contain 'NOT_YET_SPECCED'
        $validTokens | Should -Contain 'INFRASTRUCTURE_ONLY'
        $validTokens | Should -Contain 'TEST_DOUBLE_ONLY'
        $validTokens | Should -Contain 'AGGREGATE_BOUNDARY'
        $validTokens | Should -Contain 'COMPOSITION_ROOT'
    }
}
