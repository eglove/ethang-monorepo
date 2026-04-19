function Invoke-Claude {
    param(
        [string]$Role,
        [string]$Model,
        [string]$SystemPromptFile,
        [string]$AppendSystemPromptFile,
        [string]$Prompt,
        [string]$JsonSchema,
        [string]$AddDir,
        [switch]$Interactive,
        [string]$TaskId,
        [switch]$SkipCloseHook
    )

    # Early validation of Role and Model
    $validRoles = @('elicitor', 'doc-writer', 'expert', 'moderator', 'reviewer', 'code-writer')
    $validModels = @('opus', 'sonnet', 'haiku')

    if (-not $Role -or $Role -notin $validRoles) {
        [Console]::Error.WriteLine("[ROUTING-HALT:INVALID-ROLE $Role]")
        throw "Invalid role: '$Role'. Valid roles: $($validRoles -join ', ')"
    }

    if ($Model -and $Model -notin $validModels) {
        [Console]::Error.WriteLine("[ROUTING-HALT:INVALID-MODEL $Model]")
        throw "Invalid model: '$Model'. Valid models: $($validModels -join ', ')"
    }

    $args_ = @('--strict-mcp-config', '--dangerously-skip-permissions')

    # Load model mapping and resolve final model
    $mappingPath = Join-Path $PSScriptRoot '../config/model-routing.psd1'
    if (-not (Test-Path $mappingPath)) {
        [Console]::Error.WriteLine("[ROUTING-HALT:MISSING-MAPPING $Role]")
        throw "Model routing config not found: $mappingPath"
    }
    $mapping = Import-PowerShellDataFile $mappingPath

    if (-not $mapping.ContainsKey($Role)) {
        [Console]::Error.WriteLine("[ROUTING-HALT:MISSING-MAPPING $Role]")
        throw "No mapping entry for role: $Role"
    }

    $resolvedModel = if ($Model) { $Model } else { $mapping[$Role] }
    $args_ += '--model', $resolvedModel

    if ($SystemPromptFile) { $args_ += '--system-prompt-file', $SystemPromptFile }
    if ($AppendSystemPromptFile) { $args_ += '--append-system-prompt-file', $AppendSystemPromptFile }
    if ($JsonSchema) { $args_ += '--json-schema', $JsonSchema }
    if ($AddDir) { $args_ += '--add-dir', $AddDir }

    $agentName = if ($SystemPromptFile) { Split-Path $SystemPromptFile -Leaf } elseif ($AppendSystemPromptFile) { Split-Path $AppendSystemPromptFile -Leaf } else { 'unknown' }

    if ($Interactive) {
        if ($Prompt) { $args_ += $Prompt }
        Write-PipelineLog "INVOKE interactive agent=$agentName"

        $escapedArgs = $args_ | ForEach-Object {
            if ($_ -match '\s') { "`"$_`"" } else { $_ }
        }
        Start-Process -FilePath claude -ArgumentList ($escapedArgs -join ' ') -Wait
        Write-PipelineLog "COMPLETE interactive agent=$agentName"
        return
    }

    # Print mode
    Write-PipelineLog "INVOKE agent=$agentName"
    $args_ += '--print', '--verbose', '--output-format', 'stream-json'

    # Write prompt to temp file to avoid Windows 32K command line limit
    $promptFile = $null
    if ($Prompt) {
        $promptFile = [System.IO.Path]::GetTempFileName()
        [System.IO.File]::WriteAllText($promptFile, $Prompt)
    }

    $resultText = $null
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $errFile = [System.IO.Path]::GetTempFileName()

    # Register PID for process-tree kill on timeout (objection #61)
    $claudeProcess = $null

    & {
        if ($promptFile) {
            Get-Content $promptFile -Raw | claude @args_ 2>$errFile
        }
        else {
            claude @args_ 2>$errFile
        }
    } | ForEach-Object {
        # Lazy PID registration: capture on first output line
        if (-not $claudeProcess -and $TaskId) {
            try {
                $claudeProcess = Get-Process -Name 'claude' -ErrorAction SilentlyContinue |
                    Sort-Object StartTime -Descending | Select-Object -First 1
                if ($claudeProcess -and (Get-Command Get-ChildPidRegistry -ErrorAction SilentlyContinue)) {
                    $registry = Get-ChildPidRegistry
                    $null = $registry.TryAdd($TaskId, $claudeProcess.Id)
                }
            }
            catch { }
        }
        $line = "$_".Trim()
        if (-not $line.StartsWith('{')) { return }

        $sanitized = $line -replace '(?<=:)\s*Infinity', '0' -replace '(?<=:)\s*-Infinity', '0' -replace '(?<=:)\s*NaN', '0'
        try { $evt = $sanitized | ConvertFrom-Json } catch { return }

        if ($evt.type -eq 'assistant' -and $evt.message.content) {
            foreach ($block in $evt.message.content) {
                $elapsed = $stopwatch.Elapsed.ToString('mm\:ss')
                if ($block.type -eq 'tool_use' -and $block.name) {
                    Write-PipelineLog "  [$elapsed] $($block.name)..."
                }
                if ($block.type -eq 'text' -and $block.text) {
                    Write-PipelineLog "  [$elapsed] $($block.text)"
                }
            }
        }

        if ($evt.type -eq 'result') {
            $elapsed = $stopwatch.Elapsed.ToString('mm\:ss')
            $cost = if ($evt.total_cost_usd) { " (`$$([math]::Round($evt.total_cost_usd, 4)))" } else { "" }
            Write-PipelineLog "  [$elapsed] Done$cost"
            Write-PipelineLog "COMPLETE agent=$agentName elapsed=$elapsed cost=$($evt.total_cost_usd)"

            if ($evt.subtype -eq 'success') {
                if ($evt.structured_output) {
                    $resultText = $evt.structured_output | ConvertTo-Json -Depth 20 -Compress
                }
                elseif ($evt.result) {
                    $resultText = $evt.result
                }
            }
            else {
                Write-PipelineLog "  [$elapsed] agent=$agentName subtype=$($evt.subtype)"
                if ($evt.error) { Write-PipelineLog "ERROR agent=$agentName $($evt.error)" }
            }
        }
    }

    $stopwatch.Stop()
    Remove-Item $errFile -ErrorAction SilentlyContinue
    if ($promptFile) { Remove-Item $promptFile -ErrorAction SilentlyContinue }

    # Clean up PID registry entry
    if ($TaskId -and (Get-Command Get-ChildPidRegistry -ErrorAction SilentlyContinue)) {
        $null = (Get-ChildPidRegistry).TryRemove($TaskId, [ref]$null)
    }

    if (-not $resultText) {
        Write-PipelineLog "NULL-RESULT agent=$agentName"
    }

    # Per-agent close hook — regenerates root CLAUDE.md from the knowledge graph.
    # Skipped when -SkipCloseHook is set or VIBE_CLI_SKIP_CLOSE_HOOK is truthy
    # (tests set this to avoid spawning tsx for every mocked Invoke-Claude).
    if (-not $SkipCloseHook -and -not $env:VIBE_CLI_SKIP_CLOSE_HOOK) {
        try {
            $claudeMd = if ($env:VIBE_CLI_CLAUDE_MD) {
                $env:VIBE_CLI_CLAUDE_MD
            } else {
                (Resolve-Path (Join-Path $PSScriptRoot '../../../CLAUDE.md') -ErrorAction SilentlyContinue).Path
            }
            if ($claudeMd -and (Get-Command Invoke-CloseHook -ErrorAction SilentlyContinue)) {
                $null = Invoke-CloseHook -OutputPath $claudeMd
            }
        }
        catch {
            Write-PipelineLog "close-hook failed for agent=$agentName err=$_"
        }
    }

    if ($resultText) { return $resultText }
}

