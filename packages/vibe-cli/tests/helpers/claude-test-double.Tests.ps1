BeforeAll {
    . "$PSScriptRoot/../helpers/claude-test-double.ps1"
    . "$PSScriptRoot/../../utils/invoke-claude.ps1"
}

Describe 'Invoke-ClaudeTestDouble' {
    It 'has the same parameter names as real Invoke-Claude' {
        $realParams = (Get-Command Invoke-Claude).Parameters.Keys | Where-Object { $_ -notmatch '^(Verbose|Debug|ErrorAction|Warning|Information|OutVariable|OutBuffer|PipelineVariable)' }
        $testParams = (Get-Command Invoke-ClaudeTestDouble).Parameters.Keys | Where-Object { $_ -notmatch '^(Verbose|Debug|ErrorAction|Warning|Information|OutVariable|OutBuffer|PipelineVariable)' }

        foreach ($param in $realParams) {
            $testParams | Should -Contain $param -Because "test double must match real Invoke-Claude parameter '$param'"
        }
    }

    It 'returns correct schema shape' {
        $result = Invoke-ClaudeTestDouble -SystemPromptFile 'test.md' -Prompt 'hello'
        $result.Keys | Should -Contain 'content'
        $result.Keys | Should -Contain 'filesModified'
        $result.Keys | Should -Contain 'exitCode'
        $result.Keys | Should -Contain 'cost'
    }

    It 'accepts parameter binding without errors' {
        { Invoke-ClaudeTestDouble -SystemPromptFile 'agent.md' -Prompt 'do something' -JsonSchema '{}' } | Should -Not -Throw
    }

    It 'supports sequential response injection pattern' {
        $responses = @(
            @{ content = '{"verdict":"revised"}'; exitCode = 0; filesModified = @(); cost = 0.01 }
            @{ content = '{"filesModified":[]}'; exitCode = 0; filesModified = @(); cost = 0.02 }
        )
        $callIndex = 0
        Mock Invoke-ClaudeTestDouble { $responses[$script:callIndex++] }

        $r1 = Invoke-ClaudeTestDouble -Prompt 'first'
        $r1.content | Should -Match 'verdict'
        $r2 = Invoke-ClaudeTestDouble -Prompt 'second'
        $r2.content | Should -Match 'filesModified'
    }
}
