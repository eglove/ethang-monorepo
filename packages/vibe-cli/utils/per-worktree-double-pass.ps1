function Invoke-PerWorktreeDoublePass {
    <#
    .SYNOPSIS
        Runs pnpm test + pnpm lint in a worktree, requiring two consecutive passes.
        On failure: sends error to Claude for fix, resets consecutive counter, retries.
    .OUTPUTS
        Hashtable: @{ Status = 'passed'|'escalated'; Retries = [int]; LastError = $null|string }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$WorktreePath,
        [Parameter(Mandatory)][string]$Root,
        [int]$MaxDoublePassRetries = 5,
        [Parameter(Mandatory)][string]$Feature
    )

    $wtConsecPasses = 0
    $wtDoublePassRetries = 0
    $lastError = $null

    while ($wtDoublePassRetries -lt $MaxDoublePassRetries) {
        # Run test
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
            $wtConsecPasses = 0
            $wtDoublePassRetries++
            Write-PipelineLog -Message "Double-pass: test failed (retry $wtDoublePassRetries/$MaxDoublePassRetries)" -Root $Root

            if ($wtDoublePassRetries -ge $MaxDoublePassRetries) {
                return @{
                    Status    = 'escalated'
                    Retries   = $wtDoublePassRetries
                    LastError = $lastError
                }
            }

            $fixPrompt = @"
## Double-Pass Test Failure (attempt $wtDoublePassRetries/$MaxDoublePassRetries)

Worktree: $WorktreePath
Feature: $Feature

### Error Output
$testOutput

Fix the failing tests in the worktree.
"@
            Invoke-Claude -Role 'code-writer' -Prompt $fixPrompt -AddDir $WorktreePath
            continue
        }

        # Run lint
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
            $wtConsecPasses = 0
            $wtDoublePassRetries++
            Write-PipelineLog -Message "Double-pass: lint failed (retry $wtDoublePassRetries/$MaxDoublePassRetries)" -Root $Root

            if ($wtDoublePassRetries -ge $MaxDoublePassRetries) {
                return @{
                    Status    = 'escalated'
                    Retries   = $wtDoublePassRetries
                    LastError = $lastError
                }
            }

            $fixPrompt = @"
## Double-Pass Lint Failure (attempt $wtDoublePassRetries/$MaxDoublePassRetries)

Worktree: $WorktreePath
Feature: $Feature

### Error Output
$lintOutput

Fix the lint errors in the worktree.
"@
            Invoke-Claude -Role 'code-writer' -Prompt $fixPrompt -AddDir $WorktreePath
            continue
        }

        # Both passed this iteration
        $wtConsecPasses++
        Write-PipelineLog -Message "Double-pass: consecutive pass $wtConsecPasses/2" -Root $Root

        if ($wtConsecPasses -ge 2) {
            return @{
                Status    = 'passed'
                Retries   = $wtDoublePassRetries
                LastError = $null
            }
        }
    }

    return @{
        Status    = 'escalated'
        Retries   = $wtDoublePassRetries
        LastError = $lastError
    }
}
