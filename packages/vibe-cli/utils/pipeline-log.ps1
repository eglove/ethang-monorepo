$StageCompletePattern = 'STAGE_COMPLETE:(\d+):(.+)'

$script:_colorDeprecationWarned = $false

function Write-PipelineLog {
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [string]$Message,

        [string]$Root,

        # Backward-compatible no-op — accepted but ignored
        [string]$Color
    )
    process {
        if ($Color -and -not $script:_colorDeprecationWarned) {
            $script:_colorDeprecationWarned = $true
            Write-Host "[DEPRECATION] Write-PipelineLog -Color is deprecated and ignored. Remove -Color from callers." -ForegroundColor Yellow
        }

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
