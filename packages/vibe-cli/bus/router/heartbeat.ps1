if (-not ([System.Management.Automation.PSTypeName]'QueueDepthStore').Type) {
    Add-Type -TypeDefinition @'
using System.Threading;
public static class QueueDepthStore {
    private static long _depth = 0;
    public static long Increment() { return Interlocked.Increment(ref _depth); }
    public static long Decrement() { return Interlocked.Decrement(ref _depth); }
    public static long Read() { return Interlocked.Read(ref _depth); }
    public static long Reset() { return Interlocked.Exchange(ref _depth, 0); }
}
'@
}

$script:_HeartbeatTimer = $null
$script:_TickCount = [int64]0
$script:_LastTickAt = $null
$script:_HeartbeatRunning = $false

function Start-HeartbeatTimer {
    param(
        [Parameter(Mandatory)]$Connection,
        [int]$IntervalMs = 5000,
        [scriptblock]$GetUtcNow = $null,
        [scriptblock]$OnTick = $null
    )
    $timer = [System.Timers.Timer]::new($IntervalMs)
    $timer.AutoReset = $true
    Register-ObjectEvent -InputObject $timer -EventName 'Elapsed' -SourceIdentifier 'VibeBus.Heartbeat' -Action {
        if ($null -ne $using:OnTick) { & $using:OnTick } else { Invoke-EmitHeartbeat -Connection $using:Connection -GetUtcNow $using:GetUtcNow }
    } | Out-Null
    $timer.Start()
    $script:_HeartbeatTimer = $timer
    $script:_HeartbeatRunning = $true
}

function Stop-HeartbeatTimer {
    if ($null -ne $script:_HeartbeatTimer) {
        $script:_HeartbeatTimer.Stop()
    }
    $sub = Get-EventSubscriber -SourceIdentifier 'VibeBus.Heartbeat' -ErrorAction SilentlyContinue
    if ($null -ne $sub) {
        Unregister-Event -SourceIdentifier 'VibeBus.Heartbeat' -ErrorAction SilentlyContinue
    }
    # Remove any queued events
    Get-Event -SourceIdentifier 'VibeBus.Heartbeat' -ErrorAction SilentlyContinue | Remove-Event -ErrorAction SilentlyContinue
    $script:_HeartbeatRunning = $false
}

function Invoke-EmitHeartbeat {
    param(
        $Connection,
        [scriptblock]$GetUtcNow = $null
    )
    $utcNow = if ($null -ne $GetUtcNow) { & $GetUtcNow } else { [DateTime]::UtcNow }
    $queueDepth = [QueueDepthStore]::Read()
    $script:_TickCount++
    $banner = "[HEARTBEAT] $($utcNow.ToString('o')) | tick=$($script:_TickCount) | queue_depth=$queueDepth"
    Write-PipelineLog -Message $banner -Severity 'INFO'
    $script:_LastTickAt = $utcNow
    return @{ TickCount = $script:_TickCount; QueueDepth = $queueDepth; Timestamp = $utcNow }
}

function Get-HeartbeatStatus {
    return @{
        Running    = $script:_HeartbeatRunning
        TickCount  = $script:_TickCount
        LastTickAt = $script:_LastTickAt
    }
}

function Test-CrashDetected {
    param(
        [int]$StalenessThresholdMs = 15000,
        [scriptblock]$GetUtcNow = $null
    )
    if ($null -eq $script:_LastTickAt) { return $false }
    $utcNow = if ($null -ne $GetUtcNow) { & $GetUtcNow } else { [DateTime]::UtcNow }
    $elapsed = ($utcNow - $script:_LastTickAt).TotalMilliseconds
    return $elapsed -gt $StalenessThresholdMs
}

function Reset-HeartbeatState {
    Stop-HeartbeatTimer
    $script:_TickCount = 0
    $script:_LastTickAt = $null
    $script:_HeartbeatRunning = $false
}
