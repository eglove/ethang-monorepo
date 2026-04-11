. "$PSScriptRoot/invoke-claude.ps1"

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$global:PipelineLogFile = "$PSScriptRoot/../pipeline.log"

function Write-PipelineLog {
    param(
        [Parameter(ValueFromPipeline)]
        [string]$Message,

        [string]$Color = 'Gray'
    )
    process {
        $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $line = "[$ts] $Message"
        $line | Add-Content -Path $global:PipelineLogFile
        Write-Host $line -ForegroundColor $Color
    }
}

$Config = @{
    # Debate
    MaxDebateRounds       = 10   # PowerShell debate loop cap (matches moderator internal cap)

    # TDD
    MaxTddCycles          = 10    # RED/GREEN cycles per TDD loop

    # Cleanup
    CleanupPasses         = 2     # lint + test + tsc must pass this many times consecutively

    # Task runner
    MaxFixRounds          = 100   # TDD → cleanup → review retry loop cap (high for strict ESLint/TS)

    # TLC verification
    MaxTlcAttempts        = 100   # TLA+ writer → TLC verify loop cap

    # Elicitor
    MaxElicitorTurns      = 50    # Hard turn cap for the interview

    # Verify commands — override per project (e.g. Pester instead of pnpm)
    VerifyTest            = 'pnpm test'
    VerifyLint            = 'pnpm lint'
    VerifyTsc             = 'pnpm tsc'

    # ── Stage 8: Coding Stage ──

    # RED phase retry cap (tests-pass-unexpectedly → test writer revises)
    MaxRedRetries         = 3

    # Merge conflict resolution retry cap (shared with post-merge verify failures)
    MaxMergeRetries       = 3

    # Per-invocation thread job timeout (seconds) — default fallback
    JobTimeoutSeconds     = 600

    # Per-writer-type timeout overrides (seconds)
    TaskTimeouts          = @{
        'powershell-writer' = 600
        'typescript-writer' = 900
        'hono-writer'       = 900
        'ui-writer'         = 900
        'agent-writer'      = 300
        'merge-resolver'    = 600
    }

    # Maximum cumulative wall-clock time per task across all retries (seconds)
    TaskMaxWallClockSeconds = 3600

    # Maximum total pipeline execution time (seconds) — 4 hours
    PipelineTimeoutSeconds  = 14400

    # Allowlist regex for verify commands — rejects shell metacharacters
    VerifyCommandAllowlistPattern = '^[a-zA-Z0-9_./ -]+(\s+[a-zA-Z0-9_./ -]+)*$'

    # ── Review Gate Constants (T1) ──

    # Max review rounds before escalation (0 = immediate escalation)
    MaxReviewRounds            = 3

    # Max Keep Going resets per gate (0 = disables Keep Going per S11 invariant)
    MaxKeepGoingResets         = 3

    # Max TDD Keep Going iterations per gate
    MaxTddKeepGoingPerGate     = 5

    # Review gate timeout in seconds (30 minutes)
    ReviewGateTimeoutSeconds   = 1800

    # Per-reviewer invocation timeout (seconds) — must be <= ReviewGateTimeoutSeconds
    ReviewerTimeoutSeconds     = 600

    # Moderator (verdict aggregator) timeout (seconds)
    ReviewModeratorTimeoutSeconds = 300

    # Number of tasks — derived from tier task list length, must be >= 1
    NumTasks                   = 1
}

