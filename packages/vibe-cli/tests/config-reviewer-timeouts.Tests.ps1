BeforeAll {
    # Mock transitive dependency so config.ps1 loads cleanly
    function Invoke-Claude { }
    . "$PSScriptRoot/../utils/config.ps1"
}

# ─────────────────────────────────────────────────────────────────────────────
# T1 — Review gate constants: ReviewerTimeoutSeconds & ReviewModeratorTimeoutSeconds
# BDD: Feature "New configuration values control review behavior with load-time validation"
#   Scenario: ReviewerTimeout defaults to 600 seconds
#   Scenario: ReviewModeratorTimeout defaults to 300 seconds
#   Scenario Outline: Config rejects zero or negative values (ReviewerTimeout=0, ReviewModeratorTimeout=0)
#   Scenario: Config rejects ReviewGateTimeout less than ReviewerTimeout
#   Scenario Outline: Config accepts boundary-valid values (ReviewerTimeout=1)
# TLA: CONSTANTS referenced in glossary as ReviewerTimeout, ReviewModeratorTimeout
# ─────────────────────────────────────────────────────────────────────────────

Describe 'ReviewerTimeoutSeconds in $Config' {
    It 'has ReviewerTimeoutSeconds key with default value 600' {
        $Config.Keys | Should -Contain 'ReviewerTimeoutSeconds'
        $Config.ReviewerTimeoutSeconds | Should -Be 600
    }

    It 'has ReviewModeratorTimeoutSeconds key with default value 300' {
        $Config.Keys | Should -Contain 'ReviewModeratorTimeoutSeconds'
        $Config.ReviewModeratorTimeoutSeconds | Should -Be 300
    }
}

Describe 'Get-PipelineConfig reviewer timeout defaults' {
    BeforeEach {
        $env:VIBE_REVIEWER_TIMEOUT_SECONDS          = $null
        $env:VIBE_REVIEW_MODERATOR_TIMEOUT_SECONDS   = $null
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS        = $null
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS           = $null
        $env:VIBE_MAX_REVIEW_ROUNDS                  = $null
        $env:VIBE_MAX_KEEP_GOING_RESETS              = $null
        $env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE        = $null
        $env:VIBE_NUM_TASKS                          = $null
    }

    AfterEach {
        $env:VIBE_REVIEWER_TIMEOUT_SECONDS          = $null
        $env:VIBE_REVIEW_MODERATOR_TIMEOUT_SECONDS   = $null
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS        = $null
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS           = $null
        $env:VIBE_MAX_REVIEW_ROUNDS                  = $null
        $env:VIBE_MAX_KEEP_GOING_RESETS              = $null
        $env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE        = $null
        $env:VIBE_NUM_TASKS                          = $null
    }

    It 'snapshot contains ReviewerTimeoutSeconds = 600' {
        $cfg = Get-PipelineConfig
        $cfg['ReviewerTimeoutSeconds'] | Should -Be 600
    }

    It 'snapshot contains ReviewModeratorTimeoutSeconds = 300' {
        $cfg = Get-PipelineConfig
        $cfg['ReviewModeratorTimeoutSeconds'] | Should -Be 300
    }
}

Describe 'Reviewer timeout env var overrides' {
    AfterEach {
        $env:VIBE_REVIEWER_TIMEOUT_SECONDS          = $null
        $env:VIBE_REVIEW_MODERATOR_TIMEOUT_SECONDS   = $null
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS        = $null
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS           = $null
    }

    It 'VIBE_REVIEWER_TIMEOUT_SECONDS overrides ReviewerTimeoutSeconds' {
        $env:VIBE_REVIEWER_TIMEOUT_SECONDS = '900'
        $cfg = Get-PipelineConfig
        $cfg['ReviewerTimeoutSeconds'] | Should -Be 900
    }

    It 'VIBE_REVIEW_MODERATOR_TIMEOUT_SECONDS overrides ReviewModeratorTimeoutSeconds' {
        $env:VIBE_REVIEW_MODERATOR_TIMEOUT_SECONDS = '600'
        $cfg = Get-PipelineConfig
        $cfg['ReviewModeratorTimeoutSeconds'] | Should -Be 600
    }
}

