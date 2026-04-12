# =============================================================================
# capture-traces.ps1 — TLC trace generation utility
# Runs TLC in simulation mode and parses output into JSON trace files.
# Usage: .\capture-traces.ps1 -SpecDir <path-to-tla-dir> -OutputDir <path>
# =============================================================================

param(
    [Parameter(Mandatory)][string]$SpecDir,
    [string]$OutputDir = "$PSScriptRoot/fixtures/reviewers",
    [string]$SpecName = 'PipelineReviewers',
    [int]$NumTraces = 20,
    [int]$Depth = 30,
    [string]$TlcJar = ''
)

$ErrorActionPreference = 'Stop'

# Find TLC jar
if (-not $TlcJar) {
    $TlcJar = Get-ChildItem "$SpecDir/../../../*.jar" -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match 'tla2tools' } |
        Select-Object -First 1 -ExpandProperty FullName

    if (-not $TlcJar) {
        Write-Warning "tla2tools.jar not found. Install TLC and pass -TlcJar parameter."
        Write-Warning "Download from: https://github.com/tlaplus/tlaplus/releases"
        exit 1
    }
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

Write-Host "Running TLC simulation: $SpecName, $NumTraces traces, depth $Depth"

$tlaFile = Join-Path $SpecDir "$SpecName.tla"
$cfgFile = Join-Path $SpecDir "$SpecName.cfg"

if (-not (Test-Path $tlaFile)) { throw "TLA+ spec not found: $tlaFile" }
if (-not (Test-Path $cfgFile)) { throw "TLA+ config not found: $cfgFile" }

# Run TLC in simulation mode
$output = & java -jar $TlcJar -simulate "num=$NumTraces" -depth $Depth -config $cfgFile $tlaFile 2>&1

# Parse TLC simulation output into traces
$currentTrace = $null
$currentStep = -1
$currentState = @{}
$currentAction = 'Init'
$traces = [System.Collections.ArrayList]::new()

foreach ($line in $output) {
    $lineStr = $line.ToString()

    # New state block
    if ($lineStr -match '^State (\d+): (.*)') {
        $stepNum = [int]$Matches[1]
        $action = $Matches[2].Trim()

        # Save previous state
        if ($currentStep -ge 0 -and $currentTrace) {
            $null = $currentTrace.steps.Add(@{
                stepNum = $currentStep
                action  = $currentAction
                state   = $currentState.Clone()
            })
        }

        $currentStep = $stepNum
        $currentAction = if ($action -match '<(\w+)') { $Matches[1] } else { $action -replace ' .*', '' }
        $currentState = @{}
    }

    # Variable assignment
    if ($lineStr -match '^\s*/\\\s+(\w+)\s*=\s*(.+)') {
        $varName = $Matches[1]
        $varValue = $Matches[2].Trim()

        # Parse TLA+ values to PowerShell types
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

    # Trace separator (empty line or end of states)
    if ($lineStr -match '^$' -and $currentStep -gt 0) {
        if ($currentTrace -and $currentState.Count -gt 0) {
            $null = $currentTrace.steps.Add(@{
                stepNum = $currentStep
                action  = $currentAction
                state   = $currentState.Clone()
            })
        }

        if ($currentTrace -and $currentTrace.steps.Count -gt 0) {
            $null = $traces.Add($currentTrace)
        }

        $currentTrace = @{
            spec    = $SpecName
            traceId = "sim-$($traces.Count + 1)"
            steps   = [System.Collections.ArrayList]::new()
        }
        $currentStep = -1
        $currentState = @{}
    }
}

# Save last trace
if ($currentTrace -and $currentState.Count -gt 0) {
    $null = $currentTrace.steps.Add(@{
        stepNum = $currentStep
        action  = $currentAction
        state   = $currentState.Clone()
    })
    $null = $traces.Add($currentTrace)
}

Write-Host "Captured $($traces.Count) traces"

# Save each trace as JSON
for ($i = 0; $i -lt $traces.Count; $i++) {
    $trace = $traces[$i]
    $lastState = $trace.steps[-1].state
    $terminal = if ($lastState.pipelineStatus -eq 'completed' -or $lastState.pipelineState -eq 'COMPLETE') { 'complete' }
                elseif ($lastState.pipelineStatus -eq 'halted' -or $lastState.pipelineState -eq 'HALTED') { 'halted' }
                else { 'running' }

    $filename = "sim-$($terminal)-$($i + 1).json"
    $filepath = Join-Path $OutputDir $filename

    $trace | ConvertTo-Json -Depth 10 | Set-Content -Path $filepath -Encoding UTF8
    Write-Host "  Saved: $filename ($($trace.steps.Count) steps, terminal=$terminal)"
}

Write-Host "Done. Traces saved to $OutputDir"
