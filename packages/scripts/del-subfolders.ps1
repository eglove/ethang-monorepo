$directory = Read-Host "Directory to Recursively remove"

if (!$directory)
{
    Write-Host "No directory provided."
}
else
{
    Get-ChildItem -Filter $directory -Recurse -Force | Remove-Item -Recurse -Force
}
