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

    # Utilities needed by stage 6
    . "$root/utils/pipeline-log.ps1"
    . "$root/utils/resolve-pipeline-state.ps1"

    # Stage under test
    . "$root/stages/6-implementation-debate.ps1"
}

# ---------------------------------------------------------------------------
# T1: Test-BusFeatureEnabled 'Stage6' returns false when VIBE_BUS_STAGE6 not set
# ---------------------------------------------------------------------------
Describe 'T1: Test-BusFeatureEnabled Stage6 returns false when not set' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE6     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE6     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns false when VIBE_BUS_STAGE6 is not set' {
        $result = Test-BusFeatureEnabled -StageName 'Stage6'
        $result | Should -BeFalse
    }
}

# ---------------------------------------------------------------------------
# T2: Test-BusFeatureEnabled 'Stage6' returns true when VIBE_BUS_STAGE6=1
# ---------------------------------------------------------------------------
Describe 'T2: Test-BusFeatureEnabled Stage6 returns true when VIBE_BUS_STAGE6=1' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE6 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE6     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns true when VIBE_BUS_STAGE6=1' {
        $result = Test-BusFeatureEnabled -StageName 'Stage6'
        $result | Should -BeTrue
    }
}

# ---------------------------------------------------------------------------
# T3: Test-BusFeatureEnabled 'Stage6' returns true when VIBE_BUS_ALL_STAGES=1
# ---------------------------------------------------------------------------
Describe 'T3: Test-BusFeatureEnabled Stage6 returns true when VIBE_BUS_ALL_STAGES=1' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE6     -ErrorAction SilentlyContinue
        $env:VIBE_BUS_ALL_STAGES = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE6     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns true when VIBE_BUS_ALL_STAGES=1' {
        $result = Test-BusFeatureEnabled -StageName 'Stage6'
        $result | Should -BeTrue
    }
}

# ---------------------------------------------------------------------------
# T5: Bus path calls Start-BusAgent for impl-debate-mod
# ---------------------------------------------------------------------------
Describe 'T5: Bus path calls Start-BusAgent for impl-debate-mod' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE6 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s6-t5-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        $script:implFile = Join-Path $script:featureDir 'implementation-plan.md'
        $script:implJson = Join-Path $script:featureDir 'implementation-plan.json'
        $script:tlaFile  = Join-Path $script:featureDir 'spec.tla'
        Set-Content -Path $script:tlaFile -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE6     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Start-BusAgent with impl-debate-mod agent id' {
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-ImplementationDebateStage `
            -ImplFile $script:implFile `
            -ImplJson $script:implJson `
            -TlaFile $script:tlaFile `
            -FeatureDir $script:featureDir `
            -Root $script:testRoot `
            -DbPath $dbPath

        Should -Invoke Start-BusAgent -ParameterFilter { $AgentId -match 'impl-debate-mod' } -Times 1
    }
}

# ---------------------------------------------------------------------------
# T6: Bus path creates BusGroup with ExpectedCount=1
# ---------------------------------------------------------------------------
Describe 'T6: Bus path creates BusGroup with ExpectedCount=1' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE6 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s6-t6-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        $script:implFile = Join-Path $script:featureDir 'implementation-plan.md'
        $script:implJson = Join-Path $script:featureDir 'implementation-plan.json'
        $script:tlaFile  = Join-Path $script:featureDir 'spec.tla'
        Set-Content -Path $script:tlaFile -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE6     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls New-BusGroup with ExpectedCount=1' {
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-ImplementationDebateStage `
            -ImplFile $script:implFile `
            -ImplJson $script:implJson `
            -TlaFile $script:tlaFile `
            -FeatureDir $script:featureDir `
            -Root $script:testRoot `
            -DbPath $dbPath

        Should -Invoke New-BusGroup -ParameterFilter { $ExpectedCount -eq 1 } -Times 1
    }
}

# ---------------------------------------------------------------------------
# T7: Bus path calls Wait-BusGroup with TimeoutMs=900000
# ---------------------------------------------------------------------------
Describe 'T7: Bus path calls Wait-BusGroup with TimeoutMs=900000' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE6 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s6-t7-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        $script:implFile = Join-Path $script:featureDir 'implementation-plan.md'
        $script:implJson = Join-Path $script:featureDir 'implementation-plan.json'
        $script:tlaFile  = Join-Path $script:featureDir 'spec.tla'
        Set-Content -Path $script:tlaFile -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE6     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Wait-BusGroup with TimeoutMs=900000' {
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-ImplementationDebateStage `
            -ImplFile $script:implFile `
            -ImplJson $script:implJson `
            -TlaFile $script:tlaFile `
            -FeatureDir $script:featureDir `
            -Root $script:testRoot `
            -DbPath $dbPath

        Should -Invoke Wait-BusGroup -ParameterFilter { $TimeoutMs -eq 900000 } -Times 1
    }
}

# ---------------------------------------------------------------------------
# T8: Bus path emits stage_started event
# ---------------------------------------------------------------------------
Describe 'T8: Bus path emits stage_started event' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE6 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s6-t8-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        $script:implFile = Join-Path $script:featureDir 'implementation-plan.md'
        $script:implJson = Join-Path $script:featureDir 'implementation-plan.json'
        $script:tlaFile  = Join-Path $script:featureDir 'spec.tla'
        Set-Content -Path $script:tlaFile -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE6     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'emits stage_started event via Send-BusEvent' {
        $script:_capturedEventsT8 = [System.Collections.Generic.List[hashtable]]::new()
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_capturedEventsT8.Add($Event)
        }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-ImplementationDebateStage `
            -ImplFile $script:implFile `
            -ImplJson $script:implJson `
            -TlaFile $script:tlaFile `
            -FeatureDir $script:featureDir `
            -Root $script:testRoot `
            -DbPath $dbPath

        $startedEvents = $script:_capturedEventsT8 | Where-Object { $_.EventType -eq 'stage_started' }
        $startedEvents | Should -Not -BeNullOrEmpty
    }
}

