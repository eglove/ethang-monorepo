Write-Host "Forcing garbage collection."
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host "Flushing DNS Cache."
Clear-DnsClientCache

Write-Host "Running disk cleanup"
$RegPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches"
Get-ChildItem $RegPath | ForEach-Object {
    Set-ItemProperty -Path "$RegPath\$($_.PSChildName)" -Name StateFlags0001 -Value 2 -Type DWORD -Force
}
Start-Process -Wait "$env:SystemRoot\System32\cleanmgr.exe" -ArgumentList "/sagerun:1" -NoNewWindow

Write-Host "Optimizing System Drive."
try {
    Optimize-Volume -DriveLetter C -Defrag -Verbose
    Write-Host "Drive optimization completed."
}
catch {
    Write-Warning "Could not optimize drive: $($_.Exception.Message)"
}

Write-Host "Clearing font cache."
try {
    Stop-Service "FontCache" -Force
    Remove-Item "$env:SystemRoot\ServiceProfiles\LocalService\AppData\Local\FontCache\*" -Force -Recurse -ErrorAction SilentlyContinue
    Start-Service "FontCache"
    Write-Host "Font cache cleared."
}
catch {
    Write-Warning "Could not clear font cache: $($_.Exception.Message)"
}

Write-Host "Running System File Checker."
Start-Process "sfc" -ArgumentList "/scannow" -Wait -NoNewWindow
