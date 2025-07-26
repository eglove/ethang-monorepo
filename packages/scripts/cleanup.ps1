Write-Host "Forcing garbage collection."
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host "Flushing DNS Cache."
Clear-DnsClientCache

Write-Host "Clearing temp files."
$tempPath = [System.IO.Path]::GetTempPath()
try {
    Get-ChildItem -Path $tempPath -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "User temporary files cleared."
}
catch {
    Write-Warning "Could not clear all user temporary files: $($_.Exception.Message)"
}

Write-Host "Emptying Recycle Bin."
try {
    Clear-RecycleBin -Force -ErrorAction SilentlyContinue
    Write-Host "Recycle Bin emptied."
}
catch {
    Write-Warning "Could not empty Recycle Bin: $($_.Exception.Message)"
}

Write-Host "Running disk cleanup"
$RegPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches"
Get-ChildItem $RegPath | ForEach-Object {
    Set-ItemProperty -Path "$RegPath\$($_.PSChildName)" -Name StateFlags0001 -Value 2 -Type DWORD -Force
}
Start-Process -Wait "$env:SystemRoot\System32\cleanmgr.exe" -ArgumentList "/sagerun:1" -NoNewWindow
