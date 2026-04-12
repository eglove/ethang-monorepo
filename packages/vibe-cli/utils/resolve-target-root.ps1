function Resolve-TargetRoot {
    param(
        [Parameter(Mandatory)][string]$FeatureDir,
        [Parameter(Mandatory)][string]$MonorepoRoot,
        [Parameter(Mandatory)][string]$FallbackRoot
    )

    $targetJsonPath = Join-Path $FeatureDir 'target.json'
    if (-not (Test-Path $targetJsonPath)) {
        return $FallbackRoot
    }

    $targetConfig = Get-Content $targetJsonPath -Raw | ConvertFrom-Json
    $candidatePath = Join-Path $MonorepoRoot $targetConfig.root

    if (-not (Test-Path $candidatePath)) {
        throw "Target root does not exist: $candidatePath"
    }

    $resolved = (Resolve-Path $candidatePath).Path
    $normalizedMonorepo = (Resolve-Path $MonorepoRoot).Path

    if (-not $resolved.StartsWith($normalizedMonorepo)) {
        throw "Target root must be within the monorepo: $resolved is outside $normalizedMonorepo"
    }

    return $resolved
}
