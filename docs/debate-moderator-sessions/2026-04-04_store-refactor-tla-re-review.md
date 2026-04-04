# Debate Session — @ethang/store TLA+ Specification Re-Review

**Date:** 2026-04-04
**Topic:** Re-Review of Revised TLA+ Specification for @ethang/store Refactor
**Result:** CONSENSUS REACHED
**Rounds:** 1
**Experts:** expert-tla, expert-edge-cases, expert-tdd

---

## Debate Synthesis — store-refactor-tla-re-review

**Result:** CONSENSUS REACHED
**Rounds:** 1
**Experts:** expert-tla, expert-edge-cases, expert-tdd

---

### Agreed Recommendation

The revised TLA+ specification correctly addresses all 5 issues and 3 secondary cleanups identified in the original review. TLC passing with 6,549,122 states generated (762,048 distinct, 63% reduction from v1) confirms the revised spec is internally consistent. The specification is approved for use as a formal foundation for implementation.

**Issue-by-Issue Verification:**

1. **DrainComplete destroyed guard (CRITICAL -- FIXED).** Line 215 now guards on `patchQueue /= <<>> /\ ~destroyed` before applying queued patches. The ELSE branch (lines 221-225) clears `patchQueue`, exits the drain, and resets `reentrantDepth`. Post-destroy state mutations are no longer possible. The fix is correct.

2. **Destroy + waiters atomicity annotation (FIXED).** Lines 295-305 contain a detailed ATOMICITY NOTE explaining that the intermediate state (`destroyed = TRUE`, `waiters` non-empty) is safe due to weak fairness on `WaitForDestroyError`. The comment explicitly warns against adding invariants that assume `destroyed => waiters = {}`. Adequate documentation.

3. **notifiedState removal (FIXED).** The variable is completely absent from `vars`, `Init`, `TypeOK`, and all actions. No references remain. The README documents the 63% state space reduction. Clean removal with no breakage.

4. **PostDestroyDrainTerminates liveness property (FIXED).** Lines 521-522 assert `(destroyed /\ draining) ~> ~draining`. This is strictly stronger than `DrainTerminates` (which allows `destroyed` as a vacuous resolution). The property is enabled by `DrainAbortOnDestroy` with weak fairness. Correctly expressed.

5. **onPropertyChange scoping limitation (FIXED).** Module header (lines 9-17) explicitly documents that `DrainNotify` does not model callback execution, side effects, or `shouldNotify: false`. The `DrainNotify` action (lines 188-193) has a cross-reference NOTE. README item 8 now says "intentional scoping limitation" and no longer overclaims coverage. Tests for `onPropertyChange + shouldNotify:false` must be derived independently.

**Secondary Cleanup Verification:**

6. **Redundant `PostDestroyNoNewSubs` invariant removed.** Only `PostDestroyNoNotifications` remains (line 488). The cfg file lists 6 invariants, all distinct. Clean.

7. **Uncheckable `DestroyMonotonic` invariant removed.** Not present in spec or cfg. README documents that monotonicity is enforced structurally (only `Destroy` sets `destroyed = TRUE`, no action sets `destroyed = FALSE`). Correct.

8. **Unused `MaxUpdates` constant removed.** Not in CONSTANTS block or cfg. Clean.

**New DrainAbortOnDestroy action (lines 240-251):** Correctly resolves the deadlock where `destroyed /\ draining /\ pendingNotify /= {}` would be a stuck state (DrainNotify requires `~destroyed`, DrainComplete requires `pendingNotify = {}`). The action clears `pendingNotify`, `patchQueue`, resets `reentrantDepth`, and exits the drain. Weak fairness on `DrainAbortOnDestroy` (line 474) guarantees it eventually fires. Correct.

**One minor observation (non-blocking):**

- **DrainComplete has a redundant `reentrantDepth` assignment.** Lines 222-224 set `reentrantDepth' = 0` in the ELSE branch. Lines 230-232 also set `reentrantDepth' = 0` for the same condition. Both conjuncts agree so TLA+ handles it correctly, but the split conditional structure is inelegant. This is a style issue, not a correctness issue. TLC verified the logic across 6.5M states.

