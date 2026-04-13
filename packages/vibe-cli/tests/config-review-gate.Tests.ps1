BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
}

# ─────────────────────────────────────────────────────────────────────────────
# T1 — NumTasks configuration
# BDD: Feature "NumTasks configuration value controls task count"
# ─────────────────────────────────────────────────────────────────────────────

Describe 'Review gate default values' {
    BeforeEach {
        $env:VIBE_NUM_TASKS = $null
    }

    It 'NumTasks defaults to 1' {
        $cfg = Get-PipelineConfig
        $cfg['NumTasks'] | Should -Be 1
    }
}

Describe 'Get-PipelineConfig returns immutable snapshot' {
    BeforeEach {
        $env:VIBE_NUM_TASKS = $null
    }

    It 'returns a ReadOnlyDictionary that cannot be mutated' {
        $cfg = Get-PipelineConfig
        { $cfg['NumTasks'] = 999 } | Should -Throw
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
        $env:VIBE_NUM_TASKS = $null
    }

    It 'VIBE_NUM_TASKS overrides NumTasks' {
        $env:VIBE_NUM_TASKS = '4'
        $cfg = Get-PipelineConfig
        $cfg['NumTasks'] | Should -Be 4
    }
}

Describe 'Config rejects zero or negative values at load time' {
    AfterEach {
        $env:VIBE_NUM_TASKS = $null
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
