function Invoke-CleanupLoop {
    param(
        [Parameter(Mandatory)]
        [string]$WorktreePath,

        [string]$TaskId = "??"
    )

    $requiredPasses = $Config.CleanupPasses

    for ($pass = 1; $pass -le $requiredPasses; $pass++) {
        Write-Host "  [$TaskId] Cleanup pass $pass/$requiredPasses" -ForegroundColor Cyan

        Push-Location $WorktreePath

        # Lint
        Write-Host "    [$TaskId] lint..." -ForegroundColor Gray
        $lintOutput = & ([scriptblock]::Create($Config.VerifyLint)) 2>&1
        $lintPassed = $LASTEXITCODE -eq 0

        if (-not $lintPassed) {
            Pop-Location
            Write-Host "    [$TaskId] lint FAILED (pass $pass)" -ForegroundColor Red
            Write-PipelineLog "[$TaskId] Cleanup lint FAILED pass=$pass"
            return @{ Passed = $false; Pass = $pass; FailedAt = 'lint'; Output = ($lintOutput -join "`n") }
        }

        # Test
        Write-Host "    [$TaskId] test..." -ForegroundColor Gray
        $testOutput = & ([scriptblock]::Create($Config.VerifyTest)) 2>&1
        $testPassed = $LASTEXITCODE -eq 0

        if (-not $testPassed) {
            Pop-Location
            Write-Host "    [$TaskId] test FAILED (pass $pass)" -ForegroundColor Red
            Write-PipelineLog "[$TaskId] Cleanup test FAILED pass=$pass"
            return @{ Passed = $false; Pass = $pass; FailedAt = 'test'; Output = ($testOutput -join "`n") }
        }

        # Type check
        Write-Host "    [$TaskId] tsc..." -ForegroundColor Gray
        $tscOutput = & ([scriptblock]::Create($Config.VerifyTsc)) 2>&1
        $tscPassed = $LASTEXITCODE -eq 0

        Pop-Location

        if (-not $tscPassed) {
            Write-Host "    [$TaskId] tsc FAILED (pass $pass)" -ForegroundColor Red
            Write-PipelineLog "[$TaskId] Cleanup tsc FAILED pass=$pass"
            return @{ Passed = $false; Pass = $pass; FailedAt = 'tsc'; Output = ($tscOutput -join "`n") }
        }

        Write-Host "    [$TaskId] pass $pass clean." -ForegroundColor Green
    }

    Write-Host "  [$TaskId] Cleanup: $requiredPasses/$requiredPasses passes clean." -ForegroundColor Green
    Write-PipelineLog "[$TaskId] Cleanup passed ($requiredPasses consecutive)"
    return @{ Passed = $true }
}
