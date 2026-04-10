$DebateSchema = @'
{"type":"object","properties":{"result":{"type":"string","enum":["CONSENSUS_REACHED","PARTIAL_CONSENSUS"]},"rounds":{"type":"integer"},"experts":{"type":"array","items":{"type":"string"}},"recommendation":{"type":"string"},"objections":{"type":"array","items":{"type":"string"}},"sessionFile":{"type":"string"}},"required":["result","rounds","experts","recommendation","objections","sessionFile"]}
'@

function Invoke-DebateLoop {
    param(
        [Parameter(Mandatory)]
        [string]$DebateModFile,

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
        Write-PipelineLog "$StageName debate round $round..." -Color Yellow

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
            Write-PipelineLog "$StageName round=$round ERROR: invalid JSON from debate moderator: $_" -Color Yellow
            continue
        }

        Write-PipelineLog "$StageName round=$round result=$($debate.result) experts=$($debate.experts -join ',') objections=$($debate.objections.Count)"

        if ($debate.result -eq 'CONSENSUS_REACHED') {
            Write-PipelineLog "$StageName consensus reached." -Color Green
            Write-PipelineLog "Recommendation: $($debate.recommendation)" -Color Green

            # Apply the consensus recommendation as a final revision
            if ($debate.recommendation) {
                Write-PipelineLog "Applying consensus recommendation to $ArtifactFile ..." -Color Cyan
                $revisionPrompt = & $BuildRevisionPrompt $currentTopic $debate.recommendation
                Invoke-Claude -SystemPromptFile $WriterFile -Prompt $revisionPrompt | Out-Null
                if ($PostRevision) {
                    Write-PipelineLog "Running post-revision check..." -Color Yellow
                    & $PostRevision
                }
                Write-PipelineLog "Revision complete." -Color Green
            }
            else {
                Write-PipelineLog "No recommendation to apply." -Color Yellow
            }

            return $debate
        }

        if ($round -ge $MaxRounds) {
            Write-PipelineLog "$StageName partial consensus after $MaxRounds rounds." -Color Yellow
            Write-PipelineLog "Unresolved: $($debate.objections -join '; ')" -Color Yellow
            return $debate
        }

        $objectionList = $debate.objections -join "`n- "
        Write-PipelineLog "Revising ($($debate.objections.Count) objections)..." -Color Yellow

        $revisionPrompt = & $BuildRevisionPrompt $currentTopic $objectionList
        Invoke-Claude -SystemPromptFile $WriterFile -Prompt $revisionPrompt | Out-Null
        if ($PostRevision) {
            Write-PipelineLog "Running post-revision check..." -Color Yellow
            & $PostRevision
        }
    }
}
