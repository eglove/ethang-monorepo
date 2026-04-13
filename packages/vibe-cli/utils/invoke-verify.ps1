function Invoke-VerifyCommand {
    param(
        [Parameter(Mandatory)][string]$Command,
        [string]$WorkingDirectory
    )

    $parts = $Command -split '\s+'
    $exe = $parts[0]
    $cmdArgs = if ($parts.Count -gt 1) { $parts[1..($parts.Count - 1)] } else { @() }

    if ($WorkingDirectory) {
        $originalDir = Get-Location
        Set-Location $WorkingDirectory
    }

    try {
        $null = & $exe @cmdArgs 2>&1
        $code = $LASTEXITCODE
        if ($null -eq $code) { $code = 0 }
        return $code
    }
    finally {
        if ($WorkingDirectory -and $originalDir) {
            Set-Location $originalDir
        }
    }
}

function Invoke-ScopedTestVerify {
    param(
        [Parameter(Mandatory)][string[]]$TestFiles,
        [string]$WorkingDirectory
    )

    if ($WorkingDirectory) { Push-Location $WorkingDirectory }
    try {
        $pesterConfig = New-PesterConfiguration
        $pesterConfig.Run.Path = $TestFiles
        $pesterConfig.Run.PassThru = $true
        $pesterConfig.Output.Verbosity = 'None'
        $result = Invoke-Pester -Configuration $pesterConfig
        if ($result.FailedCount -gt 0) { return 1 }
        return 0
    }
    finally {
        if ($WorkingDirectory) { Pop-Location }
    }
}
