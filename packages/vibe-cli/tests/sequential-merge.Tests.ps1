BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
    . "$PSScriptRoot/../utils/pipeline-log.ps1"
    . "$PSScriptRoot/../utils/sequential-merge.ps1"
}

Describe 'Invoke-SequentialMerge' {
    BeforeEach {
        $script:testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "sm-test-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null

        Mock Write-Host {}
    }

    AfterEach {
        Remove-Item -Path $script:testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    Context 'conflict with UNRESOLVABLE signal — Stop' {
        It 'returns escalated_stop when Claude says UNRESOLVABLE and user stops' {
            Mock git {
                $joined = $args -join ' '
                if ($joined -match 'rev-parse HEAD') { return 'abc123' }
                if ($joined -match 'merge ') { $global:LASTEXITCODE = 1; return 'CONFLICT (content): Merge conflict' }
                if ($joined -match 'diff --name-only') { return 'file.ps1' }
                if ($joined -match 'merge --abort') { return $null }
                if ($joined -match 'reset --hard') { return $null }
                return $null
            }
            Mock Invoke-Claude { return 'UNRESOLVABLE — cannot reconcile these changes' }
            Mock Read-Host { return 's' }

            $result = Invoke-SequentialMerge -WorktreeBranches @('branch-1') -FeatureBranch 'feature/test' -Root $script:testRoot -Feature 'test'

            $result.Status | Should -Be 'escalated_stop'
            $result.Checkpoint | Should -Be 'abc123'
        }
    }

    Context 'conflict with UNRESOLVABLE signal — Keep Going' {
        It 'skips branch and returns escalated_keepgoing' {
            Mock git {
                $joined = $args -join ' '
                if ($joined -match 'rev-parse HEAD') { return 'abc123' }
                if ($joined -match 'merge ') { $global:LASTEXITCODE = 1; return 'CONFLICT (content): Merge conflict' }
                if ($joined -match 'diff --name-only') { return 'file.ps1' }
                if ($joined -match 'merge --abort') { return $null }
                return $null
            }
            Mock Invoke-Claude { return 'UNRESOLVABLE' }
            Mock Read-Host { return 'k' }

            $result = Invoke-SequentialMerge -WorktreeBranches @('branch-1') -FeatureBranch 'feature/test' -Root $script:testRoot -Feature 'test'

            $result.Status | Should -Be 'escalated_keepgoing'
            $result.SkippedBranches | Should -Contain 'branch-1'
        }
    }

    Context 'conflict persists after Claude resolution — Stop' {
        It 'returns escalated_stop when conflicts remain after Claude fix' {
            Mock git {
                $joined = $args -join ' '
                if ($joined -match 'rev-parse HEAD') { return 'abc123' }
                if ($joined -match 'merge ') { $global:LASTEXITCODE = 1; return 'CONFLICT (content): Merge conflict' }
                if ($joined -match 'diff --name-only') { return 'still-conflicted.ps1' }
                if ($joined -match 'merge --abort') { return $null }
                if ($joined -match 'reset --hard') { return $null }
                return $null
            }
            Mock Invoke-Claude { return 'I tried to fix it' }
            Mock Read-Host { return 's' }

            $result = Invoke-SequentialMerge -WorktreeBranches @('branch-1') -FeatureBranch 'feature/test' -Root $script:testRoot -Feature 'test'

            $result.Status | Should -Be 'escalated_stop'
        }
    }

    Context 'conflict persists after Claude resolution — Keep Going' {
        It 'skips branch when user chooses keep going' {
            Mock git {
                $joined = $args -join ' '
                if ($joined -match 'rev-parse HEAD') { return 'abc123' }
                if ($joined -match 'merge ') { $global:LASTEXITCODE = 1; return 'CONFLICT (content): Merge conflict' }
                if ($joined -match 'diff --name-only') { return 'still-conflicted.ps1' }
                if ($joined -match 'merge --abort') { return $null }
                return $null
            }
            Mock Invoke-Claude { return 'I tried to fix it' }
            Mock Read-Host { return 'k' }

            $result = Invoke-SequentialMerge -WorktreeBranches @('branch-1') -FeatureBranch 'feature/test' -Root $script:testRoot -Feature 'test'

            $result.Status | Should -Be 'escalated_keepgoing'
            $result.SkippedBranches | Should -Contain 'branch-1'
        }
    }
}
