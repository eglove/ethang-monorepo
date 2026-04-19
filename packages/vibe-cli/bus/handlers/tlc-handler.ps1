# TLC Model Checker Handler

function New-TlcHandler {
    <#
    .SYNOPSIS
        Creates a handler scriptblock for 'verify' events using TLC model checker.
    .PARAMETER TlcInvoker
        Injectable scriptblock: param([string]$SpecPath, [string]$ConfigPath) -> @{ExitCode; Output; Violations}
        If null, defaults to a stub success response.
    #>
    param(
        [scriptblock]$TlcInvoker = $null
    )

    $invoker = $TlcInvoker

    $handler = {
        param([hashtable]$Envelope)

        # Parse payload JSON
        $specPath   = $null
        $configPath = $null
        if (-not [string]::IsNullOrWhiteSpace($Envelope.Payload)) {
            $json = $Envelope.Payload | ConvertFrom-Json
            $specPath   = $json.SpecPath
            $configPath = $json.ConfigPath
        }

        # Invoke TLC (injected or stub)
        if ($null -ne $invoker) {
            $result = $invoker.Invoke($specPath, $configPath)
        } else {
            # Default stub: return success
            $result = @{ ExitCode = 0; Output = ''; Violations = @() }
        }

        # Unwrap single-element array from Invoke() return
        if ($result -is [System.Array] -and $result.Count -eq 1) { $result = $result[0] }

        $passed     = ($result.ExitCode -eq 0)
        $violations = if ($result.Violations) { $result.Violations } else { @() }

        return @{
            EventType  = 'verify_result'
            Passed     = $passed
            Violations = $violations
            Output     = $result.Output
        }
    }.GetNewClosure()

    return $handler
}
