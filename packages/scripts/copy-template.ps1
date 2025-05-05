$directory = Read-Host "Project Directory"

$templateOptions = @(
    [PSCustomObject]@{ Name = "react-vite"; Value = "react-vite" }
)

$template = $null
while ($null -eq $template)
{
    Write-Host "Chooose template:"
    for ($i = 0; $i -lt $array.Count; $i++) {
        Write-Host "$( $i + 1 ). $( $templateOptions[$i].Name )"
    }

    $selection = Read-Host "Enter number (1-4)"

    if ($selection -match "^[1-4]$")
    {
        $template = $templateOptions[[int]$selection - 1].Value
    }
    else
    {
        Write-Host "Invalid selection."
    }
}


if ($template -eq "react-vite")
{
    if (-not (Test-Path -Path $directory))
    {
        New-Item -ItemType Directory -Path $directory | Out-Null
    }

    $sourcePath = "./templates/react-vite/"

    $excludeItems = @(
        ".wrangler",
        "dist",
        "node_modules",
        ".env"
    )

    Copy-Item -Path ($sourcePath + "*") -Destination $directory -Recurse -Exclude $excludeItems -Container -Force
}