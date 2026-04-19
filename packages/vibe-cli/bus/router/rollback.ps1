. "$PSScriptRoot/../domain/rollback-coordinator.ps1"
. "$PSScriptRoot/../domain/bus-lifecycle.ps1"
. "$PSScriptRoot/../domain/consensus-round.ps1"
. "$PSScriptRoot/../infra/working-tree-coordinator.ps1"
if (-not (Get-Command Write-PipelineLog -ErrorAction SilentlyContinue)) {
    function Write-PipelineLog { param($Message,$Severity='INFO',$Gate,$StructuredData); Write-Host "[$Severity] $Message" }
}

function Invoke-BusRollback {
    param(
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$WorktreeLeaf,
        [string]$SnapshotDir = $null,
        [hashtable]$Coordinator = $null,
        [switch]$SkipSnapshot,
        [scriptblock]$GetUtcNow = $null
    )

    # 1. Default snapshot dir
    if (-not $SnapshotDir) {
        $SnapshotDir = Join-Path ([System.IO.Path]::GetTempPath()) 'vibe-snapshots'
    }

    # 2. Ensure snapshot dir exists
    if (-not (Test-Path $SnapshotDir)) {
        New-Item -ItemType Directory -Path $SnapshotDir -Force | Out-Null
    }

    # 3. Optionally take snapshot
    if (-not $SkipSnapshot) {
        Invoke-BusTakeSnapshot -SnapshotDir $SnapshotDir -Connection $Connection `
            -WorktreeLeaf $WorktreeLeaf -Coordinator $Coordinator -GetUtcNow $GetUtcNow | Out-Null
    }

    # 4. Run rollback coordination
    $result = Invoke-BusRollbackCoordination -Connection $Connection -WorktreeLeaf $WorktreeLeaf `
        -SnapshotDir $SnapshotDir -Coordinator $Coordinator -GetUtcNow $GetUtcNow

    return $result
}

function Reset-RollbackState {
    param([Parameter(Mandatory)]$Connection)
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query `
        "UPDATE rollback_state SET value='0' WHERE key='rollbackRequested'" | Out-Null
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query `
        "UPDATE rollback_state SET value=NULL WHERE key='rollbackTargetWorktree'" | Out-Null
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query `
        "UPDATE rollback_state SET value='0' WHERE key='snapshotExists'" | Out-Null
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query `
        "UPDATE rollback_state SET value=NULL WHERE key='rollback_phase'" | Out-Null
    Invoke-SqliteQuery -SQLiteConnection $Connection -Query `
        "UPDATE rollback_state SET value=NULL WHERE key='rollback_execution_id'" | Out-Null
}
