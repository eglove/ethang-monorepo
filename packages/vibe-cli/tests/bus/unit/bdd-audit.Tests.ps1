BeforeAll {
    $script:pkgRoot = Resolve-Path (Join-Path $PSScriptRoot "../../..") | Select-Object -ExpandProperty Path
    $script:featureFile = Join-Path $script:pkgRoot "docs\bidirectional-comms\bdd.feature"
    $script:leakChecker = Join-Path $script:pkgRoot "tools\check-tla-leaks-in-bdd.ps1"
    $script:tagChecker  = Join-Path $script:pkgRoot "tools\check-bdd-tags.ps1"
}

Describe "BDD Audit — T38" {

    Context "Artifact existence" {
        It "bdd.feature exists" {
            $script:featureFile | Should -Exist
        }

        It "bdd.feature is non-empty (> 1000 bytes)" {
            (Get-Item $script:featureFile).Length | Should -BeGreaterThan 1000
        }

        It "check-tla-leaks-in-bdd.ps1 exists" {
            $script:leakChecker | Should -Exist
        }

        It "check-bdd-tags.ps1 exists" {
            $script:tagChecker | Should -Exist
        }
    }

    Context "check-tla-leaks-in-bdd.ps1 behaviour" {
        It "accepts -FeatureFile parameter" {
            # Verify the script has a param block with FeatureFile
            $content = Get-Content $script:leakChecker -Raw
            $content | Should -Match 'param\s*\('
            $content | Should -Match 'FeatureFile'
        }

        It "exits 0 when no TLA+ leaks in a clean feature file" {
            $tmp = [System.IO.Path]::GetTempFileName() + ".feature"
            Set-Content -Path $tmp -Value @"
Feature: Clean Feature

  @tla-action-DoSomething
  Scenario: A clean scenario
    Given the system is running
    When an action is performed
    Then the observable result is correct
"@
            try {
                & pwsh -NoProfile -File $script:leakChecker -FeatureFile $tmp -ErrorOnLeaks
                $LASTEXITCODE | Should -Be 0
            } finally {
                Remove-Item $tmp -ErrorAction SilentlyContinue
            }
        }

        It "exits non-zero when TLA+ leaks present and -ErrorOnLeaks set" {
            $tmp = [System.IO.Path]::GetTempFileName() + ".feature"
            Set-Content -Path $tmp -Value @"
Feature: Leaky Feature

  @tla-action-DoSomething
  Scenario: A scenario with TLA leaks
    Given the busStatus is running
    When handlerState changes to idle
    Then eventLog is updated
"@
            try {
                & pwsh -NoProfile -File $script:leakChecker -FeatureFile $tmp -ErrorOnLeaks
                $LASTEXITCODE | Should -Not -Be 0
            } finally {
                Remove-Item $tmp -ErrorAction SilentlyContinue
            }
        }
    }

    Context "bdd.feature content — invariant tags" {
        It "contains at least one scenario tagged @invariant-18" {
            Select-String -Path $script:featureFile -Pattern '@invariant-18' -Quiet | Should -BeTrue
        }

        It "contains at least one scenario tagged @invariant-21" {
            Select-String -Path $script:featureFile -Pattern '@invariant-21' -Quiet | Should -BeTrue
        }

        It "contains at least one scenario tagged @invariant-22" {
            Select-String -Path $script:featureFile -Pattern '@invariant-22' -Quiet | Should -BeTrue
        }
    }

    Context "bdd.feature content — named TLA action tags" {
        It "contains @tla-action-AgentSendsDone tag" {
            Select-String -Path $script:featureFile -Pattern '@tla-action-AgentSendsDone' -Quiet | Should -BeTrue
        }
    }

    Context "bdd.feature content — new scenario text" {
        It "contains 'TypeSenderACL' phrase (invariant-18 scenario)" {
            Select-String -Path $script:featureFile -Pattern 'TypeSenderACL' -Quiet | Should -BeTrue
        }

        It "contains 'consensus epoch' phrase (invariant-21 scenario)" {
            Select-String -Path $script:featureFile -Pattern 'consensus epoch' -Quiet | Should -BeTrue
        }

        It "contains 'NoOrphanedHandlerForDeadAgent' phrase (invariant-22 scenario)" {
            Select-String -Path $script:featureFile -Pattern 'NoOrphanedHandlerForDeadAgent' -Quiet | Should -BeTrue
        }
    }
}
