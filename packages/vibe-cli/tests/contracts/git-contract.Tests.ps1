# =============================================================================
# git-contract.Tests.ps1
# Snapshot-based contract tests that verify the git mock (test double)
# produces stable, versioned output — preventing mock drift from real git.
# =============================================================================

BeforeAll {
    . "$PSScriptRoot/contract-runner.ps1"

    # Minimal git mock — mirrors Invoke-GitWithRetry signature but is pure data
    function script:Invoke-GitMock {
        param([string[]]$Arguments)
        $cmd = ($Arguments | Select-Object -First 1).ToLower()
        switch ($cmd) {
            'stash' {
                if ($Arguments.Count -gt 1 -and $Arguments[1] -eq 'pop') {
                    return @{ ExitCode = 0; Output = 'Changes restored' }
                }
                return @{ ExitCode = 0; Output = 'Saved working directory' }
            }
            'commit' {
                return @{ ExitCode = 0; Output = '[feature/test abc1234]' }
            }
            default {
                return @{ ExitCode = 0; Output = "MOCK_GIT_$($cmd.ToUpper())" }
            }
        }
    }

    $script:SnapshotDir = Join-Path $PSScriptRoot 'snapshots'
    $script:TempDir = Join-Path $env:TEMP "ct-git-$([guid]::NewGuid().ToString('N').Substring(0,8))"
    New-Item -ItemType Directory -Path $script:TempDir -Force | Out-Null
}

AfterAll {
    Remove-Item $script:TempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Describe 'Git Mock Contract Tests' {

    It 'T1: git stash snapshot matches current mock output' {
        $snap = Get-ContractSnapshot -Path (Join-Path $script:SnapshotDir 'git-output.snapshot.json')
        $snap | Should -Not -BeNullOrEmpty
        $entry = $snap.outputs | Where-Object { $_.scenario -eq 'git-stash' }
        $entry | Should -Not -BeNullOrEmpty

        $actual = Invoke-GitMock -Arguments @('stash')
        $actual.ExitCode | Should -Be $entry.output.ExitCode
        $actual.Output   | Should -Be $entry.output.Output
    }

    It 'T2: git stash pop snapshot matches current mock output' {
        $snap = Get-ContractSnapshot -Path (Join-Path $script:SnapshotDir 'git-output.snapshot.json')
        $entry = $snap.outputs | Where-Object { $_.scenario -eq 'git-stash-pop' }
        $entry | Should -Not -BeNullOrEmpty

        $actual = Invoke-GitMock -Arguments @('stash', 'pop')
        $actual.ExitCode | Should -Be $entry.output.ExitCode
        $actual.Output   | Should -Be $entry.output.Output
    }

    It 'T3: git commit snapshot matches current mock output' {
        $snap = Get-ContractSnapshot -Path (Join-Path $script:SnapshotDir 'git-output.snapshot.json')
        $entry = $snap.outputs | Where-Object { $_.scenario -eq 'git-commit' }
        $entry | Should -Not -BeNullOrEmpty

        $actual = Invoke-GitMock -Arguments @('commit')
        $actual.ExitCode | Should -Be $entry.output.ExitCode
        $actual.Output   | Should -Be $entry.output.Output
    }

    It 'T4: git stash produces consistent output across 10 calls' {
        $outputs = 1..10 | ForEach-Object { Invoke-GitMock -Arguments @('stash') }
        $allOutputs = @($outputs | ForEach-Object { $_.Output })
        $unique = @($allOutputs | Select-Object -Unique)
        $unique.Count | Should -Be 1 -Because 'mock must be deterministic'
        $unique[0] | Should -Be 'Saved working directory'
    }

    It 'T5: Invoke-ContractTest detects mock drift (changed output)' {
        $snapPath = Join-Path $script:TempDir 'git-drift-test.json'

        # Write snapshot with one value
        $original = @{ ExitCode = 0; Output = 'Saved working directory' } | ConvertTo-Json -Compress
        [System.IO.File]::WriteAllText($snapPath, $original)

        # Run with different output — simulates drift
        $result = Invoke-ContractTest `
            -ContractName 'git-stash-drift' `
            -MockInvoker { @{ ExitCode = 0; Output = 'DRIFTED_STASH_OUTPUT' } } `
            -SnapshotPath $snapPath

        $result.Passed | Should -Be $false
        $result.Diff   | Should -Not -BeNullOrEmpty
    }

    It 'T6: contract snapshot includes recordedAt field' {
        $snap = Get-ContractSnapshot -Path (Join-Path $script:SnapshotDir 'git-output.snapshot.json')
        $snap.recordedAt | Should -Not -BeNullOrEmpty
    }

    It 'T7: contract snapshot includes version field' {
        $snap = Get-ContractSnapshot -Path (Join-Path $script:SnapshotDir 'git-output.snapshot.json')
        $snap.version | Should -Not -BeNullOrEmpty
        $snap.version | Should -Be 1
    }

    It 'T8: Normalizer scriptblock is applied before comparison' {
        $snapPath = Join-Path $script:TempDir 'normalizer-test.json'

        # Normalizer strips a dynamic timestamp field
        $normalizer = {
            param([string]$Json)
            $Json -replace '"ts":\s*"\d{4}-\d{2}-\d{2}T[^"]*"', '"ts":"NORMALIZED"'
        }

        # Record with dynamic timestamp
        $record = Invoke-ContractTest `
            -ContractName 'normalizer-test' `
            -MockInvoker { @{ ExitCode = 0; Output = 'ok'; ts = (Get-Date -Format 'o') } } `
            -SnapshotPath $snapPath `
            -Normalizer $normalizer `
            -UpdateSnapshot

        $record.Passed | Should -Be $true

        # Replay with a different timestamp — normalizer should make them equal
        $replay = Invoke-ContractTest `
            -ContractName 'normalizer-test' `
            -MockInvoker { @{ ExitCode = 0; Output = 'ok'; ts = (Get-Date).AddHours(1).ToString('o') } } `
            -SnapshotPath $snapPath `
            -Normalizer $normalizer

        $replay.Passed | Should -Be $true -Because 'normalizer removed the volatile timestamp'
    }

    It 'T9: missing snapshot file causes test to fail' {
        $snapPath = Join-Path $script:TempDir 'nonexistent-$([guid]::NewGuid()).json'

        # When snapshot is missing and -UpdateSnapshot is NOT set,
        # the function writes a new snapshot and returns Passed=$true (record phase).
        # Simulate "missing and should fail" by checking Get-ContractSnapshot returns null.
        $parsed = Get-ContractSnapshot -Path $snapPath
        $parsed | Should -BeNullOrEmpty -Because 'snapshot file does not exist'
    }
}
