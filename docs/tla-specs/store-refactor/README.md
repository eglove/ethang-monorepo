# TLA+ Specification: @ethang/store Refactor

## Source
Briefing: `docs/questioner-sessions/2026-04-04_store-refactor.md`

## Specification
- **Module:** `StoreRefactor.tla`
- **Config:** `StoreRefactor.cfg`

## Revision History
- **v1 (2026-04-04):** Initial spec. TLC passed with 17M states, 2M distinct. Submitted for Stage 4 review.
- **v2 (2026-04-04):** Revised per Stage 4 review debate (5 issues + 3 secondary cleanups). See changes below.

## Changes in v2

### Critical Fixes
1. **DrainComplete now guards on `~destroyed` before applying queued patches.** Previously, `DrainComplete` would dequeue and apply patches from `patchQueue` even after `destroy()` was called. This allowed state mutations on a destroyed store, contradicting the design consensus that post-destroy `update` is a silent no-op. The THEN branch now requires `patchQueue /= <<>> /\ ~destroyed`. The ELSE branch clears `patchQueue` (discarding remaining patches on destroy).

2. **Added `DrainAbortOnDestroy` action.** When `destroyed = TRUE` during a drain with non-empty `pendingNotify`, `DrainNotify` cannot fire (it requires `~destroyed`) and `DrainComplete` cannot fire (it requires `pendingNotify = {}`). This action resolves the deadlock by clearing `pendingNotify`, `patchQueue`, and exiting the drain. Weak fairness on this action ensures the drain always terminates after destroy.

### Annotations and Documentation
3. **Annotated Destroy + waiters atomicity gap.** Added a block comment to the `Destroy` action explaining that the intermediate state (`destroyed = TRUE`, `waiters` non-empty) is safe due to weak fairness on `WaitForDestroyError`. This is by design -- do not add invariants assuming `destroyed => waiters = {}`.

4. **Documented `onPropertyChange` as scoping limitation.** Added a comment block in the module header explaining that `DrainNotify` does not model callback execution, side effects, or the `shouldNotify: false` path. Tests for `onPropertyChange` + `shouldNotify: false` must be derived independently of this spec. The README item 8 below is updated accordingly.

### State Space Cleanup
5. **Removed `notifiedState` variable.** It was written in `DrainComplete` but never referenced in any invariant, liveness property, or action guard. Removing it reduces the state space (v1: 2,075,088 distinct states; v2: 762,048 distinct states -- 63% reduction).

6. **Removed redundant `PostDestroyNoNewSubs` invariant.** It was identical to `PostDestroyNoNotifications` (`destroyed => subscribers = {}`).

7. **Removed `DestroyMonotonic` invariant.** It used primed variables (`destroyed'`) and could not be checked as a TLC INVARIANT (which operates on single states, not transitions). The monotonicity of `destroyed` is enforced structurally: `Destroy` requires `~destroyed`, and no action ever sets `destroyed' = FALSE`.

8. **Removed unused `MaxUpdates` constant.** Declared in CONSTANTS but never referenced in any action or guard.

### New Properties
9. **Added `PostDestroyDrainTerminates` liveness property.** Asserts `(destroyed /\ draining) ~> ~draining` -- after destroy, the drain must eventually terminate. This is stronger than `DrainTerminates` which allows `destroyed` as a resolution (vacuously true when already destroyed).

## States
- **Store state value:** abstract state from the `States` set
- **Drain loop:** idle or draining with pending subscriber notifications and a reentrant patch queue
- **Subscriber lifecycle:** subscribe, unsubscribe, onFirstSubscriber, onLastSubscriberRemoved, AbortController
- **Destroy lifecycle:** active or destroyed (monotonic flag)
- **waitFor lifecycle:** waiting, resolved (ok), resolved (error), aborted, predicate error

## Properties Verified
### Safety (Invariants)
- **TypeOK** -- all variables remain within their declared domains
- **PostDestroyNoNotifications** -- after destroy, subscriber set is empty (no notifications can fire)
- **ReentrantDepthBounded** -- reentrancy depth never exceeds MaxReentrantDepth (maps to 100 in implementation)
- **PendingNotifyValid** -- pending notification set is always within valid subscriber id domain
- **WaiterResultConsistent** -- resolved waiters always have a definite "ok" or "error" result
- **WaiterActiveNotResolved** -- active waiters are never simultaneously in the resolved set

### Liveness
- **DrainTerminates** -- every drain loop eventually completes (or store is destroyed)
- **PostDestroyDrainTerminates** -- after destroy, any in-progress drain eventually terminates
- **WaitForResolves** -- every active waitFor eventually resolves or errors (no leaked promises)

## Design Consensus Items Modeled
1. Reentrant depth guard (MaxReentrantDepth) with overflow detection
2. subscribe returns no-op after destroy (SubscribeAfterDestroy is a no-op action)
3. destroy check before each subscriber callback in drain loop (DrainNotify checks ~destroyed); DrainComplete guards on ~destroyed before applying queued patches; DrainAbortOnDestroy terminates stuck drains
4. reset during drain treated as reentrant update (enqueued in patchQueue)
5. Double destroy is explicit no-op (DoubleDestroy action)
6. waitFor with already-aborted signal returns error immediately (WaitForAlreadyAborted)
7. waitFor predicate that throws returns error result (WaitForPredicateError)
8. **onPropertyChange: intentional scoping limitation.** DrainNotify models notification bookkeeping only -- it does not model callback execution, side effects, or `shouldNotify: false`. The `shouldNotify` parameter is an implementation detail below this spec's abstraction level. Tests for onPropertyChange + shouldNotify:false must be derived independently.
9. queueMicrotask error surfacing modeled via depthOverflow flag
10. Post-destroy invariants: update is no-op, subscribe returns no-op, waitFor returns error

## TLC Results
- **States generated:** 6,549,122
- **Distinct states:** 762,048
- **Depth:** 24
- **Result:** PASS (no errors found)
- **Workers:** 24
- **Date:** 2026-04-04

## Prior Versions
None (v2 overwrites v1 in same directory)
