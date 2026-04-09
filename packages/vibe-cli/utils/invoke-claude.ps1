function Invoke-Claude {
    param(
        [string]$SystemPromptFile,
        [string]$AppendSystemPromptFile,
        [string]$Prompt,
        [string]$JsonSchema,
        [string]$AddDir,
        [switch]$Interactive
    )

    $args_ = @('--strict-mcp-config', '--dangerously-skip-permissions')

    if ($SystemPromptFile)       { $args_ += '--system-prompt-file',       $SystemPromptFile }
    if ($AppendSystemPromptFile) { $args_ += '--append-system-prompt-file', $AppendSystemPromptFile }
    if ($JsonSchema)             { $args_ += '--json-schema',              $JsonSchema }
    if ($AddDir)                 { $args_ += '--add-dir',                  $AddDir }

    $agentName = if ($SystemPromptFile) { Split-Path $SystemPromptFile -Leaf } elseif ($AppendSystemPromptFile) { Split-Path $AppendSystemPromptFile -Leaf } else { 'unknown' }

    if ($Interactive) {
        if ($Prompt) { $args_ += $Prompt }

        Write-PipelineLog "INVOKE interactive agent=$agentName"

        $escapedArgs = $args_ | ForEach-Object {
            if ($_ -match '\s') { "`"$_`"" } else { $_ }
        }
        $argString = $escapedArgs -join ' '

        Start-Process -FilePath claude -ArgumentList $argString -Wait
        Write-PipelineLog "COMPLETE interactive agent=$agentName"
    }
    else {
        Write-PipelineLog "INVOKE print agent=$agentName"
        $args_ += '--print', '--verbose', '--output-format', 'stream-json'

        # Write prompt to temp file to avoid Windows 32K command line limit
        $promptFile = $null
        if ($Prompt) {
            $promptFile = [System.IO.Path]::GetTempFileName()
            [System.IO.File]::WriteAllText($promptFile, $Prompt)
        }

        # Use batched mode (Start-Process) when $InvokeClaudeBatched is set.
        # ForEach-Object -Parallel runspaces must set this before calling Invoke-Claude
        # because direct claude piping fails with StandardOutputEncoding error.
        $inParallel = $global:InvokeClaudeBatched -eq $true

        if ($inParallel) {
            return Invoke-ClaudeBatched -Args $args_ -PromptFile $promptFile -AgentName $agentName
        }

        $resultText = $null
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

        & {
            if ($promptFile) {
                Get-Content $promptFile -Raw | claude @args_ 2>$null
            } else {
                claude @args_ 2>$null
            }
        } | ForEach-Object {
            $line = "$_".Trim()
            if (-not $line.StartsWith('{')) { return }

            $sanitized = $line -replace '(?<=:)\s*Infinity', '0' -replace '(?<=:)\s*-Infinity', '0' -replace '(?<=:)\s*NaN', '0'
            try { $evt = $sanitized | ConvertFrom-Json } catch { return }

            if ($evt.type -eq 'assistant' -and $evt.message.content) {
                foreach ($block in $evt.message.content) {
                    if ($block.type -eq 'tool_use' -and $block.name) {
                        $elapsed = $stopwatch.Elapsed.ToString('mm\:ss')
                        Write-Host "    [$elapsed] $($block.name)..." -ForegroundColor DarkCyan
                        Write-PipelineLog "  TOOL $($block.name) at $elapsed agent=$agentName"
                    }
                }
            }

            if ($evt.type -eq 'result') {
                $elapsed = $stopwatch.Elapsed.ToString('mm\:ss')
                $cost = if ($evt.total_cost_usd) { " (`$$([math]::Round($evt.total_cost_usd, 4)))" } else { "" }
                Write-Host "    [$elapsed] Done$cost" -ForegroundColor DarkGreen
                Write-PipelineLog "COMPLETE print agent=$agentName elapsed=$elapsed cost=$($evt.total_cost_usd)"

                if ($evt.subtype -eq 'success') {
                    if ($evt.structured_output) {
                        $resultText = $evt.structured_output | ConvertTo-Json -Depth 10 -Compress
                    }
                    elseif ($evt.result) {
                        $resultText = $evt.result
                    }
                }
            }
        }

        $stopwatch.Stop()
        if ($promptFile) { Remove-Item $promptFile -ErrorAction SilentlyContinue }

        if ($resultText) { return $resultText }
    }
}

# File-based invocation for parallel runspaces where direct piping fails
function Invoke-ClaudeBatched {
    param(
        [array]$Args,
        [string]$PromptFile,
        [string]$AgentName
    )

    $outFile = [System.IO.Path]::GetTempFileName()
    $errFile = [System.IO.Path]::GetTempFileName()
    $inFile  = if ($PromptFile) { $PromptFile } else { $null }

    $escapedArgs = $Args | ForEach-Object {
        if ($_ -match '\s') { "`"$_`"" } else { $_ }
    }
    $argString = $escapedArgs -join ' '

    $procParams = @{
        FilePath               = 'claude'
        ArgumentList           = $argString
        RedirectStandardOutput = $outFile
        RedirectStandardError  = $errFile
        NoNewWindow            = $true
        Wait                   = $true
        PassThru               = $true
    }
    if ($inFile) { $procParams.RedirectStandardInput = $inFile }

    $proc = Start-Process @procParams

    $output = if (Test-Path $outFile) { Get-Content $outFile -Raw } else { "" }
    Remove-Item $outFile, $errFile -ErrorAction SilentlyContinue
    if ($PromptFile) { Remove-Item $PromptFile -ErrorAction SilentlyContinue }

    Write-PipelineLog "COMPLETE batched agent=$AgentName exitCode=$($proc.ExitCode)"

    # Parse stream-json output for the result
    $resultText = $null
    foreach ($line in ($output -split "`n")) {
        $trimmed = $line.Trim()
        if (-not $trimmed.StartsWith('{')) { continue }

        # Sanitize JSON — replace Infinity/NaN which PowerShell's parser can't handle
        $sanitized = $trimmed -replace '(?<=:)\s*Infinity', '0' -replace '(?<=:)\s*-Infinity', '0' -replace '(?<=:)\s*NaN', '0'
        try { $evt = $sanitized | ConvertFrom-Json } catch { continue }

        if ($evt.type -eq 'result' -and $evt.subtype -eq 'success') {
            if ($evt.structured_output) {
                $resultText = $evt.structured_output | ConvertTo-Json -Depth 10 -Compress
            }
            elseif ($evt.result) {
                $resultText = $evt.result
            }
        }
    }

    if ($resultText) { return $resultText }
}
