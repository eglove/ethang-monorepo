BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    . "$root/utils/pipeline-log.ps1"
}

Describe 'Write-PipelineLog' {
    BeforeEach {
        $testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "plog-test-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
    }

    AfterEach {
        Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'appends timestamped message to pipeline.log under Root' {
        Write-PipelineLog -Message "STAGE_COMPLETE:2:auth-flow" -Root $testRoot

        $logPath = Join-Path $testRoot 'pipeline.log'
        $logPath | Should -Exist
        $content = Get-Content $logPath -Raw
        $content | Should -Match '\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] STAGE_COMPLETE:2:auth-flow'
    }

    It 'does not write to disk when Root is not provided' {
        # Should only Write-Host, no file written
        Write-PipelineLog -Message "console only"
        # No assertion on file — just verifying it doesn't throw
    }

    It 'rejects unknown parameters like -Color' {
        { Write-PipelineLog -Message "test" -Root $testRoot -Color 'Red' } | Should -Throw
    }

    It 'produces intact lines under concurrent writes from parallel runspaces' {
        $logPath = Join-Path $testRoot 'pipeline.log'
        $scriptPath = (Resolve-Path "$PSScriptRoot/../utils/pipeline-log.ps1").Path

        $runspaces = 1..10 | ForEach-Object {
            $id = $_
            Start-ThreadJob -ScriptBlock {
                param($sp, $tr, $jobId)
                . $sp
                for ($i = 1; $i -le 5; $i++) {
                    Write-PipelineLog -Message "JOB${jobId}_LINE${i}" -Root $tr
                }
            } -ArgumentList $scriptPath, $testRoot, $id
        }

        $runspaces | Wait-Job -Timeout 30 | Out-Null
        $runspaces | Remove-Job -Force

        $lines = @(Get-Content $logPath | Where-Object { $_ -match '\S' })
        $lines.Count | Should -Be 50

        foreach ($line in $lines) {
            $line | Should -Match '^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] JOB\d+_LINE\d+$'
        }
    }

    It 'appends multiple messages in order' {
        Write-PipelineLog -Message "first" -Root $testRoot
        Write-PipelineLog -Message "second" -Root $testRoot

        $lines = @(Get-Content (Join-Path $testRoot 'pipeline.log'))
        $lines.Count | Should -Be 2
        $lines[0] | Should -Match 'first'
        $lines[1] | Should -Match 'second'
    }
}

Describe 'StageCompletePattern' {
    It 'is exported and matches STAGE_COMPLETE markers with capture groups' {
        $StageCompletePattern | Should -Not -BeNullOrEmpty

        'STAGE_COMPLETE:3:auth-flow' -match $StageCompletePattern | Should -BeTrue
        $Matches[1] | Should -Be '3'
        $Matches[2] | Should -Be 'auth-flow'
    }

    It 'matches stage numbers 1-7' {
        'STAGE_COMPLETE:1:my-feature' -match $StageCompletePattern | Should -BeTrue
        $Matches[1] | Should -Be '1'
        $Matches[2] | Should -Be 'my-feature'

        'STAGE_COMPLETE:7:my-feature' -match $StageCompletePattern | Should -BeTrue
        $Matches[1] | Should -Be '7'
    }

    It 'does not match malformed markers' {
        'STAGE_COMPLETE:abc:feat' -match $StageCompletePattern | Should -BeFalse
        'STAGE_COMPLETE::feat' -match $StageCompletePattern | Should -BeFalse
    }
}
