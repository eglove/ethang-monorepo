function Test-BusFeatureEnabled {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingPositionalParameters', '')]
    param(
        [Parameter(Mandatory)]
        [string]$StageName
    )
    # AllStages env var enables all stages at once
    if ($env:VIBE_BUS_ALL_STAGES -eq '1') { return $true }
    # Per-stage env var: VIBE_BUS_STAGE2, VIBE_BUS_STAGE3, etc.
    $envVar = "VIBE_BUS_$($StageName.ToUpper())"
    return [System.Environment]::GetEnvironmentVariable($envVar) -eq '1'
}
