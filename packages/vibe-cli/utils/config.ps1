. "$PSScriptRoot/invoke-claude.ps1"

$global:PipelineLogFile = "$PSScriptRoot/../pipeline.log"

function Write-PipelineLog {
    param([Parameter(ValueFromPipeline)] [string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$ts] $Message" | Add-Content -Path $global:PipelineLogFile
}

$Config = @{
    # Debate
    MaxDebateRounds      = 100   # PowerShell debate loop cap (matches moderator internal cap)

    # TDD
    MaxTddCycles         = 100    # RED/GREEN cycles per TDD loop
    MaxGreenRetries      = 100     # Code writer fix attempts when GREEN fails

    # Cleanup
    CleanupPasses        = 2     # lint + test + tsc must pass this many times consecutively

    # Task runner
    MaxFixRounds         = 100    # TDD → cleanup → review retry loop cap (high for strict ESLint/TS)

    # Coding stage
    WorktreeThrottleLimit = 12    # Max concurrent worktrees (Windows cap)

    # TLC verification
    MaxTlcAttempts       = 100   # TLA+ writer → TLC verify loop cap

    # Global review
    MaxGlobalFixRounds   = 100    # Review → fix cycle for the full integration branch

    # Elicitor
    MaxElicitorTurns     = 50    # Hard turn cap for the interview
}
