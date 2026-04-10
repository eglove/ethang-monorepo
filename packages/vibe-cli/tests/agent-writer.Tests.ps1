BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/result-contracts.ps1"
    . "$PSScriptRoot/../utils/task-log.ps1"
    . "$PSScriptRoot/../utils/agent-writer.ps1"
    . "$PSScriptRoot/helpers/claude-test-double.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Write-TaskLog {}
}

Describe 'Invoke-AgentWriter' {
    BeforeAll {
        $script:root = (Resolve-Path "$PSScriptRoot/..").Path
        $script:task = @{ id = 'T4'; title = 'Agent Prompts'; codeWriter = 'agent-writer'; files = @('agents/test.md') }
    }

    It 'returns completed on successful dispatch' {
        Mock Invoke-Claude { '{"filesModified":[],"summary":"done"}' }
        $result = Invoke-AgentWriter -Task $script:task -Root $script:root
        $result.Phase | Should -Be 'done'
        $result.Status | Should -Be 'completed'
        $result.Escalated | Should -BeFalse
    }

    It 'escalates on infrastructure failure' {
        Mock Invoke-Claude { throw 'exit code 127' }
        $result = Invoke-AgentWriter -Task $script:task -Root $script:root
        $result.Status | Should -Be 'escalated'
        $result.Escalated | Should -BeTrue
    }

    It 'escalates on null response' {
        Mock Invoke-Claude { $null }
        $result = Invoke-AgentWriter -Task $script:task -Root $script:root
        $result.Status | Should -Be 'escalated'
    }

    It 'calls Invoke-Claude exactly once' {
        Mock Invoke-Claude { '{"filesModified":[]}' }
        Invoke-AgentWriter -Task $script:task -Root $script:root
        Should -Invoke Invoke-Claude -Times 1
    }

    It 'does not call Invoke-VerifyCommand' {
        Mock Invoke-Claude { '{"filesModified":[]}' }
        Mock Invoke-VerifyCommand {}
        Invoke-AgentWriter -Task $script:task -Root $script:root
        Should -Not -Invoke Invoke-VerifyCommand
    }

    It 'skips re-dispatch when already completed' {
        $featDir = Join-Path ([System.IO.Path]::GetTempPath()) "aw-test-$(Get-Random)"
        $ticketsDir = Join-Path $featDir 'tickets'
        New-Item -ItemType Directory -Path $ticketsDir -Force | Out-Null
        Set-Content (Join-Path $ticketsDir 'T4-log.txt') -Value 'COMPLETED'

        Mock Invoke-Claude { '{"filesModified":[]}' }
        $result = Invoke-AgentWriter -Task $script:task -Root $script:root -FeatureDir $featDir
        $result.Status | Should -Be 'completed'
        Should -Not -Invoke Invoke-Claude

        Remove-Item $featDir -Recurse -Force
    }
}
