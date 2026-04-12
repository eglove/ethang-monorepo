BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-state.ps1"
    . "$PSScriptRoot/../utils/pipeline-lock.ps1"
}

Describe 'Get-CrashCount' {
    BeforeEach {
        $script:lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "crash-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
        $script:lockFile = Join-Path $script:lockDir 'pipeline.lock'
    }
    AfterEach {
        Remove-Item $script:lockDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns 0 when no lock file exists' {
        Get-CrashCount -LockDir $script:lockDir | Should -Be 0
    }

    It 'returns 0 for fresh lock with crashCount=0' {
        @{ pid = $PID; startTime = (Get-Date).ToString('o'); crashCount = 0 } | ConvertTo-Json | Set-Content $script:lockFile
        Get-CrashCount -LockDir $script:lockDir | Should -Be 0
    }

    It 'returns stored crash count' {
        @{ pid = $PID; startTime = (Get-Date).ToString('o'); crashCount = 2 } | ConvertTo-Json | Set-Content $script:lockFile
        Get-CrashCount -LockDir $script:lockDir | Should -Be 2
    }

    It 'returns 0 for corrupt lock file' {
        Set-Content $script:lockFile -Value '{"corrupt'
        Get-CrashCount -LockDir $script:lockDir | Should -Be 0
    }
}

Describe 'Update-CrashCount' {
    BeforeEach {
        $script:lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "crash-update-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
        $script:lockFile = Join-Path $script:lockDir 'pipeline.lock'
        @{ pid = $PID; startTime = (Get-Date).ToString('o'); crashCount = 0 } | ConvertTo-Json | Set-Content $script:lockFile
    }
    AfterEach {
        Remove-Item $script:lockDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'increments crash count' {
        Update-CrashCount -LockDir $script:lockDir -NewCount 1
        Get-CrashCount -LockDir $script:lockDir | Should -Be 1
    }

    It 'preserves other lock file fields' {
        Update-CrashCount -LockDir $script:lockDir -NewCount 2
        $data = Get-Content $script:lockFile -Raw | ConvertFrom-Json
        $data.pid | Should -Be $PID
        $data.crashCount | Should -Be 2
    }
}

Describe 'Test-CrashBudget' {
    BeforeEach {
        $script:lockDir = Join-Path ([System.IO.Path]::GetTempPath()) "crash-budget-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
        $script:lockFile = Join-Path $script:lockDir 'pipeline.lock'
    }
    AfterEach {
        Remove-Item $script:lockDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns count when within budget' {
        @{ pid = $PID; startTime = (Get-Date).ToString('o'); crashCount = 1 } | ConvertTo-Json | Set-Content $script:lockFile
        Test-CrashBudget -LockDir $script:lockDir -MaxCrashes 3 | Should -Be 1
    }

    It 'throws when crash count >= MaxCrashes' {
        @{ pid = $PID; startTime = (Get-Date).ToString('o'); crashCount = 3 } | ConvertTo-Json | Set-Content $script:lockFile
        { Test-CrashBudget -LockDir $script:lockDir -MaxCrashes 3 } | Should -Throw '*Crash budget exhausted*'
    }

    It 'defaults MaxCrashes to 3' {
        @{ pid = $PID; startTime = (Get-Date).ToString('o'); crashCount = 3 } | ConvertTo-Json | Set-Content $script:lockFile
        { Test-CrashBudget -LockDir $script:lockDir } | Should -Throw '*Crash budget exhausted*'
    }

    It 'allows count of 0 (fresh start)' {
        @{ pid = $PID; startTime = (Get-Date).ToString('o'); crashCount = 0 } | ConvertTo-Json | Set-Content $script:lockFile
        Test-CrashBudget -LockDir $script:lockDir | Should -Be 0
    }

    It 'crash-resume-crash sequence increments correctly' {
        @{ pid = $PID; startTime = (Get-Date).ToString('o'); crashCount = 0 } | ConvertTo-Json | Set-Content $script:lockFile
        # First crash
        Update-CrashCount -LockDir $script:lockDir -NewCount 1
        Test-CrashBudget -LockDir $script:lockDir | Should -Be 1
        # Second crash
        Update-CrashCount -LockDir $script:lockDir -NewCount 2
        Test-CrashBudget -LockDir $script:lockDir | Should -Be 2
        # Third crash — budget exhausted
        Update-CrashCount -LockDir $script:lockDir -NewCount 3
        { Test-CrashBudget -LockDir $script:lockDir } | Should -Throw '*exhausted*'
    }

    It 'fresh start resets to 0' {
        @{ pid = $PID; startTime = (Get-Date).ToString('o'); crashCount = 0 } | ConvertTo-Json | Set-Content $script:lockFile
        Get-CrashCount -LockDir $script:lockDir | Should -Be 0
    }
}
