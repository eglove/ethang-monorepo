$currentPath = (Get-Location).Path
Write-Output "Updating Windows..."
Update-Module PSWindowsUpdate
Get-WindowsUpdate -MicrosoftUpdate -AcceptAll -Install
#docker system prune -af

# Windows software update
winget upgrade --unknown --all --accept-package-agreements --accept-source-agreements --silent

# MixTex
Write-Output "Updating MiKTeK..."
miktex packages update-package-database
miktex packages update

# NPM globals
corepack install -g npm@latest yarn@latest pnpm@latest
pnpm store prune
npm i -g -y wrangler @google/gemini-cli @angular/cli sanity chrome-devtools-mcp@latest @playwright/cli@latest @earendil-works/pi-coding-agent

Set-Location ~/
npx skills update --project
Set-Location ~\.pi\agent\skills\avoid-ai-writing
git pull
Set-Location $currentPath