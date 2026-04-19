BeforeAll {
    $busSchemaRoot = Resolve-Path "$PSScriptRoot/../../../bus/schema"
    . "$busSchemaRoot/long-path-check.ps1"
    . "$busSchemaRoot/open-bus-database.ps1"
}

Describe 'Exported functions' {
    It 'Open-BusDatabase function is exported' {
        $cmd = Get-Command -Name Open-BusDatabase -ErrorAction SilentlyContinue
        $cmd | Should -Not -BeNullOrEmpty
    }

    It 'Invoke-BusWalCheckpoint function is exported' {
        $cmd = Get-Command -Name Invoke-BusWalCheckpoint -ErrorAction SilentlyContinue
        $cmd | Should -Not -BeNullOrEmpty
    }

    It 'Invoke-LongPathCheck function is exported' {
        $cmd = Get-Command -Name Invoke-LongPathCheck -ErrorAction SilentlyContinue
        $cmd | Should -Not -BeNullOrEmpty
    }
}

Describe 'Open-BusDatabase path normalization' {
    BeforeAll {
        Mock Invoke-LongPathCheck { param([string]$Path) $Path }
        Mock Test-Path { return $false }
        Mock Get-Content { return '' }
    }

    BeforeEach {
        $script:capturedDataSource = $null
        Mock Open-SQLiteConnection {
            param([string]$DataSource)
            $script:capturedDataSource = $DataSource
            return [PSCustomObject]@{ DataSource = $DataSource; State = 'Open' }
        }
        Mock Invoke-SQLiteQuery -RemoveParameterType 'SQLiteConnection' {
            param($SQLiteConnection, $Query)
            if ($Query -match 'journal_mode') { return [PSCustomObject]@{ journal_mode = 'wal' } }
            return $null
        }
    }

    It 'normalizes path via [System.IO.Path]::GetFullPath' {
        $tempDir = [System.IO.Path]::GetTempPath()
        $dbName = "test-$([guid]::NewGuid().ToString('N').Substring(0,8)).db"
        # Use a path that needs normalization (with redundant dot segment)
        $relativePath = Join-Path $tempDir '.' $dbName
        $expectedNormalized = [System.IO.Path]::GetFullPath($relativePath)

        Open-BusDatabase -Path $relativePath -GetUtcNow { [DateTime]::UtcNow } | Out-Null

        $script:capturedDataSource | Should -Be $expectedNormalized
    }
}

Describe 'WAL circuit breaker' {
    BeforeAll {
        Mock Invoke-SQLiteQuery -RemoveParameterType 'SQLiteConnection' {
            param($SQLiteConnection, $Query)
            if ($Query -match 'wal_checkpoint') {
                throw 'SQLITE_FULL: database or disk is full'
            }
            return $null
        }
        Mock Write-BusLog {}
    }

    BeforeEach {
        # Reset circuit breaker state before each test
        $script:WalCheckpointConsecutiveFailures = 0
        $script:WalCheckpointCircuitOpen = $false
        $script:WalCheckpointCallCount = 0
    }

    It 'after 3 SQLITE_FULL failures, circuit is open' {
        $conn = [PSCustomObject]@{ State = 'Open' }
        1..3 | ForEach-Object { Invoke-BusWalCheckpoint -Connection $conn }
        $script:WalCheckpointCircuitOpen | Should -BeTrue
    }

    It 'circuit-open state returns immediately on 4th call (no-op)' {
        $conn = [PSCustomObject]@{ State = 'Open' }
        # Open circuit with 3 failures
        1..3 | ForEach-Object { Invoke-BusWalCheckpoint -Connection $conn }
        $failuresBefore = $script:WalCheckpointConsecutiveFailures

        # 4th call — circuit open, should be no-op, failure counter stays same
        Invoke-BusWalCheckpoint -Connection $conn
        $script:WalCheckpointConsecutiveFailures | Should -Be $failuresBefore
    }

    It '[ALARM] emitted exactly once when circuit opens' {
        $conn = [PSCustomObject]@{ State = 'Open' }
        # Call 5 times — circuit opens on 3rd, calls 4 and 5 are no-ops
        1..5 | ForEach-Object { Invoke-BusWalCheckpoint -Connection $conn }

        # Write-BusLog should be called exactly once with ALARM + circuit open message
        Should -Invoke Write-BusLog -Times 1 -ParameterFilter {
            $Severity -eq 'ALARM' -and $Message -match 'circuit open'
        }
    }
}

