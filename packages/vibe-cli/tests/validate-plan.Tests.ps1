BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
    . "$PSScriptRoot/../utils/result-contracts.ps1"
    . "$PSScriptRoot/../utils/validate-plan.ps1"
}

Describe 'Test-ImplementationPlan' {
    BeforeAll {
        $script:root = (Resolve-Path "$PSScriptRoot/..").Path
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "valplan-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns valid for a correct plan' {
        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @(
                    @{ id = 'T1'; step = 1; title = 'Config'; files = @('utils/config.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @() }
                )}
                @{ tier = 2; tasks = @(
                    @{ id = 'T2'; step = 2; title = 'Workspace'; files = @('utils/workspace.ps1'); codeWriter = 'powershell-writer'; testWriter = 'pester'; dependencies = @('T1') }
                )}
            )
        }
        $planFile = Join-Path $script:tempDir 'valid-plan.json'
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        $result = Test-ImplementationPlan -PlanJsonPath $planFile -Root $script:root
        $result.Status | Should -Be 'valid'
        $result.Errors.Count | Should -Be 0
    }

    It 'detects intra-tier dependency' {
        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @(
                    @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = $null; testWriter = $null; dependencies = @() }
                    @{ id = 'T2'; step = 2; title = 'B'; files = @('b.ps1'); codeWriter = $null; testWriter = $null; dependencies = @('T1') }
                )}
            )
        }
        $planFile = Join-Path $script:tempDir 'intratier.json'
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        $result = Test-ImplementationPlan -PlanJsonPath $planFile -Root $script:root
        $result.Status | Should -Be 'failed'
        ($result.Errors | Where-Object { $_ -match 'intra-tier|forward' }).Count | Should -BeGreaterThan 0
    }

    It 'allows null codeWriter for test-only tasks' {
        $plan = @{
            tiers = @(@{ tier = 1; tasks = @(
                @{ id = 'T1'; step = 1; title = 'A'; files = @('test.ps1'); codeWriter = $null; testWriter = 'pester'; dependencies = @() }
            )})
        }
        $planFile = Join-Path $script:tempDir 'null-writer.json'
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        $result = Test-ImplementationPlan -PlanJsonPath $planFile -Root $script:root
        # Should not have errors about null codeWriter
        ($result.Errors | Where-Object { $_ -match 'codeWriter' }).Count | Should -Be 0
    }

    It 'detects missing dependency target' {
        $plan = @{
            tiers = @(@{ tier = 1; tasks = @(
                @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = $null; testWriter = $null; dependencies = @('T99') }
            )})
        }
        $planFile = Join-Path $script:tempDir 'missing-dep.json'
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        $result = Test-ImplementationPlan -PlanJsonPath $planFile -Root $script:root
        $result.Status | Should -Be 'failed'
        ($result.Errors | Where-Object { $_ -match 'non-existent.*T99' }).Count | Should -BeGreaterThan 0
    }

    It 'detects duplicate task IDs' {
        $plan = @{
            tiers = @(
                @{ tier = 1; tasks = @(
                    @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = $null; testWriter = $null; dependencies = @() }
                    @{ id = 'T1'; step = 2; title = 'B'; files = @('b.ps1'); codeWriter = $null; testWriter = $null; dependencies = @() }
                )}
            )
        }
        $planFile = Join-Path $script:tempDir 'dup-id.json'
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        $result = Test-ImplementationPlan -PlanJsonPath $planFile -Root $script:root
        $result.Status | Should -Be 'failed'
        ($result.Errors | Where-Object { $_ -match 'Duplicate.*T1' }).Count | Should -BeGreaterThan 0
    }

    It 'returns valid for empty plan (zero tiers)' {
        $plan = @{ tiers = @() }
        $planFile = Join-Path $script:tempDir 'empty.json'
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        $result = Test-ImplementationPlan -PlanJsonPath $planFile -Root $script:root
        $result.Status | Should -Be 'valid'
    }

    It 'adds file-overlap warnings' {
        $plan = @{
            tiers = @(@{ tier = 1; tasks = @(
                @{ id = 'T1'; step = 1; title = 'A'; files = @('utils/config.ps1'); codeWriter = $null; testWriter = $null; dependencies = @() }
                @{ id = 'T2'; step = 2; title = 'B'; files = @('utils/config.ps1'); codeWriter = $null; testWriter = $null; dependencies = @() }
            )})
        }
        $planFile = Join-Path $script:tempDir 'overlap.json'
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        $result = Test-ImplementationPlan -PlanJsonPath $planFile -Root $script:root
        $result.Status | Should -Be 'valid'
        $result.Warnings.Count | Should -BeGreaterThan 0
        ($result.Warnings | Where-Object { $_ -match 'T1.*T2' -or $_ -match 'T2.*T1' }).Count | Should -BeGreaterThan 0
    }

    It 'fails on missing plan file' {
        $result = Test-ImplementationPlan -PlanJsonPath '/nonexistent.json' -Root $script:root
        $result.Status | Should -Be 'failed'
        ($result.Errors | Where-Object { $_ -match 'not found' }).Count | Should -BeGreaterThan 0
    }

    It 'fails on invalid JSON' {
        $planFile = Join-Path $script:tempDir 'bad-json.json'
        Set-Content $planFile -Value 'NOT VALID JSON {{'
        $result = Test-ImplementationPlan -PlanJsonPath $planFile -Root $script:root
        $result.Status | Should -Be 'failed'
        ($result.Errors | Where-Object { $_ -match 'Invalid JSON' }).Count | Should -BeGreaterThan 0
    }

    It 'detects task missing id field' {
        $plan = @{
            tiers = @(@{ tier = 1; tasks = @(
                @{ step = 1; title = 'A'; files = @('a.ps1'); codeWriter = $null; testWriter = $null; dependencies = @() }
            )})
        }
        $planFile = Join-Path $script:tempDir 'no-id.json'
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        $result = Test-ImplementationPlan -PlanJsonPath $planFile -Root $script:root
        $result.Status | Should -Be 'failed'
        ($result.Errors | Where-Object { $_ -match "missing 'id'" }).Count | Should -BeGreaterThan 0
    }

    It 'detects orphaned workspace matching task ID (L113)' {
        $plan = @{
            tiers = @(@{ tier = 1; tasks = @(
                @{ id = 'T1'; step = 1; title = 'A'; files = @('a.ps1'); codeWriter = $null; testWriter = $null; dependencies = @() }
            )})
        }
        $planFile = Join-Path $script:tempDir 'orphan-wt.json'
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        # Mock git worktree list to return a branch matching the task ID
        Mock git {
            return @(
                "worktree /tmp/wt1"
                "branch refs/heads/feature/my-feat-T1-impl"
            )
        }

        $result = Test-ImplementationPlan -PlanJsonPath $planFile -Root $script:root
        $result.Status | Should -Be 'failed'
        ($result.Errors | Where-Object { $_ -match 'Orphaned workspace' }).Count | Should -BeGreaterThan 0
    }

    It 'detects task missing required fields' {
        $plan = @{
            tiers = @(@{ tier = 1; tasks = @(
                @{ id = 'T1'; codeWriter = $null; testWriter = $null; dependencies = @() }
            )})
        }
        $planFile = Join-Path $script:tempDir 'missing-fields.json'
        $plan | ConvertTo-Json -Depth 5 | Set-Content $planFile

        $result = Test-ImplementationPlan -PlanJsonPath $planFile -Root $script:root
        $result.Status | Should -Be 'failed'
        ($result.Errors | Where-Object { $_ -match 'missing required field' }).Count | Should -BeGreaterThan 0
    }

}

