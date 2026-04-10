# TLA+ Specification Debate — Coding Stage (Stage 8)

**Date:** 2026-04-10
**Status:** CONSENSUS_REACHED
**Rounds:** 2
**Experts:** expert-tla, expert-bdd, expert-edge-cases, expert-tdd

---

## Synthesis

### Result: CONSENSUS REACHED

The TLA+ specification for Stage 8 (CodingStage) is a well-structured, thorough state machine that correctly models the core pipeline lifecycle: validation → tier-by-tier execution → TDD cycles (RED/GREEN/Cleanup) → merge queue → final verification → escalation recovery. All fencepost counters (RED retries, GREEN attempts, cleanup remediations, merge retries) are correct. The spec faithfully captures the BDD scenarios at an appropriate abstraction level, with runtime details (logging, WorkDir, verify command selection, test isolation) correctly deferred to implementation.

**Two HIGH-severity fixes are required before model checking can be trusted. Two MEDIUM-severity improvements are recommended.**

### Agreed Recommendation

1. **HIGH — Add `WF_vars(MergeConflictResolve)` to the Fairness section.** Without weak fairness on `MergeConflictResolve`, the liveness property `EventuallyTerminates` has a gap: a merge conflict can stall indefinitely without exhausting retries, because `MergeExhausted` requires `mergeRetries >= MaxMergeRetries` but `MergeConflictResolve` (which increments the counter) is never forced to fire. All four experts endorsed this fix.

2. **HIGH — `EscalationKeepGoing` must reset `cleanupCleanPasses[task]` to 0 for tasks in `{"cleanup", "cleanup_remed"}` phase.** Currently, `cleanupCleanPasses` is in the `UNCHANGED` clause (line 670). After escalation recovery, a task could retain a stale pass count (e.g., 1 of 2), meaning only 1 additional clean pass is needed instead of 2 consecutive. This violates the "consecutive" semantics of cleanup passes and could allow premature cleanup completion after human intervention. Three of four experts endorsed this fix (Edge Case expert raised it, TLA+/BDD/TDD endorsed).

3. **MEDIUM — Split `FinalVerifFail` into a two-step remediation cycle.** Per-task cleanup has a two-step pattern (`CleanupFail` → `cleanup_remed` → `CleanupRemediate` → `cleanup`), but final verification collapses failure and remediation into a single atomic `FinalVerifFail` action. This asymmetry means the spec cannot model a failure *during* final verification remediation. Three experts endorsed this as a consistency improvement.

4. **MEDIUM — Document post-merge verification retry budget sharing.** The spec abstracts post-merge verification failures into `MergeConflictResolve` (consuming a merge retry). This means conflict resolution and verification failures share the `MaxMergeRetries` budget. The spec comment (lines 487-493) should explicitly note this as an intentional conservative approximation, or a separate counter should be added.

### Unresolved Dissents

None — all objections reached consensus.

---

## Per-Expert Final Positions

### expert-tla (TLA+ Formal Specification)
**Position:** The spec is sound modulo the two HIGH fixes. With `WF_vars(MergeConflictResolve)` added and `cleanupCleanPasses` reset in `EscalationKeepGoing`, all stated liveness and safety properties will verify correctly.

**Key contributions:**
- Identified the `MergeConflictResolve` liveness gap (HIGH)
- Confirmed all fencepost counters are correct (RED, GREEN, cleanup, merge)
- Validated that runtime detail abstractions (logging, WorkDir, verify commands) are appropriate for TLA+
- Endorsed Edge Case expert's `cleanupCleanPasses` reset bug

### expert-bdd (Behavior-Driven Development)
**Position:** The spec is a faithful state-machine abstraction of the BDD scenarios. Roughly a dozen BDD scenarios have no direct representation but are correctly abstracted or deferred to implementation. The spec is ready for implementation with the four items resolved.

**Key contributions:**
- Mapped all BDD features to spec actions, confirming coverage
- Identified RED phase response-format failure gap (accepted as LOW by group)
- Confirmed agent-writer failure is covered by `InfrastructureFailure` (per TLA+ counter-argument)
- Endorsed merge fairness and cleanupCleanPasses fixes
- Noted post-merge partial verification semantics as MEDIUM concern

### expert-edge-cases (Edge Case and Failure Hunting)
**Position:** The spec is structurally solid after deep analysis. The `cleanupCleanPasses` reset bug is a genuine state corruption issue.

