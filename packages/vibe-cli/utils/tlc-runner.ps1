$TlaToolsJar = "C:\Users\glove\projects\tla-toolbox\tla2tools.jar"

function Invoke-TlcProcess {
    <#
    .SYNOPSIS
        Runs TLC with a timeout, returning output and status.
    .OUTPUTS
        Hashtable with keys: Output (string), ExitCode (int), TimedOut (bool)
    #>
    param(
        [Parameter(Mandatory)]
        [string]$TlaDir,

        [Parameter(Mandatory)]
        [string]$TlaFileName,

        [Parameter(Mandatory)]
        [string]$CfgFileName,

        [string]$ExtraArgs = '',

        [int]$TimeoutSeconds = $Config.TlcTimeoutSeconds
    )

    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = 'java'
    $baseArgs = "-XX:+UseParallelGC -jar `"$TlaToolsJar`" -config `"$CfgFileName`" -workers auto"
    if ($ExtraArgs) { $baseArgs += " $ExtraArgs" }
    $psi.Arguments = "$baseArgs `"$TlaFileName`""
    $psi.WorkingDirectory = $TlaDir
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    $proc = [System.Diagnostics.Process]::new()
    $proc.StartInfo = $psi

    $stdoutBuilder = [System.Text.StringBuilder]::new()
    $stderrBuilder = [System.Text.StringBuilder]::new()

    # Use events for async output capture to avoid deadlocks
    $stdoutEvent = Register-ObjectEvent -InputObject $proc -EventName OutputDataReceived -Action {
        if ($null -ne $EventArgs.Data) {
            $Event.MessageData.AppendLine($EventArgs.Data) | Out-Null
        }
    } -MessageData $stdoutBuilder

    $stderrEvent = Register-ObjectEvent -InputObject $proc -EventName ErrorDataReceived -Action {
        if ($null -ne $EventArgs.Data) {
            $Event.MessageData.AppendLine($EventArgs.Data) | Out-Null
        }
    } -MessageData $stderrBuilder

    try {
        $proc.Start() | Out-Null
        $proc.BeginOutputReadLine()
        $proc.BeginErrorReadLine()

        $timeoutMs = $TimeoutSeconds * 1000
        $exited = $proc.WaitForExit($timeoutMs)
        $timedOut = -not $exited

        if ($timedOut) {
            Write-PipelineLog "TLC timed out after ${TimeoutSeconds}s — killing process" -Color Yellow
            try { $proc.Kill() } catch { }
        }

        # Parameterless WaitForExit ensures async output handlers have drained
        $proc.WaitForExit()

        $exitCode = if ($timedOut) { -1 } else { $proc.ExitCode }

        # Combine stdout + stderr (TLC writes some output to stderr)
        $output = $stdoutBuilder.ToString()
        $errOutput = $stderrBuilder.ToString()
        if ($errOutput) {
            $output = ($output + "`n" + $errOutput).Trim()
        }

        # Log each line
        foreach ($line in ($output -split "`n")) {
            if ($line.Trim()) {
                Write-PipelineLog "  $line" -Color DarkGray
            }
        }

        return @{
            Output   = $output
            ExitCode = $exitCode
            TimedOut  = $timedOut
        }
    }
    finally {
        Unregister-Event -SourceIdentifier $stdoutEvent.Name -ErrorAction SilentlyContinue
        Unregister-Event -SourceIdentifier $stderrEvent.Name -ErrorAction SilentlyContinue
        Remove-Job -Id $stdoutEvent.Id -Force -ErrorAction SilentlyContinue
        Remove-Job -Id $stderrEvent.Id -Force -ErrorAction SilentlyContinue
        $proc.Dispose()
    }
}

