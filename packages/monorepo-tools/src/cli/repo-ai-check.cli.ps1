<#
.SYNOPSIS
Monorepo lint/tsc/vitest orchestrator (PowerShell multithreaded edition).

.DESCRIPTION
Discovers workspaces under apps/ and packages/, applies --workspace / --file
scoping, then runs per-workspace checks through a single long-lived Bun worker
(`bun run-workspace.worker.ts`) with bounded internal concurrency (throttled to
the logical CPU count by default). The worker reuses the existing runWorkspace
engine, so the JSON report shape and ESLint autofix telemetry are unchanged.
Collects each workspace's JSON result, builds the aggregate report, and either
emits JSON or pipes it to render-check-report.cli.ts for Markdown.

Stdout carries the report only; progress goes to stderr.

.EXAMPLE
pwsh -NoProfile -File repo-ai-check.cli.ps1 --workspace monorepo-tools --skip-fix --format Json
#>
$ErrorActionPreference = "Stop"

$DEFAULT_TIMEOUT_SECONDS = 600

function Write-Usage {
    $usage = @'
Usage: repo-ai-check.cli.ps1 [--file <path>]... [--workspace <name>]...
       [--throttle <int>] [--timeout-seconds <int>] [--skip-fix]
       [--format Json|Markdown] [-Help]

  --file <path>          Restrict to the workspace owning <path> (repeatable, comma-split).
  --workspace <name>     Restrict to named workspace(s) (repeatable, comma-split).
  --throttle <int>      Max parallel workspaces (default: logical CPU count).
  --timeout-seconds <int> Per-workspace timeout (default: 600).
  --skip-fix             Disable ESLint autofix.
  --format <Json|Markdown> Report format (default: Markdown).
  -Help, -h              Show this help.
'@
    Write-Output $usage
}

function Fail {
    param([string] $Message)
    Write-Error $Message
    exit 1
}

# --- argument parsing (manual, so a leading "--" passthrough is tolerated) ---

$rawArgs = $args
if ($rawArgs.Count -gt 0 -and $rawArgs[0] -eq "--") {
    $rawArgs = $rawArgs[1..($rawArgs.Count - 1)]
}

$File = @()
$Format = "Markdown"
$SkipFix = $false
$throttleSpecified = $false
$Throttle = 0
$TimeoutSeconds = $DEFAULT_TIMEOUT_SECONDS
$Workspace = @()
$Help = $false

$i = 0
while ($i -lt $rawArgs.Count) {
    $arg = $rawArgs[$i]
    switch ($arg) {
        "--file" {
            $i++
            if ($i -ge $rawArgs.Count) { Fail "Missing value after --file" }
            $File += $rawArgs[$i] -split ","
        }
        "--workspace" {
            $i++
            if ($i -ge $rawArgs.Count) { Fail "Missing value after --workspace" }
            $Workspace += $rawArgs[$i] -split ","
        }
        "--throttle" {
            $i++
            if ($i -ge $rawArgs.Count) { Fail "Missing value after --throttle" }
            $throttleSpecified = $true
            $Throttle = [int] $rawArgs[$i]
        }
        "--timeout-seconds" {
            $i++
            if ($i -ge $rawArgs.Count) { Fail "Missing value after --timeout-seconds" }
            $TimeoutSeconds = [int] $rawArgs[$i]
        }
        "--format" {
            $i++
            if ($i -ge $rawArgs.Count) { Fail "Missing value after --format" }
            $Format = $rawArgs[$i]
        }
        "--skip-fix" { $SkipFix = $true }
        "-Help" { $Help = $true }
        "-h" { $Help = $true }
        default { Fail "Unknown argument: $arg" }
    }
    $i++
}

if ($Help) {
    Write-Usage
    exit 0
}

if ($TimeoutSeconds -lt 1) {
    Fail "--timeout-seconds must be a positive integer"
}

if ($throttleSpecified) {
    if ($Throttle -lt 1) {
        Fail "--throttle must be a positive integer"
    }
    $throttleLimit = $Throttle
}
else {
    $cpuCount = $env:NUMBER_OF_PROCESSORS
    $throttleLimit = if ($cpuCount -and $cpuCount -gt 0) { [int] $cpuCount } else { 1 }
}

$files = if ($File) { @($File) | ForEach-Object { $_.Split(",", [System.StringSplitOptions]::RemoveEmptyEntries) } } else { @() }
$workspacesFilter = if ($Workspace) { @($Workspace) | ForEach-Object { $_.Split(",", [System.StringSplitOptions]::RemoveEmptyEntries) } } else { @() }

