function Write-PipelineLog {
    param([string]$Message, [string]$Root)
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$ts] $Message"
    Write-Host $line
    if ($Root) {
        $logPath = Join-Path $Root 'pipeline.log'
        Add-Content -Path $logPath -Value $line
    }
}
