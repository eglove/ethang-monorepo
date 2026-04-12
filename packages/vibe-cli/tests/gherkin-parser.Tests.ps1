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

Describe 'ConvertFrom-Gherkin data table headers row' {
    BeforeEach { $script:tf = [System.IO.Path]::GetTempFileName() + '.feature' }
    AfterEach { Remove-Item $script:tf -ErrorAction SilentlyContinue }

    It 'processes data table with header row followed by data rows mid-scenario' {
        # This covers line 77 (dataTableHeaders inside inDataTable) and lines 92-105 (flush data table)
        $lines = @(
            'Feature: DataTable Flush'
            '  Scenario: Table then step'
            '    Given users:'
            '      | name  | age |'
            '      | Alice | 30  |'
            '    When I query'
            '    Then I get results'
        )
        Set-Content $script:tf -Value ($lines -join "`n")
        $r = ConvertFrom-Gherkin -Path $script:tf
        $step = $r.features[0].scenarios[0].steps[0]
        $step.dataTable.Count | Should -Be 1
        $step.dataTable[0]['name'] | Should -BeExactly 'Alice'
        $step.dataTable[0]['age'] | Should -BeExactly '30'
        # Verify subsequent steps were parsed after flushing the data table
        $r.features[0].scenarios[0].steps.Count | Should -Be 3
    }

    It 'flushes data table at end of file (remaining data table)' {
        # This covers lines 220-232 (flush remaining data table at EOF)
        $lines = @(
            'Feature: EOF DataTable'
            '  Scenario: Table at end'
            '    Given items:'
            '      | item  | qty |'
            '      | apple | 5   |'
            '      | bread | 2   |'
        )
        Set-Content $script:tf -Value ($lines -join "`n")
        $r = ConvertFrom-Gherkin -Path $script:tf
        $step = $r.features[0].scenarios[0].steps[0]
        $step.dataTable.Count | Should -Be 2
        $step.dataTable[0]['item'] | Should -BeExactly 'apple'
        $step.dataTable[1]['item'] | Should -BeExactly 'bread'
    }

    It 'handles data table row with fewer cells than headers' {
        # Covers the else branch: if ($i -lt $row.Count) { $row[$i] } else { '' }
        $lines = @(
            'Feature: Short Row'
            '  Scenario: Short data row'
            '    Given data:'
            '      | col1 | col2 | col3 |'
            '      | a    | b    |'
        )
        Set-Content $script:tf -Value ($lines -join "`n")
        $r = ConvertFrom-Gherkin -Path $script:tf
        $step = $r.features[0].scenarios[0].steps[0]
        $step.dataTable.Count | Should -Be 1
        $step.dataTable[0]['col1'] | Should -BeExactly 'a'
        $step.dataTable[0]['col2'] | Should -BeExactly 'b'
        $step.dataTable[0]['col3'] | Should -BeExactly ''
    }
}