function Invoke-ClaudeWithRetry {
    <#
    .SYNOPSIS
        Wraps Invoke-Claude with exponential backoff retry for transient failures.
        Independent of TLA+ apiRetries (merge-only counter in merge-queue.ps1).
    #>
    param(
        [string]$Role,
        [string]$Model,
        [string]$SystemPromptFile,
        [string]$AppendSystemPromptFile,
        [string]$Prompt,
        [string]$JsonSchema,
        [string]$AddDir,
        [switch]$Interactive,
        [string]$TaskId,
        [int]$MaxAttempts = 5,
        [int[]]$BackoffSeconds = @(5, 10, 20, 40, 80)
    )

    # Build splat for Invoke-Claude (exclude retry-specific params)
    $claudeParams = @{}
    if ($Role) { $claudeParams.Role = $Role }
    if ($Model) { $claudeParams.Model = $Model }
    if ($SystemPromptFile) { $claudeParams.SystemPromptFile = $SystemPromptFile }
    if ($AppendSystemPromptFile) { $claudeParams.AppendSystemPromptFile = $AppendSystemPromptFile }
    if ($Prompt) { $claudeParams.Prompt = $Prompt }
    if ($JsonSchema) { $claudeParams.JsonSchema = $JsonSchema }
    if ($AddDir) { $claudeParams.AddDir = $AddDir }
    if ($Interactive) { $claudeParams.Interactive = $true }
    if ($TaskId) { $claudeParams.TaskId = $TaskId }

    $attempt = 0
    while ($true) {
        $attempt++
        try {
            return Invoke-Claude @claudeParams
        }
        catch {
            $errMsg = $_.Exception.Message
            $statusCode = $null

            if ($errMsg -match '\b(\d{3})\b') { $statusCode = [int]$Matches[1] }

            # 400-level client errors (except 429) NOT retried
            if ($statusCode -and $statusCode -ge 400 -and $statusCode -lt 500 -and $statusCode -ne 429) {
                Write-PipelineLog "API client error ($statusCode) — not retrying"
                throw
            }

            if ($attempt -ge $MaxAttempts) {
                Write-PipelineLog "API retry exhausted after $MaxAttempts attempts"
                throw
            }

            # 429 with Retry-After
            $delay = $BackoffSeconds[[math]::Min($attempt - 1, $BackoffSeconds.Count - 1)]
            if ($statusCode -eq 429 -and $errMsg -match 'Retry-After:\s*(\d+)') {
                $delay = [int]$Matches[1]
            }

            Write-PipelineLog "API attempt $attempt/$MaxAttempts failed, retrying in ${delay}s..."
            Start-Sleep -Seconds $delay
        }
    }
}
