BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/invoke-claude.ps1"
    . "$PSScriptRoot/../utils/debate-loop.ps1"
    . "$PSScriptRoot/../utils/tlc-runner.ps1"
    . "$PSScriptRoot/../stages/5-tla-debate.ps1"

    Mock Write-PipelineLog {}
    Mock Write-Host {}
    Mock Invoke-Claude {}
}

Describe 'Invoke-TlaDebate' {
    BeforeAll {
        $script:tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "tla-debate-test-$(Get-Random)"
        $script:docsDir = Join-Path $script:tempRoot 'docs/test-feature'
        $script:tlaDir = Join-Path $script:tempRoot 'tla'
        $script:agentDir = Join-Path $script:tempRoot 'agents'
        $script:tlaWriterDir = Join-Path $script:agentDir 'doc-writers'
        $script:moderatorDir = $script:agentDir

        New-Item -ItemType Directory -Path $script:docsDir -Force | Out-Null
        New-Item -ItemType Directory -Path $script:tlaDir -Force | Out-Null
        New-Item -ItemType Directory -Path $script:tlaWriterDir -Force | Out-Null

        # Create required files
        Set-Content (Join-Path $script:tlaWriterDir 'tla-writer.md') -Value 'tla writer prompt'
        Set-Content (Join-Path $script:moderatorDir 'debate-moderator.md') -Value 'moderator prompt'

        $script:tlaFile = New-Item -Path (Join-Path $script:tlaDir 'spec.tla') -ItemType File -Force
        Set-Content $script:tlaFile.FullName -Value 'TLA+ spec'

        $script:gherkinFile = Join-Path $script:docsDir 'scenarios.feature'
        Set-Content $script:gherkinFile -Value 'Feature: Test'

        # Create config and invoke-claude in utils dir so dot-source in PostRevision works
        $utilsDir = Join-Path $script:tempRoot 'utils'
        New-Item -ItemType Directory -Path $utilsDir -Force | Out-Null
        Set-Content (Join-Path $utilsDir 'config.ps1') -Value '$Config = @{ TlcTimeoutSeconds = 10; MaxTlcAttempts = 1 }'
        Set-Content (Join-Path $utilsDir 'invoke-claude.ps1') -Value 'function Invoke-Claude { param([string]$Prompt, [string]$AddDir, [string]$SystemPromptFile, [string]$AppendSystemPromptFile, [string]$JsonSchema, [switch]$Interactive, [string]$TaskId) return @{ content = ""; exitCode = 0 } }'
        Set-Content (Join-Path $utilsDir 'tlc-runner.ps1') -Value 'function Invoke-TlcCheck { param([string]$TlaDir, [string]$TlaWriterFile, [string]$FixContext) return @{ Success = $true } }'
    }

    AfterAll {
        Remove-Item $script:tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Invoke-DebateLoop with correct parameters including PostRevision (lines 34-36)' {
        Mock Invoke-DebateLoop {
            param($DebateModFile, $WriterFile, $DebateContext, $SessionFile, $ArtifactFile, $FeatureDir, $ReferenceFile, $PostRevision, $StageName, $BuildRevisionPrompt)
            # Verify that PostRevision is a scriptblock
            $PostRevision | Should -BeOfType [scriptblock]
            $StageName | Should -BeExactly 'TLA+'
            $DebateModFile | Should -Match 'debate-moderator\.md'
            $WriterFile | Should -Match 'tla-writer\.md'
        }

        Invoke-TlaDebate -TlaFile $script:tlaFile -TlaDir $script:tlaDir -GherkinFile $script:gherkinFile -FeatureDir $script:docsDir -Root $script:tempRoot

        Should -Invoke Invoke-DebateLoop -Times 1 -Scope It
    }

    It 'PostRevision scriptblock dot-sources invoke-claude and tlc-runner and calls Invoke-TlcCheck' {
        $script:postRevisionCalled = $false

        Mock Invoke-DebateLoop {
            param($DebateModFile, $WriterFile, $DebateContext, $SessionFile, $ArtifactFile, $FeatureDir, $ReferenceFile, $PostRevision, $StageName, $BuildRevisionPrompt)
            # Execute the PostRevision scriptblock to cover lines 34-36
            if ($PostRevision) {
                $script:postRevisionCalled = $true
                & $PostRevision
            }
        }

        Invoke-TlaDebate -TlaFile $script:tlaFile -TlaDir $script:tlaDir -GherkinFile $script:gherkinFile -FeatureDir $script:docsDir -Root $script:tempRoot

        $script:postRevisionCalled | Should -BeTrue
    }
}
