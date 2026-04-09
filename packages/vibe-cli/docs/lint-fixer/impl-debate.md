# Implementation Plan Debate — Lint-Fixer Agent (Revision 4)

**Date:** 2026-04-07
**Rounds:** 2 (+ convergence verification)
**Result:** CONSENSUS REACHED
**Experts:** expert-tla, expert-tdd, expert-edge-cases, expert-continuous-delivery

---

## Synthesis

The implementation plan is exceptionally thorough. All 8 TLA+ states, 21 transitions, 9 safety invariants, and 3 liveness properties are covered by implementation steps. The architectural decisions (AD1-AD4) are well-designed and correctly bridge TLA+ atomic semantics to PowerShell implementation. The 130+ named test cases provide strong coverage. The 5-tier execution structure enables correct incremental delivery.

The experts converged on **21 actionable items** — 8 with strong cross-expert endorsement, 7 with partial agreement, and 6 refinements identified through cross-expert synthesis. None are fundamental design flaws; all are addressable within the existing architecture.

### Agreed Recommendation

Apply the 8 HIGH-priority items (cross-expert consensus) before implementation begins. The remaining 13 MEDIUM/LOW items should be tracked as implementation-time refinements.

---

## HIGH Priority — Cross-Expert Consensus (8 items)

### 1. ManualFixNone guard: attemptsLeft > 0
**Raised by:** expert-tla (R1) | **Endorsed by:** expert-tdd (R2)

The TLA+ `ManualFixNone` action requires `\E newMin \in 0..(attemptsLeft - 1)`, which is disabled when `attemptsLeft = 0`. Step 8's description does not document this guard. When `attemptsLeft = 0`, only `ManualSuppressExhausted` should fire.

**Action:** Add explicit guard to Step 8: `ManualFixNone` only when `min(_attemptTracker.Values) > 0`. Add test asserting ManualFixNone is NOT taken when attemptsLeft = 0.

### 2. Coverage audit: S8 needs Steps 6, 8, 9, 10
**Raised by:** expert-tla (R1) | **Endorsed by:** expert-tdd (R2)

S8 (`ResultOnlyAtTerminal`: `phase != "done" => result = "none"`) is listed only for Steps 1 and 11. But Steps 6, 8, 9, and 10 all have terminal transitions that set `result` to non-"none" simultaneously with `phase="done"`. The coverage audit should reflect this.

**Action:** Add Steps 6, 8, 9, 10 to the S8 row in the Safety Invariants table. Add `result = "none"` assertions to non-terminal output states in those steps' tests.

### 3. Oscillation detection: extend beyond consecutive co-occurrence
**Raised by:** expert-edge-cases (R1), expert-continuous-delivery (R1) | **Mutually endorsed (R2)**

The D-3 oscillation detector only catches consecutive iterations where BOTH agents return "fixed". Alternating patterns (lint-fixed/tsc-clean/lint-fixed/tsc-fixed) reset the counter and are never detected. Both experts converged on a sliding-window approach.

**Action:** Replace strict consecutive counter with a sliding window (e.g., "if lint-fixer returns 'fixed' in 5 of the last 7 iterations, trigger oscillation diagnostic"). Document the detection algorithm in Step 12.

### 4. Guard commit against empty diffs
**Raised by:** expert-edge-cases (R1) | **Endorsed by:** expert-tla (R2), expert-continuous-delivery (R2)

S7 requires `filesModified=TRUE` at commit, but the state flag may not match the actual working tree (e.g., a fix applied then reverted). Step 10 should verify with `git diff --cached --quiet` after staging.

**Action:** Add `git diff --cached --quiet` check to Step 10 after staging. If empty, transition to `failed_io` (or skip commit). Add test for this scenario.

### 5. Test descriptions: add expected values (~30% missing)
**Raised by:** expert-tdd (R1, narrowed R2)

Approximately 30% of test descriptions (concentrated in Steps 6, 7, 9) omit concrete expected values. Tests should state input, function call, AND expected output/state change.

**Action:** Review Steps 6, 7, and 9 test descriptions. Add specific expected values (violation counts, phase names, flag values) to each assertion.

### 6. E2E mock strategy needed for Step 13
**Raised by:** expert-tdd (R1) | **Endorsed by:** expert-continuous-delivery (R2)

Step 13's 23 E2E scenarios do not specify whether `pnpm lint`, `Invoke-Claude`, and `git` are real or mocked. Without this, the tests are unimplementable.

**Action:** Add a "Mock Strategy" section to Step 13 describing the mock boundary (what is real vs. mocked) and the mock harness contract.

### 7. Malformed lint output tests
**Raised by:** expert-tdd (R1) | **Endorsed by:** expert-edge-cases (R2)

Steps 6, 7, and 8 parse `pnpm lint` output but no test covers malformed output (invalid JSON, partial output, empty stdout with error exit code).

