# 1. Start the proxy in the background
Write-Host "Starting Headroom Proxy in the background..." -ForegroundColor Cyan
Start-Job -Name "HeadroomProxy" -ScriptBlock {
  headroom proxy
}

# 2. Run the Claude wrapper in the foreground
Write-Host "Launching Claude..." -ForegroundColor Green
headroom wrap claude --dangerously-skip-permissions

# 3. (Optional) Cleanup: Stop the background job once the foreground app closes
Write-Host "Claude closed. Stopping background proxy..." -ForegroundColor Yellow
Stop-Job -Name "HeadroomProxy"
Remove-Job -Name "HeadroomProxy"
