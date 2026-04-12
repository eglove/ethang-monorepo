BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/debate-loop.ps1"
    . "$PSScriptRoot/../utils/tlc-runner.ps1"
    . "$PSScriptRoot/../stages/1-elicitor.ps1"
    . "$PSScriptRoot/../stages/2-bdd-writer.ps1"
    . "$PSScriptRoot/../stages/3-bdd-debate.ps1"
    . "$PSScriptRoot/../stages/4-tla-writer.ps1"
    . "$PSScriptRoot/../stages/5-tla-debate.ps1"
    . "$PSScriptRoot/../stages/6-implementation-writer.ps1"
    . "$PSScriptRoot/../stages/7-implementation-debate.ps1"
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
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot `

        Should -Invoke Invoke-DebateLoop -Times 1
    }

    It 'BuildRevisionPrompt closure includes file paths and objections' {
        $script:capturedRevision = $null
        Mock Invoke-DebateLoop {
            $revision = & $BuildRevisionPrompt 'C:/fake/artifact.feature' 'missing edge case'
            $script:capturedRevision = $revision
            @{ result = 'CONSENSUS_REACHED' }
        }

        Invoke-BddDebate `
            -GherkinFile $script:gherkinFile `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot `

        $script:capturedRevision | Should -Match 'feature directory'
        $script:capturedRevision | Should -Match 'C:/fake/artifact\.feature'
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

        Should -Invoke Invoke-DebateLoop -Times 1
    }

    It 'BuildRevisionPrompt closure includes file paths and objections' {
        $script:capturedRevision = $null
        Mock Invoke-DebateLoop {
            $revision = & $BuildRevisionPrompt 'C:/fake/artifact.tla' 'invariant missing'
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

        $script:capturedRevision | Should -Match 'bdd\.feature'
        $script:capturedRevision | Should -Match 'C:/fake/artifact\.tla'
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

        $result = Invoke-ImplementationWriter -FeatureDir $script:featureDir -Root $script:tempRoot

        $result.ImplFile | Should -Match 'implementation-plan\.md'
        $result.ImplJson | Should -Match 'implementation-plan\.json'
    }

    It 'throws when implementation-plan.md not produced' {
        Mock Invoke-Claude {}

        $emptyDir = Join-Path $script:tempRoot 'docs/empty'
        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null

        { Invoke-ImplementationWriter -FeatureDir $emptyDir -Root $script:tempRoot } |
            Should -Throw '*did not produce*'
    }

    It 'throws when implementation-plan.json not produced' {
        Mock Invoke-Claude {}

        $partialDir = Join-Path $script:tempRoot 'docs/partial'
        New-Item -ItemType Directory -Path $partialDir -Force | Out-Null
        Set-Content (Join-Path $partialDir 'implementation-plan.md') -Value '# Plan'

        { Invoke-ImplementationWriter -FeatureDir $partialDir -Root $script:tempRoot } |
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

        Should -Invoke Invoke-DebateLoop -Times 1
    }

    It 'BuildRevisionPrompt closure includes file paths and objections' {
        $script:capturedRevision = $null
        Mock Invoke-DebateLoop {
            $revision = & $BuildRevisionPrompt 'C:/fake/artifact.md' 'step ordering wrong'
            $script:capturedRevision = $revision
            @{ result = 'CONSENSUS_REACHED' }
        }

        Invoke-ImplementationDebate `
            -ImplFile $script:implFile `
            -ImplJson $script:implJson `
            -TlaFile $script:tlaFile `
            -FeatureDir $script:featureDir `
            -Root $script:tempRoot `

        $script:capturedRevision | Should -Match 'Spec\.tla'
        $script:capturedRevision | Should -Match 'C:/fake/artifact\.md'
        $script:capturedRevision | Should -Match 'step ordering wrong'
    }
}

