$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$eslintConfigDirectory = Join-Path $scriptDir "packages\eslint-config"

corepack up
Start-Process webstorm .
Set-Location $eslintConfigDirectory
Write-Output "Updating dependencies in eslint-config..."
pnpm up -i --latest
pnpm --bail build

# Return to root directory and update dependencies
Set-Location $scriptDir
Write-Output "Updating dependencies in monorepo..."
pnpm up -r -i --latest
pnpm approve-builds

# Get apps and packages directories
$apps = Get-ChildItem -Path (Join-Path $scriptDir "apps") -Directory | Select-Object -ExpandProperty Name
$packages = Get-ChildItem -Path (Join-Path $scriptDir "packages") -Directory | Select-Object -ExpandProperty Name

# Function to update wrangler types
function Update-WranglerType {
    [CmdletBinding(SupportsShouldProcess)]
    param (
        [string]$prefix,
        [array]$directories
    )

    foreach ($directory in $directories) {
        $dirPath = Join-Path $scriptDir "$prefix\$directory"
        if (Test-Path $dirPath) {
            Set-Location $dirPath

            if (Test-Path "wrangler.jsonc") {
                $wranglerJson = Get-Content -Path "wrangler.jsonc" -Raw | ConvertFrom-Json | Sort-Object
                $wranglerJson."compatibility_date" = Get-Date -Format "yyyy-MM-dd"
                $wranglerJson | ConvertTo-Json -Depth 100 | Set-Content -Path "wrangler.jsonc"
                pnpm dlx prettier --write --trailing-comma none wrangler.jsonc
            }
        }
    }
}

# Update wrangler types in apps and packages
Write-Output "Updating wrangler types..."
Update-WranglerType -prefix "apps" -directories $apps
Update-WranglerType -prefix "packages" -directories $packages

# Return to root directory and run final commands
Set-Location $scriptDir
./repo-check.ps1

Write-Output "Bump process completed successfully!"
