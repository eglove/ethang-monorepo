BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/../../.."

    # Stubs first (provide NOT IMPLEMENTED defaults that get overridden)
    . "$root/bus/router/send-bus-event.ps1"
    . "$root/bus/router/agent-lifecycle.ps1"
    . "$root/bus/router/wait-bus-group.ps1"
    . "$root/bus/schema/open-bus-database.ps1"

    # Feature flag infra
    . "$root/bus/infra/stage-feature-flag.ps1"

    # Stage domain
    . "$root/bus/domain/stage.ps1"

    # Utilities needed by stage 4
    . "$root/utils/pipeline-log.ps1"
    . "$root/utils/resolve-pipeline-state.ps1"
    . "$root/utils/gherkin-parser.ps1"
    . "$root/utils/fixture-gate.ps1"

    # Stage under test
    . "$root/stages/4-post-debate.ps1"
}

# ---------------------------------------------------------------------------
# T1: Test-BusFeatureEnabled 'Stage4' returns false when VIBE_BUS_STAGE4 not set
# ---------------------------------------------------------------------------
Describe 'T1: Test-BusFeatureEnabled Stage4 returns false when not set' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns false when VIBE_BUS_STAGE4 is not set' {
        $result = Test-BusFeatureEnabled -StageName 'Stage4'
        $result | Should -BeFalse
    }
}

# ---------------------------------------------------------------------------
# T2: Test-BusFeatureEnabled 'Stage4' returns true when VIBE_BUS_STAGE4=1
# ---------------------------------------------------------------------------
Describe 'T2: Test-BusFeatureEnabled Stage4 returns true when VIBE_BUS_STAGE4=1' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE4 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns true when VIBE_BUS_STAGE4=1' {
        $result = Test-BusFeatureEnabled -StageName 'Stage4'
        $result | Should -BeTrue
    }
}

# ---------------------------------------------------------------------------
# T3: Test-BusFeatureEnabled 'Stage4' returns true when VIBE_BUS_ALL_STAGES=1
# ---------------------------------------------------------------------------
Describe 'T3: Test-BusFeatureEnabled Stage4 returns true when VIBE_BUS_ALL_STAGES=1' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        $env:VIBE_BUS_ALL_STAGES = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns true when VIBE_BUS_ALL_STAGES=1' {
        $result = Test-BusFeatureEnabled -StageName 'Stage4'
        $result | Should -BeTrue
    }
}

# ---------------------------------------------------------------------------
# T4: Invoke-PostDebate uses legacy path when flag disabled
# ---------------------------------------------------------------------------
Describe 'T4: Invoke-PostDebate uses legacy path when flag disabled' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s4-t4-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls ConvertFrom-Gherkin (legacy) when bus flag disabled' {
        Mock Resolve-PipelineState { return @{} }
        Mock ConvertFrom-Gherkin { return @{ features = @() } }
        Mock Export-BddFixture { }
        Mock Get-FixtureDir { return (Join-Path $script:testRoot 'fixtures/test-feature') }

        Invoke-PostDebate -FeatureDir $script:featureDir -Root $script:testRoot -TargetRoot $script:testRoot

        Should -Invoke ConvertFrom-Gherkin -Times 1
    }
}

# ---------------------------------------------------------------------------
# T5: Bus path emits stage_started before fixture generation
# ---------------------------------------------------------------------------
Describe 'T5: Bus path emits stage_started before fixture generation' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE4 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s4-t5-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'emits stage_started event via Send-BusEvent' {
        $script:_capturedEventsT5 = [System.Collections.Generic.List[hashtable]]::new()
        Mock Resolve-PipelineState { return @{} }
        Mock ConvertFrom-Gherkin { return @{ features = @() } }
        Mock Export-BddFixture { }
        Mock Get-FixtureDir { return (Join-Path $script:testRoot 'fixtures/test-feature') }
        Mock Open-BusDatabase { }
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_capturedEventsT5.Add($Event)
        }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-PostDebate -FeatureDir $script:featureDir -Root $script:testRoot -TargetRoot $script:testRoot -DbPath $dbPath

        $startedEvents = $script:_capturedEventsT5 | Where-Object { $_.EventType -eq 'stage_started' }
        $startedEvents | Should -Not -BeNullOrEmpty
    }
}

# ---------------------------------------------------------------------------
# T6: Bus path emits stage_completed after fixture generation
# ---------------------------------------------------------------------------
Describe 'T6: Bus path emits stage_completed after fixture generation' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE4 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s4-t6-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'emits stage_completed event via Send-BusEvent' {
        $script:_capturedEventsT6 = [System.Collections.Generic.List[hashtable]]::new()
        Mock Resolve-PipelineState { return @{} }
        Mock ConvertFrom-Gherkin { return @{ features = @() } }
        Mock Export-BddFixture { }
        Mock Get-FixtureDir { return (Join-Path $script:testRoot 'fixtures/test-feature') }
        Mock Open-BusDatabase { }
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_capturedEventsT6.Add($Event)
        }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-PostDebate -FeatureDir $script:featureDir -Root $script:testRoot -TargetRoot $script:testRoot -DbPath $dbPath

        $completedEvents = $script:_capturedEventsT6 | Where-Object { $_.EventType -eq 'stage_completed' }
        $completedEvents | Should -Not -BeNullOrEmpty
    }
}

