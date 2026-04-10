function Invoke-Claude {
    param(
        [string]$SystemPromptFile,
        [string]$AppendSystemPromptFile,
        [string]$Prompt,
        [string]$JsonSchema,
        [string]$AddDir,
        [switch]$Interactive,
        [string]$TaskId
    )

    $args_ = @('--strict-mcp-config', '--dangerously-skip-permissions')

    if ($SystemPromptFile) { $args_ += '--system-prompt-file', $SystemPromptFile }
    if ($AppendSystemPromptFile) { $args_ += '--append-system-prompt-file', $AppendSystemPromptFile }
    if ($JsonSchema) { $args_ += '--json-schema', $JsonSchema }
    if ($AddDir) { $args_ += '--add-dir', $AddDir }

    $agentName = if ($SystemPromptFile) { Split-Path $SystemPromptFile -Leaf } elseif ($AppendSystemPromptFile) { Split-Path $AppendSystemPromptFile -Leaf } else { 'unknown' }

    # Headroom proxy routing
    $origBaseUrl = $env:ANTHROPIC_BASE_URL
    if ($Config.UseHeadroom) {
        $env:ANTHROPIC_BASE_URL = $Config.HeadroomUrl
    }

    if ($Interactive) {
        if ($Prompt) { $args_ += $Prompt }
        Write-PipelineLog "INVOKE interactive agent=$agentName"

        $escapedArgs = $args_ | ForEach-Object {
            if ($_ -match '\s') { "`"$_`"" } else { $_ }
        }
        Start-Process -FilePath claude -ArgumentList ($escapedArgs -join ' ') -Wait
        $env:ANTHROPIC_BASE_URL = $origBaseUrl
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
                    Write-PipelineLog "  [$elapsed] $($block.name)..." -Color DarkCyan
                }
                if ($block.type -eq 'text' -and $block.text) {
                    Write-PipelineLog "  [$elapsed] $($block.text)" -Color DarkGray
                }
            }
        }

        if ($evt.type -eq 'result') {
            $elapsed = $stopwatch.Elapsed.ToString('mm\:ss')
            $cost = if ($evt.total_cost_usd) { " (`$$([math]::Round($evt.total_cost_usd, 4)))" } else { "" }
            Write-PipelineLog "  [$elapsed] Done$cost" -Color DarkGreen
            Write-PipelineLog "COMPLETE agent=$agentName elapsed=$elapsed cost=$($evt.total_cost_usd)"

            if ($evt.subtype -eq 'success') {
                if ($evt.structured_output) {
                    $resultText = $evt.structured_output | ConvertTo-Json -Depth 10 -Compress
                }
                elseif ($evt.result) {
                    $resultText = $evt.result
                }
            }
            else {
                Write-PipelineLog "  [$elapsed] agent=$agentName subtype=$($evt.subtype)" -Color Yellow
                if ($evt.error) { Write-PipelineLog "ERROR agent=$agentName $($evt.error)" -Color Red }
            }
        }
    }

    $stopwatch.Stop()
    Remove-Item $errFile -ErrorAction SilentlyContinue
    if ($promptFile) { Remove-Item $promptFile -ErrorAction SilentlyContinue }
    $env:ANTHROPIC_BASE_URL = $origBaseUrl

    # Clean up PID registry entry
    if ($TaskId -and (Get-Command Get-ChildPidRegistry -ErrorAction SilentlyContinue)) {
        $null = (Get-ChildPidRegistry).TryRemove($TaskId, [ref]$null)
    }

    if (-not $resultText) {
        Write-PipelineLog "NULL-RESULT agent=$agentName"
    }

    if ($resultText) { return $resultText }
}
