<#
.SYNOPSIS
    T35 — Final Completeness Review + Full E2E Test Suite

    Exercises the complete bus lifecycle against real SQLite using only
    the public API (black-box). Covers 6 lifecycle scenarios:

      Scenario 1 — Happy Path: Stage 2 Bus Migration
      Scenario 2 — Bus Event Append + Commit Ordering
      Scenario 3 — Agent Lifecycle: Start → Heartbeat → Stop
      Scenario 4 — Halt-Once Guard
      Scenario 5 — Rollback Rehearsal Integration
      Scenario 6 — Feature Flag Coverage: All Stages

    Plus final completeness assertions.
#>

BeforeAll {
    Import-Module PSSQLite -ErrorAction Stop

    $root = Resolve-Path "$PSScriptRoot/../../.."

    # ----- dot-source bus infrastructure in dependency order -----
    . "$root/bus/schema/open-bus-database.ps1"
    . "$root/bus/router/send-bus-event.ps1"
    . "$root/bus/router/agent-lifecycle.ps1"
    . "$root/bus/router/wait-bus-group.ps1"
    . "$root/bus/infra/stage-feature-flag.ps1"
    . "$root/bus/domain/stage.ps1"
    . "$root/bus/ops/halt.ps1"
    . "$root/bus/ops/rollback-rehearsal.ps1"

    # Pipeline log stub (avoids file-system writes in tests)
    . "$root/utils/pipeline-log.ps1"
    Mock Write-PipelineLog {} -ModuleName $null -ErrorAction SilentlyContinue
    function script:Write-PipelineLog { param([string]$Message, [string]$Root) }

    # Parallel-writers stage (Scenario 1)
    . "$root/stages/2-parallel-writers.ps1"

    # ----------------------------------------------------------------
    # New-E2ETestDatabase
    # Creates a fresh GUID-named SQLite DB with the full bus schema.
    # Self-contained — no external schema files.
    # ----------------------------------------------------------------
    function script:New-E2ETestDatabase {
        $path = Join-Path $env:TEMP "bus-e2e-$([guid]::NewGuid().ToString('N')).db"

        Invoke-SqliteQuery -DataSource $path -Query "CREATE TABLE IF NOT EXISTS bus_lifecycle_state (key TEXT PRIMARY KEY, value TEXT)" | Out-Null
        Invoke-SqliteQuery -DataSource $path -Query "CREATE TABLE IF NOT EXISTS event_log (id INTEGER PRIMARY KEY AUTOINCREMENT, evt_id INTEGER UNIQUE, [from] TEXT, [to] TEXT, event_type TEXT, payload TEXT, status TEXT DEFAULT 'routed', created_at TEXT DEFAULT (datetime('now')))" | Out-Null
        Invoke-SqliteQuery -DataSource $path -Query "CREATE TABLE IF NOT EXISTS agent_sessions (session_id TEXT PRIMARY KEY, agent_id TEXT, role TEXT, status TEXT DEFAULT 'active', started_at TEXT, ended_at TEXT, ground_truth_delivered INTEGER DEFAULT 0)" | Out-Null
        Invoke-SqliteQuery -DataSource $path -Query "CREATE TABLE IF NOT EXISTS rollback_state (key TEXT PRIMARY KEY, value TEXT)" | Out-Null

        $lifecycleDefaults = @(
            @{ key = 'BusStatus';        value = 'running' },
            @{ key = 'pipeline_lock';    value = '0'       },
            @{ key = 'halt_reason';      value = ''        },
            @{ key = 'failure_category'; value = ''        },
            @{ key = 'halt_intent';      value = ''        },
            @{ key = 'recovery_owner';   value = ''        }
        )
        foreach ($row in $lifecycleDefaults) {
            Invoke-SqliteQuery -DataSource $path -Query "INSERT OR REPLACE INTO bus_lifecycle_state (key, value) VALUES (@k, @v)" -SqlParameters @{ k = $row.key; v = $row.value } | Out-Null
        }
        return $path
    }

    function script:Remove-E2ETestDatabase {
        param([string]$DbPath)
        if ($DbPath -and (Test-Path $DbPath)) {
            Remove-Item $DbPath -Force -ErrorAction SilentlyContinue
        }
    }

    # Counter reset between scenarios
    function script:Reset-BusCounters {
        Reset-BusEventCounter
        Reset-BusGroupState
        Reset-BusLifecycleLatch
        Reset-StageDomainState
    }
}

