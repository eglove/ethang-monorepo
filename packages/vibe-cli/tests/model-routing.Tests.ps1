BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
}

Describe 'model-routing.psd1' {
    BeforeAll {
        $script:ConfigPath = "$PSScriptRoot/../config/model-routing.psd1"
        $script:ValidModels = @('opus', 'sonnet', 'haiku')
        $script:ExpectedRoles = @('elicitor', 'doc-writer', 'expert', 'moderator', 'reviewer', 'code-writer')
    }

    AfterEach {
        if ($script:TempFile -and (Test-Path $script:TempFile)) {
            Remove-Item $script:TempFile -Force -ErrorAction SilentlyContinue
        }
        $script:TempFile = $null
    }

    It 'is a valid hashtable' {
        $result = Import-PowerShellDataFile -Path $script:ConfigPath
        $result | Should -BeOfType [hashtable]
    }

    It 'contains all six required role keys' {
        $result = Import-PowerShellDataFile -Path $script:ConfigPath
        foreach ($role in $script:ExpectedRoles) {
            $result.ContainsKey($role) | Should -BeTrue -Because "role '$role' must be present"
        }
    }

    It 'has values only from the valid model set' {
        $result = Import-PowerShellDataFile -Path $script:ConfigPath
        foreach ($key in $result.Keys) {
            $script:ValidModels | Should -Contain $result[$key] -Because "value for '$key' must be opus, sonnet, or haiku"
        }
    }

    It 'maps each role to the correct canonical model' {
        $result = Import-PowerShellDataFile -Path $script:ConfigPath
        $result['elicitor']     | Should -Be 'opus'
        $result['doc-writer']   | Should -Be 'sonnet'
        $result['expert']       | Should -Be 'sonnet'
        $result['moderator']    | Should -Be 'opus'
        $result['reviewer']     | Should -Be 'haiku'
        $result['code-writer']  | Should -Be 'sonnet'
    }

    It 'has exactly six keys — no extras' {
        $result = Import-PowerShellDataFile -Path $script:ConfigPath
        $result.Count | Should -Be 6
    }

    It 'rejects a malformed .psd1 with a parse error (Rec9)' {
        $script:TempFile = [System.IO.Path]::GetTempFileName() + '.psd1'
        Set-Content -Path $script:TempFile -Value "@{ elicitor = 'opus'"

        { Import-PowerShellDataFile -Path $script:TempFile -ErrorAction Stop } | Should -Throw
    }
}
