#Requires -Modules Pester

# Dot-source all test doubles at top level so global functions share the same scope as tests
. "$PSScriptRoot/../../helpers/git-test-double.ps1"
. "$PSScriptRoot/../../helpers/tlc-test-double.ps1"
. "$PSScriptRoot/../../helpers/tests-test-double.ps1"
. "$PSScriptRoot/../../helpers/claude-test-double.ps1"

# claude-test-double.ps1 defines non-global functions; promote to global scope for Pester It blocks
if (Get-Item function:Invoke-ClaudeTestDouble -ErrorAction SilentlyContinue) {
    Set-Item function:global:Invoke-ClaudeTestDouble (Get-Item function:Invoke-ClaudeTestDouble).ScriptBlock
}

Describe 'git-test-double' {
    BeforeEach { Clear-GitTestDouble }

    It 'exports Invoke-GitTestDouble' {
        Get-Command Invoke-GitTestDouble -ErrorAction SilentlyContinue | Should -Not -BeNullOrEmpty
    }

    It 'exports Set-GitTestDoubleResponse' {
        Get-Command Set-GitTestDoubleResponse -ErrorAction SilentlyContinue | Should -Not -BeNullOrEmpty
    }

    It 'exports Clear-GitTestDouble' {
        Get-Command Clear-GitTestDouble -ErrorAction SilentlyContinue | Should -Not -BeNullOrEmpty
    }

    It 'exports Get-GitTestDoubleCalls' {
        Get-Command Get-GitTestDoubleCalls -ErrorAction SilentlyContinue | Should -Not -BeNullOrEmpty
    }

    It 'returns default ExitCode=0 and empty Output when no response queued' {
        $result = Invoke-GitTestDouble -Arguments @('status')
        $result.ExitCode | Should -Be 0
        $result.Output   | Should -Be ''
    }

    It 'returns queued response when Set-GitTestDoubleResponse is called before Invoke' {
        Set-GitTestDoubleResponse @{ ExitCode = 1; Output = 'fatal: not a git repo' }
        $result = Invoke-GitTestDouble -Arguments @('status')
        $result.ExitCode | Should -Be 1
        $result.Output   | Should -Be 'fatal: not a git repo'
    }

    It 'dequeues responses in FIFO order' {
        Set-GitTestDoubleResponse @{ ExitCode = 0; Output = 'first' }
        Set-GitTestDoubleResponse @{ ExitCode = 1; Output = 'second' }
        $r1 = Invoke-GitTestDouble -Arguments @('log')
        $r2 = Invoke-GitTestDouble -Arguments @('diff')
        $r1.Output | Should -Be 'first'
        $r2.Output | Should -Be 'second'
    }

    It 'Clear-GitTestDouble resets call log' {
        $null = Invoke-GitTestDouble -Arguments @('status')
        Clear-GitTestDouble
        $calls = Get-GitTestDoubleCalls
        $calls.Count | Should -Be 0
    }

    It 'Get-GitTestDoubleCalls returns list of recorded calls' {
        $null = Invoke-GitTestDouble -Arguments @('status')
        $null = Invoke-GitTestDouble -Arguments @('diff', '--cached')
        $calls = Get-GitTestDoubleCalls
        $calls.Count | Should -Be 2
        $calls[0].Arguments | Should -Contain 'status'
        $calls[1].Arguments | Should -Contain 'diff'
    }
}

Describe 'tlc-test-double' {
    BeforeEach { Clear-TlcTestDouble }

    It 'exports Invoke-TlcTestDouble' {
        Get-Command Invoke-TlcTestDouble -ErrorAction SilentlyContinue | Should -Not -BeNullOrEmpty
    }

    It 'exports Set-TlcTestDoubleResponse' {
        Get-Command Set-TlcTestDoubleResponse -ErrorAction SilentlyContinue | Should -Not -BeNullOrEmpty
    }

    It 'exports Clear-TlcTestDouble' {
        Get-Command Clear-TlcTestDouble -ErrorAction SilentlyContinue | Should -Not -BeNullOrEmpty
    }

    It 'exports Get-TlcTestDoubleCalls' {
        Get-Command Get-TlcTestDoubleCalls -ErrorAction SilentlyContinue | Should -Not -BeNullOrEmpty
    }

    It 'returns ExitCode=0 and Output containing Model checking by default' {
        $result = Invoke-TlcTestDouble -SpecPath 'spec.tla' -ConfigPath 'spec.cfg'
        $result.ExitCode | Should -Be 0
        $result.Output   | Should -Match 'Model checking'
    }

    It 'records calls with SpecPath and ConfigPath' {
        $null = Invoke-TlcTestDouble -SpecPath 'MySpec.tla' -ConfigPath 'MySpec.cfg'
        $calls = Get-TlcTestDoubleCalls
        $calls.Count           | Should -Be 1
        $calls[0].SpecPath     | Should -Be 'MySpec.tla'
        $calls[0].ConfigPath   | Should -Be 'MySpec.cfg'
    }
}

