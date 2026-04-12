BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-state.ps1"
    . "$PSScriptRoot/../utils/pipeline-lock.ps1"
}

Describe 'Complete-Pipeline' {
    BeforeEach {
        $script:lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "complete-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
        Set-Content (Join-Path $script:lockDir 'pipeline.lock') -Value '{"pid":1}'
    }
    AfterEach { Remove-Item $script:lockDir -Recurse -Force -ErrorAction SilentlyContinue }

    It 'releases lock on completion' {
        $state = @{ pipelineState = 'running'; lockHolder = 1; pipelineAborted = $false }
        Complete-Pipeline -State $state -LockDir $script:lockDir -RunId 'test'
        Join-Path $script:lockDir 'pipeline.lock' | Should -Not -Exist
        $state.lockHolder | Should -BeNullOrEmpty
    }

    It 'writes PIPELINE COMPLETE marker to log' {
        $logPath = Join-Path $script:lockDir 'complete.log'
        $writer = [System.IO.StreamWriter]::new($logPath)
        $state = @{ pipelineState = 'running'; lockHolder = 1; pipelineAborted = $false }
        Complete-Pipeline -State $state -LockDir $script:lockDir -LogWriter $writer -RunId 'abc123'
        $writer.Close()
        Get-Content $logPath -Raw | Should -Match 'PIPELINE COMPLETE.*abc123'
    }

    It 'advances pipelineStage to NumStages+1' {
        $state = @{ pipelineState = 'running'; lockHolder = 1; pipelineAborted = $false; pipelineStage = 8 }
        $result = Complete-Pipeline -State $state -LockDir $script:lockDir -RunId 'test' -NumStages 8
        $state.pipelineStage | Should -Be 9
        $state.pipelineState | Should -BeExactly 'COMPLETE'
    }

    It 'is idempotent — calling twice is no-op' {
        $state = @{ pipelineState = 'running'; lockHolder = 1; pipelineAborted = $false }
        Complete-Pipeline -State $state -LockDir $script:lockDir -RunId 'test'
        $result = Complete-Pipeline -State $state -LockDir $script:lockDir -RunId 'test'
        $result.alreadyComplete | Should -BeTrue
    }

    It 'throws when lock not held' {
        $state = @{ pipelineState = 'running'; lockHolder = $null; pipelineAborted = $false }
        { Complete-Pipeline -State $state -LockDir $script:lockDir -RunId 'test' } | Should -Throw '*lock not held*'
    }

    It 'throws when abort flag set' {
        $state = @{ pipelineState = 'running'; lockHolder = 1; pipelineAborted = $true }
        { Complete-Pipeline -State $state -LockDir $script:lockDir -RunId 'test' } | Should -Throw '*abort*'
    }
}