**Action:** Add malformed-output tests to Steps 6 and 7. Include: invalid JSON, empty stdout + exit code 2, partial JSON truncation.

### 8. Crash recovery: foreign trailer should re-dispatch, not skip
**Raised by:** expert-continuous-delivery (R2)

Step 12's crash recovery says "foreign trailer -> skip re-dispatch". But skipping means lint violations persist. The correct behavior: foreign trailer means a different process committed, but our violations may still exist.

**Action:** Change Step 12 case 3 (foreign trailer): log warning, then re-dispatch with fresh state (not skip). The fresh dispatch will discover current lint state.

---

## MEDIUM Priority — Partial Agreement (7 items)

### 9. S7 potential spec bug via AutofixRun remaining=total
**Raised by:** expert-tla | **Disputed by:** expert-edge-cases

`AutofixRun` allows `remaining = total` (zero fixed), setting `filesModified=FALSE`. This path can theoretically reach `commit` where S7 requires `filesModified=TRUE`. Expert-edge-cases argues this is correct by construction (manual phase always sets filesModified). Expert-tla recommends verifying with TLC model checker.

**Action:** Run TLC to verify S7 under current spec. If violation found, add guard `remaining < total` to `AutofixRun`.

### 10. --no-cache on lint invocations
**Raised by:** expert-edge-cases | **Disputed by:** expert-continuous-delivery

ESLint cache could return stale results after suppression writes. expert-CD notes cache is content-based and suggests `--no-cache` only on verification runs (not autofix).

**Action:** Add `--no-cache` to verify-phase lint invocations only. Document rationale in Step 3 agent prompt.

### 11. Cap bulk suppression
**Raised by:** expert-edge-cases | **Disputed by:** expert-continuous-delivery

`VerifyCapReached` suppresses all remaining violations with no upper bound. expert-CD argues capping would violate S5. expert-edge-cases suggests `MaxBulkSuppressions` with `failed_process` fallback.

**Action:** DEFER. Document as known behavior. Consider pre-condition in stage 9 outer loop.

### 12. Invariant helpers centralization in Step 1
**Raised by:** expert-tdd | **Partially disputed by:** expert-edge-cases

Terminal invariant checks (S2-S6) tested inline in Step 11. expert-tdd wants reusable helpers. expert-edge-cases says `Test-LintFixerTypeOK` is sufficient.

**Action:** Extract terminal invariant assertions into `Assert-LintFixerTerminalInvariants` in `types.ps1`.

### 13. Git add explicit scoping in commit phase
**Raised by:** expert-edge-cases

Step 10 does not specify how files are staged. Bare `git add .` could stage unrelated files.

**Action:** Step 10 should use explicit file paths for `git add`. Add test verifying only lint-fixer-modified files are staged.

### 14. Conflicting learned-fixes entry resolution test
**Raised by:** expert-tdd

Two violations in the same run matching the same learned-fixes entry with different attempt counts.

**Action:** Add test to Step 9 for this scenario. Document merge rule (use lower count).

### 15. D-3 oscillation logic extraction to unit-testable function
**Raised by:** expert-tdd

The oscillation detection algorithm is embedded in stage 9. Should be extracted into a testable function.

**Action:** Extract oscillation detection into a function in `utils/lint-fixer/` with unit tests.

---

## LOW Priority — Round 2 Refinements (6 items)

### 16. Violation identity formal definition
**Raised by:** expert-tla (R2)

Add a "Violation Identity" section defining the 3-tuple key and line-drift heuristic before Step 3.

### 17. Commit failure rollback/retry semantics
**Raised by:** expert-tla (R2)

Document explicitly: on CommitIOFailure, working tree retains fixes (make it a formal invariant).

### 18. VerifyPostAutofixNewViolations with net-increase test
**Raised by:** expert-tdd (R2)

Add test to Step 7: autofix resolves 5 original, introduces 8 new -> violations=8, tracker has 8 fresh entries.

### 19. ConvertFrom-LintOutput parser for flat config errors
**Raised by:** expert-edge-cases (R2)

Document exit code handling: 0=clean, 1=violations, 2=config error -> failed_process.

### 20. Health check in init phase
**Raised by:** expert-continuous-delivery (R2)

DEFER. Consider `pnpm lint --print-config` check before autofix.

### 21. Structured logging of state transitions
**Raised by:** expert-continuous-delivery (R2)

DEFER. Add `Write-LintFixerTransition` to runner dispatch loop during implementation.

---

## Per-Round Transcripts

### Round 1

#### expert-tla
**Position:** The plan is exceptionally thorough with rigorous TLA+ mapping. Five specific issues identified — three spec-implementation gaps and two coverage audit inaccuracies.
**Objections:** (1) ManualFixNone guard: attemptsLeft > 0 not documented, (2) AutofixRun remaining=total path needs clarification, (3) S7 reachability via AutofixRun remaining=total (potential spec bug), (4) Coverage audit: S1 should include Step 8, (5) Coverage audit: S8 should include Steps 6, 8, 9, 10
**Endorsements:** AD1, AD3, AD4, D-1 handling, debate objection traceability, Step 13 E2E scenarios

