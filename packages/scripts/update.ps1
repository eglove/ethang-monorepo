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
npx skills add cloudflare/skills -y
npx skills add tanstack-skills/tanstack-skills -y
npx skills add chromedevtools/chrome-devtools-mcp -y
npx skills add https://github.com/vercel-labs/skills --skill find-skills -y
npx skills add https://github.com/harshanandak/forge --skill sonarcloud-analysis -y
npx skills add https://github.com/mattpocock/skills --skill grill-me -y