# ---------------------------------------------------------------------------
# T7: Bus path emits verify event with artifact=bdd-fixture
# ---------------------------------------------------------------------------
Describe 'T7: Bus path emits verify event with artifact=bdd-fixture' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE4 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s4-t7-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'emits verify event with artifact=bdd-fixture' {
        $script:_capturedEventsT7 = [System.Collections.Generic.List[hashtable]]::new()
        Mock Resolve-PipelineState { return @{} }
        Mock ConvertFrom-Gherkin { return @{ features = @() } }
        Mock Export-BddFixture { }
        Mock Get-FixtureDir { return (Join-Path $script:testRoot 'fixtures/test-feature') }
        Mock Open-BusDatabase { }
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_capturedEventsT7.Add($Event)
        }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-PostDebate -FeatureDir $script:featureDir -Root $script:testRoot -TargetRoot $script:testRoot -DbPath $dbPath

        $verifyEvents = @($script:_capturedEventsT7) | Where-Object { $_.EventType -eq 'verify' }
        $verifyEvents | Should -Not -BeNullOrEmpty
        (@($verifyEvents))[0].Payload.artifact | Should -Be 'bdd-fixture'
    }
}

# ---------------------------------------------------------------------------
# T8: Bus path returns same Success=true shape as legacy path
# ---------------------------------------------------------------------------
Describe 'T8: Bus path returns same Success=true shape as legacy path' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE4 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s4-t8-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns Success=true from bus path' {
        Mock Resolve-PipelineState { return @{} }
        Mock ConvertFrom-Gherkin { return @{ features = @() } }
        Mock Export-BddFixture { }
        Mock Get-FixtureDir { return (Join-Path $script:testRoot 'fixtures/test-feature') }
        Mock Open-BusDatabase { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        $result = Invoke-PostDebate -FeatureDir $script:featureDir -Root $script:testRoot -TargetRoot $script:testRoot -DbPath $dbPath

        $result.Success | Should -BeTrue
    }
}

# ---------------------------------------------------------------------------
# T9: Bus path returns FixturePath in result
# ---------------------------------------------------------------------------
Describe 'T9: Bus path returns FixturePath in result' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE4 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s4-t9-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'result contains FixturePath key' {
        Mock Resolve-PipelineState { return @{} }
        Mock ConvertFrom-Gherkin { return @{ features = @() } }
        Mock Export-BddFixture { }
        Mock Get-FixtureDir { return (Join-Path $script:testRoot 'fixtures/test-feature') }
        Mock Open-BusDatabase { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        $result = Invoke-PostDebate -FeatureDir $script:featureDir -Root $script:testRoot -TargetRoot $script:testRoot -DbPath $dbPath

        $result.ContainsKey('FixturePath') | Should -BeTrue
        $result.FixturePath | Should -Not -BeNullOrEmpty
    }
}

# ---------------------------------------------------------------------------
# T10: Legacy path is used when flag on but DbPath not provided
# ---------------------------------------------------------------------------
Describe 'T10: Legacy path used when flag on but DbPath not provided' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE4 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s4-t10-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls ConvertFrom-Gherkin (legacy) when DbPath not provided' {
        Mock Resolve-PipelineState { return @{} }
        Mock ConvertFrom-Gherkin { return @{ features = @() } }
        Mock Export-BddFixture { }
        Mock Get-FixtureDir { return (Join-Path $script:testRoot 'fixtures/test-feature') }

        # No -DbPath parameter
        Invoke-PostDebate -FeatureDir $script:featureDir -Root $script:testRoot -TargetRoot $script:testRoot

        Should -Invoke ConvertFrom-Gherkin -Times 1
    }
}

# ---------------------------------------------------------------------------
# T11: Bus path does NOT call Start-BusAgent (no agents in Stage 4)
# ---------------------------------------------------------------------------
Describe 'T11: Bus path does NOT call Start-BusAgent' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE4 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s4-t11-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'does not call Start-BusAgent in bus path' {
        Mock Resolve-PipelineState { return @{} }
        Mock ConvertFrom-Gherkin { return @{ features = @() } }
        Mock Export-BddFixture { }
        Mock Get-FixtureDir { return (Join-Path $script:testRoot 'fixtures/test-feature') }
        Mock Open-BusDatabase { }
        Mock Send-BusEvent { }
        Mock Start-BusAgent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-PostDebate -FeatureDir $script:featureDir -Root $script:testRoot -TargetRoot $script:testRoot -DbPath $dbPath

        Should -Invoke Start-BusAgent -Times 0
    }
}

