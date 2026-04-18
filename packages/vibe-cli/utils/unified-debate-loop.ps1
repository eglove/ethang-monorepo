$UnifiedDebateSchema = @'
{"type":"object","properties":{"result":{"type":"string","enum":["CONSENSUS_REACHED","PARTIAL_CONSENSUS"]},"objections":{"type":"array","items":{"type":"object","properties":{"target":{"type":"string","enum":["bdd","tla"]},"objection":{"type":"string"}},"required":["target","objection"]}},"experts":{"type":"array","items":{"type":"string"}},"recommendation":{"type":"object","properties":{"bdd":{"type":"string"},"tla":{"type":"string"}},"required":["bdd","tla"]},"sessionFile":{"type":"string"}},"required":["result","objections","experts","recommendation","sessionFile"]}
'@

function Invoke-UnifiedDebateLoop {
    param(
        [Parameter(Mandatory)][string]$GherkinFile,
        [Parameter(Mandatory)][string]$TlaDir,
        [Parameter(Mandatory)][string]$FeatureDir,
        [Parameter(Mandatory)][string]$Root,
        [int]$MaxRounds = 10
    )

    $absFeatureDir = (Resolve-Path $FeatureDir).Path
    $absGherkin = (Resolve-Path $GherkinFile).Path
    $absTlaDir = (Resolve-Path $TlaDir).Path
    $tlaFile = Get-ChildItem "$absTlaDir/*.tla" | Select-Object -First 1
    $sessionFile = Join-Path $absFeatureDir 'unified-debate.md'
    $debateModFile = "$Root/agents/unified-debate-moderator.md"
    $bddWriterFile = "$Root/agents/doc-writers/bdd-writer.md"
    $tlaWriterFile = "$Root/agents/doc-writers/tla-writer.md"

    $_featureName = Split-Path $FeatureDir -Leaf
    $debateHistory = [System.Collections.ArrayList]::new()
    $consecutiveFailures = 0
    $maxConsecutiveFailures = 3

    for ($round = 1; $round -le $MaxRounds; $round++) {
        Write-PipelineLog -Message "Unified debate round $round..." -Root $Root

        $prompt = "Read all artifacts in the feature directory: $absFeatureDir`n`n"
        $prompt += "Read the BDD scenarios from: $absGherkin`n`n"
        $prompt += "Read the TLA+ specification from: $($tlaFile.FullName)`n`n"
        $prompt += "Context: Review both documents together for consistency, completeness, and correctness.`n"
        $prompt += "Save session to $sessionFile"

        try {
            $debate = Invoke-Claude `
                -Role moderator `
                -SystemPromptFile $debateModFile `
                -JsonSchema $UnifiedDebateSchema `
                -Prompt $prompt |
                ConvertFrom-Json
            $consecutiveFailures = 0
        }
        catch {
            $consecutiveFailures++
            Write-PipelineLog -Message "Unified debate round=$round ERROR: invalid JSON from moderator: $_" -Root $Root
            if ($consecutiveFailures -ge $maxConsecutiveFailures) {
                Write-PipelineLog -Message "Unified debate: $maxConsecutiveFailures consecutive failures, aborting" -Root $Root
                _writeSessionFile -Path $sessionFile -History $debateHistory
                return @{
                    Result               = 'ALL_ROUNDS_FAILED'
                    RoundsCompleted      = $round
                    FinalGherkinPath     = $absGherkin
                    FinalTlaDir          = $absTlaDir
                    SessionFile          = $sessionFile
                    UnresolvedObjections = @()
                    Error                = "All $maxConsecutiveFailures consecutive rounds produced invalid moderator responses"
                }
            }
            continue
        }

        [void]$debateHistory.Add(@{
            Round      = $round
            Result     = $debate.result
            Objections = $debate.objections
            Experts    = $debate.experts
        })

        Write-PipelineLog -Message "Unified debate round=$round result=$($debate.result) objections=$($debate.objections.Count)" -Root $Root

        $_dbStatus = if ($debate.result -eq 'CONSENSUS_REACHED') { 'reached' } elseif ($round -ge $MaxRounds) { 'failed' } else { 'pending' }
        try { Update-DebateState -FeatureName $_featureName -Stage 3 -Round $round -ConsensusStatus $_dbStatus -MaxDebateRound $MaxRounds } catch { }

        # ── CONSENSUS_REACHED: dispatch per-writer final recommendations ──
        if ($debate.result -eq 'CONSENSUS_REACHED') {
            Write-PipelineLog -Message "Unified debate: consensus reached at round $round" -Root $Root

            $consensusJobs = @{
                bdd = @{
                    Script = {
                        $r = $args[0]; $gf = $args[1]; $rec = $args[2]; $fd = $args[3]
                        . "$r/utils/pipeline-log.ps1"
                        . "$r/utils/invoke-claude.ps1"
                        $prompt = "Read all artifacts in: $fd`nRead current scenarios from: $gf`nConsensus recommendation: $rec`nApply the recommendation. Save to $gf"
                        Invoke-Claude -Role 'doc-writer' -SystemPromptFile "$r/agents/doc-writers/bdd-writer.md" -Prompt $prompt | Out-Null
                    }
                    Args = @($Root, $absGherkin, $debate.recommendation.bdd, $absFeatureDir)
                }
                tla = @{
                    Script = {
                        $r = $args[0]; $td = $args[1]; $rec = $args[2]; $fd = $args[3]
                        . "$r/utils/pipeline-log.ps1"
                        . "$r/utils/invoke-claude.ps1"
                        $prompt = "Read all artifacts in: $fd`nRead current spec from: $td`nConsensus recommendation: $rec`nApply the recommendation. Save all files to $td"
                        Invoke-Claude -Role 'doc-writer' -SystemPromptFile "$r/agents/doc-writers/tla-writer.md" -Prompt $prompt | Out-Null
                    }
                    Args = @($Root, $absTlaDir, $debate.recommendation.tla, $absFeatureDir)
                }
            }

            $revResults = Invoke-Parallel -Jobs $consensusJobs
            $revFailures = @()
            if (-not $revResults['bdd'].Success) { $revFailures += "bdd: $($revResults['bdd'].Error)" }
            if (-not $revResults['tla'].Success) { $revFailures += "tla: $($revResults['tla'].Error)" }

            # Write session file on all exit paths
            _writeSessionFile -Path $sessionFile -History $debateHistory

            if ($revFailures.Count -gt 0) {
                $errMsg = "Consensus revision failed: $($revFailures -join '; ')"
                Write-PipelineLog -Message $errMsg -Root $Root
                return @{
                    Result               = 'CONSENSUS_REVISION_FAILED'
                    RoundsCompleted      = $round
                    FinalGherkinPath     = $absGherkin
                    FinalTlaDir          = $absTlaDir
                    SessionFile          = $sessionFile
                    UnresolvedObjections = @()
                    Error                = $errMsg
                }
            }

            return @{
                Result               = 'CONSENSUS_REACHED'
                RoundsCompleted      = $round
                FinalGherkinPath     = $absGherkin
                FinalTlaDir          = $absTlaDir
                SessionFile          = $sessionFile
                UnresolvedObjections = @()
            }
        }

        # ── MAX ROUNDS: exit with current versions ──
        if ($round -ge $MaxRounds) {
            Write-PipelineLog -Message "Unified debate: max rounds ($MaxRounds) reached" -Root $Root
            $unresolved = @($debate.objections | ForEach-Object { "$($_.target): $($_.objection)" })
            _writeSessionFile -Path $sessionFile -History $debateHistory
            return @{
                Result               = 'MAX_ROUNDS_REACHED'
                RoundsCompleted      = $round
                FinalGherkinPath     = $absGherkin
                FinalTlaDir          = $absTlaDir
                SessionFile          = $sessionFile
                UnresolvedObjections = $unresolved
            }
        }

        # ── PARTIAL_CONSENSUS: route objections to targeted writers ──
        $bddObjections = @($debate.objections | Where-Object { $_.target -eq 'bdd' })
        $tlaObjections = @($debate.objections | Where-Object { $_.target -eq 'tla' })

        $revisionJobs = @{}

        if ($bddObjections.Count -gt 0) {
            $objList = ($bddObjections | ForEach-Object { $_.objection }) -join "`n- "
            $revisionJobs['bdd'] = @{
                Script = {
                    $r = $args[0]; $gf = $args[1]; $objs = $args[2]; $fd = $args[3]
                    . "$r/utils/pipeline-log.ps1"
                    . "$r/utils/invoke-claude.ps1"
                    $prompt = "Read all artifacts in: $fd`nRead current scenarios from: $gf`nDebate objections:`n- $objs`nRevise the scenarios. Save to $gf"
                    Invoke-Claude -Role 'doc-writer' -SystemPromptFile "$r/agents/doc-writers/bdd-writer.md" -Prompt $prompt | Out-Null
                }
                Args = @($Root, $absGherkin, $objList, $absFeatureDir)
            }
        }

        if ($tlaObjections.Count -gt 0) {
            $objList = ($tlaObjections | ForEach-Object { $_.objection }) -join "`n- "
            $revisionJobs['tla'] = @{
                Script = {
                    $r = $args[0]; $td = $args[1]; $objs = $args[2]; $fd = $args[3]
                    . "$r/utils/pipeline-log.ps1"
                    . "$r/utils/invoke-claude.ps1"
                    . "$r/utils/tlc-runner.ps1"
                    $tlaFile = Get-ChildItem "$td/*.tla" | Select-Object -First 1
                    $prompt = "Read all artifacts in: $fd`nRead current spec from: $($tlaFile.FullName)`nDebate objections:`n- $objs`nRevise the specification. Save all files to $td"
                    Invoke-Claude -Role 'doc-writer' -SystemPromptFile "$r/agents/doc-writers/tla-writer.md" -Prompt $prompt | Out-Null
                    Invoke-TlcCheck -TlaDir $td -TlaWriterFile "$r/agents/doc-writers/tla-writer.md" -FixContext "Debate revision"
                }
                Args = @($Root, $absTlaDir, $objList, $absFeatureDir)
            }
        }

        if ($revisionJobs.Count -gt 0) {
            Write-PipelineLog -Message "Dispatching revisions to: $($revisionJobs.Keys -join ', ')" -Root $Root
            $revResults = Invoke-Parallel -Jobs $revisionJobs

            $revFailures = @()
            foreach ($key in $revResults.Keys) {
                if (-not $revResults[$key].Success) {
                    $revFailures += "${key}: $($revResults[$key].Error)"
                }
            }

            if ($revFailures.Count -gt 0) {
                $errMsg = "Revision failed: $($revFailures -join '; ')"
                Write-PipelineLog -Message $errMsg -Root $Root
                _writeSessionFile -Path $sessionFile -History $debateHistory
                return @{
                    Result               = 'REVISION_FAILED'
                    RoundsCompleted      = $round
                    FinalGherkinPath     = $absGherkin
                    FinalTlaDir          = $absTlaDir
                    SessionFile          = $sessionFile
                    UnresolvedObjections = @()
                    Error                = $errMsg
                }
            }
        }
    }

    # Fallback: loop exhausted without explicit return (all rounds hit continue)
    _writeSessionFile -Path $sessionFile -History $debateHistory
    return @{
        Result               = 'ALL_ROUNDS_FAILED'
        RoundsCompleted      = $MaxRounds
        FinalGherkinPath     = $absGherkin
        FinalTlaDir          = $absTlaDir
        SessionFile          = $sessionFile
        UnresolvedObjections = @()
        Error                = "All $MaxRounds rounds produced invalid moderator responses"
    }
}

function _writeSessionFile {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][AllowEmptyCollection()][System.Collections.ArrayList]$History
    )

    $sb = [System.Text.StringBuilder]::new()
    [void]$sb.AppendLine("# Unified Debate Session")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("**Date:** $(Get-Date -Format 'yyyy-MM-dd')")
    [void]$sb.AppendLine("**Rounds:** $($History.Count)")
    [void]$sb.AppendLine("**Result:** $($History[-1].Result)")
    [void]$sb.AppendLine("")

    foreach ($entry in $History) {
        [void]$sb.AppendLine("## Round $($entry.Round)")
        [void]$sb.AppendLine("")
        [void]$sb.AppendLine("**Result:** $($entry.Result)")
        [void]$sb.AppendLine("**Experts:** $($entry.Experts -join ', ')")
        if ($entry.Objections -and $entry.Objections.Count -gt 0) {
            [void]$sb.AppendLine("")
            [void]$sb.AppendLine("### Objections")
            foreach ($obj in $entry.Objections) {
                [void]$sb.AppendLine("- [$($obj.target)] $($obj.objection)")
            }
        }
        [void]$sb.AppendLine("")
    }

    Set-Content -Path $Path -Value $sb.ToString() -Encoding UTF8
}
