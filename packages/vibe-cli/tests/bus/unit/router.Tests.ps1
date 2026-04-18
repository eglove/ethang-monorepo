#Requires -Module Pester
# router.Tests.ps1 — Unit tests for bus/router/router.ps1
# Uses injectable DbExecutor scriptblock instead of real SQLite

BeforeAll {
    $script:RouterPath = Resolve-Path "$PSScriptRoot/../../../bus/router/router.ps1"

    # Define Write-PipelineLog stub before dot-sourcing router
    function global:Write-PipelineLog {
        param(
            [string]$Message,
            [string]$Severity = 'INFO',
            [string]$Gate = $null,
            [hashtable]$StructuredData = $null
        )
        # Record calls for test assertions
        $script:PipelineLogCalls += @{ Message = $Message; Severity = $Severity }
    }

    . $script:RouterPath

    # ─── Mock DbExecutor helpers ─────────────────────────────────────────────

    function script:New-SuccessExecutor {
        param([long]$ReturnEvtId = 1)
        $capturedId = $ReturnEvtId
        $executor = {
            param($ConnParam, $FromParam, $ToParam, $InReplyToParam, $GroupIdParam, $TypeParam, $PayloadParam, $EvtIdParam)
            $script:MockInsertCalls += @{
                From = $FromParam; To = $ToParam; InReplyTo = $InReplyToParam
                GroupId = $GroupIdParam; Type = $TypeParam; Payload = $PayloadParam; EvtId = $EvtIdParam
            }
            return $capturedId
        }.GetNewClosure()
        return $executor
    }

    function script:New-FailureExecutor {
        $executor = {
            param($ConnParam, $FromParam, $ToParam, $InReplyToParam, $GroupIdParam, $TypeParam, $PayloadParam, $EvtIdParam)
            $script:MockInsertCalls += @{
                From = $FromParam; To = $ToParam; Type = $TypeParam
            }
            throw 'Simulated INSERT failure'
        }
        return $executor
    }
}

AfterAll {
    $env:VIBE_BUS_COMMIT_IN_PROGRESS = $null
    Remove-Item function:global:Write-PipelineLog -ErrorAction SilentlyContinue
}

