function Invoke-Parallel {
    param(
        [Parameter(Mandatory)]
        [hashtable]$Jobs,

        [int]$TimeoutSeconds = 600
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

    # Wait for all jobs concurrently with a single shared deadline
    $allJobs = @($jobHandles.Values)
    $null = Wait-Job -Job $allJobs -Timeout $TimeoutSeconds -ErrorAction SilentlyContinue

    foreach ($name in @($jobHandles.Keys)) {
        $job = $jobHandles[$name]

        if ($job.State -eq 'Running') {
            $job | Stop-Job -ErrorAction SilentlyContinue
            $results[$name] = @{
                Success = $false
                Output  = $null
                Error   = "Job '$name' timed out after $TimeoutSeconds seconds"
            }
        }
        else {
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
        }

        $job | Remove-Job -Force -ErrorAction SilentlyContinue
    }

    return $results
}
