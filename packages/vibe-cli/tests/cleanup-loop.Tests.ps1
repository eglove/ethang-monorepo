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
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    BeforeEach {
        # Use scriptblock verify commands that set LASTEXITCODE
        $script:origLint = $Config.VerifyLint
        $script:origTest = $Config.VerifyTest
        $script:origTsc = $Config.VerifyTsc
    }

    AfterEach {
        $Config.VerifyLint = $script:origLint
        $Config.VerifyTest = $script:origTest
        $Config.VerifyTsc = $script:origTsc
    }

    It 'uses Config verify commands instead of hardcoded pnpm' {
        Mock Push-Location {}
        Mock Pop-Location {}

        $Config.VerifyLint = '$global:LASTEXITCODE = 0; "lint ok"'
        $Config.VerifyTest = '$global:LASTEXITCODE = 0; "test ok"'
        $Config.VerifyTsc = '$global:LASTEXITCODE = 0; "tsc ok"'

        $result = Invoke-CleanupLoop `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Passed | Should -BeTrue
    }

    It 'returns Passed when all checks pass for required passes' {
        Mock Push-Location {}
        Mock Pop-Location {}

        $Config.VerifyLint = '$global:LASTEXITCODE = 0'
        $Config.VerifyTest = '$global:LASTEXITCODE = 0'
        $Config.VerifyTsc = '$global:LASTEXITCODE = 0'

        $result = Invoke-CleanupLoop `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Passed | Should -BeTrue
    }

    It 'returns failure at lint when lint fails' {
        Mock Push-Location {}
        Mock Pop-Location {}

        $Config.VerifyLint = '$global:LASTEXITCODE = 1; "lint error output"'
        $Config.VerifyTest = '$global:LASTEXITCODE = 0'
        $Config.VerifyTsc = '$global:LASTEXITCODE = 0'

        $result = Invoke-CleanupLoop `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Passed | Should -BeFalse
        $result.FailedAt | Should -Be 'lint'
        $result.Pass | Should -Be 1
    }

    It 'returns failure at test when test fails' {
        Mock Push-Location {}
        Mock Pop-Location {}

        $Config.VerifyLint = '$global:LASTEXITCODE = 0'
        $Config.VerifyTest = '$global:LASTEXITCODE = 1; "test error output"'
        $Config.VerifyTsc = '$global:LASTEXITCODE = 0'

        $result = Invoke-CleanupLoop `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Passed | Should -BeFalse
        $result.FailedAt | Should -Be 'test'
    }

    It 'returns failure at tsc when tsc fails' {
        Mock Push-Location {}
        Mock Pop-Location {}

        $Config.VerifyLint = '$global:LASTEXITCODE = 0'
        $Config.VerifyTest = '$global:LASTEXITCODE = 0'
        $Config.VerifyTsc = '$global:LASTEXITCODE = 1; "tsc error output"'

        $result = Invoke-CleanupLoop `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Passed | Should -BeFalse
        $result.FailedAt | Should -Be 'tsc'
    }

    It 'includes output in failure result' {
        Mock Push-Location {}
        Mock Pop-Location {}

        $Config.VerifyLint = '$global:LASTEXITCODE = 1; "detailed error message"'
        $Config.VerifyTest = '$global:LASTEXITCODE = 0'
        $Config.VerifyTsc = '$global:LASTEXITCODE = 0'

        $result = Invoke-CleanupLoop `
            -WorktreePath $script:tempDir `
            -TaskId 'T1'

        $result.Output | Should -Match 'detailed error message'
    }
}
