$global:_VibeGitResponses = [System.Collections.Generic.Queue[hashtable]]::new()
$global:_VibeGitCalls     = [System.Collections.Generic.List[hashtable]]::new()

function global:Set-GitTestDoubleResponse {
    param([hashtable]$Response)
    $global:_VibeGitResponses.Enqueue($Response)
}

function global:Get-GitTestDoubleCalls {
    # Use Write-Output -NoEnumerate to prevent PowerShell from unrolling the List<T>
    Write-Output -NoEnumerate -InputObject $global:_VibeGitCalls
}

function global:Clear-GitTestDouble {
    $global:_VibeGitResponses = [System.Collections.Generic.Queue[hashtable]]::new()
    $global:_VibeGitCalls     = [System.Collections.Generic.List[hashtable]]::new()
}

function global:Invoke-GitTestDouble {
    param([string[]]$Arguments)
    $global:_VibeGitCalls.Add([hashtable]@{ Arguments = $Arguments; Timestamp = [DateTime]::UtcNow })
    if ($global:_VibeGitResponses.Count -gt 0) {
        $r = $global:_VibeGitResponses.Dequeue()
        return @{ ExitCode = $r.ExitCode; Output = $r.Output }
    }
    return @{ ExitCode = 0; Output = '' }
}