# --- paths -------------------------------------------------------------------

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path -Path $scriptDir -ChildPath ".." -AdditionalChildPath "..", "..", "..")
$workerPath = Join-Path -Path $scriptDir -ChildPath "run-workspace.worker.ts"
$renderPath = Join-Path -Path $scriptDir -ChildPath "render-check-report.cli.ts"
$bunExecutable = "bun"

function Test-HasFile {
    param([string] $Directory, [string] $Name)
    return Test-Path (Join-Path -Path $Directory -ChildPath $Name) -PathType Leaf
}

# --- discovery --------------------------------------------------------------

function New-WorkspaceInfo {
    [CmdletBinding(SupportsShouldProcess=$true)]
    param(
        [string] $Name,
        [string] $Path,
        [string] $RelativePath,
        [string] $Type,
        [bool] $HasLint,
        [bool] $HasTest,
        [bool] $HasTsconfig
    )
    return [pscustomobject]@{
        name         = $Name
        path         = $Path
        relativePath = $RelativePath
        type         = $Type
        hasLint      = $HasLint
        hasTest      = $HasTest
        hasTsconfig  = $HasTsconfig
    }
}

function Convert-PackageScript {
    param([object] $Pkg)
    $scripts = if ($Pkg.scripts) { $Pkg.scripts } else { @{} }
    return @{
        hasLint = [bool]($scripts.PSObject.Properties.Name -contains "lint")
        hasTest = [bool]($scripts.PSObject.Properties.Name -contains "test")
    }
}

function Find-Workspace {
    param([string] $Root)
    $prefixes = @("apps", "packages")
    $found = @()
    foreach ($prefix in $prefixes) {
        $base = Join-Path -Path $Root -ChildPath $prefix
        if (-not (Test-Path $base -PathType Container)) { continue }
        foreach ($entry in Get-ChildItem -Path $base -Directory) {
            $wsPath = $entry.FullName
            if (-not (Test-HasFile $wsPath "package.json")) { continue }
            $pkg = Get-Content (Join-Path -Path $wsPath -ChildPath "package.json") -Raw | ConvertFrom-Json
            $scripts = Convert-PackageScript -Pkg $pkg
            $found += New-WorkspaceInfo -Name $entry.Name -Path $wsPath -RelativePath "$prefix/$($entry.Name)" -Type (if ($prefix -eq "apps") { "app" } else { "package" }) -HasLint $scripts.hasLint -HasTest $scripts.hasTest -HasTsconfig (Test-HasFile $wsPath "tsconfig.json")
        }
    }
    return $found
}

# --- scoping ----------------------------------------------------------------

function Resolve-FileTarget {
    param(
        [string[]] $RawFiles,
        [string] $Root,
        [array] $Workspaces,
        [string[]] $SelectedNames
    )
    if ($SelectedNames.Count -eq 0) {
        $selected = $Workspaces
    }
    else {
        $selected = $Workspaces | Where-Object { $SelectedNames -contains $_.name }
    }

    $targetsByWorkspace = @{}
    foreach ($rawFile in $RawFiles) {
        $file = [System.IO.Path]::GetFullPath((Join-Path -Path $Root -ChildPath $rawFile))
        $owners = @($selected | Where-Object { Test-Within $file $_.path } |
            Sort-Object { $_.path.Length } -Descending)
        $candidateOwner = $owners[0]
        $scope = if ($SelectedNames.Count -eq 0) { "any workspace" } else { "the selected workspace" }
        if (-not $candidateOwner) {
            Fail "File '$rawFile' is not inside $scope."
        }
        $rel = [System.IO.Path]::GetRelativePath($candidateOwner.path, $file) -replace "\\", "/"
        if (-not $targetsByWorkspace.ContainsKey($candidateOwner.name)) {
            $targetsByWorkspace[$candidateOwner.name] = @()
        }
        $targetsByWorkspace[$candidateOwner.name] = ($targetsByWorkspace[$candidateOwner.name] + $rel) | Select-Object -Unique
    }

    if ($RawFiles.Count -eq 0) {
        $targeted = $selected
    }
    else {
        $targeted = $selected | Where-Object { $targetsByWorkspace.ContainsKey($_.name) }
    }
    return @{ selected = $targeted; targetsByWorkspace = $targetsByWorkspace }
}

function Test-Within {
    param([string] $Candidate, [string] $WorkspacePath)
    $relative = [System.IO.Path]::GetRelativePath($WorkspacePath, $Candidate)
    return -not $relative.StartsWith("..") -and -not [System.IO.Path]::IsPathRooted($relative)
}

# --- aggregation (mirrors domain/check-report.ts) ---------------------------

