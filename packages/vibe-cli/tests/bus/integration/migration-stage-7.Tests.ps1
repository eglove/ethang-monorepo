BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/../../.."

    # Bus infrastructure
    . "$root/bus/router/send-bus-event.ps1"
    . "$root/bus/router/agent-lifecycle.ps1"
    . "$root/bus/router/wait-bus-group.ps1"
    . "$root/bus/schema/open-bus-database.ps1"

    # Feature flag infra
    . "$root/bus/infra/stage-feature-flag.ps1"

    # Stage domain
    . "$root/bus/domain/stage.ps1"

    # Utilities needed by stage 7 (pipeline-log is lightweight)
    . "$root/utils/pipeline-log.ps1"

    # Stage under test — dot-source first so utility files are loaded
    . "$root/stages/7-coding.ps1"

    # Redefine stubs AFTER dot-source so they win over the real implementations
    # loaded transitively by 7-coding.ps1 (invoke-claude.ps1, pipeline-lock.ps1, etc.)
    function Lock-Pipeline { param($LockDir,$Feature,[switch]$Resume,$MutexName,$MutexTimeoutMs) return @{ pipelineState = 'locked'; lockHolder = 1 } }
    function Unlock-Pipeline { param($LockDir) }
    function New-PipelineState {
        [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
        param()
        return @{
            pipelineState      = 'idle'
            lockHolder         = $null
            reviewRound        = [int]0
            keepGoingResets    = [int]0
            tddKeepGoingCount  = [int]0
            verdict            = $null
            tasksDone          = [int]0
            reviewGateType     = 'none'
        }
    }
    function Invoke-Claude { param([string]$Role, [string]$Prompt, [string]$AddDir) return @{ Output = 'ok' } }
    function Invoke-PerWorktreeGate { param($WorktreePaths,$FeatureDir,$Root,$Feature) return @{ Status = 'passed' } }
    function Invoke-SequentialMerge { param($WorktreeBranches,$FeatureBranch,$Root,$Feature) return @{ Status = 'merged' } }
    function Invoke-WorktreeCleanup { param($WorktreePaths,$Root,$CompletedTier) }
    function Invoke-GlobalDoublePass { param($Root,$Feature) return @{ Status = 'passed'; Retries = 0 } }
    function Invoke-GlobalReview { param($Root,$FeatureDir,$BaseBranch) return @{ Verdict = 'approved'; ReviewRound = 1 } }
    function Complete-Pipeline { param($Root,$Status) }
    function Get-AllTierProgress { param($FeatureName) return @() }
    function Get-PipelineLockState { param($FeatureName) return $null }
    function Lock-PipelineState { param($FeatureName,$ProcessId) }
    function Unlock-PipelineState { param($FeatureName) }
    function Update-PipelineState { param($FeatureName,$PipelineState,$FeatureStatus,$LockHolder) }
    function Set-GateResult { param($FeatureName,$GateType,$Status) }
    function Set-MergeResult { param($FeatureName,$TaskId,$Status) }
    function Set-TierStatus { param($FeatureName,$Tier,$Status) }
    function Invoke-SqliteQuery { param($DataSource,$Query,$SqlParameters) }

    # Helper: create a minimal temp environment with plan + fixture
    function script:New-S7TestRoot {
        param([string]$Tag)
        $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s7-$Tag-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null

        $docsDir = Join-Path $tempRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null

        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @('task-a') }
            )
        } | ConvertTo-Json -Depth 10
        Set-Content -Path (Join-Path $docsDir 'implementation-plan.json') -Value $plan

        $fixturesDir = Join-Path $tempRoot 'fixtures/test-feature'
        New-Item -ItemType Directory -Path $fixturesDir -Force | Out-Null
        Set-Content -Path (Join-Path $fixturesDir 'bdd.json') -Value '[]'

        return $tempRoot
    }

    # Smart git mock: routes subcommands to sensible defaults
    # branch --list returns '' (no existing feature branch)
    # rev-parse returns 'main' (current branch is not feature branch)
    # status --porcelain returns '' (clean tree)
    # checkout -b returns '' (success)
    # worktree list returns single line (no worktrees, just main)
    function script:Invoke-SmartGitMock {
        param([string]$TestRoot)
        $wtMain = "$TestRoot  abc1234 [main]"
        Mock git {
            $argStr = ($args -join ' ')
            if ($argStr -match 'branch\s+--list') { return '' }
            if ($argStr -match 'rev-parse') { return 'main' }
            if ($argStr -match 'status\s+--porcelain') { return '' }
            if ($argStr -match 'checkout') { return '' }
            if ($argStr -match 'worktree\s+list') { return $script:_mockWtLine }
            return ''
        }
    }
}

