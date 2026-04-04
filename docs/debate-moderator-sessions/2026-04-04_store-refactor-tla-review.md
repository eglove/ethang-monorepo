# Debate Session — @ethang/store TLA+ Specification Review

**Date:** 2026-04-04
**Topic:** TLA+ Specification Review for @ethang/store Refactor
**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tla, expert-edge-cases, expert-tdd

---

## Debate Synthesis — store-refactor-tla-review

**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tla, expert-edge-cases, expert-tdd

---

### Agreed Recommendation

The TLA+ specification is substantially correct and provides meaningful coverage of the store refactor design. TLC passing with 17M+ states generated and no errors is strong evidence of internal consistency. However, the review identified five concrete issues that must be addressed before the spec can be considered a faithful model of the design consensus:

1. **DrainComplete must check `~destroyed` before applying queued patches (critical).** Currently, `DrainComplete` (line 201) does not guard on `~destroyed`. If `destroy()` is called during a drain, `DrainNotify` correctly skips notifications (it checks `~destroyed`), but `DrainComplete` will still dequeue and apply patches from `patchQueue` to `state`. This means state mutations continue after destroy. The design consensus item 3 says the drain should stop when destroyed. The briefing says post-destroy `update` is a silent no-op -- applying queued patches contradicts this. **Fix:** Add `/\ ~destroyed` as a conjunct to the `patchQueue /= <<>>` branch of `DrainComplete`, or add a separate `DrainAbortOnDestroy` action that clears the queue and exits the drain when `destroyed` is true.

2. **`Destroy` should resolve all active waiters atomically or the spec needs an intermediate safety invariant.** The `Destroy` action (line 269) sets `destroyed = TRUE` and clears `subscribers` but does not touch `waiters`. Active waiters are resolved by `WaitForDestroyError` in subsequent steps. Between `Destroy` and the `WaitForDestroyError` steps, the system is in a state where `destroyed = TRUE` and `waiters` is non-empty. While the liveness property `WaitForResolves` ensures eventual resolution (via fairness on `WaitForDestroyError`), this intermediate state should either be (a) prevented by resolving waiters atomically in `Destroy`, or (b) explicitly documented as an acceptable intermediate state with a comment. The current spec is technically correct due to fairness, but the two-step destroy-then-resolve pattern is fragile and should be annotated.

3. **`notifiedState` is dead state -- either use it in an invariant or remove it.** The variable `notifiedState` is set in `DrainComplete` (line 212) but is never referenced in any invariant, liveness property, or action guard. It occupies state space (multiplying distinct states) without contributing to verification. Either add the invariant it was intended to verify (e.g., `~draining /\ ~destroyed => notifiedState = state` -- subscribers have been notified of the current state), or remove it to reduce the state space. Given TLC already explored 2M+ distinct states, removing dead state could meaningfully reduce checking time for future spec iterations.

4. **Missing safety invariant: `destroyed => draining eventually becomes FALSE`.** The spec verifies `DrainTerminates` as a liveness property (`draining ~> (~draining \/ destroyed)`), but after destroy there is no guarantee the drain *actually* terminates -- only that it eventually does or the store is destroyed (which is already true). The post-destroy drain termination is a distinct concern. **Fix:** Add invariant or liveness property: `destroyed /\ draining ~> ~draining` (once destroyed, the drain must eventually stop). This requires fairness on `DrainComplete` (already present) but the property should be explicit.

5. **`onPropertyChange` is not modeled as a distinct action.** The design consensus item 9 requires that `onPropertyChange` fires within the batch and that an update called from `onPropertyChange` with `shouldNotify: false` applies the mutation without additional notification. The spec's README states this is "implicit in DrainNotify," but `DrainNotify` is a no-op action (it only removes from `pendingNotify`, it does not model the side effect of calling the subscriber callback). The `shouldNotify: false` path is entirely absent from the spec. This is acceptable if the spec is scoped to the state machine only (not the callback semantics), but it should be explicitly noted as a modeling limitation in the README.

**Secondary observations (not blocking but worth noting):**

6. **`PostDestroyNoNewSubs` (line 453) is identical to `PostDestroyNoNotifications` (line 449).** Both assert `destroyed => subscribers = {}`. One of them is redundant and should be removed or differentiated. Having two identical invariants does not add verification power but does add confusion.

