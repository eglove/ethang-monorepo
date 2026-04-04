# Debate Session — @ethang/store Refactor

**Date:** 2026-04-04
**Topic:** @ethang/store Refactor — waitFor, Reentrant Safety, Lifecycle, Functional Error Handling
**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tdd, expert-edge-cases, expert-tla, expert-performance, expert-lodash

---

## Debate Synthesis — store-refactor

**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tdd, expert-edge-cases, expert-tla, expert-performance, expert-lodash

---

### Agreed Recommendation

The design in the briefing is fundamentally sound. The shift from persistence to synchronization, the reentrant-safe update with batched notifications, `waitFor`, lifecycle methods, and functional error handling are all well-motivated and coherent. However, the following gaps must be resolved before implementation proceeds:

1. **Reentrant depth guard (liveness):** The drain loop must have a maximum reentrancy depth (recommended: 100 iterations). If exceeded, surface via `queueMicrotask` as a hard error. Without this, a subscriber that triggers an update whose notification triggers another update can loop infinitely. This is a liveness violation that the design currently does not prevent.

2. **`subscribe` return type must remain `() => void`:** Returning an error result from `subscribe` after destroy changes the API contract in a way that breaks `useStore`. React's `useSyncExternalStoreWithSelector` expects the subscribe callback to return an unsubscribe function unconditionally. The solution is: post-destroy, `subscribe` returns a no-op unsubscribe function (not an error result). This preserves the type contract. The `_destroyed` state can be checked elsewhere if consumers need to know (e.g., via a `destroyed` getter). `waitFor` can still return an error result since it is a new API with no existing contract.

3. **`destroy()` during active drain loop:** If `destroy()` is called by a subscriber callback during the notification drain, the remaining subscribers in the current iteration should be skipped (check `_destroyed` flag before each callback invocation). The drain loop must check the destroyed flag on each iteration, not just at entry.

4. **`reset()` during drain loop:** `reset()` called during notification should be treated as a reentrant update -- it enqueues a state replacement that takes effect after the current drain completes, then fires a single notification with the reset state.

5. **Double `destroy()`:** Must be explicitly a no-op on the second call. If `_destroyed` is already true, return immediately. The `AbortController.abort()` is already idempotent, but the flag check should be first.

6. **`waitFor` with already-aborted signal:** Must return an error result immediately if the provided `AbortSignal` is already aborted at call time. Test this explicitly.

7. **`waitFor` predicate that throws:** Wrap the predicate call in `attempt`. If it throws, return an error result rather than letting the exception propagate. This is consistent with the functional error handling philosophy.

8. **`isError` import must be retained:** The notification drain loop uses `attempt(() => callback(state))` and needs `isError` to check the result. The briefing incorrectly lists `isError` as removed. It must be kept alongside `attempt`.

9. **`onPropertyChange` compatibility:** The existing `on-update.test.ts` test calls `update` with `shouldNotify: false` inside `onPropertyChange`. The new batched model must preserve this behavior -- `onPropertyChange` fires within the batch, and an update called from `onPropertyChange` with `shouldNotify: false` should apply the mutation without triggering additional notification. Verify this test passes unchanged after the refactor.

10. **`queueMicrotask` error surfacing:** Accepted trade-off. Errors from subscriber callbacks surfaced via `queueMicrotask` will not be caught by React error boundaries. This is correct behavior -- subscriber errors are not component render errors. They will appear as uncaught exceptions in the console. Document this in the README.

11. **Consistent error handling utilities:** Use `attempt` from lodash for synchronous error wrapping and `attemptAsync` from `@ethang/toolbelt` for async. This is acceptable since they serve different use cases (sync vs async). Document the convention in a code comment at the import site.

---

### Expert Final Positions

**expert-tla**
Position: The design is sound as a state machine but has two unguarded transitions: infinite reentrancy (liveness violation) and reset/destroy during drain (unmodeled states). With the depth guard and drain-loop destroy check, the state model is complete.
Key reasoning: The store has states {ACTIVE, DESTROYED} and the update loop has sub-states {IDLE, DRAINING, QUEUED}. The DRAINING -> QUEUED -> DRAINING cycle must terminate, which requires a depth bound. The DRAINING + DESTROYED combination is a reachable state that the briefing does not address. Both are fixable without redesign.
Endorsed: expert-edge-cases on destroy-during-drain and double-destroy; expert-performance on pragmatic depth cap.

