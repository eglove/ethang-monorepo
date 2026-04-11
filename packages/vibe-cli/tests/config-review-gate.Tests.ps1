BeforeAll {
    # Dot-source config.ps1; mock its transitive dependency so it loads cleanly
    function Invoke-Claude { }
    . "$PSScriptRoot/../utils/config.ps1"
}

# ─────────────────────────────────────────────────────────────────────────────
# T1 — Review gate constants and NumTasks
# BDD: Feature "New configuration values control review behavior with load-time validation"
# TLA: CONSTANTS MaxReviewRounds, MaxKeepGoingResets, MaxTddKeepGoingPerGate, NumTasks
# ─────────────────────────────────────────────────────────────────────────────

Describe 'Review gate default values' {
    BeforeEach {
        # Clear all override env vars so defaults surface
        $env:VIBE_MAX_REVIEW_ROUNDS           = $null
        $env:VIBE_MAX_KEEP_GOING_RESETS       = $null
        $env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE = $null
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = $null
        $env:VIBE_NUM_TASKS                   = $null
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS    = $null
    }

    It 'MaxReviewRounds defaults to 3' {
        $cfg = Get-PipelineConfig
        $cfg['MaxReviewRounds'] | Should -Be 3
    }

    It 'MaxKeepGoingResets defaults to 3' {
        $cfg = Get-PipelineConfig
        $cfg['MaxKeepGoingResets'] | Should -Be 3
    }

    It 'MaxTddKeepGoingPerGate defaults to 5' {
        $cfg = Get-PipelineConfig
        $cfg['MaxTddKeepGoingPerGate'] | Should -Be 5
    }

    It 'ReviewGateTimeoutSeconds defaults to 1800' {
        $cfg = Get-PipelineConfig
        $cfg['ReviewGateTimeoutSeconds'] | Should -Be 1800
    }

    It 'PipelineTimeoutSeconds defaults to 14400' {
        $cfg = Get-PipelineConfig
        $cfg['PipelineTimeoutSeconds'] | Should -Be 14400
    }

    It 'NumTasks defaults to 1' {
        $cfg = Get-PipelineConfig
        $cfg['NumTasks'] | Should -Be 1
    }
}

Describe 'Get-PipelineConfig returns immutable snapshot' {
    BeforeEach {
        $env:VIBE_MAX_REVIEW_ROUNDS           = $null
        $env:VIBE_MAX_KEEP_GOING_RESETS       = $null
        $env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE = $null
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = $null
        $env:VIBE_NUM_TASKS                   = $null
    }

    It 'returns a ReadOnlyDictionary that cannot be mutated' {
        $cfg = Get-PipelineConfig
        { $cfg['MaxReviewRounds'] = 999 } | Should -Throw
    }

    It 'subsequent calls return independent snapshots' {
        $cfg1 = Get-PipelineConfig
        $env:VIBE_NUM_TASKS = '5'
        $cfg2 = Get-PipelineConfig
        $cfg1['NumTasks'] | Should -Be 1
        $cfg2['NumTasks'] | Should -Be 5
    }
}

Describe 'Environment variable overrides' {
    AfterEach {
        $env:VIBE_MAX_REVIEW_ROUNDS           = $null
        $env:VIBE_MAX_KEEP_GOING_RESETS       = $null
        $env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE = $null
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = $null
        $env:VIBE_NUM_TASKS                   = $null
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS    = $null
    }

    It 'VIBE_MAX_REVIEW_ROUNDS overrides MaxReviewRounds' {
        $env:VIBE_MAX_REVIEW_ROUNDS = '5'
        $cfg = Get-PipelineConfig
        $cfg['MaxReviewRounds'] | Should -Be 5
    }

    It 'VIBE_MAX_KEEP_GOING_RESETS overrides MaxKeepGoingResets' {
        $env:VIBE_MAX_KEEP_GOING_RESETS = '2'
        $cfg = Get-PipelineConfig
        $cfg['MaxKeepGoingResets'] | Should -Be 2
    }

    It 'VIBE_MAX_KEEP_GOING_RESETS=0 sets MaxKeepGoingResets to 0 (disables Keep Going per TLA S11)' {
        $env:VIBE_MAX_KEEP_GOING_RESETS = '0'
        $cfg = Get-PipelineConfig
        $cfg['MaxKeepGoingResets'] | Should -Be 0
    }

    It 'VIBE_MAX_TDD_KEEP_GOING_PER_GATE overrides MaxTddKeepGoingPerGate' {
        $env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE = '10'
        $cfg = Get-PipelineConfig
        $cfg['MaxTddKeepGoingPerGate'] | Should -Be 10
    }

    It 'VIBE_REVIEW_GATE_TIMEOUT_SECONDS overrides ReviewGateTimeoutSeconds' {
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = '3600'
        # Also bump pipeline timeout to satisfy cross-field constraint
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS = '7200'
        $cfg = Get-PipelineConfig
        $cfg['ReviewGateTimeoutSeconds'] | Should -Be 3600
    }

    It 'VIBE_NUM_TASKS overrides NumTasks' {
        $env:VIBE_NUM_TASKS = '4'
        $cfg = Get-PipelineConfig
        $cfg['NumTasks'] | Should -Be 4
    }
}

