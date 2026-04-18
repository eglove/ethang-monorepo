. "$PSScriptRoot/result-contracts.ps1"
. "$PSScriptRoot/task-log.ps1"

function Invoke-AgentWriter {
    param(
        [Parameter(Mandatory)][object]$Task,
        [Parameter(Mandatory)][string]$Root,
        [string]$FeatureDir,
        [string]$RunId,
        [string]$PlanJsonPath
    )

    $taskId = $Task.id
    Write-StatusNote -TaskId $taskId -Status 'Coding' -Detail "agent: $($Task.codeWriter)"

    $counters = @{ }

    # Re-dispatch idempotency: check for pre-existing output
    if ($FeatureDir) {
        $logsDir = Join-Path $FeatureDir 'logs'
        $logFile = Join-Path $logsDir "$taskId-log.txt"
        if (Test-Path $logFile) {
            $logContent = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
            if ($logContent -match 'COMPLETED') {
                Write-TaskLog -TaskId $taskId -Phase 'agent_call' -Message 'Skipping — already completed' -FeatureDir $FeatureDir -RunId $RunId
                return ConvertTo-TaskResult @{
                    TaskId = $taskId; Phase = 'done'; Status = 'completed'
                    Counters = $counters; Escalated = $false
                }
            }
        }
    }

    # Dispatch single Invoke-Claude call
    $agentFile = Join-Path $Root "agents/code-writers/$($Task.codeWriter).md"
    $taskJson = $Task | ConvertTo-Json -Depth 20 -Compress
    $prompt = "Execute task $taskId`n`nTask JSON:`n$taskJson`n`nFull implementation plan: $PlanJsonPath"

    Write-TaskLog -TaskId $taskId -Phase 'agent_call' -Message "Dispatching agent: $($Task.codeWriter)" -FeatureDir $FeatureDir -RunId $RunId

    try {
        $response = Invoke-Claude -Role 'code-writer' -SystemPromptFile $agentFile -Prompt $prompt -TaskId $taskId
    }
    catch {
        Write-TaskLog -TaskId $taskId -Phase 'agent_call' -Message "ESCALATED: Infrastructure failure — $($_.Exception.Message)" -FeatureDir $FeatureDir -RunId $RunId
        return ConvertTo-TaskResult @{
            TaskId = $taskId; Phase = 'agent_call'; Status = 'escalated'
            Counters = $counters; Escalated = $true; Error = $_.Exception.Message
        }
    }

    if (-not $response) {
        Write-TaskLog -TaskId $taskId -Phase 'agent_call' -Message 'ESCALATED: No response from agent' -FeatureDir $FeatureDir -RunId $RunId
        return ConvertTo-TaskResult @{
            TaskId = $taskId; Phase = 'agent_call'; Status = 'escalated'
            Counters = $counters; Escalated = $true; Error = 'No response from agent'
        }
    }

    Write-TaskLog -TaskId $taskId -Phase 'done' -Message 'COMPLETED' -FeatureDir $FeatureDir -RunId $RunId

    return ConvertTo-TaskResult @{
        TaskId = $taskId; Phase = 'done'; Status = 'completed'
        Counters = $counters; Escalated = $false
    }
}
