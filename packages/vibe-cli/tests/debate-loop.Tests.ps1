BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
    . "$PSScriptRoot/../utils/debate-loop.ps1"

    function Update-DebateState { [CmdletBinding()] param([string]$FeatureName, [int]$Stage, [int]$Round, [string]$ConsensusStatus, [int]$MaxDebateRound = 10) }
    Mock Update-DebateState {}
}

Describe 'Invoke-DebateLoop' {
    BeforeAll {
        Mock Write-PipelineLog {}

        # Create temp files for briefing and artifact
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "debate-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        $script:briefingFile = Join-Path $script:tempDir 'elicitor.md'
        Set-Content $script:briefingFile -Value 'Test briefing content'

        $script:artifactFile = Join-Path $script:tempDir 'artifact.md'
        Set-Content $script:artifactFile -Value 'Test artifact content'

        $script:sessionFile = Join-Path $script:tempDir 'session.md'

        $script:modFile = Join-Path $script:tempDir 'moderator.md'
        Set-Content $script:modFile -Value 'moderator prompt'

        $script:writerFile = Join-Path $script:tempDir 'writer.md'
        Set-Content $script:writerFile -Value 'writer prompt'
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns immediately on CONSENSUS_REACHED with no objections' {
        Mock Invoke-Claude {
            '{"result":"CONSENSUS_REACHED","rounds":1,"experts":["expert-a"],"recommendation":"","objections":[],"sessionFile":"test.md"}'
        }

        $result = Invoke-DebateLoop `
            -DebateModFile $script:modFile `
            -WriterFile $script:writerFile `
            -DebateContext 'test context' `
            -SessionFile $script:sessionFile `
            -ArtifactFile $script:artifactFile `
            -FeatureDir $script:tempDir `
            -BuildRevisionPrompt { param($c, $o) "revise: $o" } `

        $result.result | Should -Be 'CONSENSUS_REACHED'
        # Writer should NOT be called — empty recommendation
        Should -Invoke Invoke-Claude -Times 1 -Exactly
    }

    It 'calls writer with recommendation on CONSENSUS_REACHED' {
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            if ($script:invokeCount -eq 1) {
                # Moderator returns consensus with recommendation
                '{"result":"CONSENSUS_REACHED","rounds":2,"experts":["a","b"],"recommendation":"Add 3 scenarios","objections":[],"sessionFile":"s.md"}'
            }
            # Second call is the writer applying the recommendation — return nothing
        }

        $result = Invoke-DebateLoop `
            -DebateModFile $script:modFile `
            -WriterFile $script:writerFile `
            -DebateContext 'test' `
            -SessionFile $script:sessionFile `
            -ArtifactFile $script:artifactFile `
            -FeatureDir $script:tempDir `
            -BuildRevisionPrompt { param($c, $o) "revise: $o" } `

        $result.result | Should -Be 'CONSENSUS_REACHED'
        # Moderator + writer = 2 calls
        Should -Invoke Invoke-Claude -Times 2 -Exactly
    }

    It 'loops on PARTIAL_CONSENSUS and calls writer with objections' {
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            if ($script:invokeCount -le 2) {
                # Round 1: partial consensus, then writer revises
                if ($script:invokeCount -eq 1) {
                    '{"result":"PARTIAL_CONSENSUS","rounds":1,"experts":["a"],"recommendation":"","objections":["fix X","fix Y"],"sessionFile":"s.md"}'
                }
                # invokeCount 2 = writer revision, no output needed
            }
            elseif ($script:invokeCount -eq 3) {
                # Round 2: consensus reached
                '{"result":"CONSENSUS_REACHED","rounds":2,"experts":["a"],"recommendation":"","objections":[],"sessionFile":"s.md"}'
            }
        }

        $result = Invoke-DebateLoop `
            -DebateModFile $script:modFile `
            -WriterFile $script:writerFile `
            -DebateContext 'test' `
            -SessionFile $script:sessionFile `
            -ArtifactFile $script:artifactFile `
            -FeatureDir $script:tempDir `
            -BuildRevisionPrompt { param($c, $o) "revise: $o" } `

        $result.result | Should -Be 'CONSENSUS_REACHED'
        # Round 1 moderator + writer + Round 2 moderator = 3
        Should -Invoke Invoke-Claude -Times 3 -Exactly
    }

    It 'retries on invalid JSON from moderator' {
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            if ($script:invokeCount -eq 1) {
                'not valid json at all'
            }
            else {
                '{"result":"CONSENSUS_REACHED","rounds":1,"experts":["a"],"recommendation":"","objections":[],"sessionFile":"s.md"}'
            }
        }

        $result = Invoke-DebateLoop `
            -DebateModFile $script:modFile `
            -WriterFile $script:writerFile `
            -DebateContext 'test' `
            -SessionFile $script:sessionFile `
            -ArtifactFile $script:artifactFile `
            -FeatureDir $script:tempDir `
            -BuildRevisionPrompt { param($c, $o) "revise: $o" } `

        $result.result | Should -Be 'CONSENSUS_REACHED'
        # First call returned junk, second succeeded
        $script:invokeCount | Should -Be 2
    }

    It 'calls PostRevision after consensus recommendation' {
        $script:postRevisionCalled = $false
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            if ($script:invokeCount -eq 1) {
                '{"result":"CONSENSUS_REACHED","rounds":1,"experts":["a"],"recommendation":"do the thing","objections":[],"sessionFile":"s.md"}'
            }
        }

        Invoke-DebateLoop `
            -DebateModFile $script:modFile `
            -WriterFile $script:writerFile `
            -DebateContext 'test' `
            -SessionFile $script:sessionFile `
            -ArtifactFile $script:artifactFile `
            -FeatureDir $script:tempDir `
            -BuildRevisionPrompt { param($c, $o) "revise: $o" } `
            -PostRevision { $script:postRevisionCalled = $true } `

        $script:postRevisionCalled | Should -BeTrue
    }

    It 'calls PostRevision after objection revision' {
        $script:postRevisionCount = 0
        $script:invokeCount = 0
        Mock Invoke-Claude {
            $script:invokeCount++
            if ($script:invokeCount -eq 1) {
                '{"result":"PARTIAL_CONSENSUS","rounds":1,"experts":["a"],"recommendation":"","objections":["fix it"],"sessionFile":"s.md"}'
            }
            elseif ($script:invokeCount -eq 3) {
                '{"result":"CONSENSUS_REACHED","rounds":2,"experts":["a"],"recommendation":"","objections":[],"sessionFile":"s.md"}'
            }
        }

        Invoke-DebateLoop `
            -DebateModFile $script:modFile `
            -WriterFile $script:writerFile `
            -DebateContext 'test' `
            -SessionFile $script:sessionFile `
            -ArtifactFile $script:artifactFile `
            -FeatureDir $script:tempDir `
            -BuildRevisionPrompt { param($c, $o) "revise: $o" } `
            -PostRevision { $script:postRevisionCount++ } `

        # Called once for the objection revision
        $script:postRevisionCount | Should -Be 1
    }

    It 'continues when Update-DebateState throws' {
        Mock Invoke-Claude {
            '{"result":"CONSENSUS_REACHED","rounds":1,"experts":["a"],"recommendation":"","objections":[],"sessionFile":"s.md"}'
        }
        Mock Update-DebateState { throw 'db unavailable' }

        $result = Invoke-DebateLoop `
            -DebateModFile $script:modFile `
            -WriterFile $script:writerFile `
            -DebateContext 'test' `
            -SessionFile $script:sessionFile `
            -ArtifactFile $script:artifactFile `
            -FeatureDir $script:tempDir `
            -BuildRevisionPrompt { param($c, $o) "revise: $o" } `

        $result.result | Should -Be 'CONSENSUS_REACHED'
    }

    It 'includes reference document path in prompt when ReferenceFile provided' {
        $refFile = Join-Path $script:tempDir 'ref.feature'
        Set-Content $refFile -Value 'BDD scenarios here'

        $script:capturedPrompt = $null
        Mock Invoke-Claude {
            param($SystemPromptFile, $JsonSchema, $Prompt)
            $script:capturedPrompt = $Prompt
            '{"result":"CONSENSUS_REACHED","rounds":1,"experts":["a"],"recommendation":"","objections":[],"sessionFile":"s.md"}'
        }

        Invoke-DebateLoop `
            -DebateModFile $script:modFile `
            -WriterFile $script:writerFile `
            -DebateContext 'test' `
            -SessionFile $script:sessionFile `
            -ArtifactFile $script:artifactFile `
            -FeatureDir $script:tempDir `
            -ReferenceFile $refFile `
            -BuildRevisionPrompt { param($c, $o) "revise: $o" } `

        $script:capturedPrompt | Should -Match 'Reference document'
        $script:capturedPrompt | Should -Match 'ref\.feature'
    }
}
