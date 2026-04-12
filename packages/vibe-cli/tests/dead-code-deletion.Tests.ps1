BeforeAll {
    $script:vibeCli = Resolve-Path "$PSScriptRoot/.."
}

# =============================================================================
# Dead code deletion — Stage 8 simplification
# =============================================================================

Describe 'Dead Stage 8 code has been deleted' {
    Context 'Deleted directories' {
        It 'agents/code-writers/ does not exist' {
            Join-Path $script:vibeCli 'agents/code-writers' | Should -Not -Exist
        }

        It 'agents/test-writers/ does not exist' {
            Join-Path $script:vibeCli 'agents/test-writers' | Should -Not -Exist
        }
    }

    Context 'Deleted utility files' {
        It 'utils/pipeline-state.ps1 does not exist' {
            Join-Path $script:vibeCli 'utils/pipeline-state.ps1' | Should -Not -Exist
        }

        It 'utils/tdd-cleanup.ps1 does not exist' {
            Join-Path $script:vibeCli 'utils/tdd-cleanup.ps1' | Should -Not -Exist
        }
    }

    Context 'Preserved directories still exist with files' {
        It 'agents/doc-writers/ still exists with files' {
            $dir = Join-Path $script:vibeCli 'agents/doc-writers'
            $dir | Should -Exist
            (Get-ChildItem $dir -File).Count | Should -BeGreaterThan 0
        }

        It 'agents/experts/ still exists with files' {
            $dir = Join-Path $script:vibeCli 'agents/experts'
            $dir | Should -Exist
            (Get-ChildItem $dir -File).Count | Should -BeGreaterThan 0
        }
    }
}
