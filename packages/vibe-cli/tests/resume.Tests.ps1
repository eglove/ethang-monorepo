BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    . "$root/utils/pipeline-log.ps1"
    . "$root/utils/resume.ps1"
}

Describe 'Resume-Pipeline (7-stage)' {
    BeforeEach {
        $testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "resume-test-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
        $logPath = Join-Path $testRoot 'pipeline.log'
    }

    AfterEach {
        Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'parses STAGE_COMPLETE:N:feature markers using StageCompletePattern' {
        Set-Content -Path $logPath -Value @"
[2026-04-12 10:00:00] PIPELINE START runId=20260412T100000-abcd
[2026-04-12 10:01:00] STAGE_COMPLETE:1:auth-flow
[2026-04-12 10:02:00] STAGE_COMPLETE:2:auth-flow
[2026-04-12 10:03:00] STAGE_COMPLETE:3:auth-flow
"@

        $result = Resume-Pipeline -Root $testRoot -LogPath $logPath

        $result.Feature | Should -Be 'auth-flow'
        $result.LastStage | Should -Be 3
        $result.ResumeStage | Should -Be 4
    }

    It 'extracts feature name from marker capture group 2' {
        Set-Content -Path $logPath -Value @"
[2026-04-12 10:00:00] PIPELINE START runId=20260412T100000-abcd
[2026-04-12 10:01:00] STAGE_COMPLETE:1:my-cool-feature
"@

        $result = Resume-Pipeline -Root $testRoot -LogPath $logPath

        $result.Feature | Should -Be 'my-cool-feature'
    }

    It 'detects most recent feature when multiple features exist' {
        Set-Content -Path $logPath -Value @"
[2026-04-12 10:00:00] PIPELINE START runId=20260412T100000-abcd
[2026-04-12 10:01:00] STAGE_COMPLETE:1:old-feature
[2026-04-12 10:02:00] STAGE_COMPLETE:2:old-feature
[2026-04-12 10:05:00] STAGE_COMPLETE:1:new-feature
[2026-04-12 10:06:00] STAGE_COMPLETE:2:new-feature
[2026-04-12 10:07:00] STAGE_COMPLETE:3:new-feature
"@

        $result = Resume-Pipeline -Root $testRoot -LogPath $logPath

        $result.Feature | Should -Be 'new-feature'
        $result.LastStage | Should -Be 3
    }

    It 'rejects stage numbers > 7 as old 8-stage format' {
        Set-Content -Path $logPath -Value @"
[2026-04-12 10:00:00] PIPELINE START runId=20260412T100000-abcd
[2026-04-12 10:01:00] STAGE_COMPLETE:8:auth-flow
"@

        { Resume-Pipeline -Root $testRoot -LogPath $logPath } | Should -Throw '*incompatible*'
    }

    It 'throws when pipeline.log is missing' {
        Remove-Item $logPath -ErrorAction SilentlyContinue

        { Resume-Pipeline -Root $testRoot -LogPath (Join-Path $testRoot 'nonexistent.log') } | Should -Throw
    }

    It 'throws when pipeline.log is empty' {
        Set-Content -Path $logPath -Value ''

        { Resume-Pipeline -Root $testRoot -LogPath $logPath } | Should -Throw '*empty*'
    }

    It 'throws when pipeline.log is corrupted' {
        Set-Content -Path $logPath -Value 'garbled random text with no markers'

        { Resume-Pipeline -Root $testRoot -LogPath $logPath } | Should -Throw
    }

    It 'returns stage 0 when no completion markers exist but log has content' {
        Set-Content -Path $logPath -Value @"
[2026-04-12 10:00:00] PIPELINE START runId=20260412T100000-abcd
[2026-04-12 10:01:00] Stage 1 starting...
"@

        { Resume-Pipeline -Root $testRoot -LogPath $logPath } | Should -Throw
    }

    It 'returns Completed=true when all 7 stages are done (#1 — overflow guard)' {
        Set-Content -Path $logPath -Value @"
[2026-04-12 10:00:00] STAGE_COMPLETE:1:auth-flow
[2026-04-12 10:01:00] STAGE_COMPLETE:2:auth-flow
[2026-04-12 10:02:00] STAGE_COMPLETE:3:auth-flow
[2026-04-12 10:03:00] STAGE_COMPLETE:4:auth-flow
[2026-04-12 10:04:00] STAGE_COMPLETE:5:auth-flow
[2026-04-12 10:05:00] STAGE_COMPLETE:6:auth-flow
[2026-04-12 10:06:00] STAGE_COMPLETE:7:auth-flow
"@

        $result = Resume-Pipeline -Root $testRoot -LogPath $logPath

        $result.Completed | Should -BeTrue
        $result.Feature | Should -Be 'auth-flow'
        $result.LastStage | Should -Be 7
    }
}
