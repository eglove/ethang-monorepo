function ConvertFrom-TlcOutput {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [AllowEmptyString()]
        [string]$Output,

        [Parameter(Mandatory)]
        [int]$ExitCode
    )

    if ($Output.Length -eq 0) {
        throw 'TLC output is empty (0 bytes)'
    }

    # Exit code mapping
    $exitMeaningMap = @{
        0  = 'success'
        10 = 'assumption_failure'
        11 = 'invariant_violation'
        12 = 'deadlock'
        13 = 'liveness_violation'
        14 = 'assertion_failure'
    }

    $exitMeaning = if ($exitMeaningMap.ContainsKey($ExitCode)) {
        $exitMeaningMap[$ExitCode]
    } else {
        'unknown'
    }

    $lines = $Output -split "`n"

    # Warn on header-only output
    $nonHeaderLines = $lines | Where-Object { $_ -and $_ -notmatch '^TLC2 Version' }
    if (-not $nonHeaderLines -or $nonHeaderLines.Count -eq 0) {
        Write-Warning 'TLC output contains only a header line'
    }

    # Parse invariant violations
    $invariantViolations = [System.Collections.ArrayList]::new()
    $currentViolation = $null
    $currentState = $null
    $inTrace = $false

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]

        # Detect invariant violation
        if ($line -match 'Error: Invariant (\S+) is violated') {
            $currentViolation = @{
                name  = $Matches[1]
                trace = [System.Collections.ArrayList]::new()
            }
            $invariantViolations.Add($currentViolation) | Out-Null
            $inTrace = $false
            continue
        }

        # Detect deadlock trace start
        if ($line -match 'Error: Deadlock reached') {
            $inTrace = $false
            continue
        }

        # Detect behavior trace start
        if ($line -match 'Error: The behavior up to this point is:') {
            $inTrace = $true
            continue
        }

        # Parse state headers
        if ($inTrace -and $line -match '^State (\d+): <(.+?)>') {
            $currentState = @{
                stateNumber = [int]$Matches[1]
                label       = $Matches[2]
                variables   = @{}
            }
            if ($currentViolation) {
                $currentViolation.trace.Add($currentState) | Out-Null
            }
            continue
        }

        # Parse variable assignments
        if ($inTrace -and $currentState -and $line -match '^\s*/\\\s+(\w+)\s*=\s*(.+)$') {
            $currentState.variables[$Matches[1]] = $Matches[2].Trim()
            continue
        }
    }

    # Parse deadlock
    $deadlock = $Output -match 'Deadlock reached'

    # Parse state graph
    $stateGraph = @{}
    if ($Output -match '(\d+)\s+states generated,\s*(\d+)\s+distinct states found') {
        $stateGraph.statesGenerated = [int]$Matches[1]
        $stateGraph.distinctStates = [int]$Matches[2]
    }
    if ($Output -match 'depth of the complete state graph search is (\d+)') {
        $stateGraph.depth = [int]$Matches[1]
    }

    return @{
        exitCode            = $ExitCode
        exitMeaning         = $exitMeaning
        invariantViolations = @($invariantViolations)
        deadlock            = $deadlock
        stateGraph          = $stateGraph
    }
}