7. **The `DestroyMonotonic` invariant (line 461) is commented as verified via action constraint but is never actually checked by TLC.** It references `destroyed'` (a primed variable), making it an action property, not a state invariant. It cannot be listed as an INVARIANT in the cfg file. Either convert it to a PROPERTY (temporal formula: `[](destroyed => []destroyed)`) and add it to the cfg, or remove the dead comment.

8. **`MaxUpdates` constant is declared but never used in the spec.** It appears in the CONSTANTS block and the cfg file but no action references it. If it was intended to bound the number of `Update` actions (to limit state space), it is not wired in. Remove it or add the guard.

---

### Expert Final Positions

**expert-tla**
Position: The spec is a strong first draft with correct modeling of the reentrant update/drain loop, waitFor lifecycle, and destroy semantics. The critical gap is DrainComplete not checking the destroyed flag before applying queued patches -- this allows post-destroy state mutations, which contradicts the design consensus. The notifiedState variable is dead state that inflates the state space without contributing to verification. The DestroyMonotonic invariant uses primed variables and cannot be checked as an INVARIANT.
Key reasoning: The state model is {ACTIVE, DESTROYED} x {IDLE, DRAINING} x {queue depth}. The DESTROYED + DRAINING + non-empty patchQueue state is reachable and the spec allows state mutations in that state via DrainComplete. This is the most important finding because it means the spec certifies a behavior the design explicitly prohibits. The fix is straightforward: add a destroyed guard to DrainComplete's queue-processing branch. After this fix, the drain will terminate without applying remaining patches when destroyed, which matches the design intent.
Endorsed: expert-edge-cases on the two-step destroy/waiter resolution being fragile; expert-tdd on onPropertyChange being an unverified modeling gap.

**expert-edge-cases**
Position: The spec handles the majority of edge cases identified in the original design debate (items 1-7, 10-11). The destroy-during-drain interaction is the most dangerous gap because it allows state to mutate after the store is logically dead. The two-step destroy pattern (Destroy clears subscribers, WaitForDestroyError resolves waiters separately) creates a window where the system is in an inconsistent intermediate state -- destroyed but with active waiters.
Key reasoning: The original debate identified six edge cases. The spec models five of them correctly: (1) reentrant depth overflow via DepthOverflowAction, (2) subscribe after destroy via SubscribeAfterDestroy, (5) double destroy via DoubleDestroy, (6) waitFor with already-aborted signal via WaitForAlreadyAborted, (7) waitFor predicate throws via WaitForPredicateError. The destroy-during-drain case (item 3) is partially modeled -- DrainNotify checks ~destroyed but DrainComplete does not. The reset-during-drain case (item 4) is correctly modeled via the patchQueue mechanism. The most subtle gap is that PostDestroyNoNotifications only checks subscribers = {} but does not verify that no pending state changes are applied post-destroy.
Endorsed: expert-tla on DrainComplete needing a destroyed guard; expert-tla on notifiedState being dead state.

**expert-tdd**
Position: The spec provides a formal foundation for test design but has modeling gaps that mean some test scenarios cannot be derived from the spec. Specifically, the onPropertyChange + shouldNotify:false interaction (consensus item 9) is entirely unmodeled, which means the spec cannot guide test writing for that critical backward-compatibility scenario. The test suite must cover this independently of the spec.
Key reasoning: A TLA+ spec serves two purposes: proving properties hold and guiding test case generation. The spec excels at the first (17M states checked) but has gaps in the second. The DrainNotify action is a no-op that does not model what happens when the callback executes (side effects, errors, reentrant updates from callbacks). The WaitFor lifecycle is thoroughly modeled and provides excellent test case guidance -- each WaitFor* action maps directly to a test case. The missing onPropertyChange model means the on-update.test.ts regression canary (identified as critical in the design debate) has no formal backing.
Endorsed: expert-tla on DrainComplete destroyed guard being critical; expert-edge-cases on the intermediate destroyed-with-active-waiters state.

---

## Round Transcripts

### Round 1

**expert-tla**

Position: The spec is structurally sound but has one critical and two moderate issues that affect correctness relative to the design consensus.

