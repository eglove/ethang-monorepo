function Resume-Pipeline {
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$LogPath
    )

    if (-not (Test-Path $LogPath)) {
        throw "Pipeline log not found: $LogPath"
    }

    $content = Get-Content $LogPath -Raw
    if ([string]::IsNullOrWhiteSpace($content)) {
        throw "Pipeline log is empty: $LogPath"
    }

    # Use the shared pattern from pipeline-log.ps1
    $pattern = if ($StageCompletePattern) { $StageCompletePattern } else { 'STAGE_COMPLETE:(\d+):(.+)' }
    $matches_ = [regex]::Matches($content, $pattern)

    if ($matches_.Count -eq 0) {
        throw "No STAGE_COMPLETE markers found in pipeline log"
    }

    # Check for incompatible old 8-stage format
    foreach ($m in $matches_) {
        $stageNum = [int]$m.Groups[1].Value
        if ($stageNum -gt 7) {
            throw "Incompatible old 8-stage pipeline format detected (stage $stageNum > 7). Cannot resume."
        }
    }

    # Single pass: find most recent feature and build per-feature highest stage
    $lastFeature = $null
    $featureStages = @{}

    foreach ($m in $matches_) {
        $stageNum = [int]$m.Groups[1].Value
        $featureName = $m.Groups[2].Value.Trim()
        $lastFeature = $featureName
        if (-not $featureStages.ContainsKey($featureName) -or $stageNum -gt $featureStages[$featureName]) {
            $featureStages[$featureName] = $stageNum
        }
    }

    $lastStage = $featureStages[$lastFeature]

    # Guard: if all 7 stages are complete, signal completion
    if ($lastStage -ge 7) {
        return @{
            Feature     = $lastFeature
            LastStage   = $lastStage
            ResumeStage = $lastStage + 1
            Completed   = $true
        }
    }

    return @{
        Feature     = $lastFeature
        LastStage   = $lastStage
        ResumeStage = $lastStage + 1
        Completed   = $false
    }
}
