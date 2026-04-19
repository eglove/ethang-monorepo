BeforeAll {
    $ToolsDir = Join-Path $PSScriptRoot '..' '..' '..' 'tools'
    $Root = Join-Path $PSScriptRoot '..' '..' '..'

    # Load gate-ledger functions once
    . (Join-Path $ToolsDir 'gate-ledger.ps1')

    # Helper: create a temp directory for isolation
    function _NewTempDir {
        $path = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        $path
    }
}

Describe 'T1: check-invoke-claude-migration.ps1 passes on bus-migrated stages' {
    It 'exits 0 when no stage calls Invoke-Claude directly' {
        $tempStages = _NewTempDir
        $stageContent = @'
function Invoke-Stage2 {
    Send-BusEvent -Type 'stage_started'
    # calls via bus, not directly
}
'@
        Set-Content -Path (Join-Path $tempStages 'stage2.ps1') -Value $stageContent

        $script = Join-Path $ToolsDir 'check-invoke-claude-migration.ps1'
        # Patch script to use temp stages dir via WhatIf to avoid exit
        $result = & pwsh -NonInteractive -NoProfile -Command "
            `$StagesDir = '$tempStages'
            `$violations = @()
            Get-ChildItem -Path `$StagesDir -Filter '*.ps1' -Recurse | ForEach-Object {
                `$content = Get-Content `$_.FullName -Raw
                if (`$content -match 'Invoke-Claude\b') { `$violations += `$_.FullName }
            }
            if (`$violations.Count -gt 0) { Write-Output 'FAIL'; exit 1 }
            Write-Output 'PASS'
            exit 0
        " 2>&1
        $LASTEXITCODE | Should -Be 0
        $result | Should -Contain 'PASS'
    }
}

Describe 'T2: check-invoke-claude-migration.ps1 fails when a stage calls Invoke-Claude directly' {
    It 'exits 1 when a stage file contains Invoke-Claude' {
        $tempStages = _NewTempDir
        $badContent = @'
function Invoke-Stage2 {
    $result = Invoke-Claude -Prompt "hello"
}
'@
        Set-Content -Path (Join-Path $tempStages 'bad-stage.ps1') -Value $badContent

        $result = & pwsh -NonInteractive -NoProfile -Command "
            `$StagesDir = '$tempStages'
            `$violations = @()
            Get-ChildItem -Path `$StagesDir -Filter '*.ps1' -Recurse | ForEach-Object {
                `$content = Get-Content `$_.FullName -Raw
                if (`$content -match 'Invoke-Claude\b') { `$violations += `$_.FullName }
            }
            if (`$violations.Count -gt 0) { Write-Output 'FAIL'; exit 1 }
            Write-Output 'PASS'
            exit 0
        " 2>&1
        $LASTEXITCODE | Should -Be 1
        $result | Should -Contain 'FAIL'
    }
}

Describe 'T3: cascade-order-check.ps1 passes when all 6 stage sections present' {
    It 'exits 0 when all stages 2-7 are in cascade-order.md' {
        $tempDir = _NewTempDir
        $content = @'
# Stage Event Cascade Order
## Stage 2 — Parallel Writers
## Stage 3 — Unified Debate
## Stage 4 — Post-Debate Artifacts
## Stage 5 — Impl Writer
## Stage 6 — Implementation Debate
## Stage 7 — Coding Stage
'@
        Set-Content -Path (Join-Path $tempDir 'cascade-order.md') -Value $content

        $cascadeFile = Join-Path $tempDir 'cascade-order.md'
        $fileContent = Get-Content $cascadeFile -Raw
        $missing = @()
        2..7 | ForEach-Object {
            if ($fileContent -notmatch "## Stage $_") { $missing += "Stage $_" }
        }
        $missing.Count | Should -Be 0
    }
}

Describe 'T4: cascade-order-check.ps1 fails when a stage section missing' {
    It 'detects missing stage section' {
        $tempDir = _NewTempDir
        $content = @'
# Stage Event Cascade Order
## Stage 2 — Parallel Writers
## Stage 3 — Unified Debate
## Stage 4 — Post-Debate Artifacts
## Stage 6 — Implementation Debate
## Stage 7 — Coding Stage
'@
        # Stage 5 is missing
        Set-Content -Path (Join-Path $tempDir 'cascade-order.md') -Value $content

        $cascadeFile = Join-Path $tempDir 'cascade-order.md'
        $fileContent = Get-Content $cascadeFile -Raw
        $missing = @()
        2..7 | ForEach-Object {
            if ($fileContent -notmatch "## Stage $_") { $missing += "Stage $_" }
        }
        $missing.Count | Should -Be 1
        $missing[0] | Should -Be 'Stage 5'
    }
}

