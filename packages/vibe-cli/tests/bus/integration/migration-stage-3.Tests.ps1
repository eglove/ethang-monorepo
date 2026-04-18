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

    # Utilities needed by stage 3
    . "$root/utils/pipeline-log.ps1"
    . "$root/utils/resolve-pipeline-state.ps1"

    # unified-debate-loop stub — will be overridden by Mock in individual tests
    function Invoke-UnifiedDebateLoop {
        param(
            [string]$GherkinFile,
            [string]$TlaDir,
            [string]$FeatureDir,
            [string]$Root,
            [int]$MaxRounds = 10
        )
        return @{ Result = 'CONSENSUS_REACHED'; RoundsCompleted = 1 }
    }

    # Stage under test
    . "$root/stages/3-unified-debate.ps1"
}

# ---------------------------------------------------------------------------
# T1: Test-BusFeatureEnabled 'Stage3' returns false when VIBE_BUS_STAGE3 not set
# ---------------------------------------------------------------------------
Describe 'T1: Test-BusFeatureEnabled Stage3 returns false when not set' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns false when VIBE_BUS_STAGE3 is not set' {
        $result = Test-BusFeatureEnabled -StageName 'Stage3'
        $result | Should -BeFalse
    }
}

# ---------------------------------------------------------------------------
# T2: Test-BusFeatureEnabled 'Stage3' returns true when VIBE_BUS_STAGE3=1
# ---------------------------------------------------------------------------
Describe 'T2: Test-BusFeatureEnabled Stage3 returns true when VIBE_BUS_STAGE3=1' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE3 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns true when VIBE_BUS_STAGE3=1' {
        $result = Test-BusFeatureEnabled -StageName 'Stage3'
        $result | Should -BeTrue
    }
}

# ---------------------------------------------------------------------------
# T3: Test-BusFeatureEnabled 'Stage3' returns true when VIBE_BUS_ALL_STAGES=1
# ---------------------------------------------------------------------------
Describe 'T3: Test-BusFeatureEnabled Stage3 returns true when VIBE_BUS_ALL_STAGES=1' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        $env:VIBE_BUS_ALL_STAGES = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns true when VIBE_BUS_ALL_STAGES=1' {
        $result = Test-BusFeatureEnabled -StageName 'Stage3'
        $result | Should -BeTrue
    }
}

# ---------------------------------------------------------------------------
# T4: Invoke-UnifiedDebateStage uses legacy path when flag disabled
# ---------------------------------------------------------------------------
Describe 'T4: Invoke-UnifiedDebateStage uses legacy path when flag disabled' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s3-t4-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Invoke-UnifiedDebateLoop (legacy) when bus flag disabled' {
        Mock Invoke-UnifiedDebateLoop {
            param($GherkinFile, $TlaDir, $FeatureDir, $Root)
            return @{ Result = 'CONSENSUS_REACHED'; RoundsCompleted = 1 }
        }
        Mock Resolve-PipelineState {
            $gherkin = Join-Path $script:featureDir 'bdd.feature'
            $tlaD    = Join-Path $script:featureDir 'tla'
            return @{ GherkinFile = $gherkin; TlaDir = $tlaD }
        }

        Invoke-UnifiedDebateStage -FeatureDir $script:featureDir -Root $script:testRoot

        Should -Invoke Invoke-UnifiedDebateLoop -Times 1
    }
}

# ---------------------------------------------------------------------------
# T5: Invoke-UnifiedDebateStage uses bus path when VIBE_BUS_STAGE3=1 and DbPath provided
# ---------------------------------------------------------------------------
Describe 'T5: Invoke-UnifiedDebateStage uses bus path when VIBE_BUS_STAGE3=1 and DbPath provided' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE3 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s3-t5-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'does NOT call Invoke-UnifiedDebateLoop when bus flag enabled with DbPath' {
        Mock Invoke-UnifiedDebateLoop { throw "Legacy path should not be called in bus mode" }
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-UnifiedDebateStage -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        Should -Invoke Invoke-UnifiedDebateLoop -Times 0
    }
}

# ---------------------------------------------------------------------------
# T6: Bus path calls Start-BusAgent for moderator
# ---------------------------------------------------------------------------
Describe 'T6: Bus path calls Start-BusAgent for moderator' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE3 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s3-t6-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Start-BusAgent with unified-moderator agent id' {
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-UnifiedDebateStage -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        Should -Invoke Start-BusAgent -ParameterFilter { $AgentId -match 'unified-moderator' } -Times 1
    }
}

# ---------------------------------------------------------------------------
# T7: Bus path creates BusGroup with ExpectedCount=1
# ---------------------------------------------------------------------------
Describe 'T7: Bus path creates BusGroup with ExpectedCount=1' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE3 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s3-t7-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
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
        Invoke-UnifiedDebateStage -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        Should -Invoke New-BusGroup -ParameterFilter { $ExpectedCount -eq 1 } -Times 1
    }
}

# ---------------------------------------------------------------------------
# T8: Bus path calls Wait-BusGroup
# ---------------------------------------------------------------------------
Describe 'T8: Bus path calls Wait-BusGroup' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE3 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s3-t8-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Wait-BusGroup once' {
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-UnifiedDebateStage -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        Should -Invoke Wait-BusGroup -Times 1
    }
}