function Select-Kind {
    param(
        [array] $Reports,
        [string] $Kind,
        [bool] $CheckRan
    )
    if ($CheckRan) {
        return @($Reports | Where-Object { $_.$Kind -and $_.$Kind.ran })
    }
    return @($Reports | Where-Object { $_.$Kind })
}

function Merge-AutofixStat {
    param([array] $WorkspaceReports)
    $afErrorTotal = 0
    $afWarningTotal = 0
    $afWorkspaceCount = 0
    $ruleBuckets = @{}
    foreach ($wr in $WorkspaceReports) {
        if (-not ($wr.lint -and $wr.lint.autofix)) { continue }
        $afWorkspaceCount += 1
        $afErrorTotal += [int] $wr.lint.autofix.fixedErrorCount
        $afWarningTotal += [int] $wr.lint.autofix.fixedWarningCount
        foreach ($rule in $wr.lint.autofix.byRule) {
            if (-not $ruleBuckets.ContainsKey($rule.ruleId)) {
                $ruleBuckets[$rule.ruleId] = [pscustomobject]@{
                    ruleId          = $rule.ruleId
                    fixedErrorCount = 0
                    fixedWarningCount = 0
                    workspaceCount  = 0
                }
            }
            $ruleBuckets[$rule.ruleId].fixedErrorCount += [int] $rule.fixedErrorCount
            $ruleBuckets[$rule.ruleId].fixedWarningCount += [int] $rule.fixedWarningCount
            $ruleBuckets[$rule.ruleId].workspaceCount += 1
        }
    }
    $byRule = $ruleBuckets.Values | Sort-Object -Property @(
        @{ Expression = { $_.fixedErrorCount + $_.fixedWarningCount }; Descending = $true }
        @{ Expression = { $_.ruleId }; Descending = $false }
    ) | Select-Object -First 10
    return @{
        afErrorTotal   = $afErrorTotal
        afWarningTotal = $afWarningTotal
        afWorkspaceCount = $afWorkspaceCount
        byRule         = $byRule
    }
}

function Build-CheckReport {
    param(
        [string] $StartedAt,
        [string] $FinishedAt,
        [array] $WorkspaceReports,
        [bool] $IsAutofixRan
    )
    # per-kind filters
    $lintRan = Select-Kind -Reports $WorkspaceReports -Kind "lint" -CheckRan $true
    $lintPassed = Select-Kind -Reports $WorkspaceReports -Kind "lint" -CheckRan $false
    $lintFailed = @($WorkspaceReports | Where-Object { $_.lint -and $_.lint.ran -and -not $_.lint.passed })
    $tscRan = Select-Kind -Reports $WorkspaceReports -Kind "tsc" -CheckRan $true
    $tscPassed = Select-Kind -Reports $WorkspaceReports -Kind "tsc" -CheckRan $false
    $tscFailed = @($WorkspaceReports | Where-Object { $_.tsc -and $_.tsc.ran -and -not $_.tsc.passed })
    $testRan = Select-Kind -Reports $WorkspaceReports -Kind "test" -CheckRan $true
    $testPassed = Select-Kind -Reports $WorkspaceReports -Kind "test" -CheckRan $false
    $testFailed = @($WorkspaceReports | Where-Object { $_.test -and $_.test.ran -and -not $_.test.passed })
    $coverageRan = Select-Kind -Reports $WorkspaceReports -Kind "coverage" -CheckRan $true
    $coveragePassed = Select-Kind -Reports $WorkspaceReports -Kind "coverage" -CheckRan $false
    $coverageFailed = @($WorkspaceReports | Where-Object { $_.coverage -and $_.coverage.ran -and -not $_.coverage.passed })

    $lintErrorCount = ($lintRan | Measure-Object -Property errorCount -Sum).Sum
    $lintWarningCount = ($lintRan | Measure-Object -Property warningCount -Sum).Sum
    $tscErrorCount = ($tscRan | Measure-Object -Property errorCount -Sum).Sum
    $tscWarningCount = ($tscRan | Measure-Object -Property warningCount -Sum).Sum
    $testFailedTestCount = ($testRan | ForEach-Object { $_.test.failedTests.Count } | Measure-Object -Sum).Sum

    # autofix aggregation
    $af = Merge-AutofixStat -WorkspaceReports $WorkspaceReports

    $lintSummary = [pscustomobject]@{
        autofix = [pscustomobject]@{
            byRule            = $af.byRule
            fixedErrorCount   = $af.afErrorTotal
            fixedWarningCount = $af.afWarningTotal
            ran               = $IsAutofixRan
            ranInWorkspaces   = $af.afWorkspaceCount
        }
        errorCount   = $lintErrorCount
        failed       = $lintFailed.Count
        passed       = $lintPassed.Count
        ran          = $lintRan.Count
        warningCount = $lintWarningCount
    }
    $tscSummary = [pscustomobject]@{
        errorCount   = $tscErrorCount
        failed       = $tscFailed.Count
        passed       = $tscPassed.Count
        ran          = $tscRan.Count
        warningCount = $tscWarningCount
    }
    $testSummary = [pscustomobject]@{
        failed          = $testFailed.Count
        failedTestCount = $testFailedTestCount
        passed         = $testPassed.Count
        ran            = $testRan.Count
    }
    $coverageSummary = [pscustomobject]@{
        failed = $coverageFailed.Count
        passed = $coveragePassed.Count
        ran    = $coverageRan.Count
    }

    $exitCode = if (($lintSummary.failed + $tscSummary.failed + $testSummary.failed + $coverageSummary.failed) -gt 0) { 1 } else { 0 }

    $startedMs = [System.DateTime]::Parse($StartedAt).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalMilliseconds
    $finishedMs = [System.DateTime]::Parse($FinishedAt).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalMilliseconds
    $durationMs = [int] ($finishedMs - $startedMs)

    return [pscustomobject]@{
        durationMs = $durationMs
        exitCode   = $exitCode
        finishedAt = $FinishedAt
        startedAt  = $StartedAt
        summary    = [pscustomobject]@{ coverage = $coverageSummary; lint = $lintSummary; test = $testSummary; tsc = $tscSummary; workspaces = $WorkspaceReports.Count }
        workspaces = $WorkspaceReports
    }
}

