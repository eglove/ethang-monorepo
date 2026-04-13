BeforeAll {
    # Load test config to get $Config and Get-PipelineConfig
    . "$PSScriptRoot/helpers/test-config.ps1"
}

# =============================================================================
# Review Gate Constants in $Config hashtable (BDD: Config Values and Validation)
# =============================================================================

Describe 'Review gate constants in $Config' {
    It 'has NumTasks key with default value >= 1' {
        $Config.Keys | Should -Contain 'NumTasks'
        $Config.NumTasks | Should -BeGreaterOrEqual 1
    }

    It 'does not contain removed retry limit keys' {
        $Config.Keys | Should -Not -Contain 'MaxReviewRounds'
        $Config.Keys | Should -Not -Contain 'MaxKeepGoingResets'
        $Config.Keys | Should -Not -Contain 'MaxTddKeepGoingPerGate'
    }
}

# =============================================================================
# Get-PipelineConfig — immutable snapshot (TLA+ TypeOK, BDD Config Validation)
# =============================================================================

Describe 'Get-PipelineConfig' {
    BeforeEach {
        # Save and clear all VIBE_* env vars to isolate tests
        $script:savedEnv = @{}
        $vibeVars = @(
            'VIBE_NUM_TASKS'
        )
        foreach ($v in $vibeVars) {
            $script:savedEnv[$v] = [Environment]::GetEnvironmentVariable($v, 'Process')
            [Environment]::SetEnvironmentVariable($v, $null, 'Process')
        }
    }

    AfterEach {
        # Restore env vars
        foreach ($v in $script:savedEnv.Keys) {
            [Environment]::SetEnvironmentVariable($v, $script:savedEnv[$v], 'Process')
        }
    }

    Context 'Default snapshot' {
        It 'returns a read-only dictionary' {
            $cfg = Get-PipelineConfig
            $cfg.GetType().Name | Should -Be 'ReadOnlyDictionary`2'
        }

        It 'snapshot contains NumTasks with correct default' {
            $cfg = Get-PipelineConfig
            $cfg['NumTasks']                 | Should -Be 1
        }

        It 'returned dictionary is immutable — writes throw' {
            $cfg = Get-PipelineConfig
            { $cfg['NumTasks'] = 99 } | Should -Throw
        }
    }

    # ── Environment variable overrides ──────────────────────────────────────

    Context 'VIBE_* environment variable overrides' {
        It 'overrides NumTasks via VIBE_NUM_TASKS' {
            $env:VIBE_NUM_TASKS = '5'
            $cfg = Get-PipelineConfig
            $cfg['NumTasks'] | Should -Be 5
        }
    }

    # ── Validation: zero/negative rejection (BDD Scenario Outline) ──────────

    Context 'Validation rejects invalid values' {
        It 'rejects NumTasks = 0 (TLA+ constraint: NumTasks >= 1)' {
            $env:VIBE_NUM_TASKS = '0'
            { Get-PipelineConfig } | Should -Throw '*NumTasks*'
        }

        It 'rejects NumTasks = -1' {
            $env:VIBE_NUM_TASKS = '-1'
            { Get-PipelineConfig } | Should -Throw '*NumTasks*'
        }
    }

    # ── Boundary-valid values (BDD Scenario Outline: accepts boundary) ──────

    Context 'Validation accepts boundary-valid values' {
        It 'accepts NumTasks = 1 (minimum valid)' {
            $env:VIBE_NUM_TASKS = '1'
            $cfg = Get-PipelineConfig
            $cfg['NumTasks'] | Should -Be 1
        }
    }

    # ── Snapshot isolation (config mutation after snapshot) ──────────────────

    Context 'Snapshot isolation' {
        It 'does not reflect mutations to $Config after snapshot is taken' {
            $cfg = Get-PipelineConfig
            $originalValue = $Config.NumTasks
            $Config.NumTasks = 999

            # Snapshot should still have the original value
            $cfg['NumTasks'] | Should -Be $originalValue

            # Restore
            $Config.NumTasks = $originalValue
        }
    }
}
