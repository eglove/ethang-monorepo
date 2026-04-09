. "$PSScriptRoot/tdd-loop.ps1"
. "$PSScriptRoot/cleanup-loop.ps1"
. "$PSScriptRoot/review-runner.ps1"

function Invoke-TaskRunner {
    param(
        [Parameter(Mandatory)]
        [object]$Task,

        [Parameter(Mandatory)]
        [string]$ImplPlanMarkdown,

        [Parameter(Mandatory)]
        [string]$WorktreePath,

        [Parameter(Mandatory)]
        [string]$AgentsDir,

        [int]$MaxFixRounds = $Config.MaxFixRounds
    )

    $codeWriterFile = "$AgentsDir/code-writers/$($Task.codeWriter).md"
    $testWriterFile = "$AgentsDir/test-writers/$($Task.testWriter).md"

    $taskJson = $Task | ConvertTo-Json -Depth 5 -Compress

    $taskContext = @"
Your task (JSON):
$taskJson

Full implementation plan for context:
$ImplPlanMarkdown

Work in directory: $WorktreePath
"@

    for ($fixRound = 1; $fixRound -le $MaxFixRounds; $fixRound++) {
        Write-Host "[$($Task.id)] Fix round $fixRound/$MaxFixRounds" -ForegroundColor Magenta
        Write-PipelineLog "[$($Task.id)] Fix round $fixRound/$MaxFixRounds"

        $tddResult = Invoke-TddLoop `
            -TestWriterFile $testWriterFile `
            -CodeWriterFile $codeWriterFile `
            -TaskContext $taskContext `
            -WorktreePath $WorktreePath `
            -TaskId $Task.id

        if ($tddResult.Status -eq 'FAILED') {
            throw "[$($Task.id)] TDD loop failed: $($tddResult.Reason)"
        }

        Write-Host "[$($Task.id)] Cleanup..." -ForegroundColor Cyan
        $cleanupResult = Invoke-CleanupLoop `
            -WorktreePath $WorktreePath `
            -TaskId $Task.id

        if ($cleanupResult.Passed) {
            # Cleanup passed — run reviewers
            Write-Host "[$($Task.id)] Reviews..." -ForegroundColor Cyan
            Push-Location $WorktreePath
            git add -A 2>&1 | Out-Null
            git commit -m "feat($($Task.id)): $($Task.title)" 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Pop-Location
                throw "[$($Task.id)] git commit failed"
            }
            Pop-Location

            $userNotes = Join-Path (Split-Path $AgentsDir -Parent) "user_notes.md"
            $reviewResult = Invoke-ReviewRunner `
                -WorktreePath $WorktreePath `
                -AgentsDir $AgentsDir `
                -UserNotesPath $userNotes `
                -Context "Task $($Task.id): $($Task.title)"

            if ($reviewResult.Passed) {
                Write-Host "[$($Task.id)] Reviews passed. Done." -ForegroundColor Green
                Write-PipelineLog "[$($Task.id)] COMPLETE fixRounds=$fixRound"
                return @{ Status = 'DONE'; FixRounds = $fixRound; Reviews = $reviewResult }
            }

            # Reviews found blocking issues — feed them back through TDD
            Write-Host "[$($Task.id)] $($reviewResult.BlockingCount) blocking issues found. Fixing via TDD..." -ForegroundColor Yellow
            Write-PipelineLog "[$($Task.id)] Review FAILED blocking=$($reviewResult.BlockingCount)"
            $issueList = ($reviewResult.Issues | Where-Object { $_.severity -in 'critical', 'high' } | ForEach-Object {
                    "[$($_.severity)] $($_.file):$($_.line) — $($_.issue) (fix: $($_.recommendation))"
                }) -join "`n"
            $taskContext += "`n`nReviewer issues (must fix):`n$issueList"
            continue
        }

        # Cleanup failed — feed errors back through TDD
        Write-Host "[$($Task.id)] Cleanup failed at $($cleanupResult.FailedAt) (pass $($cleanupResult.Pass)). Fixing via TDD..." -ForegroundColor Yellow
        Write-PipelineLog "[$($Task.id)] Cleanup FAILED at=$($cleanupResult.FailedAt) pass=$($cleanupResult.Pass)"
        $taskContext += "`n`nCleanup failure ($($cleanupResult.FailedAt)):`n$($cleanupResult.Output)`nFix this issue."
    }

    throw "[$($Task.id)] Failed after $MaxFixRounds fix rounds"
}
