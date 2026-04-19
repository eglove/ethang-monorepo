# =============================================================================
# claude-contract.Tests.ps1
# Snapshot-based contract tests that verify the Claude mock (test double)
# produces stable, versioned output — preventing mock drift from real CLI.
# =============================================================================

BeforeAll {
    . "$PSScriptRoot/contract-runner.ps1"

    # Claude mock: maps Role -> deterministic output
    $script:MockClaudeOutput = @{
        'doc-writer'  = 'MOCK_DOC_WRITER_OUTPUT'
        'code-writer' = 'MOCK_CODE_WRITER_OUTPUT'
        'moderator'   = 'MOCK_MODERATOR_OUTPUT'
    }

    function script:Invoke-ClaudeMock {
        param([string]$Role, [string]$Prompt)
        if ($script:MockClaudeOutput.ContainsKey($Role)) {
            return @{ ExitCode = 0; Content = $script:MockClaudeOutput[$Role] }
        }
        return @{ ExitCode = 1; Content = "ERROR: unknown role '$Role'" }
    }

    # Snapshot directory used by contract tests
    $script:SnapshotDir = Join-Path $PSScriptRoot 'snapshots'

    # Temp dir for isolated snapshot writes during test execution
    $script:TempDir = Join-Path $env:TEMP "ct-claude-$([guid]::NewGuid().ToString('N').Substring(0,8))"
    New-Item -ItemType Directory -Path $script:TempDir -Force | Out-Null
}

