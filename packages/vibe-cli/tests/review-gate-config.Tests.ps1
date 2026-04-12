BeforeAll {
    # Dot-source config.ps1 to get $Config and Get-PipelineConfig
    . "$PSScriptRoot/../utils/config.ps1"
}

# =============================================================================
# Review Gate Constants in $Config hashtable (BDD: Config Values and Validation)
# =============================================================================

Describe 'Review gate constants in $Config' {
    It 'has MaxReviewRounds key with default value 3' {
        $Config.Keys | Should -Contain 'MaxReviewRounds'
        $Config.MaxReviewRounds | Should -Be 3
    }

    It 'has MaxKeepGoingResets key with default value 3' {
        $Config.Keys | Should -Contain 'MaxKeepGoingResets'
        $Config.MaxKeepGoingResets | Should -Be 3
    }

    It 'has MaxTddKeepGoingPerGate key with default value 5' {
        $Config.Keys | Should -Contain 'MaxTddKeepGoingPerGate'
        $Config.MaxTddKeepGoingPerGate | Should -Be 5
    }

    It 'has ReviewGateTimeoutSeconds key with default value 1800' {
        $Config.Keys | Should -Contain 'ReviewGateTimeoutSeconds'
        $Config.ReviewGateTimeoutSeconds | Should -Be 1800
    }

    It 'has NumTasks key with default value >= 1' {
        $Config.Keys | Should -Contain 'NumTasks'
        $Config.NumTasks | Should -BeGreaterOrEqual 1
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
            'VIBE_MAX_REVIEW_ROUNDS',
            'VIBE_MAX_KEEP_GOING_RESETS',
            'VIBE_MAX_TDD_KEEP_GOING_PER_GATE',
            'VIBE_REVIEW_GATE_TIMEOUT_SECONDS',
            'VIBE_NUM_TASKS',
            'VIBE_PIPELINE_TIMEOUT_SECONDS'
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

        It 'snapshot contains all review gate constants with correct defaults' {
            $cfg = Get-PipelineConfig
            $cfg['MaxReviewRounds']          | Should -Be 3
            $cfg['MaxKeepGoingResets']        | Should -Be 3
            $cfg['MaxTddKeepGoingPerGate']   | Should -Be 5
            $cfg['ReviewGateTimeoutSeconds'] | Should -Be 1800
            $cfg['NumTasks']                 | Should -Be 1
            $cfg['PipelineTimeoutSeconds']   | Should -Be 14400
        }

        It 'returned dictionary is immutable — writes throw' {
            $cfg = Get-PipelineConfig
            { $cfg['MaxReviewRounds'] = 99 } | Should -Throw
        }
    }

    # ── Environment variable overrides ──────────────────────────────────────

    Context 'VIBE_* environment variable overrides' {
        It 'overrides MaxReviewRounds via VIBE_MAX_REVIEW_ROUNDS' {
            $env:VIBE_MAX_REVIEW_ROUNDS = '5'
            $cfg = Get-PipelineConfig
            $cfg['MaxReviewRounds'] | Should -Be 5
        }

        It 'overrides MaxKeepGoingResets via VIBE_MAX_KEEP_GOING_RESETS' {
            $env:VIBE_MAX_KEEP_GOING_RESETS = '2'
            $cfg = Get-PipelineConfig
            $cfg['MaxKeepGoingResets'] | Should -Be 2
        }

        It 'overrides MaxKeepGoingResets to 0 (disables Keep Going per TLA S11)' {
            $env:VIBE_MAX_KEEP_GOING_RESETS = '0'
            $cfg = Get-PipelineConfig
            $cfg['MaxKeepGoingResets'] | Should -Be 0
        }

        It 'overrides MaxTddKeepGoingPerGate via VIBE_MAX_TDD_KEEP_GOING_PER_GATE' {
            $env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE = '10'
            $cfg = Get-PipelineConfig
            $cfg['MaxTddKeepGoingPerGate'] | Should -Be 10
        }

        It 'overrides ReviewGateTimeoutSeconds via VIBE_REVIEW_GATE_TIMEOUT_SECONDS' {
            $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = '3600'
            $cfg = Get-PipelineConfig
            $cfg['ReviewGateTimeoutSeconds'] | Should -Be 3600
        }

        It 'overrides NumTasks via VIBE_NUM_TASKS' {
            $env:VIBE_NUM_TASKS = '5'
            $cfg = Get-PipelineConfig
            $cfg['NumTasks'] | Should -Be 5
        }

        It 'overrides PipelineTimeoutSeconds via VIBE_PIPELINE_TIMEOUT_SECONDS' {
            $env:VIBE_PIPELINE_TIMEOUT_SECONDS = '28800'
            $cfg = Get-PipelineConfig
            $cfg['PipelineTimeoutSeconds'] | Should -Be 28800
        }
    }

    # ── Validation: zero/negative rejection (BDD Scenario Outline) ──────────

    Context 'Validation rejects invalid values' {
        It 'rejects MaxReviewRounds = 0' {
            $env:VIBE_MAX_REVIEW_ROUNDS = '0'
            { Get-PipelineConfig } | Should -Throw '*must be positive*'
        }

        It 'rejects MaxReviewRounds = -1' {
            $env:VIBE_MAX_REVIEW_ROUNDS = '-1'
            { Get-PipelineConfig } | Should -Throw '*must be positive*'
        }

        It 'rejects ReviewGateTimeoutSeconds = 0' {
            $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = '0'
            { Get-PipelineConfig } | Should -Throw '*must be positive*'
        }

        It 'rejects MaxTddKeepGoingPerGate = 0' {
            $env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE = '0'
            { Get-PipelineConfig } | Should -Throw '*must be positive*'
        }

        It 'rejects PipelineTimeoutSeconds = 0' {
            $env:VIBE_PIPELINE_TIMEOUT_SECONDS = '0'
            { Get-PipelineConfig } | Should -Throw '*must be positive*'
        }

        It 'rejects MaxKeepGoingResets = -1 (negative not allowed)' {
            $env:VIBE_MAX_KEEP_GOING_RESETS = '-1'
            { Get-PipelineConfig } | Should -Throw '*non-negative*'
        }

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
        It 'accepts MaxReviewRounds = 1' {
            $env:VIBE_MAX_REVIEW_ROUNDS = '1'
            $cfg = Get-PipelineConfig
            $cfg['MaxReviewRounds'] | Should -Be 1
        }

        It 'accepts MaxKeepGoingResets = 0 (BDD: disables Keep Going)' {
            $env:VIBE_MAX_KEEP_GOING_RESETS = '0'
            $cfg = Get-PipelineConfig
            $cfg['MaxKeepGoingResets'] | Should -Be 0
        }

        It 'accepts MaxTddKeepGoingPerGate = 1' {
            $env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE = '1'
            $cfg = Get-PipelineConfig
            $cfg['MaxTddKeepGoingPerGate'] | Should -Be 1
        }

        It 'accepts ReviewGateTimeoutSeconds = 1' {
            # Must also set PipelineTimeout >= gate timeout for cross-field
            $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = '1'
            $cfg = Get-PipelineConfig
            $cfg['ReviewGateTimeoutSeconds'] | Should -Be 1
        }

        It 'accepts NumTasks = 1 (minimum valid)' {
            $env:VIBE_NUM_TASKS = '1'
            $cfg = Get-PipelineConfig
            $cfg['NumTasks'] | Should -Be 1
        }
    }

    # ── Cross-field validation (BDD: PipelineTimeout >= ReviewGateTimeout) ──

    Context 'Cross-field validation' {
        It 'rejects PipelineTimeoutSeconds less than ReviewGateTimeoutSeconds' {
            $env:VIBE_PIPELINE_TIMEOUT_SECONDS = '1000'
            $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = '1800'
            { Get-PipelineConfig } | Should -Throw '*PipelineTimeoutSeconds*ReviewGateTimeoutSeconds*'
        }

        It 'accepts PipelineTimeoutSeconds equal to ReviewGateTimeoutSeconds' {
            $env:VIBE_PIPELINE_TIMEOUT_SECONDS = '1800'
            $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = '1800'
            $cfg = Get-PipelineConfig
            $cfg['PipelineTimeoutSeconds'] | Should -Be 1800
            $cfg['ReviewGateTimeoutSeconds'] | Should -Be 1800
        }

        It 'accepts PipelineTimeoutSeconds greater than ReviewGateTimeoutSeconds' {
            $env:VIBE_PIPELINE_TIMEOUT_SECONDS = '7200'
            $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = '1800'
            $cfg = Get-PipelineConfig
            $cfg['PipelineTimeoutSeconds'] | Should -Be 7200
        }
    }

    # ── Snapshot isolation (config mutation after snapshot) ──────────────────

    Context 'Snapshot isolation' {
        It 'does not reflect mutations to $Config after snapshot is taken' {
            $cfg = Get-PipelineConfig
            $originalValue = $Config.MaxReviewRounds
            $Config.MaxReviewRounds = 999

            # Snapshot should still have the original value
            $cfg['MaxReviewRounds'] | Should -Be $originalValue

            # Restore
            $Config.MaxReviewRounds = $originalValue
        }
    }
}
