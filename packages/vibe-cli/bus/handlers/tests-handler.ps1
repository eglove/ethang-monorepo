# Pester Test Runner Handler

function New-TestsHandler {
    <#
    .SYNOPSIS
        Creates a handler scriptblock for 'review_requested' events using Pester.
    .PARAMETER TestsInvoker
        Injectable scriptblock: param([string]$TestPath, [string[]]$Tags) -> @{ExitCode; Passed; Failed; Skipped}
        If null, defaults to a stub success response.
    #>
    param(
        [scriptblock]$TestsInvoker = $null
    )

    $invoker = $TestsInvoker

    $handler = {
        param([hashtable]$Envelope)

        # Parse payload JSON
        $testPath = $null
        $tags     = @()
        if (-not [string]::IsNullOrWhiteSpace($Envelope.Payload)) {
            $json     = $Envelope.Payload | ConvertFrom-Json
            $testPath = $json.TestPath
            if ($json.Tags) { $tags = @($json.Tags) }
        }

        # Invoke tests runner (injected or stub)
        if ($null -ne $invoker) {
            $result = $invoker.Invoke($testPath, $tags)
        } else {
            $result = @{ ExitCode = 0; Passed = 1; Failed = 0; Skipped = 0 }
        }

        # Unwrap single-element array from Invoke() return
        if ($result -is [System.Array] -and $result.Count -eq 1) { $result = $result[0] }

        $passed = ($result.Failed -eq 0)
        $total  = $result.Passed + $result.Failed

        return @{
            EventType = 'review_verdict'
            Passed    = $passed
            Failed    = $result.Failed
            Total     = $total
            Skipped   = $result.Skipped
        }
    }.GetNewClosure()

    return $handler
}
