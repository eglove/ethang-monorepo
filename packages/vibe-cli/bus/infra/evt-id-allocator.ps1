# evt-id-allocator.ps1
# Thread-safe monotone event-ID allocator using System.Threading.Interlocked.
#
# Invariant (EvtIdMonotone): allocated IDs are always strictly increasing.
# Gaps in the sequence are acceptable — a crash between Increment and INSERT
# leaves a gap that recovery handles.
#
# Maximum value: [int64]::MaxValue — no artificial cap.
#
# Implementation note: the counter lives in a C# static field so that it is
# shared across PowerShell runspaces (e.g. thread jobs). Interlocked operations
# on static fields are fully thread-safe without locks.

if (-not ([System.Management.Automation.PSTypeName]'EvtIdAllocatorStore').Type) {
    Add-Type -TypeDefinition @'
using System.Threading;
public static class EvtIdAllocatorStore {
    private static long _counter = 0;

    /// <summary>Sets counter so next Next() returns startValue.</summary>
    public static long Initialize(long startValue) {
        return Interlocked.Exchange(ref _counter, startValue - 1);
    }

    /// <summary>Atomically increments and returns the new (post-increment) value.</summary>
    public static long Next() {
        return Interlocked.Increment(ref _counter);
    }

    /// <summary>Returns current value without incrementing.</summary>
    public static long Current() {
        return Interlocked.Read(ref _counter);
    }

    /// <summary>
    /// Resets counter so next Next() returns value.
    /// TEST-ONLY — do not call while other threads are allocating IDs.
    /// </summary>
    public static long Reset(long value) {
        return Interlocked.Exchange(ref _counter, value - 1);
    }
}
'@
}

function Initialize-EvtIdAllocator {
    param([int64]$StartValue = 1)
    [EvtIdAllocatorStore]::Initialize($StartValue) | Out-Null
}

function Get-NextEvtId {
    return [EvtIdAllocatorStore]::Next()
}

function Get-CurrentEvtId {
    return [EvtIdAllocatorStore]::Current()
}

function Reset-EvtIdAllocator {
    param([int64]$Value = 1)
    [EvtIdAllocatorStore]::Reset($Value) | Out-Null
}