Describe 'Invoke-BusAppendEvent — unit tests' {

    BeforeEach {
        $script:PipelineLogCalls = @()
        $script:MockInsertCalls  = @()
        $env:VIBE_BUS_COMMIT_IN_PROGRESS = $null
        Reset-RouterState
        Initialize-EvtIdAllocator -StartValue 1
    }

    It '01: returns @{ EvtId=1; Status=routed } on first call' {
        Initialize-EvtIdAllocator -StartValue 1
        $exec = New-SuccessExecutor -ReturnEvtId 1
        $result = Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec
        $result.EvtId  | Should -Be 1
        $result.Status | Should -Be 'routed'
    }

    It '02: unknown event type throws' {
        $exec = New-SuccessExecutor -ReturnEvtId 1
        { Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'unknown_type' -DbExecutor $exec } |
            Should -Throw
    }

    It '03: empty From throws' {
        $exec = New-SuccessExecutor -ReturnEvtId 1
        { Invoke-BusAppendEvent -Connection $null -From '' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec } |
            Should -Throw
    }

    It '04: empty To throws' {
        $exec = New-SuccessExecutor -ReturnEvtId 1
        { Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To '' -Type 'bootstrap' -DbExecutor $exec } |
            Should -Throw
    }

    It '05: invalid JSON payload throws' {
        $exec = New-SuccessExecutor -ReturnEvtId 1
        { Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -Payload '{not valid json' -DbExecutor $exec } |
            Should -Throw
    }

    It '06: successful call adds evt_id to _RoutedIds' {
        Initialize-EvtIdAllocator -StartValue 42
        $exec = New-SuccessExecutor -ReturnEvtId 42
        Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec | Out-Null
        $ids = Get-RoutedEventIds
        $ids.Contains([long]42) | Should -BeTrue
    }

    It '07: Get-NextEvtId is called exactly once per Invoke-BusAppendEvent call' {
        # We verify indirectly: the evt_id returned matches the allocator's next value
        Initialize-EvtIdAllocator -StartValue 77
        $exec = {
            param($ConnParam, $FromParam, $ToParam, $InReplyToParam, $GroupIdParam, $TypeParam, $PayloadParam, $EvtIdParam)
            return $EvtIdParam
        }
        $result = Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec
        # If Get-NextEvtId was called exactly once starting at 77, result.EvtId should be 77
        $result.EvtId | Should -Be 77
        # Next call should get 78 (allocator advanced by exactly 1)
        $nextId = Get-NextEvtId
        $nextId | Should -Be 78
    }

    It '08: DbExecutor is invoked (transaction begun)' {
        $script:ExecutorCalled = $false
        $exec = {
            param($ConnParam, $FromParam, $ToParam, $InReplyToParam, $GroupIdParam, $TypeParam, $PayloadParam, $EvtIdParam)
            $script:ExecutorCalled = $true
            return [long]1
        }
        Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec | Out-Null
        $script:ExecutorCalled | Should -BeTrue
    }

    It '09: result status is routed on success' {
        $exec = New-SuccessExecutor -ReturnEvtId 1
        $result = Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec
        $result.Status | Should -Be 'routed'
    }

    It '10: rolls back and rethrows on INSERT failure' {
        $exec = New-FailureExecutor
        { Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec } |
            Should -Throw
    }

    It '11: VIBE_BUS_COMMIT_IN_PROGRESS=1 throws LockHierarchyViolation' {
        $env:VIBE_BUS_COMMIT_IN_PROGRESS = '1'
        $exec = New-SuccessExecutor -ReturnEvtId 1
        { Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec } |
            Should -Throw '*LockHierarchyViolation*'
    }

    It '12: VIBE_BUS_COMMIT_IN_PROGRESS=1 calls Write-PipelineLog with Severity=ERROR' {
        $env:VIBE_BUS_COMMIT_IN_PROGRESS = '1'
        $exec = New-SuccessExecutor -ReturnEvtId 1
        try {
            Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec
        } catch {}
        $errorLog = $script:PipelineLogCalls | Where-Object { $_.Severity -eq 'ERROR' }
        $errorLog | Should -Not -BeNullOrEmpty
    }

    It '13: VIBE_BUS_COMMIT_IN_PROGRESS=1 does NOT call Get-NextEvtId' {
        # Verify indirectly: allocator counter should not advance when lock violation occurs
        $env:VIBE_BUS_COMMIT_IN_PROGRESS = '1'
        Initialize-EvtIdAllocator -StartValue 55
        $exec = New-SuccessExecutor -ReturnEvtId 55
        try {
            Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec
        } catch {}
        # If Get-NextEvtId was NOT called, allocator is still at 55
        $nextId = Get-NextEvtId
        $nextId | Should -Be 55
    }

    It '14: Reset-RouterState clears _RoutedIds' {
        $exec = New-SuccessExecutor -ReturnEvtId 99
        Initialize-EvtIdAllocator -StartValue 99
        Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec | Out-Null
        $ids = Get-RoutedEventIds
        $ids.Count | Should -BeGreaterThan 0
        Reset-RouterState
        $ids2 = Get-RoutedEventIds
        $ids2.Count | Should -Be 0
    }

    It '15: Reset-RouterState resets env check (after env cleared, no throw)' {
        $env:VIBE_BUS_COMMIT_IN_PROGRESS = '1'
        Reset-RouterState
        $env:VIBE_BUS_COMMIT_IN_PROGRESS = $null
        $exec = New-SuccessExecutor -ReturnEvtId 1
        { Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec } |
            Should -Not -Throw
    }

    It '16: two sequential calls produce monotonically increasing evt_ids' {
        $exec = {
            param($ConnParam, $FromParam, $ToParam, $InReplyToParam, $GroupIdParam, $TypeParam, $PayloadParam, $EvtIdParam)
            return $EvtIdParam
        }
        Initialize-EvtIdAllocator -StartValue 1
        $r1 = Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec
        $r2 = Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'ground_truth' -DbExecutor $exec
        $r2.EvtId | Should -BeGreaterThan $r1.EvtId
    }

    It '17: null payload passed to executor as null' {
        $script:CapturedPayload = 'NOTSET'
        $exec = {
            param($ConnParam, $FromParam, $ToParam, $InReplyToParam, $GroupIdParam, $TypeParam, $PayloadParam, $EvtIdParam)
            $script:CapturedPayload = $PayloadParam
            return [long]1
        }
        Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec | Out-Null
        $script:CapturedPayload | Should -BeNullOrEmpty
    }

    It '18: _RoutedIds NOT modified when INSERT fails (rollback invariant)' {
        $countBefore = (Get-RoutedEventIds).Count
        $exec = New-FailureExecutor
        try {
            Invoke-BusAppendEvent -Connection $null -From 'orchestrator' -To 'tla-writer' -Type 'bootstrap' -DbExecutor $exec
        } catch {}
        $countAfter = (Get-RoutedEventIds).Count
        $countAfter | Should -Be $countBefore
    }
}
