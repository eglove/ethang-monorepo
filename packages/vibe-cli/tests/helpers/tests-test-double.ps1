$global:_VibeTestsResponses = [System.Collections.Generic.Queue[hashtable]]::new()
$global:_VibeTestsCalls     = [System.Collections.Generic.List[hashtable]]::new()

function global:Set-TestsTestDoubleResponse {
    param([hashtable]$Response)
    $global:_VibeTestsResponses.Enqueue($Response)
}

function global:Clear-TestsTestDouble {
    $global:_VibeTestsResponses = [System.Collections.Generic.Queue[hashtable]]::new()
    $global:_VibeTestsCalls     = [System.Collections.Generic.List[hashtable]]::new()
}

function global:Get-TestsTestDoubleCalls {
    # Use Write-Output -NoEnumerate to prevent PowerShell from unrolling the List<T>
    Write-Output -NoEnumerate -InputObject $global:_VibeTestsCalls
}

function global:Invoke-TestsTestDouble {
    param(
        [string]$TestPath,
        [string[]]$Tags,
        [string[]]$ExtraArgs
    )
    $global:_VibeTestsCalls.Add([hashtable]@{
        TestPath  = $TestPath
        Tags      = $Tags
        ExtraArgs = $ExtraArgs
        Timestamp = [DateTime]::UtcNow
    })
    if ($global:_VibeTestsResponses.Count -gt 0) {
        $r = $global:_VibeTestsResponses.Dequeue()
        return @{ ExitCode = $r.ExitCode; Passed = $r.Passed; Failed = $r.Failed; Output = $r.Output }
    }
    return @{ ExitCode = 0; Passed = 1; Failed = 0; Output = 'Tests Passed: 1' }
}