# ---------------------------------------------------------------------------
# T9: Bus path emits stage_started event
# ---------------------------------------------------------------------------
Describe 'T9: Bus path emits stage_started event' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE3 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s3-t9-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'emits stage_started event via Send-BusEvent' {
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
        Invoke-UnifiedDebateStage -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        $startedEvents = $script:_capturedEventsT9 | Where-Object { $_.EventType -eq 'stage_started' }
        $startedEvents | Should -Not -BeNullOrEmpty
    }
}

# ---------------------------------------------------------------------------
# T10: Bus path emits stage_completed event
# ---------------------------------------------------------------------------
Describe 'T10: Bus path emits stage_completed event' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE3 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s3-t10-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'emits stage_completed event via Send-BusEvent' {
        $script:_capturedEventsT10 = [System.Collections.Generic.List[hashtable]]::new()
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_capturedEventsT10.Add($Event)
        }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-UnifiedDebateStage -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        $completedEvents = $script:_capturedEventsT10 | Where-Object { $_.EventType -eq 'stage_completed' }
        $completedEvents | Should -Not -BeNullOrEmpty
    }
}

# ---------------------------------------------------------------------------
# T11: Bus path returns Success=true
# ---------------------------------------------------------------------------
Describe 'T11: Bus path returns Success=true' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE3 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s3-t11-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns Success=true when bus group completes' {
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        $result = Invoke-UnifiedDebateStage -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        $result.Success | Should -BeTrue
    }
}

# ---------------------------------------------------------------------------
# T12: Bus path returns same top-level shape (Success key) as legacy path
# ---------------------------------------------------------------------------
Describe 'T12: Bus path returns same top-level shape as legacy path' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE3 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s3-t12-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'result has Success and Result keys' {
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        $result = Invoke-UnifiedDebateStage -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        $result.ContainsKey('Success') | Should -BeTrue
        $result.ContainsKey('Result')  | Should -BeTrue
    }
}

# ---------------------------------------------------------------------------
# T13: Legacy path is invoked when flag on but DbPath not provided (graceful fallback)
# ---------------------------------------------------------------------------
Describe 'T13: Legacy path used when flag on but DbPath not provided' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE3 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s3-t13-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content -Path (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE3    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'falls back to Invoke-UnifiedDebateLoop when DbPath not provided' {
        Mock Invoke-UnifiedDebateLoop {
            param($GherkinFile, $TlaDir, $FeatureDir, $Root)
            return @{ Result = 'CONSENSUS_REACHED'; RoundsCompleted = 1 }
        }
        Mock Resolve-PipelineState {
            $gherkin = Join-Path $script:featureDir 'bdd.feature'
            $tlaD    = Join-Path $script:featureDir 'tla'
            return @{ GherkinFile = $gherkin; TlaDir = $tlaD }
        }

        # No -DbPath parameter
        Invoke-UnifiedDebateStage -FeatureDir $script:featureDir -Root $script:testRoot

        Should -Invoke Invoke-UnifiedDebateLoop -Times 1
    }
}

# ---------------------------------------------------------------------------
# T14: Send-StageStarted with StageNum=3 calls Send-BusEvent with correct event type
# ---------------------------------------------------------------------------
Describe 'T14: Send-StageStarted with StageNum=3 calls Send-BusEvent correctly' {
    BeforeEach {
        Reset-StageDomainState
    }

    It 'calls Send-BusEvent with EventType stage_started and StageNum=3' {
        $script:_t14Calls = [System.Collections.Generic.List[hashtable]]::new()
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_t14Calls.Add($Event)
        }

        Send-StageStarted -StageNum 3 -FeatureName 'test-feature'

        Should -Invoke Send-BusEvent -Times 1
        $script:_t14Calls[0].EventType | Should -Be 'stage_started'
        $script:_t14Calls[0].StageNum  | Should -Be 3
    }
}

# ---------------------------------------------------------------------------
# T15: Send-StageCompleted with StageNum=3 calls Send-BusEvent with correct event type
# ---------------------------------------------------------------------------
Describe 'T15: Send-StageCompleted with StageNum=3 calls Send-BusEvent correctly' {
    BeforeEach {
        Reset-StageDomainState
    }

    It 'calls Send-BusEvent with EventType stage_completed and StageNum=3' {
        $script:_t15Calls = [System.Collections.Generic.List[hashtable]]::new()
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_t15Calls.Add($Event)
        }

        Send-StageCompleted -StageNum 3 -FeatureName 'test-feature'

        Should -Invoke Send-BusEvent -Times 1
        $script:_t15Calls[0].EventType | Should -Be 'stage_completed'
        $script:_t15Calls[0].StageNum  | Should -Be 3
    }
}

# ---------------------------------------------------------------------------
# T16: cascade-order.md exists and contains Stage 3 section
# ---------------------------------------------------------------------------
Describe 'T16: cascade-order.md contains Stage 3 section' {
    It 'cascade-order.md exists' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        Test-Path $cascadePath | Should -BeTrue
    }

    It 'cascade-order.md contains Stage 3 heading' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        $content | Should -Match 'Stage 3'
    }

    It 'cascade-order.md contains stage_started for Stage 3' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        # Must have stage_started mentioned in the Stage 3 section
        $content | Should -Match 'stage_started'
    }

    It 'cascade-order.md still contains Stage 2 section' {
        $cascadePath = Resolve-Path "$PSScriptRoot/../../../docs/bidirectional-comms/cascade-order.md"
        $content = Get-Content $cascadePath -Raw
        $content | Should -Match 'Stage 2'
    }
}