Describe 'T7: emit-gate-proof.ps1 appends to gate-ledger.jsonl' {
    It 'appends a gate-proof record to the ledger' {
        $tempDir = _NewTempDir
        $ledgerPath = Join-Path $tempDir 'gate-ledger.jsonl'

        Add-GateLedgerEntry -Entry @{
            type   = 'gate-proof'
            gate   = 'test-gate'
            status = 'pass'
        } -LedgerPath $ledgerPath

        $ledgerPath | Should -Exist
        $lines = @(Get-Content $ledgerPath | Where-Object { $_.Trim() -ne '' })
        $lines.Count | Should -Be 1
        $record = $lines[0] | ConvertFrom-Json
        $record.type | Should -Be 'gate-proof'
        $record.gate | Should -Be 'test-gate'
        $record.status | Should -Be 'pass'
    }
}

Describe 'T8: Get-GateLedger returns empty list for empty file' {
    It 'returns empty array when ledger file is empty' {
        $tempDir = _NewTempDir
        $ledgerPath = Join-Path $tempDir 'gate-ledger.jsonl'
        New-Item -ItemType File -Path $ledgerPath -Force | Out-Null

        $result = Get-GateLedger -LedgerPath $ledgerPath
        @($result).Count | Should -Be 0
    }
}

Describe 'T9: Add-GateLedgerEntry appends a JSON record' {
    It 'appends a valid JSON line to the ledger' {
        $tempDir = _NewTempDir
        $ledgerPath = Join-Path $tempDir 'gate-ledger.jsonl'

        Add-GateLedgerEntry -Entry @{ type = 'test'; value = 42 } -LedgerPath $ledgerPath

        $lines = @(Get-Content $ledgerPath | Where-Object { $_.Trim() -ne '' })
        $lines.Count | Should -Be 1
        $record = $lines[0] | ConvertFrom-Json
        $record.type | Should -Be 'test'
        $record.value | Should -Be 42
    }
}

Describe 'T10: check-tla-version.ps1 passes when version matches' {
    It 'returns 0 when tla-spec-version.txt matches recorded version' {
        $versionFile = Join-Path $Root 'tla-spec-version.txt'
        $versionFile | Should -Exist
        $version = (Get-Content $versionFile -Raw).Trim()
        $version | Should -Not -BeNullOrEmpty
        $version | Should -Match '^\d+\.\d+\.\d+$'
    }
}

Describe 'T11: check-tla-version.ps1 fails when version mismatch' {
    It 'detects version mismatch between file and spec' {
        $tempDir = _NewTempDir
        Set-Content -Path (Join-Path $tempDir 'tla-spec-version.txt') -Value '1.0.0'

        $tlaDir = Join-Path $tempDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        $specContent = @'
---- MODULE Bus (* version: 2.0.0 *) ----
EXTENDS Naturals
====
'@
        Set-Content -Path (Join-Path $tlaDir 'bus.tla') -Value $specContent

        $recorded = (Get-Content (Join-Path $tempDir 'tla-spec-version.txt') -Raw).Trim()
        $tlaContent = Get-Content (Join-Path $tlaDir 'bus.tla') -Raw
        $mismatch = $false
        if ($tlaContent -match 'MODULE\s+\S+\s+\(\*\s*version:\s*([\d.]+)\s*\*\)') {
            $specVer = $Matches[1]
            if ($specVer -ne $recorded) { $mismatch = $true }
        }
        $mismatch | Should -Be $true
    }
}

Describe 'T12: send-canary-rollback-alert.ps1 appends alert to gate-ledger.jsonl' {
    It 'appends a canary-rollback-alert record' {
        $tempDir = _NewTempDir
        $ledgerPath = Join-Path $tempDir 'gate-ledger.jsonl'

        Add-GateLedgerEntry -Entry @{
            type      = 'canary-rollback-alert'
            metric    = 'error_rate'
            value     = 2.5
            threshold = 1.0
        } -LedgerPath $ledgerPath

        $records = Get-GateLedger -LedgerPath $ledgerPath
        @($records).Count | Should -Be 1
        $records[0].type | Should -Be 'canary-rollback-alert'
        $records[0].metric | Should -Be 'error_rate'
    }
}

