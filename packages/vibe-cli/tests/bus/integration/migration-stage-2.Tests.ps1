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

    # Utilities needed by stage 2
    . "$root/utils/pipeline-log.ps1"
    . "$root/utils/invoke-parallel.ps1"

    # Stage under test
    . "$root/stages/2-parallel-writers.ps1"
}

Describe 'T1: Test-BusFeatureEnabled returns false when no env var set' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns false when VIBE_BUS_STAGE2 is not set' {
        $result = Test-BusFeatureEnabled -StageName 'Stage2'
        $result | Should -BeFalse
    }
}

Describe 'T2: Test-BusFeatureEnabled returns true when VIBE_BUS_STAGE2=1' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE2 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns true when VIBE_BUS_STAGE2=1' {
        $result = Test-BusFeatureEnabled -StageName 'Stage2'
        $result | Should -BeTrue
    }
}

Describe 'T3: Test-BusFeatureEnabled returns true when VIBE_BUS_ALL_STAGES=1' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        $env:VIBE_BUS_ALL_STAGES = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'returns true when VIBE_BUS_ALL_STAGES=1 regardless of per-stage flag' {
        $result = Test-BusFeatureEnabled -StageName 'Stage2'
        $result | Should -BeTrue
    }
}

Describe 'T4: Test-BusFeatureEnabled is case-insensitive for stage name' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE2 = '1'
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'accepts Stage2 (mixed case) and returns true' {
        Test-BusFeatureEnabled -StageName 'Stage2' | Should -BeTrue
    }

    It 'accepts STAGE2 (uppercase) and returns true' {
        Test-BusFeatureEnabled -StageName 'STAGE2' | Should -BeTrue
    }

    It 'accepts stage2 (lowercase) and returns true' {
        Test-BusFeatureEnabled -StageName 'stage2' | Should -BeTrue
    }
}

Describe 'T5: Invoke-ParallelWriter uses legacy path when flag disabled' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s2-t5-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'
        New-Item -ItemType Directory -Path "$script:testRoot/agents/doc-writers" -Force | Out-Null
        Set-Content -Path "$script:testRoot/agents/doc-writers/bdd-writer.md" -Value '# BDD'
        Set-Content -Path "$script:testRoot/agents/doc-writers/tla-writer.md" -Value '# TLA'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Invoke-Parallel (legacy) when bus flag is disabled' {
        Mock Invoke-Parallel {
            param($Jobs)
            $bddFile = Join-Path $script:featureDir 'bdd.feature'
            Set-Content -Path $bddFile -Value 'Feature: test'
            $tlaDir = Join-Path $script:featureDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            $tlaPath = Join-Path $tlaDir 'Spec.tla'
            Set-Content -Path $tlaPath -Value '---- MODULE Spec ----'
            return @{
                bdd = @{ Success = $true; Output = $bddFile; Error = $null }
                tla = @{ Success = $true; Output = @{ TlaFile = $tlaPath; TlaDir = $tlaDir }; Error = $null }
            }
        }

        Invoke-ParallelWriter -FeatureDir $script:featureDir -Root $script:testRoot

        Should -Invoke Invoke-Parallel -Times 1
    }
}

Describe 'T6: Invoke-ParallelWriter uses bus path when VIBE_BUS_STAGE2=1' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE2 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s2-t6-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'
        New-Item -ItemType Directory -Path "$script:testRoot/agents/doc-writers" -Force | Out-Null
        Set-Content -Path "$script:testRoot/agents/doc-writers/bdd-writer.md" -Value '# BDD'
        Set-Content -Path "$script:testRoot/agents/doc-writers/tla-writer.md" -Value '# TLA'

        $script:launchCalls = [System.Collections.Generic.List[hashtable]]::new()
        $script:launchAgent = {
            param([string]$AgentId, [string]$Role)
            $script:launchCalls.Add(@{ AgentId = $AgentId; Role = $Role })
        }

        $script:dbCalls = [System.Collections.Generic.List[hashtable]]::new()
        $script:dbExec = {
            param([string]$Query, [hashtable]$Params)
            $script:dbCalls.Add(@{ Query = $Query; Params = $Params })
            return @()
        }
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'does NOT call Invoke-Parallel (legacy) when bus flag is enabled' {
        Mock Invoke-Parallel { throw "Legacy path should not be called in bus mode" }
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $bddFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content -Path $bddFile -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'

        Invoke-ParallelWriter -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        Should -Invoke Invoke-Parallel -Times 0
    }
}

Describe 'T7: Bus path calls Start-BusAgent for bdd writer' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE2 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s2-t7-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'

        $bddFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content -Path $bddFile -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Start-BusAgent with bdd agent id' {
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-ParallelWriter -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        Should -Invoke Start-BusAgent -ParameterFilter { $AgentId -match 'bdd' } -Times 1
    }
}

Describe 'T8: Bus path calls Start-BusAgent for tla writer' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE2 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s2-t8-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'

        $bddFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content -Path $bddFile -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Start-BusAgent with tla agent id' {
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-ParallelWriter -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        Should -Invoke Start-BusAgent -ParameterFilter { $AgentId -match 'tla' } -Times 1
    }
}

Describe 'T9: Bus path creates BusGroup with ExpectedCount=2' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE2 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s2-t9-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'

        $bddFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content -Path $bddFile -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls New-BusGroup with ExpectedCount=2' {
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-ParallelWriter -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        Should -Invoke New-BusGroup -ParameterFilter { $ExpectedCount -eq 2 } -Times 1
    }
}

