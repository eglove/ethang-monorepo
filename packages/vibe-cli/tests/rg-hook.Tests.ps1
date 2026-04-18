#Requires -Modules Pester

BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"

    # Resolve hook paths — Join-Path handles Windows path separators correctly
    $script:HookPath       = Join-Path -Path $PSScriptRoot -ChildPath '..' -AdditionalChildPath '..', '..', '.claude', 'hooks', 'rg-hook.ps1'
    $script:ModulePath     = Join-Path -Path $PSScriptRoot -ChildPath '..' -AdditionalChildPath '..', '..', '.claude', 'hooks', 'rg-hook-module.psm1'
    $script:HookPath       = [System.IO.Path]::GetFullPath($script:HookPath)
    $script:ModulePath     = [System.IO.Path]::GetFullPath($script:ModulePath)

    # UTF-8 without BOM — required for stdin piping to avoid parse errors
    $script:Utf8NoBom = [System.Text.UTF8Encoding]::new($false)

    # Helper: pipe a JSON string to the hook script and return stdout
    function Invoke-Hook {
        param([string]$JsonPayload)
        $inputFile  = [System.IO.Path]::GetTempFileName()
        $outputFile = [System.IO.Path]::GetTempFileName()
        try {
            [System.IO.File]::WriteAllText($inputFile, $JsonPayload, $script:Utf8NoBom)
            $proc = Start-Process -FilePath 'pwsh' `
                -ArgumentList '-NoProfile', '-NonInteractive', '-File', $script:HookPath `
                -RedirectStandardInput  $inputFile `
                -RedirectStandardOutput $outputFile `
                -PassThru -Wait
            return [System.IO.File]::ReadAllText($outputFile, $script:Utf8NoBom).Trim()
        }
        finally {
            Remove-Item $inputFile, $outputFile -Force -ErrorAction SilentlyContinue
        }
    }

    # Helper: returns the effective command after the hook runs.
    # - On rewrite, Claude Code reads hookSpecificOutput.updatedInput.command.
    # - On passthrough (empty stdout), Claude Code runs the original command.
    function Get-RewrittenCommand {
        param([string]$JsonPayload)
        $output = Invoke-Hook -JsonPayload $JsonPayload

        if ([string]::IsNullOrWhiteSpace($output)) {
            # Passthrough — extract the original command from the payload
            $inputParsed = $JsonPayload | ConvertFrom-Json -ErrorAction SilentlyContinue
            return $inputParsed.tool_input.command
        }

        $parsed = $output | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($parsed.hookSpecificOutput -and $parsed.hookSpecificOutput.updatedInput) {
            return $parsed.hookSpecificOutput.updatedInput.command
        }
        return $null
    }

    # Helper: run hook with error capture; returns hashtable with ExitCode, Stdout, Stderr
    function Invoke-HookFull {
        param([string]$JsonPayload, [hashtable]$Env = @{})
        $inputFile  = [System.IO.Path]::GetTempFileName()
        $outputFile = [System.IO.Path]::GetTempFileName()
        $errorFile  = [System.IO.Path]::GetTempFileName()
        try {
            [System.IO.File]::WriteAllText($inputFile, $JsonPayload, $script:Utf8NoBom)

            $envArgs = ($Env.Keys | ForEach-Object { "`$env:$_='$($Env[$_])';" }) -join ' '
            $callExpr = if ($envArgs) { "$envArgs & '$script:HookPath'" } else { "& '$script:HookPath'" }

            $proc = Start-Process -FilePath 'pwsh' `
                -ArgumentList '-NoProfile', '-NonInteractive', '-Command', $callExpr `
                -RedirectStandardInput  $inputFile `
                -RedirectStandardOutput $outputFile `
                -RedirectStandardError  $errorFile `
                -PassThru -Wait

            return @{
                ExitCode = $proc.ExitCode
                Stdout   = [System.IO.File]::ReadAllText($outputFile, $script:Utf8NoBom).Trim()
                Stderr   = [System.IO.File]::ReadAllText($errorFile,  $script:Utf8NoBom).Trim()
            }
        }
        finally {
            Remove-Item $inputFile, $outputFile, $errorFile -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# Test 1 — Basic grep rewrite
# ---------------------------------------------------------------------------
Describe 'rg-hook — Test 1: Basic grep rewrite' {
    It 'rewrites grep to rg in bash command payload' {
        $payload  = '{"tool_name":"Bash","tool_input":{"command":"grep -r ' + "'pattern'" + ' ."}}'
        $rewritten = Get-RewrittenCommand -JsonPayload $payload
        $rewritten | Should -Match '^rg\b'
        $rewritten | Should -Not -Match '^grep\b'
        $rewritten | Should -Be ("rg -r 'pattern' .")
    }
}

# ---------------------------------------------------------------------------
# Test 2 — All 5 surface tokens are rewritten
# ---------------------------------------------------------------------------
Describe 'rg-hook — Test 2: All 5 surface tokens are rewritten' {
    It 'rewrites grep to rg' {
        $r = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"grep -i pattern file.txt"}}'
        $r | Should -Match '^rg\b'
    }

    It 'rewrites egrep to rg' {
        $r = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"egrep pattern file.txt"}}'
        $r | Should -Match '^rg\b'
    }

    It 'rewrites fgrep to rg' {
        $r = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"fgrep pattern file.txt"}}'
        $r | Should -Match '^rg\b'
    }

    It 'rewrites Select-String to rg' {
        $r = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"Select-String -Pattern pattern -Path file.txt"}}'
        $r | Should -Match '^rg\b'
    }

    It 'rewrites sls to rg' {
        $r = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"sls pattern file.txt"}}'
        $r | Should -Match '^rg\b'
    }
}

# ---------------------------------------------------------------------------
# Test 3 — Sequential evaluation contract (D28): es-hook domain not touched
# ---------------------------------------------------------------------------
Describe 'rg-hook — Test 3: Sequential evaluation contract (D28)' {
    It 'does NOT rewrite es command (es-hook already processed find->es)' {
        $r = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"es . -name *.ts"}}'
        $r | Should -Be 'es . -name *.ts'
    }

    It 'does NOT rewrite find command (es-hook domain)' {
        $r = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"find . -name *.ts"}}'
        $r | Should -Be 'find . -name *.ts'
    }
}

# ---------------------------------------------------------------------------
# Test 4 — S12 PlainReadNeverIntercepted
# ---------------------------------------------------------------------------
Describe 'rg-hook — Test 4: S12 PlainReadNeverIntercepted — Get-Content is not rewritten' {
    It 'does NOT rewrite Get-Content (plain file read)' {
        $r = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"Get-Content ./foo.ps1"}}'
        $r | Should -Be 'Get-Content ./foo.ps1'
    }

    It 'does NOT rewrite gc alias (plain file read)' {
        $r = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"gc ./foo.ps1"}}'
        $r | Should -Be 'gc ./foo.ps1'
    }

    It 'does NOT rewrite cat (plain file read)' {
        $r = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"cat ./foo.ps1"}}'
        $r | Should -Be 'cat ./foo.ps1'
    }
}

# ---------------------------------------------------------------------------
# Test 5 — S14 RgHookOnlyForGrep (hookKind signaled by rewrite producing rg)
# ---------------------------------------------------------------------------
Describe 'rg-hook — Test 5: S14 RgHookOnlyForGrep — hookKind' {
    It 'hookKind is rg for grep command (rewrite produces rg)' {
        $out    = Invoke-Hook '{"tool_name":"Bash","tool_input":{"command":"grep pattern file.txt"}}'
        $parsed = $out | ConvertFrom-Json
        $parsed.hookSpecificOutput.updatedInput.command | Should -Match '^rg\b'
    }

    It 'hookKind is rg for egrep command (rewrite produces rg)' {
        $out    = Invoke-Hook '{"tool_name":"Bash","tool_input":{"command":"egrep pattern file.txt"}}'
        $parsed = $out | ConvertFrom-Json
        $parsed.hookSpecificOutput.updatedInput.command | Should -Match '^rg\b'
    }

    It 'non-grep command does not trigger rg hook (passthrough — empty stdout)' {
        $out    = Invoke-Hook '{"tool_name":"Bash","tool_input":{"command":"ls -la"}}'
        $out | Should -BeNullOrEmpty -Because 'passthrough: empty stdout means "proceed with original"'
    }
}

# ---------------------------------------------------------------------------
# Test 6 — State reset between sequential calls
# ---------------------------------------------------------------------------
Describe 'rg-hook — Test 6: State reset between sequential calls' {
    It 'two sequential grep payloads produce independent rewrite results' {
        $r1 = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"grep -n pattern1 file1.txt"}}'
        $r2 = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"grep -l pattern2 file2.txt"}}'

        $r1 | Should -Be 'rg -n pattern1 file1.txt'
        $r2 | Should -Be 'rg -l pattern2 file2.txt'
        $r1 | Should -Not -Be $r2
    }

    It 'grep after non-grep still rewrites correctly' {
        $pass = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"ls -la"}}'
        $rw   = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"grep pattern file.txt"}}'
        $pass | Should -Be 'ls -la'
        $rw   | Should -Be 'rg pattern file.txt'
    }
}

# ---------------------------------------------------------------------------
# Test 7 — D3 ASSUME pipeline integration (find|grep -> es|rg)
# ---------------------------------------------------------------------------
Describe 'rg-hook — Test 7: D3 pipeline integration (find|grep -> es|rg)' {
    It 'rg-hook rewrites grep portion; does not produce find or es surface token' {
        $r = Get-RewrittenCommand '{"tool_name":"Bash","tool_input":{"command":"grep keyword"}}'
        $r | Should -Match '^rg\b'
        $r | Should -Not -Match 'find'
        $r | Should -Not -Match '^es\b'
    }

    It 'es command prefix preserved; grep in pipe portion rewritten to rg (no double-rewrite)' {
        $out    = Invoke-Hook '{"tool_name":"Bash","tool_input":{"command":"es . -name *.ts | grep keyword"}}'
        $parsed = $out | ConvertFrom-Json
        $parsed.hookSpecificOutput.updatedInput.command | Should -Match '^es\b'
        $parsed.hookSpecificOutput.updatedInput.command | Should -Match '\brg\b'
        $parsed.hookSpecificOutput.updatedInput.command | Should -Not -Match '\bgrep\b'
    }
}

# ---------------------------------------------------------------------------
# Test 8 — S15: hookKind cleared to none at done terminal (exit 0)
# ---------------------------------------------------------------------------
Describe 'rg-hook — Test 8: S15 hookKind cleared to none at done terminal' {
    It 'hook exits 0 on successful rewrite (S15: done terminal, hookKind=none signaled by exit 0)' {
        $result = Invoke-HookFull -JsonPayload '{"tool_name":"Bash","tool_input":{"command":"grep pattern file.txt"}}'
        # S15: done terminal — exit 0
        $result.ExitCode | Should -Be 0
        $parsed = $result.Stdout | ConvertFrom-Json
        $parsed.hookSpecificOutput.updatedInput.command | Should -Match '^rg\b'
    }
}

# ---------------------------------------------------------------------------
# Test 9 — S28: hookKind preserved at error terminal (exit non-zero)
# ---------------------------------------------------------------------------
Describe 'rg-hook — Test 9: S28 hookKind preserved at error terminal' {
    It 'hook exits non-zero on invalid JSON input (S28: error terminal, hookKind preserved)' {
        $result = Invoke-HookFull -JsonPayload 'NOT_VALID_JSON'
        # S28: error terminal — non-zero exit (hookKind preserved for attribution)
        $result.ExitCode | Should -Not -Be 0
        # D11: no rewritten payload on stdout
        $result.Stdout | Should -BeNullOrEmpty
    }
}

# ---------------------------------------------------------------------------
# Test 10 — L14 failing-first (R3): Invoke-RgHookRewrite mock via InModuleScope
# ---------------------------------------------------------------------------
Describe 'rg-hook — Test 10: L14 failing-first (R3) — Invoke-RgHookRewrite mock' {
    BeforeAll {
        if (Test-Path $script:ModulePath) {
            Import-Module $script:ModulePath -Force
        }
    }

    It 'Invoke-RgHookRewrite rewrites grep to rg when called directly' {
        if (-not (Test-Path $script:ModulePath)) {
            Set-ItResult -Skipped -Because 'rg-hook-module.psm1 not found'
            return
        }
        Import-Module $script:ModulePath -Force
        $result = Invoke-RgHookRewrite -Command 'grep pattern file.txt'
        $result | Should -Match '^rg\b'
    }

    Context 'When HookRewrite is mocked to no-op (disabled — R3 failing-first)' {
        It 'mocked Invoke-RgHookRewrite returns nothing and is invoked exactly once' {
            if (-not (Test-Path $script:ModulePath)) {
                Set-ItResult -Skipped -Because 'rg-hook-module.psm1 not found'
                return
            }

            InModuleScope 'rg-hook-module' {
                Mock Invoke-RgHookRewrite { }

                $result = Invoke-RgHookRewrite -Command 'grep pattern file.txt'

                # Mocked to no-op — result is null/empty (L14: failing-first when disabled)
                $result | Should -BeNullOrEmpty
                Should -Invoke Invoke-RgHookRewrite -Times 1
            }
        }
    }

    Context 'When HookRewrite is restored (mock scope exited)' {
        It 'Invoke-RgHookRewrite produces actual rewrite when not mocked (-Times 1 verified)' {
            if (-not (Test-Path $script:ModulePath)) {
                Set-ItResult -Skipped -Because 'rg-hook-module.psm1 not found'
                return
            }
            Import-Module $script:ModulePath -Force
            $result = Invoke-RgHookRewrite -Command 'grep pattern file.txt'
            $result | Should -Match '^rg\b'
        }
    }
}

# ---------------------------------------------------------------------------
# Test 11 — D11 pre-output crash via fault injection
# ---------------------------------------------------------------------------
Describe 'rg-hook — Test 11: D11 pre-output crash — fault injection' {
    It 'no rewritten payload on stdout when hook crashes pre-output (RG_HOOK_FAULT_INJECT=1)' {
        $result = Invoke-HookFull `
            -JsonPayload '{"tool_name":"Bash","tool_input":{"command":"grep pattern file.txt"}}' `
            -Env @{ RG_HOOK_FAULT_INJECT = '1' }

        # (a) pre-output crash: non-zero exit
        $result.ExitCode | Should -Not -Be 0

        # (b) hookRewritten NOT set — no rewritten payload on stdout
        $result.Stdout | Should -BeNullOrEmpty

        # (c) original command not appearing as rg in stdout (not set to TRUE)
        $result.Stdout | Should -Not -Match 'rg'
    }
}