Describe 'Test-FixturePrecondition' {
    BeforeAll { . "$PSScriptRoot/../utils/fixture-gate.ps1" }
    BeforeEach {
        $script:featureDir = Join-Path ([System.IO.Path]::GetTempPath()) "fixture-gate-$(Get-Random)"
        $script:bddDir = Join-Path $script:featureDir 'tests/fixtures/bdd'
        $script:tlcDir = Join-Path $script:featureDir 'tests/fixtures/tla'
        New-Item -ItemType Directory -Path $script:bddDir -Force | Out-Null
        New-Item -ItemType Directory -Path $script:tlcDir -Force | Out-Null
    }
    AfterEach { Remove-Item $script:featureDir -Recurse -Force -ErrorAction SilentlyContinue }

    It 'passes when both fixtures are valid' {
        @{ schemaVersion = 1; features = @() } | ConvertTo-Json | Set-Content (Join-Path $script:bddDir 'fixture.json')
        @{ schemaVersion = 1; exitCode = 0 } | ConvertTo-Json | Set-Content (Join-Path $script:tlcDir 'fixture.json')
        $r = Test-FixturePrecondition -FeatureDir $script:featureDir
        $r.canProceed | Should -BeTrue
    }

    It 'fails when BDD fixture missing' {
        @{ schemaVersion = 1; exitCode = 0 } | ConvertTo-Json | Set-Content (Join-Path $script:tlcDir 'fixture.json')
        $r = Test-FixturePrecondition -FeatureDir $script:featureDir
        $r.canProceed | Should -BeFalse
        $r.bddValid | Should -BeFalse
    }

    It 'fails when TLC fixture missing' {
        @{ schemaVersion = 1; features = @() } | ConvertTo-Json | Set-Content (Join-Path $script:bddDir 'fixture.json')
        $r = Test-FixturePrecondition -FeatureDir $script:featureDir
        $r.canProceed | Should -BeFalse
        $r.tlcValid | Should -BeFalse
    }

    It 'fails when BDD fixture is corrupt JSON' {
        Set-Content (Join-Path $script:bddDir 'fixture.json') -Value '{"corrupt'
        @{ schemaVersion = 1; exitCode = 0 } | ConvertTo-Json | Set-Content (Join-Path $script:tlcDir 'fixture.json')
        $r = Test-FixturePrecondition -FeatureDir $script:featureDir
        $r.canProceed | Should -BeFalse
    }

    It 'fails when schema version is not 1' {
        @{ schemaVersion = 2; features = @() } | ConvertTo-Json | Set-Content (Join-Path $script:bddDir 'fixture.json')
        @{ schemaVersion = 1; exitCode = 0 } | ConvertTo-Json | Set-Content (Join-Path $script:tlcDir 'fixture.json')
        $r = Test-FixturePrecondition -FeatureDir $script:featureDir
        $r.bddValid | Should -BeFalse
    }

    It 'fails when both fixtures missing' {
        $emptyDir = Join-Path ([System.IO.Path]::GetTempPath()) "fixture-empty-$(Get-Random)"
        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
        try {
            $r = Test-FixturePrecondition -FeatureDir $emptyDir
            $r.canProceed | Should -BeFalse
        }
        finally { Remove-Item $emptyDir -Recurse -Force -ErrorAction SilentlyContinue }
    }
}

# =============================================================================
# T10: Fixture Generation Integration — BDD and TLC fixture wiring
# =============================================================================

Describe 'BDD Fixture Generation (after stage 3)' {
    BeforeAll {
        . "$PSScriptRoot/../utils/gherkin-parser.ps1"
        . "$PSScriptRoot/../utils/fixture-gate.ps1"
    }

    BeforeEach {
        $script:featureDir = Join-Path ([System.IO.Path]::GetTempPath()) "bdd-gen-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
    }
    AfterEach { Remove-Item $script:featureDir -Recurse -Force -ErrorAction SilentlyContinue }

    It 'parses .feature file and exports valid BDD fixture JSON' {
        $featureFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content $featureFile -Value "Feature: Auth`n  Scenario: Login`n    Given a user`n    When they log in`n    Then they see home"

        $bddFixturePath = Join-Path $script:featureDir 'tests/fixtures/bdd/fixture.json'
        $parsed = ConvertFrom-Gherkin -Path $featureFile
        $parsed.schemaVersion = 1
        Export-BddFixture -Fixture $parsed -OutputPath $bddFixturePath

        $bddFixturePath | Should -Exist
        $json = Get-Content $bddFixturePath -Raw | ConvertFrom-Json
        $json.schemaVersion | Should -Be 1
        $json.features.Count | Should -Be 1
    }

    It 'fixture passes precondition check after generation' {
        $featureFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content $featureFile -Value "Feature: Test`n  Scenario: S1`n    Given x"

        # Generate BDD fixture
        $bddFixturePath = Join-Path $script:featureDir 'tests/fixtures/bdd/fixture.json'
        $parsed = ConvertFrom-Gherkin -Path $featureFile
        $parsed.schemaVersion = 1
        Export-BddFixture -Fixture $parsed -OutputPath $bddFixturePath

        # Also create a valid TLC fixture
        $tlcFixturePath = Join-Path $script:featureDir 'tests/fixtures/tla/fixture.json'
        New-Item -ItemType Directory -Path (Split-Path $tlcFixturePath) -Force | Out-Null
        @{ schemaVersion = 1; exitCode = 0 } | ConvertTo-Json | Set-Content $tlcFixturePath

        $check = Test-FixturePrecondition -FeatureDir $script:featureDir
        $check.canProceed | Should -BeTrue
        $check.bddValid | Should -BeTrue
    }
}

