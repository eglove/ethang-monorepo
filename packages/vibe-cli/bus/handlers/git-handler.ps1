# Git Operation Handler

function New-GitHandler {
    <#
    .SYNOPSIS
        Creates a handler scriptblock for 'checkpoint' events using Git CLI.
    .PARAMETER GitInvoker
        Injectable scriptblock: param([string[]]$Arguments) -> @{ExitCode; Output}
        If null, defaults to a stub success response.
    #>
    param(
        [scriptblock]$GitInvoker = $null
    )

    $invoker = $GitInvoker

    $handler = {
        param([hashtable]$Envelope)

        # Parse payload JSON
        $operation = $null
        $message   = $null
        if (-not [string]::IsNullOrWhiteSpace($Envelope.Payload)) {
            $json      = $Envelope.Payload | ConvertFrom-Json
            $operation = $json.Operation
            $message   = $json.Message
        }

        # Build argument list
        $arguments = @($operation)
        if (-not [string]::IsNullOrWhiteSpace($message)) {
            $arguments += $message
        }

        # Invoke git (injected or stub)
        if ($null -ne $invoker) {
            $result = $invoker.Invoke($arguments)
        } else {
            $result = @{ ExitCode = 0; Output = '' }
        }

        # Unwrap single-element array from Invoke() return
        if ($result -is [System.Array] -and $result.Count -eq 1) { $result = $result[0] }

        $success = ($result.ExitCode -eq 0)

        return @{
            EventType = 'checkpoint_response'
            Success   = $success
            Output    = $result.Output
            Operation = $operation
        }
    }.GetNewClosure()

    return $handler
}
