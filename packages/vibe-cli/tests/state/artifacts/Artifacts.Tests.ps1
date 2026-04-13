BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../../state/state-repository.psd1') -Force
}

Describe 'Artifacts' {
    BeforeEach {
        $script:testDb = Reset-StateDatabase -InMemory
        New-Feature -Name 'auth-flow'
    }
    AfterEach {
        if ($script:testDb -and (Test-Path $script:testDb)) { Remove-Item $script:testDb -Force }
    }

    It 'registers an artifact for a stage' {
        Register-Artifact -FeatureName 'auth-flow' -Stage 1 -ArtifactType 'elicitor' -FilePath 'docs/auth-flow/elicitor.md'
        $arts = @(Get-Artifact -FeatureName 'auth-flow')
        $arts.Count | Should -Be 1
        $arts[0].artifact_type | Should -BeExactly 'elicitor'
        $arts[0].file_path | Should -BeExactly 'docs/auth-flow/elicitor.md'
    }

    It 'registers multiple artifacts for one stage' {
        Register-Artifact -FeatureName 'auth-flow' -Stage 4 -ArtifactType 'bdd' -FilePath 'docs/auth-flow/bdd.feature'
        Register-Artifact -FeatureName 'auth-flow' -Stage 4 -ArtifactType 'tla' -FilePath 'docs/auth-flow/spec.tla'
        $arts = @(Get-Artifact -FeatureName 'auth-flow' -Stage 4)
        $arts.Count | Should -Be 2
    }

    It 'filters by stage' {
        Register-Artifact -FeatureName 'auth-flow' -Stage 1 -ArtifactType 'elicitor' -FilePath 'docs/elicitor.md'
        Register-Artifact -FeatureName 'auth-flow' -Stage 3 -ArtifactType 'debate' -FilePath 'docs/debate.md'
        $arts = @(Get-Artifact -FeatureName 'auth-flow' -Stage 3)
        $arts.Count | Should -Be 1
        $arts[0].artifact_type | Should -BeExactly 'debate'
    }

    It 'returns all without stage filter' {
        Register-Artifact -FeatureName 'auth-flow' -Stage 1 -ArtifactType 'elicitor' -FilePath 'docs/elicitor.md'
        Register-Artifact -FeatureName 'auth-flow' -Stage 3 -ArtifactType 'debate' -FilePath 'docs/debate.md'
        Register-Artifact -FeatureName 'auth-flow' -Stage 4 -ArtifactType 'bdd' -FilePath 'docs/bdd.feature'
        $arts = @(Get-Artifact -FeatureName 'auth-flow')
        $arts.Count | Should -Be 3
    }

    It 'returns empty when none registered' {
        $arts = Get-Artifact -FeatureName 'auth-flow'
        $arts | Should -BeNullOrEmpty
    }
}
