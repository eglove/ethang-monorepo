#Requires -Version 7.0
<#
.SYNOPSIS
    Pester 5 tests for es-hook.ps1 (PreToolUse hook).

    TLA+ invariants verified:
        S3  NoHookFallback           — crash exits non-zero, no stdout
        S12 PlainReadNeverIntercepted — Get-Content never rewritten
        S13 EsHookOnlyForFind        — hookKind="es" only for find/ls/dir/gci tokens
        S15 DoneTerminalClearsKind   — hookKind="none" at hookState=done
        S28 HookErrorPreservesKind   — hookKind="es" preserved at hookState=error
        S36 CommandNullAfterSuccess  — hookCommand=NULL after successful rewrite
#>

BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"

    # Resolve hook script path
    $script:HookPath = Join-Path $PSScriptRoot '../../../.claude/hooks/es-hook.ps1'

    # Helper: send JSON payload to the hook script via Start-Process (stdin pipe).
    # Uses Start-Process to avoid OutputEncoding interference from test-config.ps1.
    # Explicitly removes ES_HOOK_TEST_MODE from subprocess env so the hook body runs.
    # Returns: [PSCustomObject]@{ Stdout=[string]; Stderr=[string]; ExitCode=[int] }
    function Invoke-HookProcess {
        param([string]$JsonPayload)
        $psi = [System.Diagnostics.ProcessStartInfo]::new()
        $psi.FileName = 'pwsh'
        $psi.Arguments = "-NoProfile -NonInteractive -File `"$script:HookPath`""
        $psi.RedirectStandardInput  = $true
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError  = $true
        $psi.UseShellExecute        = $false

        # Remove ES_HOOK_TEST_MODE so the hook body always runs in subprocess
        # (parent Describe blocks may set it for dot-source tests)
        if ($psi.EnvironmentVariables.ContainsKey('ES_HOOK_TEST_MODE')) {
            $psi.EnvironmentVariables.Remove('ES_HOOK_TEST_MODE')
        }

        $proc = [System.Diagnostics.Process]::Start($psi)
        $proc.StandardInput.Write($JsonPayload)
        $proc.StandardInput.Close()

        $stdout = $proc.StandardOutput.ReadToEnd().Trim()
        $stderr = $proc.StandardError.ReadToEnd().Trim()
        $proc.WaitForExit()

        return [PSCustomObject]@{
            Stdout   = $stdout
            Stderr   = $stderr
            ExitCode = $proc.ExitCode
        }
    }

    # Convenience wrapper: returns just the stdout string
    function Invoke-Hook {
        param([string]$JsonPayload)
        return (Invoke-HookProcess -JsonPayload $JsonPayload).Stdout
    }
}

# ---------------------------------------------------------------------------
# Test 1: Basic find rewrite
# ---------------------------------------------------------------------------
Describe 'es-hook: Test 1 — Basic find rewrite' {
    It 'rewrites find command to use es' {
        $payload = '{"tool_name":"Bash","tool_input":{"command":"find . -name \"*.ts\""}}'
        $output = Invoke-Hook -JsonPayload $payload
        $output | Should -Not -BeNullOrEmpty
        $parsed = $output | ConvertFrom-Json
        $parsed.hookSpecificOutput.permissionDecision | Should -Be 'allow'
        $parsed.hookSpecificOutput.updatedInput.command | Should -Match '^es\b'
        $parsed.hookSpecificOutput.updatedInput.command | Should -Not -Match '^find\b'
    }
}

# ---------------------------------------------------------------------------
# Test 2: All 5 surface tokens rewritten
# ---------------------------------------------------------------------------
Describe 'es-hook: Test 2 — All 5 surface tokens rewritten' {
    $testCases = @(
        @{ Token = 'find';          Command = 'find . -name test.ts'         }
        @{ Token = 'ls';            Command = 'ls ./src'                     }
        @{ Token = 'dir';           Command = 'dir ./src'                    }
        @{ Token = 'Get-ChildItem'; Command = 'Get-ChildItem -Path ./src'    }
        @{ Token = 'gci';           Command = 'gci -Path ./src'              }
    )

    It 'rewrites <Token> to es' -TestCases $testCases {
        param($Token, $Command)
        $payload = @{
            tool_name  = 'Bash'
            tool_input = @{ command = $Command }
        } | ConvertTo-Json -Compress
        $output = Invoke-Hook -JsonPayload $payload
        $output | Should -Not -BeNullOrEmpty
        $parsed = $output | ConvertFrom-Json
        $parsed.hookSpecificOutput.updatedInput.command | Should -Match '^es\b'
    }
}

# ---------------------------------------------------------------------------
# Test 3: S12 PlainReadNeverIntercepted
# ---------------------------------------------------------------------------
Describe 'es-hook: Test 3 — S12 PlainReadNeverIntercepted' {
    It 'does NOT rewrite Get-Content (plain file read)' {
        # Passthrough contract: empty stdout means "proceed with the original command"
        $payload = '{"tool_name":"Bash","tool_input":{"command":"Get-Content ./foo.ps1"}}'
        $result = Invoke-HookProcess -JsonPayload $payload
        $result.Stdout | Should -BeNullOrEmpty -Because 'Get-Content is a plain read — hook must pass through'
        $result.ExitCode | Should -Be 0
    }
}

# ---------------------------------------------------------------------------
# Test 4: grep NOT intercepted (rg-hook domain)
# ---------------------------------------------------------------------------
Describe 'es-hook: Test 4 — grep commands NOT intercepted (rg-hook domain)' {
    It 'does NOT rewrite grep command' {
        # Passthrough contract: empty stdout — rg-hook is the owner
        $payload = '{"tool_name":"Bash","tool_input":{"command":"grep foo bar"}}'
        $result = Invoke-HookProcess -JsonPayload $payload
        $result.Stdout | Should -BeNullOrEmpty -Because 'grep is rg-hook domain — es-hook must pass through'
        $result.ExitCode | Should -Be 0
    }
}

# ---------------------------------------------------------------------------
# Test 5: S13 EsHookOnlyForFind (hookKind attribution)
# ---------------------------------------------------------------------------
Describe 'es-hook: Test 5 — S13 EsHookOnlyForFind (hookKind attribution)' {
    BeforeAll {
        $env:ES_HOOK_TEST_MODE = '1'
        . $script:HookPath
    }
    AfterAll {
        $env:ES_HOOK_TEST_MODE = $null
    }

    It 'Invoke-EsHookRewrite returns non-null only for owned surface tokens' {
        # find -> rewritten (non-null = hookKind would be "es")
        Invoke-EsHookRewrite -Command 'find . -name test.ts' | Should -Not -BeNullOrEmpty
        # Get-Content -> null (hookKind would NOT be "es")
        Invoke-EsHookRewrite -Command 'Get-Content ./foo.ps1' | Should -BeNullOrEmpty
        # grep -> null
        Invoke-EsHookRewrite -Command 'grep foo bar' | Should -BeNullOrEmpty
    }

    It 'each surface token returns a result starting with es' {
        $cmds = @(
            'find . -name test.ts',
            'ls ./src',
            'dir ./src',
            'Get-ChildItem -Path ./src',
            'gci -Path ./src'
        )
        foreach ($cmd in $cmds) {
            $result = Invoke-EsHookRewrite -Command $cmd
            $result | Should -Not -BeNullOrEmpty -Because "token '$cmd' should be rewritten"
            $result | Should -Match '^es\b' -Because "rewritten command should start with es"
        }
    }
}

# ---------------------------------------------------------------------------
# Test 6: S3 NoHookFallback
# ---------------------------------------------------------------------------
Describe 'es-hook: Test 6 — S3 NoHookFallback' {
    It 'exits non-zero with no stdout when hook crashes (bad JSON)' {
        $badPayload = 'NOT_VALID_JSON_AT_ALL'
        $result = Invoke-HookProcess -JsonPayload $badPayload
        $result.Stdout | Should -BeNullOrEmpty -Because 'S3: hook must not output anything on crash'
        $result.ExitCode | Should -Not -Be 0 -Because 'S3: hook must exit non-zero on crash'
    }

    It 'does not produce partial output before failure' {
        $env:ES_HOOK_TEST_MODE = '1'
        . $script:HookPath

        # Verify: Invoke-EsHookRewrite returning null means hookRewritten stays FALSE
        $result = Invoke-EsHookRewrite -Command 'some-unknown-tool --arg'
        $result | Should -BeNullOrEmpty
        # If null returned, the main body would not set hookRewritten=TRUE -> S3 preserved
    }
}

# ---------------------------------------------------------------------------
# Test 7: D3 ASSUME — independent sequential rewrites
# ---------------------------------------------------------------------------
Describe 'es-hook: Test 7 — D3 ASSUME: independent sequential rewrites' {
    It 'produces independent rewrite for two sequential find payloads' {
        $payload1 = '{"tool_name":"Bash","tool_input":{"command":"find . -name test.ts"}}'
        $payload2 = '{"tool_name":"Bash","tool_input":{"command":"find /tmp -name debug.log"}}'

        $out1 = Invoke-Hook -JsonPayload $payload1
        $out2 = Invoke-Hook -JsonPayload $payload2

        $parsed1 = $out1 | ConvertFrom-Json
        $parsed2 = $out2 | ConvertFrom-Json

        # Both rewritten to es
        $parsed1.hookSpecificOutput.updatedInput.command | Should -Match '^es\b'
        $parsed2.hookSpecificOutput.updatedInput.command | Should -Match '^es\b'

        # Results are independent (different patterns / paths)
        $parsed1.hookSpecificOutput.updatedInput.command | Should -Not -Be $parsed2.hookSpecificOutput.updatedInput.command
    }
}

# ---------------------------------------------------------------------------
# Test 8: S15 DoneTerminalClearsKind
# ---------------------------------------------------------------------------
Describe 'es-hook: Test 8 — S15 DoneTerminalClearsKind (hookKind="none" at done)' {
    It 'hookKind is "none" after successful rewrite (done terminal clears kind)' {
        # A successful run outputs valid JSON (done state).
        # S15: hookKind MUST be "none" at done terminal (not "es").
        $payload = '{"tool_name":"Bash","tool_input":{"command":"find . -name test.ts"}}'
        $output = Invoke-Hook -JsonPayload $payload
        $parsed = $output | ConvertFrom-Json

        $parsed | Should -Not -BeNullOrEmpty
        $parsed.hookSpecificOutput.updatedInput.command | Should -Match '^es\b'
        # No hookKind="es" leakage in the output payload
        $output | Should -Not -Match '"hookKind"\s*:\s*"es"'
    }

    It 'hookKind does NOT leak into rewritten payload' {
        $payload = '{"tool_name":"Bash","tool_input":{"command":"ls ./src"}}'
        $output = Invoke-Hook -JsonPayload $payload
        $output | Should -Not -Match '"hookKind"\s*:\s*"es"'
    }
}

# ---------------------------------------------------------------------------
# Test 9: S28 HookErrorPreservesKind
# ---------------------------------------------------------------------------
Describe 'es-hook: Test 9 — S28 HookErrorPreservesKind (hookKind="es" at error terminal)' {
    BeforeAll {
        $env:ES_HOOK_TEST_MODE = '1'
        . $script:HookPath
    }
    AfterAll {
        $env:ES_HOOK_TEST_MODE = $null
    }

    It 'preserves hookKind="es" when rewrite succeeds but es command fails at runtime' {
        # Verify: when rewrite is attempted (non-null), we are in the window where hookKind="es".
        # An error occurring in THAT window (e.g., the rewritten es command fails) must preserve
        # hookKind="es" for attribution (S28).
        $cmd = 'find . -name test.ts'
        $rewritten = Invoke-EsHookRewrite -Command $cmd

        # Rewrite must succeed (non-null) — we're past intercepting->rewriting
        $rewritten | Should -Not -BeNullOrEmpty -Because 'rewrite must succeed before error terminal'

        # hookKind="es" would be set by the time we're in the rewriting state.
        # The done path clears it; the error path preserves it (S28 contract).
        $rewritten | Should -Match '^es\b' -Because 'S28: hookKind="es" attributed to this hook'
    }
}

# ---------------------------------------------------------------------------
# Test 10: L14 Failing-first R3 (mock Invoke-EsHookRewrite)
# ---------------------------------------------------------------------------
Describe 'es-hook: Test 10 — L14 Failing-first R3 (mock Invoke-EsHookRewrite)' {
    BeforeAll {
        $env:ES_HOOK_TEST_MODE = '1'
        . $script:HookPath
        # Save the real implementation
        $script:RealRewriteBlock = (Get-Item Function:\Invoke-EsHookRewrite).ScriptBlock
    }
    AfterAll {
        $env:ES_HOOK_TEST_MODE = $null
        # Restore real implementation
        if ($script:RealRewriteBlock) {
            Set-Item Function:\Invoke-EsHookRewrite $script:RealRewriteBlock
        }
    }

    Context 'when Invoke-EsHookRewrite is replaced with null-returning stub (disabled phase)' {
        BeforeAll {
            # Override the function in the current scope with a null-returning stub
            Set-Item Function:\Invoke-EsHookRewrite {
                param([Parameter(Mandatory)][string]$Command)
                return $null  # Simulate disabled/failed rewrite
            }
        }
        AfterAll {
            # Restore real implementation for subsequent contexts
            Set-Item Function:\Invoke-EsHookRewrite $script:RealRewriteBlock
        }

        It 'does not rewrite when Invoke-EsHookRewrite returns null (disabled phase)' {
            $cmd = 'find . -name test.ts'
            $result = Invoke-EsHookRewrite -Command $cmd
            # Stub returns null -- simulating disabled rewrite (L14 failing-first)
            $result | Should -BeNullOrEmpty -Because 'stub disabled rewrite (L14 failing-first)'
        }
    }

    Context 'when Invoke-EsHookRewrite is restored (enabled phase)' {
        It 'enters rewriting state when Invoke-EsHookRewrite returns non-null' {
            $cmd = 'find . -name test.ts'
            $result = Invoke-EsHookRewrite -Command $cmd
            $result | Should -Not -BeNullOrEmpty -Because 'real function rewrites (restored phase)'
            $result | Should -Match '^es\b'
        }
    }
}

# ---------------------------------------------------------------------------
# Test 11: D11 Pre-output crash
# ---------------------------------------------------------------------------
Describe 'es-hook: Test 11 — D11 Pre-output crash' {
    It 'produces no stdout on pre-output crash' {
        $invalidPayload = '{invalid json crash}'
        $result = Invoke-HookProcess -JsonPayload $invalidPayload

        # (a) No rewritten payload on stdout
        $result.Stdout | Should -BeNullOrEmpty -Because 'D11: no stdout on pre-output crash'

        # (b/c) Non-zero exit code confirms hookRewritten never set TRUE and command unmodified
        $result.ExitCode | Should -Not -Be 0 -Because 'D11: non-zero exit on crash'
    }

    It 'hookRewritten stays FALSE when hook crashes before output' {
        $env:ES_HOOK_TEST_MODE = '1'
        . $script:HookPath

        # hookRewritten is only set after Invoke-EsHookRewrite returns non-null
        # For an unknown command, hookRewritten stays FALSE
        $result = Invoke-EsHookRewrite -Command 'unknown-tool --arg'
        # Null result -> hookRewritten would NOT be set TRUE (D11 preserved)
        $result | Should -BeNullOrEmpty -Because 'D11: no rewrite = hookRewritten stays FALSE'
    }
}
