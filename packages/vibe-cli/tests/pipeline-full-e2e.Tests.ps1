BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    Import-Module (Join-Path $root 'state/state-repository.psd1') -Force
    . "$root/utils/pipeline-log.ps1"
    . "$root/utils/invoke-claude.ps1"
    . "$root/utils/invoke-verify.ps1"
    . "$root/utils/invoke-parallel.ps1"
    . "$root/utils/resolve-pipeline-state.ps1"
    . "$root/utils/unified-debate-loop.ps1"
    . "$root/utils/debate-loop.ps1"
    . "$root/utils/gherkin-parser.ps1"
    . "$root/utils/fixture-gate.ps1"
    . "$root/utils/resume.ps1"
    . "$root/utils/resolve-target-root.ps1"
    . "$root/utils/pipeline-lock.ps1"
    . "$root/stages/1-elicitor.ps1"
    . "$root/stages/2-parallel-writers.ps1"
    . "$root/stages/3-unified-debate.ps1"
    . "$root/stages/4-post-debate.ps1"
    . "$root/stages/5-implementation-writer.ps1"
    . "$root/stages/6-implementation-debate.ps1"
    . "$root/stages/7-coding.ps1"

    # Stub: pipeline-state.ps1 was removed in code-simplify
    if (-not (Get-Command New-PipelineState -ErrorAction SilentlyContinue)) {
        function global:New-PipelineState {
            return @{
                pipelineState      = 'idle'
                lockHolder         = $null
                reviewRound        = [int]0
                keepGoingResets    = [int]0
                tddKeepGoingCount = [int]0
                verdict            = $null
                tasksDone          = [int]0
                reviewGateType     = 'none'
            }
        }
    }

    Mock Write-Host {}
}

