. "$PSScriptRoot/result-contracts.ps1"
. "$PSScriptRoot/task-log.ps1"
. "$PSScriptRoot/response-parser.ps1"

function Invoke-RedPhase {
    param(
        [Parameter(Mandatory)][object]$Task,
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][hashtable]$Counters,
        [string]$WorkspacePath,
        [string]$FeatureDir,
        [string]$RunId,
        [string]$PlanJsonPath
    )

    $taskId = $Task.id
    Write-StatusNote -TaskId $taskId -Status 'Testing' -Detail "test-writer: $($Task.testWriter)"

    $testWriterFile = Join-Path $Root "agents/test-writers/$($Task.testWriter)-writer.md"
    if (-not (Test-Path $testWriterFile)) {
        $testWriterFile = Join-Path $Root "agents/test-writers/$($Task.testWriter).md"
    }

    $taskJson = $Task | ConvertTo-Json -Depth 10 -Compress
    $prompt = "Write failing tests for task $taskId`n`nTask JSON:`n$taskJson`n`nFull implementation plan: $PlanJsonPath"

    Write-TaskLog -TaskId $taskId -Phase 'red' -Message "Dispatching test writer: $($Task.testWriter)" -FeatureDir $FeatureDir -RunId $RunId

    # Write tests
    $addDir = if ($WorkspacePath) { $WorkspacePath } else { $null }
    try {
        $response = Invoke-Claude -SystemPromptFile $testWriterFile -Prompt $prompt -TaskId $taskId -AddDir $addDir
    }
    catch {
        Write-TaskLog -TaskId $taskId -Phase 'red' -Message "ESCALATED: Infrastructure failure — $($_.Exception.Message)" -FeatureDir $FeatureDir -RunId $RunId
        return ConvertTo-TaskResult @{
            TaskId = $taskId; Phase = 'red'; Status = 'escalated'
            Counters = $Counters; Escalated = $true; Error = $_.Exception.Message
        }
    }

    # Extract test file paths and verdict from agent response
    $testFiles = @()
    $verdict = $null
    $parsed = ConvertFrom-AgentResponse -Response $response
    if ($parsed) {
        if ($parsed.filesModified) {
            $testFiles = @($parsed.filesModified |
                Where-Object { $_.path -match '\.(test|spec|Tests)\.' } |
                ForEach-Object { $_.path })
        }
        if ($parsed.verdict -eq 'already_implemented') { $verdict = 'already_implemented' }
    }

    if ($verdict -eq 'already_implemented') {
        Write-TaskLog -TaskId $taskId -Phase 'red' -Message 'Already implemented — skipping to cleanup' -FeatureDir $FeatureDir -RunId $RunId
        return ConvertTo-TaskResult @{
            TaskId = $taskId; Phase = 'cleanup'; Status = 'running'
            Counters = $Counters; Escalated = $false
            TestFiles = $testFiles
        }
    }

    # Run verify-test
    $workDir = if ($WorkspacePath) { $WorkspacePath } else { $null }
    try {
        $exitCode = Invoke-VerifyCommand -Command $Config.VerifyTest -WorkingDirectory $workDir
    }
    catch {
        Write-TaskLog -TaskId $taskId -Phase 'red' -Message "ESCALATED: Verify command infrastructure failure" -FeatureDir $FeatureDir -RunId $RunId
        return ConvertTo-TaskResult @{
            TaskId = $taskId; Phase = 'red'; Status = 'escalated'
            Counters = $Counters; Escalated = $true; Error = $_.Exception.Message
            TestFiles = $testFiles
        }
    }

    if ($exitCode -ne 0) {
        # Tests fail as expected — advance to GREEN
        Write-TaskLog -TaskId $taskId -Phase 'red' -Message 'Tests fail as expected (RED pass) — advancing to GREEN' -FeatureDir $FeatureDir -RunId $RunId
        return ConvertTo-TaskResult @{
            TaskId = $taskId; Phase = 'green'; Status = 'running'
            Counters = $Counters; Escalated = $false
            TestFiles = $testFiles
        }
    }

    # Tests pass unexpectedly — enter RED retry
    Write-TaskLog -TaskId $taskId -Phase 'red_retry' -Message 'Tests passed unexpectedly — entering RED retry' -FeatureDir $FeatureDir -RunId $RunId

    while ($true) {
        # Boundary check BEFORE dispatch
        if ($Counters.redRetries -ge $Config.MaxRedRetries) {
            Write-TaskLog -TaskId $taskId -Phase 'red_retry' -Message "ESCALATED: RED retry exhausted ($($Counters.redRetries)/$($Config.MaxRedRetries))" -FeatureDir $FeatureDir -RunId $RunId
            return ConvertTo-TaskResult @{
                TaskId = $taskId; Phase = 'red_retry'; Status = 'escalated'
                Counters = $Counters; Escalated = $true; Error = 'RED retry exhausted'
                TestFiles = $testFiles
            }
        }

        $Counters.redRetries++
        $retryPrompt = "Tests passed unexpectedly. Revise the tests or determine if the feature is already implemented.`nReturn JSON with 'verdict': 'revised' or 'already_implemented'"

        try {
            $verdictResponse = Invoke-Claude -SystemPromptFile $testWriterFile -Prompt $retryPrompt -TaskId $taskId -AddDir $addDir
        }
        catch {
            $Counters.redRetries--
            Write-TaskLog -TaskId $taskId -Phase 'red_retry' -Message "ESCALATED: Infrastructure failure during retry" -FeatureDir $FeatureDir -RunId $RunId
            return ConvertTo-TaskResult @{
                TaskId = $taskId; Phase = 'red_retry'; Status = 'escalated'
                Counters = $Counters; Escalated = $true; Error = $_.Exception.Message
                TestFiles = $testFiles
            }
        }

        # Parse verdict
        $verdict = $null
        $parsedVerdict = ConvertFrom-AgentResponse -Response $verdictResponse
        if ($parsedVerdict) { $verdict = $parsedVerdict.verdict }

        if ($verdict -eq 'already_implemented') {
            Write-TaskLog -TaskId $taskId -Phase 'red_retry' -Message 'Already implemented — skipping to cleanup' -FeatureDir $FeatureDir -RunId $RunId
            return ConvertTo-TaskResult @{
                TaskId = $taskId; Phase = 'cleanup'; Status = 'running'
                Counters = $Counters; Escalated = $false
                TestFiles = $testFiles
            }
        }

        if ($verdict -eq 'revised' -or -not $verdict) {
            # Re-run tests
            try {
                $exitCode = Invoke-VerifyCommand -Command $Config.VerifyTest -WorkingDirectory $workDir
            }
            catch {
                Write-TaskLog -TaskId $taskId -Phase 'red_retry' -Message "ESCALATED: Verify infrastructure failure" -FeatureDir $FeatureDir -RunId $RunId
                return ConvertTo-TaskResult @{
                    TaskId = $taskId; Phase = 'red_retry'; Status = 'escalated'
                    Counters = $Counters; Escalated = $true; Error = $_.Exception.Message
                    TestFiles = $testFiles
                }
            }

            if ($exitCode -ne 0) {
                Write-TaskLog -TaskId $taskId -Phase 'red' -Message 'Tests now fail (RED pass) — advancing to GREEN' -FeatureDir $FeatureDir -RunId $RunId
                return ConvertTo-TaskResult @{
                    TaskId = $taskId; Phase = 'green'; Status = 'running'
                    Counters = $Counters; Escalated = $false
                    TestFiles = $testFiles
                }
            }

            Write-TaskLog -TaskId $taskId -Phase 'red_retry' -Message "Tests still pass — retry $($Counters.redRetries)/$($Config.MaxRedRetries)" -FeatureDir $FeatureDir -RunId $RunId
        }
    }
}

function Reset-RedCounters {
    param([Parameter(Mandatory)][hashtable]$State)
    $State.redRetries = 0
    return $State
}
