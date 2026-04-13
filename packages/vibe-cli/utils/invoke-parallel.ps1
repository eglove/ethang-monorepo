function Invoke-Parallel {
    param(
        [Parameter(Mandatory)]
        [hashtable]$Jobs
    )

    $results = @{}
    $jobHandles = @{}

    foreach ($name in $Jobs.Keys) {
        $entry = $Jobs[$name]
        $script = $entry.Script
        $jobArgs = if ($entry.Args) { $entry.Args } else { @() }

        $wrappedScript = {
            param($innerScript, $innerArgs)
            $sb = [scriptblock]::Create($innerScript)
            try {
                $output = & $sb @innerArgs
                return @{ Success = $true; Output = $output; Error = $null }
            }
            catch {
                return @{ Success = $false; Output = $null; Error = $_.Exception.Message }
            }
        }

        $jobHandle = Start-ThreadJob -ScriptBlock $wrappedScript -ArgumentList $script.ToString(), $jobArgs
        $jobHandles[$name] = $jobHandle
    }

    # Poll jobs with short waits, streaming Write-Host output to console in real time
    $allJobs = @($jobHandles.Values)
    $infoSeen = @{}
    foreach ($name in $jobHandles.Keys) { $infoSeen[$name] = 0 }
    $stillRunning = $true

    while ($stillRunning) {
        # Short blocking wait — returns early when any job finishes
        $null = Wait-Job -Job $allJobs -Timeout 2 -ErrorAction SilentlyContinue

        $stillRunning = $false
        foreach ($name in @($jobHandles.Keys)) {
            $job = $jobHandles[$name]
            if ($job.State -eq 'Running') { $stillRunning = $true }

            # Stream new Write-Host lines from the Information stream
            for ($i = $infoSeen[$name]; $i -lt $job.Information.Count; $i++) {
                $record = $job.Information[$i]
                if ($null -ne $record -and $null -ne $record.MessageData) {
                    Write-Host $record.MessageData
                }
            }
            $infoSeen[$name] = $job.Information.Count
        }
    }

    foreach ($name in @($jobHandles.Keys)) {
        $job = $jobHandles[$name]
        $jobResult = $job | Receive-Job -ErrorAction SilentlyContinue
        if ($jobResult -and $jobResult -is [hashtable] -and $jobResult.ContainsKey('Success')) {
            $results[$name] = $jobResult
        }
        else {
            $results[$name] = @{
                Success = $true
                Output  = $jobResult
                Error   = $null
            }
        }

        $job | Remove-Job -Force -ErrorAction SilentlyContinue
    }

    return $results
}