function Invoke-TlcCheck {
    param(
        [Parameter(Mandatory)]
        [string]$TlaDir,

        [Parameter(Mandatory)]
        [string]$TlaWriterFile,

        [string]$FixContext,

        [int]$MaxAttempts = $Config.MaxTlcAttempts,

        [int]$TimeoutSeconds = $Config.TlcTimeoutSeconds
    )

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        $tlaFile = Get-ChildItem "$TlaDir/*.tla" -ErrorAction SilentlyContinue | Select-Object -First 1
        $cfgFile = Get-ChildItem "$TlaDir/*.cfg" -ErrorAction SilentlyContinue | Select-Object -First 1

        if (-not $tlaFile) { throw "No .tla file found in $TlaDir" }
        if (-not $cfgFile) { throw "No .cfg file found in $TlaDir" }

        Write-PipelineLog "TLC check (attempt $attempt/$MaxAttempts)..." -Color Yellow

        $result = Invoke-TlcProcess -TlaDir $TlaDir -TlaFileName $tlaFile.Name -CfgFileName $cfgFile.Name -TimeoutSeconds $TimeoutSeconds
        $tlcText = $result.Output
        $tlcExitCode = $result.ExitCode

        if (-not $result.TimedOut -and $tlcExitCode -eq 0 -and $tlcText -notmatch 'Error:|violated|TLC threw') {
            Write-PipelineLog "TLC passed attempt=$attempt" -Color Green
            return
        }

        if ($result.TimedOut) {
            Write-PipelineLog "TLC timed out attempt=$attempt" -Color Yellow
        } else {
            Write-PipelineLog "TLC failed attempt=$attempt exitCode=$tlcExitCode" -Color Yellow
        }

        if ($attempt -ge $MaxAttempts) {
            $reason = if ($result.TimedOut) { "timed out" } else { "failed" }
            Write-PipelineLog "ERROR: TLC verification $reason after $MaxAttempts attempts" -Color Red
            throw "TLA+ specification $reason TLC verification after $MaxAttempts attempts"
        }

        Write-PipelineLog "TLC failed — sending errors back to writer..." -Color Yellow
        $fixPrompt = "The TLA+ specification in $TlaDir failed TLC verification.`n`nTLC output:`n$tlcText"
        if ($result.TimedOut) {
            $fixPrompt += "`n`nNOTE: TLC timed out after ${TimeoutSeconds}s. The state space may be too large. Consider reducing model constants, adding symmetry sets, or tightening type invariants to constrain exploration."
        }
        if ($FixContext) { $fixPrompt += "`n`n$FixContext" }
        $fixPrompt += "`n`nFix the specification and config. Save all files to: $TlaDir"

        Invoke-Claude -SystemPromptFile $TlaWriterFile -Prompt $fixPrompt | Out-Null
    }
}

function Invoke-TlcSimulation {
    <#
    .SYNOPSIS
        Runs TLC in simulation mode and returns parsed state traces.
    .OUTPUTS
        Array of trace hashtables, each with: traceId, steps (array of stateNumber, action, variables)
    #>
    param(
        [Parameter(Mandatory)]
        [string]$TlaDir,

        [Parameter(Mandatory)]
        [string]$TlaFileName,

        [Parameter(Mandatory)]
        [string]$CfgFileName,

        [int]$NumTraces = 5,

        [int]$Depth = 50,

        [int]$TimeoutSeconds = $Config.TlcTimeoutSeconds
    )

    $result = Invoke-TlcProcess -TlaDir $TlaDir -TlaFileName $TlaFileName -CfgFileName $CfgFileName `
        -ExtraArgs "-simulate `"num=$NumTraces`" -depth $Depth" -TimeoutSeconds $TimeoutSeconds

    if (-not $result.Output) { return , @() }

    $lines = $result.Output -split "`n"
    $traces = [System.Collections.ArrayList]::new()
    $currentTrace = $null
    $currentStep = -1
    $currentState = @{}
    $currentAction = 'Init'

    foreach ($line in $lines) {
        if ($line -match '^State (\d+): (.*)') {
            $stepNum = [int]$Matches[1]
            $action = $Matches[2].Trim()

            if ($currentStep -ge 0 -and $currentTrace) {
                $null = $currentTrace.steps.Add(@{
                    stateNumber = $currentStep
                    action      = $currentAction
                    variables   = $currentState.Clone()
                })
            }

            $currentStep = $stepNum
            $currentAction = if ($action -match '<(\w+)') { $Matches[1] } else { $action -replace ' .*', '' }
            $currentState = @{}
        }

        if ($line -match '^\s*/\\\s+(\w+)\s*=\s*(.+)') {
            $varName = $Matches[1]
            $varValue = $Matches[2].Trim()

            $parsed = switch -Regex ($varValue) {
                '^TRUE$'    { $true }
                '^FALSE$'   { $false }
                '^NULL$'    { $null }
                '^\d+$'     { [int]$varValue }
                '^"(.*)"$'  { $Matches[1] }
                default     { $varValue }
            }
            $currentState[$varName] = $parsed
        }

        # Trace separator — empty line between simulation traces
        if ($line -match '^$' -and $currentStep -gt 0) {
            if ($currentTrace -and $currentState.Count -gt 0) {
                $null = $currentTrace.steps.Add(@{
                    stateNumber = $currentStep
                    action      = $currentAction
                    variables   = $currentState.Clone()
                })
            }

            if ($currentTrace -and $currentTrace.steps.Count -gt 0) {
                $null = $traces.Add($currentTrace)
            }

            $currentTrace = @{
                traceId = "sim-$($traces.Count + 1)"
                steps   = [System.Collections.ArrayList]::new()
            }
            $currentStep = -1
            $currentState = @{}
        }

        # First state block starts a new trace if none exists
        if (-not $currentTrace -and $line -match '^State 1:') {
            $currentTrace = @{
                traceId = "sim-$($traces.Count + 1)"
                steps   = [System.Collections.ArrayList]::new()
            }
        }
    }

    # Save final trace
    if ($currentTrace -and $currentState.Count -gt 0) {
        $null = $currentTrace.steps.Add(@{
            stateNumber = $currentStep
            action      = $currentAction
            variables   = $currentState.Clone()
        })
    }
    if ($currentTrace -and $currentTrace.steps.Count -gt 0) {
        $null = $traces.Add($currentTrace)
    }

    return , @($traces)
}
