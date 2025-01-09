$currentLocation = Get-Location
Set-Location ~/projects/ethang-monorepo/packages/scripts
Set-Location ~/projects/ethang-monorepo
pnpm all
Set-Location $currentLocation
