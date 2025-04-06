$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$eslintConfigDirectory = Join-Path $scriptDir "packages\eslint-config"

Set-Location $eslintConfigDirectory
Write-Host "Updating dependencies in eslint-config..."
pnpm up -i --latest

$updateTypeOptions = @(
    [PSCustomObject]@{Name = "patch"; Value = "patch"},
    [PSCustomObject]@{Name = "minor"; Value = "minor"},
    [PSCustomObject]@{Name = "major"; Value = "major"},
    [PSCustomObject]@{Name = "none"; Value = "none"}
)

$updateType = $null
while ($null -eq $updateType) {
    Write-Host "Choose Semver update type:"
    for ($i = 0; $i -lt $updateTypeOptions.Count; $i++) {
        Write-Host "$($i+1). $($updateTypeOptions[$i].Name)"
    }
    $selection = Read-Host "Enter number (1-4)"
    
    if ($selection -match "^[1-4]$") {
        $updateType = $updateTypeOptions[[int]$selection - 1].Value
    } else {
        Write-Host "Invalid selection. Please try again."
    }
}

if ($updateType -ne "none") {
    # Get current version from npm registry
    Write-Host "Fetching current version from npm registry..."
    $response = Invoke-RestMethod -Uri "https://registry.npmjs.org/@ethang/eslint-config"
    $currentVersion = $response."dist-tags".latest
    
    # Update version, build, and publish
    Write-Host "Updating version to $updateType..."
    pnpm version $updateType
    
    Write-Host "Building package..."
    pnpm build
    
    Set-Location (Join-Path $eslintConfigDirectory "dist")
    Write-Host "Publishing package..."
    pnpm publish --no-git-checks
    
    # Wait for registry to update
    $registryUpdated = $false
    $attempts = 1
    Write-Host "Waiting for registry to update..."
    while (-not $registryUpdated) {
        Write-Host "Attempt $attempts..."
        $attempts++
        
        $response = Invoke-RestMethod -Uri "https://registry.npmjs.org/@ethang/eslint-config"
        $latestVersion = $response."dist-tags".latest
        
        if ($latestVersion -ne $currentVersion) {
            $registryUpdated = $true
        } else {
            Start-Sleep -Seconds 5
        }
    }
}

# Return to root directory and update dependencies
Set-Location $scriptDir
Write-Host "Updating dependencies in monorepo..."
pnpm up -r -i --latest
pnpm approve-builds

# Get apps and packages directories
$apps = Get-ChildItem -Path (Join-Path $scriptDir "apps") -Directory | Select-Object -ExpandProperty Name
$packages = Get-ChildItem -Path (Join-Path $scriptDir "packages") -Directory | Select-Object -ExpandProperty Name

# Function to update wrangler types
function Update-WranglerTypes {
    param (
        [string]$prefix,
        [array]$directories
    )
    
    foreach ($directory in $directories) {
        $dirPath = Join-Path $scriptDir "$prefix\$directory"
        if (Test-Path $dirPath) {
            Set-Location $dirPath
            
            if (Test-Path "package.json") {
                $packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
                $workersTypes = $packageJson.devDependencies."@cloudflare/workers-types"
                
                if ($workersTypes) {
                    $dateString = $workersTypes.Split('.')[1]
                    $workersTypeVersion = "$($dateString.Substring(0, 4))-$($dateString.Substring(4, 2))-$($dateString.Substring(6, 2))"
                    
                    if (Test-Path "wrangler.jsonc") {
                        $wranglerJson = Get-Content -Path "wrangler.jsonc" -Raw | ConvertFrom-Json
                        $wranglerJson."compatibility_date" = $workersTypeVersion
                        $wranglerJson | ConvertTo-Json -Depth 100 | Set-Content -Path "wrangler.jsonc"
                        npx prettier wrangler.jsonc
                        bun ../../packages/scripts/sort-json.ts wrangler.jsonc
                    }
                    
                    if (Test-Path "tsconfig.json") {
                        $tsconfigJson = Get-Content -Path "tsconfig.json" -Raw | ConvertFrom-Json
                        $tsconfigJson.compilerOptions.types = @("@cloudflare/workers-types/$workersTypeVersion")
                        $tsconfigJson | ConvertTo-Json -Depth 100 | Set-Content -Path "tsconfig.json"
                        npx prettier tsconfig.json
                        bun ../../packages/scripts/sort-json.ts tsconfig.json
                    }
                }
            }
        }
    }
}

# Update wrangler types in apps and packages
Write-Host "Updating wrangler types..."
Update-WranglerTypes -prefix "apps" -directories $apps
Update-WranglerTypes -prefix "packages" -directories $packages

# Return to root directory and run final commands
Set-Location $scriptDir
Write-Host "Building monorepo..."
pnpm build
Write-Host "Running tests..."
pnpm test
Write-Host "Running linter..."
pnpm lint
Write-Host "Pruning dependencies..."
pnpm prune

Write-Host "Bump process completed successfully!"