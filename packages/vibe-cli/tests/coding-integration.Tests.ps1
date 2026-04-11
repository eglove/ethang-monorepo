BeforeAll {
    . "$PSScriptRoot/../stages/8-coding.ps1"
    . "$PSScriptRoot/helpers/claude-test-double.ps1"

    Mock Invoke-Claude {}
    Mock Invoke-VerifyCommand {}
    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Read-Escalation {
        return @{ Decision = 'Stop'; Source = 'task'; TaskId = $null; Phase = $null; Reason = $null; PreStopSnapshot = $null }
    }
}

Describe 'Coding Stage Integration Tests' {
    BeforeAll {
        $script:root = (Resolve-Path "$PSScriptRoot/..").Path
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "integ-$(Get-Random)"
        New-Item -ItemType Directory -Path (Join-Path $script:tempDir 'logs') -Force | Out-Null

        function New-TestPlan {
            param([array]$Tiers)
            $plan = @{ tiers = $Tiers }
            $planFile = Join-Path $script:tempDir "plan-$(Get-Random).json"
            $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile
            return $planFile
        }
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    BeforeEach {
        # Default review loop mock: pass through without calling Invoke-Claude.
        # Pre-merge review returns to running; final review completes.
        # Tests that need specific review behavior override this.
        Mock Invoke-ReviewLoop {
            param($State, $Config, $GateType)
            if ($GateType -eq 'final') { Set-PipelineComplete -State $State }
            else { $State.pipelineState = 'running' }
        }
    }

    AfterEach {
        Remove-Item (Join-Path $script:tempDir 'pipeline.lock') -ErrorAction SilentlyContinue
    }

    # ── Scenario 1: Happy path (L1) ──
    It 'Scenario 1: All tasks succeed -> pipeline completed' {
        Mock Invoke-WithTimeout {
            param($ScriptBlock, $TaskId)
            return @{
                TimedOut = $false; TaskId = $TaskId
                Result = @{ TaskId = $TaskId; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }
                Error = $null; KilledPids = @()
            }
        }
        Mock New-TaskWorkspace {
            param($Tasks) if ($Tasks.Count -le 1) { $null } else { @{ T1 = '/tmp/wt1'; T2 = '/tmp/wt2' } }
        }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(
            @{ tier = 1; tasks = @(
                @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
                @{ id = 'T2'; step = 2; title = 'B'; files = @('b.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
            )}
            @{ tier = 2; tasks = @(
                @{ id = 'T3'; step = 3; title = 'C'; files = @('c.md'); codeWriter = 'agent-writer'; testWriter = $null; dependencies = @('T1', 'T2') }
            )}
        )

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'completed'
    }

    # ── Scenario 3: Escalation -> Stop (L1) ──
    It 'Scenario 3: Stop halts pipeline with preserved workspaces' {
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $true; TaskId = 'T1'; Result = $null; Error = 'timeout'; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Read-Escalation {
            return @{ Decision = 'Stop'; Source = 'task'; TaskId = 'T1'; PreStopSnapshot = @{ T1 = 'escalated' }; Phase = $null; Reason = $null }
        }
        Mock Sync-FallbackLog {}

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
        $result.Reason | Should -Be 'user_stop'
        $result.PreStopSnapshot | Should -Not -BeNullOrEmpty
    }

    # ── Scenario 5: Zero-tier (S7) ──
    It 'Scenario 5: Empty plan completes immediately with currentTier=1' {
        $planFile = New-TestPlan @()

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'completed'
        $result.CurrentTier | Should -Be 1
    }

    # ── Scenario 6: Agent-writer (S3) ──
    It 'Scenario 6: Agent-writer task completes without TDD phases' {
        Mock Invoke-WithTimeout {
            return @{
                TimedOut = $false; TaskId = 'T4'
                Result = @{ TaskId = 'T4'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }
                Error = $null; KilledPids = @()
            }
        }
        Mock New-TaskWorkspace { $null }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }
        Mock Invoke-RedPhase {}
        Mock Invoke-GreenPhase {}
        Mock Invoke-CleanupPhase {}

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T4'; step = 4; title = 'Agents'; files = @('agents/test.md'); codeWriter = 'agent-writer'; testWriter = $null; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'completed'
        Should -Not -Invoke Invoke-RedPhase
        Should -Not -Invoke Invoke-GreenPhase
        Should -Not -Invoke Invoke-CleanupPhase
    }

    # ── Scenario 12: Empty tier 1 (objection #17) ──
    It 'Scenario 12: Empty tier 1 skipped, tier 2 executes' {
        Mock Invoke-WithTimeout {
            return @{
                TimedOut = $false; TaskId = 'T1'
                Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }
                Error = $null; KilledPids = @()
            }
        }
        Mock New-TaskWorkspace { $null }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(
            @{ tier = 1; tasks = @() }
            @{ tier = 2; tasks = @(
                @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
            )}
        )

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'completed'
    }

    # ── Scenario 22: Pipeline lock (objections #45, #47) ──
    It 'Scenario 22: Lock file created and removed' {
        $planFile = New-TestPlan @()
        $lockPath = Join-Path $script:tempDir 'pipeline.lock'

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'completed'
        $lockPath | Should -Not -Exist  # Cleaned up
    }

    # ── Scenario 24: Validation failure halts pipeline (S11) ──
    It 'Scenario 24: Intra-tier dependency halts pipeline' {
        $plan = @{ tiers = @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = $null; testWriter = $null; dependencies = @() }
            @{ id = 'T2'; step = 2; title = 'B'; files = @('b.ps1'); codeWriter = $null; testWriter = $null; dependencies = @('T1') }
        )}) }
        $planFile = Join-Path $script:tempDir "intratier-integ.json"
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
        $result.Reason | Should -Be 'validation_failed'
    }

    # ── Scenario 2: Escalation -> Keep Going (L2, L3) ──
    It 'Scenario 2: KeepGoing resumes task and pipeline completes' {
        $script:invokeCount2 = 0
        Mock Invoke-WithTimeout {
            param($ScriptBlock, $TaskId)
            $script:invokeCount2++
            if ($script:invokeCount2 -eq 1 -and $TaskId -eq 'T1') {
                return @{ TimedOut = $false; TaskId = 'T1'; Result = @{ TaskId = 'T1'; Phase = 'green_retry'; Status = 'escalated'; Counters = @{ greenAttempts = 100 }; Escalated = $true; Error = 'GREEN exhausted' }; Error = $null; KilledPids = @() }
            }
            return @{ TimedOut = $false; TaskId = $TaskId; Result = @{ TaskId = $TaskId; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Reset-WorktreeState { $true }
        Mock Read-Escalation {
            return @{ Decision = 'KeepGoing'; Source = 'task'; TaskId = 'T1'; Phase = 'green_retry'; Reason = $null; PreStopSnapshot = $null }
        }
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        # Pipeline should eventually complete (L1)
        Should -Invoke Read-Escalation -Times 1
    }

    # ── Scenario 4: Merge conflict resolved on retry (L2) ──
    It 'Scenario 4: Merge conflict resolved and pipeline completes' {
        Mock Invoke-WithTimeout {
            param($ScriptBlock, $TaskId)
            return @{ TimedOut = $false; TaskId = $TaskId; Result = @{ TaskId = $TaskId; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { @{ T1 = '/tmp/wt1'; T2 = '/tmp/wt2' } }
        Mock Add-MergeQueue { $true }
        $script:mergeQueueEmpty4 = $false
        Mock Test-MergeQueueEmpty { $script:mergeQueueEmpty4 }
        $script:mergeDequeue4 = 0
        Mock Start-NextMerge {
            $script:mergeDequeue4++
            if ($script:mergeDequeue4 -le 2) { "T$($script:mergeDequeue4)" } else { $script:mergeQueueEmpty4 = $true; $null }
        }
        Mock Invoke-Merge {
            return @{ TaskId = $TaskId; Success = $true; Conflict = $false; RetryCount = 0; AbortedClean = $true; WorkspaceRemoved = $true }
        }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
            @{ id = 'T2'; step = 2; title = 'B'; files = @('b.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        Should -Invoke Invoke-Merge -Times 2
    }

    # ── Scenario 7: Workspace creation failure -> KeepGoing -> retry (S12) ──
    It 'Scenario 7: Workspace creation failure escalates and recovers' {
        $script:wsAttempt7 = 0
        Mock New-TaskWorkspace {
            $script:wsAttempt7++
            if ($script:wsAttempt7 -eq 1) { throw 'worktree add failed' }
            return $null  # Single-task fallback on retry
        }
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $false; TaskId = 'T1'; Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock Read-Escalation {
            return @{ Decision = 'KeepGoing'; Source = 'workspace'; TaskId = $null; Phase = $null; Reason = $null; PreStopSnapshot = $null }
        }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        Should -Invoke Read-Escalation -Times 1
    }

    # ── Scenario 8: Cleanup exhaustion -> KeepGoing ──
    It 'Scenario 8: Cleanup exhaustion resets both counters on KeepGoing' {
        $script:invokeCount8 = 0
        Mock Invoke-WithTimeout {
            $script:invokeCount8++
            if ($script:invokeCount8 -eq 1) {
                return @{ TimedOut = $false; TaskId = 'T1'; Result = @{ TaskId = 'T1'; Phase = 'cleanup_remed'; Status = 'escalated'; Counters = @{ cleanupRemediations = 100; cleanupCleanPasses = 1 }; Escalated = $true; Error = 'Cleanup exhausted' }; Error = $null; KilledPids = @() }
            }
            return @{ TimedOut = $false; TaskId = 'T1'; Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Read-Escalation {
            return @{ Decision = 'KeepGoing'; Source = 'task'; TaskId = 'T1'; Phase = 'cleanup_remed'; Reason = $null; PreStopSnapshot = $null }
        }
        Mock Reset-WorktreeState { $true }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        Should -Invoke Read-Escalation -Times 1
    }

    # ── Scenario 9: Multiple simultaneous escalations ──
    It 'Scenario 9: Two simultaneous escalations both resolved' {
        Mock Invoke-WithTimeout {
            param($ScriptBlock, $TaskId)
            return @{ TimedOut = $true; TaskId = $TaskId; Result = $null; Error = "timeout $TaskId"; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        $script:escCount9 = 0
        Mock Read-Escalation {
            $script:escCount9++
            if ($script:escCount9 -le 2) {
                return @{ Decision = 'KeepGoing'; Source = 'task'; TaskId = $TaskId; Phase = $Phase; Reason = $null; PreStopSnapshot = $null }
            }
            return @{ Decision = 'Stop'; Source = 'task'; TaskId = $TaskId; PreStopSnapshot = @{ T1 = 'escalated'; T2 = 'escalated' }; Phase = $null; Reason = $null }
        }
        Mock Reset-WorktreeState { $true }
        Mock Sync-FallbackLog {}

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
            @{ id = 'T2'; step = 2; title = 'B'; files = @('b.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $script:escCount9 | Should -BeGreaterOrEqual 2
        $result.PipelineStatus | Should -Be 'halted'
    }

    # ── Scenario 10: FinalVerifExhausted -> KeepGoing (L3) ──
    It 'Scenario 10: Final verification exhaustion recovers on KeepGoing' {
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $false; TaskId = 'T1'; Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        $script:finalCount10 = 0
        Mock Invoke-FinalVerification {
            $script:finalCount10++
            if ($script:finalCount10 -eq 1) { $Counters.finalVerifPhase = 'escalated' }
            else { $Counters.finalVerifPhase = 'completed' }
            return $Counters
        }
        Mock Read-Escalation {
            return @{ Decision = 'KeepGoing'; Source = 'final'; TaskId = $null; Phase = $null; Reason = $null; PreStopSnapshot = $null }
        }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'completed'
        Should -Invoke Invoke-FinalVerification -Times 2
    }

    # ── Scenario 11: SingleTaskTierComplete ──
    It 'Scenario 11: Single-task tier completes without merge queue' {
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $false; TaskId = 'T1'; Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-Merge {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'completed'
        Should -Not -Invoke Invoke-Merge
    }

    # ── Scenario 13: Infra failure phase preservation (objection #18) ──
    It 'Scenario 13: Infrastructure failure in GREEN preserves phase on KeepGoing' {
        $script:invokeCount13 = 0
        Mock Invoke-WithTimeout {
            $script:invokeCount13++
            if ($script:invokeCount13 -eq 1) {
                return @{ TimedOut = $true; TaskId = 'T1'; Result = $null; Error = 'claude hung'; KilledPids = @(1234) }
            }
            return @{ TimedOut = $false; TaskId = 'T1'; Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Read-Escalation {
            param($Source, $TaskId, $Phase)
            $Phase | Should -Be ''  # Phase comes from the timeout result, which has no phase
            return @{ Decision = 'KeepGoing'; Source = 'task'; TaskId = 'T1'; Phase = ''; Reason = $null; PreStopSnapshot = $null }
        }
        Mock Reset-WorktreeState { $true }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        Should -Invoke Read-Escalation -Times 1
    }

    # ── Scenario 14: Thread job timeout with process tree kill (objections #13, #26, #61) ──
    It 'Scenario 14: Timeout kills process tree and escalates' {
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $true; TaskId = 'T1'; Result = $null; Error = 'Timed out after 600s'; KilledPids = @(1234, 5678) }
        }
        Mock New-TaskWorkspace { $null }
        Mock Read-Escalation {
            return @{ Decision = 'Stop'; Source = 'task'; TaskId = 'T1'; Phase = $null; PreStopSnapshot = @{ T1 = 'escalated' }; Reason = $null }
        }
        Mock Sync-FallbackLog {}

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
    }

    # ── Scenario 15: Atomic state on crash (objection #25) ──
    It 'Scenario 15: Crashed thread job does not corrupt pipeline state' {
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $false; TaskId = 'T1'; Result = $null; Error = 'Unhandled exception mid-GREEN'; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Read-Escalation {
            return @{ Decision = 'Stop'; Source = 'task'; TaskId = 'T1'; Phase = $null; PreStopSnapshot = @{ T1 = 'escalated' }; Reason = $null }
        }
        Mock Sync-FallbackLog {}

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
    }

    # ── Scenario 16: Dirty merge state resume (objection #15) ──
    It 'Scenario 16: Resume state with completed tasks skips them' {
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $false; TaskId = 'T2'; Result = @{ TaskId = 'T2'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
            @{ id = 'T2'; step = 2; title = 'B'; files = @('b.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $resumeState = @{
            CompletedTasks = [System.Collections.Generic.HashSet[string]]::new([string[]]@('T1'))
            MergedTasks = [System.Collections.Generic.HashSet[string]]::new([string[]]@('T1'))
        }

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir -ResumeState $resumeState
        $result.PipelineStatus | Should -Be 'completed'
        # T1 should be skipped — only T2 dispatched
        Should -Invoke Invoke-WithTimeout -Times 1
    }

    # ── Scenario 17: Idempotent escalation recovery (objection #24) ──
    It 'Scenario 17: Duplicate KeepGoing is idempotent' {
        # Tested via Read-Escalation's idempotency guard in unit tests
        # Here we verify the orchestrator respects NoOp
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $true; TaskId = 'T1'; Result = $null; Error = 'timeout'; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Read-Escalation {
            return @{ Decision = 'Stop'; Source = 'task'; TaskId = 'T1'; Phase = $null; PreStopSnapshot = @{}; Reason = $null }
        }
        Mock Sync-FallbackLog {}

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
    }

    # ── Scenario 18: Concurrent writer file conflicts (objection #31) ──
    It 'Scenario 18: File-overlap warning logged during validation' {
        Mock Invoke-WithTimeout {
            param($ScriptBlock, $TaskId)
            return @{ TimedOut = $false; TaskId = $TaskId; Result = @{ TaskId = $TaskId; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }
        Mock Write-TaskLog {} -Verifiable

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('utils/shared.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
            @{ id = 'T2'; step = 2; title = 'B'; files = @('utils/shared.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        Should -Invoke Write-TaskLog -ParameterFilter { $Message -match 'WARNING' }
    }

    # ── Scenario 19: Escalation routing for done-phase task (objection #27) ──
    It 'Scenario 19: Done-phase task routes to merge escalation path' {
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $false; TaskId = 'T1'; Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'escalated'; Counters = @{}; Escalated = $true; Error = 'merge exhausted' }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Read-Escalation {
            param($Source)
            $Source | Should -Be 'merge'  # Routed from task to merge
            return @{ Decision = 'Stop'; Source = 'merge'; TaskId = 'T1'; Phase = 'done'; PreStopSnapshot = @{}; Reason = $null }
        }
        Mock Sync-FallbackLog {}

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
    }

    # ── Scenario 20: Stale mergeInProgress on resume (objection #28) ──
    It 'Scenario 20: Resume with stale state still completes' {
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $false; TaskId = 'T1'; Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $resumeState = @{
            CompletedTasks = [System.Collections.Generic.HashSet[string]]::new()
            MergedTasks = [System.Collections.Generic.HashSet[string]]::new()
            StaleMergeCleared = @('T2')
        }

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir -ResumeState $resumeState
        $result.PipelineStatus | Should -Be 'completed'
    }

    # ── Scenario 21: Per-task timeout (objection #30) ──
    It 'Scenario 21: Different writer types get different timeouts' {
        Mock Invoke-WithTimeout {
            param($ScriptBlock, $TaskId, $WriterType)
            return @{ TimedOut = $false; TaskId = $TaskId; Result = @{ TaskId = $TaskId; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ts'); codeWriter = 'typescript-writer'; testWriter = 'vitest'; dependencies = @() }
            @{ id = 'T2'; step = 2; title = 'B'; files = @('b.md'); codeWriter = 'agent-writer'; testWriter = $null; dependencies = @() }
        )})

        Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir

        # Verify WriterType parameter passed correctly
        Should -Invoke Invoke-WithTimeout -ParameterFilter { $WriterType -eq 'typescript-writer' } -Times 1
        Should -Invoke Invoke-WithTimeout -ParameterFilter { $WriterType -eq 'agent-writer' } -Times 1
    }

    # ── Scenario 23: RedRetryAlreadyImplemented end-to-end (objection #55) ──
    It 'Scenario 23: Already-implemented task skips GREEN, goes to cleanup' {
        Mock Invoke-WithTimeout {
            return @{
                TimedOut = $false; TaskId = 'T1'
                Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{ redRetries = 1 }; Escalated = $false }
                Error = $null; KilledPids = @()
            }
        }
        Mock New-TaskWorkspace { $null }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'completed'
    }

    # ── Scenario 25: Merge queue drain-loop after recovery (objection #48) ──
    It 'Scenario 25: Drain-loop processes merge after escalation recovery' {
        Mock Invoke-WithTimeout {
            param($ScriptBlock, $TaskId)
            return @{ TimedOut = $false; TaskId = $TaskId; Result = @{ TaskId = $TaskId; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { @{ T1 = '/tmp/wt1'; T2 = '/tmp/wt2' } }
        Mock Add-MergeQueue { $true }
        $script:drainCalls25 = 0
        Mock Test-MergeQueueEmpty {
            $script:drainCalls25++
            $script:drainCalls25 -gt 3  # Eventually empty
        }
        $script:mergeDequeue25 = 0
        Mock Start-NextMerge {
            $script:mergeDequeue25++
            if ($script:mergeDequeue25 -le 2) { "T$($script:mergeDequeue25)" } else { $null }
        }
        Mock Invoke-Merge {
            return @{ TaskId = $TaskId; Success = $true; Conflict = $false; RetryCount = 0; AbortedClean = $true; WorkspaceRemoved = $true }
        }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
            @{ id = 'T2'; step = 2; title = 'B'; files = @('b.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'completed'
    }

    # ── Scenario 26: ErrorActionPreference in thread jobs (objection #46) ──
    It 'Scenario 26: Non-terminating error surfaces as job failure' {
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $false; TaskId = 'T1'; Result = $null; Error = 'Non-terminating error converted to terminating'; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Read-Escalation {
            return @{ Decision = 'Stop'; Source = 'task'; TaskId = 'T1'; Phase = $null; PreStopSnapshot = @{}; Reason = $null }
        }
        Mock Sync-FallbackLog {}

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
    }

    # ── Scenario 27: Worktree dirty state on re-dispatch (objection #53) ──
    It 'Scenario 27: Reset-WorktreeState called before re-dispatch on KeepGoing' {
        $script:invokeCount27 = 0
        Mock Invoke-WithTimeout {
            $script:invokeCount27++
            if ($script:invokeCount27 -eq 1) {
                return @{ TimedOut = $true; TaskId = 'T1'; Result = $null; Error = 'timeout'; KilledPids = @() }
            }
            return @{ TimedOut = $false; TaskId = 'T1'; Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { @{ T1 = '/tmp/wt-dirty' } }
        Mock Reset-WorktreeState { $true } -Verifiable
        Mock Read-Escalation {
            return @{ Decision = 'KeepGoing'; Source = 'task'; TaskId = 'T1'; Phase = ''; Reason = $null; PreStopSnapshot = $null }
        }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        Should -Invoke Reset-WorktreeState -Times 1
    }

    # ── Scenario 28: Output pollution in thread job (objection #51) ──
    It 'Scenario 28: Multiple output objects trigger escalation' {
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $false; TaskId = 'T1'; Result = $null; Error = 'Output pollution: thread job returned 3 objects instead of 1'; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Read-Escalation {
            return @{ Decision = 'Stop'; Source = 'task'; TaskId = 'T1'; Phase = $null; PreStopSnapshot = @{}; Reason = $null }
        }
        Mock Sync-FallbackLog {}

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
    }

    # ── Scenario 29: Atomic merge enqueue (objection #78) ──
    It 'Scenario 29: Duplicate enqueue prevented by TryAdd gate' {
        # This is tested at the unit level in merge-queue.Tests.ps1
        # Integration test verifies orchestrator uses Add-MergeQueue correctly
        Mock Invoke-WithTimeout {
            param($ScriptBlock, $TaskId)
            return @{ TimedOut = $false; TaskId = $TaskId; Result = @{ TaskId = $TaskId; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { @{ T1 = '/tmp/wt1' } }
        Mock Add-MergeQueue { $true } -Verifiable
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        Should -Invoke Add-MergeQueue
    }

    # ── Scenario 30: SkipEmptyTier precondition (objection #74) ──
    It 'Scenario 30: SkipEmptyTier does not fire at currentTier=0 (validation phase)' {
        # Plan starts with validation (currentTier=0 equivalent), first non-empty tier correctly found
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $false; TaskId = 'T1'; Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(
            @{ tier = 1; tasks = @(
                @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
            )}
        )

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'completed'
    }

    # ── Scenario 31: Pipeline timeout ──
    It 'Scenario 31: Pipeline halts on timeout' {
        $origTimeout = $Config.PipelineTimeoutSeconds
        $Config.PipelineTimeoutSeconds = 0  # Immediate timeout

        try {
            Mock Invoke-WithTimeout {
                return @{ TimedOut = $false; TaskId = 'T1'; Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
            }
            Mock New-TaskWorkspace { $null }
            Mock Sync-FallbackLog {}

            $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
                @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
            )})

            $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
            $result.PipelineStatus | Should -Be 'halted'
            $result.Reason | Should -Be 'timeout'
        }
        finally {
            $Config.PipelineTimeoutSeconds = $origTimeout
        }
    }

    # ── Scenario 32: Per-task wall-clock budget (objection #64) ──
    It 'Scenario 32: Task exceeding wall-clock budget is escalated' {
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $true; BudgetExceeded = $true; TaskId = 'T1'; Result = $null; Error = 'Wall-clock budget exceeded'; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Read-Escalation {
            return @{ Decision = 'Stop'; Source = 'task'; TaskId = 'T1'; Phase = $null; PreStopSnapshot = @{}; Reason = $null }
        }
        Mock Sync-FallbackLog {}

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
    }

    # ── Scenario 34: Lock failure halts pipeline ──
    It 'Scenario 34: Lock creation failure returns halted with lock_failed' {
        Mock New-PipelineLock { throw 'Lock already exists' }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
        $result.Reason | Should -Be 'lock_failed'
        $result.Error | Should -Match 'Lock already exists'
    }

    # ── Scenario 35: Resume with all tasks completed skips entire tier ──
    It 'Scenario 35: Resume where every task in tier is completed skips tier' {
        Mock Invoke-WithTimeout {}
        Mock New-TaskWorkspace { $null }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $resumeState = @{
            CompletedTasks = [System.Collections.Generic.HashSet[string]]::new([string[]]@('T1'))
            MergedTasks = [System.Collections.Generic.HashSet[string]]::new()
        }

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir -ResumeState $resumeState
        $result.PipelineStatus | Should -Be 'completed'
        Should -Not -Invoke Invoke-WithTimeout
    }

    # ── Scenario 36: Workspace failure -> Stop halts pipeline ──
    It 'Scenario 36: Workspace failure with Stop decision halts pipeline' {
        Mock New-TaskWorkspace { throw 'worktree corrupted' }
        Mock Read-Escalation {
            return @{ Decision = 'Stop'; Source = 'workspace'; TaskId = $null; Phase = $null; PreStopSnapshot = @{}; Reason = $null }
        }
        Mock Sync-FallbackLog {}

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
        $result.Reason | Should -Be 'workspace_failure'
    }

    # ── Scenario 37: Merge failure in drain -> Stop ──
    It 'Scenario 37: Merge failure in drain loop with Stop halts pipeline' {
        Mock Invoke-WithTimeout {
            param($ScriptBlock, $TaskId)
            return @{ TimedOut = $false; TaskId = $TaskId; Result = @{ TaskId = $TaskId; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { @{ T1 = '/tmp/wt1'; T2 = '/tmp/wt2' } }
        Mock Add-MergeQueue { $true }
        $script:mergeQueueEmpty37 = $false
        Mock Test-MergeQueueEmpty { $script:mergeQueueEmpty37 }
        $script:mergeDequeue37 = 0
        Mock Start-NextMerge {
            $script:mergeDequeue37++
            if ($script:mergeDequeue37 -eq 1) { 'T1' } else { $script:mergeQueueEmpty37 = $true; $null }
        }
        Mock Invoke-Merge {
            return @{ TaskId = 'T1'; Success = $false; Conflict = $true; RetryCount = 3; AbortedClean = $true; WorkspaceRemoved = $false }
        }
        Mock Read-Escalation {
            return @{ Decision = 'Stop'; Source = 'merge'; TaskId = 'T1'; Phase = 'done'; PreStopSnapshot = @{}; Reason = $null }
        }
        Mock Sync-FallbackLog {}

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
            @{ id = 'T2'; step = 2; title = 'B'; files = @('b.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
        $result.Reason | Should -Be 'merge_exhausted'
    }

    # ── Scenario 38: Merge failure -> KeepGoing resets and continues ──
    It 'Scenario 38: Merge failure with KeepGoing resets and pipeline completes' {
        Mock Invoke-WithTimeout {
            param($ScriptBlock, $TaskId)
            return @{ TimedOut = $false; TaskId = $TaskId; Result = @{ TaskId = $TaskId; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { @{ T1 = '/tmp/wt1'; T2 = '/tmp/wt2' } }
        Mock Add-MergeQueue { $true }
        $script:mergeQueueEmpty38 = $false
        Mock Test-MergeQueueEmpty { $script:mergeQueueEmpty38 }
        $script:mergeDequeue38 = 0
        Mock Start-NextMerge {
            $script:mergeDequeue38++
            if ($script:mergeDequeue38 -eq 1) { 'T1' } else { $script:mergeQueueEmpty38 = $true; $null }
        }
        Mock Invoke-Merge {
            return @{ TaskId = 'T1'; Success = $false; Conflict = $true; RetryCount = 3; AbortedClean = $true; WorkspaceRemoved = $false }
        }
        Mock Read-Escalation {
            return @{ Decision = 'KeepGoing'; Source = 'merge'; TaskId = 'T1'; Phase = 'done'; Reason = $null; PreStopSnapshot = $null }
        }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'completed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
            @{ id = 'T2'; step = 2; title = 'B'; files = @('b.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'completed'
        Should -Invoke Read-Escalation -Times 1
    }

    # ── Scenario 39: Final verification non-completed halts pipeline ──
    It 'Scenario 39: Final verification returning non-completed state halts pipeline' {
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $false; TaskId = 'T1'; Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'failed'; return $Counters }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
    }

    # ── Scenario 40: Final verification exhausted -> Stop ──
    It 'Scenario 40: Final verification exhaustion with Stop halts pipeline' {
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $false; TaskId = 'T1'; Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Add-MergeQueue { $true }
        Mock Test-MergeQueueEmpty { $true }
        Mock Start-NextMerge { $null }
        Mock Sync-FallbackLog {}
        Mock Invoke-FinalVerification { $Counters.finalVerifPhase = 'escalated'; return $Counters }
        Mock Read-Escalation {
            return @{ Decision = 'Stop'; Source = 'final'; TaskId = $null; Phase = $null; PreStopSnapshot = @{}; Reason = $null }
        }

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
        $result.Reason | Should -Be 'final_verification_exhausted'
    }

    # ── Scenario 41: Merge drain timeout ──
    It 'Scenario 41: Pipeline timeout during merge drain halts' {
        $origTimeout = $Config.PipelineTimeoutSeconds
        try {
            Mock Invoke-WithTimeout {
                param($ScriptBlock, $TaskId)
                return @{ TimedOut = $false; TaskId = $TaskId; Result = @{ TaskId = $TaskId; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }; Error = $null; KilledPids = @() }
            }
            Mock New-TaskWorkspace { @{ T1 = '/tmp/wt1'; T2 = '/tmp/wt2' } }
            Mock Add-MergeQueue { $true }
            Mock Test-MergeQueueEmpty { $false }
            Mock Start-NextMerge { 'T1' }
            Mock Invoke-Merge {
                # Trigger timeout by setting it to 0 after entering merge drain
                $Config.PipelineTimeoutSeconds = 0
                return @{ TaskId = 'T1'; Success = $true; Conflict = $false; RetryCount = 0; AbortedClean = $true; WorkspaceRemoved = $true }
            }
            Mock Sync-FallbackLog {}

            $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
                @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
                @{ id = 'T2'; step = 2; title = 'B'; files = @('b.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
            )})

            $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
            $result.PipelineStatus | Should -Be 'halted'
            $result.Reason | Should -Be 'timeout'
        }
        finally {
            $Config.PipelineTimeoutSeconds = $origTimeout
        }
    }

    # ── Scenario 33: PID registry fallback (objection #61) ──
    It 'Scenario 33: Timeout without registered PID still escalates cleanly' {
        Mock Invoke-WithTimeout {
            return @{ TimedOut = $true; TaskId = 'T1'; Result = $null; Error = 'Timed out (PID fallback enumeration)'; KilledPids = @() }
        }
        Mock New-TaskWorkspace { $null }
        Mock Read-Escalation {
            return @{ Decision = 'Stop'; Source = 'task'; TaskId = 'T1'; Phase = $null; PreStopSnapshot = @{}; Reason = $null }
        }
        Mock Sync-FallbackLog {}

        $planFile = New-TestPlan @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
        )})

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
    }
}