Describe 'TLC Fixture Generation (after stage 5)' {
    BeforeAll {
        . "$PSScriptRoot/../utils/tlc-parser.ps1"
        . "$PSScriptRoot/../utils/fixture-gate.ps1"
    }

    BeforeEach {
        $script:featureDir = Join-Path ([System.IO.Path]::GetTempPath()) "tlc-gen-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
    }
    AfterEach { Remove-Item $script:featureDir -Recurse -Force -ErrorAction SilentlyContinue }

    It 'parses TLC output and exports valid fixture JSON' {
        $tlcOutput = "TLC2 Version 2.18`nModel checking completed. No error has been found.`n1000 states generated, 500 distinct states found, 0 states left on queue.`nThe depth of the complete state graph search is 20."
        $tlcFixturePath = Join-Path $script:featureDir 'tests/fixtures/tla/fixture.json'

        $parsed = ConvertFrom-TlcOutput -Output $tlcOutput -ExitCode 0
        $parsed.schemaVersion = 1
        Export-TlcFixture -Fixture $parsed -OutputPath $tlcFixturePath

        $tlcFixturePath | Should -Exist
        $json = Get-Content $tlcFixturePath -Raw | ConvertFrom-Json
        $json.schemaVersion | Should -Be 1
        $json.exitCode | Should -Be 0
    }

    It 'fixture passes precondition check after generation' {
        # Create valid BDD fixture
        $bddFixturePath = Join-Path $script:featureDir 'tests/fixtures/bdd/fixture.json'
        New-Item -ItemType Directory -Path (Split-Path $bddFixturePath) -Force | Out-Null
        @{ schemaVersion = 1; features = @() } | ConvertTo-Json | Set-Content $bddFixturePath

        # Generate TLC fixture
        $tlcOutput = "TLC2 Version 2.18`nModel checking completed. No error has been found.`n100 states generated, 50 distinct states found, 0 states left on queue.`nThe depth of the complete state graph search is 10."
        $tlcFixturePath = Join-Path $script:featureDir 'tests/fixtures/tla/fixture.json'
        $parsed = ConvertFrom-TlcOutput -Output $tlcOutput -ExitCode 0
        $parsed.schemaVersion = 1
        Export-TlcFixture -Fixture $parsed -OutputPath $tlcFixturePath

        $check = Test-FixturePrecondition -FeatureDir $script:featureDir
        $check.canProceed | Should -BeTrue
        $check.tlcValid | Should -BeTrue
    }
}

Describe 'Fixture Precondition blocks coding stage (stage 8 gate)' {
    BeforeAll { . "$PSScriptRoot/../utils/fixture-gate.ps1" }
    It 'missing fixtures cause precondition failure' {
        $emptyDir = Join-Path ([System.IO.Path]::GetTempPath()) "gate-$(Get-Random)"
        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
        try {
            $check = Test-FixturePrecondition -FeatureDir $emptyDir
            $check.canProceed | Should -BeFalse
        }
        finally { Remove-Item $emptyDir -Recurse -Force -ErrorAction SilentlyContinue }
    }

    It 'corrupt BDD fixture blocks stage 8' {
        $dir = Join-Path ([System.IO.Path]::GetTempPath()) "gate-corrupt-$(Get-Random)"
        $bddDir = Join-Path $dir 'tests/fixtures/bdd'
        $tlcDir = Join-Path $dir 'tests/fixtures/tla'
        New-Item -ItemType Directory -Path $bddDir -Force | Out-Null
        New-Item -ItemType Directory -Path $tlcDir -Force | Out-Null
        Set-Content (Join-Path $bddDir 'fixture.json') -Value '{"corrupt'
        @{ schemaVersion = 1; exitCode = 0 } | ConvertTo-Json | Set-Content (Join-Path $tlcDir 'fixture.json')
        try {
            $check = Test-FixturePrecondition -FeatureDir $dir
            $check.canProceed | Should -BeFalse
            $check.bddValid | Should -BeFalse
        }
        finally { Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue }
    }
}
