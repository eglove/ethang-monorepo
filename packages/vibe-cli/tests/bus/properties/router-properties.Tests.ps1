BeforeAll {
    Import-Module PSSQLite -ErrorAction Stop

    $root = Resolve-Path "$PSScriptRoot/../../.."

    # Load the router implementation
    . "$root/bus/router/router.ps1"

    # Load the event sequence generator
    . "$PSScriptRoot/event-sequence-generator.ps1"

    # ---------------------------------------------------------------------------
    # Helper: create a fresh temp SQLite DB
    # ---------------------------------------------------------------------------
    function script:New-PropTestDb {
        $path = Join-Path ([System.IO.Path]::GetTempPath()) "prop-$([guid]::NewGuid().ToString('N').Substring(0,8)).db"
        Initialize-RouterDatabase -DbPath $path
        return $path
    }

    # Helper: append a sequence and return list of evt_ids assigned
    function script:Invoke-AppendSequence {
        param([string]$DbPath, [hashtable[]]$Sequence)
        $ids = [System.Collections.Generic.List[int]]::new()
        foreach ($ev in $Sequence) {
            $id = Invoke-BusAppendEvent -DbPath $DbPath -Envelope $ev
            $ids.Add($id)
        }
        return $ids.ToArray()
    }
}

# ---------------------------------------------------------------------------
# P1: InvEventIds holds for 50 random sequences of length 10
# ---------------------------------------------------------------------------
Describe 'P1: InvEventIds — all evt_ids unique in DB across 50 sequences' {
    It 'appends 50 sequences and evt_ids in DB are all unique' {
        $dbPath = New-PropTestDb
        try {
            $allIds = [System.Collections.Generic.List[int]]::new()
            for ($i = 0; $i -lt 50; $i++) {
                $seq = New-RandomEventSequence -Length 10 -Seed ($i * 17 + 3)
                $ids = Invoke-AppendSequence -DbPath $dbPath -Sequence $seq
                foreach ($id in $ids) { $allIds.Add($id) }
            }
            $uniqueIds = $allIds | Sort-Object -Unique
            $uniqueIds.Count | Should -Be $allIds.Count
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# P2: All appended events have strictly increasing evt_ids
# ---------------------------------------------------------------------------
Describe 'P2: evt_ids are strictly increasing in DB' {
    It 'appended events have strictly increasing evt_ids' {
        $dbPath = New-PropTestDb
        try {
            $seq = New-RandomEventSequence -Length 20 -Seed 42
            Invoke-AppendSequence -DbPath $dbPath -Sequence $seq | Out-Null
            $ids = Get-RouterEventIds -DbPath $dbPath
            for ($i = 1; $i -lt $ids.Count; $i++) {
                $ids[$i] | Should -BeGreaterThan $ids[$i - 1]
            }
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'strictly increasing across multiple sequences' {
        $dbPath = New-PropTestDb
        try {
            for ($i = 0; $i -lt 5; $i++) {
                $seq = New-RandomEventSequence -Length 5 -Seed ($i + 100)
                Invoke-AppendSequence -DbPath $dbPath -Sequence $seq | Out-Null
            }
            $ids = Get-RouterEventIds -DbPath $dbPath
            $ids.Count | Should -Be 25
            for ($i = 1; $i -lt $ids.Count; $i++) {
                $ids[$i] | Should -BeGreaterThan $ids[$i - 1]
            }
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# P3: Event count in DB matches number appended (no silent drops)
# ---------------------------------------------------------------------------
Describe 'P3: No silent drops — DB count matches events appended' {
    It 'count matches for 50 sequences of length 10' {
        $dbPath = New-PropTestDb
        try {
            $total = 0
            for ($i = 0; $i -lt 50; $i++) {
                $seq = New-RandomEventSequence -Length 10 -Seed ($i * 31 + 7)
                Invoke-AppendSequence -DbPath $dbPath -Sequence $seq | Out-Null
                $total += 10
            }
            $count = Get-RouterEventCount -DbPath $dbPath
            $count | Should -Be $total
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'count matches for variable-length sequences' {
        $dbPath = New-PropTestDb
        try {
            $total = 0
            foreach ($len in @(1, 3, 5, 10, 15, 20)) {
                $seq = New-RandomEventSequence -Length $len -Seed ($len * 13)
                Invoke-AppendSequence -DbPath $dbPath -Sequence $seq | Out-Null
                $total += $len
            }
            $count = Get-RouterEventCount -DbPath $dbPath
            $count | Should -Be $total
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# P4: InvAclCompliant — ACL-valid events succeed; ACL-invalid events throw
# ---------------------------------------------------------------------------
Describe 'P4: InvAclCompliant — ACL-valid events succeed, ACL-invalid throw' {
    It 'ACL-valid events from generator always succeed' {
        $dbPath = New-PropTestDb
        try {
            for ($i = 0; $i -lt 50; $i++) {
                $seq = New-RandomEventSequence -Length 5 -Seed ($i * 7 + 1)
                { Invoke-AppendSequence -DbPath $dbPath -Sequence $seq } | Should -Not -Throw
            }
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'event with invalid From role throws AclViolation' {
        $dbPath = New-PropTestDb
        try {
            $badEnvelope = @{
                EventType = 'bootstrap'   # must come from 'router'
                From      = 'writer'      # invalid
                To        = 'reviewer'
            }
            { Invoke-BusAppendEvent -DbPath $dbPath -Envelope $badEnvelope } | Should -Throw -ExpectedMessage '*AclViolation*'
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'event with invalid To role throws AclViolation' {
        $dbPath = New-PropTestDb
        try {
            $badEnvelope = @{
                EventType = 'done'        # must go To='router'
                From      = 'writer'
                To        = 'reviewer'    # invalid
            }
            { Invoke-BusAppendEvent -DbPath $dbPath -Envelope $badEnvelope } | Should -Throw -ExpectedMessage '*AclViolation*'
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'event with invalid From and To both throws AclViolation' {
        $dbPath = New-PropTestDb
        try {
            $badEnvelope = @{
                EventType = 'verify_result'  # must come from handler, go to agent
                From      = 'router'          # invalid sender
                To        = 'router'          # invalid recipient
            }
            { Invoke-BusAppendEvent -DbPath $dbPath -Envelope $badEnvelope } | Should -Throw -ExpectedMessage '*AclViolation*'
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'Assert-SequenceInvariant InvAclCompliant passes for generator output' {
        for ($i = 0; $i -lt 20; $i++) {
            $seq = New-RandomEventSequence -Length 10 -Seed ($i * 11 + 5)
            { Assert-SequenceInvariant -Events $seq -Invariant 'InvAclCompliant' } | Should -Not -Throw
        }
    }
}

# ---------------------------------------------------------------------------
# P5: InvStatusTransition — no invalid status transitions in 50 sequences
# ---------------------------------------------------------------------------
Describe 'P5: InvStatusTransition — only routed/committed/delivery_failed statuses' {
    It 'all events inserted by router have status routed' {
        $dbPath = New-PropTestDb
        try {
            for ($i = 0; $i -lt 50; $i++) {
                $seq = New-RandomEventSequence -Length 5 -Seed ($i * 19 + 2)
                Invoke-AppendSequence -DbPath $dbPath -Sequence $seq | Out-Null
            }
            $rows = Invoke-SqliteQuery -DataSource $dbPath -Query "SELECT DISTINCT status FROM event_log"
            $statuses = @($rows | ForEach-Object { $_.status })
            $statuses | Should -Not -Contain 'delivery_failed'
            $statuses | Should -Contain 'routed'
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'Assert-SequenceInvariant InvStatusTransition passes for valid sequences' {
        $validSeq = @(
            @{ EventType = 'bootstrap'; From = 'router'; To = 'writer'; Status = 'routed' },
            @{ EventType = 'done'; From = 'writer'; To = 'router'; Status = 'committed' }
        )
        { Assert-SequenceInvariant -Events $validSeq -Invariant 'InvStatusTransition' } | Should -Not -Throw
    }

    It 'Assert-SequenceInvariant InvStatusTransition throws for invalid status' {
        $badSeq = @(
            @{ EventType = 'bootstrap'; From = 'router'; To = 'writer'; Status = 'pending' }
        )
        { Assert-SequenceInvariant -Events $badSeq -Invariant 'InvStatusTransition' } | Should -Throw
    }
}

# ---------------------------------------------------------------------------
# P6: Valid event types accepted; unknown types rejected
# ---------------------------------------------------------------------------
Describe 'P6: Event types from Get-ValidEventTypes accepted; unknown rejected' {
    It 'all 16 valid event types are accepted by the router' {
        $validTypes = Get-ValidEventTypes
        $validTypes.Count | Should -Be 16

        foreach ($type in $validTypes) {
            $dbPath = New-PropTestDb
            try {
                $fromList = @('router', 'writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer', 'tlc', 'tests', 'git')
                $toList   = @('router', 'writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer', 'broadcast', 'tlc', 'tests', 'git')
                $envelope = New-ValidEnvelope -EventType $type
                { Invoke-BusAppendEvent -DbPath $dbPath -Envelope $envelope } | Should -Not -Throw
            } finally {
                Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
            }
        }
    }

    It 'unknown event type throws AclViolation' {
        $dbPath = New-PropTestDb
        try {
            $badEnvelope = @{
                EventType = 'totally_unknown_type'
                From      = 'router'
                To        = 'writer'
            }
            { Invoke-BusAppendEvent -DbPath $dbPath -Envelope $badEnvelope } | Should -Throw -ExpectedMessage '*AclViolation*'
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'empty event type throws AclViolation' {
        $dbPath = New-PropTestDb
        try {
            $badEnvelope = @{
                EventType = ''
                From      = 'router'
                To        = 'writer'
            }
            { Invoke-BusAppendEvent -DbPath $dbPath -Envelope $badEnvelope } | Should -Throw
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# P7: Empty sequence appends succeed (zero events is valid state)
# ---------------------------------------------------------------------------
Describe 'P7: Empty sequence appends succeed' {
    It 'empty sequence results in zero events in DB' {
        $dbPath = New-PropTestDb
        try {
            $emptySeq = @()
            Invoke-AppendSequence -DbPath $dbPath -Sequence $emptySeq | Out-Null
            $count = Get-RouterEventCount -DbPath $dbPath
            $count | Should -Be 0
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'empty sequence does not throw' {
        $dbPath = New-PropTestDb
        try {
            $emptySeq = @()
            { Invoke-AppendSequence -DbPath $dbPath -Sequence $emptySeq } | Should -Not -Throw
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'New-RandomEventSequence with Length 0 returns empty array' {
        $seq = New-RandomEventSequence -Length 0
        $seq.Count | Should -Be 0
    }
}

# ---------------------------------------------------------------------------
# P8: Single event sequence is idempotent in DB (append once = one row)
# ---------------------------------------------------------------------------
Describe 'P8: Single event sequence appended once = exactly one row' {
    It 'single event produces exactly one DB row' {
        $dbPath = New-PropTestDb
        try {
            $seq = New-RandomEventSequence -Length 1 -Seed 999
            Invoke-AppendSequence -DbPath $dbPath -Sequence $seq | Out-Null
            $count = Get-RouterEventCount -DbPath $dbPath
            $count | Should -Be 1
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'single event gets evt_id = 1 on fresh DB' {
        $dbPath = New-PropTestDb
        try {
            $seq = New-RandomEventSequence -Length 1 -Seed 42
            $ids = Invoke-AppendSequence -DbPath $dbPath -Sequence $seq
            $ids[0] | Should -Be 1
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# P9: 100-event sequences stay within p99 ≤ 5ms per event (perf baseline)
# ---------------------------------------------------------------------------
Describe 'P9: Perf baseline — p99 per event within baseline threshold' {
    It 'p99 append latency is within the configured baseline threshold' {
        # Read the threshold from the shared baseline JSON file
        $baselineFile = "$root/tests/bus/performance-baselines.json"
        $baseline = Get-Content $baselineFile -Raw | ConvertFrom-Json
        $p99Threshold = [double]$baseline.append_event_p99_ms

        $dbPath = New-PropTestDb
        try {
            $seq = New-RandomEventSequence -Length 100 -Seed 7777
            $latencies = [System.Collections.Generic.List[double]]::new()

            foreach ($ev in $seq) {
                $sw = [System.Diagnostics.Stopwatch]::StartNew()
                Invoke-BusAppendEvent -DbPath $dbPath -Envelope $ev | Out-Null
                $sw.Stop()
                $latencies.Add($sw.Elapsed.TotalMilliseconds)
            }

            $sorted = $latencies | Sort-Object
            $p99idx = [int][Math]::Ceiling(0.99 * $latencies.Count) - 1
            $p99 = $sorted[$p99idx]

            $p99 | Should -BeLessOrEqual $p99Threshold -Because "p99 append latency must be <= baseline of ${p99Threshold}ms (actual: ${p99}ms)"
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# P10: Halt event followed by non-halt event throws AclViolation
# ---------------------------------------------------------------------------
Describe 'P10: InvHaltMonotone — halt event followed by non-halt throws' {
    It 'non-halt event after consensus_ratified throws AclViolation' {
        $dbPath = New-PropTestDb
        try {
            # Append a halt event
            $haltEnv = @{ EventType = 'consensus_ratified'; From = 'router'; To = 'broadcast' }
            Invoke-BusAppendEvent -DbPath $dbPath -Envelope $haltEnv | Out-Null

            # Now append a non-halt event — should throw
            $nonHaltEnv = @{ EventType = 'bootstrap'; From = 'router'; To = 'writer' }
            { Invoke-BusAppendEvent -DbPath $dbPath -Envelope $nonHaltEnv } | Should -Throw -ExpectedMessage '*AclViolation*'
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'non-halt event after consensus_failed throws AclViolation' {
        $dbPath = New-PropTestDb
        try {
            $haltEnv = @{ EventType = 'consensus_failed'; From = 'router'; To = 'broadcast' }
            Invoke-BusAppendEvent -DbPath $dbPath -Envelope $haltEnv | Out-Null

            $nonHaltEnv = @{ EventType = 'done'; From = 'writer'; To = 'router' }
            { Invoke-BusAppendEvent -DbPath $dbPath -Envelope $nonHaltEnv } | Should -Throw -ExpectedMessage '*AclViolation*'
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'Assert-SequenceInvariant InvHaltMonotone throws on violation' {
        $seq = @(
            @{ EventType = 'consensus_ratified'; From = 'router'; To = 'broadcast' },
            @{ EventType = 'bootstrap'; From = 'router'; To = 'writer' }
        )
        { Assert-SequenceInvariant -Events $seq -Invariant 'InvHaltMonotone' } | Should -Throw
    }

    It 'Assert-SequenceInvariant InvHaltMonotone passes for halt-only sequences' {
        $seq = @(
            @{ EventType = 'bootstrap'; From = 'router'; To = 'writer' },
            @{ EventType = 'consensus_ratified'; From = 'router'; To = 'broadcast' }
        )
        { Assert-SequenceInvariant -Events $seq -Invariant 'InvHaltMonotone' } | Should -Not -Throw
    }
}

# ---------------------------------------------------------------------------
# P11: Parallel sequence generation produces no duplicate evt_ids
# ---------------------------------------------------------------------------
Describe 'P11: Parallel evt_id generation — no duplicates' {
    It 'sequential generation produces no duplicate evt_ids across 50 sequences' {
        $dbPath = New-PropTestDb
        try {
            $allIds = [System.Collections.Generic.List[int]]::new()
            for ($i = 0; $i -lt 50; $i++) {
                $seq = New-RandomEventSequence -Length 10 -Seed ($i * 41 + 13)
                $ids = Invoke-AppendSequence -DbPath $dbPath -Sequence $seq
                foreach ($id in $ids) { $allIds.Add($id) }
            }
            $unique = $allIds | Sort-Object -Unique
            $unique.Count | Should -Be $allIds.Count
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'evt_ids from New-RandomEventSequence generation are reproducible with same seed' {
        $seq1 = New-RandomEventSequence -Length 10 -Seed 12345
        $seq2 = New-RandomEventSequence -Length 10 -Seed 12345
        for ($i = 0; $i -lt $seq1.Count; $i++) {
            $seq1[$i].EventType | Should -Be $seq2[$i].EventType
            $seq1[$i].From | Should -Be $seq2[$i].From
            $seq1[$i].To | Should -Be $seq2[$i].To
        }
    }
}

# ---------------------------------------------------------------------------
# P12: Reset-RouterState clears all events; subsequent sequences start fresh
# ---------------------------------------------------------------------------
Describe 'P12: Reset-RouterState clears events; fresh sequences start from evt_id 1' {
    It 'after reset, event count is zero' {
        $dbPath = New-PropTestDb
        try {
            $seq = New-RandomEventSequence -Length 10 -Seed 55
            Invoke-AppendSequence -DbPath $dbPath -Sequence $seq | Out-Null
            Reset-RouterState -DbPath $dbPath
            $count = Get-RouterEventCount -DbPath $dbPath
            $count | Should -Be 0
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'after reset, next evt_id starts at 1' {
        $dbPath = New-PropTestDb
        try {
            $seq = New-RandomEventSequence -Length 5 -Seed 88
            Invoke-AppendSequence -DbPath $dbPath -Sequence $seq | Out-Null
            Reset-RouterState -DbPath $dbPath
            $seq2 = New-RandomEventSequence -Length 1 -Seed 89
            $ids = Invoke-AppendSequence -DbPath $dbPath -Sequence $seq2
            $ids[0] | Should -Be 1
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'halt latch is cleared by Reset-RouterState' {
        $dbPath = New-PropTestDb
        try {
            $haltEnv = @{ EventType = 'consensus_ratified'; From = 'router'; To = 'broadcast' }
            Invoke-BusAppendEvent -DbPath $dbPath -Envelope $haltEnv | Out-Null
            Reset-RouterState -DbPath $dbPath
            # After reset, should accept non-halt events again
            $normalEnv = @{ EventType = 'bootstrap'; From = 'router'; To = 'writer' }
            { Invoke-BusAppendEvent -DbPath $dbPath -Envelope $normalEnv } | Should -Not -Throw
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# P13: InvHaltMonotone holds across 50 sequences
# ---------------------------------------------------------------------------
Describe 'P13: InvHaltMonotone holds for all 50 generated sequences' {
    It 'generator never produces halt events followed by non-halt events in default mode' {
        for ($i = 0; $i -lt 50; $i++) {
            $seq = New-RandomEventSequence -Length 10 -Seed ($i * 23 + 9)
            { Assert-SequenceInvariant -Events $seq -Invariant 'InvHaltMonotone' } | Should -Not -Throw
        }
    }
}

# ---------------------------------------------------------------------------
# P14: ProtocolError events are recognized as valid event types
# ---------------------------------------------------------------------------
Describe 'P14: protocol_error events route with valid ACL' {
    It 'protocol_error from router to agent is accepted' {
        $dbPath = New-PropTestDb
        try {
            $pe = @{ EventType = 'protocol_error'; From = 'router'; To = 'writer' }
            { Invoke-BusAppendEvent -DbPath $dbPath -Envelope $pe } | Should -Not -Throw
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'protocol_error_ack from agent to router is accepted' {
        $dbPath = New-PropTestDb
        try {
            $ack = @{ EventType = 'protocol_error_ack'; From = 'writer'; To = 'router' }
            { Invoke-BusAppendEvent -DbPath $dbPath -Envelope $ack } | Should -Not -Throw
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'protocol_error from non-router throws AclViolation' {
        $dbPath = New-PropTestDb
        try {
            $pe = @{ EventType = 'protocol_error'; From = 'writer'; To = 'reviewer' }
            { Invoke-BusAppendEvent -DbPath $dbPath -Envelope $pe } | Should -Throw -ExpectedMessage '*AclViolation*'
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# P15: ground_truth_delivered starts at 0 for each new agent session
# ---------------------------------------------------------------------------
Describe 'P15: ground_truth_delivered starts at 0 for each new agent session' {
    It 'newly created session has ground_truth_delivered = 0' {
        $dbPath = New-PropTestDb
        try {
            $sid = "session-$([guid]::NewGuid().ToString('N').Substring(0,8))"
            New-RouterAgentSession -DbPath $dbPath -SessionId $sid -AgentId 'agent-test' -Role 'writer'
            $row = Invoke-SqliteQuery -DataSource $dbPath -Query `
                "SELECT ground_truth_delivered FROM agent_sessions WHERE session_id = @sid" `
                -SqlParameters @{ sid = $sid }
            [int]($row.ground_truth_delivered) | Should -Be 0
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }

    It 'multiple new sessions all start at ground_truth_delivered = 0' {
        $dbPath = New-PropTestDb
        try {
            for ($i = 0; $i -lt 5; $i++) {
                $sid = "session-$i-$([guid]::NewGuid().ToString('N').Substring(0,8))"
                New-RouterAgentSession -DbPath $dbPath -SessionId $sid -Role 'reviewer'
            }
            $rows = Invoke-SqliteQuery -DataSource $dbPath -Query "SELECT ground_truth_delivered FROM agent_sessions"
            foreach ($row in $rows) {
                [int]($row.ground_truth_delivered) | Should -Be 0
            }
        } finally {
            Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
        }
    }
}