function Get-PipelineConfig {
    <#
    .SYNOPSIS
        Returns an immutable snapshot of the pipeline config with env var overrides applied.
    .DESCRIPTION
        Reads review gate constants from $Config defaults, applies any VIBE_* environment
        variable overrides, validates NumTasks >= 1, and returns a read-only dictionary.
    #>

    # Start with a mutable copy of all current config values
    $snapshot = @{}
    foreach ($key in $Config.Keys) {
        $snapshot[$key] = $Config[$key]
    }

    # Apply environment variable overrides for review gate constants
    if ($env:VIBE_MAX_REVIEW_ROUNDS) {
        $snapshot.MaxReviewRounds = [int]$env:VIBE_MAX_REVIEW_ROUNDS
    }
    # Handle '0' explicitly since '0' is falsy in PowerShell
    elseif ($null -ne $env:VIBE_MAX_REVIEW_ROUNDS -and $env:VIBE_MAX_REVIEW_ROUNDS -eq '0') {
        $snapshot.MaxReviewRounds = 0
    }

    if ($env:VIBE_MAX_KEEP_GOING_RESETS) {
        $snapshot.MaxKeepGoingResets = [int]$env:VIBE_MAX_KEEP_GOING_RESETS
    }
    elseif ($null -ne $env:VIBE_MAX_KEEP_GOING_RESETS -and $env:VIBE_MAX_KEEP_GOING_RESETS -eq '0') {
        $snapshot.MaxKeepGoingResets = 0
    }

    if ($env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE) {
        $snapshot.MaxTddKeepGoingPerGate = [int]$env:VIBE_MAX_TDD_KEEP_GOING_PER_GATE
    }

    if ($env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS) {
        $snapshot.ReviewGateTimeoutSeconds = [int]$env:VIBE_REVIEW_GATE_TIMEOUT_SECONDS
    }

    $reviewerTimeoutExplicit = $false
    if ($env:VIBE_REVIEWER_TIMEOUT_SECONDS) {
        $snapshot.ReviewerTimeoutSeconds = [int]$env:VIBE_REVIEWER_TIMEOUT_SECONDS
        $reviewerTimeoutExplicit = $true
    }

    if ($env:VIBE_REVIEW_MODERATOR_TIMEOUT_SECONDS) {
        $snapshot.ReviewModeratorTimeoutSeconds = [int]$env:VIBE_REVIEW_MODERATOR_TIMEOUT_SECONDS
    }

    if ($env:VIBE_NUM_TASKS) {
        $snapshot.NumTasks = [int]$env:VIBE_NUM_TASKS
    }
    elseif ($null -ne $env:VIBE_NUM_TASKS -and $env:VIBE_NUM_TASKS -eq '0') {
        $snapshot.NumTasks = 0
    }

    if ($null -ne $env:VIBE_PIPELINE_TIMEOUT_SECONDS -and $env:VIBE_PIPELINE_TIMEOUT_SECONDS -ne '') {
        $snapshot.PipelineTimeoutSeconds = [int]$env:VIBE_PIPELINE_TIMEOUT_SECONDS
    }

    # ── Validation ──

    # Fields that must be strictly positive (> 0)
    $positiveFields = @(
        'MaxReviewRounds',
        'ReviewGateTimeoutSeconds',
        'MaxTddKeepGoingPerGate',
        'PipelineTimeoutSeconds',
        'ReviewerTimeoutSeconds',
        'ReviewModeratorTimeoutSeconds'
    )
    foreach ($field in $positiveFields) {
        if ($snapshot[$field] -le 0) {
            throw [System.ArgumentException]::new(
                "$field must be positive, got $($snapshot[$field])."
            )
        }
    }

    # MaxKeepGoingResets allows 0 (disables Keep Going per TLA S11) but rejects negative
    if ($snapshot.MaxKeepGoingResets -lt 0) {
        throw [System.ArgumentException]::new(
            "MaxKeepGoingResets must be non-negative, got $($snapshot.MaxKeepGoingResets)."
        )
    }

    # NumTasks must be >= 1
    if ($snapshot.NumTasks -lt 1) {
        throw [System.ArgumentException]::new(
            "NumTasks must be >= 1, got $($snapshot.NumTasks). " +
            "Each tier must have at least one task."
        )
    }

    # Cross-field: gate timeout must accommodate at least one full reviewer invocation
    if ($snapshot.ReviewGateTimeoutSeconds -lt $snapshot.ReviewerTimeoutSeconds) {
        if ($reviewerTimeoutExplicit) {
            throw [System.ArgumentException]::new(
                "ReviewGateTimeoutSeconds ($($snapshot.ReviewGateTimeoutSeconds)) must be >= ReviewerTimeoutSeconds ($($snapshot.ReviewerTimeoutSeconds))."
            )
        }
        # Auto-clamp default reviewer timeout to fit within the gate timeout
        $snapshot.ReviewerTimeoutSeconds = $snapshot.ReviewGateTimeoutSeconds
    }

    # Cross-field: pipeline timeout must accommodate at least one full gate timeout
    if ($snapshot.PipelineTimeoutSeconds -lt $snapshot.ReviewGateTimeoutSeconds) {
        throw [System.ArgumentException]::new(
            "PipelineTimeoutSeconds ($($snapshot.PipelineTimeoutSeconds)) must be >= ReviewGateTimeoutSeconds ($($snapshot.ReviewGateTimeoutSeconds))."
        )
    }

    # Return as an immutable (read-only) dictionary
    $dict = [System.Collections.Generic.Dictionary[string,object]]::new()
    foreach ($key in $snapshot.Keys) {
        $dict[$key] = $snapshot[$key]
    }
    $readOnly = [System.Collections.ObjectModel.ReadOnlyDictionary[string,object]]::new($dict)
    return $readOnly
}

function Invoke-ScopedTestVerify {
    param(
        [Parameter(Mandatory)][string[]]$TestFiles,
        [string]$WorkingDirectory
    )

    if ($WorkingDirectory) { Push-Location $WorkingDirectory }
    try {
        $pesterConfig = New-PesterConfiguration
        $pesterConfig.Run.Path = $TestFiles
        $pesterConfig.Run.PassThru = $true
        $pesterConfig.Output.Verbosity = 'None'
        $result = Invoke-Pester -Configuration $pesterConfig
        if ($result.FailedCount -gt 0) { return 1 }
        return 0
    }
    finally {
        if ($WorkingDirectory) { Pop-Location }
    }
}

function Test-VerifyCommand {
    param([Parameter(Mandatory)][string]$Command)

    if ($Command -notmatch $Config.VerifyCommandAllowlistPattern) {
        throw [System.ArgumentException]::new(
            "Verify command contains disallowed characters: '$Command'. " +
            "Only alphanumeric, dots, slashes, hyphens, underscores, and spaces are permitted."
        )
    }
}

function Invoke-VerifyCommand {
    param(
        [Parameter(Mandatory)][string]$Command,
        [string]$WorkingDirectory
    )

    Test-VerifyCommand -Command $Command

    $parts = $Command -split '\s+'
    $exe = $parts[0]
    $cmdArgs = if ($parts.Count -gt 1) { $parts[1..($parts.Count - 1)] } else { @() }

    $params = @{}
    if ($WorkingDirectory) {
        $originalDir = Get-Location
        Set-Location $WorkingDirectory
    }

    try {
        $null = & $exe @cmdArgs 2>&1
        $code = $LASTEXITCODE
        if ($null -eq $code) { $code = 0 }
        return $code
    }
    finally {
        if ($WorkingDirectory -and $originalDir) {
            Set-Location $originalDir
        }
    }
}