# --- main --------------------------------------------------------------------

$allWorkspaces = Find-Workspace -Root $repoRoot
$scoped = Resolve-FileTarget -RawFiles $files -Root $repoRoot -Workspaces $allWorkspaces -SelectedNames $workspacesFilter

[Console]::Error.WriteLine("Discovered $($scoped.selected.Count) workspace(s); running with throttle=$throttleLimit, timeout=$TimeoutSeconds`s.")

$startedAt = [System.DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

# --- single long-lived Bun worker (one process for the whole check) ----------

function Find-TestSibling {
    param([string[]] $Files)
    $siblings = @()
    foreach ($file in $Files) {
        $dir = Split-Path -Parent $file
        if (-not (Test-Path $dir -PathType Container)) { continue }
        foreach ($entry in Get-ChildItem -Path $dir -File) {
            if ($entry.Name.EndsWith(".test.ts") -or $entry.Name.EndsWith(".test.tsx")) {
                $siblings += $entry.FullName
            }
        }
    }
    return $siblings | Select-Object -Unique
}

function Build-FailedReport {
    param([pscustomobject] $W, [string] $Message)
    return [pscustomobject]@{
        name  = $W.name
        path  = $W.relativePath
        error = $Message
        lint  = [pscustomobject]@{ autofix = $null; errorCount = 1; fixableErrorCount = 0; fixableWarningCount = 0; issues = @(); passed = $false; ran = $true; warningCount = 0 }
        test  = [pscustomobject]@{ failedTests = @(); passed = $false; ran = $true }
        tsc   = [pscustomobject]@{ errorCount = 1; passed = $false; ran = $true; warningCount = 0 }
        coverage = [pscustomobject]@{ passed = $false; ran = $true; summary = $null; violations = @() }
    }
}

# worker env: reuse the existing runner defaults; concurrency follows the throttle
$jobs = @()
foreach ($ws in $scoped.selected) {
    $targets = $scoped.targetsByWorkspace[$ws.name]
    if ($null -eq $targets) { $targets = @() }
    $testFiles = if ($targets.Count -eq 0) { @() } else {
        $abs = $targets | ForEach-Object { Join-Path -Path $ws.path -ChildPath $_ }
        Find-TestSibling -Files $abs | ForEach-Object { [System.IO.Path]::GetRelativePath($ws.path, $_) -replace "\\", "/" }
    }

    $checks = @()
    if ($ws.hasLint) { $checks += "lint" }
    if ($ws.hasTsconfig) { $checks += "tsc" }
    if ($ws.hasTest) { $checks += "test" }

    $jobs += [pscustomobject]@{
        id = $ws.name
        args = [pscustomobject]@{
            checks        = $checks
            cwd           = $ws.path
            files         = if ($targets.Count -eq 0) { @(".") } else { $targets }
            fix           = (-not $SkipFix)
            targetedFiles = $targets
            testFiles     = $testFiles
        }
    }
}

$jobsFile = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "repo-ai-check-jobs-$(Get-Random).json")
$jobsPayload = [pscustomobject]@{ jobs = $jobs } | ConvertTo-Json -Compress -Depth 10
[System.IO.File]::WriteAllText($jobsFile, $jobsPayload)

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $bunExecutable
$psi.ArgumentList.Add($workerPath) | Out-Null
$psi.ArgumentList.Add("--jobs") | Out-Null
$psi.ArgumentList.Add($jobsFile) | Out-Null
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true
$psi.Environment.Add("CHECK_WORKER_THROTTLE", [string] $throttleLimit)

