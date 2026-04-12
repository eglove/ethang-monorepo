BeforeAll {
    function Invoke-Claude { }
    . "$PSScriptRoot/../utils/response-parser.ps1"
}

Describe 'ConvertFrom-AgentResponse' {
    It 'parses pure JSON response' {
        $json = '{"filesModified": [{"path": "utils/config.ps1", "action": "modified"}], "summary": "done"}'
        $result = ConvertFrom-AgentResponse -Response $json
        $result.filesModified.Count | Should -Be 1
        $result.filesModified[0].path | Should -Be 'utils/config.ps1'
        $result.summary | Should -Be 'done'
    }

    It 'extracts JSON from markdown-wrapped response' {
        $markdown = @"
All tests pass already.

``````json
{"filesModified": [], "verdict": "already_implemented"}
``````
"@
        $result = ConvertFrom-AgentResponse -Response $markdown
        $result.filesModified.Count | Should -Be 0
        $result.verdict | Should -Be 'already_implemented'
    }

    It 'returns null for unparseable response' {
        $result = ConvertFrom-AgentResponse -Response 'just some plain text with no json'
        $result | Should -BeNullOrEmpty
    }

    It 'returns null for null input' {
        $result = ConvertFrom-AgentResponse -Response $null
        $result | Should -BeNullOrEmpty
    }

    It 'returns null for empty string' {
        $result = ConvertFrom-AgentResponse -Response ''
        $result | Should -BeNullOrEmpty
    }

    It 'extracts JSON with insight text before and after code block' {
        $response = @"
The implementation looks good.

`+ Insight: something educational

``````json
{"filesModified": [{"path": "tests/foo.Tests.ps1", "action": "created"}], "summary": "wrote tests"}
``````

More text after the block.
"@
        $result = ConvertFrom-AgentResponse -Response $response
        $result.filesModified[0].path | Should -Be 'tests/foo.Tests.ps1'
        $result.summary | Should -Be 'wrote tests'
    }

    It 'handles verdict field correctly' {
        $json = '{"verdict": "revised", "filesModified": []}'
        $result = ConvertFrom-AgentResponse -Response $json
        $result.verdict | Should -Be 'revised'
    }

    It 'extracts inline JSON from prose text' {
        $response = @"
`pnpm lint` passed with exit code 0.

{ "blame": "neither", "detail": "no failure detected" }
"@
        $result = ConvertFrom-AgentResponse -Response $response
        $result.blame | Should -Be 'neither'
    }

    It 'extracts inline JSON on same line as prose' {
        $response = 'Result: { "verdict": "pass" } done.'
        $result = ConvertFrom-AgentResponse -Response $response
        $result.verdict | Should -Be 'pass'
    }

    It 'picks last inline JSON object when multiple exist' {
        $response = @"
{ "x": 1 }
{ "blame": "test" }
"@
        $result = ConvertFrom-AgentResponse -Response $response
        $result.blame | Should -Be 'test'
    }
}
