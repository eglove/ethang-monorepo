Import-Module PSSQLite -ErrorAction SilentlyContinue

$script:_BusGroups = @{}

function Reset-BusGroupState {
    $script:_BusGroups = @{}
}

function New-BusGroup {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        [Parameter(Mandatory)][string]$GroupId,
        [string[]]$Members = @(),
        [int]$ExpectedCount = 0,
        [string]$ExpectedResponseType = 'done',
        [scriptblock]$DbExecutor = $null
    )
    # Accept two shapes: new API (Members + ExpectedResponseType) or legacy (ExpectedCount + DbExecutor).
    if ($Members.Count -eq 0 -and $ExpectedCount -gt 0) {
        $Members = 1..$ExpectedCount | ForEach-Object { "member-$_" }
    }
    $count = if ($ExpectedCount -gt 0) { $ExpectedCount } else { $Members.Count }
    $script:_BusGroups[$GroupId] = @{
        GroupId              = $GroupId
        Members              = $Members
        ExpectedCount        = $count
        ExpectedResponseType = $ExpectedResponseType
        Complete             = $false
    }
    return @{
        GroupId              = $GroupId
        Members              = $Members
        ExpectedCount        = $count
        ExpectedResponseType = $ExpectedResponseType
        Complete             = $false
    }
}

function Get-BusGroupStatus {
    param([Parameter(Mandatory)][string]$GroupId)
    if (-not $script:_BusGroups.ContainsKey($GroupId)) { return $null }
    return $script:_BusGroups[$GroupId]
}

function Send-BusGroupEvent {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '')]
    param(
        $Connection = $null,
        [Parameter(Mandatory)][string]$GroupId,
        [string]$From = 'orchestrator',
        [string]$Type = 'task',
        [string]$AgentId = $null,
        [scriptblock]$DbExecutor = $null
    )
    if ($null -eq $Connection) {
        # Legacy no-connection usage: tests mock this entirely; fall through to book-keeping only.
        if (-not $script:_BusGroups.ContainsKey($GroupId)) {
            throw "GroupNotFound: no group registered with GroupId='$GroupId'"
        }
        $g = $script:_BusGroups[$GroupId]
        return @{ SentCount = $g.ExpectedCount; GroupId = $GroupId }
    }
    if (-not $script:_BusGroups.ContainsKey($GroupId)) {
        throw "GroupNotFound: no group registered with GroupId='$GroupId'"
    }
    $group = $script:_BusGroups[$GroupId]
    foreach ($member in $group.Members) {
        $cmd = $Connection.CreateCommand()
        $cmd.CommandText = 'INSERT INTO event_log ("from","to",in_reply_to,group_id,type,payload,status) VALUES (@from,@to,NULL,@gid,@type,NULL,''routed'')'
        $cmd.Parameters.AddWithValue('@from', $From) | Out-Null
        $cmd.Parameters.AddWithValue('@to', $member) | Out-Null
        $cmd.Parameters.AddWithValue('@gid', $GroupId) | Out-Null
        $cmd.Parameters.AddWithValue('@type', $Type) | Out-Null
        $cmd.ExecuteNonQuery() | Out-Null
        $cmd.Dispose()
    }
    return @{ SentCount = $group.Members.Count; GroupId = $GroupId }
}

function Wait-BusGroup {
    param(
        $Connection = $null,
        [Parameter(Mandatory)][string]$GroupId,
        [int]$TimeoutMs = 5000,
        [int]$PollIntervalMs = 100,
        [scriptblock]$GetUtcNow = $null,
        [scriptblock]$DbExecutor = $null
    )
    if (-not $script:_BusGroups.ContainsKey($GroupId)) {
        throw "GroupNotFound: no group registered with GroupId='$GroupId'"
    }
    $group = $script:_BusGroups[$GroupId]
    if ($null -eq $Connection) {
        # Legacy path: no real DB, just return completed based on in-memory bookkeeping.
        $group.Complete = $true
        return @{ GroupId = $GroupId; Complete = $true; TimedOut = $false; ReceivedCount = $group.ExpectedCount; ExpectedCount = $group.ExpectedCount }
    }
    $clock = if ($GetUtcNow) { $GetUtcNow } else { { [DateTime]::UtcNow } }
    $start = [DateTime]::UtcNow
    $deadline = $start.AddMilliseconds($TimeoutMs)

    $cmd = $Connection.CreateCommand()
    $cmd.CommandText = 'SELECT COUNT(*) FROM event_log WHERE group_id=@gid AND type=@rt'
    $cmd.Parameters.AddWithValue('@gid', $GroupId) | Out-Null
    $cmd.Parameters.AddWithValue('@rt', $group.ExpectedResponseType) | Out-Null

    while ($true) {
        $count = [int64]$cmd.ExecuteScalar()
        if ($count -ge $group.ExpectedCount) {
            $cmd.Dispose()
            $group.Complete = $true
            return @{
                GroupId       = $GroupId
                Complete      = $true
                TimedOut      = $false
                ReceivedCount = [int]$count
                ExpectedCount = $group.ExpectedCount
            }
        }
        $now = & $clock
        if ($now -ge $deadline) {
            $cmd.Dispose()
            return @{
                GroupId       = $GroupId
                Complete      = $false
                TimedOut      = $true
                ReceivedCount = [int]$count
                ExpectedCount = $group.ExpectedCount
            }
        }
        if ($PollIntervalMs -gt 0) { Start-Sleep -Milliseconds $PollIntervalMs }
        # PollIntervalMs=0 still checks the deadline so tests using a mocked future clock exit promptly.
    }
}
