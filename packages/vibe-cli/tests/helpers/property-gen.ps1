# =============================================================================
# property-gen.ps1 — Seeded generators for property-based testing
# All generators accept [System.Random] for reproducibility.
# =============================================================================

$ErrorActionPreference = 'Stop'

function New-SeededRng {
    <#
    .SYNOPSIS
        Creates a deterministic RNG from a seed integer.
    #>
    param([Parameter(Mandatory)][int]$Seed)
    return [System.Random]::new($Seed)
}

function Get-RandomElement {
    <#
    .SYNOPSIS
        Picks one random element from a collection.
    #>
    param(
        [Parameter(Mandatory)][System.Random]$Rng,
        [Parameter(Mandatory)][array]$Collection
    )
    return $Collection[$Rng.Next(0, $Collection.Count)]
}

function New-RandomVerdictSequence {
    <#
    .SYNOPSIS
        Generates an array of random verdict strings (pass, fail, retry).
    #>
    param(
        [Parameter(Mandatory)][System.Random]$Rng,
        [int]$Length = 30
    )
    $choices = @('pass', 'fail', 'retry')
    $seq = [string[]]::new($Length)
    for ($i = 0; $i -lt $Length; $i++) {
        $seq[$i] = $choices[$Rng.Next(0, 3)]
    }
    return $seq
}

function New-RandomEscalationSequence {
    <#
    .SYNOPSIS
        Generates weighted KeepGoing/Stop decisions.
        Default: 70% KeepGoing, 30% Stop.
    #>
    param(
        [Parameter(Mandatory)][System.Random]$Rng,
        [int]$Length = 20,
        [double]$KeepGoingWeight = 0.7
    )
    $seq = [string[]]::new($Length)
    for ($i = 0; $i -lt $Length; $i++) {
        $seq[$i] = if ($Rng.NextDouble() -lt $KeepGoingWeight) { 'KeepGoing' } else { 'Stop' }
    }
    return $seq
}

function New-RandomPipelineConfig {
    <#
    .SYNOPSIS
        Generates a valid pipeline config with randomized review gate bounds.
        Uses env-var override pattern from Get-PipelineConfig, cleans up in finally.
    .PARAMETER Overrides
        Explicit overrides applied after randomization (for pinning specific values).
    #>
    param(
        [Parameter(Mandatory)][System.Random]$Rng,
        [hashtable]$Overrides = @{}
    )

    $randomValues = @{
        VIBE_NUM_TASKS                 = $Rng.Next(1, 4).ToString()    # 1..3
    }

    # Apply explicit overrides (convert to string for env vars)
    foreach ($key in $Overrides.Keys) {
        switch ($key) {
            'NumTasks'              { $randomValues['VIBE_NUM_TASKS'] = $Overrides[$key].ToString() }
        }
    }

    # Save original env vars
    $saved = @{}
    foreach ($key in $randomValues.Keys) {
        $saved[$key] = [System.Environment]::GetEnvironmentVariable($key)
    }

    try {
        # Set randomized env vars
        foreach ($key in $randomValues.Keys) {
            [System.Environment]::SetEnvironmentVariable($key, $randomValues[$key])
        }
        return Get-PipelineConfig
    }
    finally {
        # Restore original env vars
        foreach ($key in $saved.Keys) {
            [System.Environment]::SetEnvironmentVariable($key, $saved[$key])
        }
    }
}

function New-RandomActionSequence {
    <#
    .SYNOPSIS
        Generates a random sequence of action names from a pool.
        Guard violations are handled at execution time (skipped).
    #>
    param(
        [Parameter(Mandatory)][System.Random]$Rng,
        [Parameter(Mandatory)][string[]]$ActionPool,
        [int]$MaxLength = 100
    )
    $seq = [string[]]::new($MaxLength)
    for ($i = 0; $i -lt $MaxLength; $i++) {
        $seq[$i] = $ActionPool[$Rng.Next(0, $ActionPool.Count)]
    }
    return $seq
}

