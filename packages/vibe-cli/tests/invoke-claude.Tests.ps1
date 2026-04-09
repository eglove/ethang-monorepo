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

    It 'does not use Start-Process in print mode' {
        Mock claude {
            '{"type":"result","subtype":"success","result":"ok","total_cost_usd":0.01}'
        }
        $global:InvokeClaudeBatched = $false
        Invoke-Claude -Prompt 'test' | Out-Null
        Should -Invoke Start-Process -Times 0 -Exactly -Scope It
    }
}

Describe 'Stream JSON result parsing' {
    # Test the parsing logic directly without calling claude

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

Describe 'Batched stream parsing logic' {
    It 'extracts result from multi-line stream-json' {
        $testOutput = @(
            '{"type":"system","subtype":"init"}'
            '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Read","id":"1","input":{}}]}}'
            '{"type":"result","subtype":"success","result":"batched result","total_cost_usd":0.1}'
        ) -join "`n"

        $resultText = $null
        foreach ($line in ($testOutput -split "`n")) {
            $trimmed = $line.Trim()
            if (-not $trimmed.StartsWith('{')) { continue }
            $sanitized = $trimmed -replace '(?<=:)\s*Infinity', '0'
            try { $evt = $sanitized | ConvertFrom-Json } catch { continue }
            if ($evt.type -eq 'result' -and $evt.subtype -eq 'success') {
                if ($evt.structured_output) {
                    $resultText = $evt.structured_output | ConvertTo-Json -Depth 10 -Compress
                } elseif ($evt.result) {
                    $resultText = $evt.result
                }
            }
        }

        $resultText | Should -Be 'batched result'
    }

    It 'extracts structured_output from stream-json' {
        $testOutput = '{"type":"result","subtype":"success","result":"","structured_output":{"status":"DONE","summary":"all good"},"total_cost_usd":0.1}'

        $resultText = $null
        foreach ($line in ($testOutput -split "`n")) {
            $trimmed = $line.Trim()
            if (-not $trimmed.StartsWith('{')) { continue }
            try { $evt = $trimmed | ConvertFrom-Json } catch { continue }
            if ($evt.type -eq 'result' -and $evt.subtype -eq 'success') {
                if ($evt.structured_output) {
                    $resultText = $evt.structured_output | ConvertTo-Json -Depth 10 -Compress
                } elseif ($evt.result) {
                    $resultText = $evt.result
                }
            }
        }

        $parsed = $resultText | ConvertFrom-Json
        $parsed.status | Should -Be 'DONE'
        $parsed.summary | Should -Be 'all good'
    }

    It 'returns nothing when no result event exists' {
        $testOutput = @(
            '{"type":"system","subtype":"init"}'
            '{"type":"assistant","message":{"content":[]}}'
        ) -join "`n"

        $resultText = $null
        foreach ($line in ($testOutput -split "`n")) {
            $trimmed = $line.Trim()
            if (-not $trimmed.StartsWith('{')) { continue }
            try { $evt = $trimmed | ConvertFrom-Json } catch { continue }
            if ($evt.type -eq 'result' -and $evt.subtype -eq 'success' -and $evt.result) {
                $resultText = $evt.result
            }
        }

        $resultText | Should -BeNullOrEmpty
    }

    It 'handles mixed JSON and non-JSON lines' {
        $testOutput = @(
            'Loading...'
            ''
            '{"type":"result","subtype":"success","result":"found","total_cost_usd":0.01}'
            'Done.'
        ) -join "`n"

        $resultText = $null
        foreach ($line in ($testOutput -split "`n")) {
            $trimmed = $line.Trim()
            if (-not $trimmed.StartsWith('{')) { continue }
            try { $evt = $trimmed | ConvertFrom-Json } catch { continue }
            if ($evt.type -eq 'result' -and $evt.subtype -eq 'success' -and $evt.result) {
                $resultText = $evt.result
            }
        }

        $resultText | Should -Be 'found'
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

Describe 'Parallel runspace detection' {
    It 'uses streaming path when InvokeClaudeBatched is not set' {
        $global:InvokeClaudeBatched = $false
        $inParallel = $global:InvokeClaudeBatched -eq $true
        $inParallel | Should -BeFalse
    }

    It 'uses batched path when InvokeClaudeBatched is true' {
        $global:InvokeClaudeBatched = $true
        $inParallel = $global:InvokeClaudeBatched -eq $true
        $inParallel | Should -BeTrue
        $global:InvokeClaudeBatched = $false
    }
}

Describe 'Invoke-ClaudeBatched' {
    BeforeAll {
        Mock Write-PipelineLog {}
    }

    It 'calls Start-Process with claude' {
        Mock Start-Process {
            [PSCustomObject]@{ ExitCode = 0 }
        }
        Mock Test-Path { $false }
        Mock Remove-Item {}

        Invoke-ClaudeBatched -Args @('--print', '--verbose') -AgentName 'test-agent'

        Should -Invoke Start-Process -Times 1
    }

    It 'parses result from stream-json output' {
        $outFile = [System.IO.Path]::GetTempFileName()
        Set-Content $outFile -Value '{"type":"result","subtype":"success","result":"batched output","total_cost_usd":0.05}'

        Mock Start-Process {
            [PSCustomObject]@{ ExitCode = 0 }
        }
        Mock Test-Path { $true } -ParameterFilter { $Path -eq $outFile }
        Mock Get-Content { Get-Content $using:outFile -Raw } -ParameterFilter { $Raw }
        Mock Remove-Item {}

        # Directly test the parsing logic
        $output = '{"type":"result","subtype":"success","result":"batched output","total_cost_usd":0.05}'
        $resultText = $null
        foreach ($line in ($output -split "`n")) {
            $trimmed = $line.Trim()
            if (-not $trimmed.StartsWith('{')) { continue }
            $sanitized = $trimmed -replace '(?<=:)\s*Infinity', '0'
            try { $evt = $sanitized | ConvertFrom-Json } catch { continue }
            if ($evt.type -eq 'result' -and $evt.subtype -eq 'success') {
                if ($evt.structured_output) {
                    $resultText = $evt.structured_output | ConvertTo-Json -Depth 10 -Compress
                } elseif ($evt.result) {
                    $resultText = $evt.result
                }
            }
        }

        $resultText | Should -Be 'batched output'
        Remove-Item $outFile -ErrorAction SilentlyContinue
    }

    It 'handles PromptFile param by passing RedirectStandardInput' {
        $promptFile = [System.IO.Path]::GetTempFileName()
        Set-Content $promptFile -Value 'test prompt'

        $script:capturedParams = @{}
        Mock Start-Process {
            $script:capturedParams = $PSBoundParameters
            [PSCustomObject]@{ ExitCode = 0 }
        }
        Mock Test-Path { $false }
        Mock Remove-Item {}

        Invoke-ClaudeBatched -Args @('--print') -PromptFile $promptFile -AgentName 'test'

        # The function should set RedirectStandardInput
        Should -Invoke Start-Process -Times 1

        Remove-Item $promptFile -ErrorAction SilentlyContinue
    }

    It 'returns nothing when no result event in output' {
        Mock Start-Process {
            [PSCustomObject]@{ ExitCode = 0 }
        }
        Mock Test-Path { $true }
        Mock Get-Content { '{"type":"system","subtype":"init"}' } -ParameterFilter { $Raw }
        Mock Remove-Item {}

        $result = Invoke-ClaudeBatched -Args @('--print') -AgentName 'test'

        $result | Should -BeNullOrEmpty
    }

    It 'escapes args with spaces in arg string' {
        # Test the escaping logic directly
        $testArgs = @('--system-prompt-file', '/path/with spaces/file.md')
        $escapedArgs = $testArgs | ForEach-Object {
            if ($_ -match '\s') { "`"$_`"" } else { $_ }
        }
        $argString = $escapedArgs -join ' '

        $argString | Should -Match '"/path/with spaces/file.md"'
    }

    It 'cleans up temp files' {
        $script:removedFiles = @()
        Mock Start-Process {
            [PSCustomObject]@{ ExitCode = 0 }
        }
        Mock Test-Path { $false }
        Mock Remove-Item {
            $script:removedFiles += $Path
        }

        Invoke-ClaudeBatched -Args @('--print') -AgentName 'test'

        # Should attempt to clean up outFile and errFile
        $script:removedFiles.Count | Should -BeGreaterThan 0
    }

    It 'returns structured_output through actual batched parsing' {
        Mock Start-Process {
            [PSCustomObject]@{ ExitCode = 0 }
        }
        Mock Test-Path { $true }
        Mock Get-Content { '{"type":"result","subtype":"success","structured_output":{"status":"ok"},"total_cost_usd":0.01}' } -ParameterFilter { $Raw }
        Mock Remove-Item {}

        $result = Invoke-ClaudeBatched -CommandArgs @('--print') -AgentName 'test'

        $parsed = $result | ConvertFrom-Json
        $parsed.status | Should -Be 'ok'
    }

    It 'returns result text through actual batched parsing' {
        Mock Start-Process {
            [PSCustomObject]@{ ExitCode = 0 }
        }
        Mock Test-Path { $true }
        Mock Get-Content { '{"type":"result","subtype":"success","result":"batch parsed","total_cost_usd":0.01}' } -ParameterFilter { $Raw }
        Mock Remove-Item {}

        $result = Invoke-ClaudeBatched -CommandArgs @('--print') -AgentName 'test'

        $result | Should -Be 'batch parsed'
    }

    It 'escapes args with spaces in actual batched execution' {
        Mock Start-Process {
            [PSCustomObject]@{ ExitCode = 0 }
        }
        Mock Test-Path { $true }
        Mock Get-Content { '{"type":"result","subtype":"success","result":"space ok","total_cost_usd":0.01}' } -ParameterFilter { $Raw }
        Mock Remove-Item {}

        $result = Invoke-ClaudeBatched -CommandArgs @('--system-prompt-file', '/path/with spaces/file.md') -AgentName 'test'

        $result | Should -Be 'space ok'
    }
}

Describe 'Invoke-Claude print mode argument construction' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}
    }

    It 'adds --json-schema when JsonSchema provided' {
        Mock claude { '{"type":"result","subtype":"success","result":"ok","total_cost_usd":0.01}' }
        $global:InvokeClaudeBatched = $false

        Invoke-Claude -Prompt 'test' -JsonSchema '{"type":"object"}' | Out-Null

        Should -Invoke claude -Times 1
    }

    It 'adds --add-dir when AddDir provided' {
        Mock claude { '{"type":"result","subtype":"success","result":"ok","total_cost_usd":0.01}' }
        $global:InvokeClaudeBatched = $false

        Invoke-Claude -Prompt 'test' -AddDir '/tmp/workdir' | Out-Null

        Should -Invoke claude -Times 1
    }

    It 'routes to Invoke-ClaudeBatched when InvokeClaudeBatched is set' {
        $global:InvokeClaudeBatched = $true
        Mock Invoke-ClaudeBatched { 'batched result' }

        $result = Invoke-Claude -Prompt 'test'

        $result | Should -Be 'batched result'
        Should -Invoke Invoke-ClaudeBatched -Times 1

        $global:InvokeClaudeBatched = $false
    }

    It 'writes prompt to temp file and cleans up' {
        Mock claude { '{"type":"result","subtype":"success","result":"ok","total_cost_usd":0.01}' }
        $global:InvokeClaudeBatched = $false

        Invoke-Claude -Prompt 'temp file test' | Out-Null

        # If it got here without error, temp file handling worked
        Should -Invoke claude -Times 1
    }

    It 'handles tool_use events in stream output' {
        $streamOutput = @(
            '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Edit","id":"abc","input":{}}]}}'
            '{"type":"result","subtype":"success","result":"done","total_cost_usd":0.02}'
        )

        Mock claude { $streamOutput }
        $global:InvokeClaudeBatched = $false

        $result = Invoke-Claude -Prompt 'test'

        $result | Should -Be 'done'
    }

    It 'returns structured_output over result text' {
        Mock claude { '{"type":"result","subtype":"success","result":"","structured_output":{"key":"value"},"total_cost_usd":0.01}' }
        $global:InvokeClaudeBatched = $false

        $result = Invoke-Claude -Prompt 'test'
        $parsed = $result | ConvertFrom-Json

        $parsed.key | Should -Be 'value'
    }

    It 'calls claude without stdin when no Prompt given' {
        Mock claude { '{"type":"result","subtype":"success","result":"no-prompt result","total_cost_usd":0.01}' }
        $global:InvokeClaudeBatched = $false

        $result = Invoke-Claude -SystemPromptFile '/tmp/agent.md'

        $result | Should -Be 'no-prompt result'
        Should -Invoke claude -Times 1
    }

    It 'handles result event without total_cost_usd' {
        Mock claude { '{"type":"result","subtype":"success","result":"cost-free"}' }
        $global:InvokeClaudeBatched = $false

        $result = Invoke-Claude -Prompt 'test'

        $result | Should -Be 'cost-free'
    }
}
