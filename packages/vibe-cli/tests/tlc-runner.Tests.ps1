BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/tlc-runner.ps1"
}

Describe 'Invoke-TlcCheck' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "tlc-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        $script:writerFile = Join-Path $script:tempDir 'tla-writer.md'
        Set-Content $script:writerFile -Value 'tla writer prompt'
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'throws when no .tla file found' {
        $emptyDir = Join-Path $script:tempDir 'empty'
        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null

        { Invoke-TlcCheck -TlaDir $emptyDir -TlaWriterFile $script:writerFile -MaxAttempts 1 } |
            Should -Throw '*No .tla file*'

        Remove-Item $emptyDir -Recurse -Force
    }

    It 'throws when no .cfg file found' {
        $noCfgDir = Join-Path $script:tempDir 'no-cfg'
        New-Item -ItemType Directory -Path $noCfgDir -Force | Out-Null
        Set-Content (Join-Path $noCfgDir 'Spec.tla') -Value '---- MODULE Spec ----'

        { Invoke-TlcCheck -TlaDir $noCfgDir -TlaWriterFile $script:writerFile -MaxAttempts 1 } |
            Should -Throw '*No .cfg file*'

        Remove-Item $noCfgDir -Recurse -Force
    }

    It 'passes when java returns exit code 0 with clean output' {
        $tlaDir = Join-Path $script:tempDir 'pass'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg') -Value 'SPECIFICATION Spec'

        Mock Push-Location {}
        Mock Pop-Location {}
        Mock java {
            $global:LASTEXITCODE = 0
            'Model checking completed. No error has been found.'
        }

        { Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile -MaxAttempts 1 } |
            Should -Not -Throw

        Remove-Item $tlaDir -Recurse -Force
    }

    It 'retries on failure and calls Invoke-Claude to fix' {
        $tlaDir = Join-Path $script:tempDir 'retry'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg') -Value 'SPECIFICATION Spec'

        Mock Push-Location {}
        Mock Pop-Location {}

        $script:javaCallCount = 0
        Mock java {
            $script:javaCallCount++
            if ($script:javaCallCount -eq 1) {
                $global:LASTEXITCODE = 1
                'Error: invariant violated'
            } else {
                $global:LASTEXITCODE = 0
                'Model checking completed. No error has been found.'
            }
        }
        Mock Invoke-Claude {}

        { Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile -MaxAttempts 2 } |
            Should -Not -Throw

        Should -Invoke Invoke-Claude -Times 1 -Exactly

        Remove-Item $tlaDir -Recurse -Force
    }

    It 'throws after max attempts exceeded' {
        $tlaDir = Join-Path $script:tempDir 'maxfail'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg') -Value 'SPECIFICATION Spec'

        Mock Push-Location {}
        Mock Pop-Location {}
        Mock java {
            $global:LASTEXITCODE = 1
            'Error: deadlock reached'
        }
        Mock Invoke-Claude {}

        { Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile -MaxAttempts 2 } |
            Should -Throw '*failed TLC verification after 2 attempts*'

        Remove-Item $tlaDir -Recurse -Force
    }

    It 'detects failure when exit code is 0 but output contains Error:' {
        $tlaDir = Join-Path $script:tempDir 'sneaky'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg') -Value 'SPECIFICATION Spec'

        Mock Push-Location {}
        Mock Pop-Location {}
        Mock java {
            $global:LASTEXITCODE = 0
            'Error: something went wrong'
        }
        Mock Invoke-Claude {}

        { Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile -MaxAttempts 1 } |
            Should -Throw '*failed TLC verification*'

        Remove-Item $tlaDir -Recurse -Force
    }

    It 'includes FixContext in the fix prompt' {
        $tlaDir = Join-Path $script:tempDir 'fixctx'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'
        Set-Content (Join-Path $tlaDir 'Spec.cfg') -Value 'SPECIFICATION Spec'

        Mock Push-Location {}
        Mock Pop-Location {}

        $script:javaCallCount = 0
        Mock java {
            $script:javaCallCount++
            if ($script:javaCallCount -eq 1) {
                $global:LASTEXITCODE = 1
                'Error: violated'
            } else {
                $global:LASTEXITCODE = 0
                'No error'
            }
        }

        $script:capturedPrompt = $null
        Mock Invoke-Claude {
            param($SystemPromptFile, $Prompt)
            $script:capturedPrompt = $Prompt
        }

        Invoke-TlcCheck -TlaDir $tlaDir -TlaWriterFile $script:writerFile -FixContext 'extra context here' -MaxAttempts 2

        $script:capturedPrompt | Should -Match 'extra context here'

        Remove-Item $tlaDir -Recurse -Force
    }
}
