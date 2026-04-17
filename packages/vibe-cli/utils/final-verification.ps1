. "$PSScriptRoot/result-contracts.ps1"
. "$PSScriptRoot/task-log.ps1"

function Invoke-FinalVerification {
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][hashtable]$Counters,
        [array]$TaskWriters = @(),
        [string]$FeatureDir,
        [string]$RunId
    )

    Write-StatusNote -TaskId 'FINAL' -Status 'Verifying'

    if (-not $Counters.ContainsKey('finalCleanPasses')) { $Counters.finalCleanPasses = 0 }
    if (-not $Counters.ContainsKey('finalRemediations')) { $Counters.finalRemediations = 0 }
    $Counters.finalVerifPhase = 'running'

    $verifyCommands = @('pnpm test', 'pnpm lint')

    while ($true) {
        # Run verify commands
        $allPassed = $true
        $failedCommand = $null

        foreach ($cmd in $verifyCommands) {
            try {
                $exitCode = Invoke-VerifyCommand -Command $cmd
            }
            catch {
                Write-TaskLog -TaskId 'FINAL' -Phase 'final' -Message "ESCALATED: Infrastructure failure during '$cmd'" -FeatureDir $FeatureDir -RunId $RunId
                $Counters.finalVerifPhase = 'escalated'
                return $Counters
            }

            if ($exitCode -ne 0) {
                $allPassed = $false
                $failedCommand = $cmd
                break
            }
        }

        if ($allPassed) {
            $Counters.finalCleanPasses++
            Write-TaskLog -TaskId 'FINAL' -Phase 'final' -Message "Clean pass $($Counters.finalCleanPasses)/2" -FeatureDir $FeatureDir -RunId $RunId

            if ($Counters.finalCleanPasses -ge 2) {
                $Counters.finalVerifPhase = 'completed'
                Write-TaskLog -TaskId 'FINAL' -Phase 'final' -Message 'Final verification COMPLETED' -FeatureDir $FeatureDir -RunId $RunId
                return $Counters
            }
            continue
        }

        # Failure — reset clean passes
        $Counters.finalCleanPasses = 0
        $Counters.finalVerifPhase = 'remediating'

        Write-TaskLog -TaskId 'FINAL' -Phase 'final' -Message "Failed on '$failedCommand' — entering remediation" -FeatureDir $FeatureDir -RunId $RunId

        $Counters.finalRemediations++

        # Writer attribution: find the task whose files are most affected
        $writerFile = $null
        if ($TaskWriters.Count -gt 0) {
            # Use first task's writer as default
            $writerFile = Join-Path $Root "agents/code-writers/$($TaskWriters[0]).md"

            # Try to attribute via git diff
            try {
                $changedFiles = & git diff --name-only 2>$null
                if ($changedFiles -and $FeatureDir) {
                    $taskFileCount = @{}
                    $logsDir = Join-Path $FeatureDir 'logs'
                    $taskLogs = Get-ChildItem "$logsDir/T*-log.txt" -ErrorAction SilentlyContinue
                    foreach ($logFile in $taskLogs) {
                        $logContent = Get-Content $logFile.FullName -Raw -ErrorAction SilentlyContinue
                        $taskIdMatch = [regex]::Match($logFile.Name, '^(T\d+)')
                        if (-not $taskIdMatch.Success) { continue }
                        $logTaskId = $taskIdMatch.Groups[1].Value

                        $count = 0
                        foreach ($file in $changedFiles) {
                            if ($logContent -match [regex]::Escape($file)) { $count++ }
                        }
                        if ($count -gt 0) { $taskFileCount[$logTaskId] = $count }
                    }

                    if ($taskFileCount.Count -gt 0) {
                        # Tie-break: most files wins, then lowest task ID
                        $winner = $taskFileCount.GetEnumerator() |
                            Sort-Object { $_.Value } -Descending |
                            Sort-Object { [int]($_.Key -replace '\D', '') } |
                            Select-Object -First 1

                        Write-TaskLog -TaskId 'FINAL' -Phase 'final' -Message "Attributed to $($winner.Key) ($($winner.Value) files)" -FeatureDir $FeatureDir -RunId $RunId
                    }
                }
            }
            catch { }
        }

        if (-not $writerFile -or -not (Test-Path $writerFile)) {
            $writerFile = Join-Path $Root 'agents/code-writers/powershell-writer.md'
        }

        $fixPrompt = "Fix the '$failedCommand' failure in final verification."

        try {
            Invoke-Claude -Role 'code-writer' -SystemPromptFile $writerFile -Prompt $fixPrompt -TaskId 'FINAL' | Out-Null
        }
        catch {
            Write-TaskLog -TaskId 'FINAL' -Phase 'final' -Message "ESCALATED: Infrastructure failure during remediation" -FeatureDir $FeatureDir -RunId $RunId
            $Counters.finalVerifPhase = 'escalated'
            return $Counters
        }

        $Counters.finalVerifPhase = 'running'
    }
}

function Reset-FinalCounter {
    param([Parameter(Mandatory)][hashtable]$State)
    $State.finalRemediations = 0
    $State.finalCleanPasses = 0
    $State.finalVerifPhase = 'running'
    return $State
}
