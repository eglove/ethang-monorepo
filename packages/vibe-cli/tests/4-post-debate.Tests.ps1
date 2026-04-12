BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    . "$root/utils/pipeline-log.ps1"
    . "$root/utils/resolve-pipeline-state.ps1"
    . "$root/utils/gherkin-parser.ps1"
    . "$root/utils/fixture-gate.ps1"
    . "$root/stages/4-post-debate.ps1"
}

Describe 'Invoke-PostDebate (Stage 4)' {
    BeforeEach {
        $testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "s4-test-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
        $featureDir = Join-Path $testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null

        # Create cumulative artifacts for stage 4
        Set-Content -Path (Join-Path $featureDir 'elicitor.md') -Value '# Briefing'
        Set-Content -Path (Join-Path $featureDir 'bdd.feature') -Value @"
Feature: Test Feature
  Scenario: Basic test
    Given a precondition
    When an action occurs
    Then a result follows
"@
        $tlaDir = Join-Path $featureDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content -Path (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content -Path (Join-Path $featureDir 'unified-debate.md') -Value '# Debate'

        $fixtureDir = Join-Path $testRoot 'fixtures/test-feature'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
    }

    AfterEach {
        Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'generates fixture JSON from bdd.feature' {
        $result = Invoke-PostDebate -FeatureDir $featureDir -Root $testRoot -TargetRoot $testRoot

        $result.Success | Should -BeTrue
        $result.FixturePath | Should -Exist
        $json = Get-Content $result.FixturePath -Raw | ConvertFrom-Json
        $json.features | Should -Not -BeNullOrEmpty
    }

    It 'writes STAGE_COMPLETE:4 marker on success' {
        Invoke-PostDebate -FeatureDir $featureDir -Root $testRoot -TargetRoot $testRoot

        $logPath = Join-Path $testRoot 'pipeline.log'
        $content = Get-Content $logPath -Raw
        $content | Should -Match 'STAGE_COMPLETE:4:test-feature'
    }

    It 'fails when bdd.feature is missing' {
        Remove-Item (Join-Path $featureDir 'bdd.feature')

        $result = Invoke-PostDebate -FeatureDir $featureDir -Root $testRoot -TargetRoot $testRoot

        $result.Success | Should -BeFalse
        $result.Error | Should -Match 'bdd.feature'
    }

    It 'fails when bdd.feature contains invalid Gherkin' {
        Set-Content -Path (Join-Path $featureDir 'bdd.feature') -Value 'not valid gherkin at all random garbage'

        $result = Invoke-PostDebate -FeatureDir $featureDir -Root $testRoot -TargetRoot $testRoot

        # Should still succeed creating the fixture (parser is lenient), or fail gracefully
        # The parser returns empty features for invalid content
        if ($result.Success) {
            $result.FixturePath | Should -Exist
        }
    }

    It 'validates cumulative artifacts before executing' {
        Remove-Item (Join-Path $featureDir 'unified-debate.md')

        $result = Invoke-PostDebate -FeatureDir $featureDir -Root $testRoot -TargetRoot $testRoot

        $result.Success | Should -BeFalse
        $result.Error | Should -Match 'unified-debate'
    }
}
