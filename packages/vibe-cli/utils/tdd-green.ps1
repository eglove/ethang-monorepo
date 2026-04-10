. "$PSScriptRoot/result-contracts.ps1"
. "$PSScriptRoot/task-log.ps1"

function Invoke-GreenPhase {
    param(
        [Parameter(Mandatory)][hashtable]$Task,
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][hashtable]$Counters,
        [string]$WorkspacePath,
        [string]$FeatureDir,
        [string]$RunId
    )

    $taskId = $Task.id
    $codeWriterFile = Join-Path $Root "agents/code-writers/$($Task.codeWriter).md"
    $workDir = if ($WorkspacePath) { $WorkspacePath } else { $null }

    while ($true) {
        # Boundary check BEFORE dispatch
        if ($Counters.greenAttempts -ge $Config.MaxTddCycles) {
            Write-TaskLog -TaskId $taskId -Phase 'green_retry' -Message "ESCALATED: GREEN attempts exhausted ($($Counters.greenAttempts)/$($Config.MaxTddCycles))" -FeatureDir $FeatureDir -RunId $RunId
            return ConvertTo-TaskResult @{
                TaskId = $taskId; Phase = 'green_retry'; Status = 'escalated'
                Counters = $Counters; Escalated = $true; Error = 'GREEN attempts exhausted'
            }
        }

        $prompt = "Make the failing tests pass for task $taskId : $($Task.title)`nFiles: $($Task.files -join ', ')`nDo NOT modify test files."

        Write-TaskLog -TaskId $taskId -Phase 'green' -Message "Dispatching code writer: $($Task.codeWriter) (attempt $($Counters.greenAttempts + 1))" -FeatureDir $FeatureDir -RunId $RunId

        try {
            $response = Invoke-Claude -SystemPromptFile $codeWriterFile -Prompt $prompt -TaskId $taskId
        }
        catch {
            Write-TaskLog -TaskId $taskId -Phase 'green' -Message "ESCALATED: Infrastructure failure — $($_.Exception.Message)" -FeatureDir $FeatureDir -RunId $RunId
            return ConvertTo-TaskResult @{
                TaskId = $taskId; Phase = 'green'; Status = 'escalated'
                Counters = $Counters; Escalated = $true; Error = $_.Exception.Message
            }
        }

        # Check if code writer modified test files
        $modifiedTestFiles = $false
        try {
            $parsed = $response | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($parsed.filesModified) {
                foreach ($f in $parsed.filesModified) {
                    if ($f.path -match '\.(test|spec|Tests)\.' ) {
                        $modifiedTestFiles = $true
                        break
                    }
                }
            }
        }
        catch { }

        if ($modifiedTestFiles) {
            Write-TaskLog -TaskId $taskId -Phase 'green' -Message 'Code writer modified test files — rejected, counting as failed attempt' -FeatureDir $FeatureDir -RunId $RunId
            $Counters.greenAttempts++
            continue
        }

        # Run verify-test
        try {
            $exitCode = Invoke-VerifyCommand -Command $Config.VerifyTest -WorkingDirectory $workDir
        }
        catch {
            Write-TaskLog -TaskId $taskId -Phase 'green' -Message "ESCALATED: Verify command infrastructure failure" -FeatureDir $FeatureDir -RunId $RunId
            return ConvertTo-TaskResult @{
                TaskId = $taskId; Phase = 'green'; Status = 'escalated'
                Counters = $Counters; Escalated = $true; Error = $_.Exception.Message
            }
        }

        if ($exitCode -eq 0) {
            # Tests pass — advance to cleanup
            Write-TaskLog -TaskId $taskId -Phase 'green' -Message 'Tests pass (GREEN pass) — advancing to cleanup' -FeatureDir $FeatureDir -RunId $RunId
            return ConvertTo-TaskResult @{
                TaskId = $taskId; Phase = 'cleanup'; Status = 'running'
                Counters = $Counters; Escalated = $false
            }
        }

        # Tests fail — increment counter (fencepost: increment on failure, not on retry)
        $Counters.greenAttempts++
        Write-TaskLog -TaskId $taskId -Phase 'green_retry' -Message "Tests still fail — attempt $($Counters.greenAttempts)/$($Config.MaxTddCycles)" -FeatureDir $FeatureDir -RunId $RunId
    }
}

function Reset-GreenCounters {
    param([Parameter(Mandatory)][hashtable]$State)
    $State.greenAttempts = 0
    return $State
}