Describe 'Config rejects zero or negative values at load time' {
    AfterEach {
        $env:VIBE_MAX_REVIEW_ROUNDS           = $null
        $env:VIBE_MAX_KEEP_GOING_RESETS       = $null
        $env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE = $null
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = $null
        $env:VIBE_NUM_TASKS                   = $null
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS    = $null
    }

    It 'throws when MaxReviewRounds is 0' {
        $env:VIBE_MAX_REVIEW_ROUNDS = '0'
        { Get-PipelineConfig } | Should -Throw '*MaxReviewRounds*must be*positive*'
    }

    It 'throws when MaxReviewRounds is negative' {
        $env:VIBE_MAX_REVIEW_ROUNDS = '-1'
        { Get-PipelineConfig } | Should -Throw '*MaxReviewRounds*must be*positive*'
    }

    It 'throws when ReviewGateTimeoutSeconds is 0' {
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = '0'
        { Get-PipelineConfig } | Should -Throw '*ReviewGateTimeoutSeconds*must be*positive*'
    }

    It 'throws when MaxTddKeepGoingPerGate is 0' {
        $env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE = '0'
        { Get-PipelineConfig } | Should -Throw '*MaxTddKeepGoingPerGate*must be*positive*'
    }

    It 'throws when PipelineTimeoutSeconds is 0' {
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS = '0'
        { Get-PipelineConfig } | Should -Throw '*PipelineTimeoutSeconds*must be*positive*'
    }

    It 'throws when MaxKeepGoingResets is negative' {
        $env:VIBE_MAX_KEEP_GOING_RESETS = '-1'
        { Get-PipelineConfig } | Should -Throw '*MaxKeepGoingResets*must be*non-negative*'
    }

    It 'throws when NumTasks is 0' {
        $env:VIBE_NUM_TASKS = '0'
        { Get-PipelineConfig } | Should -Throw '*NumTasks*must be*>= 1*'
    }

    It 'throws when NumTasks is negative' {
        $env:VIBE_NUM_TASKS = '-1'
        { Get-PipelineConfig } | Should -Throw '*NumTasks*must be*>= 1*'
    }
}

Describe 'Cross-field config validation' {
    AfterEach {
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = $null
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS    = $null
    }

    It 'throws when PipelineTimeoutSeconds < ReviewGateTimeoutSeconds' {
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS = '1000'
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = '1800'
        { Get-PipelineConfig } | Should -Throw '*PipelineTimeoutSeconds*1000*must be*ReviewGateTimeout*1800*'
    }
}

Describe 'Config boundary-valid values are accepted' {
    AfterEach {
        $env:VIBE_MAX_REVIEW_ROUNDS           = $null
        $env:VIBE_MAX_KEEP_GOING_RESETS       = $null
        $env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE = $null
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = $null
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS    = $null
    }

    It 'accepts MaxReviewRounds=1' {
        $env:VIBE_MAX_REVIEW_ROUNDS = '1'
        $cfg = Get-PipelineConfig
        $cfg['MaxReviewRounds'] | Should -Be 1
    }

    It 'accepts MaxKeepGoingResets=0 (disables Keep Going)' {
        $env:VIBE_MAX_KEEP_GOING_RESETS = '0'
        $cfg = Get-PipelineConfig
        $cfg['MaxKeepGoingResets'] | Should -Be 0
    }

    It 'accepts MaxTddKeepGoingPerGate=1' {
        $env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE = '1'
        $cfg = Get-PipelineConfig
        $cfg['MaxTddKeepGoingPerGate'] | Should -Be 1
    }

    It 'accepts ReviewGateTimeoutSeconds=1' {
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = '1'
        $cfg = Get-PipelineConfig
        $cfg['ReviewGateTimeoutSeconds'] | Should -Be 1
    }
}
