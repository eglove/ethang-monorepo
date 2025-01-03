Write-Host "Updating Windows..."
Update-Module PSWindowsUpdate
Get-WindowsUpdate -MicrosoftUpdate -AcceptAll -Install
docker system prune -af

# Visual Studio Update
dotnet tool update -g dotnet-vs
winget upgrade --unknown --all

