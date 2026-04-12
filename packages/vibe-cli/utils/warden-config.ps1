function Set-WardenScope {
    param(
        [Parameter(Mandatory)][string]$WorktreePath,
        [Parameter(Mandatory)][string]$TaskId,
        [string]$RepoRoot
    )

    if (-not $RepoRoot) { $RepoRoot = (git rev-parse --show-toplevel).Trim() }

    $wardenDir = Join-Path $WorktreePath '.claude'
    New-Item -ItemType Directory -Path $wardenDir -Force | Out-Null

    # Create warden.yaml that restricts writes to worktree, read-only to full repo
    $wardenConfig = @"
rules:
  - name: "Allow writes to worktree ($TaskId)"
    action: allow
    paths:
      - "$($WorktreePath -replace '\\','/')/**"
  - name: "Read-only repo access"
    action: allow
    read_only: true
    paths:
      - "$($RepoRoot -replace '\\','/')/**"
"@

    $wardenFile = Join-Path $wardenDir 'warden.yaml'
    Set-Content -Path $wardenFile -Value $wardenConfig

    return @{
        TaskId       = $TaskId
        WorktreePath = $WorktreePath
        WardenFile   = $wardenFile
        State        = 'active'
    }
}

function Remove-WardenScope {
    param(
        [Parameter(Mandatory)][string]$WorktreePath,
        [string]$TaskId
    )

    $wardenDir = Join-Path $WorktreePath '.claude'
    if (Test-Path $wardenDir) {
        Remove-Item $wardenDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    return @{ TaskId = $TaskId; State = 'unconfigured' }
}

function Test-WardenActive {
    param([Parameter(Mandatory)][string]$WorktreePath)
    $wardenFile = Join-Path $WorktreePath '.claude/warden.yaml'
    return (Test-Path $wardenFile)
}