Describe 'Reviewer timeout validation rejects invalid values' {
    AfterEach {
        $env:VIBE_REVIEWER_TIMEOUT_SECONDS          = $null
        $env:VIBE_REVIEW_MODERATOR_TIMEOUT_SECONDS   = $null
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS        = $null
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS           = $null
    }

    It 'throws when ReviewerTimeoutSeconds is 0' {
        $env:VIBE_REVIEWER_TIMEOUT_SECONDS = '0'
        { Get-PipelineConfig } | Should -Throw '*ReviewerTimeoutSeconds*must be*positive*'
    }

    It 'throws when ReviewerTimeoutSeconds is negative' {
        $env:VIBE_REVIEWER_TIMEOUT_SECONDS = '-1'
        { Get-PipelineConfig } | Should -Throw '*ReviewerTimeoutSeconds*must be*positive*'
    }

    It 'throws when ReviewModeratorTimeoutSeconds is 0' {
        $env:VIBE_REVIEW_MODERATOR_TIMEOUT_SECONDS = '0'
        { Get-PipelineConfig } | Should -Throw '*ReviewModeratorTimeoutSeconds*must be*positive*'
    }

    It 'throws when ReviewModeratorTimeoutSeconds is negative' {
        $env:VIBE_REVIEW_MODERATOR_TIMEOUT_SECONDS = '-1'
        { Get-PipelineConfig } | Should -Throw '*ReviewModeratorTimeoutSeconds*must be*positive*'
    }
}

Describe 'Cross-field: ReviewGateTimeoutSeconds >= ReviewerTimeoutSeconds' {
    AfterEach {
        $env:VIBE_REVIEWER_TIMEOUT_SECONDS          = $null
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS        = $null
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS           = $null
    }

    It 'throws when ReviewGateTimeoutSeconds < ReviewerTimeoutSeconds' {
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = '300'
        $env:VIBE_REVIEWER_TIMEOUT_SECONDS = '600'
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS = '7200'
        { Get-PipelineConfig } | Should -Throw '*ReviewGateTimeoutSeconds*300*must be*ReviewerTimeoutSeconds*600*'
    }

    It 'accepts ReviewGateTimeoutSeconds equal to ReviewerTimeoutSeconds' {
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = '600'
        $env:VIBE_REVIEWER_TIMEOUT_SECONDS = '600'
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS = '7200'
        $cfg = Get-PipelineConfig
        $cfg['ReviewGateTimeoutSeconds'] | Should -Be 600
        $cfg['ReviewerTimeoutSeconds'] | Should -Be 600
    }

    It 'accepts ReviewGateTimeoutSeconds greater than ReviewerTimeoutSeconds' {
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS = '1800'
        $env:VIBE_REVIEWER_TIMEOUT_SECONDS = '600'
        $cfg = Get-PipelineConfig
        $cfg['ReviewGateTimeoutSeconds'] | Should -Be 1800
        $cfg['ReviewerTimeoutSeconds'] | Should -Be 600
    }
}

Describe 'Reviewer timeout boundary-valid values' {
    AfterEach {
        $env:VIBE_REVIEWER_TIMEOUT_SECONDS          = $null
        $env:VIBE_REVIEW_MODERATOR_TIMEOUT_SECONDS   = $null
        $env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS        = $null
        $env:VIBE_PIPELINE_TIMEOUT_SECONDS           = $null
    }

    It 'accepts ReviewerTimeoutSeconds = 1' {
        $env:VIBE_REVIEWER_TIMEOUT_SECONDS = '1'
        $cfg = Get-PipelineConfig
        $cfg['ReviewerTimeoutSeconds'] | Should -Be 1
    }

    It 'accepts ReviewModeratorTimeoutSeconds = 1' {
        $env:VIBE_REVIEW_MODERATOR_TIMEOUT_SECONDS = '1'
        $cfg = Get-PipelineConfig
        $cfg['ReviewModeratorTimeoutSeconds'] | Should -Be 1
    }
}
