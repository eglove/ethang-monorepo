$script:ChildPidRegistry = [System.Collections.Concurrent.ConcurrentDictionary[string,int]]::new()
$script:TaskWallClocks = [System.Collections.Concurrent.ConcurrentDictionary[string,System.Diagnostics.Stopwatch]]::new()

function New-TierCompletionCounter {
    return [System.Collections.Concurrent.ConcurrentDictionary[string, int]]::new()
}

function Add-TierCompletion {
    param(
        [Parameter(Mandatory)][System.Collections.Concurrent.ConcurrentDictionary[string, int]]$Counter,
        [Parameter(Mandatory)][string]$TierKey
    )
    # Atomic increment via AddOrUpdate
    $null = $Counter.AddOrUpdate($TierKey, 1, [Func[string, int, int]]{ param($k, $old) $old + 1 })
    return $Counter[$TierKey]
}

function Get-TierCompletion {
    param(
        [Parameter(Mandatory)][System.Collections.Concurrent.ConcurrentDictionary[string, int]]$Counter,
        [Parameter(Mandatory)][string]$TierKey
    )
    $val = 0
    $null = $Counter.TryGetValue($TierKey, [ref]$val)
    return $val
}

function Test-TierAllSucceeded {
    param(
        [Parameter(Mandatory)][int]$CompletedCount,
        [Parameter(Mandatory)][int]$TotalTasks,
        [Parameter(Mandatory)][int]$FailedCount
    )
    return ($CompletedCount -ge $TotalTasks) -and ($FailedCount -lt $TotalTasks)
}

function Get-ChildPidRegistry {
    return $script:ChildPidRegistry
}

function Stop-ProcessTree {
    param([Parameter(Mandatory)][int]$ProcessId)

    $killed = @{}

    function Kill-Descendants {
        param([int]$ParentId)

        $children = @()
        try {
            $children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$ParentId" -ErrorAction SilentlyContinue |
                Select-Object -ExpandProperty ProcessId
        }
        catch { }

        foreach ($childPid in $children) {
            Kill-Descendants -ParentId $childPid
        }

        # Kill after recursing into children (leaf-to-root)
        try {
            Stop-Process -Id $ParentId -Force -ErrorAction Stop
            $killed[$ParentId] = $true
        }
        catch {
            # Process may have already exited
        }
    }

    Kill-Descendants -ParentId $ProcessId
    return $killed
}

function Invoke-WithTimeout {
    param(
        [Parameter(Mandatory)][scriptblock]$ScriptBlock,
        [Parameter(Mandatory)][string]$TaskId,
        [string]$WriterType,
        [hashtable]$ArgumentList = @{}
    )

    # Resolve timeout from writer type or default
    $timeout = $Config.JobTimeoutSeconds
    if ($WriterType -and $Config.TaskTimeouts.ContainsKey($WriterType)) {
        $timeout = $Config.TaskTimeouts[$WriterType]
    }

    # Check per-task wall-clock budget
    $sw = $script:TaskWallClocks.GetOrAdd($TaskId, { [System.Diagnostics.Stopwatch]::StartNew() })
    if (-not $sw.IsRunning) { $sw.Start() }

    if ($sw.Elapsed.TotalSeconds -gt $Config.TaskMaxWallClockSeconds) {
        return @{
            TimedOut       = $true
            BudgetExceeded = $true
            TaskId         = $TaskId
            KilledPids     = @()
        }
    }

    # Direct invocation with timeout via background watchdog timer.
    # ThreadJobs run in isolated runspaces where dot-sourced functions
    # (Invoke-RedPhase, etc.) are unavailable. Instead, invoke the script
    # block directly in the current scope and use a timer to enforce the
    # timeout by killing child processes.

    $timedOut = $false
    $killedPids = @()
    $deadlineTimer = $null

    try {
        # Start a watchdog timer that fires once after $timeout seconds
        $deadlineTimer = [System.Timers.Timer]::new($timeout * 1000)
        $deadlineTimer.AutoReset = $false

        $timedOutRef = [ref]$false
        $killedRef = [ref]@()
        $taskIdCapture = $TaskId
        $pidReg = $script:ChildPidRegistry

        $null = Register-ObjectEvent -InputObject $deadlineTimer -EventName Elapsed -Action {
            $timedOutRef = $Event.MessageData.TimedOutRef
            $timedOutRef.Value = $true

            $childPid = 0
            $reg = $Event.MessageData.PidRegistry
            $tid = $Event.MessageData.TaskId

            if ($reg.TryGetValue($tid, [ref]$childPid)) {
                try {
                    # Kill child process tree on timeout
                    $children = @()
                    try {
                        $children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$childPid" -ErrorAction SilentlyContinue |
                            Select-Object -ExpandProperty ProcessId
                    } catch { }
                    foreach ($c in $children) {
                        try { Stop-Process -Id $c -Force -ErrorAction SilentlyContinue } catch { }
                    }
                    Stop-Process -Id $childPid -Force -ErrorAction SilentlyContinue
                } catch { }
            }
            else {
                # Fallback: kill claude processes matching this task
                try {
                    $claudeProcs = Get-CimInstance Win32_Process -Filter "Name='claude.exe'" -ErrorAction SilentlyContinue
                    foreach ($proc in $claudeProcs) {
                        if ($proc.CommandLine -match [regex]::Escape($tid)) {
                            try { Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue } catch { }
                        }
                    }
                } catch { }
            }
        } -MessageData @{
            TimedOutRef = $timedOutRef
            PidRegistry = $pidReg
            TaskId      = $taskIdCapture
        }

        $deadlineTimer.Start()

        # Invoke directly — all dot-sourced functions are in scope
        $ErrorActionPreference = 'Stop'
        $result = & $ScriptBlock @ArgumentList

        $deadlineTimer.Stop()

        if ($timedOutRef.Value) {
            return @{
                TimedOut   = $true
                TaskId     = $TaskId
                KilledPids = @()
                Result     = $null
                Error      = "Task $TaskId timed out after ${timeout}s"
            }
        }

        # Clean up PID registry entry
        $null = $script:ChildPidRegistry.TryRemove($TaskId, [ref]$null)

        if ($null -eq $result) {
            return @{
                TimedOut = $false
                TaskId   = $TaskId
                Error    = 'Task returned no output'
                Result   = $null
                KilledPids = @()
            }
        }

        # Output pollution guard: expect exactly one result object
        $outputs = @($result)
        if ($outputs.Count -gt 1) {
            return @{
                TimedOut   = $false
                TaskId     = $TaskId
                Error      = "Output pollution: task returned $($outputs.Count) objects instead of 1"
                Result     = $null
                KilledPids = @()
            }
        }

        return @{
            TimedOut   = $false
            TaskId     = $TaskId
            Result     = $outputs[0]
            Error      = $null
            KilledPids = @()
        }
    }
    catch {
        if ($deadlineTimer) { $deadlineTimer.Stop() }

        $null = $script:ChildPidRegistry.TryRemove($TaskId, [ref]$null)

        return @{
            TimedOut   = $false
            TaskId     = $TaskId
            Error      = $_.Exception.Message
            Result     = $null
            KilledPids = @()
        }
    }
    finally {
        if ($deadlineTimer) {
            $deadlineTimer.Dispose()
        }
        Get-EventSubscriber | Where-Object { $_.SourceObject -is [System.Timers.Timer] } |
            Unregister-Event -ErrorAction SilentlyContinue
    }
}
