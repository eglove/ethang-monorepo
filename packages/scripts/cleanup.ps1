Write-Information "Forcing garbage collection."
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Information "Flushing DNS Cache."
Clear-DnsClientCache

Write-Information "Running disk cleanup"
$RegPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches"
Get-ChildItem $RegPath | ForEach-Object {
    Set-ItemProperty -Path "$RegPath\$($_.PSChildName)" -Name StateFlags0001 -Value 2 -Type DWORD -Force
}
Start-Process -Wait "$env:SystemRoot\System32\cleanmgr.exe" -ArgumentList "/sagerun:1" -NoNewWindow

Write-Information "Optimizing system Drive."
try {
    Optimize-Volume -DriveLetter C -ReTrim -Verbose
    Write-Information "Drive optimization completed."
}
catch {
    Write-Warning "Could not optimize drive: $($_.Exception.Message)"
}

Write-Information "Running system File Checker."
Start-Process "sfc" -ArgumentList "/scannow" -Wait -NoNewWindow
