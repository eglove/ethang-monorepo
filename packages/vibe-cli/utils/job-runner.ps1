$script:ChildPidRegistry = [System.Collections.Concurrent.ConcurrentDictionary[string,int]]::new()
$script:TaskWallClocks = [System.Collections.Concurrent.ConcurrentDictionary[string,System.Diagnostics.Stopwatch]]::new()

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

    # Wrap script block with ErrorActionPreference + output pollution guard
    $pidRegistry = Get-ChildPidRegistry
    $wrappedBlock = {
        param($UserBlock, $UserArgs, $PidReg, $TId)
        $ErrorActionPreference = 'Stop'
        $result = & $UserBlock @UserArgs
        $result
    }

    $job = Start-ThreadJob -ScriptBlock $wrappedBlock `
        -ArgumentList @($ScriptBlock, $ArgumentList, $pidRegistry, $TaskId)

    $completed = $job | Wait-Job -Timeout $timeout

    if ($completed) {
        # Job finished within timeout
        $outputs = @(Receive-Job $job -ErrorAction SilentlyContinue)
        $jobErrors = $job.ChildJobs | ForEach-Object { $_.Error } | Where-Object { $_ }

        Remove-Job $job -Force -ErrorAction SilentlyContinue

        # Clean up PID registry entry
        $null = $script:ChildPidRegistry.TryRemove($TaskId, [ref]$null)

        if ($jobErrors -and $jobErrors.Count -gt 0) {
            return @{
                TimedOut   = $false
                TaskId     = $TaskId
                Error      = ($jobErrors | ForEach-Object { $_.ToString() }) -join "`n"
                Result     = $null
                KilledPids = @()
            }
        }

        # Output pollution guard: expect exactly one result object
        if ($outputs.Count -eq 0) {
            return @{
                TimedOut   = $false
                TaskId     = $TaskId
                Error      = 'Thread job returned no output'
                Result     = $null
                KilledPids = @()
            }
        }

        if ($outputs.Count -gt 1) {
            return @{
                TimedOut   = $false
                TaskId     = $TaskId
                Error      = "Output pollution: thread job returned $($outputs.Count) objects instead of 1"
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
    else {
        # Timeout — kill process tree
        $killedPids = @()

        $childPid = 0
        if ($script:ChildPidRegistry.TryGetValue($TaskId, [ref]$childPid)) {
            $killedPids = @(Stop-ProcessTree -ProcessId $childPid)
        }
        else {
            # Fallback: enumerate all claude processes, filter by task context
            try {
                $claudeProcs = Get-CimInstance Win32_Process -Filter "Name='claude.exe'" -ErrorAction SilentlyContinue
                foreach ($proc in $claudeProcs) {
                    if ($proc.CommandLine -match [regex]::Escape($TaskId)) {
                        $killedPids += @(Stop-ProcessTree -ProcessId $proc.ProcessId)
                    }
                }
            }
            catch { }
        }

        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -Force -ErrorAction SilentlyContinue

        $null = $script:ChildPidRegistry.TryRemove($TaskId, [ref]$null)

        return @{
            TimedOut   = $true
            TaskId     = $TaskId
            KilledPids = $killedPids
            Result     = $null
            Error      = "Task $TaskId timed out after ${timeout}s"
        }
    }
}
