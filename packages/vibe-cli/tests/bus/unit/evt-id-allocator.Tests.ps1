# Tests for evt-id-allocator.ps1
# TDD: these tests are written BEFORE the implementation.

BeforeAll {
    $script:AllocatorPath = "$PSScriptRoot/../../../bus/infra/evt-id-allocator.ps1"
    . $script:AllocatorPath
}

Describe 'evt-id-allocator — function existence' {
    It 'Initialize-EvtIdAllocator function exists' {
        (Get-Command -Name 'Initialize-EvtIdAllocator' -ErrorAction SilentlyContinue) | Should -Not -BeNullOrEmpty
    }

    It 'Get-NextEvtId function exists' {
        (Get-Command -Name 'Get-NextEvtId' -ErrorAction SilentlyContinue) | Should -Not -BeNullOrEmpty
    }

    It 'Get-CurrentEvtId function exists' {
        (Get-Command -Name 'Get-CurrentEvtId' -ErrorAction SilentlyContinue) | Should -Not -BeNullOrEmpty
    }
}

Describe 'evt-id-allocator — monotone sequence' {
    BeforeEach {
        Reset-EvtIdAllocator -Value 0
    }

    It 'Get-NextEvtId returns 1 on first call after Initialize-EvtIdAllocator' {
        Initialize-EvtIdAllocator
        $id = Get-NextEvtId
        $id | Should -Be 1
    }

    It 'Get-NextEvtId returns 2 on second call' {
        Initialize-EvtIdAllocator
        Get-NextEvtId | Out-Null
        $id = Get-NextEvtId
        $id | Should -Be 2
    }

    It 'Get-NextEvtId returns 3 on third call' {
        Initialize-EvtIdAllocator
        Get-NextEvtId | Out-Null
        Get-NextEvtId | Out-Null
        $id = Get-NextEvtId
        $id | Should -Be 3
    }

    It 'Initialize-EvtIdAllocator -StartValue 100 yields first Get-NextEvtId = 100' {
        Initialize-EvtIdAllocator -StartValue 100
        $id = Get-NextEvtId
        $id | Should -Be 100
    }

    It 'Reset-EvtIdAllocator -Value 1 restarts sequence from 1' {
        Initialize-EvtIdAllocator
        Get-NextEvtId | Out-Null
        Get-NextEvtId | Out-Null
        Reset-EvtIdAllocator -Value 1
        $id = Get-NextEvtId
        $id | Should -Be 1
    }
}

Describe 'evt-id-allocator — Get-CurrentEvtId' {
    BeforeEach {
        Initialize-EvtIdAllocator
    }

    It 'Get-CurrentEvtId returns current value without advancing the counter' {
        Get-NextEvtId | Out-Null  # counter is now at 1
        $before = Get-CurrentEvtId
        $after  = Get-CurrentEvtId
        $before | Should -Be $after
    }

    It 'Get-CurrentEvtId after Get-NextEvtId returns the incremented value' {
        $next = Get-NextEvtId
        $current = Get-CurrentEvtId
        $current | Should -Be $next
    }
}

Describe 'evt-id-allocator — thread safety' {
    BeforeEach {
        Initialize-EvtIdAllocator
    }

    It 'thread-safe: 10 concurrent increments yield distinct values' {
        $results = [System.Collections.Concurrent.ConcurrentBag[int64]]::new()
        $allocatorPath = $script:AllocatorPath
        $jobs = 1..10 | ForEach-Object {
            Start-ThreadJob -ScriptBlock {
                . $using:allocatorPath
                $bag = $using:results
                $bag.Add((Get-NextEvtId))
            }
        }
        $jobs | Wait-Job | Out-Null
        $jobs | Remove-Job
        $results.Count | Should -Be 10
        ($results | Sort-Object | Select-Object -Unique).Count | Should -Be 10
    }
}

Describe 'evt-id-allocator — EvtIdMonotone invariant with gaps' {
    BeforeEach {
        Initialize-EvtIdAllocator
    }

    It 'after crash simulation (reset to higher value) all future IDs are greater than past IDs' {
        $past = @()
        $past += Get-NextEvtId  # 1
        $past += Get-NextEvtId  # 2
        $past += Get-NextEvtId  # 3

        # Simulate crash recovery: jump ahead (leaving a gap)
        Reset-EvtIdAllocator -Value 100

        $future = @()
        $future += Get-NextEvtId  # 100
        $future += Get-NextEvtId  # 101

        # Verify gap is present (monotone, not contiguous)
        $future[0] | Should -BeGreaterThan $past[-1]

        # Verify future sequence is still strictly increasing
        $future[1] | Should -BeGreaterThan $future[0]

        # Verify a gap exists (not contiguous)
        ($future[0] - $past[-1]) | Should -BeGreaterThan 1
    }
}