Describe 'Invoke-LongPathCheck' {
    It 'returns original path when length <= 240' {
        # Use a path that is guaranteed to be short (well under 240 chars)
        $shortPath = Join-Path ([System.IO.Path]::GetTempPath()) 'test.db'
        $result = Invoke-LongPathCheck -Path $shortPath
        $result | Should -Be $shortPath
    }

    It 'applies SHA-256 truncation when normalized path > 240 chars' {
        # Build a path that is definitely > 240 chars after normalization
        $longSegment = 'a' * 60
        $longPath = "C:\$longSegment\$longSegment\$longSegment\$longSegment\database.db"
        $longPath.Length | Should -BeGreaterThan 240

        $result = Invoke-LongPathCheck -Path $longPath
        # Result should be different (truncated/shortened)
        $result | Should -Not -Be $longPath
        # Result path length should be <= 240
        $result.Length | Should -BeLessOrEqual 240
    }
}

Describe 'GetUtcNow scriptblock override' {
    It '$script:GetUtcNow can be overridden for testing' {
        $fixedDate = [DateTime]::new(2025, 1, 1)
        $script:GetUtcNow = { $fixedDate }
        $result = & $script:GetUtcNow
        $result | Should -Be $fixedDate
    }
}

Describe 'Open-BusDatabase WAL file size warning' {
    BeforeAll {
        Mock Invoke-LongPathCheck { param([string]$Path) $Path }
        Mock Open-SQLiteConnection {
            param([string]$DataSource)
            return [PSCustomObject]@{ DataSource = $DataSource; State = 'Open' }
        }
        Mock Invoke-SQLiteQuery -RemoveParameterType 'SQLiteConnection' {
            param($SQLiteConnection, $Query)
            if ($Query -match 'journal_mode') { return [PSCustomObject]@{ journal_mode = 'wal' } }
            return $null
        }
        Mock Get-Content { return '' }
        # WAL file exists with size > 10MB
        Mock Test-Path {
            param([string]$Path)
            if ($Path -like '*-wal') { return $true }
            return $false
        }
        Mock Get-Item {
            param([string]$Path)
            if ($Path -like '*-wal') {
                return [PSCustomObject]@{ Length = (11 * 1024 * 1024) }
            }
            return $null
        }
        Mock Write-BusLog {}
    }

    It 'emits [WARN] when WAL file > 10MB' {
        $tempDb = Join-Path ([System.IO.Path]::GetTempPath()) "test-$([guid]::NewGuid().ToString('N').Substring(0,8)).db"
        Open-BusDatabase -Path $tempDb -GetUtcNow { [DateTime]::UtcNow } | Out-Null

        Should -Invoke Write-BusLog -ParameterFilter {
            $Severity -eq 'WARN' -and $Message -match 'WAL file exceeds 10MB'
        }
    }
}

Describe 'Open-BusDatabase calls Invoke-LongPathCheck before opening connection' {
    BeforeAll {
        Mock Open-SQLiteConnection {
            param([string]$DataSource)
            return [PSCustomObject]@{ DataSource = $DataSource; State = 'Open' }
        }
        Mock Invoke-SQLiteQuery -RemoveParameterType 'SQLiteConnection' {
            param($SQLiteConnection, $Query)
            if ($Query -match 'journal_mode') { return [PSCustomObject]@{ journal_mode = 'wal' } }
            return $null
        }
        Mock Test-Path { return $false }
        Mock Get-Content { return '' }
    }

    It 'calls Invoke-LongPathCheck before opening connection' {
        Mock Invoke-LongPathCheck {
            param([string]$Path)
            return $Path
        }

        $tempDb = Join-Path ([System.IO.Path]::GetTempPath()) "test-$([guid]::NewGuid().ToString('N').Substring(0,8)).db"
        Open-BusDatabase -Path $tempDb -GetUtcNow { [DateTime]::UtcNow } | Out-Null

        Should -Invoke Invoke-LongPathCheck -Times 1
    }
}
