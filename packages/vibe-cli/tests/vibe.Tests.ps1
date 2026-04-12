BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
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

Describe 'debate-loop.ps1 debateSchema' {
    It 'has valid JSON debate schema' {
        $content = Get-Content "$PSScriptRoot/../utils/debate-loop.ps1" -Raw
        $schemaMatch = [regex]::Match($content, "(?s)\`$DebateSchema = @'`n(.+?)`n'@")
        $schemaMatch.Success | Should -BeTrue

        $schema = $schemaMatch.Groups[1].Value | ConvertFrom-Json
        $schema.type | Should -Be 'object'
        $schema.properties.result | Should -Not -BeNullOrEmpty
        $schema.required | Should -Contain 'result'
    }
}