# ---------------------------------------------------------------------------
# T1: Test-BusFeatureEnabled 'Stage7' returns false when not set
# ---------------------------------------------------------------------------
Describe 'T1: Test-BusFeatureEnabled Stage7 returns false when not set' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns false when VIBE_BUS_STAGE7 is not set' {
        $result = Test-BusFeatureEnabled -StageName 'Stage7'
        $result | Should -BeFalse
    }
}

# ---------------------------------------------------------------------------
# T2: Test-BusFeatureEnabled 'Stage7' returns true when VIBE_BUS_STAGE7=1
# ---------------------------------------------------------------------------
Describe 'T2: Test-BusFeatureEnabled Stage7 returns true when VIBE_BUS_STAGE7=1' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE7 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns true when VIBE_BUS_STAGE7=1' {
        $result = Test-BusFeatureEnabled -StageName 'Stage7'
        $result | Should -BeTrue
    }
}

# ---------------------------------------------------------------------------
# T3: Test-BusFeatureEnabled 'Stage7' returns true when VIBE_BUS_ALL_STAGES=1
# ---------------------------------------------------------------------------
Describe 'T3: Test-BusFeatureEnabled Stage7 returns true when VIBE_BUS_ALL_STAGES=1' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        $env:VIBE_BUS_ALL_STAGES = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns true when VIBE_BUS_ALL_STAGES=1' {
        $result = Test-BusFeatureEnabled -StageName 'Stage7'
        $result | Should -BeTrue
    }
}

