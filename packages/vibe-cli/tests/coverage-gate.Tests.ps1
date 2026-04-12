BeforeAll {
    . "$PSScriptRoot/../utils/coverage-gate.ps1"
}

Describe 'Test-CoverageGate' {
    It 'passes when all three categories reach 100%' {
        $coverage = @{
            pbt = @{ covered = 100; total = 100; testFiles = 5 }
            contract = @{ covered = 50; total = 50; testFiles = 3 }
            e2e = @{ covered = 20; total = 20; testFiles = 2 }
        }
        $r = Test-CoverageGate -CoverageResults $coverage -TddIter 1 -CoverageIter 0 -MaxTddCycles 10 -MaxCoverageIter 5
        $r.passed | Should -BeTrue
    }

    It 'fails if any category below 100%' {
        $coverage = @{
            pbt = @{ covered = 100; total = 100; testFiles = 5 }
            contract = @{ covered = 49; total = 50; testFiles = 3 }
            e2e = @{ covered = 20; total = 20; testFiles = 2 }
        }
        $r = Test-CoverageGate -CoverageResults $coverage -TddIter 1 -CoverageIter 0 -MaxTddCycles 10 -MaxCoverageIter 5
        $r.passed | Should -BeFalse
        $r.failures[0].category | Should -BeExactly 'contract'
    }

    It 'uses truncation rounding (99.5% -> 99 -> fail)' {
        $coverage = @{
            pbt = @{ covered = 199; total = 200; testFiles = 5 }
            contract = @{ covered = 50; total = 50; testFiles = 3 }
            e2e = @{ covered = 20; total = 20; testFiles = 2 }
        }
        $r = Test-CoverageGate -CoverageResults $coverage -TddIter 1 -CoverageIter 0 -MaxTddCycles 10 -MaxCoverageIter 5
        $r.passed | Should -BeFalse
        ($r.failures | Where-Object { $_.category -eq 'pbt' }).pct | Should -Be 99
    }

    It 'fails on zero test files for a category' {
        $coverage = @{
            pbt = @{ covered = 100; total = 100; testFiles = 0 }
            contract = @{ covered = 50; total = 50; testFiles = 3 }
            e2e = @{ covered = 20; total = 20; testFiles = 2 }
        }
        $r = Test-CoverageGate -CoverageResults $coverage -TddIter 1 -CoverageIter 0 -MaxTddCycles 10 -MaxCoverageIter 5
        $r.passed | Should -BeFalse
        ($r.failures | Where-Object { $_.category -eq 'pbt' }).reason | Should -BeExactly 'zero_test_files'
    }

    It 'fails on zero total lines for a category' {
        $coverage = @{
            pbt = @{ covered = 0; total = 0; testFiles = 5 }
            contract = @{ covered = 50; total = 50; testFiles = 3 }
            e2e = @{ covered = 20; total = 20; testFiles = 2 }
        }
        $r = Test-CoverageGate -CoverageResults $coverage -TddIter 1 -CoverageIter 0 -MaxTddCycles 10 -MaxCoverageIter 5
        $r.passed | Should -BeFalse
        ($r.failures | Where-Object { $_.category -eq 'pbt' }).reason | Should -BeExactly 'zero_total'
    }

    It 'tool crash is not counted against cap' {
        $coverage = @{
            pbt = @{ covered = $null; total = $null; testFiles = 5 }
            contract = @{ covered = 50; total = 50; testFiles = 3 }
            e2e = @{ covered = 20; total = 20; testFiles = 2 }
        }
        $r = Test-CoverageGate -CoverageResults $coverage -TddIter 1 -CoverageIter 0 -MaxTddCycles 10 -MaxCoverageIter 5
        $r.passed | Should -BeFalse
        ($r.failures | Where-Object { $_.category -eq 'pbt' }).reason | Should -BeExactly 'tool_crash'
    }

    It 'reports TDDCapExhausted when tddIter >= MaxTddCycles' {
        $coverage = @{
            pbt = @{ covered = 90; total = 100; testFiles = 5 }
            contract = @{ covered = 50; total = 50; testFiles = 3 }
            e2e = @{ covered = 20; total = 20; testFiles = 2 }
        }
        $r = Test-CoverageGate -CoverageResults $coverage -TddIter 10 -CoverageIter 3 -MaxTddCycles 10 -MaxCoverageIter 5
        $r.exhaustionType | Should -BeExactly 'TDDCapExhausted'
    }

    It 'reports CoverageCapExhausted when coverageIter >= MaxCoverageIter' {
        $coverage = @{
            pbt = @{ covered = 90; total = 100; testFiles = 5 }
            contract = @{ covered = 50; total = 50; testFiles = 3 }
            e2e = @{ covered = 20; total = 20; testFiles = 2 }
        }
        $r = Test-CoverageGate -CoverageResults $coverage -TddIter 3 -CoverageIter 5 -MaxTddCycles 10 -MaxCoverageIter 5
        $r.exhaustionType | Should -BeExactly 'CoverageCapExhausted'
    }

    It 'tddIter boundary: MaxTddCycles=3, tddIter=1, exactly 2 retries available' {
        $coverage = @{
            pbt = @{ covered = 90; total = 100; testFiles = 5 }
            contract = @{ covered = 50; total = 50; testFiles = 3 }
            e2e = @{ covered = 20; total = 20; testFiles = 2 }
        }
        # At tddIter=1, not exhausted (2 retries left)
        $r1 = Test-CoverageGate -CoverageResults $coverage -TddIter 1 -CoverageIter 0 -MaxTddCycles 3 -MaxCoverageIter 5
        $r1.exhaustionType | Should -BeNullOrEmpty

        # At tddIter=3 (third attempt = exhausted)
        $r2 = Test-CoverageGate -CoverageResults $coverage -TddIter 3 -CoverageIter 0 -MaxTddCycles 3 -MaxCoverageIter 5
        $r2.exhaustionType | Should -BeExactly 'TDDCapExhausted'
    }

    It 'dual-cap simultaneous exhaustion picks TDD first' {
        $coverage = @{
            pbt = @{ covered = 90; total = 100; testFiles = 5 }
            contract = @{ covered = 50; total = 50; testFiles = 3 }
            e2e = @{ covered = 20; total = 20; testFiles = 2 }
        }
        $r = Test-CoverageGate -CoverageResults $coverage -TddIter 3 -CoverageIter 5 -MaxTddCycles 3 -MaxCoverageIter 5
        $r.exhaustionType | Should -BeExactly 'TDDCapExhausted'
    }

    It 'exactly 100% passes' {
        $coverage = @{
            pbt = @{ covered = 200; total = 200; testFiles = 5 }
            contract = @{ covered = 100; total = 100; testFiles = 3 }
            e2e = @{ covered = 50; total = 50; testFiles = 2 }
        }
        $r = Test-CoverageGate -CoverageResults $coverage -TddIter 1 -CoverageIter 0 -MaxTddCycles 10 -MaxCoverageIter 5
        $r.passed | Should -BeTrue
    }
}
