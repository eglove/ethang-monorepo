# Real-repo integration tests for CI gate scripts.
#
# Each test invokes the script against the actual working copy and asserts
# exit 0. This replaces the equivalent jobs in .github/workflows/vibe-cli.yml
# (which did nothing more than the same invocation) so that `pnpm test` runs
# them as part of the normal CI pipeline via ci.yml.
#
# Scripts whose LOGIC is tested against synthetic fixtures in ci-gates.Tests.ps1
# are re-invoked here against the real repo so a real-world regression is caught.

BeforeAll {
    $Root     = Resolve-Path (Join-Path $PSScriptRoot '..' '..' '..')
    $ToolsDir = Join-Path $Root 'tools'

    function script:Invoke-Gate {
        param([Parameter(Mandatory)][string]$Script)
        $path = Join-Path $script:ToolsDir $Script
        if (-not (Test-Path $path)) { throw "Gate script not found: $path" }
        # Invoke in a child pwsh so one gate's $script: scope can't contaminate the next.
        $out = & pwsh -NoProfile -File $path 2>&1 | Out-String
        return @{ ExitCode = $LASTEXITCODE; Output = $out }
    }
}

# Intentional design: these tests are thin. The gates' logic is covered by
# ci-gates.Tests.ps1 with synthetic fixtures; here we only assert the current
# repo state satisfies each gate.

Describe 'Gate scripts pass against the current repo' {
    BeforeAll {
        $script:ToolsDir = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..' '..' '..')) 'tools'
    }

    It 'check-invoke-claude-migration.ps1' {
        $r = Invoke-Gate 'check-invoke-claude-migration.ps1'
        $r.ExitCode | Should -Be 0 -Because $r.Output
    }

    It 'check-tla-version.ps1' {
        $r = Invoke-Gate 'check-tla-version.ps1'
        $r.ExitCode | Should -Be 0 -Because $r.Output
    }

    It 'check-tla-symbol-parity.ps1 (advisory)' {
        $r = Invoke-Gate 'check-tla-symbol-parity.ps1'
        # Symbol parity is advisory — WARNs but always exits 0
        $r.ExitCode | Should -Be 0 -Because $r.Output
    }

    It 'check-bdd-action-tags.ps1' {
        $r = Invoke-Gate 'check-bdd-action-tags.ps1'
        $r.ExitCode | Should -Be 0 -Because $r.Output
    }

    It 'check-bdd-postconditions.ps1' {
        $r = Invoke-Gate 'check-bdd-postconditions.ps1'
        $r.ExitCode | Should -Be 0 -Because $r.Output
    }

    It 'cascade-order-check.ps1' {
        $r = Invoke-Gate 'cascade-order-check.ps1'
        $r.ExitCode | Should -Be 0 -Because $r.Output
    }

    It 'check-perf-baselines.ps1' {
        $r = Invoke-Gate 'check-perf-baselines.ps1'
        $r.ExitCode | Should -Be 0 -Because $r.Output
    }
}

Describe 'Data-file gates (inline checks)' {
    It 'schema.hash file is present and non-empty' {
        $Root = Resolve-Path (Join-Path $PSScriptRoot '..' '..' '..')
        $hashFile = Join-Path $Root 'bus' 'schema' 'schema.hash'
        $hashFile | Should -Exist
        $content = (Get-Content $hashFile -Raw).Trim()
        $content | Should -Not -BeNullOrEmpty
    }
}

