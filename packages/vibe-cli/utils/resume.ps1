function Resume-Pipeline {
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$LogPath,
        [Parameter(Mandatory)][string]$LockDir,
        [int]$MaxCrashes = 3
    )

    # 1. Check crash budget
    $crashCount = Test-CrashBudget -LockDir $LockDir -MaxCrashes $MaxCrashes

    # 2. Extract runId from log
    $runId = Get-RunIdFromLog -LogPath $LogPath

    # 3. Detect feature name from PIPELINE START line
    $logContent = Get-Content $LogPath -Raw
    if ($logContent -match 'PIPELINE START.*feature=(\S+)') {
        $feature = $Matches[1]
    }
    else {
        throw "Cannot detect feature name from pipeline log"
    }

    # 4. Detect last completed stage
    $lastStage = 0
    for ($s = 8; $s -ge 1; $s--) {
        if ($logContent -match "Stage $s complete") { $lastStage = $s; break }
    }

    # 5. Check fixture states
    $featureDir = "$Root/docs/$feature"
    $bddFixture = Join-Path $featureDir 'tests/fixtures/bdd/fixture.json'
    $tlcFixture = Join-Path $featureDir 'tests/fixtures/tla/fixture.json'

    $bddState = if (Test-Path $bddFixture) {
        try { $null = Get-Content $bddFixture -Raw | ConvertFrom-Json; 'valid' } catch { 'corrupt' }
    }
    else { 'missing' }

    $tlcState = if (Test-Path $tlcFixture) {
        try { $null = Get-Content $tlcFixture -Raw | ConvertFrom-Json; 'valid' } catch { 'corrupt' }
    }
    else { 'missing' }

    # 6. Check for dirty git state
    $gitState = @{ mergeHead = $false; rebaseHead = $false }
    try {
        $gitDir = & git rev-parse --git-dir 2>$null
        if ($gitDir -and (Test-Path (Join-Path $gitDir 'MERGE_HEAD'))) { $gitState.mergeHead = $true }
        if ($gitDir -and (Test-Path (Join-Path $gitDir 'REBASE_HEAD'))) { $gitState.rebaseHead = $true }
    }
    catch { }

    # 7. Load idempotency tokens
    $tokens = Read-IdempotencyTokens -LogPath $LogPath

    return @{
        RunId              = $runId
        Feature            = $feature
        LastStage          = $lastStage
        ResumeStage        = $lastStage + 1
        BddFixtureState    = $bddState
        TlcFixtureState    = $tlcState
        GitState           = $gitState
        CrashCount         = $crashCount
        IdempotencyTokens  = $tokens
    }
}
