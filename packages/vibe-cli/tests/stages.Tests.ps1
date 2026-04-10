BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/debate-loop.ps1"
    . "$PSScriptRoot/../utils/tlc-runner.ps1"
    . "$PSScriptRoot/../utils/review-runner.ps1"
    . "$PSScriptRoot/../stages/1-elicitor.ps1"
    . "$PSScriptRoot/../stages/2-bdd-writer.ps1"
    . "$PSScriptRoot/../stages/3-bdd-debate.ps1"
    . "$PSScriptRoot/../stages/4-tla-writer.ps1"
    . "$PSScriptRoot/../stages/5-tla-debate.ps1"
    . "$PSScriptRoot/../stages/6-implementation-writer.ps1"
    . "$PSScriptRoot/../stages/7-implementation-debate.ps1"
    . "$PSScriptRoot/../stages/9-global-review.ps1"
}

Describe 'Invoke-Elicitor' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}
        Mock Invoke-Claude {}

        $script:tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "stage-test-$(Get-Random)"
        $script:docsDir = Join-Path $script:tempRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $script:docsDir -Force | Out-Null
    }

    AfterAll {
        Remove-Item $script:tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Invoke-Claude in interactive mode' {
        Set-Content (Join-Path $script:docsDir 'elicitor.md') -Value '# Briefing content'

        # Create the agent file
        $agentDir = Join-Path $script:tempRoot 'agents/doc-writers'
        New-Item -ItemType Directory -Path $agentDir -Force | Out-Null
        Set-Content (Join-Path $agentDir 'elicitor.md') -Value 'elicitor prompt'

        $result = Invoke-Elicitor -Seed 'test seed' -Root $script:tempRoot

        $result.FeatureDir | Should -Be $script:docsDir
        $result.Briefing | Should -Match 'Briefing content'
        Should -Invoke Invoke-Claude -Times 1
    }

    It 'throws when no elicitor output found' {
        $emptyRoot = Join-Path $script:tempRoot 'empty-root'
        $emptyDocs = Join-Path $emptyRoot 'docs'
        New-Item -ItemType Directory -Path $emptyDocs -Force | Out-Null

        $agentDir = Join-Path $emptyRoot 'agents/doc-writers'
        New-Item -ItemType Directory -Path $agentDir -Force | Out-Null
        Set-Content (Join-Path $agentDir 'elicitor.md') -Value 'prompt'

        { Invoke-Elicitor -Seed 'test' -Root $emptyRoot } |
            Should -Throw '*No elicitor output*'
    }
}

Describe 'Invoke-BddWriter' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "bdd-writer-test-$(Get-Random)"
        $script:featureDir = Join-Path $script:tempRoot 'docs/feat'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null

        $agentDir = Join-Path $script:tempRoot 'agents/doc-writers'
        New-Item -ItemType Directory -Path $agentDir -Force | Out-Null
        Set-Content (Join-Path $agentDir 'bdd-writer.md') -Value 'bdd prompt'
    }

    AfterAll {
        Remove-Item $script:tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns the gherkin file path when writer produces output' {
        Mock Invoke-Claude {}

        Set-Content (Join-Path $script:featureDir 'bdd.feature') -Value 'Feature: test'

        $result = Invoke-BddWriter -Briefing 'test briefing' -FeatureDir $script:featureDir -Root $script:tempRoot

        $result | Should -Match 'bdd\.feature'
        Should -Invoke Invoke-Claude -Times 1
    }

    It 'throws when writer does not produce bdd.feature' {
        Mock Invoke-Claude {}
        Remove-Item (Join-Path $script:featureDir 'bdd.feature') -ErrorAction SilentlyContinue

        { Invoke-BddWriter -Briefing 'test' -FeatureDir $script:featureDir -Root $script:tempRoot } |
            Should -Throw '*did not produce*'
    }
}

