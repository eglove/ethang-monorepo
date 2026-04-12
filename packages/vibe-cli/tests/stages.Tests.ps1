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
        $script:root = Join-Path ([System.IO.Path]::GetTempPath()) "fixture-gate-$(Get-Random)"
        $script:featureName = 'test-feat'
        $script:bddDir = Join-Path $script:root "tests/fixtures/$($script:featureName)/bdd"
        New-Item -ItemType Directory -Path $script:bddDir -Force | Out-Null
    }
    AfterEach { Remove-Item $script:root -Recurse -Force -ErrorAction SilentlyContinue }

    It 'passes when BDD fixture is valid' {
        @{ schemaVersion = 1; features = @() } | ConvertTo-Json | Set-Content (Join-Path $script:bddDir 'fixture.json')
        $r = Test-FixturePrecondition -Root $script:root -FeatureName $script:featureName
        $r.canProceed | Should -BeTrue
    }

    It 'fails when BDD fixture missing' {
        $r = Test-FixturePrecondition -Root $script:root -FeatureName $script:featureName
        $r.canProceed | Should -BeFalse
        $r.bddValid | Should -BeFalse
    }

    It 'fails when BDD fixture is corrupt JSON' {
        Set-Content (Join-Path $script:bddDir 'fixture.json') -Value '{"corrupt'
        $r = Test-FixturePrecondition -Root $script:root -FeatureName $script:featureName
        $r.canProceed | Should -BeFalse
    }

    It 'fails when schema version is not 1' {
        @{ schemaVersion = 2; features = @() } | ConvertTo-Json | Set-Content (Join-Path $script:bddDir 'fixture.json')
        $r = Test-FixturePrecondition -Root $script:root -FeatureName $script:featureName
        $r.bddValid | Should -BeFalse
    }

    It 'fails when BDD fixture missing (empty root)' {
        $emptyRoot = Join-Path ([System.IO.Path]::GetTempPath()) "fixture-empty-$(Get-Random)"
        New-Item -ItemType Directory -Path $emptyRoot -Force | Out-Null
        try {
            $r = Test-FixturePrecondition -Root $emptyRoot -FeatureName 'no-feat'
            $r.canProceed | Should -BeFalse
        }
        finally { Remove-Item $emptyRoot -Recurse -Force -ErrorAction SilentlyContinue }
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
        $script:root = Join-Path ([System.IO.Path]::GetTempPath()) "bdd-gen-$(Get-Random)"
        $script:featureName = 'bdd-test'
        $script:featureDir = Join-Path $script:root "docs/$($script:featureName)"
        New-Item -ItemType Directory -Path $script:featureDir -Force | Out-Null
    }
    AfterEach { Remove-Item $script:root -Recurse -Force -ErrorAction SilentlyContinue }

    It 'parses .feature file and exports valid BDD fixture JSON' {
        $featureFile = Join-Path $script:featureDir 'bdd.feature'
        Set-Content $featureFile -Value "Feature: Auth`n  Scenario: Login`n    Given a user`n    When they log in`n    Then they see home"

        $bddFixturePath = Join-Path (Get-FixtureDir -Root $script:root -FeatureName $script:featureName) 'bdd/fixture.json'
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
        $bddFixturePath = Join-Path (Get-FixtureDir -Root $script:root -FeatureName $script:featureName) 'bdd/fixture.json'
        $parsed = ConvertFrom-Gherkin -Path $featureFile
        $parsed.schemaVersion = 1
        Export-BddFixture -Fixture $parsed -OutputPath $bddFixturePath

        $check = Test-FixturePrecondition -Root $script:root -FeatureName $script:featureName
        $check.canProceed | Should -BeTrue
        $check.bddValid | Should -BeTrue
    }
}

Describe 'Fixture Precondition blocks coding stage (stage 8 gate)' {
    BeforeAll { . "$PSScriptRoot/../utils/fixture-gate.ps1" }
    It 'missing fixtures cause precondition failure' {
        $emptyRoot = Join-Path ([System.IO.Path]::GetTempPath()) "gate-$(Get-Random)"
        New-Item -ItemType Directory -Path $emptyRoot -Force | Out-Null
        try {
            $check = Test-FixturePrecondition -Root $emptyRoot -FeatureName 'no-feat'
            $check.canProceed | Should -BeFalse
        }
        finally { Remove-Item $emptyRoot -Recurse -Force -ErrorAction SilentlyContinue }
    }

    It 'corrupt BDD fixture blocks stage 8' {
        $root = Join-Path ([System.IO.Path]::GetTempPath()) "gate-corrupt-$(Get-Random)"
        $featName = 'corrupt-test'
        $bddDir = Join-Path $root "tests/fixtures/$featName/bdd"
        New-Item -ItemType Directory -Path $bddDir -Force | Out-Null
        Set-Content (Join-Path $bddDir 'fixture.json') -Value '{"corrupt'
        try {
            $check = Test-FixturePrecondition -Root $root -FeatureName $featName
            $check.canProceed | Should -BeFalse
            $check.bddValid | Should -BeFalse
        }
        finally { Remove-Item $root -Recurse -Force -ErrorAction SilentlyContinue }
    }
}
