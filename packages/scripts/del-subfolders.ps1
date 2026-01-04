param (
    [Parameter(Mandatory=$false)]
    [Alias("d")]
    [string]$Directory
)

if (-not $Directory) {
    $Directory = Read-Host "Directory to recursively remove"
}

if (-not $Directory -or -not (Test-Path $Directory)) {
    Write-Warning "No valid directory provided or path does not exist: $Directory"
}
else {
    Get-ChildItem -Filter $directory -Recurse -Force | Remove-Item -Recurse -Force
    Write-Host "Cleanup of $Directory complete." -ForegroundColor Green
}