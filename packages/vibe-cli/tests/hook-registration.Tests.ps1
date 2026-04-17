BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
}

Describe 'hook-registration: .claude/settings.json' {
    BeforeAll {
        $settingsPath = "$PSScriptRoot/../../../.claude/settings.json"
        $repoRoot = "$PSScriptRoot/../../.."
    }

    It 'Test 1: settings.json parses as valid JSON' {
        $settingsPath | Should -Exist
        { $script:json = Get-Content $settingsPath -Raw | ConvertFrom-Json } | Should -Not -Throw
    }

    It 'Test 2: PreToolUse hook block exists with items' {
        $json = Get-Content $settingsPath -Raw | ConvertFrom-Json
        $json.hooks | Should -Not -BeNullOrEmpty
        $json.hooks.PreToolUse | Should -Not -BeNullOrEmpty
        $json.hooks.PreToolUse.Count | Should -BeGreaterThan 0
    }

    It 'Test 3: es-hook appears at a lower array index than rg-hook (D28 ordering)' {
        $json = Get-Content $settingsPath -Raw | ConvertFrom-Json
        $preToolUse = $json.hooks.PreToolUse

        $esIndex = -1
        $rgIndex = -1

        for ($i = 0; $i -lt $preToolUse.Count; $i++) {
            $entry = $preToolUse[$i]
            # Check matcher field and hooks[].command for es-hook and rg-hook references
            $entryJson = $entry | ConvertTo-Json -Depth 10
            if ($esIndex -eq -1 -and $entryJson -match 'es-hook') {
                $esIndex = $i
            }
            if ($rgIndex -eq -1 -and $entryJson -match 'rg-hook') {
                $rgIndex = $i
            }
        }

        $esIndex | Should -BeGreaterThan -1 -Because 'es-hook entry must exist in PreToolUse array'
        $rgIndex | Should -BeGreaterThan -1 -Because 'rg-hook entry must exist in PreToolUse array'
        $esIndex | Should -BeLessThan $rgIndex -Because 'es-hook must appear before rg-hook (D28 sequential evaluation)'
    }

    It 'Test 4: es-hook entry references all five surface-token matchers' {
        # Surface tokens for es-hook: find, ls, dir, Get-ChildItem, gci
        $scriptPath = "$repoRoot/.claude/hooks/es-hook.ps1"
        $scriptPath | Should -Exist -Because 'es-hook.ps1 must exist for surface-token verification'

        $content = Get-Content $scriptPath -Raw
        $content | Should -Match '\bfind\b'          -Because 'es-hook should handle find'
        $content | Should -Match '\bls\b'            -Because 'es-hook should handle ls'
        $content | Should -Match '\bdir\b'           -Because 'es-hook should handle dir'
        $content | Should -Match 'Get-ChildItem'     -Because 'es-hook should handle Get-ChildItem'
        $content | Should -Match '\bgci\b'           -Because 'es-hook should handle gci'
    }

    It 'Test 5: rg-hook entry references all five surface-token matchers' {
        # Surface tokens for rg-hook: grep, egrep, fgrep, Select-String, sls
        $scriptPath = "$repoRoot/.claude/hooks/rg-hook.ps1"
        $scriptPath | Should -Exist -Because 'rg-hook.ps1 must exist for surface-token verification'

        $content = Get-Content $scriptPath -Raw
        $content | Should -Match '\bgrep\b'          -Because 'rg-hook should handle grep'
        $content | Should -Match '\begrip\b|\begrep\b' -Because 'rg-hook should handle egrep'
        $content | Should -Match '\bfgrep\b'         -Because 'rg-hook should handle fgrep'
        $content | Should -Match 'Select-String'     -Because 'rg-hook should handle Select-String'
        $content | Should -Match '\bsls\b'           -Because 'rg-hook should handle sls'
    }

    It 'Test 6: hook script files exist on disk' {
        $esHookPath = "$repoRoot/.claude/hooks/es-hook.ps1"
        $rgHookPath = "$repoRoot/.claude/hooks/rg-hook.ps1"

        $esHookPath | Should -Exist -Because 'es-hook.ps1 must exist at .claude/hooks/es-hook.ps1'
        $rgHookPath | Should -Exist -Because 'rg-hook.ps1 must exist at .claude/hooks/rg-hook.ps1'
    }

    It 'Test 7 (negative): ordering validator catches rg-hook before es-hook' {
        # Prove the ordering test is non-vacuous by simulating wrong order
        function Test-HookOrdering {
            param([object[]]$HooksArray)
            $esIdx = -1
            $rgIdx = -1
            for ($i = 0; $i -lt $HooksArray.Count; $i++) {
                $j = $HooksArray[$i] | ConvertTo-Json -Depth 10
                if ($esIdx -eq -1 -and $j -match 'es-hook') { $esIdx = $i }
                if ($rgIdx -eq -1 -and $j -match 'rg-hook') { $rgIdx = $i }
            }
            if ($esIdx -eq -1 -or $rgIdx -eq -1) { return 'missing hook' }
            if ($esIdx -lt $rgIdx) { return 'valid order' }
            return 'invalid order'
        }

        # Wrong order: rg-hook before es-hook
        $wrongOrder = @(
            [PSCustomObject]@{ command = 'pwsh -File rg-hook.ps1' },
            [PSCustomObject]@{ command = 'pwsh -File es-hook.ps1' }
        )
        $result = Test-HookOrdering -HooksArray $wrongOrder
        $result | Should -Be 'invalid order' -Because 'validator must detect rg-hook before es-hook as invalid'

        # Correct order: es-hook before rg-hook
        $correctOrder = @(
            [PSCustomObject]@{ command = 'pwsh -File es-hook.ps1' },
            [PSCustomObject]@{ command = 'pwsh -File rg-hook.ps1' }
        )
        $result2 = Test-HookOrdering -HooksArray $correctOrder
        $result2 | Should -Be 'valid order' -Because 'validator must accept es-hook before rg-hook as valid'
    }
}