Describe 'New-PipelineLock' {
    BeforeAll {
        $script:lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "lock-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
        Mock Write-PipelineLog {}
        Mock Write-Host {}
    }

    AfterAll {
        Remove-Item $script:lockDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'creates a lock file with PID and RunId' {
        $lockPath = Join-Path $script:lockDir 'test1.lock'
        New-PipelineLock -LockPath $lockPath -PipelineRunId 'run-123'
        $lockPath | Should -Exist
        $content = Get-Content $lockPath -Raw
        $content | Should -Match "PID=$PID"
        $content | Should -Match 'RunId=run-123'
        Remove-Item $lockPath
    }

    It 'rejects concurrent creation when lock is held by live process' {
        $lockPath = Join-Path $script:lockDir 'test2.lock'
        New-PipelineLock -LockPath $lockPath -PipelineRunId 'run-first'

        { New-PipelineLock -LockPath $lockPath -PipelineRunId 'run-second' } |
            Should -Throw '*already active*'

        Remove-Item $lockPath
    }

    It 'handles lock file with malformed content (no PID/ProcessName match) — defaults (L145-146, L150)' {
        $lockPath = Join-Path $script:lockDir 'test-defaults.lock'
        # Write a lock with content that does NOT match the PID/ProcessName/RunId patterns
        Set-Content $lockPath -Value 'garbled content no fields'

        # Since lockPid=0 and lockProcess='', Get-Process -Id 0 will fail,
        # so it should be treated as stale and overwritten
        New-PipelineLock -LockPath $lockPath -PipelineRunId 'run-after-garbled'
        $content = Get-Content $lockPath -Raw
        $content | Should -Match 'RunId=run-after-garbled'
        Remove-Item $lockPath
    }

    It 'cleans stale lock with dead PID' {
        $lockPath = Join-Path $script:lockDir 'test3.lock'
        # Write a lock with a PID that does not exist
        @"
PID=999999
ProcessName=nonexistent
RunId=stale-run
"@ | Set-Content $lockPath

        New-PipelineLock -LockPath $lockPath -PipelineRunId 'run-new'
        $content = Get-Content $lockPath -Raw
        $content | Should -Match 'RunId=run-new'
        Remove-Item $lockPath
    }
}

Describe 'Remove-PipelineLock' {
    It 'removes an existing lock file' {
        $lockPath = Join-Path ([System.IO.Path]::GetTempPath()) "rmlock-$(Get-Random).lock"
        Set-Content $lockPath -Value 'test'
        Remove-PipelineLock -LockPath $lockPath
        $lockPath | Should -Not -Exist
    }

    It 'is a no-op for non-existent file' {
        { Remove-PipelineLock -LockPath '/nonexistent.lock' } | Should -Not -Throw
    }
}