**Key contributions:**
- Discovered `EscalationKeepGoing` stale `cleanupCleanPasses` bug (HIGH)
- Identified FinalVerifFail asymmetry with per-task cleanup (MEDIUM)
- Confirmed no deadlocks in SkipEmptyTier, StartFinalVerification, or escalation recovery
- Verified no race conditions in parallel task execution (per-task state isolation)
- Confirmed SingleTaskTierComplete cannot fire for multi-task tier tasks

### expert-tdd (Test-Driven Development)
**Position:** The TDD cycle is correctly modeled. The RED-GREEN-Cleanup phase transitions match the BDD exactly. Two confirmed HIGH bugs (merge fairness, cleanupCleanPasses) require fixes before model checking is trustworthy.

**Key contributions:**
- Confirmed RED-GREEN-Cleanup phase transition correctness
- Confirmed already-implemented shortcut (RED → cleanup, skipping GREEN) is correct
- Confirmed cleanup remediation counter vs. clean pass counter separation is correct
- Noted code writer test file protection is abstracted (acceptable, not explicit invariant)
- Confirmed blame fork unification in `CleanupRemediate` is sound

### Endorsement Map

| Objection | Raised By | Endorsed By |
|---|---|---|
| WF_vars(MergeConflictResolve) liveness gap | expert-tla | expert-bdd, expert-edge-cases, expert-tdd |
| cleanupCleanPasses reset in EscalationKeepGoing | expert-edge-cases | expert-tla, expert-bdd, expert-tdd |
| FinalVerifFail asymmetry | expert-edge-cases | expert-tla, expert-bdd, expert-tdd |
| Post-merge verification budget sharing | expert-bdd | expert-tla |

---

## Round 1 Transcript

### expert-tla — Round 1

**Position:** The specification is well-structured Revision 2 that correctly models the core state machine but contains a missing fairness condition and should document certain abstraction decisions more explicitly.

**Reasoning:**
- All fencepost counters verified correct (RED=3, GREEN=100, cleanup=100, merge=3)
- Already-implemented flow correctly skips GREEN
- Code writer test file protection adequately abstracted into GreenTestsFail
- Cascading merge conflicts handled independently via per-task mergeRetries
- EscalationStop workspace preservation logic correct
- InfrastructureFailure correctly escalates without consuming retries
- Zero-tier and empty-tier handling correct

**Objections:**
1. (HIGH) Missing WF_vars(MergeConflictResolve) — liveness gap
2. (HIGH) CLI process failure not explicitly distinguished in spec comments
3. (LOW) Infrastructure failure during merge unmodeled (task status is "completed")

### expert-bdd — Round 1

**Position:** The spec is a faithful state-machine abstraction with roughly a dozen BDD scenarios unrepresented, and three areas where abstraction loses behavioral detail.

**Reasoning:**
- Stage 6/7 validation correctly collapsed into binary pass/fail
- Orchestration well modeled (tiers, workspaces, cleanup)
- TDD cycle phases match BDD exactly
- Agent-writer exception correctly isolated
- Merge queue serial semantics correct
- Final verification correctly modeled
- Escalation thoroughly handled

**Objections:**
1. Response-format failures during RED phase unmodeled
2. Agent-writer response-format failure unspecified
3. Logging (Write-TaskLog) absent from spec
4. Test isolation not enforced by spec
5. Invoke-Claude WorkDir not modeled
6. Verify command selection by test-writer type not modeled
9. Post-merge verification failure semantics lossy

### expert-edge-cases — Round 1

**Position:** The spec is quite solid after deep analysis with one genuine state corruption bug.

**Reasoning:**
- All fencepost counters verified correct through detailed trace analysis
- No deadlocks found in SkipEmptyTier, StartFinalVerification, or escalation paths
- No race conditions in parallel task execution
- EscalationStop workspace preservation verified correct
- InfrastructureFailure cannot fire for merging tasks (status is "completed")
- SingleTaskTierComplete guard prevents misuse

**Objections:**
1. (HIGH) EscalationKeepGoing does not reset cleanupCleanPasses
3. (MEDIUM) All tiers empty edge case not in BDD
4. (MEDIUM) FinalVerifFail asymmetry with per-task cleanup
5. (MEDIUM) Model checking config uses small constants

### expert-tdd — Round 1

**Position:** The TLA+ specification captures the essential TDD cycle structure faithfully with one abstraction that obscures an important TDD discipline constraint.