# ---------------------------------------------------------------------------
# T4: $busEnabled is false when feature flag off (no bus events emitted)
# ---------------------------------------------------------------------------
Describe 'T4: busEnabled is false when feature flag off' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'emits zero bus events when VIBE_BUS_STAGE7 is not set' {
        $testRoot = New-S7TestRoot -Tag 't4'
        try {
            $script:_mockWtLine = "$testRoot  abc1234 [main]"
            Mock git {
                $argStr = ($args -join ' ')
                if ($argStr -match 'branch\s+--list') { return '' }
                if ($argStr -match 'rev-parse') { return 'main' }
                if ($argStr -match 'status\s+--porcelain') { return '' }
                if ($argStr -match 'worktree\s+list') { return $script:_mockWtLine }
                return ''
            }
            Mock Send-BusEvent { }

            $dbPath = Join-Path $testRoot 'vibe-bus.db'
            Invoke-CodingStage -Feature 'test-feature' -Root $testRoot -DbPath $dbPath

            Should -Invoke Send-BusEvent -Times 0
        }
        finally {
            Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# T5: $busEnabled is false when flag on but DbPath not provided
# ---------------------------------------------------------------------------
Describe 'T5: busEnabled is false when flag on but DbPath not provided' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE7 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'emits zero bus events when DbPath is not provided (flag on)' {
        $testRoot = New-S7TestRoot -Tag 't5'
        try {
            $script:_mockWtLine = "$testRoot  abc1234 [main]"
            Mock git {
                $argStr = ($args -join ' ')
                if ($argStr -match 'branch\s+--list') { return '' }
                if ($argStr -match 'rev-parse') { return 'main' }
                if ($argStr -match 'status\s+--porcelain') { return '' }
                if ($argStr -match 'worktree\s+list') { return $script:_mockWtLine }
                return ''
            }
            Mock Send-BusEvent { }

            # No -DbPath parameter
            Invoke-CodingStage -Feature 'test-feature' -Root $testRoot

            Should -Invoke Send-BusEvent -Times 0
        }
        finally {
            Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# T6: $busEnabled is true when flag on AND DbPath provided
# ---------------------------------------------------------------------------
Describe 'T6: busEnabled is true when flag on AND DbPath provided' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE7 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'emits at least one bus event when flag on AND DbPath provided' {
        $testRoot = New-S7TestRoot -Tag 't6'
        try {
            $script:_mockWtLine = "$testRoot  abc1234 [main]"
            Mock git {
                $argStr = ($args -join ' ')
                if ($argStr -match 'branch\s+--list') { return '' }
                if ($argStr -match 'rev-parse') { return 'main' }
                if ($argStr -match 'status\s+--porcelain') { return '' }
                if ($argStr -match 'worktree\s+list') { return $script:_mockWtLine }
                return ''
            }
            Mock Send-BusEvent { }

            $dbPath = Join-Path $testRoot 'vibe-bus.db'
            Invoke-CodingStage -Feature 'test-feature' -Root $testRoot -DbPath $dbPath

            Should -Invoke Send-BusEvent -Times 1 -Exactly:$false
        }
        finally {
            Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# T7: Send-StageStarted is called at stage entry when bus enabled
# ---------------------------------------------------------------------------
Describe 'T7: Send-StageStarted is called at stage entry when bus enabled' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE7 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'emits stage_started event via Send-BusEvent' {
        $testRoot = New-S7TestRoot -Tag 't7'
        try {
            $script:_capturedT7 = [System.Collections.Generic.List[hashtable]]::new()
            $script:_mockWtLine = "$testRoot  abc1234 [main]"
            Mock git {
                $argStr = ($args -join ' ')
                if ($argStr -match 'branch\s+--list') { return '' }
                if ($argStr -match 'rev-parse') { return 'main' }
                if ($argStr -match 'status\s+--porcelain') { return '' }
                if ($argStr -match 'worktree\s+list') { return $script:_mockWtLine }
                return ''
            }
            Mock Send-BusEvent {
                param([hashtable]$Event, [scriptblock]$DbExecutor)
                $script:_capturedT7.Add($Event)
            }

            $dbPath = Join-Path $testRoot 'vibe-bus.db'
            Invoke-CodingStage -Feature 'test-feature' -Root $testRoot -DbPath $dbPath

            $startedEvents = $script:_capturedT7 | Where-Object { $_.EventType -eq 'stage_started' }
            $startedEvents | Should -Not -BeNullOrEmpty
        }
        finally {
            Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# T8: Send-StageCompleted is called in finally block when bus enabled
# ---------------------------------------------------------------------------
Describe 'T8: Send-StageCompleted is called in finally block when bus enabled' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE7 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'emits stage_completed event via Send-BusEvent' {
        $testRoot = New-S7TestRoot -Tag 't8'
        try {
            $script:_capturedT8 = [System.Collections.Generic.List[hashtable]]::new()
            $script:_mockWtLine = "$testRoot  abc1234 [main]"
            Mock git {
                $argStr = ($args -join ' ')
                if ($argStr -match 'branch\s+--list') { return '' }
                if ($argStr -match 'rev-parse') { return 'main' }
                if ($argStr -match 'status\s+--porcelain') { return '' }
                if ($argStr -match 'worktree\s+list') { return $script:_mockWtLine }
                return ''
            }
            Mock Send-BusEvent {
                param([hashtable]$Event, [scriptblock]$DbExecutor)
                $script:_capturedT8.Add($Event)
            }

            $dbPath = Join-Path $testRoot 'vibe-bus.db'
            Invoke-CodingStage -Feature 'test-feature' -Root $testRoot -DbPath $dbPath

            $completedEvents = $script:_capturedT8 | Where-Object { $_.EventType -eq 'stage_completed' }
            $completedEvents | Should -Not -BeNullOrEmpty
        }
        finally {
            Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# T9: verify event emitted with gate=fixture_coverage when bus enabled
# ---------------------------------------------------------------------------
Describe 'T9: verify event emitted with gate=fixture_coverage when bus enabled' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE7 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'emits verify event with gate=fixture_coverage' {
        $testRoot = New-S7TestRoot -Tag 't9'
        try {
            $script:_capturedT9 = [System.Collections.Generic.List[hashtable]]::new()
            $script:_mockWtLine = "$testRoot  abc1234 [main]"
            Mock git {
                $argStr = ($args -join ' ')
                if ($argStr -match 'branch\s+--list') { return '' }
                if ($argStr -match 'rev-parse') { return 'main' }
                if ($argStr -match 'status\s+--porcelain') { return '' }
                if ($argStr -match 'worktree\s+list') { return $script:_mockWtLine }
                return ''
            }
            Mock Send-BusEvent {
                param([hashtable]$Event, [scriptblock]$DbExecutor)
                $script:_capturedT9.Add($Event)
            }

            $dbPath = Join-Path $testRoot 'vibe-bus.db'
            Invoke-CodingStage -Feature 'test-feature' -Root $testRoot -DbPath $dbPath

            $fixtureEvents = $script:_capturedT9 | Where-Object {
                $_.Type -eq 'verify' -and $_.Payload.gate -eq 'fixture_coverage'
            }
            $fixtureEvents | Should -Not -BeNullOrEmpty
        }
        finally {
            Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# T10: verify event emitted with gate=pre_coding when bus enabled
# ---------------------------------------------------------------------------
Describe 'T10: verify event emitted with gate=pre_coding when bus enabled' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE7 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'emits verify event with gate=pre_coding' {
        $testRoot = New-S7TestRoot -Tag 't10'
        try {
            $script:_capturedT10 = [System.Collections.Generic.List[hashtable]]::new()
            $script:_mockWtLine = "$testRoot  abc1234 [main]"
            Mock git {
                $argStr = ($args -join ' ')
                if ($argStr -match 'branch\s+--list') { return '' }
                if ($argStr -match 'rev-parse') { return 'main' }
                if ($argStr -match 'status\s+--porcelain') { return '' }
                if ($argStr -match 'worktree\s+list') { return $script:_mockWtLine }
                return ''
            }
            Mock Send-BusEvent {
                param([hashtable]$Event, [scriptblock]$DbExecutor)
                $script:_capturedT10.Add($Event)
            }

            $dbPath = Join-Path $testRoot 'vibe-bus.db'
            Invoke-CodingStage -Feature 'test-feature' -Root $testRoot -DbPath $dbPath

            $preCodingEvents = $script:_capturedT10 | Where-Object {
                $_.Type -eq 'verify' -and $_.Payload.gate -eq 'pre_coding'
            }
            $preCodingEvents | Should -Not -BeNullOrEmpty
        }
        finally {
            Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# T11: verify event emitted with gate=per_worktree when bus enabled
# ---------------------------------------------------------------------------
Describe 'T11: verify event emitted with gate=per_worktree when bus enabled' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE7 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'emits verify event with gate=per_worktree when worktrees detected' {
        $testRoot = New-S7TestRoot -Tag 't11'
        try {
            $script:_capturedT11 = [System.Collections.Generic.List[hashtable]]::new()
            $wtMain = "$testRoot  abc1234 [main]"
            $wtExtra = "$testRoot/wt1  def5678 [feature/wt1]"
            $script:_mockWtList11 = @($wtMain, $wtExtra)
            Mock git {
                $argStr = ($args -join ' ')
                if ($argStr -match 'branch\s+--list') { return '' }
                if ($argStr -match 'rev-parse') { return 'main' }
                if ($argStr -match 'status\s+--porcelain') { return '' }
                if ($argStr -match 'worktree\s+list') { return $script:_mockWtList11 }
                return ''
            }
            Mock Send-BusEvent {
                param([hashtable]$Event, [scriptblock]$DbExecutor)
                $script:_capturedT11.Add($Event)
            }

            $dbPath = Join-Path $testRoot 'vibe-bus.db'
            Invoke-CodingStage -Feature 'test-feature' -Root $testRoot -DbPath $dbPath

            $wtEvents = $script:_capturedT11 | Where-Object {
                $_.Type -eq 'verify' -and $_.Payload.gate -eq 'per_worktree'
            }
            $wtEvents | Should -Not -BeNullOrEmpty
        }
        finally {
            Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# T12: checkpoint event emitted with phase=post_merge when bus enabled
# ---------------------------------------------------------------------------
Describe 'T12: checkpoint event emitted with phase=post_merge when bus enabled' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE7 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'emits checkpoint event with phase=post_merge when worktrees detected and merged' {
        $testRoot = New-S7TestRoot -Tag 't12'
        try {
            $script:_capturedT12 = [System.Collections.Generic.List[hashtable]]::new()
            $wtMain = "$testRoot  abc1234 [main]"
            $wtExtra = "$testRoot/wt1  def5678 [feature/wt1]"
            $script:_mockWtList12 = @($wtMain, $wtExtra)
            Mock git {
                $argStr = ($args -join ' ')
                if ($argStr -match 'branch\s+--list') { return '' }
                if ($argStr -match 'rev-parse') { return 'main' }
                if ($argStr -match 'status\s+--porcelain') { return '' }
                if ($argStr -match 'worktree\s+list') { return $script:_mockWtList12 }
                return ''
            }
            Mock Send-BusEvent {
                param([hashtable]$Event, [scriptblock]$DbExecutor)
                $script:_capturedT12.Add($Event)
            }

            $dbPath = Join-Path $testRoot 'vibe-bus.db'
            Invoke-CodingStage -Feature 'test-feature' -Root $testRoot -DbPath $dbPath

            $mergeEvents = $script:_capturedT12 | Where-Object {
                $_.Type -eq 'checkpoint' -and $_.Payload.phase -eq 'post_merge'
            }
            $mergeEvents | Should -Not -BeNullOrEmpty
        }
        finally {
            Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# T13: verify event emitted with gate=global_doublepass when bus enabled
# ---------------------------------------------------------------------------
Describe 'T13: verify event emitted with gate=global_doublepass when bus enabled' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE7 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'emits verify event with gate=global_doublepass' {
        $testRoot = New-S7TestRoot -Tag 't13'
        try {
            $script:_capturedT13 = [System.Collections.Generic.List[hashtable]]::new()
            $script:_mockWtLine13 = "$testRoot  abc1234 [main]"
            Mock git {
                $argStr = ($args -join ' ')
                if ($argStr -match 'branch\s+--list') { return '' }
                if ($argStr -match 'rev-parse') { return 'main' }
                if ($argStr -match 'status\s+--porcelain') { return '' }
                if ($argStr -match 'worktree\s+list') { return $script:_mockWtLine13 }
                return ''
            }
            Mock Send-BusEvent {
                param([hashtable]$Event, [scriptblock]$DbExecutor)
                $script:_capturedT13.Add($Event)
            }

            $dbPath = Join-Path $testRoot 'vibe-bus.db'
            Invoke-CodingStage -Feature 'test-feature' -Root $testRoot -DbPath $dbPath

            $gdpEvents = $script:_capturedT13 | Where-Object {
                $_.Type -eq 'verify' -and $_.Payload.gate -eq 'global_doublepass'
            }
            $gdpEvents | Should -Not -BeNullOrEmpty
        }
        finally {
            Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# T14: verify event emitted with gate=global_review when bus enabled
# ---------------------------------------------------------------------------
Describe 'T14: verify event emitted with gate=global_review when bus enabled' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE7 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'emits verify event with gate=global_review' {
        $testRoot = New-S7TestRoot -Tag 't14'
        try {
            $script:_capturedT14 = [System.Collections.Generic.List[hashtable]]::new()
            $script:_mockWtLine14 = "$testRoot  abc1234 [main]"
            Mock git {
                $argStr = ($args -join ' ')
                if ($argStr -match 'branch\s+--list') { return '' }
                if ($argStr -match 'rev-parse') { return 'main' }
                if ($argStr -match 'status\s+--porcelain') { return '' }
                if ($argStr -match 'worktree\s+list') { return $script:_mockWtLine14 }
                return ''
            }
            Mock Send-BusEvent {
                param([hashtable]$Event, [scriptblock]$DbExecutor)
                $script:_capturedT14.Add($Event)
            }

            $dbPath = Join-Path $testRoot 'vibe-bus.db'
            Invoke-CodingStage -Feature 'test-feature' -Root $testRoot -DbPath $dbPath

            $grEvents = $script:_capturedT14 | Where-Object {
                $_.Type -eq 'verify' -and $_.Payload.gate -eq 'global_review'
            }
            $grEvents | Should -Not -BeNullOrEmpty
        }
        finally {
            Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# T15: cascade-order.md contains Stage 7 section
# ---------------------------------------------------------------------------
Describe 'T15: cascade-order.md contains Stage 7 section' {
    It 'cascade-order.md exists' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        Test-Path $cascadePath | Should -BeTrue
    }

    It 'cascade-order.md contains Stage 7 heading' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        $content | Should -Match 'Stage 7'
    }

    It 'cascade-order.md contains fixture_coverage gate for Stage 7' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        $content | Should -Match 'fixture_coverage'
    }

    It 'cascade-order.md contains post_merge checkpoint for Stage 7' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        $content | Should -Match 'post_merge'
    }

    It 'cascade-order.md contains global_doublepass gate for Stage 7' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        $content | Should -Match 'global_doublepass'
    }

    It 'cascade-order.md contains global_review gate for Stage 7' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        $content | Should -Match 'global_review'
    }

    It 'cascade-order.md still contains Stage 6 section' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        $content | Should -Match 'Stage 6'
    }
}

# ---------------------------------------------------------------------------
# T16: No bus events emitted when bus flag disabled (zero Send-BusEvent calls)
# ---------------------------------------------------------------------------
Describe 'T16: No bus events emitted when bus flag disabled' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE7     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'Send-BusEvent is never called when flag is disabled' {
        $testRoot = New-S7TestRoot -Tag 't16'
        try {
            $script:_mockWtLine16 = "$testRoot  abc1234 [main]"
            Mock git {
                $argStr = ($args -join ' ')
                if ($argStr -match 'branch\s+--list') { return '' }
                if ($argStr -match 'rev-parse') { return 'main' }
                if ($argStr -match 'status\s+--porcelain') { return '' }
                if ($argStr -match 'worktree\s+list') { return $script:_mockWtLine16 }
                return ''
            }
            Mock Send-BusEvent { }

            $dbPath = Join-Path $testRoot 'vibe-bus.db'
            Invoke-CodingStage -Feature 'test-feature' -Root $testRoot -DbPath $dbPath

            Should -Invoke Send-BusEvent -Times 0
        }
        finally {
            Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}
