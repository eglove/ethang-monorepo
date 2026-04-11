. "$PSScriptRoot/result-contracts.ps1"
. "$PSScriptRoot/task-log.ps1"
. "$PSScriptRoot/response-parser.ps1"

function Invoke-CleanupPhase {
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
    Write-StatusNote -TaskId $taskId -Status 'Cleanup'

    $workDir = if ($WorkspacePath) { Get-PackageWorkDir $WorkspacePath } else { $null }

    if (-not $Counters.ContainsKey('cleanupCleanPasses')) { $Counters.cleanupCleanPasses = 0 }
    if (-not $Counters.ContainsKey('cleanupRemediations')) { $Counters.cleanupRemediations = 0 }

    $verifyCommands = @($Config.VerifyTest, $Config.VerifyLint, $Config.VerifyTsc)

    while ($true) {
        # Run verify triple with short-circuit on first failure
        $allPassed = $true
        $failedCommand = $null

        foreach ($cmd in $verifyCommands) {
            try {
                if ($cmd -eq $Config.VerifyTest -and $TestFiles -and $TestFiles.Count -gt 0) {
                    $exitCode = Invoke-ScopedTestVerify -TestFiles $TestFiles -WorkingDirectory $workDir
                }
                else {
                    $exitCode = Invoke-VerifyCommand -Command $cmd -WorkingDirectory $workDir
                }
            }
            catch {
                Write-TaskLog -TaskId $taskId -Phase 'cleanup' -Message "ESCALATED: Infrastructure failure during '$cmd'" -FeatureDir $FeatureDir -RunId $RunId
                return ConvertTo-TaskResult @{
                    TaskId = $taskId; Phase = 'cleanup'; Status = 'escalated'
                    Counters = $Counters; Escalated = $true; Error = $_.Exception.Message
                }
            }

            if ($exitCode -ne 0) {
                $allPassed = $false
                $failedCommand = $cmd
                break  # Short-circuit
            }
        }

        if ($allPassed) {
            $Counters.cleanupCleanPasses++
            Write-TaskLog -TaskId $taskId -Phase 'cleanup' -Message "Clean pass $($Counters.cleanupCleanPasses)/$($Config.CleanupPasses)" -FeatureDir $FeatureDir -RunId $RunId

            if ($Counters.cleanupCleanPasses -ge $Config.CleanupPasses) {
                Write-TaskLog -TaskId $taskId -Phase 'done' -Message 'COMPLETED' -FeatureDir $FeatureDir -RunId $RunId
                return ConvertTo-TaskResult @{
                    TaskId = $taskId; Phase = 'done'; Status = 'completed'
                    Counters = $Counters; Escalated = $false
                }
            }
            continue
        }

        # Failure — reset clean passes, enter remediation
        $Counters.cleanupCleanPasses = 0
        Write-TaskLog -TaskId $taskId -Phase 'cleanup' -Message "Failed on '$failedCommand' — entering remediation" -FeatureDir $FeatureDir -RunId $RunId

        # Boundary check BEFORE remediation dispatch
        if ($Counters.cleanupRemediations -ge $Config.MaxFixRounds) {
            Write-TaskLog -TaskId $taskId -Phase 'cleanup_remed' -Message "ESCALATED: Cleanup remediation exhausted ($($Counters.cleanupRemediations)/$($Config.MaxFixRounds))" -FeatureDir $FeatureDir -RunId $RunId
            return ConvertTo-TaskResult @{
                TaskId = $taskId; Phase = 'cleanup_remed'; Status = 'escalated'
                Counters = $Counters; Escalated = $true; Error = 'Cleanup remediation exhausted'
            }
        }

        $Counters.cleanupRemediations++

        # Ask test writer for blame determination
        $testWriterFile = Join-Path $Root "agents/test-writers/$($Task.testWriter)-writer.md"
        if (-not (Test-Path $testWriterFile)) {
            $testWriterFile = Join-Path $Root "agents/test-writers/$($Task.testWriter).md"
        }

        $blamePrompt = "Verify command '$failedCommand' failed. Determine blame: is this a 'test' issue or a 'code' issue? Return JSON: { `"blame`": `"test`" | `"code`" }"

        $addDir = if ($WorkspacePath) { Get-PackageWorkDir $WorkspacePath } else { $null }
        try {
            $blameResponse = Invoke-Claude -SystemPromptFile $testWriterFile -Prompt $blamePrompt -TaskId $taskId -AddDir $addDir
        }
        catch {
            Write-TaskLog -TaskId $taskId -Phase 'cleanup_remed' -Message "ESCALATED: Infrastructure failure during blame" -FeatureDir $FeatureDir -RunId $RunId
            return ConvertTo-TaskResult @{
                TaskId = $taskId; Phase = 'cleanup_remed'; Status = 'escalated'
                Counters = $Counters; Escalated = $true; Error = $_.Exception.Message
            }
        }

        # Parse blame
        $blame = $null
        $parsedBlame = ConvertFrom-AgentResponse -Response $blameResponse
        if ($parsedBlame) { $blame = $parsedBlame.blame }

        # Skip remediation when blame is "neither" or unparseable — re-verify instead
        if ($blame -eq 'neither' -or -not $blame) {
            Write-TaskLog -TaskId $taskId -Phase 'cleanup_remed' -Message "Blame='$blame' — no actionable failure, re-verifying" -FeatureDir $FeatureDir -RunId $RunId
            $Counters.cleanupRemediations--
            continue
        }

        # Dispatch to appropriate writer based on blame
        $fixWriterFile = if ($blame -eq 'test') {
            $testWriterFile
        }
        else {
            # Default to code writer for 'code' blame or unrecognized
            Join-Path $Root "agents/code-writers/$($Task.codeWriter).md"
        }

        $fixPrompt = "Fix the '$failedCommand' failure for task $taskId. Blame: $blame"

        Write-TaskLog -TaskId $taskId -Phase 'cleanup_remed' -Message "Remediation dispatch: blame=$blame, writer=$(Split-Path $fixWriterFile -Leaf)" -FeatureDir $FeatureDir -RunId $RunId

        try {
            Invoke-Claude -SystemPromptFile $fixWriterFile -Prompt $fixPrompt -TaskId $taskId -AddDir $addDir | Out-Null
        }
        catch {
            Write-TaskLog -TaskId $taskId -Phase 'cleanup_remed' -Message "ESCALATED: Infrastructure failure during remediation" -FeatureDir $FeatureDir -RunId $RunId
            return ConvertTo-TaskResult @{
                TaskId = $taskId; Phase = 'cleanup_remed'; Status = 'escalated'
                Counters = $Counters; Escalated = $true; Error = $_.Exception.Message
            }
        }
    }
}

function Reset-CleanupCounters {
    param([Parameter(Mandatory)][hashtable]$State)
    $State.cleanupRemediations = 0
    $State.cleanupCleanPasses = 0
    return $State
}
