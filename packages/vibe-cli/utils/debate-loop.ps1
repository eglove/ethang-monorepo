function Invoke-DebateLoop {
    param(
        [Parameter(Mandatory)]
        [string]$DebateModFile,

        [Parameter(Mandatory)]
        [string]$DebateSchema,

        [Parameter(Mandatory)]
        [string]$WriterFile,

        [Parameter(Mandatory)]
        [string]$DebateContext,

        [Parameter(Mandatory)]
        [string]$SessionFile,

        [Parameter(Mandatory)]
        [string]$ArtifactFile,

        [Parameter(Mandatory)]
        [string]$BriefingFile,

        [Parameter(Mandatory)]
        [scriptblock]$BuildRevisionPrompt,

        [string]$ReferenceFile,

        [scriptblock]$PostRevision,

        [int]$MaxRounds = $Config.MaxDebateRounds,

        [string]$StageName = "Debate"
    )

    $briefing = Get-Content $BriefingFile -Raw
    $reference = if ($ReferenceFile) { Get-Content $ReferenceFile -Raw } else { $null }

    for ($round = 1; $round -le $MaxRounds; $round++) {
        Write-Host "Debate round $round..." -ForegroundColor Yellow

        $currentTopic = Get-Content $ArtifactFile -Raw

        $prompt = "Elicitor briefing:`n$briefing`n`n"
        if ($reference) { $prompt += "Reference document (prior stage output):`n$reference`n`n" }
        $prompt += "Artifact under review:`n$currentTopic`n`nContext: $DebateContext`nSave session to $SessionFile"

        try {
            $debate = Invoke-Claude `
                -SystemPromptFile $DebateModFile `
                -JsonSchema $DebateSchema `
                -Prompt $prompt |
                ConvertFrom-Json
        }
        catch {
            Write-PipelineLog "$StageName round=$round ERROR: invalid JSON from debate moderator: $_"
            Write-Host "Debate moderator returned invalid JSON (round $round). Retrying..." -ForegroundColor Yellow
            continue
        }

        Write-PipelineLog "$StageName round=$round result=$($debate.result) experts=$($debate.experts -join ',') objections=$($debate.objections.Count)"
        Write-Host "Result: $($debate.result) | Rounds: $($debate.rounds) | Experts: $($debate.experts -join ', ')" -ForegroundColor Gray

        if ($debate.result -eq 'CONSENSUS_REACHED') {
            Write-Host "$StageName consensus reached." -ForegroundColor Green
            Write-Host "Recommendation: $($debate.recommendation)" -ForegroundColor Green

            # Apply the consensus recommendation as a final revision
            if ($debate.recommendation) {
                Write-Host "Applying consensus recommendation to $ArtifactFile ..." -ForegroundColor Cyan
                $revisionPrompt = & $BuildRevisionPrompt $currentTopic $debate.recommendation
                Invoke-Claude -SystemPromptFile $WriterFile -Prompt $revisionPrompt | Out-Null
                if ($PostRevision) { & $PostRevision }
                Write-Host "Revision complete." -ForegroundColor Green
            }
            else {
                Write-Host "No recommendation to apply." -ForegroundColor Yellow
            }

            return $debate
        }

        if ($round -ge $MaxRounds) {
            Write-Host "$StageName partial consensus after $MaxRounds rounds." -ForegroundColor Yellow
            Write-Host "Unresolved: $($debate.objections -join '; ')" -ForegroundColor Yellow
            return $debate
        }

        $objectionList = $debate.objections -join "`n- "
        Write-Host "Revising ($($debate.objections.Count) objections)..." -ForegroundColor Yellow

        $revisionPrompt = & $BuildRevisionPrompt $currentTopic $objectionList
        Invoke-Claude -SystemPromptFile $WriterFile -Prompt $revisionPrompt | Out-Null
        if ($PostRevision) { & $PostRevision }
    }
}