# ---------------------------------------------------------------------------
# T9: Bus path emits stage_completed event
# ---------------------------------------------------------------------------
Describe 'T9: Bus path emits stage_completed event' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE6 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s6-t9-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        $script:implFile = Join-Path $script:featureDir 'implementation-plan.md'
        $script:implJson = Join-Path $script:featureDir 'implementation-plan.json'
        $script:tlaFile  = Join-Path $script:featureDir 'spec.tla'
        Set-Content -Path $script:tlaFile -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE6     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'emits stage_completed event via Send-BusEvent' {
        $script:_capturedEventsT9 = [System.Collections.Generic.List[hashtable]]::new()
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_capturedEventsT9.Add($Event)
        }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-ImplementationDebateStage `
            -ImplFile $script:implFile `
            -ImplJson $script:implJson `
            -TlaFile $script:tlaFile `
            -FeatureDir $script:featureDir `
            -Root $script:testRoot `
            -DbPath $dbPath

        $completedEvents = $script:_capturedEventsT9 | Where-Object { $_.EventType -eq 'stage_completed' }
        $completedEvents | Should -Not -BeNullOrEmpty
    }
}

# ---------------------------------------------------------------------------
# T10: Bus path returns Success=true
# ---------------------------------------------------------------------------
Describe 'T10: Bus path returns Success=true' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE6 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s6-t10-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        $script:implFile = Join-Path $script:featureDir 'implementation-plan.md'
        $script:implJson = Join-Path $script:featureDir 'implementation-plan.json'
        $script:tlaFile  = Join-Path $script:featureDir 'spec.tla'
        Set-Content -Path $script:tlaFile -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE6     -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns Success=true from bus path' {
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        $result = Invoke-ImplementationDebateStage `
            -ImplFile $script:implFile `
            -ImplJson $script:implJson `
            -TlaFile $script:tlaFile `
            -FeatureDir $script:featureDir `
            -Root $script:testRoot `
            -DbPath $dbPath

        $result.Success | Should -BeTrue
    }
}

# ---------------------------------------------------------------------------
# T13: Send-StageStarted with StageNum=6 invokes Send-BusEvent
# ---------------------------------------------------------------------------
Describe 'T13: Send-StageStarted with StageNum=6 invokes Send-BusEvent' {
    BeforeEach {
        Reset-StageDomainState
    }

    It 'calls Send-BusEvent with EventType stage_started and StageNum=6' {
        $script:_t13Calls = [System.Collections.Generic.List[hashtable]]::new()
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_t13Calls.Add($Event)
        }

        Send-StageStarted -StageNum 6 -FeatureName 'test-feature'

        Should -Invoke Send-BusEvent -Times 1
        $script:_t13Calls[0].EventType | Should -Be 'stage_started'
        $script:_t13Calls[0].StageNum  | Should -Be 6
    }
}

# ---------------------------------------------------------------------------
# T14: Send-StageCompleted with StageNum=6 invokes Send-BusEvent
# ---------------------------------------------------------------------------
Describe 'T14: Send-StageCompleted with StageNum=6 invokes Send-BusEvent' {
    BeforeEach {
        Reset-StageDomainState
    }

    It 'calls Send-BusEvent with EventType stage_completed and StageNum=6' {
        $script:_t14Calls = [System.Collections.Generic.List[hashtable]]::new()
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_t14Calls.Add($Event)
        }

        Send-StageCompleted -StageNum 6 -FeatureName 'test-feature'

        Should -Invoke Send-BusEvent -Times 1
        $script:_t14Calls[0].EventType | Should -Be 'stage_completed'
        $script:_t14Calls[0].StageNum  | Should -Be 6
    }
}

# ---------------------------------------------------------------------------
# T15: cascade-order.md contains Stage 6 section with consensus events
# ---------------------------------------------------------------------------
Describe 'T15: cascade-order.md contains Stage 6 section with consensus events' {
    It 'cascade-order.md exists' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        Test-Path $cascadePath | Should -BeTrue
    }

    It 'cascade-order.md contains Stage 6 heading' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        $content | Should -Match 'Stage 6'
    }

    It 'cascade-order.md contains consensus_candidate for Stage 6' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        $content | Should -Match 'consensus_candidate'
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
# T16: vibe.ps1 contains VIBE_BUS_STAGE6 in bus infrastructure condition
# ---------------------------------------------------------------------------
Describe 'T16: vibe.ps1 contains VIBE_BUS_STAGE6 in bus infrastructure condition' {
    It 'vibe.ps1 checks VIBE_BUS_STAGE6 for bus infrastructure loading' {
        $vibePath = Resolve-Path "$PSScriptRoot/../../../vibe.ps1"
        $content = Get-Content $vibePath -Raw
        $content | Should -Match 'VIBE_BUS_STAGE6'
    }

    It 'vibe.ps1 passes -DbPath to Invoke-ImplementationDebateStage' {
        $vibePath = Resolve-Path "$PSScriptRoot/../../../vibe.ps1"
        $content = Get-Content $vibePath -Raw
        $content | Should -Match 'Invoke-ImplementationDebateStage.*DbPath'
    }
}