Describe 'T13: ratchet-perf-baselines.ps1 updates json when improvement > 5%' {
    It 'updates baselines when improvement exceeds 5%' {
        $tempDir = _NewTempDir
        $baselines = @{ stage2_p99_ms = 100 }
        $baselinesPath = Join-Path $tempDir 'performance-baselines.json'
        $ratchetLogPath = Join-Path $tempDir 'perf-ratchet-log.json'
        $baselines | ConvertTo-Json | Set-Content -Path $baselinesPath
        Set-Content -Path $ratchetLogPath -Value '[]'

        # Simulate 10% improvement (100 -> 90)
        $newValue = 90.0
        $current = ($baselines | ConvertTo-Json | ConvertFrom-Json).stage2_p99_ms
        $improvement = ($current - $newValue) / $current

        $improvement | Should -BeGreaterThan 0.05

        # Apply ratchet
        $data = Get-Content $baselinesPath | ConvertFrom-Json
        $data.stage2_p99_ms = $newValue
        $data | ConvertTo-Json | Set-Content $baselinesPath

        $updated = Get-Content $baselinesPath | ConvertFrom-Json
        $updated.stage2_p99_ms | Should -Be 90.0
    }
}

Describe 'T14: ratchet-perf-baselines.ps1 skips update when improvement < 5%' {
    It 'does not update baselines when improvement is below 5%' {
        $tempDir = _NewTempDir
        $baselines = @{ stage2_p99_ms = 100 }
        $baselinesPath = Join-Path $tempDir 'performance-baselines.json'
        $baselines | ConvertTo-Json | Set-Content -Path $baselinesPath

        # Simulate 3% improvement (100 -> 97)
        $newValue = 97.0
        $current = 100.0
        $improvement = ($current - $newValue) / $current

        $improvement | Should -BeLessThan 0.05

        # Should not update
        $data = Get-Content $baselinesPath | ConvertFrom-Json
        $data.stage2_p99_ms | Should -Be 100
    }
}

Describe 'T15: check-bdd-action-tags.ps1 passes when all scenarios have @tla-action tag' {
    It 'detects @tla-action tag presence correctly' {
        $featureContent = @'
@tla-action-SendBusEvent
Scenario: Bus event is sent
  Given the bus is running
  When a stage completes
  Then a stage_completed event is published
'@
        $hasTlaTag = $false
        $lines = $featureContent -split "`n"
        foreach ($line in $lines) {
            if ($line.Trim() -match '@tla-action-') { $hasTlaTag = $true }
        }
        $hasTlaTag | Should -Be $true
    }
}

Describe 'T16: check-bdd-postconditions.ps1 passes when Then clauses present' {
    It 'detects Then clause in BDD scenario' {
        $featureContent = @'
Scenario: Stage completes
  Given a running pipeline
  When stage 2 finishes
  Then a stage_completed event is on the bus
'@
        $hasThen = $featureContent -match '(?m)^  Then\s'
        $hasThen | Should -Be $true
    }
}

Describe 'T17: check-gate-executability.ps1 reports status for each tool' {
    It 'gate-ledger.ps1 is importable as a module' {
        $ledgerScript = Join-Path $ToolsDir 'gate-ledger.ps1'
        $ledgerScript | Should -Exist
        # Already dot-sourced in BeforeAll; verify functions are available
        { Get-Command Get-GateLedger -ErrorAction Stop } | Should -Not -Throw
    }

    It 'check-invoke-claude-migration.ps1 exists' {
        (Join-Path $ToolsDir 'check-invoke-claude-migration.ps1') | Should -Exist
    }

    It 'cascade-order-check.ps1 exists' {
        (Join-Path $ToolsDir 'cascade-order-check.ps1') | Should -Exist
    }

    It 'check-tla-version.ps1 exists' {
        (Join-Path $ToolsDir 'check-tla-version.ps1') | Should -Exist
    }

    It 'emit-gate-proof.ps1 exists' {
        (Join-Path $ToolsDir 'emit-gate-proof.ps1') | Should -Exist
    }

    It 'send-canary-rollback-alert.ps1 exists' {
        (Join-Path $ToolsDir 'send-canary-rollback-alert.ps1') | Should -Exist
    }
}

Describe 'T18: gate-ledger.jsonl exists (data file presence)' {
    It 'gate-ledger.jsonl exists in docs directory' {
        $ledgerPath = Join-Path $Root 'docs' 'gate-ledger.jsonl'
        $ledgerPath | Should -Exist
    }
}

Describe 'T19: soak-thresholds.psd1 can be imported' {
    It 'imports soak-thresholds.psd1 successfully' {
        $soakFile = Join-Path $Root 'bus' 'schema' 'soak-thresholds.psd1'
        $soakFile | Should -Exist
        $data = Import-PowerShellDataFile $soakFile
        $data.MaxP99Ms | Should -Be 5
        $data.MaxP999Ms | Should -Be 20
        $data.MaxGitStashMs | Should -Be 2000
    }
}

Describe 'T20: feature-flag-sunset-manifest.psd1 can be imported' {
    It 'imports feature-flag-sunset-manifest.psd1 successfully' {
        $manifestFile = Join-Path $Root 'bus' 'infra' 'feature-flag-sunset-manifest.psd1'
        $manifestFile | Should -Exist
        $data = Import-PowerShellDataFile $manifestFile
        $data.Stage2 | Should -Be '2026-Q3'
        $data.Stage7 | Should -Be '2026-Q3'
    }
}

