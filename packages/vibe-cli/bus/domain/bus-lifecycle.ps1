$script:_BusLifecycleState = 'stopped'
$script:_HaltLatch = [int]0

function Get-BusLifecycleState { return $script:_BusLifecycleState }

function Invoke-BusHalt {
    param(
        [string]$HaltReason = 'mechanical_error',
        [string]$FailureCategory = $null
    )
    $old = [System.Threading.Interlocked]::CompareExchange([ref]$script:_HaltLatch, 1, 0)
    if ($old -eq 0) { $script:_BusLifecycleState = 'halted' }
}

function Invoke-BusReleasePipelineLock { param($Connection) }