# =============================================================================
# SCENARIO 1 — Happy Path: Stage 2 Bus Migration
# =============================================================================

Describe 'E2E-S1: Stage 2 Bus Migration — Happy Path' {
    BeforeEach {
        script:Reset-BusCounters
        $script:dbPath = script:New-E2ETestDatabase

        # Setup temp feature dir with elicitor.md briefing
        $script:featureDir = Join-Path $env:TEMP "e2e-feature-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value "# Test Feature Briefing`n" -Encoding UTF8

        $script:root = Resolve-Path "$PSScriptRoot/../../.."

        # Mock LaunchAgent — does NOT call real claude
        $script:mockLaunch = { param([string]$AgentId, [string]$Role) <# no-op #> }
    }

    AfterEach {
        script:Remove-E2ETestDatabase -DbPath $script:dbPath
        if (Test-Path $script:featureDir) { Remove-Item $script:featureDir -Recurse -Force -ErrorAction SilentlyContinue }
        Close-BusDatabase
    }

    It 'E2E-S1-T1: stage_started event appears in DB after Invoke-ParallelWriter' {
        Invoke-ParallelWriter `
            -FeatureDir $script:featureDir `
            -Root       $script:root `
            -DbPath     $script:dbPath `
            -LaunchAgent $script:mockLaunch | Out-Null

        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT COUNT(*) as cnt FROM event_log WHERE event_type='stage_started'" | Select-Object -First 1
        $row.cnt | Should -BeGreaterOrEqual 1
    }

    It 'E2E-S1-T2: agent_started events (x2) appear in DB after Invoke-ParallelWriter' {
        Invoke-ParallelWriter `
            -FeatureDir $script:featureDir `
            -Root       $script:root `
            -DbPath     $script:dbPath `
            -LaunchAgent $script:mockLaunch | Out-Null

        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT COUNT(*) as cnt FROM event_log WHERE event_type='agent_started'" | Select-Object -First 1
        $row.cnt | Should -BeGreaterOrEqual 2
    }

    It 'E2E-S1-T3: stage_completed event appears in DB after Invoke-ParallelWriter' {
        Invoke-ParallelWriter `
            -FeatureDir $script:featureDir `
            -Root       $script:root `
            -DbPath     $script:dbPath `
            -LaunchAgent $script:mockLaunch | Out-Null

        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT COUNT(*) as cnt FROM event_log WHERE event_type='stage_completed'" | Select-Object -First 1
        $row.cnt | Should -BeGreaterOrEqual 1
    }

    It 'E2E-S1-T4: Invoke-ParallelWriter returns Success=$true' {
        $result = Invoke-ParallelWriter `
            -FeatureDir $script:featureDir `
            -Root       $script:root `
            -DbPath     $script:dbPath `
            -LaunchAgent $script:mockLaunch

        $result.Success | Should -BeTrue
    }
}

# =============================================================================
# SCENARIO 2 — Bus Event Append + Commit Ordering
# =============================================================================

Describe 'E2E-S2: Bus Event Append + Commit Ordering' {
    BeforeEach {
        script:Reset-BusCounters
        $script:dbPath = script:New-E2ETestDatabase
    }

    AfterEach {
        script:Remove-E2ETestDatabase -DbPath $script:dbPath
    }

    It 'E2E-S2-T1: evt_ids are strictly increasing across 5 appended events' {
        $ids = @()
        for ($i = 1; $i -le 5; $i++) {
            $id = Send-BusEvent -Event @{ EventType = "test_event_$i"; From = 'test'; To = 'bus' } -DbPath $script:dbPath
            $ids += $id
        }

        for ($j = 1; $j -lt $ids.Count; $j++) {
            $ids[$j] | Should -BeGreaterThan $ids[$j - 1] -Because "evt_ids must be strictly increasing"
        }
    }

    It 'E2E-S2-T2: All 5 events appear in event_log' {
        for ($i = 1; $i -le 5; $i++) {
            Send-BusEvent -Event @{ EventType = "test_event_$i"; From = 'test'; To = 'bus' } -DbPath $script:dbPath | Out-Null
        }

        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT COUNT(*) as cnt FROM event_log" | Select-Object -First 1
        $row.cnt | Should -BeGreaterOrEqual 5
    }

    It 'E2E-S2-T3: Events in DB are in insertion order by evt_id' {
        for ($i = 1; $i -le 5; $i++) {
            Send-BusEvent -Event @{ EventType = "ordered_event"; Seq = $i; From = 'test'; To = 'bus' } -DbPath $script:dbPath | Out-Null
        }

        $rows = @(Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT evt_id FROM event_log ORDER BY id ASC")
        $evtIds = $rows | ForEach-Object { $_.evt_id }

        # Verify strictly ascending order
        for ($j = 1; $j -lt $evtIds.Count; $j++) {
            $evtIds[$j] | Should -BeGreaterThan $evtIds[$j - 1] -Because "DB insertion order must match evt_id order"
        }
    }
}

# =============================================================================
# SCENARIO 3 — Agent Lifecycle: Start → Heartbeat → Stop
# =============================================================================

Describe 'E2E-S3: Agent Lifecycle — Start, Heartbeat, Stop' {
    BeforeEach {
        script:Reset-BusCounters
        $script:dbPath = script:New-E2ETestDatabase
    }

    AfterEach {
        script:Remove-E2ETestDatabase -DbPath $script:dbPath
    }

    It 'E2E-S3-T1: Start-BusAgent creates entry in agent_sessions with status=active' {
        Start-BusAgent -AgentId 'agent-alpha' -Role 'writer' -DbPath $script:dbPath | Out-Null
        Start-BusAgent -AgentId 'agent-beta'  -Role 'reviewer' -DbPath $script:dbPath | Out-Null

        $rows = @(Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT agent_id, status FROM agent_sessions WHERE status='active'")
        $rows.Count | Should -BeGreaterOrEqual 2
        ($rows | Where-Object { $_.agent_id -eq 'agent-alpha' }) | Should -Not -BeNullOrEmpty
        ($rows | Where-Object { $_.agent_id -eq 'agent-beta'  }) | Should -Not -BeNullOrEmpty
    }

    It 'E2E-S3-T2: Invoke-EmitHeartbeat updates heartbeat state' {
        Start-BusAgent -AgentId 'agent-alpha' -Role 'writer' -DbPath $script:dbPath | Out-Null

        $result = Invoke-EmitHeartbeat -AgentId 'agent-alpha' -DbPath $script:dbPath

        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT value FROM rollback_state WHERE key='heartbeat_agent-alpha'" | Select-Object -First 1
        $row | Should -Not -BeNullOrEmpty
        $result.LastTickAt | Should -Not -BeNullOrEmpty
    }

    It 'E2E-S3-T3: Stop-BusAgent marks the session as ended' {
        Start-BusAgent -AgentId 'agent-alpha' -Role 'writer' -DbPath $script:dbPath | Out-Null

        Stop-BusAgent -AgentId 'agent-alpha' -DbPath $script:dbPath

        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT status FROM agent_sessions WHERE agent_id='agent-alpha'" | Select-Object -First 1
        $row.status | Should -BeExactly 'ended'
    }

    It 'E2E-S3-T4: Stop-AllBusAgents marks all active sessions as ended' {
        Start-BusAgent -AgentId 'agent-gamma' -Role 'writer'   -DbPath $script:dbPath | Out-Null
        Start-BusAgent -AgentId 'agent-delta' -Role 'reviewer' -DbPath $script:dbPath | Out-Null

        Stop-AllBusAgents -DbPath $script:dbPath

        $activeRows = @(Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT COUNT(*) as cnt FROM agent_sessions WHERE status='active'" | Select-Object -First 1)
        $activeRows[0].cnt | Should -Be 0
    }
}

# =============================================================================
# SCENARIO 4 — Halt-Once Guard
# =============================================================================

Describe 'E2E-S4: Halt-Once Guard' {
    BeforeEach {
        script:Reset-BusCounters
        $script:dbPath = script:New-E2ETestDatabase
    }

    AfterEach {
        script:Remove-E2ETestDatabase -DbPath $script:dbPath
        Reset-BusLifecycleLatch
    }

    It 'E2E-S4-T1: First halt sets BusStatus=halted in the DB' {
        Invoke-Halt-UserInterrupt -DbPath $script:dbPath | Out-Null

        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='BusStatus'" | Select-Object -First 1
        $row.value | Should -BeExactly 'halted'
    }

    It 'E2E-S4-T2: Halt latch prevents second halt from overwriting halt_reason' {
        Invoke-Halt-UserInterrupt -DbPath $script:dbPath | Out-Null

        # Attempt second halt with a different reason using BusHalt directly
        $secondResult = Invoke-BusHalt -HaltReason 'a_different_reason' -DbPath $script:dbPath

        $secondResult.NoOp | Should -BeTrue -Because "latch must prevent double-halt"
        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='halt_reason'" | Select-Object -First 1
        $row.value | Should -BeExactly 'user_interrupt' -Because "halt_reason must not be overwritten"
    }

    It 'E2E-S4-T3: halt_reason is set to user_interrupt after Invoke-Halt-UserInterrupt' {
        Invoke-Halt-UserInterrupt -DbPath $script:dbPath | Out-Null

        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='halt_reason'" | Select-Object -First 1
        $row.value | Should -BeExactly 'user_interrupt'
    }
}

# =============================================================================
# SCENARIO 5 — Rollback Rehearsal Integration
# =============================================================================

Describe 'E2E-S5: Rollback Rehearsal Integration' {
    BeforeEach {
        script:Reset-BusCounters
        $script:dbPath      = Join-Path $env:TEMP "bus-e2e-rehearsal-$([guid]::NewGuid().ToString('N')).db"
        $script:snapshotDir = Join-Path $env:TEMP "bus-e2e-snapshots-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:snapshotDir -Force | Out-Null
    }

    AfterEach {
        script:Remove-E2ETestDatabase -DbPath $script:dbPath
        if (Test-Path $script:snapshotDir) {
            Remove-Item $script:snapshotDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    It 'E2E-S5-T1: Invoke-RollbackRehearsal returns Success=$true' {
        $result = Invoke-RollbackRehearsal -DbPath $script:dbPath -SnapshotDir $script:snapshotDir -Quiet

        $result.Success | Should -BeTrue
    }

    It 'E2E-S5-T2: All 10 events are restored after rollback' {
        Invoke-RollbackRehearsal -DbPath $script:dbPath -SnapshotDir $script:snapshotDir -Quiet | Out-Null

        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT COUNT(*) as cnt FROM event_log" | Select-Object -First 1
        $row.cnt | Should -Be 10
    }

    It 'E2E-S5-T3: BusStatus=halted after rollback' {
        Invoke-RollbackRehearsal -DbPath $script:dbPath -SnapshotDir $script:snapshotDir -Quiet | Out-Null

        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='BusStatus'" | Select-Object -First 1
        $row.value | Should -BeExactly 'halted'
    }

    It 'E2E-S5-T4: halt_reason=user_rollback after rollback' {
        Invoke-RollbackRehearsal -DbPath $script:dbPath -SnapshotDir $script:snapshotDir -Quiet | Out-Null

        $row = Invoke-SqliteQuery -DataSource $script:dbPath -Query "SELECT value FROM bus_lifecycle_state WHERE key='halt_reason'" | Select-Object -First 1
        $row.value | Should -BeExactly 'user_rollback'
    }
}

# =============================================================================
# SCENARIO 6 — Feature Flag Coverage: All Stages
# =============================================================================

Describe 'E2E-S6: Feature Flag Coverage — All Stages' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_STAGE2     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_STAGE3     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_STAGE5     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_STAGE6     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        $env:VIBE_BUS_ALL_STAGES = '1'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'E2E-S6-T1: Test-BusFeatureEnabled returns $true for all stages when ALL_STAGES=1' {
        $stages = @('Stage2', 'Stage3', 'Stage4', 'Stage5', 'Stage6', 'Stage7')
        foreach ($stage in $stages) {
            $result = Test-BusFeatureEnabled -StageName $stage
            $result | Should -BeTrue -Because "VIBE_BUS_ALL_STAGES=1 must enable $stage"
        }
    }

    It 'E2E-S6-T2: Bus-migrated stage files do not contain direct Invoke-Claude calls (migration complete)' {
        # Only check stages that have been migrated to the bus (stages 2, 3, 4, 6).
        # Stages 1, 5, 7 are not yet bus-migrated in this branch.
        $stagesDir   = Resolve-Path "$PSScriptRoot/../../../stages"
        $busStages   = @('2-parallel-writers.ps1', '3-unified-debate.ps1', '4-post-debate.ps1', '6-implementation-debate.ps1')

        $violations = @()
        foreach ($stageName in $busStages) {
            $filePath = Join-Path $stagesDir $stageName
            if (-not (Test-Path $filePath)) { continue }
            $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
            # Check for direct bare Invoke-Claude call (not wrapped/mocked)
            if ($content -match '(?m)^\s*Invoke-Claude\b') {
                $violations += $stageName
            }
        }

        $violations | Should -BeNullOrEmpty -Because "bus-migrated stages (2,3,4,6) must not call Invoke-Claude directly"
    }

    It 'E2E-S6-T3: cascade-order.md contains a Stage 2 section' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw

        $content | Should -Match '##\s+Stage 2'
    }

    It 'E2E-S6-T4: cascade-order.md contains a Stage 7 section' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw

        $content | Should -Match '##\s+Stage 7'
    }

    It 'E2E-S6-T5: cascade-order.md has sections for all 6 stages (2–7)' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw

        foreach ($stageNum in 2..7) {
            $content | Should -Match "##\s+Stage $stageNum" -Because "cascade-order.md must document Stage $stageNum"
        }
    }
}

# =============================================================================
# FINAL COMPLETENESS ASSERTIONS
# =============================================================================

Describe 'E2E-FINAL: Bus Infrastructure Completeness Assertions' {
    It 'E2E-FINAL-T1: bus/feature-flags.psd1 can be imported as a data file' {
        $root = Resolve-Path "$PSScriptRoot/../../.."
        $psd1Path = Join-Path $root 'bus/feature-flags.psd1'

        Test-Path $psd1Path | Should -BeTrue -Because "bus/feature-flags.psd1 must exist"

        $data = Import-PowerShellDataFile -Path $psd1Path
        $data | Should -Not -BeNullOrEmpty -Because "feature-flags.psd1 must be parseable"
        $data.ContainsKey('Stage2') | Should -BeTrue
        $data.ContainsKey('Stage7') | Should -BeTrue
    }

    It 'E2E-FINAL-T2: tests/contracts/snapshots/claude-output.snapshot.json exists' {
        $root     = Resolve-Path "$PSScriptRoot/../../.."
        $snapshot = Join-Path $root 'tests/contracts/snapshots/claude-output.snapshot.json'

        Test-Path $snapshot | Should -BeTrue -Because "claude-output.snapshot.json must exist for contract testing"
    }

    It 'E2E-FINAL-T3: tests/contracts/snapshots/git-output.snapshot.json exists' {
        $root     = Resolve-Path "$PSScriptRoot/../../.."
        $snapshot = Join-Path $root 'tests/contracts/snapshots/git-output.snapshot.json'

        Test-Path $snapshot | Should -BeTrue -Because "git-output.snapshot.json must exist for contract testing"
    }

    It 'E2E-FINAL-T4: .github/workflows/vibe-cli.yml exists' {
        # PSScriptRoot = tests/bus/e2e  ->  ../../.. = packages/vibe-cli  ->  ../.. = worktree root
        $pkgRoot      = Resolve-Path "$PSScriptRoot/../../.."
        $worktreeRoot = Resolve-Path "$pkgRoot/../.."
        $wfPath       = Join-Path $worktreeRoot '.github/workflows/vibe-cli.yml'

        Test-Path $wfPath | Should -BeTrue -Because "vibe-cli.yml CI workflow must exist"
    }

    It 'E2E-FINAL-T5: bus/ops/rollback-rehearsal.ps1 exists' {
        $root     = Resolve-Path "$PSScriptRoot/../../.."
        $rehearsal = Join-Path $root 'bus/ops/rollback-rehearsal.ps1'

        Test-Path $rehearsal | Should -BeTrue -Because "rollback-rehearsal.ps1 must exist (T31b deliverable)"
    }
}