Describe 'T10: Bus path calls Wait-BusGroup' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE2 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s2-t10-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'

        $bddFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content -Path $bddFile -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
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
        Invoke-ParallelWriter -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        Should -Invoke Wait-BusGroup -Times 1
    }
}

Describe 'T11: Bus path emits stage_started event' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE2 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s2-t11-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'

        $bddFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content -Path $bddFile -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'emits stage_started event via Send-BusEvent' {
        $script:_capturedEvents = [System.Collections.Generic.List[hashtable]]::new()
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_capturedEvents.Add($Event)
        }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-ParallelWriter -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        $startedEvents = $script:_capturedEvents | Where-Object { $_.EventType -eq 'stage_started' }
        $startedEvents | Should -Not -BeNullOrEmpty
    }
}

Describe 'T12: Bus path emits stage_completed event' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE2 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s2-t12-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'

        $bddFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content -Path $bddFile -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'emits stage_completed event via Send-BusEvent' {
        $script:_capturedEvents2 = [System.Collections.Generic.List[hashtable]]::new()
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_capturedEvents2.Add($Event)
        }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        Invoke-ParallelWriter -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        $completedEvents = $script:_capturedEvents2 | Where-Object { $_.EventType -eq 'stage_completed' }
        $completedEvents | Should -Not -BeNullOrEmpty
    }
}

Describe 'T13: Bus path returns Success=true on group completion' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE2 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s2-t13-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'

        $bddFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content -Path $bddFile -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
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
        $result = Invoke-ParallelWriter -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        $result.Success | Should -BeTrue
    }
}

Describe 'T14: Bus path returns same result shape as legacy path' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE2 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s2-t14-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'

        $bddFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content -Path $bddFile -Value 'Feature: test'
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'result has Success, GherkinFile, TlaFile, TlaDir keys' {
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        $result = Invoke-ParallelWriter -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        $result.ContainsKey('Success')     | Should -BeTrue
        $result.ContainsKey('GherkinFile') | Should -BeTrue
        $result.ContainsKey('TlaFile')     | Should -BeTrue
        $result.ContainsKey('TlaDir')      | Should -BeTrue
    }
}

Describe 'T14b: Bus path returns null GherkinFile when bdd.feature absent' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        $env:VIBE_BUS_STAGE2 = '1'

        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s2-t14b-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null
        $script:featureDir = Join-Path $script:testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
        Set-Content -Path (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'
        # No bdd.feature — leave it absent to test null path
        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        # No .tla file — leave absent to test null tla path
    }

    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'GherkinFile is null when bdd.feature does not exist' {
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        $result = Invoke-ParallelWriter -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        $result.GherkinFile | Should -BeNullOrEmpty
    }

    It 'TlaFile is null when no .tla file exists in tla dir' {
        Mock Open-BusDatabase { }
        Mock New-BusGroup { return @{ GroupId = $GroupId } }
        Mock Send-BusGroupEvent { }
        Mock Wait-BusGroup { return @{ Status = 'completed' } }
        Mock Start-BusAgent { }
        Mock Send-BusEvent { }

        $dbPath = Join-Path $script:testRoot 'vibe-bus.db'
        $result = Invoke-ParallelWriter -FeatureDir $script:featureDir -Root $script:testRoot -DbPath $dbPath

        $result.TlaFile | Should -BeNullOrEmpty
    }
}

Describe 'T15: Send-StageStarted calls Send-BusEvent with correct event type' {
    BeforeEach {
        Reset-StageDomainState
    }

    It 'calls Send-BusEvent with EventType stage_started' {
        $script:_t15Calls = [System.Collections.Generic.List[hashtable]]::new()
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_t15Calls.Add($Event)
        }

        Send-StageStarted -StageNum 2 -FeatureName 'test-feature'

        Should -Invoke Send-BusEvent -Times 1
        $script:_t15Calls[0].EventType | Should -Be 'stage_started'
    }
}

Describe 'T16: Send-StageCompleted calls Send-BusEvent with correct event type' {
    BeforeEach {
        Reset-StageDomainState
    }

    It 'calls Send-BusEvent with EventType stage_completed' {
        $script:_t16Calls = [System.Collections.Generic.List[hashtable]]::new()
        Mock Send-BusEvent {
            param([hashtable]$Event, [scriptblock]$DbExecutor)
            $script:_t16Calls.Add($Event)
        }

        Send-StageCompleted -StageNum 2 -FeatureName 'test-feature'

        Should -Invoke Send-BusEvent -Times 1
        $script:_t16Calls[0].EventType | Should -Be 'stage_completed'
    }
}

Describe 'T17: Reset-StageDomainState clears accumulated state' {
    It 'accumulated events list is empty after reset' {
        Mock Send-BusEvent { }
        Send-StageStarted -StageNum 2 -FeatureName 'some-feature'
        Send-StageCompleted -StageNum 2 -FeatureName 'some-feature'

        Reset-StageDomainState

        # Access internal state — confirm it is cleared by calling again and checking Send-BusEvent was not called before reset
        $script:_StageDomainAccumulatedEvents.Count | Should -Be 0
    }
}

Describe 'T18: New-StageAgentHandlerMap returns non-null hashtable for valid stage num' {
    It 'returns a hashtable for stage 2' {
        $map = New-StageAgentHandlerMap -StageNum 2
        $map | Should -Not -BeNullOrEmpty
        $map | Should -BeOfType ([hashtable])
    }

    It 'includes StageNum key' {
        $map = New-StageAgentHandlerMap -StageNum 2
        $map.StageNum | Should -Be 2
    }

    It 'throws for unknown stage number' {
        { New-StageAgentHandlerMap -StageNum 99 } | Should -Throw '*Unknown stage*'
    }
}
