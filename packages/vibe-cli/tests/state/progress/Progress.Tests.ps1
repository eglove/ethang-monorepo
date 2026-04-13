BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Stage Progress' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'marks a stage as complete' {
        Set-StageComplete -FeatureName 'auth-flow' -Stage 1
        Get-LastCompletedStage -FeatureName 'auth-flow' | Should -Be 1
    }

    It 'marks multiple stages in order' {
        Set-StageComplete -FeatureName 'auth-flow' -Stage 1
        Set-StageComplete -FeatureName 'auth-flow' -Stage 2
        Set-StageComplete -FeatureName 'auth-flow' -Stage 3
        Get-LastCompletedStage -FeatureName 'auth-flow' | Should -Be 3
    }

    It 'returns null when none complete' {
        Get-LastCompletedStage -FeatureName 'auth-flow' | Should -BeNullOrEmpty
    }

    It 'rejects non-sequential stage' {
        Set-StageComplete -FeatureName 'auth-flow' -Stage 1
        Set-StageComplete -FeatureName 'auth-flow' -Stage 2
        { Set-StageComplete -FeatureName 'auth-flow' -Stage 5 } | Should -Throw '*not the next sequential*'
    }

    It 'duplicate stage completion is a no-op' {
        Set-StageComplete -FeatureName 'auth-flow' -Stage 1
        Set-StageComplete -FeatureName 'auth-flow' -Stage 2
        Set-StageComplete -FeatureName 'auth-flow' -Stage 3
        { Set-StageComplete -FeatureName 'auth-flow' -Stage 3 } | Should -Not -Throw
        Get-LastCompletedStage -FeatureName 'auth-flow' | Should -Be 3
    }

    It 'rejects stage below lastCompleted' {
        Set-StageComplete -FeatureName 'auth-flow' -Stage 1
        Set-StageComplete -FeatureName 'auth-flow' -Stage 2
        Set-StageComplete -FeatureName 'auth-flow' -Stage 3
        Set-StageComplete -FeatureName 'auth-flow' -Stage 4
        { Set-StageComplete -FeatureName 'auth-flow' -Stage 2 } | Should -Throw '*below*'
    }

    It 'rejects stage above max (7)' {
        { Set-StageComplete -FeatureName 'auth-flow' -Stage 8 } | Should -Throw '*between 1 and 7*'
    }

    It 'rejects stage 0' {
        { Set-StageComplete -FeatureName 'auth-flow' -Stage 0 } | Should -Throw '*between 1 and 7*'
    }

    It 'rejects negative stage' {
        { Set-StageComplete -FeatureName 'auth-flow' -Stage -1 } | Should -Throw '*between 1 and 7*'
    }
}
