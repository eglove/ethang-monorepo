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

    $briefingPath = (Resolve-Path $BriefingFile).Path
    $referencePath = if ($ReferenceFile) { (Resolve-Path $ReferenceFile).Path } else { $null }
    $artifactPath = (Resolve-Path $ArtifactFile).Path

    for ($round = 1; $round -le $MaxRounds; $round++) {
        Write-PipelineLog "$StageName debate round $round..." -Color Yellow

        $prompt = "Read the elicitor briefing from: $briefingPath`n`n"
        if ($referencePath) { $prompt += "Read the reference document (prior stage output) from: $referencePath`n`n" }
        $prompt += "Read the artifact under review from: $artifactPath`n`nContext: $DebateContext`nSave session to $SessionFile"

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
                $revisionPrompt = & $BuildRevisionPrompt $artifactPath $debate.recommendation
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

        $revisionPrompt = & $BuildRevisionPrompt $artifactPath $objectionList
        Invoke-Claude -SystemPromptFile $WriterFile -Prompt $revisionPrompt | Out-Null
        if ($PostRevision) {
            Write-PipelineLog "Running post-revision check..." -Color Yellow
            & $PostRevision
        }
    }
}