State Model Review:
- Store states: {ACTIVE, DESTROYED} -- correctly modeled via `destroyed` boolean
- Drain sub-states: {IDLE, DRAINING with pending, DRAINING with queue} -- correctly modeled via `draining`, `pendingNotify`, `patchQueue`
- Waiter states: {NOT_STARTED, WAITING, RESOLVED_OK, RESOLVED_ERROR} -- correctly modeled via `waiters`, `waiterResolved`, `waiterResult`
- Subscriber lifecycle: correctly modeled via `firstSubFired`, `lastSubFired`, `controllerAborted`

Transition Analysis:
- Update(newState): IDLE -> DRAINING -- correct, guards on ~destroyed, ~draining, newState /= state
- ReentrantUpdate(newState): DRAINING -> DRAINING (with queue) -- correct, guards on ~destroyed, draining, depth < max
- DrainNotify(s): DRAINING -> DRAINING -- correct, guards on ~destroyed
- DrainComplete: DRAINING -> IDLE or DRAINING -> DRAINING (dequeue) -- **ISSUE**: does not guard on ~destroyed in the dequeue branch
- Reset: IDLE -> DRAINING or DRAINING -> DRAINING (enqueue) -- correct per consensus item 4
- Destroy: ACTIVE -> DESTROYED -- correct, clears subscribers, aborts controller

Critical Issue: DrainComplete at line 204 does not check `~destroyed`. When `destroyed = TRUE` and `patchQueue /= <<>>`, the THEN branch fires: it applies `Head(patchQueue)` to `state` and sets `pendingNotify = subscribers`. Since `subscribers = {}` (cleared by Destroy), no notifications fire, but the state value is mutated. This means the store's internal state changes after destroy. The design says "update -> silent no-op" post-destroy. Queued patches are effectively deferred updates. If destroy should halt all state changes, DrainComplete must check destroyed.

Moderate Issue 1: `notifiedState` is written but never read. It appears in TypeOK and Init but no invariant or action guard references it. This inflates the state space.

Moderate Issue 2: `DestroyMonotonic` (line 461) uses `destroyed'` (primed variable). This is an action property, not a state invariant. It cannot be checked via INVARIANT in the cfg. The comment says "verified via PostDestroyNoNotifications" but that invariant only checks `subscribers = {}`, not monotonicity of the destroyed flag.

Objections:
- DrainComplete allows post-destroy state mutations -- contradicts design consensus item 3 and briefing
- notifiedState is dead state that wastes state space
- DestroyMonotonic is uncheckable as written

Endorsements: None (first round)

---

**expert-edge-cases**

Position: The spec covers 5 of 6 original edge cases correctly but has gaps in the destroy-during-drain interaction and an inconsistent intermediate state after Destroy.

Edge Cases Checked Against Design Consensus:

- [item 1] Reentrant depth guard: MODELED. `DepthOverflowAction` fires when `reentrantDepth >= MaxReentrantDepth`. Sets `depthOverflow = TRUE`. Correctly prevents further reentrant updates.
- [item 2] Subscribe return type post-destroy: MODELED (implicitly). `SubscribeAfterDestroy` is UNCHANGED vars -- a no-op. This aligns with returning `() => void` (no-op unsubscribe). However, the spec does not distinguish "returns error" from "returns no-op function" -- it just models no state change. Acceptable for state-level modeling.
- [item 3] Destroy during drain: PARTIALLY MODELED. DrainNotify checks `~destroyed` (correct -- skips callbacks). But DrainComplete does NOT check `~destroyed` -- applies queued patches even after destroy. The drain continues mutating state on a destroyed store.
- [item 4] Reset during drain: CORRECTLY MODELED. Reset enqueues `initialState` in `patchQueue` when draining, or starts a new drain when idle. Matches consensus exactly.
- [item 5] Double destroy: CORRECTLY MODELED. `DoubleDestroy` is UNCHANGED vars. No state change on second call.
- [item 6] waitFor with already-aborted signal: CORRECTLY MODELED. `WaitForAlreadyAborted` checks `w \in waiterAborted` and resolves with error.
- [item 7] waitFor predicate throws: CORRECTLY MODELED. `WaitForPredicateError` resolves with error immediately.

