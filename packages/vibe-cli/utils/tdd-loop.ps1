function Invoke-TddLoop {
    param(
        [Parameter(Mandatory)]
        [string]$TestWriterFile,

        [Parameter(Mandatory)]
        [string]$CodeWriterFile,

        [Parameter(Mandatory)]
        [string]$TaskContext,

        [Parameter(Mandatory)]
        [string]$WorktreePath,

        [string]$TaskId = "??",

        [int]$MaxCycles = $Config.MaxTddCycles
    )

    $turnSchema = @'
{"type":"object","properties":{"status":{"type":"string","enum":["CONTINUE","DONE"]},"summary":{"type":"string"}},"required":["status","summary"]}
'@

    $redSkipCount = 0

    for ($cycle = 1; $cycle -le $MaxCycles; $cycle++) {
        Write-Host "  [$TaskId] TDD cycle $cycle/$MaxCycles" -ForegroundColor Magenta

        # RED — test writer writes a failing test
        Write-Host "    [$TaskId] RED: writing failing test..." -ForegroundColor Red
        $redFeedback = if ($redSkipCount -gt 0) {
            "`nYour last $redSkipCount test(s) already passed without needing new code — the existing implementation already covers them. If all behavior is covered, return status DONE."
        }
        else { "" }
        $testTurn = Invoke-Claude `
            -SystemPromptFile $TestWriterFile `
            -JsonSchema $turnSchema `
            -AddDir $WorktreePath `
            -Prompt "$TaskContext`nCycle $cycle — write the next failing test. If all behavior is covered, return status DONE.$redFeedback" |
            ConvertFrom-Json

        if ($testTurn.status -eq 'DONE') {
            Write-Host "    [$TaskId] Test writer signals DONE — all behavior covered." -ForegroundColor Green
            Write-PipelineLog "[$TaskId] TDD DONE after $($cycle - 1) cycles"
            return @{ Cycles = $cycle - 1; Status = 'DONE' }
        }

        Write-Host "    [$TaskId] Test: $($testTurn.summary)" -ForegroundColor Red
        Write-PipelineLog "[$TaskId] TDD cycle=$cycle RED: $($testTurn.summary)"

        # Verify RED — test must actually fail
        Push-Location $WorktreePath
        & ([scriptblock]::Create($Config.VerifyTest)) 2>&1 | Out-Null
        $redPassed = $LASTEXITCODE -eq 0
        Pop-Location

        if ($redPassed) {
            $redSkipCount++
            Write-Host "    [$TaskId] RED passed immediately — skipping GREEN, nothing for code writer to do." -ForegroundColor Yellow
            Write-PipelineLog "[$TaskId] TDD cycle=$cycle RED passed immediately — skipping GREEN (consecutive=$redSkipCount)"
            continue
        }

        $redSkipCount = 0

        # GREEN — code writer makes it pass
        Write-Host "    [$TaskId] GREEN: writing implementation..." -ForegroundColor Green
        Invoke-Claude `
            -SystemPromptFile $CodeWriterFile `
            -JsonSchema $turnSchema `
            -AddDir $WorktreePath `
            -Prompt "$TaskContext`nCycle $cycle — a failing test was just added: $($testTurn.summary). Write the minimum implementation to make it pass." |
            Out-Null

        # Verify GREEN — tests must pass
        Push-Location $WorktreePath
        $testOutput = & ([scriptblock]::Create($Config.VerifyTest)) 2>&1
        $greenPassed = $LASTEXITCODE -eq 0
        Pop-Location

        if (-not $greenPassed) {
            $greenFixed = $false
            for ($retry = 1; $retry -le $Config.MaxGreenRetries; $retry++) {
                Write-Host "    [$TaskId] GREEN failed — fix attempt $retry/$($Config.MaxGreenRetries)..." -ForegroundColor Yellow
                Write-PipelineLog "[$TaskId] TDD cycle=$cycle GREEN retry=$retry"
                $testOutputText = $testOutput -join "`n"
                Invoke-Claude `
                    -SystemPromptFile $CodeWriterFile `
                    -AddDir $WorktreePath `
                    -Prompt "$TaskContext`nTests are still failing after your implementation. Test output:`n$testOutputText`nFix the implementation." |
                    Out-Null

                Push-Location $WorktreePath
                $testOutput = & ([scriptblock]::Create($Config.VerifyTest)) 2>&1
                $retryPassed = $LASTEXITCODE -eq 0
                Pop-Location

                if ($retryPassed) { $greenFixed = $true; break }
            }

            if (-not $greenFixed) {
                Write-Host "    [$TaskId] GREEN failed after $($Config.MaxGreenRetries) retries — stopping TDD loop." -ForegroundColor Red
                Write-PipelineLog "[$TaskId] TDD cycle=$cycle GREEN FAILED after $($Config.MaxGreenRetries) retries"
                return @{ Cycles = $cycle; Status = 'FAILED'; Reason = 'green_failed' }
            }
        }

        Write-Host "    [$TaskId] GREEN passed." -ForegroundColor Green
        Write-PipelineLog "[$TaskId] TDD cycle=$cycle GREEN passed"
    }

    Write-Host "  [$TaskId] TDD loop hit max cycles ($MaxCycles)." -ForegroundColor Yellow
    Write-PipelineLog "[$TaskId] TDD hit max cycles ($MaxCycles)"
    return @{ Cycles = $MaxCycles; Status = 'MAX_CYCLES' }
}
