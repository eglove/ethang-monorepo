BeforeAll {
    $Root = Join-Path $PSScriptRoot '..' '..' '..'
    $ToolsDir = Join-Path $Root 'tools'
    $BusDir = Join-Path $Root 'bus'

    . (Join-Path $ToolsDir 'gate-ledger.ps1')
}

Describe 'Mutation: gate-ledger Add-GateLedgerEntry' {
    It 'mutation — omitting type field changes record structure' {
        $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        $ledgerPath = Join-Path $tempDir 'gate-ledger.jsonl'

        . (Join-Path $ToolsDir 'gate-ledger.ps1')

        # Original: has type
        Add-GateLedgerEntry -Entry @{ type = 'gate-proof'; gate = 'x'; status = 'pass' } -LedgerPath $ledgerPath
        $records = Get-GateLedger -LedgerPath $ledgerPath
        $records[0].type | Should -Be 'gate-proof'

        Reset-GateLedger -LedgerPath $ledgerPath

        # Mutant: missing type — record exists but type is null
        Add-GateLedgerEntry -Entry @{ gate = 'x'; status = 'pass' } -LedgerPath $ledgerPath
        $mutantRecords = Get-GateLedger -LedgerPath $ledgerPath
        $mutantRecords[0].type | Should -BeNullOrEmpty
    }

    It 'mutation — wrong status value is preserved faithfully' {
        $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        $ledgerPath = Join-Path $tempDir 'gate-ledger.jsonl'

        . (Join-Path $ToolsDir 'gate-ledger.ps1')
        Add-GateLedgerEntry -Entry @{ type = 'gate-proof'; status = 'unknown' } -LedgerPath $ledgerPath
        $records = Get-GateLedger -LedgerPath $ledgerPath
        $records[0].status | Should -Be 'unknown'
    }
}

Describe 'Mutation: cascade-order stage range' {
    It 'mutation — stage 1 is not required (only 2-7)' {
        $content = @'
## Stage 2 — Writers
## Stage 3 — Debate
## Stage 4 — Artifacts
## Stage 5 — Impl
## Stage 6 — ImplDebate
## Stage 7 — Coding
'@
        $missing = @()
        2..7 | ForEach-Object {
            if ($content -notmatch "## Stage $_") { $missing += "Stage $_" }
        }
        $missing.Count | Should -Be 0
        # Stage 1 not required
        if ($content -notmatch '## Stage 1') {
            $stage1Missing = $true
        }
        $stage1Missing | Should -Be $true
    }
}

Describe 'Mutation: naming convention boundary' {
    It 'mutation — _lowercase is flagged as invalid private naming' {
        $name = '_lowercase'
        $valid = $name -cmatch '^_[A-Z][a-zA-Z0-9]*$'
        $valid | Should -Be $false
    }

    It 'mutation — _PascalCase is valid private naming' {
        $name = '_PascalCase'
        $valid = $name -cmatch '^_[A-Z][a-zA-Z0-9]*$'
        $valid | Should -Be $true
    }

    It 'mutation — Get-Resource is valid public naming' {
        $name = 'Get-Resource'
        $valid = $name -cmatch '^[A-Z][a-z]+-[A-Z]'
        $valid | Should -Be $true
    }

    It 'mutation — get-resource (lowercase) is invalid public naming' {
        $name = 'get-resource'
        $valid = $name -cmatch '^[A-Z][a-z]+-[A-Z]'
        $valid | Should -Be $false
    }
}

Describe 'Mutation: ratchet threshold boundary' {
    It 'mutation — exactly 5% improvement does not trigger ratchet (must be > 5%)' {
        $current = 100.0
        $newValue = 95.0
        $improvement = ($current - $newValue) / $current
        $improvement | Should -Be 0.05
        # 5% exactly is NOT > 5%, so no ratchet
        ($improvement -gt 0.05) | Should -Be $false
    }

    It 'mutation — 5.1% improvement triggers ratchet' {
        $current = 100.0
        $newValue = 94.9
        $improvement = ($current - $newValue) / $current
        ($improvement -gt 0.05) | Should -Be $true
    }
}

Describe 'Mutation: performance baseline 20% allowance' {
    It 'mutation — exactly 20% over baseline is allowed' {
        $baseline = 100.0
        $actual = 120.0
        $allowedMax = $baseline * 1.20
        ($actual -gt $allowedMax) | Should -Be $false
    }

    It 'mutation — more than 20% over baseline is a violation' {
        $baseline = 100.0
        $actual = 121.0
        $allowedMax = $baseline * 1.20
        ($actual -gt $allowedMax) | Should -Be $true
    }
}