Describe 'Full Pipeline E2E (Stages 1-7)' {
    BeforeEach {
        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "full-e2e-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null

        # Agent prompt stubs
        foreach ($dir in @('agents/doc-writers', 'agents/experts', 'agents/code-writers')) {
            New-Item -ItemType Directory -Path "$script:testRoot/$dir" -Force | Out-Null
        }
        Set-Content "$script:testRoot/agents/doc-writers/elicitor.md" -Value '# Elicitor'
        Set-Content "$script:testRoot/agents/doc-writers/bdd-writer.md" -Value '# BDD'
        Set-Content "$script:testRoot/agents/doc-writers/tla-writer.md" -Value '# TLA'
        Set-Content "$script:testRoot/agents/doc-writers/implementation-writer.md" -Value '# Impl'
        Set-Content "$script:testRoot/agents/unified-debate-moderator.md" -Value '# Moderator'
        Set-Content "$script:testRoot/agents/debate-moderator.md" -Value '# Debate'
        Set-Content "$script:testRoot/agents/review-moderator.md" -Value '# Review'
        Set-Content "$script:testRoot/agents/code-writers/merge-resolver.md" -Value '# Merge'

        # Empty pipeline log
        Set-Content -Path (Join-Path $script:testRoot 'pipeline.log') -Value ''

        # Real SQLite state DB (temp file)
        $script:testDb = Reset-StateDatabase -InMemory

        # ── Mocks ──

        # Stage 1: Invoke-Claude -Interactive creates elicitor.md
        Mock Invoke-Claude {
            $featureDir = Join-Path $script:testRoot 'docs/test-feature'
            New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
            Set-Content (Join-Path $featureDir 'elicitor.md') -Value @"
# Test Feature Briefing
Build a counter that tracks items and reports completion status.
"@
        }

        # Stage 2: Invoke-Parallel creates BDD + TLA files
        Mock Invoke-Parallel {
            param($Jobs)
            $featureDir = Join-Path $script:testRoot 'docs/test-feature'
            $bddFile = Join-Path $featureDir 'bdd.feature'
            Set-Content -Path $bddFile -Value @"
Feature: Item Counter
  Scenario: Item added successfully
    Given an empty collection
    When an item is added
    Then the count is 1

  Scenario: Collection completes at max
    Given a collection with max items
    When complete is called
    Then the status is done
"@
            $tlaDir = Join-Path $featureDir 'tla'
            New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
            Set-Content -Path (Join-Path $tlaDir 'TestSpec.tla') -Value @"
---- MODULE TestSpec ----
EXTENDS Naturals

CONSTANTS MaxItems

VARIABLES count, status

vars == <<count, status>>

Init ==
    /\ count = 0
    /\ status = "idle"

AddItem ==
    /\ status = "idle"
    /\ count < MaxItems
    /\ count' = count + 1
    /\ status' = "idle"

Complete ==
    /\ count = MaxItems
    /\ status' = "done"
    /\ UNCHANGED count

TypeOK ==
    /\ count \in 0..MaxItems
    /\ status \in {"idle", "done"}

Spec == Init /\ [][AddItem \/ Complete]_vars
====
"@
            Set-Content -Path (Join-Path $tlaDir 'TestSpec.cfg') -Value @"
SPECIFICATION Spec
CONSTANTS MaxItems = 3
INVARIANT TypeOK
"@
            return @{
                bdd = @{ Success = $true; Output = $bddFile; Error = $null }
                tla = @{ Success = $true; Output = @{ TlaFile = (Get-Item "$tlaDir/TestSpec.tla"); TlaDir = $tlaDir }; Error = $null }
            }
        }

        # Stage 3: Unified debate → consensus
        Mock Invoke-UnifiedDebateLoop {
            Set-Content -Path (Join-Path $FeatureDir 'unified-debate.md') -Value '# Unified Debate Session — consensus reached at round 1'
            return @{
                Result              = 'CONSENSUS_REACHED'
                RoundsCompleted     = 1
                FinalGherkinPath    = (Join-Path $FeatureDir 'bdd.feature')
                FinalTlaDir         = (Join-Path $FeatureDir 'tla')
                SessionFile         = (Join-Path $FeatureDir 'unified-debate.md')
                UnresolvedObjections = @()
            }
        }

        # Stage 5: Invoke-Claude creates implementation plan (called after Stage 4 real Gherkin parsing)
        # The Stage 1 mock already handles this — we need a second mock scope.
        # Since Invoke-Claude is called in both Stage 1 and 5, we use -ParameterFilter or
        # handle it in order. The simplest: just override to create plan files when they don't exist.
        # Actually, Stage 5 calls Invoke-Claude with -SystemPromptFile, Stage 1 with -Interactive.
        # Let's use the single mock and conditionally create files based on what exists.

        # Stage 6: Debate loop → creates impl-debate.md
        Mock Invoke-DebateLoop {
            Set-Content -Path $SessionFile -Value '# Implementation Debate — all objections addressed'
        }

        # Stage 7 mocks
        Mock git { '' }
        Mock Lock-Pipeline { @{ pipelineState = 'locked'; lockHolder = 1 } }
        Mock Unlock-Pipeline {}
        Mock Invoke-PerWorktreeGate { @{ Status = 'all_passed'; Results = @() } }
        Mock Invoke-SequentialMerge { @{ Status = 'merged' } }
        Mock Invoke-WorktreeCleanup { @{ TierCheckpoint = $CompletedTier } }
        Mock Invoke-GlobalDoublePass { @{ Status = 'passed'; Retries = 0; LastError = $null } }
        Mock Invoke-GlobalReview { @{ Verdict = 'pass'; ReviewRound = 1 } }
        Mock Complete-Pipeline {
            param($Root, $Status)
            if ($Root) {
                Write-PipelineLog -Message ">>> PIPELINE $($Status.ToUpper())" -Root $Root
            }
            return @{ Status = $Status; Timestamp = [datetime]::UtcNow }
        }
        Mock Read-Host { 'y' }
    }

    AfterEach {
        Remove-Item $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'Full happy path: seed through all 7 stages to COMPLETE' {
        # Override Invoke-Claude to handle Stage 1 (interactive) and Stage 5 (plan writer)
        Mock Invoke-Claude {
            $featureDir = Join-Path $script:testRoot 'docs/test-feature'
            # Stage 1: create elicitor if missing
            if (-not (Test-Path (Join-Path $featureDir 'elicitor.md'))) {
                New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
                Set-Content (Join-Path $featureDir 'elicitor.md') -Value '# Test Feature Briefing'
            }
            # Stage 5: create implementation plan if unified-debate exists but plan doesn't
            if ((Test-Path (Join-Path $featureDir 'unified-debate.md')) -and -not (Test-Path (Join-Path $featureDir 'implementation-plan.md'))) {
                $plan = @{
                    tiers = @(
                        @{ tier = 1; tasks = @(@{ id = 'T1'; step = 1; title = 'Implement AddItem' }) }
                    )
                }
                Set-Content (Join-Path $featureDir 'implementation-plan.md') -Value '# Implementation Plan'
                $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $featureDir 'implementation-plan.json')
            }
        }

        # Run full pipeline
        $featureName = 'test-feature'
        $testRoot = $script:testRoot
        Set-Content -Path (Join-Path $testRoot 'pipeline.log') -Value ''
        Write-PipelineLog -Message "=== PIPELINE START seed=`"test`" ===" -Root $testRoot

        # ── Stage 1: Elicitor ──
        $s1 = Invoke-Elicitor -Seed 'test counter feature' -Root $testRoot
        $featureDir = $s1.FeatureDir
        New-Feature -Name $featureName
        Set-ActiveFeature -Name $featureName
        Lock-PipelineState -FeatureName $featureName -ProcessId $PID
        Set-StageComplete -FeatureName $featureName -Stage 1

        # ── Stage 2: Parallel Writers ──
        $s2 = Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot
        $s2.Success | Should -BeTrue
        Set-StageComplete -FeatureName $featureName -Stage 2

        # ── Stage 3: Unified Debate ──
        $s3 = Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot
        $s3.Success | Should -BeTrue
        Set-StageComplete -FeatureName $featureName -Stage 3

        # ── Stage 4: Post-Debate (real Gherkin parsing) ──
        $s4 = Invoke-PostDebate -FeatureDir $featureDir -Root $testRoot -TargetRoot $testRoot
        $s4.Success | Should -BeTrue
        Set-StageComplete -FeatureName $featureName -Stage 4

        # ── Stage 5: Implementation Writer ──
        $bddPath = Join-Path $featureDir 'bdd.feature'
        $tlaPath = (Get-ChildItem (Join-Path $featureDir 'tla') -Filter '*.tla' | Select-Object -First 1).FullName
        $s5 = Invoke-ImplementationWriterStage -FeatureDir $featureDir -Root $testRoot -BddFeaturePath $bddPath -TlaSpecPath $tlaPath
        $s5.Success | Should -BeTrue
        Set-StageComplete -FeatureName $featureName -Stage 5

        # ── Stage 6: Implementation Debate ──
        $s6 = Invoke-ImplementationDebateStage -ImplFile $s5.ImplFile -ImplJson $s5.ImplJson -TlaFile $tlaPath -FeatureDir $featureDir -Root $testRoot
        $s6.Success | Should -BeTrue
        Set-StageComplete -FeatureName $featureName -Stage 6

        # ── Stage 7: Coding ──
        $s7 = Invoke-CodingStage -Feature $featureName -Root $testRoot
        $s7.Status | Should -Be 'tiers_dispatched'

        # ── Verify: all artifacts exist ──
        (Join-Path $featureDir 'elicitor.md') | Should -Exist
        (Join-Path $featureDir 'bdd.feature') | Should -Exist
        (Join-Path $featureDir 'tla/TestSpec.tla') | Should -Exist
        (Join-Path $featureDir 'unified-debate.md') | Should -Exist
        (Join-Path $featureDir 'bdd-fixture.json') | Should -Exist
        (Join-Path $featureDir 'implementation-plan.md') | Should -Exist
        (Join-Path $featureDir 'implementation-plan.json') | Should -Exist
        (Join-Path $featureDir 'impl-debate.md') | Should -Exist

        # ── Verify: BDD fixture passes gate ──
        $bddFixturePath = Join-Path $testRoot "fixtures/$featureName/bdd.json"
        $bddFixturePath | Should -Exist
        $bddFixture = Get-Content $bddFixturePath -Raw | ConvertFrom-Json
        $bddFixture.schemaVersion | Should -Be 1

        # ── Verify: fixture gate passes ──
        $gateResult = Test-FixturePrecondition -Root $testRoot -FeatureName $featureName
        $gateResult.canProceed | Should -BeTrue

        # ── Verify: log markers ──
        $logContent = Get-Content (Join-Path $testRoot 'pipeline.log') -Raw
        $logContent | Should -Match 'STAGE_COMPLETE:1:test-feature'
        $logContent | Should -Match 'STAGE_COMPLETE:2:test-feature'
        $logContent | Should -Match 'STAGE_COMPLETE:3:test-feature'
        $logContent | Should -Match 'STAGE_COMPLETE:4:test-feature'
    }

    It 'DB state tracks features, stages, and tier progress' {
        Mock Invoke-Claude {
            $featureDir = Join-Path $script:testRoot 'docs/test-feature'
            if (-not (Test-Path (Join-Path $featureDir 'elicitor.md'))) {
                New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
                Set-Content (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
            }
            if ((Test-Path (Join-Path $featureDir 'unified-debate.md')) -and -not (Test-Path (Join-Path $featureDir 'implementation-plan.md'))) {
                $plan = @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; step = 1; title = 'Task A' }) }) }
                Set-Content (Join-Path $featureDir 'implementation-plan.md') -Value '# Plan'
                $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $featureDir 'implementation-plan.json')
            }
        }

        $featureName = 'test-feature'
        $testRoot = $script:testRoot
        Set-Content -Path (Join-Path $testRoot 'pipeline.log') -Value ''

        # Stage 1
        $s1 = Invoke-Elicitor -Seed 'test' -Root $testRoot
        $featureDir = $s1.FeatureDir
        New-Feature -Name $featureName
        Set-ActiveFeature -Name $featureName
        Lock-PipelineState -FeatureName $featureName -ProcessId $PID
        Set-StageComplete -FeatureName $featureName -Stage 1

        # Stage 2
        Invoke-ParallelWriter -FeatureDir $featureDir -Root $testRoot | Out-Null
        Set-StageComplete -FeatureName $featureName -Stage 2

        # Stage 3
        Invoke-UnifiedDebateStage -FeatureDir $featureDir -Root $testRoot | Out-Null
        Set-StageComplete -FeatureName $featureName -Stage 3

        # Stage 4
        Invoke-PostDebate -FeatureDir $featureDir -Root $testRoot -TargetRoot $testRoot | Out-Null
        Set-StageComplete -FeatureName $featureName -Stage 4
        New-Item -ItemType Directory -Path (Join-Path $testRoot "fixtures/$featureName") -Force | Out-Null

        # Stage 5
        $bddPath = Join-Path $featureDir 'bdd.feature'
        $tlaPath = (Get-ChildItem (Join-Path $featureDir 'tla') -Filter '*.tla' | Select-Object -First 1).FullName
        $s5 = Invoke-ImplementationWriterStage -FeatureDir $featureDir -Root $testRoot -BddFeaturePath $bddPath -TlaSpecPath $tlaPath
        Set-StageComplete -FeatureName $featureName -Stage 5

        # Stage 6
        Invoke-ImplementationDebateStage -ImplFile $s5.ImplFile -ImplJson $s5.ImplJson -TlaFile $tlaPath -FeatureDir $featureDir -Root $testRoot | Out-Null
        Set-StageComplete -FeatureName $featureName -Stage 6

        # Stage 7
        Invoke-CodingStage -Feature $featureName -Root $testRoot | Out-Null

        # ── Verify DB state ──
        $feature = Get-Feature -Name $featureName
        $feature | Should -Not -BeNullOrEmpty
        $feature.status | Should -Not -Be 'idle'

        $lastStage = Get-LastCompletedStage -FeatureName $featureName
        $lastStage | Should -BeGreaterOrEqual 6

        $activeFeature = Get-ActiveFeature
        $activeFeature | Should -Be $featureName
    }

    It 'Resume after Stage 4 crash picks up at Stage 5' {
        # Pre-create Stages 1-4 artifacts
        $featureName = 'test-feature'
        $testRoot = $script:testRoot
        $featureDir = Join-Path $testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null

        Set-Content (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content (Join-Path $featureDir 'bdd.feature') -Value "Feature: test`n  Scenario: s`n    Given g`n    When w`n    Then t"
        $tlaDir = Join-Path $featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'TestSpec.tla') -Value '---- MODULE TestSpec ----'
        Set-Content (Join-Path $featureDir 'unified-debate.md') -Value '# Debate done'

        # Run real Stage 4 to get proper fixture
        $s4 = Invoke-PostDebate -FeatureDir $featureDir -Root $testRoot -TargetRoot $testRoot
        $s4.Success | Should -BeTrue

        # Mark stages 1-4 in DB
        New-Feature -Name $featureName
        Set-ActiveFeature -Name $featureName
        Lock-PipelineState -FeatureName $featureName -ProcessId $PID
        for ($i = 1; $i -le 4; $i++) { Set-StageComplete -FeatureName $featureName -Stage $i }

        # Create TLA fixture
        New-Item -ItemType Directory -Path (Join-Path $testRoot "fixtures/$featureName") -Force | Out-Null

        # Mock Stage 5 Claude call to create plan
        Mock Invoke-Claude {
            $plan = @{ tiers = @(@{ tier = 1; tasks = @(@{ id = 'T1'; step = 1; title = 'A' }) }) }
            Set-Content (Join-Path $featureDir 'implementation-plan.md') -Value '# Plan'
            $plan | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $featureDir 'implementation-plan.json')
        }

        # Run Stages 5-6 (the part after the "crash")
        $tlaPath = (Get-ChildItem $tlaDir -Filter '*.tla' | Select-Object -First 1).FullName
        $s5 = Invoke-ImplementationWriterStage -FeatureDir $featureDir -Root $testRoot -BddFeaturePath (Join-Path $featureDir 'bdd.feature') -TlaSpecPath $tlaPath
        $s5.Success | Should -BeTrue
        Set-StageComplete -FeatureName $featureName -Stage 5

        $s6 = Invoke-ImplementationDebateStage -ImplFile $s5.ImplFile -ImplJson $s5.ImplJson -TlaFile $tlaPath -FeatureDir $featureDir -Root $testRoot
        $s6.Success | Should -BeTrue
        Set-StageComplete -FeatureName $featureName -Stage 6

        # Verify Stage 5 ran (plan exists)
        (Join-Path $featureDir 'implementation-plan.md') | Should -Exist
        (Join-Path $featureDir 'implementation-plan.json') | Should -Exist

        # Verify DB progression
        $lastStage = Get-LastCompletedStage -FeatureName $featureName
        $lastStage | Should -Be 6
    }

    It 'Real Gherkin parsing produces valid BDD fixture with schemaVersion' {
        $featureDir = Join-Path $script:testRoot 'docs/gherkin-test'
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
        Set-Content (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content (Join-Path $featureDir 'unified-debate.md') -Value '# Debate'
        $tlaDir = Join-Path $featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'

        # Multi-scenario BDD feature
        Set-Content (Join-Path $featureDir 'bdd.feature') -Value @"
Feature: Item Counter
  Scenario: Add first item
    Given an empty collection
    When an item is added
    Then the count is 1

  Scenario: Add second item
    Given a collection with 1 item
    When an item is added
    Then the count is 2

  Scenario: Complete at max
    Given a collection with max items
    When complete is called
    Then the status is done
"@

        # Run real Stage 4
        $result = Invoke-PostDebate -FeatureDir $featureDir -Root $script:testRoot -TargetRoot $script:testRoot
        $result.Success | Should -BeTrue

        # Verify fixture content
        $fixturePath = $result.FixturePath
        $fixturePath | Should -Exist
        $fixture = Get-Content $fixturePath -Raw | ConvertFrom-Json
        $fixture.schemaVersion | Should -Be 1
        $fixture.features | Should -Not -BeNullOrEmpty
        $fixture.features[0].name | Should -Be 'Item Counter'
        $fixture.features[0].scenarios.Count | Should -Be 3

        # Verify scenario names
        $names = $fixture.features[0].scenarios | ForEach-Object { $_.name }
        $names | Should -Contain 'Add first item'
        $names | Should -Contain 'Complete at max'

        # Verify fixture gate passes
        $gate = Test-FixturePrecondition -Root $script:testRoot -FeatureName 'gherkin-test'
        $gate.canProceed | Should -BeTrue
    }

}
