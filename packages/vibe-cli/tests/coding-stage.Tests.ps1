BeforeAll {
    . "$PSScriptRoot/../stages/8-coding.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Read-Escalation {
        return @{ Decision = 'Stop'; Source = 'task'; TaskId = $null; Phase = $null; Reason = $null; PreStopSnapshot = $null }
    }
}

Describe 'Invoke-CodingStage' {
    BeforeAll {
        $script:root = (Resolve-Path "$PSScriptRoot/..").Path
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "coding-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null
        $logsDir = Join-Path $script:tempDir 'logs'
        New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    AfterEach {
        $lockPath = Join-Path $script:tempDir 'pipeline.lock'
        Remove-Item $lockPath -ErrorAction SilentlyContinue
    }

    It 'halts on validation failure (S11)' {
        $plan = @{ tiers = @(@{ tier = 1; tasks = @(
            @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'nonexistent-writer'; testWriter = $null; dependencies = @('T1') }
        )}) }
        $planFile = Join-Path $script:tempDir 'bad-plan.json'
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'halted'
        $result.Reason | Should -Be 'validation_failed'
    }

    It 'completes immediately for zero-tier plan' {
        $plan = @{ tiers = @() }
        $planFile = Join-Path $script:tempDir 'zero-tier.json'
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.PipelineStatus | Should -Be 'completed'
        $result.CurrentTier | Should -Be 1
    }

    It 'generates a pipeline RunId' {
        $plan = @{ tiers = @() }
        $planFile = Join-Path $script:tempDir 'runid-test.json'
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $result.RunId | Should -Not -BeNullOrEmpty
        $result.RunId | Should -Match '[a-f0-9-]+'
    }

    It 'creates and removes lock file' {
        $plan = @{ tiers = @() }
        $planFile = Join-Path $script:tempDir 'lock-test.json'
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        $lockPath = Join-Path $script:tempDir 'pipeline.lock'

        Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
        $lockPath | Should -Not -Exist  # Cleaned up in finally block
    }

    Context 'with single-task plan' {
        BeforeAll {
            Mock Invoke-Claude { '{"filesModified":[],"summary":"done"}' }
            Mock Invoke-VerifyCommand { 0 }
            Mock New-TaskWorkspace { $null }
            Mock Remove-TaskWorkspace {}
            Mock Invoke-GitWithRetry {}
            Mock Sync-FallbackLog {}
            Mock Add-MergeQueue { $true }
            Mock Test-MergeQueueEmpty { $true }
            Mock Start-NextMerge { $null }
        }

        It 'completes a single TDD task' {
            $plan = @{
                tiers = @(@{ tier = 1; tasks = @(
                    @{ id = 'T1'; step = 1; title = 'Config'; files = @('utils/config.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
                )})
            }
            $planFile = Join-Path $script:tempDir 'single-task.json'
            $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

            Mock Invoke-WithTimeout {
                return @{
                    TimedOut = $false; TaskId = 'T1'
                    Result = @{ TaskId = 'T1'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }
                    Error = $null; KilledPids = @()
                }
            }
            Mock Invoke-FinalVerification {
                $Counters.finalVerifPhase = 'completed'
                return $Counters
            }

            $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
            $result.PipelineStatus | Should -Be 'completed'
        }

        It 'completes an agent-writer task (S3)' {
            $plan = @{
                tiers = @(@{ tier = 1; tasks = @(
                    @{ id = 'T4'; step = 4; title = 'Agent Prompts'; files = @('agents/test.md'); codeWriter = 'agent-writer'; testWriter = $null; dependencies = @() }
                )})
            }
            $planFile = Join-Path $script:tempDir 'agent-task.json'
            $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

            Mock Invoke-WithTimeout {
                return @{
                    TimedOut = $false; TaskId = 'T4'
                    Result = @{ TaskId = 'T4'; Phase = 'done'; Status = 'completed'; Counters = @{}; Escalated = $false }
                    Error = $null; KilledPids = @()
                }
            }
            Mock Invoke-FinalVerification {
                $Counters.finalVerifPhase = 'completed'
                return $Counters
            }

            $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
            $result.PipelineStatus | Should -Be 'completed'
        }
    }

    Context 'escalation' {
        BeforeAll {
            Mock Invoke-Claude { '{}' }
            Mock Invoke-VerifyCommand { 0 }
            Mock New-TaskWorkspace { $null }
            Mock Sync-FallbackLog {}
            Mock Add-MergeQueue { $true }
            Mock Test-MergeQueueEmpty { $true }
            Mock Start-NextMerge { $null }
        }

        It 'halts on user Stop' {
            $plan = @{
                tiers = @(@{ tier = 1; tasks = @(
                    @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
                )})
            }
            $planFile = Join-Path $script:tempDir 'stop-test.json'
            $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

            Mock Invoke-WithTimeout {
                return @{
                    TimedOut = $true; TaskId = 'T1'
                    Result = $null; Error = 'Timed out'; KilledPids = @()
                }
            }
            Mock Read-Escalation {
                return @{
                    Decision = 'Stop'; Source = 'task'; TaskId = 'T1'
                    PreStopSnapshot = @{ T1 = 'escalated' }
                    Phase = $null; Reason = $null
                }
            }

            $result = Invoke-CodingStage -PlanJsonPath $planFile -Root $script:root -FeatureDir $script:tempDir
            $result.PipelineStatus | Should -Be 'halted'
            $result.Reason | Should -Be 'user_stop'
        }
    }
}
