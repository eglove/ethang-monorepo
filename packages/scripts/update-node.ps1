$currentLocation = Get-Location
Set-Location ~/projects/ethang-monorepo/packages/scripts
node update-node.mjs
npm i -g npm pnpm yarn typescript prisma nextui-cli bun
Set-Location ~/projects/ethang-monorepo
pnpm all
Set-Location $currentLocation
