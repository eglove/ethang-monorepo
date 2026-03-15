param (
    [string]$routeName = "Route",
    [string]$mapId = "0"
)

$inputFile = "waypoints.txt"
$currentMapId = $mapId

# Regex to extract: /way [#ID] X Y Description
$regex = '/way\s+(?:#(?<id>\d+)\s+)?(?<x>[\d.]+)\s+(?<y>[\d.]+)'

$coordObjects = Get-Content $inputFile | ForEach-Object {
    if ($_ -match $regex)
    {
        if ($Matches.id) {
            $currentMapId = $Matches.id
        }
        [PSCustomObject]@{
            X = [float]$Matches.x / 100
            Y = [float]$Matches.y / 100
        }
    }
}

$optimizedCoords = New-Object System.Collections.Generic.List[PSCustomObject]
$remainingCoords = [System.Collections.Generic.List[PSCustomObject]]@($coordObjects)

if ($remainingCoords.Count -gt 0) {
    # Start with the first waypoint
    $current = $remainingCoords[0]
    $optimizedCoords.Add($current)
    $remainingCoords.RemoveAt(0)

    while ($remainingCoords.Count -gt 0) {
        $closestIndex = -1
        $minDistanceSq = [float]::MaxValue

        for ($i = 0; $i -lt $remainingCoords.Count; $i++) {
            $other = $remainingCoords[$i]
            $dx = $current.X - $other.X
            $dy = $current.Y - $other.Y
            $distSq = $dx * $dx + $dy * $dy

            if ($distSq -lt $minDistanceSq) {
                $minDistanceSq = $distSq
                $closestIndex = $i
            }
        }

        $current = $remainingCoords[$closestIndex]
        $optimizedCoords.Add($current)
        $remainingCoords.RemoveAt($closestIndex)
    }
}

$coordsStrings = $optimizedCoords | ForEach-Object {
    $xDec = [math]::Round($_.X, 4)
    $yDec = [math]::Round($_.Y, 4)
    "$xDec,$yDec"
}

$coordString = $coordsStrings -join ";"
$finalExport = "RP!2!Retail!$routeName!$currentMapId!1.00,1.00,0.00,0.80!1!$coordString"

$finalExport | Set-Clipboard

Write-Host "--- ROUTEPLANNER EXPORT ---" -ForegroundColor Cyan
Write-Host $finalExport
Write-Host "`nSuccess! String copied to clipboard using Set-Clipboard." -ForegroundColor Green