**No new correctness issues were introduced by the revision.**

---

### Expert Final Positions

**expert-tla**
Position: All 5 issues are correctly resolved. The spec is a faithful model of the design consensus with one intentional scoping limitation (onPropertyChange). The DrainAbortOnDestroy action is well-designed -- it precisely targets the stuck state and its fairness annotation is appropriate.
Key reasoning: The critical fix (DrainComplete destroyed guard) works because the IF-THEN-ELSE partitions the state space cleanly: if the queue has items AND the store is alive, dequeue and re-notify; otherwise, exit the drain and discard any remaining queue. The DrainAbortOnDestroy action handles the complementary case where `pendingNotify` is non-empty after destroy. Together, these two changes guarantee that every reachable post-destroy state eventually reaches `~draining`, which is exactly what `PostDestroyDrainTerminates` verifies. The split conditional for `reentrantDepth` in DrainComplete (lines 230-232) is redundant with the ELSE branch assignment but harmless.
Endorsed: expert-edge-cases on the DrainAbortOnDestroy deadlock resolution; expert-tdd on the onPropertyChange scoping limitation being properly documented.

**expert-edge-cases**
Position: All edge cases from the original review are resolved. The DrainAbortOnDestroy action closes the last gap in destroy-during-drain handling. The destroy + waiters atomicity documentation prevents future misuse.
Key reasoning: The original review identified that `destroyed /\ draining /\ pendingNotify /= {}` was a stuck state. DrainAbortOnDestroy resolves this precisely. The edge case matrix is now complete: (1) destroy while idle -- Destroy action handles it; (2) destroy during drain with pending notifications -- DrainAbortOnDestroy handles it; (3) destroy during drain with empty pendingNotify but non-empty patchQueue -- DrainComplete ELSE branch handles it (discards queue). The atomicity note on Destroy (lines 295-305) is thorough and correctly warns against future invariant additions.
Endorsed: expert-tla on the DrainComplete fix being correct; expert-tdd on documentation adequacy.

**expert-tdd**
Position: The revised spec provides a correct formal foundation for test derivation. The onPropertyChange scoping limitation is now properly documented, which means the test plan for `onPropertyChange + shouldNotify:false` must be designed without formal backing from this spec. All other test scenarios can be derived from the spec actions.
Key reasoning: The DrainAbortOnDestroy action maps to a new test case: "destroy during active drain with pending notifications terminates the drain without processing remaining callbacks." The PostDestroyDrainTerminates liveness property backs the test assertion: "after destroy, no further subscriber callbacks fire." The spec now correctly reflects the design intent, which means test cases derived from it will test the right behavior. The onPropertyChange gap is acceptable given the explicit documentation.
Endorsed: expert-tla on all 5 fixes being correct; expert-edge-cases on the edge case matrix being complete.

---

## Round Transcripts

### Round 1

**expert-tla**

Position: The revised spec addresses all issues from the original review. No new correctness issues found.

Issue-by-Issue Analysis:

1. DrainComplete destroyed guard: The THEN branch (line 215) now conjoins `patchQueue /= <<>> /\ ~destroyed`. When destroyed, the ELSE branch fires regardless of queue contents. This ELSE branch sets `patchQueue' = <<>>` (line 224), discarding remaining patches. The state value is not mutated (`UNCHANGED <<state, pendingNotify>>` at line 225). Correct.

2. Destroy + waiters: The ATOMICITY NOTE (lines 295-305) clearly explains the two-step pattern. The comment warns against `destroyed => waiters = {}` invariants. The liveness property `WaitForResolves` (lines 526-527) with weak fairness on `WaitForDestroyError` (line 477) guarantees eventual resolution. Adequate.

3. notifiedState: Completely removed from all declarations, Init, TypeOK, and actions. State space reduced from 2,075,088 to 762,048 distinct states (63% reduction). No references remain.

