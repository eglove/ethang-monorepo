Write-Host "Updating Windows..."
Update-Module PSWindowsUpdate
Get-WindowsUpdate -MicrosoftUpdate -AcceptAll -Install
#docker system prune -af

# NPM globals
pnpm store prune
pnpm i -g wrangler
pnpm up -g --latest

# Windows software update
winget upgrade --unknown --all --accept-package-agreements --accept-source-agreements --silent
