# Jar resolution: priority is explicit $env:TLC_JAR override → committed repo
# copy at tools/tla2tools.jar. Missing jar or a nightly server with a newer
# Last-Modified header triggers an auto-download. Network failure falls through
# to whatever is on disk; set $env:TLC_OFFLINE=1 to skip the HEAD check.
$script:_TlaToolsJar = $null
$script:_TlaNightlyUrl = 'https://nightly.tlapl.us/dist/tla2tools.jar'

function _Get-TlaToolsJar {
    if ($script:_TlaToolsJar) { return $script:_TlaToolsJar }

    $target = if ($env:TLC_JAR) {
        $env:TLC_JAR
    } else {
        (Join-Path $PSScriptRoot '..' 'tools' 'tla2tools.jar')
    }

    $exists = Test-Path $target
    $needDownload = -not $exists

    if ($exists -and -not $env:TLC_OFFLINE) {
        try {
            $head = Invoke-WebRequest -Uri $script:_TlaNightlyUrl -Method Head `
                -UseBasicParsing -TimeoutSec 10
            $remoteRaw = $head.Headers['Last-Modified']
            if ($remoteRaw) {
                $remote = [datetime]::Parse($remoteRaw).ToUniversalTime()
                $local  = (Get-Item $target).LastWriteTimeUtc
                if ($remote -gt $local) {
                    Write-PipelineLog "TLC jar: remote $($remote.ToString('u')) newer than local — refreshing."
                    $needDownload = $true
                }
            }
        } catch {
            Write-PipelineLog "TLC jar: version check failed ($($_.Exception.Message)); using cached copy."
        }
    }

    if ($needDownload) {
        $dir = Split-Path $target -Parent
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        Write-PipelineLog "TLC jar: downloading $script:_TlaNightlyUrl → $target"
        Invoke-WebRequest -Uri $script:_TlaNightlyUrl -OutFile $target -UseBasicParsing
    }

    $script:_TlaToolsJar = (Resolve-Path $target).Path
    return $script:_TlaToolsJar
}

function Invoke-TlcProcess {
    <#
    .SYNOPSIS
        Runs TLC with a timeout, returning output and status.
    .OUTPUTS
        Hashtable with keys: Output (string), ExitCode (int)
    #>
    param(
        [Parameter(Mandatory)]
        [string]$TlaDir,

        [Parameter(Mandatory)]
        [string]$TlaFileName,

        [Parameter(Mandatory)]
        [string]$CfgFileName,

        [string]$ExtraArgs = ''
    )

    $jar = _Get-TlaToolsJar
    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = 'java'
    $baseArgs = "-XX:+UseParallelGC -jar `"$jar`" -config `"$CfgFileName`" -workers auto"
    if ($ExtraArgs) { $baseArgs += " $ExtraArgs" }
    $psi.Arguments = "$baseArgs `"$TlaFileName`""
    $psi.WorkingDirectory = $TlaDir
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    $proc = [System.Diagnostics.Process]::new()
    $proc.StartInfo = $psi

    try {
        $proc.Start() | Out-Null

        # Read both streams concurrently via async tasks to avoid deadlocks.
        # ReadToEndAsync runs on the thread pool with no PowerShell runspace needed,
        # unlike Register-ObjectEvent (whose event pump is blocked by WaitForExit)
        # or add_OutputDataReceived (which crashes without a runspace).
        $stdoutTask = $proc.StandardOutput.ReadToEndAsync()
        $stderrTask = $proc.StandardError.ReadToEndAsync()

        $proc.WaitForExit()

        $exitCode = $proc.ExitCode
        $output = $stdoutTask.GetAwaiter().GetResult()
        $errOutput = $stderrTask.GetAwaiter().GetResult()

        # Combine stdout + stderr (TLC writes some output to stderr)
        if ($errOutput) {
            $output = ($output + "`n" + $errOutput).Trim()
        }

        # Log each line
        foreach ($line in ($output -split "`n")) {
            if ($line.Trim()) {
                Write-PipelineLog "  $line"
            }
        }

        return @{
            Output   = $output
            ExitCode = $exitCode
        }
    }
    finally {
        $proc.Dispose()
    }
}

function Invoke-TlcCheck {
    param(
        [Parameter(Mandatory)]
        [string]$TlaDir,

        [Parameter(Mandatory)]
        [string]$TlaWriterFile,

        [string]$FixContext
    )

    for ($attempt = 1; ; $attempt++) {
        $tlaFile  = Get-ChildItem "$TlaDir/*.tla" -ErrorAction SilentlyContinue | Select-Object -First 1
        $cfgFiles = Get-ChildItem "$TlaDir/*.cfg" -ErrorAction SilentlyContinue

        if (-not $tlaFile)  { throw "No .tla file found in $TlaDir" }
        if (-not $cfgFiles) { throw "No .cfg file found in $TlaDir" }

        Write-PipelineLog "TLC check (attempt $attempt, $(@($cfgFiles).Count) config(s))..."

        $allPassed   = $true
        $failedParts = [System.Collections.ArrayList]::new()

        foreach ($cfgFile in @($cfgFiles)) {
            $result     = Invoke-TlcProcess -TlaDir $TlaDir -TlaFileName $tlaFile.Name -CfgFileName $cfgFile.Name
            $tlcText    = $result.Output
            $tlcExitCode = $result.ExitCode

            if ($tlcExitCode -ne 0 -or $tlcText -match 'Error:|violated|TLC threw') {
                Write-PipelineLog "TLC failed config=$($cfgFile.Name) attempt=$attempt exitCode=$tlcExitCode"
                $allPassed = $false
                $null = $failedParts.Add("--- $($cfgFile.Name) ---`n$tlcText")
            }
        }

        if ($allPassed) {
            Write-PipelineLog "TLC passed attempt=$attempt"
            return
        }

        Write-PipelineLog "TLC failed — sending errors back to writer..."
        $fixPrompt = "The TLA+ specification in $TlaDir failed TLC verification.`n`nTLC output:`n$($failedParts -join "`n`n")"
        if ($FixContext) { $fixPrompt += "`n`n$FixContext" }
        $fixPrompt += "`n`nFix the specification and all configs. Save all files to: $TlaDir"

        Invoke-Claude -Role 'doc-writer' -SystemPromptFile $TlaWriterFile -Prompt $fixPrompt | Out-Null
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

        [int]$Depth = 50
    )

    $result = Invoke-TlcProcess -TlaDir $TlaDir -TlaFileName $TlaFileName -CfgFileName $CfgFileName `
        -ExtraArgs "-simulate `"num=$NumTraces`" -depth $Depth"

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