#### expert-tdd
**Position:** Impressively thorough breadth (130+ cases with TLA+ traceability) but systematic specificity gaps and structural ordering issues.
**Objections:** (1) Test descriptions need expected values (~60% omit), (2) Invariant helpers in Step 1, (3) Double-fault extraction, (4) Malformed output tests, (5) Timeout/hang test, (6) E2E mock strategy, (7) Git edge-case tests, (8) User-abort test, (9) Conflicting-entry test, (10) D-3 oscillation split
**Endorsements:** TLA+ invariant traceability, D-1 multi-step tests, Step 1 config constants, Step 13 breadth, layered crash recovery testing

#### expert-edge-cases
**Position:** Architecturally sound but blind spots around concurrent execution, filesystem races, and oscillation/attempt-tracking logic.
**Objections:** (1) Marker file TOCTOU, (2) Tracker key line drift, (3) Oscillation alternating patterns, (4) --no-cache, (5) Git add scoping, (6) "Marker exists, no trailer", (7) Triple-fault stderr, (8) Empty diff guard, (9) Cap bulk suppression, (10) Violation threshold
**Endorsements:** AD1, AD4, AD3, suppression rollback buffer

#### expert-continuous-delivery
**Position:** Structurally sound with well-suited tiers, but gaps in result handling, crash recovery, and oscillation detection.
**Objections:** (1) Missing uncommitted-fix state, (2) Ambiguous pass counter, (3) Oscillation alternating patterns, (4) Crash recovery cleanup, (5) No feature flag, (6) No backoff on retries
**Endorsements:** Execution tier decomposition, single-commit-per-round, fresh-state-per-dispatch

### Round 2

#### expert-tla
**Maintained:** #1, #2 (strengthened), #3, #5 | **Withdrawn:** #4
**New:** Violation identity formal definition, commit failure rollback semantics
**Endorsed:** edge-cases line drift, CD uncommitted-fix, CD oscillation, TDD malformed output, edge-cases empty diffs

#### expert-tdd
**Maintained:** #1 (narrowed 30%), #2, #4, #6 (softened), #7 (narrowed), #9, #10
**Withdrawn:** #3 (already in suppress.ps1), #5 (covered in BDD), #8 (out of scope)
**New:** ManualFixNone guard endorsement, VerifyPostAutofix net-increase test
**Endorsed:** TLA S7 spec bug, TLA S8 coverage, edge-cases line drift, CD pass counter, CD backoff

#### expert-edge-cases
**Maintained:** #1 (narrowed), #3, #4, #5, #7 (LOW), #8, #9, #10 (LOW)
**Withdrawn:** #2 (addressed by AD3), #6 (addressed by AD4)
**New:** ConvertFrom-LintOutput parser, suppression directive format (LOW)
**Endorsed:** CD backoff, CD uncommitted-fix, TDD malformed output, TDD git edge-cases

#### expert-continuous-delivery
**Maintained:** #3 (modified to sliding window), #4 (foreign trailer)
**Withdrawn:** #1 (addressed by AD1), #2 (addressed by AD3), #6 (modified)
**New:** Health check in init, structured logging (LOW)
**Endorsed:** TLA ManualFixNone guard, edge-cases empty diffs, TDD E2E mock strategy, TDD boundary tests

---

## Endorsement Map

| Expert's Objection | Endorsed by |
|---------------------|-------------|
| expert-tla: ManualFixNone guard | expert-tdd |
| expert-tla: S8 coverage audit | expert-tdd |
| expert-edge-cases: line drift | expert-tla, expert-tdd |
| expert-edge-cases: oscillation | expert-continuous-delivery |
| expert-edge-cases: empty diffs | expert-tla, expert-continuous-delivery |
| expert-tdd: malformed output | expert-edge-cases |
| expert-tdd: E2E mock strategy | expert-continuous-delivery |
| expert-continuous-delivery: uncommitted-fix | expert-tla, expert-edge-cases |
| expert-continuous-delivery: oscillation | expert-edge-cases |
| expert-continuous-delivery: backoff | expert-edge-cases |

---

## Metadata

- **Date:** 2026-04-07
- **Rounds completed:** 2 (+ convergence verification confirming no new R3 objections)
- **Result:** CONSENSUS_REACHED
- **Total objections raised:** 31 (R1) + 8 new (R2) = 39
- **Withdrawn:** 12
- **Final items:** 21 (8 HIGH, 7 MEDIUM, 6 LOW)
- **Expert selection rationale:** TLA+ coverage (core), test quality (core), failure modes (important), pipeline integration (relevant). No UI → expert-a11y, expert-atomic-design excluded. No utility library → expert-lodash excluded. No domain modeling → expert-ddd excluded.
