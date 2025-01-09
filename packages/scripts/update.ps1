Write-Host "Updating Windows..."
Update-Module PSWindowsUpdate
Get-WindowsUpdate -MicrosoftUpdate -AcceptAll -Install
docker system prune -af

# Visual Studio Update
dotnet tool update -g dotnet-vs

# NPM globals
$packages = (npm outdated -g --depth=0 --parseable | ForEach-Object { ($_ -split '\\|/')[-1] }) | Select-Object -Unique
foreach ($package in $packages) {
    npm i -g $package
}

# Windows software update
winget upgrade --unknown --all

