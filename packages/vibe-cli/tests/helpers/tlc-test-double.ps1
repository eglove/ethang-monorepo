$global:_VibeTlcResponses = [System.Collections.Generic.Queue[hashtable]]::new()
$global:_VibeTlcCalls     = [System.Collections.Generic.List[hashtable]]::new()

function global:Set-TlcTestDoubleResponse {
    param([hashtable]$Response)
    $global:_VibeTlcResponses.Enqueue($Response)
}

function global:Clear-TlcTestDouble {
    $global:_VibeTlcResponses = [System.Collections.Generic.Queue[hashtable]]::new()
    $global:_VibeTlcCalls     = [System.Collections.Generic.List[hashtable]]::new()
}

function global:Get-TlcTestDoubleCalls {
    # Use Write-Output -NoEnumerate to prevent PowerShell from unrolling the List<T>
    Write-Output -NoEnumerate $global:_VibeTlcCalls
}

function global:Invoke-TlcTestDouble {
    param(
        [string]$SpecPath,
        [string]$ConfigPath,
        [string[]]$ExtraArgs
    )
    $global:_VibeTlcCalls.Add([hashtable]@{
        SpecPath   = $SpecPath
        ConfigPath = $ConfigPath
        ExtraArgs  = $ExtraArgs
        Timestamp  = [DateTime]::UtcNow
    })
    if ($global:_VibeTlcResponses.Count -gt 0) {
        $r = $global:_VibeTlcResponses.Dequeue()
        return @{ ExitCode = $r.ExitCode; Output = $r.Output }
    }
    return @{ ExitCode = 0; Output = 'Model checking complete.' }
}
