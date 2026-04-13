$StageCompletePattern = 'STAGE_COMPLETE:(\d+):(.+)'

function New-RunId {
    $ts = Get-Date -Format 'yyyyMMddTHHmmss'
    $hex = -join ((1..4) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
    return "$ts-$hex"
}

function Get-RunIdFromLog {
    param([Parameter(Mandatory)][string]$LogPath)
    $pattern = 'PIPELINE START runId=(\d{8}T\d{6}-[0-9a-f]{4})(?:\s|$)'
    if (-not (Test-Path $LogPath)) { throw "Pipeline log not found: $LogPath" }
    $content = Get-Content $LogPath -Raw
    if ($content -match $pattern) { return $Matches[1] }
    throw "No valid runId found in pipeline log"
}

function Write-PipelineLog {
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [string]$Message,

        [string]$Root
    )
    process {
        $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        $line = "[$ts] $Message"
        Write-Host $line

        if ($Root) {
            $logPath = Join-Path $Root 'pipeline.log'
            $mutexName = 'Global\VibePipelineLog'
            $mutex = [System.Threading.Mutex]::new($false, $mutexName)
            try {
                try {
                    $null = $mutex.WaitOne(5000)
                }
                catch [System.Threading.AbandonedMutexException] {
                    # Mutex acquired despite prior holder crashing — safe to proceed
                }
                Add-Content -Path $logPath -Value $line
            }
            finally {
                $mutex.ReleaseMutex()
                $mutex.Dispose()
            }
        }
    }
}
