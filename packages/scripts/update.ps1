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
npm i -g wrangler @google/gemini-cli @angular/cli sanity
pnpm approve-builds -g

Set-Location ~/projects/ethang-monorepo/
npx skills add cloudflare/skills --all -y
npx skills add chromedevtools/chrome-devtools-mcp -y
npx skills add vercel-labs/skills -y
npx skills add harshanandak/forge -y