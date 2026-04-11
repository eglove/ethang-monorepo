. "$PSScriptRoot/result-contracts.ps1"
. "$PSScriptRoot/task-log.ps1"
. "$PSScriptRoot/response-parser.ps1"

function Invoke-GreenPhase {
    param(
        [Parameter(Mandatory)][object]$Task,
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][hashtable]$Counters,
        [string]$WorkspacePath,
        [string]$FeatureDir,
        [string]$RunId,
        [string[]]$TestFiles,
        [string]$PlanJsonPath
    )

    $taskId = $Task.id
    Write-StatusNote -TaskId $taskId -Status 'Coding' -Detail "code-writer: $($Task.codeWriter)"

    $codeWriterFile = Join-Path $Root "agents/code-writers/$($Task.codeWriter).md"
    $workDir = if ($WorkspacePath) { Get-PackageWorkDir $WorkspacePath } else { $null }

    while ($true) {
        # Boundary check BEFORE dispatch
        if ($Counters.greenAttempts -ge $Config.MaxTddCycles) {
            Write-TaskLog -TaskId $taskId -Phase 'green_retry' -Message "ESCALATED: GREEN attempts exhausted ($($Counters.greenAttempts)/$($Config.MaxTddCycles))" -FeatureDir $FeatureDir -RunId $RunId
            return ConvertTo-TaskResult @{
                TaskId = $taskId; Phase = 'green_retry'; Status = 'escalated'
                Counters = $Counters; Escalated = $true; Error = 'GREEN attempts exhausted'
            }
        }

        $taskJson = $Task | ConvertTo-Json -Depth 10 -Compress
        $prompt = "Make the failing tests pass for task $taskId`nDo NOT modify test files.`n`nTask JSON:`n$taskJson`n`nFull implementation plan: $PlanJsonPath"

        Write-TaskLog -TaskId $taskId -Phase 'green' -Message "Dispatching code writer: $($Task.codeWriter) (attempt $($Counters.greenAttempts + 1))" -FeatureDir $FeatureDir -RunId $RunId

        $addDir = if ($WorkspacePath) { Get-PackageWorkDir $WorkspacePath } else { $null }
        try {
            $response = Invoke-Claude -SystemPromptFile $codeWriterFile -Prompt $prompt -TaskId $taskId -AddDir $addDir
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
        $parsed = ConvertFrom-AgentResponse -Response $response
        if ($parsed.filesModified) {
            foreach ($f in $parsed.filesModified) {
                if ($f.path -match '\.(test|spec|Tests)\.' ) {
                    $modifiedTestFiles = $true
                    break
                }
            }
        }

        if ($modifiedTestFiles) {
            Write-TaskLog -TaskId $taskId -Phase 'green' -Message 'Code writer modified test files — rejected, counting as failed attempt' -FeatureDir $FeatureDir -RunId $RunId
            $Counters.greenAttempts++
            continue
        }

        # Check if code writer reports already implemented or made no changes
        $codeVerdict = if ($parsed) { $parsed.verdict } else { $null }
        $hasFileChanges = $parsed -and $parsed.filesModified -and $parsed.filesModified.Count -gt 0

        if ($codeVerdict -eq 'already_implemented' -or -not $hasFileChanges) {
            $reason = if ($codeVerdict -eq 'already_implemented') { 'already implemented' } else { 'no file changes' }
            Write-TaskLog -TaskId $taskId -Phase 'green' -Message "Code writer reports $reason — advancing to cleanup" -FeatureDir $FeatureDir -RunId $RunId
            return ConvertTo-TaskResult @{
                TaskId = $taskId; Phase = 'cleanup'; Status = 'running'
                Counters = $Counters; Escalated = $false
            }
        }

        # Run verify-test (scoped to task test files when available)
        try {
            if ($TestFiles -and $TestFiles.Count -gt 0) {
                $exitCode = Invoke-ScopedTestVerify -TestFiles $TestFiles -WorkingDirectory $workDir
            }
            else {
                $exitCode = Invoke-VerifyCommand -Command $Config.VerifyTest -WorkingDirectory $workDir
            }
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
