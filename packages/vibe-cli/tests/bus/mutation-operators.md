# Mutation Operators for Bus Router Tier 2 Tests

Defines the mutation operators used in tier 2 mutation testing of the bus router.
Each operator targets a specific invariant so that surviving mutants indicate coverage gaps.

## Operators

### 1. `InvertAclCheck`

**Description**: Flip the ACL check result so that forbidden (From, To, type) triples are accepted and valid triples are rejected.

**Implementation target**: `_Test-RouterAcl` in `bus/router/router.ps1`

**Mutation**: Replace `return $false` with `return $true` in the ACL validation branches (and vice versa).

**Killed by**: P4 (`InvAclCompliant` — ACL-valid events succeed; ACL-invalid events throw)

---

### 2. `SkipHaltLatch`

**Description**: Bypass the `CompareExchange`-equivalent halt guard so that the `$script:_RouterHalted` latch is never set.

**Implementation target**: `Invoke-BusAppendEvent` in `bus/router/router.ps1`

**Mutation**: Remove or comment out the `$script:_RouterHalted = $true` assignment for halt event types.

**Killed by**: P10 (halt event followed by non-halt event throws), P13 (InvHaltMonotone across 50 sequences)

---

### 3. `DropEvent`

**Description**: Silently discard the appended event without writing it to the SQLite `event_log` table.

**Implementation target**: `Invoke-BusAppendEvent` in `bus/router/router.ps1`

**Mutation**: Remove the `Invoke-SqliteQuery INSERT` call (or replace with a no-op) while still returning a valid-looking `evt_id`.

**Killed by**: P3 (event count in DB matches number appended — no silent drops), P8 (single event = one row)

---

### 4. `CorruptEvtId`

**Description**: Return the wrong `evt_id` from the allocator — for example, always return `1`, or return `MAX(evt_id)` (without incrementing).

**Implementation target**: `Invoke-BusAppendEvent` in `bus/router/router.ps1`

**Mutation**: Replace `$nextId = [int]($maxRow.mx) + 1` with `$nextId = [int]($maxRow.mx)` (no increment), or hardcode `$nextId = 1`.

**Killed by**: P1 (InvEventIds — all evt_ids unique), P2 (strictly increasing evt_ids), P11 (no duplicate evt_ids)

---

### 5. `SwapStatusTransition`

**Description**: Allow invalid status transitions by inserting events with status `pending`, `unknown`, or another non-spec value instead of `routed`.

**Implementation target**: `Invoke-BusAppendEvent` in `bus/router/router.ps1`

**Mutation**: Replace the `'routed'` literal in the INSERT statement with `'pending'`.

**Killed by**: P5 (InvStatusTransition — only routed/committed/delivery_failed statuses valid), `Assert-SequenceInvariant InvStatusTransition`

---

## Coverage Matrix

| Operator | P1 | P2 | P3 | P4 | P5 | P8 | P10 | P11 | P13 |
|---|---|---|---|---|---|---|---|---|---|
| InvertAclCheck | | | | X | | | | | |
| SkipHaltLatch | | | | | | | X | | X |
| DropEvent | | | X | | | X | | | |
| CorruptEvtId | X | X | | | | | | X | |
| SwapStatusTransition | | | | | X | | | | |

## Usage

Run mutation tests with the tier 2 runner:

```powershell
Invoke-MutationSuite -Operators @('InvertAclCheck','DropEvent','CorruptEvtId') `
                     -TestSuite "$root/tests/bus/properties/router-properties.Tests.ps1"
```

A mutation score of ≥ 80% (mutation kill rate) is required for the bus router tier 2 gate.
