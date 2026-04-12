BeforeAll {
    . "$PSScriptRoot/../utils/playwright-detect.ps1"
}

Describe 'Get-PlaywrightStrategy' {
    BeforeEach {
        $script:projDir = Join-Path ([System.IO.Path]::GetTempPath()) "pw-detect-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:projDir -Force | Out-Null
    }

    AfterEach {
        Remove-Item $script:projDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns "playwright" when @playwright/test is in devDependencies' {
        $pkg = @{ name = 'test-project'; devDependencies = @{ '@playwright/test' = '^1.40.0' } } | ConvertTo-Json
        Set-Content (Join-Path $script:projDir 'package.json') -Value $pkg
        Get-PlaywrightStrategy -ProjectPath $script:projDir | Should -BeExactly 'playwright'
    }

    It 'returns "playwright" when @playwright/test is in dependencies' {
        $pkg = @{ name = 'test-project'; dependencies = @{ '@playwright/test' = '^1.40.0' } } | ConvertTo-Json
        Set-Content (Join-Path $script:projDir 'package.json') -Value $pkg
        Get-PlaywrightStrategy -ProjectPath $script:projDir | Should -BeExactly 'playwright'
    }

    It 'returns "trace-replay" when @playwright/test is absent' {
        $pkg = @{ name = 'test-project'; devDependencies = @{ 'vitest' = '^1.0.0' } } | ConvertTo-Json
        Set-Content (Join-Path $script:projDir 'package.json') -Value $pkg
        Get-PlaywrightStrategy -ProjectPath $script:projDir | Should -BeExactly 'trace-replay'
    }

    It 'returns "trace-replay" when no package.json exists' {
        Get-PlaywrightStrategy -ProjectPath $script:projDir | Should -BeExactly 'trace-replay'
    }

    It 'returns "trace-replay" when package.json has no dependencies keys' {
        $pkg = @{ name = 'test-project' } | ConvertTo-Json
        Set-Content (Join-Path $script:projDir 'package.json') -Value $pkg
        Get-PlaywrightStrategy -ProjectPath $script:projDir | Should -BeExactly 'trace-replay'
    }

    It 'returns "trace-replay" with warning on corrupted package.json' {
        Set-Content (Join-Path $script:projDir 'package.json') -Value '{"invalid json'
        Mock Write-Warning {}
        Get-PlaywrightStrategy -ProjectPath $script:projDir | Should -BeExactly 'trace-replay'
        Should -Invoke Write-Warning -Times 1 -ParameterFilter { $Message -match 'Corrupted' }
    }

    It 'returns string type result' {
        $pkg = @{ devDependencies = @{ '@playwright/test' = '1.0.0' } } | ConvertTo-Json
        Set-Content (Join-Path $script:projDir 'package.json') -Value $pkg
        $result = Get-PlaywrightStrategy -ProjectPath $script:projDir
        $result | Should -BeOfType [string]
        $result | Should -BeIn @('playwright', 'trace-replay')
    }
}
