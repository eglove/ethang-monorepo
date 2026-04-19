BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
}

Describe 'vibe.ps1 parameter validation' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}
        Mock Set-Content {}
    }

    It 'throws when no Seed provided for fresh run' {
        { & "$PSScriptRoot/../vibe.ps1" } |
            Should -Throw '*seed prompt is required*'
    }

    It 'throws when both Seed and -Resume are provided' {
        { & "$PSScriptRoot/../vibe.ps1" "test seed" -Resume } |
            Should -Throw '*Cannot specify both*'
    }
}

Describe 'vibe.ps1 bus initialization' {
    BeforeEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }
    AfterEach {
        Remove-Item Env:VIBE_BUS_STAGE2    -ErrorAction SilentlyContinue
        Remove-Item Env:VIBE_BUS_ALL_STAGES -ErrorAction SilentlyContinue
    }

    It 'loads bus infrastructure when VIBE_BUS_STAGE2=1 (then throws on missing seed)' {
        $env:VIBE_BUS_STAGE2 = '1'
        { & "$PSScriptRoot/../vibe.ps1" } |
            Should -Throw '*seed prompt is required*'
    }

    It 'loads bus infrastructure when VIBE_BUS_ALL_STAGES=1 (then throws on missing seed)' {
        $env:VIBE_BUS_ALL_STAGES = '1'
        { & "$PSScriptRoot/../vibe.ps1" } |
            Should -Throw '*seed prompt is required*'
    }
}

