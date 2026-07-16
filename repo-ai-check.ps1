#requires -Version 7

<#
.SYNOPSIS
    Runs eslint, tsc, and vitest across every monorepo workspace in parallel and
    emits a single combined JSON report on stdout.

.DESCRIPTION
    Designed for AI agents: instead of running test, lint, and tsc sequentially
    via pnpm scripts (which only surfaces one class of failure at a time), this
    script runs all three checks across every workspace concurrently and
    aggregates the results into a single JSON object on stdout.

    Human-readable progress is written to stderr so that stdout is reserved for
    machine-parseable output.

    The script does NOT run pnpm install. It assumes node_modules is already in
    place.

.PARAMETER Throttle
    Maximum number of workspaces to run in parallel. Defaults to the number of
    logical processors.

.PARAMETER TimeoutSeconds
    Per-substep timeout (eslint, tsc, test) in seconds. Defaults to 600 (10 min).

.PARAMETER Workspace
    Optional list of workspace names to scope the run to. Names match the
    directory name under apps/ or packages/ (e.g. "auth", "store", "tsconfig").
    If omitted, every workspace is checked.

.PARAMETER SkipFix
    When set, runs eslint without --fix so all issues are reported. By default
    eslint is run with --fix (auto-fixable issues are resolved silently and
    only the unfixable ones appear in the report). When -SkipFix is used the
    autofix summary is omitted from the output (lint.autofix = null) because
    no fixes were applied.

.PARAMETER File
    Optional list of file paths to scope the run to. Paths may be repo-relative
    (e.g. "apps/auth/src/index.ts") or absolute. The script finds the owning
    workspace for each file and runs eslint/tsc/vitest scoped to that file.
    Tsc cannot be cheaply scoped to a single file, so its output is filtered
    to the target files' diagnostics only. Vitest runs the sibling test files
    (same directory, *.test.ts / *.test.tsx) of each target; if no siblings
    exist for any target, vitest falls back to running the full workspace.

.PARAMETER Format
    Controls the format of the document the script writes to stdout. 'Markdown'
    (the default) pipes the same JSON document through
    scripts/render-check-report.mjs (which uses @ethang/markdown-generator) and
    prints a tight, LLM-readable markdown report. 'Json' emits the raw
    machine-parseable JSON document instead (useful for piping to `jq` or for
    programmatic consumers). Stderr (human progress) is identical in both
    modes. Exit code semantics are unchanged.

.EXAMPLE
    ./repo-ai-check.ps1

.EXAMPLE
    ./repo-ai-check.ps1 -Workspace auth,ethang-react,store -Throttle 4

.EXAMPLE
    ./repo-ai-check.ps1 -File apps/auth/src/index.ts,packages/store/src/store.ts

.EXAMPLE
    ./repo-ai-check.ps1 -Format Json | ConvertFrom-Json | Select-Object -ExpandProperty summary

.EXAMPLE
    # Inspect what the autofix pass rewrote (only populated when -SkipFix is
    # NOT set; null otherwise). Use -Format Json because ConvertFrom-Json only
    # consumes JSON.
    ./repo-ai-check.ps1 -Format Json -Workspace auth |
        ConvertFrom-Json |
        ForEach-Object workspaces |
        Where-Object { $_.lint.autofix } |
        ForEach-Object {
            [PSCustomObject]@{
                name = $_.name
                fixedErrors = $_.lint.autofix.fixedErrorCount
                fixedWarnings = $_.lint.autofix.fixedWarningCount
                rules = ($_.lint.autofix.byRule | ForEach-Object { "$($_.ruleId): $($_.fixedErrorCount + $_.fixedWarningCount)" }) -join ', '
            }
        }

.EXAMPLE
    # Token-efficient markdown report (uses @ethang/markdown-generator via
    # scripts/render-check-report.mjs). This is the default format. Pipe to a
    # file for paste-into-context.
    ./repo-ai-check.ps1 -Workspace auth,store > report.md
#>

[CmdletBinding()]
param(
    [int]$Throttle = [Environment]::ProcessorCount,
    [int]$TimeoutSeconds = 600,
    [string[]]$Workspace = @(),
    [switch]$SkipFix,
    [string[]]$File = @(),
    [ValidateSet('Json','Markdown')]
    [string]$Format = 'Markdown'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# ---------------------------------------------------------------------------
# Paths and constants
# ---------------------------------------------------------------------------

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path $scriptDir).Path
$tempRoot = Join-Path $env:TEMP "repo-ai-check-$([Guid]::NewGuid().ToString('N'))"

New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null

