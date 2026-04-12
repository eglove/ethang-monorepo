BeforeAll {
    . "$PSScriptRoot/../utils/gherkin-parser.ps1"
}

Describe 'ConvertFrom-Gherkin' {
    BeforeEach { $script:tf = [System.IO.Path]::GetTempFileName() + '.feature' }
    AfterEach { Remove-Item $script:tf -ErrorAction SilentlyContinue }

    It 'extracts Feature name and single Scenario with steps' {
        Set-Content $script:tf -Value "Feature: User Login`n  Scenario: Valid credentials`n    Given a registered user`n    When they enter valid credentials`n    Then they see the dashboard"
        $r = ConvertFrom-Gherkin -Path $script:tf
        $r.features.Count | Should -Be 1
        $r.features[0].name | Should -BeExactly 'User Login'
        $r.features[0].scenarios.Count | Should -Be 1
        $r.features[0].scenarios[0].steps.Count | Should -Be 3
    }

    It 'extracts Scenario Outline with Examples table' {
        $g = "Feature: Math`n  Scenario Outline: Addition`n    Given a value <a>`n    When I add <b>`n    Then the result is <sum>`n`n    Examples:`n      | a | b | sum |`n      | 1 | 2 | 3   |`n      | 4 | 5 | 9   |"
        Set-Content $script:tf -Value $g
        $r = ConvertFrom-Gherkin -Path $script:tf
        $s = $r.features[0].scenarios[0]
        $s.keyword | Should -BeExactly 'Scenario Outline'
        $s.examples.Count | Should -Be 2
    }

    It 'handles zero Examples rows with warning' {
        $g = "Feature: Empty`n  Scenario Outline: No data`n    Given something <val>`n`n    Examples:`n      | val |"
        Set-Content $script:tf -Value $g
        Mock Write-Warning {}
        $r = ConvertFrom-Gherkin -Path $script:tf
        $r.features[0].scenarios[0].examples.Count | Should -Be 0
        Should -Invoke Write-Warning -Times 1
    }

    It 'extracts data tables within steps' {
        $g = "Feature: Tables`n  Scenario: With table`n    Given users:`n      | name  | age |`n      | Alice | 30  |`n      | Bob   | 25  |"
        Set-Content $script:tf -Value $g
        $r = ConvertFrom-Gherkin -Path $script:tf
        $r.features[0].scenarios[0].steps[0].dataTable.Count | Should -Be 2
    }

    It 'extracts Background blocks' {
        $g = "Feature: With Background`n  Background:`n    Given a clean database`n`n  Scenario: Test`n    When I query`n    Then I get results"
        Set-Content $script:tf -Value $g
        $r = ConvertFrom-Gherkin -Path $script:tf
        $r.features[0].background | Should -Not -BeNullOrEmpty
        $r.features[0].background.steps.Count | Should -Be 1
    }

    It 'extracts doc strings' {
        $lines = @(
            'Feature: DocStrings'
            '  Scenario: With docstring'
            '    Given a document:'
            '      ```'
            '      Hello World'
            '      Line 2'
            '      ```'
        )
        Set-Content $script:tf -Value ($lines -join "`n")
        $r = ConvertFrom-Gherkin -Path $script:tf
        $r.features[0].scenarios[0].steps[0].docString | Should -Match 'Hello World'
    }

    It 'extracts Rule groups' {
        $lines = @(
            'Feature: Rules'
            '  Rule: Business rule 1'
            '    Scenario: Under rule'
            '      Given a condition'
            '      Then an outcome'
        )
        Set-Content $script:tf -Value ($lines -join "`n")
        $r = ConvertFrom-Gherkin -Path $script:tf
        $r.features[0].rules | Should -Not -BeNullOrEmpty
        $r.features[0].rules[0].name | Should -BeExactly 'Business rule 1'
    }

    It 'extracts tags at Feature and Scenario levels' {
        $g = "@smoke @critical`nFeature: Tagged`n  @login`n  Scenario: Tagged scenario`n    Given something"
        Set-Content $script:tf -Value $g
        $r = ConvertFrom-Gherkin -Path $script:tf
        $r.features[0].tags | Should -Contain '@smoke'
        $r.features[0].scenarios[0].tags | Should -Contain '@login'
    }

    It 'captures And/But as continuations' {
        $g = "Feature: Cont`n  Scenario: AndBut`n    Given a precondition`n    And another precondition`n    But not this one`n    When action`n    Then result"
        Set-Content $script:tf -Value $g
        $r = ConvertFrom-Gherkin -Path $script:tf
        $steps = $r.features[0].scenarios[0].steps
        $steps[1].keyword | Should -BeExactly 'And'
        $steps[2].keyword | Should -BeExactly 'But'
    }

    It 'handles minimal Gherkin' {
        Set-Content $script:tf -Value "Feature: Minimal`n  Scenario: Simple`n    Given x"
        $r = ConvertFrom-Gherkin -Path $script:tf
        $r.features.Count | Should -Be 1
    }

    It 'handles zero-scenario feature file' {
        Set-Content $script:tf -Value "Feature: Empty feature"
        $r = ConvertFrom-Gherkin -Path $script:tf
        $r.features[0].scenarios.Count | Should -Be 0
    }
}

Describe 'Export-BddFixture' {
    BeforeEach {
        $rand = Get-Random
        $script:od = Join-Path ([System.IO.Path]::GetTempPath()) "bdd-fix-$rand"
    }
    AfterEach { Remove-Item $script:od -Recurse -Force -ErrorAction SilentlyContinue }

    It 'includes schemaVersion = 1' {
        $f = @{ features = @(); schemaVersion = 1 }
        $p = Join-Path $script:od 'fixtures/bdd/fixture.json'
        Export-BddFixture -Fixture $f -OutputPath $p
        (Get-Content $p -Raw | ConvertFrom-Json).schemaVersion | Should -Be 1
    }

    It 'creates output directory if missing' {
        $f = @{ features = @(); schemaVersion = 1 }
        $p = Join-Path $script:od 'deep/nested/fixture.json'
        Export-BddFixture -Fixture $f -OutputPath $p
        $p | Should -Exist
    }

    It 'writes valid JSON via atomic write' {
        $f = @{ features = @(@{ name = 'Test' }); schemaVersion = 1 }
        $p = Join-Path $script:od 'fixture.json'
        New-Item -ItemType Directory -Path $script:od -Force | Out-Null
        Export-BddFixture -Fixture $f -OutputPath $p
        (Get-Content $p -Raw | ConvertFrom-Json).features[0].name | Should -BeExactly 'Test'
    }
}