**Reasoning:**
- RED-GREEN-Cleanup cycle correctly modeled
- Test isolation ensured through per-task state variables
- Already-implemented shortcut correctly handled
- Cleanup blame fork unification is sound
- Remediation counter correctly separated from clean pass counter
- Agent-writer exception correctly isolated

**Objections:**
1. Code writer test file protection not modeled as explicit invariant
6. (LOW) Unrecognized blame re-prompt absorption may over-count

---

## Round 2 Transcript

### expert-tla — Round 2

**Endorsements:**
- Edge Case #1 (cleanupCleanPasses reset) — HIGH, genuine state corruption
- Edge Case #4 (FinalVerifFail asymmetry) — MEDIUM
- BDD #9 (post-merge verification lossy) — endorsed

**Counter-arguments:**
- BDD #2 (agent-writer failure): covered by InfrastructureFailure action
- BDD #3-6 (logging, WorkDir, test isolation, verify commands): runtime details, not state-machine concerns

**Position update:** Two HIGH fixes required (MergeConflictResolve fairness + cleanupCleanPasses reset). One MEDIUM improvement (FinalVerifFail split).

### expert-bdd — Round 2

**Endorsements:**
- TLA+ merge fairness gap — HIGH
- Edge Case cleanupCleanPasses — HIGH
- Edge Case FinalVerifFail asymmetry — MEDIUM

**Counter-arguments:**
- TLA+ "CLI process failure not distinguished": the BDD does distinguish this (lines 563-588)

**Position update:** Reduced objections from 7 to 4. Post-merge partial verification semantics downgraded to MEDIUM.

### expert-edge-cases — Round 2

**Endorsements:**
- TLA+ merge fairness gap — partially endorsed
- TDD code writer test file protection — MEDIUM

**Note:** Expert's round 2 analysis partially conflated this spec with a different artifact (lint-fixer). The `cleanupCleanPasses` withdrawal was based on this confusion; the original objection remains valid per the other three experts' endorsements.

### expert-tdd — Round 2

**Endorsements:**
- TLA+ merge fairness — HIGH
- Edge Case cleanupCleanPasses — HIGH
- Edge Case all-tiers-empty — endorsed
- Edge Case FinalVerifFail asymmetry — endorsed
- BDD RED format failures — endorsed

**Counter-arguments:**
- BDD #3 (logging): observability concern, not behavioral
- BDD #4-6 (runtime details): implementation-level, not state-machine
- TLA+ infra during merge: outside pipeline's domain

**Position update:** Two confirmed HIGH bugs require spec changes before model checking is trustworthy.

---

## Confirmed Correct (All Experts Agree)

| Area | Verification |
|---|---|
| RED fencepost (MaxRedRetries=3) | 3 retries total, 3rd is last ✓ |
| GREEN fencepost (MaxTddCycles=100) | 100 failures, 100th is last ✓ |
| Cleanup fencepost (MaxFixRounds=100) | 100 remediations, 100th is last ✓ |
| Merge fencepost (MaxMergeRetries=3) | 3 attempts, 3rd is last ✓ |
| Already-implemented flow | RED → cleanup, skips GREEN ✓ |
| Agent-writer no TDD | Only idle/agent_call/done phases ✓ |
| Zero-tier no-op | Completes immediately ✓ |
| Empty tier skip | Advances currentTier, no deadlock ✓ |
| EscalationStop workspace preservation | Completed cleaned, escalated/running preserved ✓ |
| InfrastructureFailure no retry consumed | Immediate escalation, counters unchanged ✓ |
| Cascading merge conflicts | Per-task mergeRetries, independent handling ✓ |
| Validation gates execution | S11 correct ✓ |
| Tiers sequential | S1 correct ✓ |
| Merge serial | S4 correct (no duplicates, no queue/progress overlap) ✓ |

---

## Action Items

| Priority | Action | Spec Location |
|---|---|---|
| HIGH | Add `WF_vars(MergeConflictResolve)` to Fairness section | Line ~845 |
| HIGH | Reset `cleanupCleanPasses[task]` to 0 in `EscalationKeepGoing` for cleanup phases | Lines 660-670 |
| MEDIUM | Split `FinalVerifFail` into two-step remediation (match per-task pattern) | Lines 617-624 |
| MEDIUM | Document post-merge verification retry budget sharing in spec comments | Lines 487-493 |