Describe 'Invoke-BddDebate' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "bdd-debate-test-$(Get-Random)"
        $script:featureDir = Join-Path $script:tempRoot 'docs/feat'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null

        $agentDir = Join-Path $script:tempRoot 'agents'
        New-Item -ItemType Directory -Path "$agentDir/doc-writers" -Force | Out-Null
        Set-Content (Join-Path $agentDir 'debate-moderator.md') -Value 'mod prompt'
        Set-Content (Join-Path $agentDir 'doc-writers/bdd-writer.md') -Value 'writer prompt'

        Set-Content (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'

        $script:gherkinFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content $script:gherkinFile -Value 'Feature: test'

        $script:debateSchema = '{"type":"object","properties":{"result":{"type":"string"},"rounds":{"type":"integer"},"experts":{"type":"array","items":{"type":"string"}},"recommendation":{"type":"string"},"objections":{"type":"array","items":{"type":"string"}},"sessionFile":{"type":"string"}},"required":["result","rounds","experts","recommendation","objections","sessionFile"]}'
    }

    AfterAll {
        Remove-Item $script:tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Invoke-DebateLoop with correct parameters' {
        Mock Invoke-DebateLoop {
            @{ result = 'CONSENSUS_REACHED' }
        }

        Invoke-BddDebate `
            -GherkinFile $script:gherkinFile `
            -Briefing 'test briefing' `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot `
            -DebateSchema $script:debateSchema

        Should -Invoke Invoke-DebateLoop -Times 1
    }

    It 'BuildRevisionPrompt closure includes briefing and artifact content' {
        $script:capturedRevision = $null
        Mock Invoke-DebateLoop {
            $revision = & $BuildRevisionPrompt 'current scenarios' 'missing edge case'
            $script:capturedRevision = $revision
            @{ result = 'CONSENSUS_REACHED' }
        }

        Invoke-BddDebate `
            -GherkinFile $script:gherkinFile `
            -Briefing 'test briefing' `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot `
            -DebateSchema $script:debateSchema

        $script:capturedRevision | Should -Match 'test briefing'
        $script:capturedRevision | Should -Match 'current scenarios'
        $script:capturedRevision | Should -Match 'missing edge case'
    }
}

Describe 'Invoke-TlaWriter' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "tla-writer-test-$(Get-Random)"
        $script:featureDir = Join-Path $script:tempRoot 'docs/feat'
        $script:tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $script:tlaDir -Force | Out-Null

        $agentDir = Join-Path $script:tempRoot 'agents/doc-writers'
        New-Item -ItemType Directory -Path $agentDir -Force | Out-Null
        Set-Content (Join-Path $agentDir 'tla-writer.md') -Value 'tla prompt'

        $script:gherkinFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content $script:gherkinFile -Value 'Feature: test'
    }

    AfterAll {
        Remove-Item $script:tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Invoke-Claude and Invoke-TlcCheck then returns TlaFile and TlaDir' {
        Mock Invoke-Claude {}
        Mock Invoke-TlcCheck {}

        Set-Content (Join-Path $script:tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'

        $result = Invoke-TlaWriter -GherkinFile $script:gherkinFile -FeatureDir $script:featureDir -Root $script:tempRoot

        $result.TlaFile | Should -Not -BeNullOrEmpty
        $result.TlaDir | Should -Match 'tla$'
        Should -Invoke Invoke-Claude -Times 1
        Should -Invoke Invoke-TlcCheck -Times 1
    }
}

