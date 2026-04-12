BeforeAll {
    . "$PSScriptRoot/../utils/fixture-gate.ps1"
}

Describe 'Get-FixtureDir' {
    It 'returns fixtures/<FeatureName> under Root' {
        $result = Get-FixtureDir -Root '/some/root' -FeatureName 'auth-flow'
        $result | Should -BeLike '*fixtures*auth-flow'
    }
}

Describe 'Test-FixturePrecondition' {
    BeforeEach {
        $testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "fg-test-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
    }

    AfterEach {
        Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns canProceed=$true for valid bdd.json with schemaVersion=1' {
        $fixtureDir = Join-Path $testRoot 'fixtures/my-feature'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        Set-Content -Path (Join-Path $fixtureDir 'bdd.json') -Value '{"schemaVersion":1,"features":[]}'

        $result = Test-FixturePrecondition -Root $testRoot -FeatureName 'my-feature'

        $result.bddValid | Should -BeTrue
        $result.canProceed | Should -BeTrue
    }

    It 'returns canProceed=$false when bdd.json is missing' {
        $result = Test-FixturePrecondition -Root $testRoot -FeatureName 'no-feature'

        $result.bddValid | Should -BeFalse
        $result.canProceed | Should -BeFalse
    }

    It 'returns canProceed=$false when bdd.json has invalid JSON' {
        $fixtureDir = Join-Path $testRoot 'fixtures/bad-json'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        Set-Content -Path (Join-Path $fixtureDir 'bdd.json') -Value 'not valid json {'

        $result = Test-FixturePrecondition -Root $testRoot -FeatureName 'bad-json'

        $result.bddValid | Should -BeFalse
        $result.canProceed | Should -BeFalse
    }

    It 'returns canProceed=$false when schemaVersion is not 1' {
        $fixtureDir = Join-Path $testRoot 'fixtures/wrong-version'
        New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
        Set-Content -Path (Join-Path $fixtureDir 'bdd.json') -Value '{"schemaVersion":2,"features":[]}'

        $result = Test-FixturePrecondition -Root $testRoot -FeatureName 'wrong-version'

        $result.bddValid | Should -BeFalse
        $result.canProceed | Should -BeFalse
    }
}