AfterAll {
    Remove-Item $script:TempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Describe 'Claude Mock Contract Tests' {

    It 'T1: doc-writer snapshot matches current mock output' {
        $snap = Get-ContractSnapshot -Path (Join-Path $script:SnapshotDir 'claude-output.snapshot.json')
        $snap | Should -Not -BeNullOrEmpty
        $docEntry = $snap.outputs | Where-Object { $_.scenario -eq 'doc-writer-role' }
        $docEntry | Should -Not -BeNullOrEmpty

        $actual = Invoke-ClaudeMock -Role 'doc-writer' -Prompt 'test prompt'
        $actual.ExitCode | Should -Be $docEntry.output.ExitCode
        $actual.Content  | Should -Be $docEntry.output.Content
    }

    It 'T2: code-writer snapshot matches current mock output' {
        $snap = Get-ContractSnapshot -Path (Join-Path $script:SnapshotDir 'claude-output.snapshot.json')
        $entry = $snap.outputs | Where-Object { $_.scenario -eq 'code-writer-role' }
        $entry | Should -Not -BeNullOrEmpty

        $actual = Invoke-ClaudeMock -Role 'code-writer' -Prompt 'test prompt'
        $actual.ExitCode | Should -Be $entry.output.ExitCode
        $actual.Content  | Should -Be $entry.output.Content
    }

    It 'T3: moderator snapshot matches current mock output' {
        $snap = Get-ContractSnapshot -Path (Join-Path $script:SnapshotDir 'claude-output.snapshot.json')
        $entry = $snap.outputs | Where-Object { $_.scenario -eq 'moderator-role' }
        $entry | Should -Not -BeNullOrEmpty

        $actual = Invoke-ClaudeMock -Role 'moderator' -Prompt 'test prompt'
        $actual.ExitCode | Should -Be $entry.output.ExitCode
        $actual.Content  | Should -Be $entry.output.Content
    }

    It 'T4: unknown role produces consistent error output' {
        $result1 = Invoke-ClaudeMock -Role 'unknown-role' -Prompt 'anything'
        $result2 = Invoke-ClaudeMock -Role 'unknown-role' -Prompt 'anything'
        $result1.ExitCode | Should -Be 1
        $result2.ExitCode | Should -Be 1
        $result1.Content  | Should -Be $result2.Content
    }

    It 'T5: Invoke-ContractTest passes when output matches snapshot' {
        $snapPath = Join-Path $script:TempDir 'pass-test.json'

        # Record phase: create snapshot
        $record = Invoke-ContractTest `
            -ContractName 'pass-test' `
            -MockInvoker { Invoke-ClaudeMock -Role 'doc-writer' -Prompt 'x' } `
            -SnapshotPath $snapPath `
            -UpdateSnapshot

        $record.Passed | Should -Be $true

        # Replay phase: same output -> should still pass
        $replay = Invoke-ContractTest `
            -ContractName 'pass-test' `
            -MockInvoker { Invoke-ClaudeMock -Role 'doc-writer' -Prompt 'x' } `
            -SnapshotPath $snapPath

        $replay.Passed | Should -Be $true
        $replay.Diff   | Should -BeNullOrEmpty
    }

    It 'T6: Invoke-ContractTest fails when output differs from snapshot' {
        $snapPath = Join-Path $script:TempDir 'drift-test.json'

        # Write snapshot with one value
        $original = @{ ExitCode = 0; Content = 'ORIGINAL_OUTPUT' } | ConvertTo-Json -Compress
        [System.IO.File]::WriteAllText($snapPath, $original)

        # Replay with different output -> drift detected
        $result = Invoke-ContractTest `
            -ContractName 'drift-test' `
            -MockInvoker { @{ ExitCode = 0; Content = 'DRIFTED_OUTPUT' } } `
            -SnapshotPath $snapPath

        $result.Passed | Should -Be $false
        $result.Diff   | Should -Not -BeNullOrEmpty
        $result.Diff   | Should -Match 'drift-test'
    }

    It 'T7: -UpdateSnapshot flag writes new snapshot without failing' {
        $snapPath = Join-Path $script:TempDir 'update-test.json'

        # Create initial snapshot
        $first = @{ Content = 'FIRST' } | ConvertTo-Json -Compress
        [System.IO.File]::WriteAllText($snapPath, $first)

        # UpdateSnapshot overwrites even though content differs
        $result = Invoke-ContractTest `
            -ContractName 'update-test' `
            -MockInvoker { @{ Content = 'SECOND' } } `
            -SnapshotPath $snapPath `
            -UpdateSnapshot

        $result.Passed | Should -Be $true
        $written = [System.IO.File]::ReadAllText($snapPath)
        $written | Should -Match 'SECOND'
    }

    It 'T8: Compare-ContractSnapshot returns Match=true for identical content' {
        $json = '{"ExitCode":0,"Content":"MOCK_DOC_WRITER_OUTPUT"}'
        $cmp = Compare-ContractSnapshot -Actual $json -Expected $json -ContractName 'eq-test'
        $cmp.Match | Should -Be $true
        $cmp.Diff  | Should -BeNullOrEmpty
    }

    It 'T9: Compare-ContractSnapshot returns Match=false and Diff for different content' {
        $a = '{"ExitCode":0,"Content":"AAA"}'
        $b = '{"ExitCode":0,"Content":"BBB"}'
        $cmp = Compare-ContractSnapshot -Actual $a -Expected $b -ContractName 'neq-test'
        $cmp.Match | Should -Be $false
        $cmp.Diff  | Should -Not -BeNullOrEmpty
        $cmp.Diff  | Should -Match 'neq-test'
    }

    It 'T10: New-ContractSnapshot writes JSON to path' {
        $snapPath = Join-Path $script:TempDir 'write-test.json'
        $content = '{"version":1,"test":true}'
        New-ContractSnapshot -Content $content -Path $snapPath
        $read = [System.IO.File]::ReadAllText($snapPath)
        $read | Should -Be $content
    }

    It 'T11: Get-ContractSnapshot reads and parses JSON' {
        $snapPath = Join-Path $script:TempDir 'read-test.json'
        $obj = @{ version = 1; contractName = 'read-test'; recordedAt = '2026-04-18'; outputs = @() }
        $json = $obj | ConvertTo-Json -Depth 10
        [System.IO.File]::WriteAllText($snapPath, $json)

        $parsed = Get-ContractSnapshot -Path $snapPath
        $parsed | Should -Not -BeNullOrEmpty
        $parsed.version      | Should -Be 1
        $parsed.contractName | Should -Be 'read-test'
    }

    It 'T12: contract version=1 is enforced in snapshot schema' {
        $snap = Get-ContractSnapshot -Path (Join-Path $script:SnapshotDir 'claude-output.snapshot.json')
        $snap.version | Should -Be 1
    }
}
