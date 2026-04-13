$script:ChildPidRegistry = [System.Collections.Concurrent.ConcurrentDictionary[string,int]]::new()

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

    function Stop-Descendant {
        param([int]$ParentId)

        $children = @()
        try {
            $children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$ParentId" -ErrorAction SilentlyContinue |
                Select-Object -ExpandProperty ProcessId
        }
        catch { }

        foreach ($childPid in $children) {
            Stop-Descendant -ParentId $childPid
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

    Stop-Descendant -ParentId $ProcessId
    return $killed
}

function Invoke-WithTimeout {
    param(
        [Parameter(Mandatory)][scriptblock]$ScriptBlock,
        [Parameter(Mandatory)][string]$TaskId,
        [string]$WriterType,
        [hashtable]$ArgumentList = @{}
    )

    try {
        $ErrorActionPreference = 'Stop'
        $result = & $ScriptBlock @ArgumentList

        # Clean up PID registry entry
        $null = $script:ChildPidRegistry.TryRemove($TaskId, [ref]$null)

        if ($null -eq $result) {
            return @{
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
                TaskId     = $TaskId
                Error      = "Output pollution: task returned $($outputs.Count) objects instead of 1"
                Result     = $null
                KilledPids = @()
            }
        }

        return @{
            TaskId     = $TaskId
            Result     = $outputs[0]
            Error      = $null
            KilledPids = @()
        }
    }
    catch {
        $null = $script:ChildPidRegistry.TryRemove($TaskId, [ref]$null)

        return @{
            TaskId     = $TaskId
            Error      = $_.Exception.Message
            Result     = $null
            KilledPids = @()
        }
    }
}