Describe 'tests-test-double' {
    BeforeEach { Clear-TestsTestDouble }

    It 'exports Invoke-TestsTestDouble' {
        Get-Command Invoke-TestsTestDouble -ErrorAction SilentlyContinue | Should -Not -BeNullOrEmpty
    }

    It 'exports Set-TestsTestDoubleResponse' {
        Get-Command Set-TestsTestDoubleResponse -ErrorAction SilentlyContinue | Should -Not -BeNullOrEmpty
    }

    It 'exports Clear-TestsTestDouble' {
        Get-Command Clear-TestsTestDouble -ErrorAction SilentlyContinue | Should -Not -BeNullOrEmpty
    }

    It 'returns ExitCode=0 Passed=1 Failed=0 by default' {
        $result = Invoke-TestsTestDouble -TestPath 'some.Tests.ps1'
        $result.ExitCode | Should -Be 0
        $result.Passed   | Should -Be 1
        $result.Failed   | Should -Be 0
    }

    It 'returns queued failure response when pre-loaded' {
        Set-TestsTestDoubleResponse @{ ExitCode = 1; Passed = 0; Failed = 3; Output = '3 tests failed' }
        $result = Invoke-TestsTestDouble -TestPath 'some.Tests.ps1'
        $result.ExitCode | Should -Be 1
        $result.Passed   | Should -Be 0
        $result.Failed   | Should -Be 3
    }
}

Describe 'claude-test-double' {
    It 'claude-test-double.ps1 exists' {
        Test-Path "$PSScriptRoot/../../helpers/claude-test-double.ps1" | Should -BeTrue
    }

    It 'exports Invoke-ClaudeTestDouble' {
        Get-Command Invoke-ClaudeTestDouble -ErrorAction SilentlyContinue | Should -Not -BeNullOrEmpty
    }

    It 'Invoke-ClaudeTestDouble returns hashtable with content, filesModified, exitCode, cost' {
        $result = Invoke-ClaudeTestDouble -Role 'test' -Prompt 'hello'
        $result.ContainsKey('content')       | Should -BeTrue
        $result.ContainsKey('filesModified') | Should -BeTrue
        $result.ContainsKey('exitCode')      | Should -BeTrue
        $result.ContainsKey('cost')          | Should -BeTrue
    }
}

Describe 'BusTestDatabase helpers' {
    BeforeAll {
        function New-BusTestDatabase {
            $guid = [System.Guid]::NewGuid().ToString()
            $dir  = Join-Path $env:TEMP "vibe-test-$guid"
            $null = New-Item -ItemType Directory -Path $dir -Force
            return @{ Path = (Join-Path $dir 'vibe-bus.db'); Dir = $dir }
        }
        function Remove-BusTestDatabase {
            param([hashtable]$Db)
            Remove-Item -Recurse -Force $Db.Dir -ErrorAction SilentlyContinue
        }
    }

    It 'New-BusTestDatabase creates a unique path under TEMP ending with vibe-bus.db' {
        $db = New-BusTestDatabase
        try {
            $db.Path | Should -Match 'vibe-bus\.db$'
            $db.Dir  | Should -Match ([regex]::Escape($env:TEMP))
            Test-Path $db.Dir | Should -BeTrue
        } finally {
            Remove-BusTestDatabase $db
        }
    }

    It 'Remove-BusTestDatabase removes the temp directory' {
        $db = New-BusTestDatabase
        Remove-BusTestDatabase $db
        Test-Path $db.Dir | Should -BeFalse
    }
}
