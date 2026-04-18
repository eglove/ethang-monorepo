Import-Module PSSQLite -ErrorAction SilentlyContinue
$script:_HaltLatch = [int]0

function Get-BusLifecycleState {
    param([Parameter(Mandatory)]$Connection)
    $rows = Invoke-SqliteQuery -SQLiteConnection $Connection -Query "SELECT key,value FROM bus_lifecycle_state"
    $map = @{}; foreach ($r in $rows) { $map[$r.key] = $r.value }
    $plock = if ($map['pipeline_lock']) { [int]$map['pipeline_lock'] } else { 0 }
    return @{ BusStatus=$map['busStatus']; PipelineLock=$plock; HaltReason=$map['halt_reason']; FailureCategory=$map['failure_category']; HaltIntent=$map['halt_intent']; RecoveryOwner=$map['recovery_owner'] }
}

function Invoke-BusHalt {
    param([Parameter(Mandatory)]$Connection,[string]$HaltReason='mechanical_error',[string]$FailureCategory=$null)
    $old=[System.Threading.Interlocked]::CompareExchange([ref]$script:_HaltLatch,1,0)
    if($old -ne 0){return}
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query "UPDATE bus_lifecycle_state SET value='halted' WHERE key='busStatus'"|Out-Null
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query "UPDATE bus_lifecycle_state SET value=@v WHERE key='halt_reason'" -SqlParameters @{v=$HaltReason}|Out-Null
    if($FailureCategory){Invoke-SqliteQuery -SQLiteConnection $Connection -Query "UPDATE bus_lifecycle_state SET value=@v WHERE key='failure_category'" -SqlParameters @{v=$FailureCategory}|Out-Null}
}

function Invoke-BusResume {
    param([Parameter(Mandatory)]$Connection)
    $script:_HaltLatch=0
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query "UPDATE bus_lifecycle_state SET value='running' WHERE key='busStatus'"|Out-Null
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query "UPDATE bus_lifecycle_state SET value=NULL WHERE key='halt_reason'"|Out-Null
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query "UPDATE bus_lifecycle_state SET value=NULL WHERE key='failure_category'"|Out-Null
}

function Invoke-BusResumed {
    param([Parameter(Mandatory)]$Connection)
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query "UPDATE bus_lifecycle_state SET value='running' WHERE key='busStatus' AND value='halted'"|Out-Null
}

function Reset-BusLifecycleLatch { $script:_HaltLatch=0 }