Describe 'ConvertFrom-Gherkin scenario outline examples processing' {
    BeforeEach { $script:tf = [System.IO.Path]::GetTempFileName() + '.feature' }
    AfterEach { Remove-Item $script:tf -ErrorAction SilentlyContinue }

    It 'flushes examples table when a new keyword follows' {
        # Covers lines 110-124 (flush examples mid-parse when next keyword encountered)
        $lines = @(
            'Feature: Outline Flush'
            '  Scenario Outline: Addition'
            '    Given a value <a>'
            '    When I add <b>'
            '    Then the result is <sum>'
            ''
            '    Examples:'
            '      | a | b | sum |'
            '      | 1 | 2 | 3   |'
            '      | 4 | 5 | 9   |'
            ''
            '  Scenario: Normal scenario after outline'
            '    Given something else'
        )
        Set-Content $script:tf -Value ($lines -join "`n")
        $r = ConvertFrom-Gherkin -Path $script:tf
        $outline = $r.features[0].scenarios[0]
        $outline.examples.Count | Should -Be 2
        $outline.examples[0]['a'] | Should -BeExactly '1'
        $outline.examples[1]['sum'] | Should -BeExactly '9'
        # Verify the second scenario was also parsed
        $r.features[0].scenarios.Count | Should -Be 2
    }

    It 'handles examples row with fewer cells than headers' {
        # Covers the else branch at line 117: if ($i -lt $row.Count) { $row[$i] } else { '' }
        $lines = @(
            'Feature: Short Examples'
            '  Scenario Outline: Short row'
            '    Given value <x>'
            ''
            '    Examples:'
            '      | x | y | z |'
            '      | 1 | 2 |'
        )
        Set-Content $script:tf -Value ($lines -join "`n")
        $r = ConvertFrom-Gherkin -Path $script:tf
        $outline = $r.features[0].scenarios[0]
        $outline.examples.Count | Should -Be 1
        $outline.examples[0]['x'] | Should -BeExactly '1'
        $outline.examples[0]['y'] | Should -BeExactly '2'
        $outline.examples[0]['z'] | Should -BeExactly ''
    }

    It 'flushes remaining examples table at end of file with data' {
        # Covers lines 234-248 (flush remaining examples at EOF)
        $lines = @(
            'Feature: EOF Examples'
            '  Scenario Outline: At EOF'
            '    Given value <v>'
            ''
            '    Examples:'
            '      | v   |'
            '      | one |'
            '      | two |'
        )
        Set-Content $script:tf -Value ($lines -join "`n")
        $r = ConvertFrom-Gherkin -Path $script:tf
        $outline = $r.features[0].scenarios[0]
        $outline.examples.Count | Should -Be 2
        $outline.examples[0]['v'] | Should -BeExactly 'one'
        $outline.examples[1]['v'] | Should -BeExactly 'two'
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

    It 'adds schemaVersion when not present in fixture' {
        $f = @{ features = @() }
        $p = Join-Path $script:od 'no-schema.json'
        Export-BddFixture -Fixture $f -OutputPath $p
        (Get-Content $p -Raw | ConvertFrom-Json).schemaVersion | Should -Be 1
    }

    It 'preserves existing schemaVersion in fixture' {
        $f = @{ features = @(); schemaVersion = 2 }
        $p = Join-Path $script:od 'schema-v2.json'
        Export-BddFixture -Fixture $f -OutputPath $p
        (Get-Content $p -Raw | ConvertFrom-Json).schemaVersion | Should -Be 2
    }
}

Describe 'Export-BddFixture retry logic' {
    BeforeEach {
        $rand = Get-Random
        $script:od = Join-Path ([System.IO.Path]::GetTempPath()) "bdd-retry-$rand"
        New-Item -ItemType Directory -Path $script:od -Force | Out-Null
    }
    AfterEach { Remove-Item $script:od -Recurse -Force -ErrorAction SilentlyContinue }

    It 'retries on write failure and succeeds on subsequent attempt' {
        $f = @{ features = @(); schemaVersion = 1 }
        $p = Join-Path $script:od 'retry-test.json'

        $script:moveAttempt = 0
        Mock Move-Item {
            param($Path, $Destination)
            $script:moveAttempt++
            if ($script:moveAttempt -eq 1) {
                throw "Simulated I/O error"
            }
            # Use .NET to avoid re-entering the Pester mock
            [System.IO.File]::Move($Path, $Destination)
        }
        Mock Start-Sleep {}

        Export-BddFixture -Fixture $f -OutputPath $p
        $p | Should -Exist
        Should -Invoke Start-Sleep -Times 1
    }

    It 'throws after exhausting all retries' {
        $f = @{ features = @(); schemaVersion = 1 }
        $p = Join-Path $script:od 'fail-test.json'

        Mock Move-Item { throw "Persistent I/O error" }
        Mock Start-Sleep {}

        { Export-BddFixture -Fixture $f -OutputPath $p } | Should -Throw '*Persistent I/O error*'
        Should -Invoke Start-Sleep -Times 2
    }
}
