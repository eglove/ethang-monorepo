param (
    [Parameter(Mandatory=$true)]
    [string] $path
)

Get-ChildItem -Path $path -Recurse -File | ForEach-Object {
    Move-Item -Path $_.FullName -Destination $path -Force
}

$delete = Read-Host -Prompt 'Would you like to delete all subdirectories? (Y/N)'

if ($delete -eq 'Y') {
    Get-ChildItem -Path $path -Recurse -Directory | ForEach-Object {
        Remove-Item -Path $_.FullName -Force -Recurse
    }
}