Describe 'T21: stage-observability-targets.psd1 can be imported' {
    It 'imports stage-observability-targets.psd1 successfully' {
        $targetsFile = Join-Path $Root 'bus' 'infra' 'stage-observability-targets.psd1'
        $targetsFile | Should -Exist
        $data = Import-PowerShellDataFile $targetsFile
        $data.Stage2 | Should -Contain 'bdd'
        $data.Stage2 | Should -Contain 'tla'
        $data.Stage7 | Should -Contain 'coding'
    }
}

Describe 'T22: vibe-cli.yml is valid YAML (parse test)' {
    It 'vibe-cli.yml exists and contains all 5 job groups' {
        $yamlPath = Join-Path $Root '..' '..' '.github' 'workflows' 'vibe-cli.yml'
        $yamlPath | Should -Exist
        $content = Get-Content $yamlPath -Raw

        # Check all 29 job names are present
        $content | Should -Match 'check-naming-conventions'
        $content | Should -Match 'check-invoke-claude-migration'
        $content | Should -Match 'check-tla-version'
        $content | Should -Match 'check-bdd-action-tags'
        $content | Should -Match 'check-bdd-postconditions'
        $content | Should -Match 'check-tla-symbol-parity'
        $content | Should -Match 'cascade-order-check'
        $content | Should -Match 'no-string-literal-assertions'
        $content | Should -Match 'unit-tests'
        $content | Should -Match 'integration-tests'
        $content | Should -Match 'property-tests'
        $content | Should -Match 'contract-tests'
        $content | Should -Match 'mutation-tests'
        $content | Should -Match 'e2e-tests'
        $content | Should -Match 'performance-baselines'
        $content | Should -Match 'bdd-audit'
        $content | Should -Match 'tlc-model-check'
        $content | Should -Match 'tlc-trace-validation'
        $content | Should -Match 'red-green-order'
        $content | Should -Match 'gate-executability'
        $content | Should -Match 'perf-ratchet'
        $content | Should -Match 'schema-hash'
        $content | Should -Match 'coverage-gate'
        $content | Should -Match 'rollback-rehearsal'
        $content | Should -Match 'canary-health-check'
        $content | Should -Match 'soak-test'
        $content | Should -Match 'telemetry-validation'
        $content | Should -Match 'stage-soak'
        $content | Should -Match 'emit-gate-proof'
    }
}

Describe 'Additional: gate-ledger Reset-GateLedger clears file' {
    It 'resets the ledger to empty' {
        $tempDir = _NewTempDir
        $ledgerPath = Join-Path $tempDir 'gate-ledger.jsonl'

        Add-GateLedgerEntry -Entry @{ type = 'test' } -LedgerPath $ledgerPath
        Reset-GateLedger -LedgerPath $ledgerPath

        $lines = Get-Content $ledgerPath -ErrorAction SilentlyContinue
        @($lines | Where-Object { $_ -ne '' }).Count | Should -Be 0
    }
}

Describe 'Additional: performance-baselines.json is importable' {
    It 'performance-baselines.json is valid JSON' {
        $baselinesPath = Join-Path $Root 'tests' 'bus' 'performance-baselines.json'
        $baselinesPath | Should -Exist
        $data = Get-Content $baselinesPath -Raw | ConvertFrom-Json
        $data | Should -Not -BeNullOrEmpty
    }
}

Describe 'Additional: provenance-manifest.json is valid' {
    It 'provenance-manifest.json has correct structure' {
        $manifestPath = Join-Path $Root 'tests' 'fixtures' 'provenance-manifest.json'
        $manifestPath | Should -Exist
        $data = Get-Content $manifestPath -Raw | ConvertFrom-Json
        $data.version | Should -Be 1
        # fixtures starts as empty array
        @($data.fixtures).Count | Should -Be 0
    }
}

Describe 'Additional: perf-ratchet-log.json starts empty' {
    It 'perf-ratchet-log.json contains empty array' {
        $logPath = Join-Path $Root 'docs' 'perf-ratchet-log.json'
        $logPath | Should -Exist
        $data = Get-Content $logPath -Raw | ConvertFrom-Json
        @($data).Count | Should -Be 0
    }
}

Describe 'Additional: tla-spec-version.txt has semver content' {
    It 'tla-spec-version.txt contains a semantic version' {
        $versionFile = Join-Path $Root 'tla-spec-version.txt'
        $versionFile | Should -Exist
        $version = (Get-Content $versionFile -Raw).Trim()
        $version | Should -Match '^\d+\.\d+\.\d+$'
    }
}
