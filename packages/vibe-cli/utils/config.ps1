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

function Test-HeadroomPort {
    param([string]$Host_ = '127.0.0.1', [int]$Port = 8787)
    try {
        $tcp = [System.Net.Sockets.TcpClient]::new()
        $tcp.Connect($Host_, $Port)
        $tcp.Close()
        return $true
    }
    catch { return $false }
}

function Start-HeadroomProxy {
    if (-not $Config.UseHeadroom) { return }

    $uri = [System.Uri]$Config.HeadroomUrl
    $proxyHost = $uri.Host
    $proxyPort = $uri.Port

    if (Test-HeadroomPort -Host_ $proxyHost -Port $proxyPort) {
        Write-PipelineLog "Headroom proxy already running on port $proxyPort" -Color Green
        return
    }

    Write-PipelineLog "Starting headroom proxy on port $proxyPort..." -Color Yellow
    $headroomExe = Get-Command headroom -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty Source
    if (-not $headroomExe) {
        throw "headroom not found in PATH. Install with: pip install headroom-ai"
    }

    Start-Process -FilePath $headroomExe -ArgumentList "proxy --port $proxyPort" `
        -WindowStyle Hidden

    # Wait up to 10s for the port to open
    $deadline = [datetime]::Now.AddSeconds(10)
    while ([datetime]::Now -lt $deadline) {
        if (Test-HeadroomPort -Host_ $proxyHost -Port $proxyPort) {
            Write-PipelineLog "Headroom proxy ready on port $proxyPort" -Color Green
            return
        }
        Start-Sleep -Milliseconds 500
    }

    throw "Headroom proxy failed to start on port $proxyPort within 10 seconds"
}

$Config = @{
    # Headroom proxy
    UseHeadroom           = $true
    HeadroomUrl           = 'http://127.0.0.1:8787'

    # Debate
    MaxDebateRounds       = 100   # PowerShell debate loop cap (matches moderator internal cap)

    # TDD
    MaxTddCycles          = 100   # RED/GREEN cycles per TDD loop

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
        & $exe @cmdArgs
        return $LASTEXITCODE
    }
    finally {
        if ($WorkingDirectory -and $originalDir) {
            Set-Location $originalDir
        }
    }
}