**expert-edge-cases**
Position: The design handles the happy path well but has six unaddressed edge cases (destroy during drain, double destroy, already-aborted signal, predicate throws, subscribe return type, reset during drain). All are fixable. The most critical is the subscribe return type -- it silently breaks useStore.
Key reasoning: The functional error handling philosophy is admirable but must not change the type signature of existing public APIs that external consumers (React hooks) depend on. Returning an error result from `subscribe` would cause `useSyncExternalStoreWithSelector` to receive a non-callable value, crashing React. The fix is simple: return a no-op function post-destroy. For `waitFor`, which is a new API, error results are fine.
Endorsed: expert-tla on reentrancy liveness; expert-lodash on isError retention.

**expert-tdd**
Position: The test strategy is adequate but must explicitly cover the 6 edge cases identified. The existing `on-update.test.ts` is a canary for the batched model -- if it passes unchanged, the refactor preserves backward compatibility. The subscribe return type issue would be caught by TypeScript during test compilation, so it would surface early.
Key reasoning: The red-green-refactor cycle works well here. Write failing tests for reentrant depth overflow, destroy-during-drain, waitFor-with-aborted-signal, and waitFor-predicate-throws before implementing them. The existing tests provide a regression safety net. The functional error handling pattern is testable -- assert on error result shapes rather than catching thrown exceptions.
Endorsed: expert-edge-cases on subscribe return type (TypeScript would catch it, but it's a design issue not a test issue); expert-tla on writing reentrancy overflow tests.

**expert-performance**
Position: The batching improves performance for the reentrant case (one notification instead of N). The depth guard adds negligible overhead (one counter increment per update call). The main cost center remains immer's `produce` with patches enabled, which is justified by `onPropertyChange`. No performance objections.
Key reasoning: The common case (non-reentrant update) adds one boolean check and one counter increment. The `waitFor` subscriptions are bounded by caller behavior. The `queueMicrotask` error surfacing has zero cost when no errors occur. The only speculative concern is many simultaneous `waitFor` calls each holding a subscription, but this is caller-bounded and not the store's responsibility to limit.
Endorsed: expert-tla on depth cap (100 is reasonable); expert-edge-cases on all edge cases being low-cost to guard.

**expert-lodash**
Position: The lodash usage is correct but the briefing has an inventory error -- `isError` must be retained for the `attempt` pattern in the notification drain. The mixed use of `attempt` (lodash, sync) and `attemptAsync` (@ethang/toolbelt, async) is acceptable since they serve different domains.
Key reasoning: `attempt(() => callback(state))` returns either the callback's return value or an Error object. Checking the result requires `isError`. Removing `isError` from the imports while introducing `attempt` in the drain loop is contradictory. The fix is simple: keep the import. Per-method import `import isError from "lodash/isError.js"` is tree-shakable and adds negligible bundle size.
Endorsed: expert-edge-cases on subscribe return type (lodash has no stake but the reasoning is sound).

---

## Round Transcripts

### Round 1

**expert-tla**

Position: The design is a valid state machine with two unguarded transitions that create liveness and safety risks.

State Model:
- Store states: ACTIVE, DESTROYED
- Update sub-states: IDLE, DRAINING (notifying subscribers), QUEUED (reentrant update pending)
- Transitions: IDLE -> DRAINING (on update with patches), DRAINING -> QUEUED (reentrant update during notification), QUEUED -> DRAINING (after current drain completes), DRAINING -> IDLE (all notifications complete, no queued updates), ACTIVE -> DESTROYED (on destroy)

Reasoning: The DRAINING -> QUEUED -> DRAINING cycle has no termination guarantee. A subscriber that calls `update`, whose `onPropertyChange` calls `update`, creates an unbounded recursion. This is a liveness violation -- the system may never return to IDLE. Additionally, `reset()` and `destroy()` during DRAINING are reachable states that the briefing does not model. The DESTROYED state during DRAINING means the loop must check destruction mid-iteration.

Objections:
- No max-depth or termination guard on the drain loop -- liveness violation
- `reset()` during drain loop is unspecified -- is it reentrant or does it bypass?
- `destroy()` during drain loop is unspecified -- remaining subscribers may receive stale callbacks

Endorsements: None (first round)

---

**expert-edge-cases**

Position: The design has six unaddressed edge cases, the most critical being the `subscribe` return type change.

Edge Cases Found:
- [sequence] `destroy()` called during notification drain -- remaining subscribers skip or crash?
- [sequence] Double `destroy()` -- is second call safe?
- [boundary] `waitFor` with already-aborted signal -- immediate error result needed
- [boundary] `waitFor` predicate throws -- unspecified behavior
- [type contract] `subscribe` returns error result post-destroy -- breaks `useSyncExternalStoreWithSelector` which expects `() => void`
- [sequence] `reset()` during notification drain -- interaction with batch queue unspecified
- [boundary] `waitFor` predicate that is immediately true at call time -- briefing says resolves immediately, good

Reasoning: The subscribe return type issue is the most dangerous because it silently changes a public API contract. `useSyncExternalStoreWithSelector` calls the subscribe function and expects it to return an unsubscribe callback. If it returns an error result object, React will later try to call it as a function during cleanup, causing a runtime crash. This would not be caught by the store's own tests unless `useStore` is tested with a destroyed store. The fix is straightforward: return a no-op `() => {}` post-destroy instead of an error result.

Objections:
- Subscribe post-destroy returning error result breaks useStore (critical)
- Destroy during drain, double destroy, waitFor with aborted signal, waitFor predicate throws -- all need explicit handling
- reset() during drain needs specification

Endorsements: None (first round)

---

**expert-tdd**

Position: The test strategy is sound but incomplete. Six edge cases need test coverage before implementation.

Reasoning: The existing test suite provides a solid regression baseline. The `on-update.test.ts` file is particularly important -- it tests `onPropertyChange` calling `update` with `shouldNotify: false`, which is the exact pattern that the batched notification model must preserve. If this test passes unchanged after the refactor, backward compatibility is confirmed. The proposed test locations (waitFor in a separate file, reentrant/error tests in index.test.ts) are appropriate. However, the test plan must include: (1) reentrant depth overflow, (2) destroy during drain, (3) waitFor with pre-aborted signal, (4) waitFor with throwing predicate, (5) double destroy, (6) reset during drain. These should be written as failing tests first.

Objections:
- The `on-update.test.ts` behavior must be verified as preserved -- this is a regression canary
- Missing edge case tests in the plan (6 cases listed above)
- The subscribe return type change would cause TypeScript compilation errors in useStore -- this surfaces at compile time, not test time

Endorsements: None (first round)

---

**expert-performance**

Position: The design improves performance for the reentrant case and introduces no measurable overhead for the common case. No performance objections.

Reasoning: Batching notifications is strictly better than the current per-update notification model for reentrant updates. The common non-reentrant path adds one boolean check (`_isDraining`) and one counter check (`_depth`), which are negligible. The `queueMicrotask` error surfacing has zero overhead when no subscriber throws. `waitFor` creates one subscription per pending call, which is bounded by caller behavior. The main cost center (immer `produce` with patches) is already present and justified by `onPropertyChange`. The only speculative concern is many simultaneous `waitFor` calls, but this is not the store's responsibility to limit.

Objections:
- (Speculative) `queueMicrotask` errors are not caught by React error boundaries -- this is a trade-off, not a bug, but should be documented

Endorsements: None (first round)

---

**expert-lodash**

Position: Lodash usage is correctly planned but the briefing has an inventory contradiction regarding `isError`.

Reasoning: The briefing states `isError` import call sites will be removed because they are in localStorage code. However, the notification drain pattern `const result = attempt(() => callback(state)); if (isError(result)) { queueMicrotask(...) }` requires `isError`. The briefing simultaneously removes `isError` and introduces a pattern that needs it. This is a documentation error, not a design flaw -- the fix is to keep the `isError` import. The `attempt` from lodash for sync and `attemptAsync` from `@ethang/toolbelt` for async is a reasonable split since lodash does not provide an async attempt.

Objections:
- `isError` import listed as removed but needed for notification drain -- briefing contradiction
- Mixed `attempt`/`attemptAsync` from different packages could confuse developers -- recommend a code comment explaining the convention

Endorsements: None (first round)

---

### Round 2

All experts reviewed Round 1 outputs. No new objections were raised. Experts cross-endorsed each other's positions as follows:

**expert-tla:** Endorsed expert-edge-cases on destroy-during-drain (reachable state that must be guarded) and expert-performance on pragmatic depth cap of 100.

**expert-edge-cases:** Endorsed expert-tla on reentrancy liveness violation and expert-lodash on isError retention. Reiterated that subscribe return type is the most critical fix.

**expert-tdd:** Endorsed expert-edge-cases on subscribe return type and expert-tla on writing reentrancy overflow tests first. Noted that TypeScript would catch the subscribe issue at compile time.

**expert-performance:** Endorsed expert-tla on depth cap being negligible overhead and expert-edge-cases on all guards being low-cost.

**expert-lodash:** Endorsed expert-edge-cases on subscribe return type reasoning. No new lodash-specific concerns.

**Consensus reached: no new objections in Round 2.**

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-04_store-refactor.md
