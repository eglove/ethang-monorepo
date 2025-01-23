Write-Host "Updating Windows..."
Update-Module PSWindowsUpdate
Get-WindowsUpdate -MicrosoftUpdate -AcceptAll -Install
docker system prune -af

# Visual Studio Update
dotnet tool update -g dotnet-vs

# NPM globals
pnpm self-update
pnpm up -g --latest

# Windows software update
winget upgrade --unknown --all

