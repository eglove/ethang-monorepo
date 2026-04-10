BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
}

Describe 'Invoke-Claude argument building' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Start-Process {}
    }

    It 'builds correct args for interactive mode with all params' {
        $script:capturedArgString = $null
        Mock Start-Process {
            $script:capturedArgString = $ArgumentList
        }

        Invoke-Claude -Interactive `
            -AppendSystemPromptFile '/tmp/agent.md' `
            -Prompt 'hello world'

        $script:capturedArgString | Should -Match '--strict-mcp-config'
        $script:capturedArgString | Should -Match '--dangerously-skip-permissions'
        $script:capturedArgString | Should -Match '--append-system-prompt-file'
        $script:capturedArgString | Should -Match 'hello world'
    }

    It 'quotes args with spaces in interactive mode' {
        $script:capturedArgString = $null
        Mock Start-Process {
            $script:capturedArgString = $ArgumentList
        }

        Invoke-Claude -Interactive `
            -SystemPromptFile '/tmp/my agent.md' `
            -Prompt 'do something'

        $script:capturedArgString | Should -Match '"/tmp/my agent.md"'
    }

    It 'uses Start-Process in interactive mode' {
        Invoke-Claude -Interactive -Prompt 'hello'
        Should -Invoke Start-Process -Times 1
    }
}

Describe 'Stream JSON result parsing' {
    It 'extracts result text from a result event' {
        $line = '{"type":"result","subtype":"success","result":"hello world","total_cost_usd":0.05}'
        $evt = $line | ConvertFrom-Json

        $evt.type | Should -Be 'result'
        $evt.subtype | Should -Be 'success'
        $evt.result | Should -Be 'hello world'
    }

    It 'extracts structured_output when present' {
        $line = '{"type":"result","subtype":"success","result":"","structured_output":{"name":"test","value":42},"total_cost_usd":0.05}'
        $evt = $line | ConvertFrom-Json

        $evt.structured_output.name | Should -Be 'test'
        $evt.structured_output.value | Should -Be 42
    }

    It 'structured_output takes priority — result is empty when structured_output exists' {
        $line = '{"type":"result","subtype":"success","result":"","structured_output":{"key":"wins"},"total_cost_usd":0.05}'
        $evt = $line | ConvertFrom-Json

        $evt.result | Should -BeNullOrEmpty
        $evt.structured_output.key | Should -Be 'wins'
    }

    It 'identifies tool_use events in assistant messages' {
        $line = '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Read","id":"123","input":{}}]}}'
        $evt = $line | ConvertFrom-Json

        $evt.type | Should -Be 'assistant'
        $evt.message.content[0].type | Should -Be 'tool_use'
        $evt.message.content[0].name | Should -Be 'Read'
    }

    It 'skips non-JSON lines' {
        $lines = @('Loading plugins...', '', 'some text')
        foreach ($line in $lines) {
            $line.Trim().StartsWith('{') | Should -BeFalse
        }
    }

    It 'sanitizes Infinity values' {
        $raw = '{"type":"result","subtype":"success","result":"ok","total_cost_usd":Infinity}'
        $sanitized = $raw -replace '(?<=:)\s*Infinity', '0' -replace '(?<=:)\s*-Infinity', '0' -replace '(?<=:)\s*NaN', '0'
        $evt = $sanitized | ConvertFrom-Json

        $evt.result | Should -Be 'ok'
        $evt.total_cost_usd | Should -Be 0
    }

    It 'sanitizes -Infinity values' {
        $raw = '{"type":"result","subtype":"success","result":"ok","total_cost_usd":-Infinity}'
        $sanitized = $raw -replace '(?<=:)\s*Infinity', '0' -replace '(?<=:)\s*-Infinity', '0' -replace '(?<=:)\s*NaN', '0'
        $evt = $sanitized | ConvertFrom-Json

        $evt.total_cost_usd | Should -Be 0
    }

    It 'sanitizes NaN values' {
        $raw = '{"type":"result","subtype":"success","result":"ok","total_cost_usd":NaN}'
        $sanitized = $raw -replace '(?<=:)\s*Infinity', '0' -replace '(?<=:)\s*-Infinity', '0' -replace '(?<=:)\s*NaN', '0'
        $evt = $sanitized | ConvertFrom-Json

        $evt.total_cost_usd | Should -Be 0
    }
}