try {
    # -------------------------------------------------------------------------
    # Discovery
    # -------------------------------------------------------------------------

    function Get-Workspace {
        [CmdletBinding()]
        param(
            [string]$RootPath
        )

        $discovered = [System.Collections.Generic.List[object]]::new()
        foreach ($prefix in @('apps', 'packages')) {
            $basePath = Join-Path $RootPath $prefix
            if (-not (Test-Path $basePath)) { continue }
            Get-ChildItem -Path $basePath -Directory | ForEach-Object {
                $workspacePath = $_.FullName
                $packageJsonPath = Join-Path $workspacePath 'package.json'
                $tsconfigPath = Join-Path $workspacePath 'tsconfig.json'

                if (-not (Test-Path $packageJsonPath)) { return }

                $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
                $hasLint = $false
                $hasTest = $false
                if ($null -ne $packageJson.PSObject.Properties['scripts'] -and $null -ne $packageJson.scripts) {
                    $hasLint = $null -ne $packageJson.scripts.PSObject.Properties['lint']
                    $hasTest = $null -ne $packageJson.scripts.PSObject.Properties['test']
                }

                $discovered.Add([PSCustomObject]@{
                    Name = $_.Name
                    Type = $prefix.TrimEnd('s')
                    Path = $workspacePath
                    RelativePath = "$prefix/$($_.Name)"
                    HasLint = $hasLint
                    HasTest = $hasTest
                    HasTsconfig = Test-Path $tsconfigPath
                })
            }
        }
        return $discovered
    }

    $allWorkspaces = Get-Workspace -RootPath $repoRoot

    if ($Workspace.Count -gt 0) {
        $allWorkspaces = $allWorkspaces | Where-Object { $Workspace -contains $_.Name }
    }

    # -------------------------------------------------------------------------
    # File-scope resolution
    # -------------------------------------------------------------------------

    function Resolve-FileTarget {
        [CmdletBinding()]
        param(
            [Parameter(Mandatory)]
            [string]$RawPath,

            [Parameter(Mandatory)]
            [string]$RepoRoot,

            [Parameter(Mandatory)]
            [object[]]$Workspaces
        )

        $candidate = $RawPath
        if (-not [System.IO.Path]::IsPathRooted($candidate)) {
            $candidate = Join-Path $RepoRoot $candidate
        }
        $resolved = (Resolve-Path -LiteralPath $candidate -ErrorAction SilentlyContinue)?.Path
        if ([string]::IsNullOrEmpty($resolved)) {
            throw "File not found: $RawPath"
        }
        $resolved = [System.IO.Path]::GetFullPath($resolved)

        $owner = $null
        $bestLen = -1
        foreach ($ws in $Workspaces) {
            $wsFull = [System.IO.Path]::GetFullPath($ws.Path)
            $sep = [System.IO.Path]::DirectorySeparatorChar
            $wsPrefix = $wsFull.TrimEnd($sep) + $sep
            if ($resolved.StartsWith($wsPrefix, [System.StringComparison]::OrdinalIgnoreCase) -and $wsFull.Length -gt $bestLen) {
                $owner = $ws
                $bestLen = $wsFull.Length
            }
        }
        if ($null -eq $owner) {
            if ($Workspaces.Count -gt 0) {
                throw "File '$RawPath' is not inside any of the selected workspace(s): $($Workspaces.Name -join ', ')."
            }
            throw "File '$RawPath' is not inside any workspace (apps/* or packages/*)."
        }

        $relative = $resolved.Substring($owner.Path.Length).TrimStart([System.IO.Path]::DirectorySeparatorChar, '/')
        return [PSCustomObject]@{
            AbsolutePath = $resolved
            RelativePath = $relative
            WorkspaceName = $owner.Name
        }
    }

    # Per-workspace map of target files (absolute paths). Populated only when
    # -File is supplied. Keyed by workspace name.
    $fileTargetsByWorkspace = @{}
    $resolvedTargets = [System.Collections.Generic.List[object]]::new()

    if ($File.Count -gt 0) {
        foreach ($raw in $File) {
            $resolved = Resolve-FileTarget -RawPath $raw -RepoRoot $repoRoot -Workspaces $allWorkspaces
            $resolvedTargets.Add($resolved)
            if (-not $fileTargetsByWorkspace.ContainsKey($resolved.WorkspaceName)) {
                $fileTargetsByWorkspace[$resolved.WorkspaceName] = [System.Collections.Generic.List[string]]::new()
            }
            $fileTargetsByWorkspace[$resolved.WorkspaceName].Add($resolved.AbsolutePath)
        }

        # Restrict to workspaces that own at least one target file. If a
        # -Workspace filter is also in effect, only those intersections survive.
        $ownerNames = @($fileTargetsByWorkspace.Keys)
        if ($Workspace.Count -gt 0) {
            $ownerNames = @($ownerNames | Where-Object { $Workspace -contains $_ })
            if ($ownerNames.Count -eq 0) {
                [Console]::Error.WriteLine("None of the -File targets are inside the -Workspace filter.")
                exit 1
            }
            $fileTargetsByWorkspace = @{} | ForEach-Object {
                $copy = @{}
                foreach ($name in $ownerNames) { $copy[$name] = $fileTargetsByWorkspace[$name] }
                $copy
            } | Select-Object -First 1
        }
        $allWorkspaces = $allWorkspaces | Where-Object { $ownerNames -contains $_.Name }

        [Console]::Error.WriteLine("File-scope: $($resolvedTargets.Count) file(s) across $($ownerNames.Count) workspace(s): $($ownerNames -join ', ').")
    }

    $totalCount = @($allWorkspaces).Count
    [Console]::Error.WriteLine("Discovered $totalCount workspace(s); running with throttle=$Throttle, timeout=${TimeoutSeconds}s.")

    # -------------------------------------------------------------------------
    # Parsers
    #
    # Each parser takes the raw stdout (or a [string] for tsc) and returns a
    # structured object. Parsers are pure functions so the integration tests
    # can exercise them in isolation.
    # -------------------------------------------------------------------------

    function ConvertFrom-EslintJson {
        [CmdletBinding()]
        param(
            [Parameter(Mandatory)]
            [string]$Stdout,

            [Parameter(Mandatory)]
            [string]$Stderr,

            [Parameter(Mandatory)]
            [int]$ExitCode,

            [Parameter(Mandatory)]
            [int]$DurationMs,

            [Parameter()]
            [AllowNull()]
            $AutofixPayload = $null,

            [Parameter()]
            [AllowNull()]
            $AutofixSummary = $null
        )

        $issues = [System.Collections.Generic.List[object]]::new()
        $raw = $Stdout.Trim()

        if (-not [string]::IsNullOrWhiteSpace($raw)) {
            try {
                $parsed = $raw | ConvertFrom-Json -ErrorAction Stop
                if ($null -ne $parsed) {
                    foreach ($file in $parsed) {
                        foreach ($msg in $file.messages) {
                            $issues.Add([PSCustomObject]@{
                                file = $file.filePath
                                line = $msg.line
                                column = $msg.column
                                endLine = $msg.endLine
                                endColumn = $msg.endColumn
                                severity = $msg.severity
                                ruleId = $msg.ruleId
                                message = $msg.message
                                fixable = [bool]$msg.fix
                            })
                        }
                    }
                }
            }
            catch {
                $issues.Add([PSCustomObject]@{
                    file = $null
                    line = 0
                    column = 0
                    endLine = 0
                    endColumn = 0
                    severity = 'fatal'
                    ruleId = $null
                    message = "Failed to parse eslint JSON output: $($_.Exception.Message)"
                    fixable = $false
                })
            }
        }

        $errorCount = ($issues | Where-Object { $_.severity -eq 2 }).Count
        $warningCount = ($issues | Where-Object { $_.severity -eq 1 }).Count
        $fixableErrorCount = ($issues | Where-Object { $_.severity -eq 2 -and $_.fixable }).Count
        $fixableWarningCount = ($issues | Where-Object { $_.severity -eq 1 -and $_.fixable }).Count

        # Eslint exits non-zero when there are errors but still prints JSON.
        # Exit code 0 means truly clean. If stdout was empty AND exit code was
        # non-zero, we still want to flag it as a failure (likely config error).
        $ran = $true
        $passed = $errorCount -eq 0 -and [string]::IsNullOrWhiteSpace($Stderr) -or (
            $errorCount -eq 0 -and -not [string]::IsNullOrWhiteSpace($Stdout)
        )

        # Recompute cleanly: pass if there are no errors and we have evidence of
        # the run completing (either JSON output or a clean stderr).
        $passed = $errorCount -eq 0

        return [PSCustomObject]@{
            ran = $ran
            passed = $passed
            errorCount = $errorCount
            warningCount = $warningCount
            fixableErrorCount = $fixableErrorCount
            fixableWarningCount = $fixableWarningCount
            durationMs = $DurationMs
            exitCode = $ExitCode
            issues = $issues
            autofix = $AutofixSummary
        }
    }

    # -------------------------------------------------------------------------
    # Autofix diff summarizer
    #
    # Consumes the JSON emitted by scripts/eslint-autofix.mjs and returns an
    # object with per-file and per-rule counts of issues that were silenced by
    # `eslint --fix`. Used so the LLM knows exactly what the script silently
    # rewrote on disk instead of having to re-run lint to discover it.
    # -------------------------------------------------------------------------

    function Get-AutofixSummary {
        [CmdletBinding()]
        param(
            [Parameter(Mandatory)]
            [AllowNull()]
            $Payload
        )

        if ($null -eq $Payload) { return $null }
        if (-not ($Payload.PSObject.Properties['results'])) { return $null }

        $byFileList = [System.Collections.Generic.List[object]]::new()
        $byRuleMap = @{} # ruleId -> { ruleId, fixedErrorCount, fixedWarningCount, fileCount, files }
        $totalFixedErrors = 0
        $totalFixedWarnings = 0
        $unfixableButFixable = 0

        foreach ($entry in $Payload.results) {
            $pre = @($entry.PSObject.Properties['preFixMessages'] | ForEach-Object { $_.Value })
            $post = @($entry.PSObject.Properties['postFixMessages'] | ForEach-Object { $_.Value })
            $file = [string]$entry.filePath

            # Index post-fix messages by (ruleId, line, column, message) for O(1)
            # membership. Multiple identical messages are tracked via a count
            # so we still match them one-for-one instead of collapsing them.
            $postIndex = @{}
            foreach ($m in $post) {
                $key = "$(if ($null -eq $m.ruleId) { '<unknown>' } else { [string]$m.ruleId })|$($m.line)|$($m.column)|$([string]$m.message)"
                if (-not $postIndex.ContainsKey($key)) { $postIndex[$key] = 0 }
                $postIndex[$key]++
            }

            $fileFixedErrors = 0
            $fileFixedWarnings = 0
            $fileFixedByRule = [ordered]@{}
            $fileUnfixableButFixable = 0

            foreach ($m in $pre) {
                $ruleId = if ($null -eq $m.ruleId) { '<unknown>' } else { [string]$m.ruleId }
                $key = "$ruleId|$($m.line)|$($m.column)|$([string]$m.message)"

                $matched = $false
                if ($postIndex.ContainsKey($key) -and $postIndex[$key] -gt 0) {
                    $postIndex[$key]--
                    $matched = $true
                }

                if (-not $matched) {
                    # Silenced by --fix.
                    if ($m.severity -eq 2) { $fileFixedErrors++ } elseif ($m.severity -eq 1) { $fileFixedWarnings++ }
                    if (-not $fileFixedByRule.Contains($ruleId)) { $fileFixedByRule[$ruleId] = 0 }
                    $fileFixedByRule[$ruleId]++

                    if (-not $byRuleMap.ContainsKey($ruleId)) {
                        $byRuleMap[$ruleId] = [PSCustomObject]@{
                            ruleId = $ruleId
                            fixedErrorCount = 0
                            fixedWarningCount = 0
                            fileCount = 0
                            files = [System.Collections.Generic.List[string]]::new()
                        }
                    }
                    $rec = $byRuleMap[$ruleId]
                    if ($m.severity -eq 2) { $rec.fixedErrorCount++ } elseif ($m.severity -eq 1) { $rec.fixedWarningCount++ }
                    if (-not $rec.files.Contains($file)) {
                        $rec.files.Add($file)
                        $rec.fileCount++
                    }
                }
                elseif ($m.fixable -eq $true) {
                    # Pre-fix message was fixable but still present after --fix
                    # ran, so the fix could not be safely applied (conflict
                    # with another rule, etc.). Surface this so the LLM knows
                    # the rule fired even though the script did not silence it.
                    $fileUnfixableButFixable++
                }
            }

            $totalFixedErrors += $fileFixedErrors
            $totalFixedWarnings += $fileFixedWarnings
            $unfixableButFixable += $fileUnfixableButFixable

            if ($fileFixedErrors -gt 0 -or $fileFixedWarnings -gt 0) {
                $byFileList.Add([PSCustomObject]@{
                    file = $file
                    fixedErrorCount = $fileFixedErrors
                    fixedWarningCount = $fileFixedWarnings
                    unfixableButFixableCount = $fileUnfixableButFixable
                    fixedByRule = $fileFixedByRule
                })
            }
            elseif ($fileUnfixableButFixable -gt 0) {
                $byFileList.Add([PSCustomObject]@{
                    file = $file
                    fixedErrorCount = 0
                    fixedWarningCount = 0
                    unfixableButFixableCount = $fileUnfixableButFixable
                    fixedByRule = $fileFixedByRule
                })
            }
        }

        $byRuleList = @($byRuleMap.Values | ForEach-Object {
            [PSCustomObject]@{
                ruleId = $_.ruleId
                fixedErrorCount = $_.fixedErrorCount
                fixedWarningCount = $_.fixedWarningCount
                fileCount = $_.fileCount
            }
        } | Sort-Object -Property { $_.fixedErrorCount + $_.fixedWarningCount } -Descending)

        return [PSCustomObject]@{
            fixedErrorCount = $totalFixedErrors
            fixedWarningCount = $totalFixedWarnings
            unfixableButFixableCount = $unfixableButFixable
            byFile = $byFileList.ToArray()
            byRule = $byRuleList
        }
    }

    function ConvertFrom-TscOutput {
        [CmdletBinding()]
        param(
            [Parameter(Mandatory)]
            [string]$Stdout,

            [Parameter(Mandatory)]
            [string]$Stderr,

            [Parameter(Mandatory)]
            [int]$ExitCode,

            [Parameter(Mandatory)]
            [int]$DurationMs
        )

        $diagnostics = [System.Collections.Generic.List[object]]::new()

        # tsc line format:
        #   path/to/file.ts(line,col): error TS2322: Type 'string' is not assignable to type 'number'.
        #   path/to/file.ts(line,col): warning TS6133: 'foo' is declared but its value is never read.
        $pattern = '^(?<file>.+?)\((?<line>\d+),(?<col>\d+)\):\s+(?<severity>error|warning|info)\s+(?<code>TS\d+):\s*(?<message>.*)$'

        $combined = "$Stdout`n$Stderr"
        foreach ($line in ($combined -split "`r?`n")) {
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            $match = [regex]::Match($line, $pattern)
            if ($match.Success) {
                $diagnostics.Add([PSCustomObject]@{
                    file = $match.Groups['file'].Value
                    line = [int]$match.Groups['line'].Value
                    column = [int]$match.Groups['col'].Value
                    code = $match.Groups['code'].Value
                    severity = $match.Groups['severity'].Value
                    message = $match.Groups['message'].Value
                })
            }
        }

        $errorCount = ($diagnostics | Where-Object { $_.severity -eq 'error' }).Count
        $warningCount = ($diagnostics | Where-Object { $_.severity -eq 'warning' }).Count

        return [PSCustomObject]@{
            ran = $true
            passed = $errorCount -eq 0 -and $ExitCode -eq 0
            errorCount = $errorCount
            warningCount = $warningCount
            durationMs = $DurationMs
            exitCode = $ExitCode
            diagnostics = $diagnostics
        }
    }

    function ConvertFrom-VitestJson {
        [CmdletBinding()]
        param(
            [Parameter(Mandatory)]
            [string]$Stdout,

            [Parameter(Mandatory)]
            [string]$Stderr,

            [Parameter(Mandatory)]
            [int]$ExitCode,

            [Parameter(Mandatory)]
            [int]$DurationMs
        )

        $failingTests = [System.Collections.Generic.List[object]]::new()
        $raw = $Stdout.Trim()
        $parsed = $null
        $parseError = $null

        if (-not [string]::IsNullOrWhiteSpace($raw)) {
            try {
                $parsed = $raw | ConvertFrom-Json -ErrorAction Stop
            }
            catch {
                $parseError = $_.Exception.Message
            }
        }

        if ($null -ne $parsed) {
            $numPassed = 0
            $numFailed = 0
            $numSkipped = 0
            $numTotal = 0
            $numTodo = 0
            $success = $true

            # The JSON reporter prints each test file as its own JSON document
            # separated by newlines. We may also receive a single document with
            # a `testResults` array. Handle both.
            $documents = [System.Collections.Generic.List[object]]::new()

            if ($parsed.PSObject.Properties['testResults']) {
                $documents.Add($parsed)
            }
            else {
                # Multiple newline-delimited documents
                foreach ($line in ($raw -split "`r?`n")) {
                    if ([string]::IsNullOrWhiteSpace($line)) { continue }
                    try {
                        $documents.Add(($line | ConvertFrom-Json -ErrorAction Stop))
                    }
                    catch {
                        Write-Verbose "Ignoring non-JSON vitest output line."
                    }
                }
            }

            foreach ($doc in $documents) {
                if ($null -ne $doc.PSObject.Properties['numPassedTests']) { $numPassed += [int]$doc.numPassedTests }
                if ($null -ne $doc.PSObject.Properties['numFailedTests']) { $numFailed += [int]$doc.numFailedTests }
                if ($null -ne $doc.PSObject.Properties['numSkippedTests']) { $numSkipped += [int]$doc.numSkippedTests }
                if ($null -ne $doc.PSObject.Properties['numTotalTests']) { $numTotal += [int]$doc.numTotalTests }
                if ($null -ne $doc.PSObject.Properties['numTodoTests']) { $numTodo += [int]$doc.numTodoTests }
                if ($null -ne $doc.PSObject.Properties['success'] -and -not $doc.success) { $success = $false }

                if ($null -ne $doc.PSObject.Properties['testResults']) {
                    foreach ($fileResult in $doc.testResults) {
                        if ($null -eq $fileResult.PSObject.Properties['assertionResults']) { continue }
                        foreach ($assertion in $fileResult.assertionResults) {
                            if ($assertion.status -eq 'failed') {
                                $ancestorTitles = @()
                                if ($null -ne $assertion.PSObject.Properties['ancestorTitles']) {
                                    $ancestorTitles = @($assertion.ancestorTitles)
                                }
                                $name = ([string[]]$ancestorTitles + [string]$assertion.title) -join ' > '

                                $failureMessages = @()
                                if ($null -ne $assertion.PSObject.Properties['failureMessages']) {
                                    $failureMessages = @($assertion.failureMessages)
                                }

                                $failingTests.Add([PSCustomObject]@{
                                    file = $fileResult.name
                                    name = $name
                                    failureMessages = $failureMessages
                                    durationMs = if ($null -ne $assertion.PSObject.Properties['duration']) { [int]$assertion.duration } else { 0 }
                                })
                            }
                        }
                    }
                }
            }

            $passed = $success -and $numFailed -eq 0

            return [PSCustomObject]@{
                ran = $true
                passed = $passed
                durationMs = $DurationMs
                exitCode = $ExitCode
                totals = [PSCustomObject]@{
                    passed = $numPassed
                    failed = $numFailed
                    skipped = $numSkipped
                    todo = $numTodo
                    total = $numTotal
                }
                failingTests = $failingTests
                parseError = $parseError
            }
        }

        # No JSON. If exit code is 0 and nothing failed, report clean.
        # If exit code is non-zero and we have no JSON, that means vitest never
        # started (e.g. config error). Surface as a single failing test entry
        # so the AI sees something.
        if ($ExitCode -ne 0) {
            $failingTests.Add([PSCustomObject]@{
                file = $null
                name = 'vitest did not produce JSON output'
                failureMessages = @($Stderr)
                durationMs = 0
            })
        }

        return [PSCustomObject]@{
            ran = $true
            passed = $false
            durationMs = $DurationMs
            exitCode = $ExitCode
            totals = [PSCustomObject]@{
                passed = 0
                failed = $failingTests.Count
                skipped = 0
                todo = 0
                total = 0
            }
            failingTests = $failingTests
            parseError = $parseError
        }
    }

    # -------------------------------------------------------------------------
    # Per-workspace runner (runs in a thread job)
    # -------------------------------------------------------------------------

    function Invoke-WorkspaceCheck {
        [CmdletBinding()]
        param(
            [Parameter(Mandatory)]
            [object]$Workspace,

            [Parameter(Mandatory)]
            [string]$TempRoot,

            [Parameter(Mandatory)]
            [bool]$UseFix
        )

        $workspaceTemp = Join-Path $TempRoot $Workspace.Name
        New-Item -ItemType Directory -Path $workspaceTemp -Force | Out-Null

        $result = [PSCustomObject]@{
            name = $Workspace.Name
            type = $Workspace.Type
            path = $Workspace.RelativePath
            lint = $null
            tsc = $null
            test = $null
            error = $null
        }

        try {
            Push-Location $Workspace.Path
            $start = [DateTime]::UtcNow

            # ---- lint ---------------------------------------------------------
            if ($Workspace.HasLint) {

                $shimScript = Join-Path $repoRoot 'scripts/eslint-autofix.mjs'
                $shimFilesJson = ConvertTo-Json -Compress -InputObject @('.')
                $shimOut = & node $shimScript --cwd $Workspace.Path --files $shimFilesJson 2>&1
                $shimExit = $LASTEXITCODE
                $shimMs = [int]([DateTime]::UtcNow - $start).TotalMilliseconds

                $shimStdout = ($shimOut | ForEach-Object { if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.ToString() } else { $_ } }) -join "`n"
                $shimStderr = ''

                # The shim writes a single JSON document on stdout. If we
                # received any non-empty stderr, surface it as a fatal issue
                # but still try to parse whatever stdout we got.
                $autofixPayload = $null
                $shimStdoutText = $shimStdout.Trim()
                if (-not [string]::IsNullOrWhiteSpace($shimStdoutText)) {
                    try {
                        $autofixPayload = $shimStdoutText | ConvertFrom-Json -ErrorAction Stop
                    }
                    catch {
                        $shimStderr = "eslint-autofix shim produced non-JSON output: $($_.Exception.Message)"
                    }
                }
                elseif ($shimExit -ne 0) {
                    $shimStderr = "eslint-autofix shim exited $shimExit with no stdout."
                }

                $autofixSummary = if ($UseFix) { Get-AutofixSummary -Payload $autofixPayload } else { $null }

                $result.lint = ConvertFrom-EslintJson -Stdout $shimStdoutText -Stderr $shimStderr -ExitCode $shimExit -DurationMs $shimMs -AutofixPayload $autofixPayload -AutofixSummary $autofixSummary
            }
            else {
                $result.lint = [PSCustomObject]@{
                    ran = $false
                    passed = $true
                    errorCount = 0
                    warningCount = 0
                    fixableErrorCount = 0
                    fixableWarningCount = 0
                    durationMs = 0
                    exitCode = -1
                    issues = @()
                    autofix = $null
                }
            }

            # ---- tsc ----------------------------------------------------------
            if ($Workspace.HasTsconfig) {
                $tscOut = & pnpm exec tsc --noEmit --pretty false 2>&1
                $tscExit = $LASTEXITCODE
                $tscMs = [int]([DateTime]::UtcNow - $start).TotalMilliseconds

                $tscText = ($tscOut | ForEach-Object { "$_" }) -join "`n"
                $result.tsc = ConvertFrom-TscOutput -Stdout $tscText -Stderr '' -ExitCode $tscExit -DurationMs $tscMs
            }
            else {
                $result.tsc = [PSCustomObject]@{
                    ran = $false
                    passed = $true
                    errorCount = 0
                    warningCount = 0
                    durationMs = 0
                    exitCode = -1
                    diagnostics = @()
                }
            }

            # ---- test ---------------------------------------------------------
            if ($Workspace.HasTest) {

                $testOut = & pnpm exec vitest run --reporter=json --coverage=false 2>&1
                $testExit = $LASTEXITCODE
                $testMs = [int]([DateTime]::UtcNow - $start).TotalMilliseconds

                $testText = ($testOut | ForEach-Object { "$_" }) -join "`n"
                $result.test = ConvertFrom-VitestJson -Stdout $testText -Stderr '' -ExitCode $testExit -DurationMs $testMs
            }
            else {
                $result.test = [PSCustomObject]@{
                    ran = $false
                    passed = $true
                    durationMs = 0
                    exitCode = -1
                    totals = [PSCustomObject]@{ passed = 0; failed = 0; skipped = 0; todo = 0; total = 0 }
                    failingTests = @()
                    parseError = $null
                }
            }
        }
        catch {
            $result.error = $_.Exception.Message
        }
        finally {
            Pop-Location
        }

        return $result
    }

    # Per-workspace thread job. Each job receives an arg bag with the
    # workspace metadata and a temp directory for per-workspace artifacts.
    $jobScript = {
        param($ArgBag)
        $Workspace = $ArgBag.Workspace
        $TempRoot = $ArgBag.TempRoot
        $UseFix = $ArgBag.UseFix
        $TargetFiles = @($ArgBag.TargetFiles)

        # Normalize forward slashes for case-insensitive path comparisons.
        $TargetFilesNormalized = @($TargetFiles | ForEach-Object {
            [System.IO.Path]::GetFullPath($_).Replace('\', '/')
        })

        # Discover sibling test files (same directory) for the target files.
        $siblingTestFiles = [System.Collections.Generic.List[string]]::new()
        foreach ($f in $TargetFiles) {
            $dir = Split-Path -Parent $f
            if ([string]::IsNullOrEmpty($dir) -or -not (Test-Path $dir)) { continue }
            Get-ChildItem -Path $dir -File -Filter '*.test.ts' -ErrorAction SilentlyContinue | ForEach-Object { $siblingTestFiles.Add($_.FullName) }
            Get-ChildItem -Path $dir -File -Filter '*.test.tsx' -ErrorAction SilentlyContinue | ForEach-Object { $siblingTestFiles.Add($_.FullName) }
        }

        # Inline-copy of the parser functions so they are available in the
        # job's runspace.
        function Get-AutofixSummaryLocal {
            param($Payload)
            if ($null -eq $Payload) { return $null }
            if (-not ($Payload.PSObject.Properties['results'])) { return $null }

            $byFileList = [System.Collections.Generic.List[object]]::new()
            $byRuleMap = @{}
            $totalFixedErrors = 0
            $totalFixedWarnings = 0
            $unfixableButFixable = 0

            foreach ($entry in $Payload.results) {
                $pre = @($entry.PSObject.Properties['preFixMessages'] | ForEach-Object { $_.Value })
                $post = @($entry.PSObject.Properties['postFixMessages'] | ForEach-Object { $_.Value })
                $file = [string]$entry.filePath

                $postIndex = @{}
                foreach ($m in $post) {
                    $key = "$(if ($null -eq $m.ruleId) { '<unknown>' } else { [string]$m.ruleId })|$($m.line)|$($m.column)|$([string]$m.message)"
                    if (-not $postIndex.ContainsKey($key)) { $postIndex[$key] = 0 }
                    $postIndex[$key]++
                }

                $fileFixedErrors = 0
                $fileFixedWarnings = 0
                $fileFixedByRule = [ordered]@{}
                $fileUnfixableButFixable = 0

                foreach ($m in $pre) {
                    $ruleId = if ($null -eq $m.ruleId) { '<unknown>' } else { [string]$m.ruleId }
                    $key = "$ruleId|$($m.line)|$($m.column)|$([string]$m.message)"

                    $matched = $false
                    if ($postIndex.ContainsKey($key) -and $postIndex[$key] -gt 0) {
                        $postIndex[$key]--
                        $matched = $true
                    }

                    if (-not $matched) {
                        if ($m.severity -eq 2) { $fileFixedErrors++ } elseif ($m.severity -eq 1) { $fileFixedWarnings++ }
                        if (-not $fileFixedByRule.Contains($ruleId)) { $fileFixedByRule[$ruleId] = 0 }
                        $fileFixedByRule[$ruleId]++

                        if (-not $byRuleMap.ContainsKey($ruleId)) {
                            $byRuleMap[$ruleId] = [PSCustomObject]@{
                                ruleId = $ruleId
                                fixedErrorCount = 0
                                fixedWarningCount = 0
                                fileCount = 0
                                files = [System.Collections.Generic.List[string]]::new()
                            }
                        }
                        $rec = $byRuleMap[$ruleId]
                        if ($m.severity -eq 2) { $rec.fixedErrorCount++ } elseif ($m.severity -eq 1) { $rec.fixedWarningCount++ }
                        if (-not $rec.files.Contains($file)) {
                            $rec.files.Add($file)
                            $rec.fileCount++
                        }
                    }
                    elseif ($m.fixable -eq $true) {
                        $fileUnfixableButFixable++
                    }
                }

                $totalFixedErrors += $fileFixedErrors
                $totalFixedWarnings += $fileFixedWarnings
                $unfixableButFixable += $fileUnfixableButFixable

                if ($fileFixedErrors -gt 0 -or $fileFixedWarnings -gt 0 -or $fileUnfixableButFixable -gt 0) {
                    $byFileList.Add([PSCustomObject]@{
                        file = $file
                        fixedErrorCount = $fileFixedErrors
                        fixedWarningCount = $fileFixedWarnings
                        unfixableButFixableCount = $fileUnfixableButFixable
                        fixedByRule = $fileFixedByRule
                    })
                }
            }

            $byRuleList = @($byRuleMap.Values | ForEach-Object {
                [PSCustomObject]@{
                    ruleId = $_.ruleId
                    fixedErrorCount = $_.fixedErrorCount
                    fixedWarningCount = $_.fixedWarningCount
                    fileCount = $_.fileCount
                }
            } | Sort-Object -Property { $_.fixedErrorCount + $_.fixedWarningCount } -Descending)

            return [PSCustomObject]@{
                fixedErrorCount = $totalFixedErrors
                fixedWarningCount = $totalFixedWarnings
                unfixableButFixableCount = $unfixableButFixable
                byFile = $byFileList.ToArray()
                byRule = $byRuleList
            }
        }

        function ConvertFrom-EslintJsonLocal {
            param($Stdout, $ExitCode, $DurationMs, $AutofixPayload, $AutofixSummary)
            $issues = [System.Collections.Generic.List[object]]::new()
            $raw = $Stdout.Trim()
            if (-not [string]::IsNullOrWhiteSpace($raw)) {
                try {
                    $parsed = $raw | ConvertFrom-Json -ErrorAction Stop
                    if ($null -ne $parsed) {
                        foreach ($file in $parsed) {
                            foreach ($msg in $file.messages) {
                                $issues.Add([PSCustomObject]@{
                                    file = $file.filePath
                                    line = $msg.line
                                    column = $msg.column
                                    endLine = $msg.endLine
                                    endColumn = $msg.endColumn
                                    severity = $msg.severity
                                    ruleId = $msg.ruleId
                                    message = $msg.message
                                    fixable = [bool]$msg.fix
                                })
                            }
                        }
                    }
                }
                catch {
                    $issues.Add([PSCustomObject]@{
                        file = $null; line = 0; column = 0; endLine = 0; endColumn = 0
                        severity = 'fatal'; ruleId = $null
                        message = "Failed to parse eslint JSON output: $($_.Exception.Message)"
                        fixable = $false
                    })
                }
            }
            $errCount = ($issues | Where-Object { $_.severity -eq 2 }).Count
            $warnCount = ($issues | Where-Object { $_.severity -eq 1 }).Count
            $fixErrCount = ($issues | Where-Object { $_.severity -eq 2 -and $_.fixable }).Count
            $fixWarnCount = ($issues | Where-Object { $_.severity -eq 1 -and $_.fixable }).Count
            return [PSCustomObject]@{
                ran = $true
                passed = $errCount -eq 0
                errorCount = $errCount
                warningCount = $warnCount
                fixableErrorCount = $fixErrCount
                fixableWarningCount = $fixWarnCount
                durationMs = $DurationMs
                exitCode = $ExitCode
                issues = $issues
                autofix = $AutofixSummary
            }
        }

        function ConvertFrom-TscOutputLocal {
            param($Stdout, $Stderr, $ExitCode, $DurationMs)
            $diagnostics = [System.Collections.Generic.List[object]]::new()
            $pattern = '^(?<file>.+?)\((?<line>\d+),(?<col>\d+)\):\s+(?<severity>error|warning|info)\s+(?<code>TS\d+):\s*(?<message>.*)$'
            $combined = "$Stdout`n$Stderr"
            foreach ($line in ($combined -split "`r?`n")) {
                if ([string]::IsNullOrWhiteSpace($line)) { continue }
                $m = [regex]::Match($line, $pattern)
                if ($m.Success) {
                    $diagnostics.Add([PSCustomObject]@{
                        file = $m.Groups['file'].Value
                        line = [int]$m.Groups['line'].Value
                        column = [int]$m.Groups['col'].Value
                        code = $m.Groups['code'].Value
                        severity = $m.Groups['severity'].Value
                        message = $m.Groups['message'].Value
                    })
                }
            }
            $errCount = ($diagnostics | Where-Object { $_.severity -eq 'error' }).Count
            $warnCount = ($diagnostics | Where-Object { $_.severity -eq 'warning' }).Count
            return [PSCustomObject]@{
                ran = $true
                passed = $errCount -eq 0 -and $ExitCode -eq 0
                errorCount = $errCount
                warningCount = $warnCount
                durationMs = $DurationMs
                exitCode = $ExitCode
                diagnostics = $diagnostics
            }
        }

        function ConvertFrom-VitestJsonLocal {
            param($Stdout, $Stderr, $ExitCode, $DurationMs)
            $failingTests = [System.Collections.Generic.List[object]]::new()
            $raw = $Stdout.Trim()
            $parsed = $null
            $parseError = $null
            if (-not [string]::IsNullOrWhiteSpace($raw)) {
                try { $parsed = $raw | ConvertFrom-Json -ErrorAction Stop }
                catch { $parseError = $_.Exception.Message }
            }

            if ($null -ne $parsed) {
                $numPassed = 0; $numFailed = 0; $numSkipped = 0; $numTotal = 0; $numTodo = 0
                $success = $true
                $documents = [System.Collections.Generic.List[object]]::new()
                if ($parsed.PSObject.Properties['testResults']) {
                    $documents.Add($parsed)
                }
                else {
                    foreach ($line in ($raw -split "`r?`n")) {
                        if ([string]::IsNullOrWhiteSpace($line)) { continue }
                        try { $documents.Add(($line | ConvertFrom-Json -ErrorAction Stop)) }
                        catch { Write-Verbose "Ignoring non-JSON vitest output line." }
                    }
                }
                foreach ($doc in $documents) {
                    if ($null -ne $doc.PSObject.Properties['numPassedTests']) { $numPassed += [int]$doc.numPassedTests }
                    if ($null -ne $doc.PSObject.Properties['numFailedTests']) { $numFailed += [int]$doc.numFailedTests }
                    if ($null -ne $doc.PSObject.Properties['numSkippedTests']) { $numSkipped += [int]$doc.numSkippedTests }
                    if ($null -ne $doc.PSObject.Properties['numTotalTests']) { $numTotal += [int]$doc.numTotalTests }
                    if ($null -ne $doc.PSObject.Properties['numTodoTests']) { $numTodo += [int]$doc.numTodoTests }
                    if ($null -ne $doc.PSObject.Properties['success'] -and -not $doc.success) { $success = $false }

                    if ($null -ne $doc.PSObject.Properties['testResults']) {
                        foreach ($fileResult in $doc.testResults) {
                            if ($null -eq $fileResult.PSObject.Properties['assertionResults']) { continue }
                            foreach ($assertion in $fileResult.assertionResults) {
                                if ($assertion.status -eq 'failed') {
                                    $ancestors = @()
                                    if ($null -ne $assertion.PSObject.Properties['ancestorTitles']) { $ancestors = @($assertion.ancestorTitles) }
                                    $name = ([string[]]$ancestors + [string]$assertion.title) -join ' > '
                                    $msgs = @()
                                    if ($null -ne $assertion.PSObject.Properties['failureMessages']) { $msgs = @($assertion.failureMessages) }
                                    $failingTests.Add([PSCustomObject]@{
                                        file = $fileResult.name
                                        name = $name
                                        failureMessages = $msgs
                                        durationMs = if ($null -ne $assertion.PSObject.Properties['duration']) { [int]$assertion.duration } else { 0 }
                                    })
                                }
                            }
                        }
                    }
                }
                return [PSCustomObject]@{
                    ran = $true
                    passed = $success -and $numFailed -eq 0
                    durationMs = $DurationMs
                    exitCode = $ExitCode
                    totals = [PSCustomObject]@{
                        passed = $numPassed; failed = $numFailed; skipped = $numSkipped; todo = $numTodo; total = $numTotal
                    }
                    failingTests = $failingTests
                    parseError = $parseError
                }
            }

            if ($ExitCode -ne 0) {
                $failingTests.Add([PSCustomObject]@{
                    file = $null
                    name = 'vitest did not produce JSON output'
                    failureMessages = @($Stderr)
                    durationMs = 0
                })
            }
            return [PSCustomObject]@{
                ran = $true
                passed = $false
                durationMs = $DurationMs
                exitCode = $ExitCode
                totals = [PSCustomObject]@{ passed = 0; failed = $failingTests.Count; skipped = 0; todo = 0; total = 0 }
                failingTests = $failingTests
                parseError = $parseError
            }
        }

        $workspaceTemp = Join-Path $TempRoot $Workspace.Name
        New-Item -ItemType Directory -Path $workspaceTemp -Force | Out-Null

        $result = [PSCustomObject]@{
            name = $Workspace.Name
            type = $Workspace.Type
            path = $Workspace.RelativePath
            lint = $null
            tsc = $null
            test = $null
            error = $null
        }

        try {
            Push-Location $Workspace.Path

            if ($Workspace.HasLint) {
                $lintStart = [DateTime]::UtcNow
                $shimScriptInner = Join-Path $ArgBag.RepoRoot 'scripts/eslint-autofix.mjs'
                if ($TargetFiles.Count -gt 0) {
                    # Convert absolute paths to workspace-relative POSIX paths
                    # so the shim can resolve them under --cwd.
                    $shimFilesList = @()
                    foreach ($tf in $TargetFiles) {
                        $rel = $tf.Substring($Workspace.Path.Length).TrimStart([System.IO.Path]::DirectorySeparatorChar, '/')
                        $rel = $rel.Replace('\', '/')
                        $shimFilesList += $rel
                    }
                }
                else {
                    $shimFilesList = @('.')
                }
                $shimFilesJson = ConvertTo-Json -Compress -InputObject @($shimFilesList)
                $shimOut = & node $shimScriptInner --cwd $Workspace.Path --files $shimFilesJson 2>&1
                $shimExit = $LASTEXITCODE
                $shimMs = [int]([DateTime]::UtcNow - $lintStart).TotalMilliseconds
                $shimText = ($shimOut | ForEach-Object { "$_" }) -join "`n"
                $shimTextTrim = $shimText.Trim()
                $shimStderr = ''
                $autofixPayload = $null
                if (-not [string]::IsNullOrWhiteSpace($shimTextTrim)) {
                    try {
                        $autofixPayload = $shimTextTrim | ConvertFrom-Json -ErrorAction Stop
                    }
                    catch {
                        $shimStderr = "eslint-autofix shim produced non-JSON output: $($_.Exception.Message)"
                    }
                }
                elseif ($shimExit -ne 0) {
                    $shimStderr = "eslint-autofix shim exited $shimExit with no stdout."
                }
                $autofixSummary = if ($UseFix) { Get-AutofixSummaryLocal -Payload $autofixPayload } else { $null }
                $result.lint = ConvertFrom-EslintJsonLocal -Stdout $shimTextTrim -ExitCode $shimExit -DurationMs $shimMs -AutofixPayload $autofixPayload -AutofixSummary $autofixSummary
            }
            else {
                $result.lint = [PSCustomObject]@{
                    ran = $false
                    passed = $true
                    errorCount = 0
                    warningCount = 0
                    fixableErrorCount = 0
                    fixableWarningCount = 0
                    durationMs = 0
                    exitCode = -1
                    issues = @()
                }
            }

            if ($Workspace.HasTsconfig) {
                $tscStart = [DateTime]::UtcNow
                $tscOut = & pnpm exec tsc --noEmit --pretty false 2>&1
                $tscExit = $LASTEXITCODE
                $tscMs = [int]([DateTime]::UtcNow - $tscStart).TotalMilliseconds
                $tscText = ($tscOut | ForEach-Object { "$_" }) -join "`n"
                $tscResult = ConvertFrom-TscOutputLocal -Stdout $tscText -Stderr '' -ExitCode $tscExit -DurationMs $tscMs

                # When targeting specific files, filter the diagnostics list to
                # only those whose file matches a target. Counts still reflect
                # the whole workspace.
                if ($TargetFiles.Count -gt 0) {
                    $filtered = @()
                    foreach ($d in $tscResult.diagnostics) {
                        $dFile = $d.file.Replace('\', '/')
                        # tsc reports paths relative to the workspace cwd; try
                        # matching either as-is or joined onto the workspace
                        # path.
                        $candidateAbs = if ([System.IO.Path]::IsPathRooted($dFile)) {
                            $dFile
                        }
                        else {
                            ([System.IO.Path]::GetFullPath((Join-Path $Workspace.Path $dFile))).Replace('\', '/')
                        }
                        if ($TargetFilesNormalized -contains $candidateAbs) {
                            $filtered += $d
                        }
                    }
                    $tscResult | Add-Member -NotePropertyName diagnostics -NotePropertyValue $filtered -Force
                    $tscResult | Add-Member -NotePropertyName scopedDiagnostics -NotePropertyValue $true -Force
                }
                else {
                    $tscResult | Add-Member -NotePropertyName scopedDiagnostics -NotePropertyValue $false -Force
                }
                $result.tsc = $tscResult
            }
            else {
                $result.tsc = [PSCustomObject]@{
                    ran = $false
                    passed = $true
                    errorCount = 0
                    warningCount = 0
                    durationMs = 0
                    exitCode = -1
                    diagnostics = @()
                    scopedDiagnostics = $false
                }
            }

            if ($Workspace.HasTest) {
                $testStart = [DateTime]::UtcNow
                $resolvedTestFiles = @($siblingTestFiles | Select-Object -Unique)
                $testScoped = $false
                if ($TargetFiles.Count -gt 0) {
                    if ($resolvedTestFiles.Count -gt 0) {
                        # Build paths relative to the workspace cwd so the
                        # caller's positional args make sense to vitest.
                        $relTestFiles = @()
                        foreach ($tf in $resolvedTestFiles) {
                            $rel = $tf.Substring($Workspace.Path.Length).TrimStart([System.IO.Path]::DirectorySeparatorChar, '/')
                            $relTestFiles += $rel
                        }
                        $testArgs = @('run', '--reporter=json', '--coverage=false') + $relTestFiles
                        $testOut = & pnpm exec vitest @testArgs 2>&1
                        $testExit = $LASTEXITCODE
                        $testText = ($testOut | ForEach-Object { "$_" }) -join "`n"
                        $testResult = ConvertFrom-VitestJsonLocal -Stdout $testText -Stderr '' -ExitCode $testExit -DurationMs 0
                        $testResult | Add-Member -NotePropertyName scopedToTestFiles -NotePropertyValue $relTestFiles -Force
                        $testResult | Add-Member -NotePropertyName ranFullWorkspace -NotePropertyValue $false -Force
                        $testResult.durationMs = [int]([DateTime]::UtcNow - $testStart).TotalMilliseconds
                        $result.test = $testResult
                        $testScoped = $true
                    }
                }
                if (-not $testScoped) {
                    $testOut = & pnpm exec vitest run --reporter=json --coverage=false 2>&1
                    $testExit = $LASTEXITCODE
                    $testMs = [int]([DateTime]::UtcNow - $testStart).TotalMilliseconds
                    $testText = ($testOut | ForEach-Object { "$_" }) -join "`n"
                    $testResult = ConvertFrom-VitestJsonLocal -Stdout $testText -Stderr '' -ExitCode $testExit -DurationMs $testMs
                    $testResult | Add-Member -NotePropertyName scopedToTestFiles -NotePropertyValue @() -Force
                    $testResult | Add-Member -NotePropertyName ranFullWorkspace -NotePropertyValue $true -Force
                    $result.test = $testResult
                }
            }
            else {
                $result.test = [PSCustomObject]@{
                    ran = $false
                    passed = $true
                    durationMs = 0
                    exitCode = -1
                    totals = [PSCustomObject]@{ passed = 0; failed = 0; skipped = 0; todo = 0; total = 0 }
                    failingTests = @()
                    parseError = $null
                    scopedToTestFiles = @()
                    ranFullWorkspace = $false
                }
            }

            # Targeted file metadata in the result so the AI can see what was
            # scoped.
            if ($TargetFiles.Count -gt 0) {
                $relTargetList = @()
                foreach ($tf in $TargetFiles) {
                    $rel = $tf.Substring($Workspace.Path.Length).TrimStart([System.IO.Path]::DirectorySeparatorChar, '/')
                    $relTargetList += $rel
                }
                $result | Add-Member -NotePropertyName targetedFiles -NotePropertyValue $relTargetList -Force
            }
        }
        catch {
            $result.error = $_.Exception.Message
        }
        finally {
            Pop-Location
        }

        return $result
    }

    # -------------------------------------------------------------------------
    # Run all workspaces in parallel
    # -------------------------------------------------------------------------

    $useFix = -not $SkipFix.IsPresent
    $startedAt = [DateTime]::UtcNow

    # Capture the file targets as a serializable list of {name, paths} for the
    # thread job. Each workspace gets only its own files.
    $jobArgs = [System.Collections.Generic.List[object]]::new()
    foreach ($ws in $allWorkspaces) {
        $targets = [string[]]@()
        if ($fileTargetsByWorkspace.ContainsKey($ws.Name)) {
            $targets = @($fileTargetsByWorkspace[$ws.Name])
        }
        $jobArgs.Add([PSCustomObject]@{
            Workspace = $ws
            TempRoot = $tempRoot
            TimeoutSeconds = $TimeoutSeconds
            UseFix = $useFix
            TargetFiles = $targets
            RepoRoot = $repoRoot
        })
    }

    $jobs = [System.Collections.Generic.List[object]]::new()
    foreach ($arg in $jobArgs) {
        while (@(Get-Job -State Running).Count -ge $Throttle) {
            Start-Sleep -Milliseconds 200
        }
        $jobs.Add((Start-ThreadJob -ScriptBlock $jobScript -ArgumentList $arg))
    }

    $workspaceResults = [System.Collections.Generic.List[object]]::new()
    foreach ($job in $jobs) {
        $jobResult = Wait-Job -Job $job -Timeout ($TimeoutSeconds * 3) | Receive-Job -Keep
        Remove-Job -Job $job -Force
        $workspaceResults.Add($jobResult)
    }

    $finishedAt = [DateTime]::UtcNow

    # -------------------------------------------------------------------------
    # Aggregate
    # -------------------------------------------------------------------------

    $summary = [PSCustomObject]@{
        workspaces = @($workspaceResults).Count
        lint = [PSCustomObject]@{
            ran = @($workspaceResults | Where-Object { $null -ne $_.lint -and $_.lint.ran }).Count
            passed = @($workspaceResults | Where-Object { $null -ne $_.lint -and $_.lint.passed }).Count
            failed = @($workspaceResults | Where-Object { $null -ne $_.lint -and $_.lint.ran -and -not $_.lint.passed }).Count
            errorCount = [int](@($workspaceResults | ForEach-Object { if ($null -ne $_.lint) { $_.lint.errorCount } else { 0 } } | Measure-Object -Sum).Sum)
            warningCount = [int](@($workspaceResults | ForEach-Object { if ($null -ne $_.lint) { $_.lint.warningCount } else { 0 } } | Measure-Object -Sum).Sum)
            autofix = [PSCustomObject]@{
                ran = $useFix
                ranInWorkspaces = @($workspaceResults | Where-Object { $null -ne $_.lint -and $null -ne $_.lint.PSObject.Properties['autofix'] -and $null -ne $_.lint.autofix }).Count
                fixedErrorCount = [int](@($workspaceResults | ForEach-Object { if ($null -ne $_.lint -and $null -ne $_.lint.PSObject.Properties['autofix'] -and $null -ne $_.lint.autofix) { $_.lint.autofix.fixedErrorCount } else { 0 } } | Measure-Object -Sum).Sum)
                fixedWarningCount = [int](@($workspaceResults | ForEach-Object { if ($null -ne $_.lint -and $null -ne $_.lint.PSObject.Properties['autofix'] -and $null -ne $_.lint.autofix) { $_.lint.autofix.fixedWarningCount } else { 0 } } | Measure-Object -Sum).Sum)
                byRule = @(
                    $workspaceResults |
                        ForEach-Object { if ($null -ne $_.lint -and $null -ne $_.lint.PSObject.Properties['autofix'] -and $null -ne $_.lint.autofix) { $_.lint.autofix.byRule } else { @() } } |
                        Group-Object -Property ruleId |
                        ForEach-Object {
                            $ruleName = $_.Name
                            $ruleEntries = $_.Group
                            [PSCustomObject]@{
                                ruleId = $ruleName
                                fixedErrorCount = [int](@($ruleEntries | ForEach-Object { $_.fixedErrorCount } | Measure-Object -Sum).Sum)
                                fixedWarningCount = [int](@($ruleEntries | ForEach-Object { $_.fixedWarningCount } | Measure-Object -Sum).Sum)
                                workspaceCount = $ruleEntries.Count
                            }
                        } |
                        Sort-Object -Property @{Expression = { $_.fixedErrorCount + $_.fixedWarningCount }; Descending = $true} |
                        Select-Object -First 10
                )
            }
        }
        tsc = [PSCustomObject]@{
            ran = @($workspaceResults | Where-Object { $null -ne $_.tsc -and $_.tsc.ran }).Count
            passed = @($workspaceResults | Where-Object { $null -ne $_.tsc -and $_.tsc.passed }).Count
            failed = @($workspaceResults | Where-Object { $null -ne $_.tsc -and $_.tsc.ran -and -not $_.tsc.passed }).Count
            errorCount = [int](@($workspaceResults | ForEach-Object { if ($null -ne $_.tsc) { $_.tsc.errorCount } else { 0 } } | Measure-Object -Sum).Sum)
            warningCount = [int](@($workspaceResults | ForEach-Object { if ($null -ne $_.tsc) { $_.tsc.warningCount } else { 0 } } | Measure-Object -Sum).Sum)
        }
        test = [PSCustomObject]@{
            ran = @($workspaceResults | Where-Object { $null -ne $_.test -and $_.test.ran }).Count
            passed = @($workspaceResults | Where-Object { $null -ne $_.test -and $_.test.ran -and $_.test.passed }).Count
            failed = @($workspaceResults | Where-Object { $null -ne $_.test -and $_.test.ran -and -not $_.test.passed }).Count
            failedTestCount = [int](@($workspaceResults | ForEach-Object { if ($null -ne $_.test) { $_.test.failingTests.Count } else { 0 } } | Measure-Object -Sum).Sum)
        }
    }

    $finalResult = [ordered]@{
        startedAt = $startedAt.ToString('o')
        finishedAt = $finishedAt.ToString('o')
        durationMs = [int]($finishedAt - $startedAt).TotalMilliseconds
        exitCode = if ($summary.lint.failed -gt 0 -or $summary.tsc.failed -gt 0 -or $summary.test.failed -gt 0) { 1 } else { 0 }
        summary = $summary
        workspaces = $workspaceResults
    }

    # Only print summary to stderr if there are failures
    if ($summary.lint.failed -gt 0 -or $summary.tsc.failed -gt 0 -or $summary.test.failed -gt 0) {
        $autofixSuffix = if ($useFix) { " | autofix: $($summary.lint.autofix.fixedErrorCount) errors / $($summary.lint.autofix.fixedWarningCount) warnings fixed" } else { '' }
        [Console]::Error.WriteLine("Done. lint: $($summary.lint.errorCount) errors / $($summary.lint.warningCount) warnings across $($summary.lint.failed) workspace(s)$autofixSuffix; tsc: $($summary.tsc.errorCount) errors across $($summary.tsc.failed); test: $($summary.test.failedTestCount) failing across $($summary.test.failed) workspace(s).")
    } else {
        [Console]::Error.WriteLine("All checks passed.")
    }

    # Reserve stdout exclusively for the report document.
    $jsonReport = ConvertTo-Json -InputObject $finalResult -Depth 12
    if ($Format -eq 'Markdown') {
        $renderShim = Join-Path $repoRoot 'scripts/render-check-report.mjs'
        $rendered = $jsonReport | & node $renderShim 2>&1
        $renderExit = $LASTEXITCODE
        if ($renderExit -ne 0) {
            # Shim already wrote the reason to stderr; surface a final note so
            # the LLM doesn't see silent failure. Re-emit the JSON as a
            # fallback so the data isn't lost.
            [Console]::Error.WriteLine("render-check-report.mjs exited $renderExit; falling back to raw JSON on stdout.")
            $jsonReport
        }
        else {
            $rendered
        }
    }
    else {
        $jsonReport
    }
}
finally {
    if (Test-Path $tempRoot) {
        Remove-Item -Path $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
