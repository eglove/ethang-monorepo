function Invoke-GlobalDoublePass {
    <#
    .SYNOPSIS
        Runs pnpm test + pnpm lint on the feature branch, requiring two consecutive passes.
        Same pattern as per-worktree double-pass but executed at the repo root.
    .OUTPUTS
        Hashtable: @{ Status = 'passed'|'escalated'; Retries = [int]; LastError = $null|string }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$Feature,
        [int]$MaxDoublePassRetries = 5
    )

    $glConsecPasses = 0
    $glDoublePassRetries = 0
    $lastError = $null

    while ($glDoublePassRetries -lt $MaxDoublePassRetries) {
        $testOutput = $null
        try {
            $testOutput = & pnpm test 2>&1 | Out-String
            $testExitCode = $LASTEXITCODE
        }
        catch {
            $testOutput = $_.Exception.Message
            $testExitCode = 1
        }

        if ($testExitCode -ne 0) {
            $lastError = $testOutput
            $glConsecPasses = 0
            $glDoublePassRetries++
            Write-PipelineLog -Message "GlobalDoublePass: test failed (retry $glDoublePassRetries/$MaxDoublePassRetries)" -Root $Root

            if ($glDoublePassRetries -ge $MaxDoublePassRetries) {
                return @{
                    Status    = 'escalated'
                    Retries   = $glDoublePassRetries
                    LastError = $lastError
                }
            }

            $fixPrompt = @"
## Global Double-Pass Test Failure (attempt $glDoublePassRetries/$MaxDoublePassRetries)

Root: $Root
Feature: $Feature

### Error Output
$testOutput

Fix the failing tests on the feature branch.
"@
            Invoke-Claude -Prompt $fixPrompt -AddDir $Root
            continue
        }

        $lintOutput = $null
        try {
            $lintOutput = & pnpm lint 2>&1 | Out-String
            $lintExitCode = $LASTEXITCODE
        }
        catch {
            $lintOutput = $_.Exception.Message
            $lintExitCode = 1
        }

        if ($lintExitCode -ne 0) {
            $lastError = $lintOutput
            $glConsecPasses = 0
            $glDoublePassRetries++
            Write-PipelineLog -Message "GlobalDoublePass: lint failed (retry $glDoublePassRetries/$MaxDoublePassRetries)" -Root $Root

            if ($glDoublePassRetries -ge $MaxDoublePassRetries) {
                return @{
                    Status    = 'escalated'
                    Retries   = $glDoublePassRetries
                    LastError = $lastError
                }
            }

            $fixPrompt = @"
## Global Double-Pass Lint Failure (attempt $glDoublePassRetries/$MaxDoublePassRetries)

Root: $Root
Feature: $Feature

### Error Output
$lintOutput

Fix the lint errors on the feature branch.
"@
            Invoke-Claude -Prompt $fixPrompt -AddDir $Root
            continue
        }

        $glConsecPasses++
        Write-PipelineLog -Message "GlobalDoublePass: consecutive pass $glConsecPasses/2" -Root $Root

        if ($glConsecPasses -ge 2) {
            return @{
                Status    = 'passed'
                Retries   = $glDoublePassRetries
                LastError = $null
            }
        }
    }

    return @{
        Status    = 'escalated'
        Retries   = $glDoublePassRetries
        LastError = $lastError
    }
}
