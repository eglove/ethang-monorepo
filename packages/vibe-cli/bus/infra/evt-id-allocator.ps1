if (-not ([System.Management.Automation.PSTypeName]'EvtIdAllocatorStore').Type) {
    Add-Type -TypeDefinition @'
using System.Threading;
public static class EvtIdAllocatorStore {
    private static long _counter = 0;
    public static long Initialize(long startValue) { return Interlocked.Exchange(ref _counter, startValue - 1); }
    public static long Next() { return Interlocked.Increment(ref _counter); }
    public static long Current() { return Interlocked.Read(ref _counter); }
    public static long Reset(long value) { return Interlocked.Exchange(ref _counter, value - 1); }
}
'@
}
function Initialize-EvtIdAllocator { param([int64]$StartValue=1); [EvtIdAllocatorStore]::Initialize($StartValue)|Out-Null }
function Get-NextEvtId { return [EvtIdAllocatorStore]::Next() }
function Get-CurrentEvtId { return [EvtIdAllocatorStore]::Current() }
function Reset-EvtIdAllocator { param([int64]$Value=1); [EvtIdAllocatorStore]::Reset($Value)|Out-Null }