Describe 'Prompt temp file handling' {
    It 'writes prompt to a temp file' {
        $promptFile = [System.IO.Path]::GetTempFileName()
        [System.IO.File]::WriteAllText($promptFile, 'test prompt content')

        $content = Get-Content $promptFile -Raw
        $content | Should -Be 'test prompt content'

        Remove-Item $promptFile
    }

    It 'handles long prompts that exceed CLI limits' {
        $longPrompt = 'x' * 40000  # Over 32K Windows limit
        $promptFile = [System.IO.Path]::GetTempFileName()
        [System.IO.File]::WriteAllText($promptFile, $longPrompt)

        $content = Get-Content $promptFile -Raw
        $content.Length | Should -Be 40000

        Remove-Item $promptFile
    }
}

Describe 'Agent name extraction' {
    It 'extracts filename from SystemPromptFile path' {
        $name = Split-Path '/agents/doc-writers/bdd-writer.md' -Leaf
        $name | Should -Be 'bdd-writer.md'
    }

    It 'extracts filename from AppendSystemPromptFile path' {
        $name = Split-Path 'C:\vibe-cli\agents\doc-writers\elicitor.md' -Leaf
        $name | Should -Be 'elicitor.md'
    }

    It 'falls back to unknown when no prompt file' {
        $spf = $null
        $aspf = $null
        $name = if ($spf) { Split-Path $spf -Leaf } elseif ($aspf) { Split-Path $aspf -Leaf } else { 'unknown' }
        $name | Should -Be 'unknown'
    }
}

Describe 'Invoke-Claude streaming path' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}
    }

    AfterEach {
        Remove-Item Function:\claude -ErrorAction SilentlyContinue
    }

    It 'parses result with cost from stream output' {
        function global:claude {
            '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Edit","id":"x","input":{}}]}}'
            '{"type":"result","subtype":"success","result":"stream-ok","total_cost_usd":0.01}'
        }

        $result = Invoke-Claude -Prompt 'test'

        $result | Should -Be 'stream-ok'
    }

    It 'returns structured_output over result text' {
        function global:claude {
            '{"type":"result","subtype":"success","result":"","structured_output":{"key":"val"},"total_cost_usd":0.05}'
        }

        $result = Invoke-Claude -SystemPromptFile '/tmp/agent.md'
        $parsed = $result | ConvertFrom-Json

        $parsed.key | Should -Be 'val'
    }

    It 'handles result event without total_cost_usd' {
        function global:claude {
            '{"type":"result","subtype":"success","result":"no-cost"}'
        }

        $result = Invoke-Claude -Prompt 'test'

        $result | Should -Be 'no-cost'
    }

    It 'includes --json-schema when JsonSchema provided' {
        $script:capturedArgs = $null
        function global:claude {
            $script:capturedArgs = $args
            '{"type":"result","subtype":"success","result":"ok","total_cost_usd":0.01}'
        }

        Invoke-Claude -Prompt 'test' -JsonSchema '{"type":"object"}'

        $script:capturedArgs | Should -Contain '--json-schema'
    }

    It 'includes --add-dir when AddDir provided' {
        $script:capturedArgs = $null
        function global:claude {
            $script:capturedArgs = $args
            '{"type":"result","subtype":"success","result":"ok","total_cost_usd":0.01}'
        }

        Invoke-Claude -Prompt 'test' -AddDir '/tmp/workdir'

        $script:capturedArgs | Should -Contain '--add-dir'
    }

    It 'includes --system-prompt-file in args' {
        $script:capturedArgs = $null
        function global:claude {
            $script:capturedArgs = $args
            '{"type":"result","subtype":"success","result":"ok","total_cost_usd":0.01}'
        }

        Invoke-Claude -Prompt 'test' -SystemPromptFile '/tmp/agent.md'

        $script:capturedArgs | Should -Contain '--system-prompt-file'
    }

    It 'returns nothing when no result event' {
        function global:claude {
            '{"type":"system","subtype":"init"}'
            '{"type":"assistant","message":{"content":[]}}'
        }

        $result = Invoke-Claude -Prompt 'test'

        $result | Should -BeNullOrEmpty
    }
}
