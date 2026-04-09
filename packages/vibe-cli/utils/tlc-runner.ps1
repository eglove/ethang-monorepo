$TlaToolsJar = "C:\Users\glove\projects\tla-toolbox\tla2tools.jar"

function Invoke-TlcCheck {
    param(
        [Parameter(Mandatory)]
        [string]$TlaDir,

        [Parameter(Mandatory)]
        [string]$TlaWriterFile,

        [string]$FixContext,

        [int]$MaxAttempts = $Config.MaxTlcAttempts
    )

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        $tlaFile = Get-ChildItem "$TlaDir/*.tla" -ErrorAction SilentlyContinue | Select-Object -First 1
        $cfgFile = Get-ChildItem "$TlaDir/*.cfg" -ErrorAction SilentlyContinue | Select-Object -First 1

        if (-not $tlaFile) { throw "No .tla file found in $TlaDir" }
        if (-not $cfgFile) { throw "No .cfg file found in $TlaDir" }

        Write-Host "  TLC check (attempt $attempt/$MaxAttempts)..." -ForegroundColor Yellow
        $tlcLines = @()
        Push-Location $TlaDir
        java -XX:+UseParallelGC -jar $TlaToolsJar -config $cfgFile.Name -workers auto $tlaFile.Name 2>&1 | ForEach-Object {
            $tlcLines += "$_"
            Write-Host "    $_" -ForegroundColor DarkGray
        }
        $tlcExitCode = $LASTEXITCODE
        Pop-Location

        $tlcText = $tlcLines -join "`n"

        if ($tlcExitCode -eq 0 -and $tlcText -notmatch 'Error:|violated|TLC threw') {
            Write-PipelineLog "TLC passed attempt=$attempt"
            Write-Host "  TLC passed." -ForegroundColor Green
            return
        }

        Write-PipelineLog "TLC failed attempt=$attempt exitCode=$tlcExitCode"

        if ($attempt -ge $MaxAttempts) {
            Write-PipelineLog "ERROR: TLC verification failed after $MaxAttempts attempts"
            Write-Host "  TLC still failing after $MaxAttempts attempts." -ForegroundColor Red
            throw "TLA+ specification failed TLC verification after $MaxAttempts attempts"
        }

        Write-Host "  TLC failed — sending errors back to writer..." -ForegroundColor Yellow
        $fixPrompt = "The TLA+ specification in $TlaDir failed TLC verification.`n`nTLC output:`n$tlcText"
        if ($FixContext) { $fixPrompt += "`n`n$FixContext" }
        $fixPrompt += "`n`nFix the specification and config. Save all files to: $TlaDir"

        Invoke-Claude -SystemPromptFile $TlaWriterFile -Prompt $fixPrompt | Out-Null
    }
}