# ---------------------------------------------------------------------------
# T12: Bus path does NOT call New-BusGroup (no group needed in Stage 4)
# ---------------------------------------------------------------------------
Describe 'T12: Bus path does NOT call New-BusGroup' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE4 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s4-t12-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'does not call New-BusGroup in bus path' {
        Mock Resolve-PipelineState { return @{} }
        Mock ConvertFrom-Gherkin { return @{ features = @() } }
        Mock Export-BddFixture { }
        Mock Get-FixtureDir { return (Join-Path $script:testRoot 'fixtures/test-feature') }
        Mock Open-BusDatabase { }
        Mock Send-BusEvent { }
        Mock New-BusGroup { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-PostDebate -FeatureDir $script:featureDir -Root $script:testRoot -TargetRoot $script:testRoot -DbPath $dbPath

        Should -Invoke New-BusGroup -Times 0
    }
}

# ---------------------------------------------------------------------------
# T13: Send-StageStarted with StageNum=4 calls Send-BusEvent
# ---------------------------------------------------------------------------
Describe 'T13: Send-StageStarted with StageNum=4 calls Send-BusEvent' {
    BeforeEach {
        Reset-StageDomainState
    }

    It 'calls Send-BusEvent with EventType stage_started and StageNum=4' {
        $script:_t13Calls = [System.Collections.Generic.List[hashtable]]::new()
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_t13Calls.Add($Event)
        }

        Send-StageStarted -StageNum 4 -FeatureName 'test-feature'

        Should -Invoke Send-BusEvent -Times 1
        $script:_t13Calls[0].EventType | Should -Be 'stage_started'
        $script:_t13Calls[0].StageNum  | Should -Be 4
    }
}

# ---------------------------------------------------------------------------
# T14: Send-StageCompleted with StageNum=4 calls Send-BusEvent
# ---------------------------------------------------------------------------
Describe 'T14: Send-StageCompleted with StageNum=4 calls Send-BusEvent' {
    BeforeEach {
        Reset-StageDomainState
    }

    It 'calls Send-BusEvent with EventType stage_completed and StageNum=4' {
        $script:_t14Calls = [System.Collections.Generic.List[hashtable]]::new()
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_t14Calls.Add($Event)
        }

        Send-StageCompleted -StageNum 4 -FeatureName 'test-feature'

        Should -Invoke Send-BusEvent -Times 1
        $script:_t14Calls[0].EventType | Should -Be 'stage_completed'
        $script:_t14Calls[0].StageNum  | Should -Be 4
    }
}

# ---------------------------------------------------------------------------
# T15: cascade-order.md contains Stage 4 section with 'synchronous' note
# ---------------------------------------------------------------------------
Describe 'T15: cascade-order.md contains Stage 4 section with synchronous note' {
    It 'cascade-order.md exists' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        Test-Path $cascadePath | Should -BeTrue
    }

    It 'cascade-order.md contains Stage 4 heading' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        $content | Should -Match 'Stage 4'
    }

    It 'cascade-order.md contains synchronous note for Stage 4' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        $content | Should -Match 'synchronous'
    }

    It 'cascade-order.md still contains Stage 2 section' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        $content | Should -Match 'Stage 2'
    }

    It 'cascade-order.md still contains Stage 3 section' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        $content | Should -Match 'Stage 3'
    }
}

# ---------------------------------------------------------------------------
# T16: Bus path preserves existing fixture generation logic (fixture file created)
# ---------------------------------------------------------------------------
Describe 'T16: Bus path preserves existing fixture generation logic' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE4 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s4-t16-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE4     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Export-BddFixture twice (fixture dir and feature dir)' {
        Mock Resolve-PipelineState { return @{} }
        Mock ConvertFrom-Gherkin { return @{ features = @() } }
        Mock Export-BddFixture { }
        Mock Get-FixtureDir { return (Join-Path $script:testRoot 'fixtures/test-feature') }
        Mock Open-BusDatabase { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-PostDebate -FeatureDir $script:featureDir -Root $script:testRoot -TargetRoot $script:testRoot -DbPath $dbPath

        Should -Invoke Export-BddFixture -Times 2
    }

    It 'calls ConvertFrom-Gherkin once in bus path' {
        Mock Resolve-PipelineState { return @{} }
        Mock ConvertFrom-Gherkin { return @{ features = @() } }
        Mock Export-BddFixture { }
        Mock Get-FixtureDir { return (Join-Path $script:testRoot 'fixtures/test-feature') }
        Mock Open-BusDatabase { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-PostDebate -FeatureDir $script:featureDir -Root $script:testRoot -TargetRoot $script:testRoot -DbPath $dbPath

        Should -Invoke ConvertFrom-Gherkin -Times 1
    }
}
