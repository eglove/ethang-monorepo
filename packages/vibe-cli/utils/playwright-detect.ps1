function Get-PlaywrightStrategy {
    param(
        [Parameter(Mandatory)][string]$ProjectPath
    )

    $pkgPath = Join-Path $ProjectPath 'package.json'

    if (-not (Test-Path $pkgPath)) {
        return 'trace-replay'
    }

    try {
        $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    }
    catch {
        Write-Warning "Corrupted package.json at $pkgPath — falling back to trace-replay"
        return 'trace-replay'
    }

    $hasPw = $false
    if ($pkg.dependencies -and $pkg.dependencies.'@playwright/test') { $hasPw = $true }
    if ($pkg.devDependencies -and $pkg.devDependencies.'@playwright/test') { $hasPw = $true }

    if ($hasPw) { return 'playwright' }
    return 'trace-replay'
}