Describe 'Invoke-TlaDebate' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "tla-debate-test-$(Get-Random)"
        $script:featureDir = Join-Path $script:tempRoot 'docs/feat'
        $script:tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $script:tlaDir -Force | Out-Null

        $agentDir = Join-Path $script:tempRoot 'agents'
        New-Item -ItemType Directory -Path "$agentDir/doc-writers" -Force | Out-Null
        Set-Content (Join-Path $agentDir 'debate-moderator.md') -Value 'mod'
        Set-Content (Join-Path $agentDir 'doc-writers/tla-writer.md') -Value 'writer'

        Set-Content (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'

        $script:gherkinFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content $script:gherkinFile -Value 'Feature: test'

        $script:tlaFile = Get-Item (Join-Path $script:tlaDir 'Spec.tla') -ErrorAction SilentlyContinue
        if (-not $script:tlaFile) {
            Set-Content (Join-Path $script:tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
            $script:tlaFile = Get-Item (Join-Path $script:tlaDir 'Spec.tla')
        }

        $script:debateSchema = '{"type":"object","properties":{"result":{"type":"string"}}}'
    }

    AfterAll {
        Remove-Item $script:tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Invoke-DebateLoop with PostRevision that runs TLC' {
        Mock Invoke-DebateLoop {
            @{ result = 'CONSENSUS_REACHED' }
        }
        Mock Invoke-TlcCheck {}

        # Create the utils/tlc-runner.ps1 file that TlaDebate sources at runtime
        $utilsDir = Join-Path $script:tempRoot 'utils'
        New-Item -ItemType Directory -Path $utilsDir -Force | Out-Null
        Set-Content (Join-Path $utilsDir 'tlc-runner.ps1') -Value 'function Invoke-TlcCheck { param([string]$TlaDir, [string]$TlaWriterFile, [string]$FixContext) }'

        Invoke-TlaDebate `
            -TlaFile $script:tlaFile `
            -TlaDir $script:tlaDir `
            -GherkinFile $script:gherkinFile `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot `
            -DebateSchema $script:debateSchema

        Should -Invoke Invoke-DebateLoop -Times 1
    }

    It 'BuildRevisionPrompt closure includes gherkin and spec content' {
        $script:capturedRevision = $null
        Mock Invoke-DebateLoop {
            $revision = & $BuildRevisionPrompt 'current spec' 'invariant missing'
            $script:capturedRevision = $revision
            @{ result = 'CONSENSUS_REACHED' }
        }

        $utilsDir = Join-Path $script:tempRoot 'utils'
        New-Item -ItemType Directory -Path $utilsDir -Force | Out-Null
        Set-Content (Join-Path $utilsDir 'tlc-runner.ps1') -Value 'function Invoke-TlcCheck { param([string]$TlaDir, [string]$TlaWriterFile, [string]$FixContext) }'

        Invoke-TlaDebate `
            -TlaFile $script:tlaFile `
            -TlaDir $script:tlaDir `
            -GherkinFile $script:gherkinFile `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot `
            -DebateSchema $script:debateSchema

        $script:capturedRevision | Should -Match 'Feature: test'
        $script:capturedRevision | Should -Match 'current spec'
        $script:capturedRevision | Should -Match 'invariant missing'
    }

    It 'passes and executes PostRevision scriptblock in Invoke-DebateLoop' {
        $script:receivedPostRevision = $null
        Mock Invoke-DebateLoop {
            $script:receivedPostRevision = $PostRevision
            # Execute the closure for code coverage — it calls the stub Invoke-TlcCheck
            if ($PostRevision) { try { & $PostRevision } catch {} }
            @{ result = 'CONSENSUS_REACHED' }
        }

        $utilsDir = Join-Path $script:tempRoot 'utils'
        New-Item -ItemType Directory -Path $utilsDir -Force | Out-Null
        Set-Content (Join-Path $utilsDir 'tlc-runner.ps1') -Value 'function Invoke-TlcCheck { param([string]$TlaDir, [string]$TlaWriterFile, [string]$FixContext) }'

        Invoke-TlaDebate `
            -TlaFile $script:tlaFile `
            -TlaDir $script:tlaDir `
            -GherkinFile $script:gherkinFile `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot `
            -DebateSchema $script:debateSchema

        $script:receivedPostRevision | Should -Not -BeNullOrEmpty
        $script:receivedPostRevision | Should -BeOfType [scriptblock]
    }
}

Describe 'Invoke-ImplementationWriter' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "impl-writer-test-$(Get-Random)"
        $script:featureDir = Join-Path $script:tempRoot 'docs/feat'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null

        $agentDir = Join-Path $script:tempRoot 'agents/doc-writers'
        New-Item -ItemType Directory -Path $agentDir -Force | Out-Null
        Set-Content (Join-Path $agentDir 'implementation-writer.md') -Value 'impl writer'

        $script:tlaFile = Join-Path $script:featureDir 'tla/Spec.tla'
        New-Item -ItemType Directory -Path (Join-Path $script:featureDir 'tla') -Force | Out-Null
        Set-Content $script:tlaFile -Value '---- MODULE Spec ----'
    }

    AfterAll {
        Remove-Item $script:tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns ImplFile and ImplJson when writer produces them' {
        Mock Invoke-Claude {
            # Simulate writer creating files
        }

        Set-Content (Join-Path $script:featureDir 'implementation-plan.md') -Value '# Plan'
        Set-Content (Join-Path $script:featureDir 'implementation-plan.json') -Value '{}'

        $result = Invoke-ImplementationWriter -TlaFile $script:tlaFile -FeatureDir $script:featureDir -Root $script:tempRoot

        $result.ImplFile | Should -Match 'implementation-plan\.md'
        $result.ImplJson | Should -Match 'implementation-plan\.json'
    }

    It 'throws when implementation-plan.md not produced' {
        Mock Invoke-Claude {}

        $emptyDir = Join-Path $script:tempRoot 'docs/empty'
        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null

        { Invoke-ImplementationWriter -TlaFile $script:tlaFile -FeatureDir $emptyDir -Root $script:tempRoot } |
            Should -Throw '*did not produce*'
    }

    It 'throws when implementation-plan.json not produced' {
        Mock Invoke-Claude {}

        $partialDir = Join-Path $script:tempRoot 'docs/partial'
        New-Item -ItemType Directory -Path $partialDir -Force | Out-Null
        Set-Content (Join-Path $partialDir 'implementation-plan.md') -Value '# Plan'

        { Invoke-ImplementationWriter -TlaFile $script:tlaFile -FeatureDir $partialDir -Root $script:tempRoot } |
            Should -Throw '*did not produce*'
    }
}

Describe 'Invoke-ImplementationDebate' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "impl-debate-test-$(Get-Random)"
        $script:featureDir = Join-Path $script:tempRoot 'docs/feat'
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null

        $agentDir = Join-Path $script:tempRoot 'agents'
        New-Item -ItemType Directory -Path "$agentDir/doc-writers" -Force | Out-Null
        Set-Content (Join-Path $agentDir 'debate-moderator.md') -Value 'mod'
        Set-Content (Join-Path $agentDir 'doc-writers/implementation-writer.md') -Value 'writer'

        Set-Content (Join-Path $script:featureDir 'elicitor.md') -Value '# Briefing'

        $tlaDir = Join-Path $script:featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        $script:tlaFile = Get-Item (Join-Path $tlaDir 'Spec.tla')

        $script:implFile = Join-Path $script:featureDir 'implementation-plan.md'
        $script:implJson = Join-Path $script:featureDir 'implementation-plan.json'
        Set-Content $script:implFile -Value '# Plan'
        Set-Content $script:implJson -Value '{}'

        $script:debateSchema = '{"type":"object","properties":{"result":{"type":"string"}}}'
    }

    AfterAll {
        Remove-Item $script:tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'calls Invoke-DebateLoop with correct parameters' {
        Mock Invoke-DebateLoop {
            @{ result = 'CONSENSUS_REACHED' }
        }

        Invoke-ImplementationDebate `
            -ImplFile $script:implFile `
            -ImplJson $script:implJson `
            -TlaFile $script:tlaFile `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot `
            -DebateSchema $script:debateSchema

        Should -Invoke Invoke-DebateLoop -Times 1
    }

    It 'BuildRevisionPrompt closure includes TLA spec and plan content' {
        $script:capturedRevision = $null
        Mock Invoke-DebateLoop {
            $revision = & $BuildRevisionPrompt 'current plan' 'step ordering wrong'
            $script:capturedRevision = $revision
            @{ result = 'CONSENSUS_REACHED' }
        }

        Invoke-ImplementationDebate `
            -ImplFile $script:implFile `
            -ImplJson $script:implJson `
            -TlaFile $script:tlaFile `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot `
            -DebateSchema $script:debateSchema

        $script:capturedRevision | Should -Match 'MODULE Spec'
        $script:capturedRevision | Should -Match 'current plan'
        $script:capturedRevision | Should -Match 'step ordering wrong'
    }
}

Describe 'Invoke-GlobalReview' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "global-review-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempRoot -Force | Out-Null

        $agentDir = Join-Path $script:tempRoot 'agents'
        New-Item -ItemType Directory -Path "$agentDir/code-writers" -Force | Out-Null
        New-Item -ItemType Directory -Path "$agentDir/reviewers" -Force | Out-Null
        Set-Content (Join-Path $agentDir 'code-writers/typescript-writer.md') -Value 'writer'
        Set-Content (Join-Path $agentDir 'reviewers/test-reviewer.md') -Value 'reviewer'
    }

    AfterAll {
        Remove-Item $script:tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'exits early when review passes on first round' {
        Mock Invoke-ReviewRunner {
            @{ Passed = $true; Issues = @(); BlockingCount = 0 }
        }

        Invoke-GlobalReview -IntegrationBranch 'feature/test' -Root $script:tempRoot

        Should -Invoke Invoke-ReviewRunner -Times 1
    }

    It 'fixes blocking issues and re-reviews' {
        $script:reviewCallCount = 0
        Mock Invoke-ReviewRunner {
            $script:reviewCallCount++
            if ($script:reviewCallCount -eq 1) {
                @{
                    Passed = $false
                    BlockingCount = 1
                    Issues = @(
                        @{ severity = 'critical'; weight = 9; file = 'a.ts'; line = 1; issue = 'bug'; recommendation = 'fix' }
                    )
                }
            } else {
                @{ Passed = $true; Issues = @(); BlockingCount = 0 }
            }
        }
        Mock Invoke-Claude {}

        # Override verify commands — [scriptblock]::Create() bypasses Pester mock scope
        $origLint = $Config.VerifyLint; $origTest = $Config.VerifyTest; $origTsc = $Config.VerifyTsc
        $Config.VerifyLint = '$global:LASTEXITCODE = 0'
        $Config.VerifyTest = '$global:LASTEXITCODE = 0'
        $Config.VerifyTsc  = '$global:LASTEXITCODE = 0'

        Invoke-GlobalReview -IntegrationBranch 'feature/test' -Root $script:tempRoot

        $Config.VerifyLint = $origLint; $Config.VerifyTest = $origTest; $Config.VerifyTsc = $origTsc

        Should -Invoke Invoke-Claude -Times 1
        Should -Invoke Invoke-ReviewRunner -Times 2
    }

    It 'stops after MaxGlobalFixRounds even with blocking issues' {
        Mock Invoke-ReviewRunner {
            @{
                Passed = $false
                BlockingCount = 1
                Issues = @(
                    @{ severity = 'high'; weight = 7; file = 'b.ts'; line = 5; issue = 'issue'; recommendation = 'fix' }
                )
            }
        }
        Mock Invoke-Claude {}

        $origMax = $Config.MaxGlobalFixRounds
        $origLint = $Config.VerifyLint; $origTest = $Config.VerifyTest; $origTsc = $Config.VerifyTsc
        $Config.MaxGlobalFixRounds = 2
        $Config.VerifyLint = '$global:LASTEXITCODE = 0'
        $Config.VerifyTest = '$global:LASTEXITCODE = 0'
        $Config.VerifyTsc  = '$global:LASTEXITCODE = 0'

        Invoke-GlobalReview -IntegrationBranch 'feature/test' -Root $script:tempRoot

        $Config.MaxGlobalFixRounds = $origMax
        $Config.VerifyLint = $origLint; $Config.VerifyTest = $origTest; $Config.VerifyTsc = $origTsc

        # Should stop after 2 rounds
        Should -Invoke Invoke-ReviewRunner -Times 2
    }

    It 'continues to next round when verify fails after fix' {
        $script:reviewCallCount = 0
        Mock Invoke-ReviewRunner {
            $script:reviewCallCount++
            if ($script:reviewCallCount -le 2) {
                @{
                    Passed = $false
                    BlockingCount = 1
                    Issues = @(
                        @{ severity = 'critical'; weight = 10; file = 'c.ts'; line = 1; issue = 'vuln'; recommendation = 'patch' }
                    )
                }
            } else {
                @{ Passed = $true; Issues = @(); BlockingCount = 0 }
            }
        }
        Mock Invoke-Claude {}

        $origMax = $Config.MaxGlobalFixRounds
        $origLint = $Config.VerifyLint; $origTest = $Config.VerifyTest; $origTsc = $Config.VerifyTsc
        $Config.MaxGlobalFixRounds = 3
        $Config.VerifyLint = '$global:LASTEXITCODE = 1'
        $Config.VerifyTest = '$global:LASTEXITCODE = 1'
        $Config.VerifyTsc  = '$global:LASTEXITCODE = 1'

        Invoke-GlobalReview -IntegrationBranch 'feature/test' -Root $script:tempRoot

        $Config.MaxGlobalFixRounds = $origMax
        $Config.VerifyLint = $origLint; $Config.VerifyTest = $origTest; $Config.VerifyTsc = $origTsc

        Should -Invoke Invoke-ReviewRunner -Times 3
    }
}