Sequence Issue -- Destroy + Waiters:
`Destroy` clears `subscribers` but does not resolve `waiters`. Between `Destroy` and `WaitForDestroyError`, the store is destroyed with active waiters. The liveness property `WaitForResolves` with weak fairness on `WaitForDestroyError` ensures eventual resolution, but this two-step pattern means there is a reachable state where `destroyed = TRUE /\ waiters /= {}`. This is technically correct but fragile -- if someone adds an action later that checks `waiters = {} => destroyed`, it would fail.

Redundancy: `PostDestroyNoNotifications` and `PostDestroyNoNewSubs` are identical formulas. One should be removed.

Objections:
- DrainComplete applies queued patches after destroy -- state mutates on a dead store
- Two-step destroy/waiter resolution creates fragile intermediate state
- PostDestroyNoNotifications and PostDestroyNoNewSubs are identical

Endorsements: None (first round)

---

**expert-tdd**

Position: The spec provides strong formal backing for most test scenarios but has a significant modeling gap around onPropertyChange that limits test derivation.

Test Derivation Analysis:

The spec's actions map well to test cases:
- `Update` + `DrainNotify` + `DrainComplete` -> test: "update notifies all subscribers"
- `ReentrantUpdate` + drain queue processing -> test: "reentrant update batches notifications"
- `DepthOverflowAction` -> test: "reentrant depth exceeding 100 surfaces error via queueMicrotask"
- `Subscribe` + `Unsubscribe` + lifecycle hooks -> test: "onFirstSubscriber/onLastSubscriberRemoved fire correctly"
- `Destroy` + `SubscribeAfterDestroy` -> test: "subscribe after destroy returns no-op"
- `WaitForImmediate` -> test: "waitFor resolves immediately when predicate is true"
- `WaitForStart` + `WaitForResolve` -> test: "waitFor resolves when state changes to match"
- `WaitForAlreadyAborted` -> test: "waitFor with pre-aborted signal returns error"
- `WaitForPredicateError` -> test: "waitFor with throwing predicate returns error"
- `WaitForDestroyError` + `WaitForAfterDestroy` -> test: "waitFor on destroyed store returns error"
- `Reset` during drain -> test: "reset during notification treated as reentrant update"

Gap -- onPropertyChange + shouldNotify:false:
Consensus item 9 is critical: the existing `on-update.test.ts` calls `update` with `shouldNotify: false` inside `onPropertyChange`. The spec's `DrainNotify` action is a pure bookkeeping action -- it removes a subscriber from `pendingNotify` but does not model the callback execution, side effects, or the `shouldNotify` parameter. There is no `UpdateWithoutNotify` action. This means:
- The spec cannot verify that `shouldNotify: false` skips notification
- The spec cannot verify that reentrant updates from onPropertyChange interact correctly with the batch
- The backward-compatibility canary test has no formal backing

This is acceptable if documented as a scoping limitation, but the README currently claims item 9 is modeled ("implicit in DrainNotify") which overstates what the spec actually verifies.

Gap -- MaxUpdates constant unused:
The cfg sets `MaxUpdates = 2` but no action uses this constant. It may have been intended to bound the number of Update actions for state space reduction but was never wired in.

Objections:
- onPropertyChange is not modeled; README overstates coverage of consensus item 9
- MaxUpdates constant is declared but unused -- dead configuration
- DrainNotify does not model callback execution, limiting the spec's ability to verify notification semantics

Endorsements: None (first round)

---

### Round 2

All experts reviewed Round 1 outputs. No new objections were raised.

**expert-tla:** Endorsed expert-edge-cases on the two-step destroy/waiter resolution being a fragile intermediate state. Endorsed expert-tdd on onPropertyChange being a genuine modeling gap that the README overstates. Reiterated that DrainComplete's missing destroyed guard is the most critical finding.

**expert-edge-cases:** Endorsed expert-tla on the DrainComplete destroyed guard being critical and on notifiedState being dead state. Noted that the two-step Destroy pattern is safe given current fairness constraints but should be explicitly documented as an accepted intermediate state.

**expert-tdd:** Endorsed expert-tla on DrainComplete's missing destroyed guard being the priority fix. Endorsed expert-edge-cases on the intermediate destroyed-with-waiters state. Reiterated that onPropertyChange modeling is the most important gap for test derivation purposes.

**Consensus reached: no new objections in Round 2.**

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-04_store-refactor-tla-review.md
