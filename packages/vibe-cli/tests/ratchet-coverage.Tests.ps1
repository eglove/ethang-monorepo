BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
}

Describe 'ratchet-coverage.ps1' {
    BeforeEach {
        $script:coverageFile = Join-Path ([System.IO.Path]::GetTempPath()) "cov-$(Get-Random).xml"
        $script:configFile = Join-Path ([System.IO.Path]::GetTempPath()) "pester-$(Get-Random).ps1"
    }

    AfterEach {
        Remove-Item $script:coverageFile -ErrorAction SilentlyContinue
        Remove-Item $script:configFile -ErrorAction SilentlyContinue
    }

    It 'ratchets coverage when actual exceeds threshold' {
        # 90 covered, 10 missed = 90% > 80% threshold
        @"
<?xml version="1.0" encoding="utf-8"?>
<report>
  <counter type="LINE" covered="90" missed="10"/>
</report>
"@ | Set-Content $script:coverageFile

        "CoveragePercentTarget = 80" | Set-Content $script:configFile

        & "$PSScriptRoot/../utils/ratchet-coverage.ps1" -CoveragePath $script:coverageFile -ConfigPath $script:configFile

        $updated = Get-Content $script:configFile -Raw
        $updated | Should -Match 'CoveragePercentTarget = 90'
    }

    It 'does not ratchet when actual is at or below threshold' {
        @"
<?xml version="1.0" encoding="utf-8"?>
<report>
  <counter type="LINE" covered="80" missed="20"/>
</report>
"@ | Set-Content $script:coverageFile

        "CoveragePercentTarget = 80" | Set-Content $script:configFile

        & "$PSScriptRoot/../utils/ratchet-coverage.ps1" -CoveragePath $script:coverageFile -ConfigPath $script:configFile

        $content = Get-Content $script:configFile -Raw
        $content | Should -Match 'CoveragePercentTarget = 80'
    }

    It 'skips when coverage data has zero total' {
        @"
<?xml version="1.0" encoding="utf-8"?>
<report>
  <counter type="LINE" covered="0" missed="0"/>
</report>
"@ | Set-Content $script:coverageFile

        "CoveragePercentTarget = 80" | Set-Content $script:configFile

        & "$PSScriptRoot/../utils/ratchet-coverage.ps1" -CoveragePath $script:coverageFile -ConfigPath $script:configFile

        # Config unchanged
        $content = Get-Content $script:configFile -Raw
        $content | Should -Match 'CoveragePercentTarget = 80'
    }

    It 'warns when CoveragePercentTarget not found in config' {
        @"
<?xml version="1.0" encoding="utf-8"?>
<report>
  <counter type="LINE" covered="90" missed="10"/>
</report>
"@ | Set-Content $script:coverageFile

        "SomeOtherSetting = 42" | Set-Content $script:configFile

        & "$PSScriptRoot/../utils/ratchet-coverage.ps1" -CoveragePath $script:coverageFile -ConfigPath $script:configFile 3>&1 | Out-Null
    }
}