$worker = New-Object System.Diagnostics.Process
$worker.StartInfo = $psi

# thread-safe map of workspace name -> report object
$responses = [System.Collections.Concurrent.ConcurrentDictionary[string, object]]::new()
$workerError = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()

if (-not $worker.Start()) {
    Fail "Failed to start the check worker: $workerPath"
}

# The worker writes one NDJSON response line per job, then exits, so reading
# stdout to end is safe and avoids async event-subscription complexity.
$workerOutput = $worker.StandardOutput.ReadToEnd()
$workerErrorText = $worker.StandardError.ReadToEnd()

if (-not $worker.WaitForExit($TimeoutSeconds * 1000)) {
    $worker.Kill()
}

foreach ($line in $workerOutput -split "`n") {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrEmpty($trimmed)) { continue }
    try {
        $msg = $trimmed | ConvertFrom-Json
    }
    catch {
        continue
    }
    if ($null -ne $msg.error) {
        $responses[$msg.id] = [pscustomobject]@{ isError = $true; message = [string] $msg.error }
        continue
    }
    if ($null -ne $msg.result) {
        $responses[$msg.id] = [pscustomobject]@{ isError = $false; result = $msg.result }
    }
}
if (-not [string]::IsNullOrEmpty($workerErrorText)) {
    $workerErrorText -split "`n" | ForEach-Object {
        if (-not [string]::IsNullOrEmpty($_.Trim())) {
            $workerError.Enqueue($_.Trim())
        }
    }
}

# map responses (and any missing/error ones) into the report shape the
# aggregator already consumes
$reports = @()
foreach ($ws in $scoped.selected) {
    if (-not $responses.ContainsKey($ws.name)) {
        $reports += Build-FailedReport $ws "Worker exited before reporting this workspace"
        continue
    }
    $entry = $responses[$ws.name]
    if ($entry.isError) {
        $reports += Build-FailedReport $ws $entry.message
        continue
    }
    $result = $entry.result
    $reports += [pscustomobject]@{
        name  = $ws.name
        path  = $ws.relativePath
        error = $null
        lint  = [pscustomobject]@{
            autofix      = if ($result.lint.autofix) { $result.lint.autofix } else { $null }
            errorCount   = [int] $result.lint.errorCount
            passed       = [bool] $result.lint.passed
            ran          = [bool] $result.lint.ran
            warningCount = [int] $result.lint.warningCount
        }
        test  = [pscustomobject]@{
            failedTests = @($result.test.failingTests | ForEach-Object { [pscustomobject]@{ name = $_.name } })
            passed      = [bool] $result.test.passed
            ran         = [bool] $result.test.ran
        }
        tsc   = [pscustomobject]@{
            errorCount   = [int] $result.tsc.errorCount
            passed       = [bool] $result.tsc.passed
            ran          = [bool] $result.tsc.ran
            warningCount = [int] $result.tsc.warningCount
        }
        coverage = [pscustomobject]@{
            passed    = [bool] $result.coverage.passed
            ran       = [bool] $result.coverage.ran
            summary   = if ($null -ne $result.coverage.summary) { $result.coverage.summary } else { $null }
            violations = if ($null -ne $result.coverage.violations) { $result.coverage.violations } else { @() }
        }
    }
}

if ($workerError.Count -gt 0 -and $reports.Count -eq 0) {
    [Console]::Error.WriteLine("Worker stderr: " + ($workerError.ToArray() -join "`n"))
}

Remove-Item $jobsFile -ErrorAction SilentlyContinue

$finishedAt = [System.DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

$report = Build-CheckReport -StartedAt $startedAt -FinishedAt $finishedAt -WorkspaceReports $reports -IsAutofixRan (-not $SkipFix)

$json = $report | ConvertTo-Json -Depth 12 -Compress

if ($Format -eq "Json") {
    Write-Output $json
}
else {
    $json | & $bunExecutable $renderPath
}

if ($report.exitCode -eq 0) {
    [Console]::Error.WriteLine("All checks passed.")
}
else {
    [Console]::Error.WriteLine("Checks failed.")
}

exit $report.exitCode