4. PostDestroyDrainTerminates: Line 521-522: `(destroyed /\ draining) ~> ~draining`. This is enabled by DrainAbortOnDestroy (weak fairness, line 474) and DrainComplete (weak fairness, line 473). The property asserts that post-destroy draining must eventually become FALSE, which is stronger than the original DrainTerminates that allowed destroyed as a resolution. Correct.

5. onPropertyChange: Module header (lines 9-17) documents the scoping limitation. DrainNotify (lines 188-193) cross-references it. README item 8 says "intentional scoping limitation." No longer overclaims.

DrainAbortOnDestroy Analysis (lines 240-251):
- Guard: `draining /\ destroyed /\ pendingNotify /= {}` -- targets exactly the stuck state.
- Effect: clears pendingNotify, patchQueue, resets reentrantDepth, exits drain.
- In Next relation (line 453). Weak fairness (line 474). Correct.

Minor: DrainComplete has redundant reentrantDepth assignment. Lines 222-224 set it to 0 in ELSE branch; lines 230-232 set it to 0 again for the same condition. TLA+ conjoins these (both agree), so it is correct but redundant.

Objections: None.

Endorsements: expert-edge-cases on DrainAbortOnDestroy deadlock resolution being correct.

---

**expert-edge-cases**

Position: All edge cases from the original review are resolved. No new edge cases introduced.

Edge Case Verification:

- [item 3, destroy during drain] FULLY MODELED. Three sub-cases:
  - pendingNotify non-empty: DrainAbortOnDestroy fires, clears everything.
  - pendingNotify empty, patchQueue non-empty: DrainComplete ELSE fires (since `~destroyed` fails the THEN guard), discards queue.
  - pendingNotify empty, patchQueue empty: DrainComplete ELSE fires, exits drain normally.
  All three terminate the drain without applying post-destroy state changes.

- [atomicity gap] Destroy does not resolve waiters atomically. The ATOMICITY NOTE (lines 295-305) documents this. WaitForDestroyError + weak fairness resolves all waiters eventually. WaitForResolves liveness property verifies. Acceptable.

- [deadlock] The original review did not explicitly identify the pendingNotify deadlock, but it was implicit in the DrainComplete fix request. DrainAbortOnDestroy resolves it. Without this action, `destroyed /\ draining /\ pendingNotify /= {}` would be a deadlock (DrainNotify requires ~destroyed, DrainComplete requires pendingNotify = {}). The action is necessary and correct.

- [redundant invariants] PostDestroyNoNewSubs removed. Only PostDestroyNoNotifications remains. Clean.

- [uncheckable property] DestroyMonotonic removed. Monotonicity enforced structurally. Clean.

- [unused constant] MaxUpdates removed. Clean.

Objections: None.

Endorsements: expert-tla on all 5 fixes being correct; expert-tdd on documentation adequacy.

---

**expert-tdd**

Position: The revised spec is suitable as a test derivation foundation. The documented scoping limitation for onPropertyChange is acceptable.

Test Derivation from Revised Spec:

New test cases enabled by revision:
- "destroy during drain with pending notifications terminates drain" -- from DrainAbortOnDestroy action
- "destroy during drain discards queued patches" -- from DrainComplete ELSE branch clearing patchQueue
- "post-destroy, no queued state mutations are applied" -- from PostDestroyDrainTerminates liveness

Documentation check:
- Module header (lines 9-17): Clearly states onPropertyChange is not modeled. States that shouldNotify:false is an implementation detail below this spec's abstraction level. States tests must be derived independently. Adequate.
- README item 8: "intentional scoping limitation" -- no longer overclaims. Adequate.
- ATOMICITY NOTE on Destroy: Documents the intermediate state. Adequate for preventing future test assertions from assuming destroyed => waiters = {}.

Minor: The redundant reentrantDepth assignment in DrainComplete is a readability issue, not a correctness issue. Not blocking.

Objections: None.

Endorsements: expert-tla on all fixes being correct; expert-edge-cases on edge case matrix being complete.

---

**Consensus reached: no new objections in Round 1. All 5 original issues and 3 secondary cleanups verified as correctly addressed. One non-blocking style observation noted (redundant reentrantDepth assignment in DrainComplete).**

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-04_store-refactor-tla-re-review.md
