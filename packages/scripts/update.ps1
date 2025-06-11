Write-Host "Updating Windows..."
Update-Module PSWindowsUpdate
Get-WindowsUpdate -MicrosoftUpdate -AcceptAll -Install
#docker system prune -af

# Windows software update
winget upgrade --unknown --all --accept-package-agreements --accept-source-agreements --silent

# MixTex
Write-Host "Updating MiKTeK..."
miktex packages update-package-database
miktex packages update

# NPM globals
corepack install -g pnpm npm yarn
pnpm store prune
pnpm i -g wrangler
pnpm up -g --latest
pnpm approve-builds -g