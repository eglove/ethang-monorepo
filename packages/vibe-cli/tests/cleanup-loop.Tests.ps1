BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/cleanup-loop.ps1"
}

Describe 'Invoke-CleanupLoop' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "cleanup-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null

        $script:codeWriterFile = Join-Path $script:tempDir 'writer.md'
        Set-Content $script:codeWriterFile -Value 'writer prompt'
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns Passed when all checks pass for required passes' {
        Mock Push-Location {}
        Mock Pop-Location {}
        Mock pnpm { $global:LASTEXITCODE = 0 }

        $result = Invoke-CleanupLoop `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test context' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Passed | Should -BeTrue
    }

    It 'returns failure at lint when lint fails' {
        Mock Push-Location {}
        Mock Pop-Location {}
        Mock pnpm {
            if ($args[0] -eq 'lint') {
                $global:LASTEXITCODE = 1
                'lint error output'
            } else {
                $global:LASTEXITCODE = 0
            }
        }

        $result = Invoke-CleanupLoop `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test context' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Passed | Should -BeFalse
        $result.FailedAt | Should -Be 'lint'
        $result.Pass | Should -Be 1
    }

    It 'returns failure at test when test fails' {
        $script:callCount = 0
        Mock Push-Location {}
        Mock Pop-Location {}
        Mock pnpm {
            $script:callCount++
            if ($args[0] -eq 'test') {
                $global:LASTEXITCODE = 1
                'test error output'
            } else {
                $global:LASTEXITCODE = 0
            }
        }

        $result = Invoke-CleanupLoop `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test context' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Passed | Should -BeFalse
        $result.FailedAt | Should -Be 'test'
    }

    It 'returns failure at tsc when tsc fails' {
        Mock Push-Location {}
        Mock Pop-Location {}
        Mock pnpm {
            if ($args[0] -eq 'tsc') {
                $global:LASTEXITCODE = 1
                'tsc error output'
            } else {
                $global:LASTEXITCODE = 0
            }
        }

        $result = Invoke-CleanupLoop `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test context' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Passed | Should -BeFalse
        $result.FailedAt | Should -Be 'tsc'
    }

    It 'includes output in failure result' {
        Mock Push-Location {}
        Mock Pop-Location {}
        Mock pnpm {
            $global:LASTEXITCODE = 1
            'detailed error message'
        }

        $result = Invoke-CleanupLoop `
            -CodeWriterFile $script:codeWriterFile `
            -TaskContext 'test context' `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Output | Should -Match 'detailed error message'
    }
}
