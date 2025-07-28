Write-Host "Forcing garbage collection."
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host "Flushing DNS Cache."
Clear-DnsClientCache

Write-Host "Optimizing System Drive."
try {
    Optimize-Volume -DriveLetter C -Defrag -Verbose
    Write-Host "Drive optimization completed."
}
catch {
    Write-Warning "Could not optimize drive: $($_.Exception.Message)"
}

Write-Host "Running System File Checker."
Start-Process "sfc" -ArgumentList "/scannow" -Wait -NoNewWindow
