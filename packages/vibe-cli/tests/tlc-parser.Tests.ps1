BeforeAll {
    . "$PSScriptRoot/../utils/tlc-parser.ps1"
}

Describe 'ConvertFrom-TlcOutput' {
    It 'parses successful TLC run (exit 0)' {
        $out = "TLC2 Version 2.18`nModel checking completed. No error has been found.`n12345 states generated, 6789 distinct states found, 0 states left on queue.`nThe depth of the complete state graph search is 42."
        $r = ConvertFrom-TlcOutput -Output $out -ExitCode 0
        $r.exitCode | Should -Be 0
        $r.exitMeaning | Should -BeExactly 'success'
        $r.invariantViolations.Count | Should -Be 0
        $r.deadlock | Should -Be $false
        $r.stateGraph.depth | Should -Be 42
        $r.stateGraph.statesGenerated | Should -Be 12345
        $r.stateGraph.distinctStates | Should -Be 6789
    }

    It 'parses invariant violation with trace (exit 11)' {
        $out = "TLC2 Version 2.18`nError: Invariant SafetyInv is violated.`nError: The behavior up to this point is:`nState 1: <Initial predicate>`n/\ var1 = ""value1""`n/\ var2 = 0`nState 2: <Action1 line 45>`n/\ var1 = ""value2""`n/\ var2 = 1"
        $r = ConvertFrom-TlcOutput -Output $out -ExitCode 11
        $r.exitCode | Should -Be 11
        $r.exitMeaning | Should -BeExactly 'invariant_violation'
        $r.invariantViolations.Count | Should -Be 1
        $r.invariantViolations[0].name | Should -BeExactly 'SafetyInv'
        $r.invariantViolations[0].trace.Count | Should -Be 2
    }

    It 'parses state variable assignments' {
        $out = "TLC2 Version 2.18`nError: Invariant Inv1 is violated.`nError: The behavior up to this point is:`nState 1: <Init>`n/\ x = 0`n/\ y = ""hello"""
        $r = ConvertFrom-TlcOutput -Output $out -ExitCode 11
        $r.invariantViolations[0].trace[0].variables.x | Should -Be '0'
        $r.invariantViolations[0].trace[0].variables.y | Should -Be '"hello"'
    }

    It 'parses deadlock (exit 12)' {
        $out = "TLC2 Version 2.18`nError: Deadlock reached.`nError: The behavior up to this point is:`nState 1: <Init>`n/\ pc = ""start"""
        $r = ConvertFrom-TlcOutput -Output $out -ExitCode 12
        $r.exitCode | Should -Be 12
        $r.exitMeaning | Should -BeExactly 'deadlock'
        $r.deadlock | Should -Be $true
    }

    It 'captures exit 13 as liveness violation' {
        $out = "TLC2 Version 2.18`nError: Temporal properties were violated."
        $r = ConvertFrom-TlcOutput -Output $out -ExitCode 13
        $r.exitMeaning | Should -BeExactly 'liveness_violation'
    }

    It 'captures unknown exit code' {
        $r = ConvertFrom-TlcOutput -Output "TLC2 Version 2.18`nUnknown error" -ExitCode 99
        $r.exitMeaning | Should -BeExactly 'unknown'
    }

    It 'warns on header-only output' {
        Mock Write-Warning {}
        $r = ConvertFrom-TlcOutput -Output "TLC2 Version 2.18" -ExitCode 0
        $r.invariantViolations.Count | Should -Be 0
        Should -Invoke Write-Warning -Times 1
    }

    It 'throws on empty output' {
        { ConvertFrom-TlcOutput -Output '' -ExitCode 0 } | Should -Throw '*empty*'
    }
}
