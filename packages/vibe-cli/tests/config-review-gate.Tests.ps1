BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
}

# =============================================================================
# T1: Review Gate Constants and NumTasks
#
# TLA+ coverage:
#   Constants: MaxReviewRounds, MaxKeepGoingResets, MaxTddKeepGoingPerGate, NumTasks
#   Invariant: S11 (MaxKeepGoingResets=0 disables Keep Going — structural)
# =============================================================================

Describe 'Review gate constants — defaults' {
    It 'exposes MaxReviewRounds with default value 3' {
        $Config.MaxReviewRounds | Should -Be 3
    }

    It 'exposes MaxKeepGoingResets with default value 3' {
        $Config.MaxKeepGoingResets | Should -Be 3
    }

    It 'exposes MaxTddKeepGoingPerGate with default value 5' {
        $Config.MaxTddKeepGoingPerGate | Should -Be 5
    }

    It 'exposes ReviewGateTimeoutSeconds with default value 1800' {
        $Config.ReviewGateTimeoutSeconds | Should -Be 1800
    }

    It 'retains existing PipelineTimeoutSeconds at 14400' {
        $Config.PipelineTimeoutSeconds | Should -Be 14400
    }
}

Describe 'NumTasks derivation' {
    It 'exposes NumTasks in the config' {
        $Config.Keys | Should -Contain 'NumTasks'
    }

    It 'defaults NumTasks to at least 1' {
        $Config.NumTasks | Should -BeGreaterOrEqual 1
    }
}

Describe 'Get-PipelineConfig returns review gate constants' {
    It 'returns a hashtable containing MaxReviewRounds' {
        $result = Get-PipelineConfig
        $result.MaxReviewRounds | Should -Be 3
    }

    It 'returns a hashtable containing MaxKeepGoingResets' {
        $result = Get-PipelineConfig
        $result.MaxKeepGoingResets | Should -Be 3
    }

    It 'returns a hashtable containing MaxTddKeepGoingPerGate' {
        $result = Get-PipelineConfig
        $result.MaxTddKeepGoingPerGate | Should -Be 5
    }

    It 'returns a hashtable containing ReviewGateTimeoutSeconds' {
        $result = Get-PipelineConfig
        $result.ReviewGateTimeoutSeconds | Should -Be 1800
    }

    It 'returns a hashtable containing NumTasks' {
        $result = Get-PipelineConfig
        $result.NumTasks | Should -BeGreaterOrEqual 1
    }
}

Describe 'Environment variable overrides' {
    AfterEach {
        # Clean up env vars after each test
        Remove-Item Env:VIBE_MAX_REVIEW_ROUNDS -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_MAX_KEEP_GOING_RESETS -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_NUM_TASKS -ErrorAction SilentlyContinue
    }

    It 'overrides MaxReviewRounds from VIBE_MAX_REVIEW_ROUNDS' {
        $env:VIBE_MAX_REVIEW_ROUNDS = '5'
        $result = Get-PipelineConfig
        $result.MaxReviewRounds | Should -Be 5
    }

    It 'overrides MaxKeepGoingResets from VIBE_MAX_KEEP_GOING_RESETS' {
        $env:VIBE_MAX_KEEP_GOING_RESETS = '7'
        $result = Get-PipelineConfig
        $result.MaxKeepGoingResets | Should -Be 7
    }

    It 'overrides MaxTddKeepGoingPerGate from VIBE_MAX_TDD_KEEP_GOING_PER_GATE' {
        $env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE = '10'
        $result = Get-PipelineConfig
        $result.MaxTddKeepGoingPerGate | Should -Be 10
    }

    It 'overrides ReviewGateTimeoutSeconds from VIBE_REVIEW_GATE_TIMEOUT_SECONDS' {
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = '3600'
        $result = Get-PipelineConfig
        $result.ReviewGateTimeoutSeconds | Should -Be 3600
    }

    It 'overrides NumTasks from VIBE_NUM_TASKS' {
        $env:VIBE_NUM_TASKS = '4'
        $result = Get-PipelineConfig
        $result.NumTasks | Should -Be 4
    }
}

Describe 'Boundary — zero values' {
    AfterEach {
        Remove-Item Env:VIBE_MAX_REVIEW_ROUNDS -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_MAX_KEEP_GOING_RESETS -ErrorAction SilentlyContinue
    }

    It 'accepts MaxReviewRounds=0 (immediate escalation on first fail/retry)' {
        $env:VIBE_MAX_REVIEW_ROUNDS = '0'
        $result = Get-PipelineConfig
        $result.MaxReviewRounds | Should -Be 0
    }

    It 'accepts MaxKeepGoingResets=0 to disable Keep Going (S11 invariant)' {
        $env:VIBE_MAX_KEEP_GOING_RESETS = '0'
        $result = Get-PipelineConfig
        $result.MaxKeepGoingResets | Should -Be 0
    }
}

Describe 'NumTasks validation' {
    AfterEach {
        Remove-Item Env:VIBE_NUM_TASKS -ErrorAction SilentlyContinue
    }

    It 'accepts NumTasks=1 for single-task tiers' {
        $env:VIBE_NUM_TASKS = '1'
        $result = Get-PipelineConfig
        $result.NumTasks | Should -Be 1
    }

    It 'accepts NumTasks=3 for multi-task tiers' {
        $env:VIBE_NUM_TASKS = '3'
        $result = Get-PipelineConfig
        $result.NumTasks | Should -Be 3
    }

    It 'throws a validation error when NumTasks=0' {
        $env:VIBE_NUM_TASKS = '0'
        { Get-PipelineConfig } | Should -Throw '*NumTasks*'
    }

    It 'throws a validation error when NumTasks is negative' {
        $env:VIBE_NUM_TASKS = '-1'
        { Get-PipelineConfig } | Should -Throw '*NumTasks*'
    }
}

Describe 'Config immutability after initialization' {
    It 'throws when attempting to add a new key after initialization' {
        $result = Get-PipelineConfig
        { $result.Add('SomeNewKey', 42) } | Should -Throw
    }

    It 'throws when attempting to modify an existing key after initialization' {
        $result = Get-PipelineConfig
        { $result.MaxReviewRounds = 999 } | Should -Throw
    }

    It 'throws when attempting to remove a key after initialization' {
        $result = Get-PipelineConfig
        { $result.Remove('MaxReviewRounds') } | Should -Throw
    }
}
