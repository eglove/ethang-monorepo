# TLA+ Specification Debate — Lint-Fixer Agent

**Date:** 2026-04-07
**Result:** CONSENSUS_REACHED
**Rounds:** 3
**Experts:** expert-tla, expert-bdd, expert-edge-cases
**Artifact:** `packages/vibe-cli/docs/lint-fixer/lint-fixer.tla` (LintFixer module)
**Reference:** `packages/vibe-cli/docs/lint-fixer/bdd.feature` (Revision 4)

---

## Synthesis

### Agreed Recommendation

The TLA+ specification correctly captures the **phase-transition topology** (init → autofix → verify_post_autofix → manual ↔ verify → learn → commit → done), **error paths** (process and I/O failures), **bounded iteration** (VM cap + attempt exhaustion), and **terminal state invariants** (S1–S9). The liveness properties (L1–L3) are sound with the WF_vars(Next) fairness condition.

However, the spec has **5 HIGH/MEDIUM issues** that should be addressed before the specification is considered validated against the BDD scenarios:

#### HIGH Priority

1. **Add `VerifyProcessError` and `VerifyPostAutofixProcessError` actions.** Both `verify` and `verify_post_autofix` phases run `pnpm lint`, which can crash or timeout (BDD lines 291–307). The spec has no error transition from these phases. If lint crashes during VERIFY, the model deadlocks. Add transitions mirroring `ManualProcessError` → done(failed_process).

2. **Guard manual fix actions on `attemptsLeft > 0`.** `ManualFixAll`, `ManualFixSome`, `ManualFixNone`, and `ManualIntroducesNew` are all enabled when `attemptsLeft = 0`, competing with `ManualSuppressExhausted`. The BDD specifies that exhausted attempts *must* lead to suppression (BDD lines 313–322). Add `/\ attemptsLeft > 0` to all four fix actions.

3. **Replace scalar `attemptsLeft` with per-violation tracking.** The BDD explicitly requires attempt budgets to be independent per `file:line:rule` triple (BDD lines 325–329). The single scalar `attemptsLeft` (modeling the minimum across the set) means `ManualSuppressExhausted` can fire when only one violation is exhausted, potentially suppressing others prematurely. Consider modeling violations as a function `[ViolationId -> 0..MaxAttempts]` or adding an explicit invariant documenting the abstraction's limitations.

#### MEDIUM Priority

4. **Model learned-fixes state transitions.** The BDD Learning Phase defines 5 distinct update/no-update rules (fewer attempts → update, equal → skip, higher → skip, UNRESOLVED→RESOLVED → update, single-try → skip). The spec's `LearnSuccess` is a single opaque action. Consider adding a `learnedFixesUpdated` boolean or a richer state to distinguish these paths, or document this as an explicit abstraction boundary.

5. **Document the `verify_post_autofix` nondeterminism.** Both `VerifyPostAutofixClean` and `VerifyPostAutofixNewViolations` are enabled when `violations = 0`. This is correct TLA+ modeling (the linter is a black box), but should have an explicit comment explaining the design choice to prevent misreadings.

#### LOW Priority (Acceptable Abstractions — Document Only)

6. **`ManualIntroducesNew` does not consume an attempt** (`UNCHANGED attemptsLeft`). This is debatable — fixing violations that introduce new ones did expend effort. Document the rationale.

7. **Re-dispatch fresh budgets** are modeled by `Init` resetting all state, but there is no multi-dispatch model. The BDD's "fresh attempt budgets" scenario (line 647) is structurally satisfied but not explicitly tested.

8. **Crash-after-commit recovery** (BDD line 660) is outside this spec's scope (orchestrator-level). Document as an explicit exclusion.

9. **`ManualFixNone` does not set `filesModified`**. If the implementation writes files that don't resolve the violation, the working tree IS modified. The spec assumes failed fixes leave no trace. Document the modeling assumption.

### What the Spec Gets Right

All three experts endorsed these aspects:

- **Phase structure** faithfully mirrors the BDD lifecycle, with the critical distinction between `verify_post_autofix` (uncounted) and `verify` (counted iterations)
- **VM iteration cap** (`VerifyCapReached`) correctly models bounded iteration with bulk suppression
- **Safety invariants S1–S9** are well-chosen and directly correspond to BDD behavioral guarantees
- **Error handling paths** (`AutofixProcessError`, `ManualProcessError`, `LearnIOFailure`, `CommitIOFailure`) correctly model the BDD's two failure categories
- **`AutofixClean` short-circuit** correctly produces `result="clean"` with zero work
- **Liveness properties** ensure termination via two independent mechanisms (VM cap + attempt exhaustion)
- **`Done` stuttering step** and fairness condition are correctly specified

---

## Per-Round Transcripts

### Round 1

#### expert-tla

**Position:** Solid first-pass model capturing major control flow, but meaningful gaps around per-violation tracking, attempt guards, and the commit-when-no-modifications case.

**Objections:**
1. Attempt tracking is a single scalar, not per-violation (BDD #8)
2. Manual fix actions not guarded by `attemptsLeft > 0` (BDD #6, #7)
3. `ManualFixNone`/`ManualFixSome` decrement `attemptsLeft` nondeterministically
4. `VerifyPostAutofixNewViolations` and `VerifyPostAutofixClean` both fire at `violations=0`
5. `CommitSuccess` deadlock when `filesModified=FALSE`
6. `ManualFixNone` guard preventing `filesModified` from remaining FALSE — not a bug
7. `ManualSuppressExhausted` partial suppression resets `attemptsLeft` to `MaxAttempts`
8. No modeling of learned-fixes content
9. `AutofixRun` sets `attemptsLeft` redundantly

**Endorsements:** Phase structure, VM cap mechanism, error handling paths, `AutofixClean` separation, `Done` stuttering + fairness, `TypeOK` thoroughness.

#### expert-bdd

**Position:** Spec captures high-level control flow well but abstracts away per-violation identity, learned-fixes state, and file-level detail, leaving roughly a third of BDD scenarios unverifiable.

**Objections:**
1. Per-violation budget independence lost
2. Learned-fixes update logic absent
3. "5th attempt boundary" imprecise
4. No `VerifyProcessError` action
5. `CommitRequiresModification` reachability gap
6. Re-dispatch fresh budgets unmodeled
7. Orchestrator-level scenarios out of scope

**Endorsements:** Phase structure mirrors BDD lifecycle, safety invariants well-chosen, liveness ensures no deadlock, `VerifyCapReached` correct, error paths cover both failure categories, `verify_post_autofix` separation precise.

#### expert-edge-cases

**Position:** Spec structurally sound for termination and basic safety, with six concrete gaps: missing VerifyProcessError, over-abstracted attempt budgets, ManualFixNone filesModified, verify_post_autofix nondeterminism, no crash-after-commit model, ManualIntroducesNew not consuming attempts.

**Objections:**
1. Missing `VerifyProcessError` action (HIGH)
2. `attemptsLeft` global-minimum abstraction (MEDIUM)
3. `ManualFixNone` not setting `filesModified` (LOW-MEDIUM)
4. Nondeterministic ambiguity at `verify_post_autofix` (LOW)
5. No crash-after-commit recovery model (LOW)
6. `ManualIntroducesNew` does not consume an attempt (LOW)
7. `TypeOK` bound on `resolved` may be fragile (LOW)

**Endorsements:** VERIFY-MANUAL loop termination bounded by two independent mechanisms, `verify_post_autofix` separation, S4 captures idempotency, `AutofixClean` short-circuit, `VerifyCapReached` correct, error paths with appropriate result codes, WF_vars(Next) ensures meaningful liveness.

### Round 2

#### expert-tla

**New Objections:** None.
**Endorsed:** expert-bdd #4 (VerifyProcessError), expert-bdd #6 (re-dispatch), expert-edge-cases #6 (ManualIntroducesNew attempts).
**Withdrawn:** #6 (not a bug), #9 (style nit), #3 (subsumed by #1).

#### expert-bdd

**New Objections:** None.
**Endorsed:** expert-tla #2 (attemptsLeft guard), expert-tla #7 (suppression reset), expert-edge-cases #6 (ManualIntroducesNew attempts).
**Withdrawn:** #3 (documentation concern, not spec correctness), #7 (scope acknowledgment, not actionable).

#### expert-edge-cases

**New Objections:**
A. `ManualSuppressExhausted` resets `attemptsLeft` but does not reset `resolved` count
B. No guard preventing `CommitSuccess` when `violations > 0`

**Endorsed:** expert-tla #2 (attemptsLeft guard), expert-tla #5 (CommitSuccess deadlock), expert-tla #7 (suppression reset), expert-bdd #1 (per-violation independence), expert-bdd #4 (VerifyProcessError), expert-bdd #5 (reachability gap).
**Withdrawn:** #7 (TypeOK bounds — low value).

### Round 3 (Closure)

All three experts evaluated expert-edge-cases' two new objections from Round 2:

- **Objection A (resolved bookkeeping):** expert-edge-cases **withdrew** — `resolved` is a monotonic counter, not a state-gating variable. expert-tla and expert-bdd endorsed withdrawal, noting a one-line documentation clarification would suffice.
- **Objection B (CommitSuccess guard):** expert-edge-cases **withdrew** — structurally impossible to reach COMMIT with `violations > 0` because all paths pass through `VerifyClean` (requires `violations=0`) or `VerifyCapReached` (sets `violations'=0`). S5 captures the invariant at the terminal state.

**No new objections raised. Consensus reached.**

---

## Endorsement Map

| Objection | expert-tla | expert-bdd | expert-edge-cases |
|---|---|---|---|
| Missing VerifyProcessError | ✓ (R2) | ✓ (R1) | ✓ (R1) |
| Per-violation attempt tracking | ✓ (R1) | ✓ (R1) | ✓ (R1) |
| Manual actions not guarded by attemptsLeft > 0 | ✓ (R1) | ✓ (R2) | ✓ (R2) |
| Learned-fixes state not modeled | ✓ (R1) | ✓ (R1) | — |
| verify_post_autofix nondeterminism | ✓ (R1) | — | ✓ (R1) |
| ManualIntroducesNew not consuming attempt | ✓ (R2) | ✓ (R2) | ✓ (R1) |
| ManualSuppressExhausted attemptsLeft reset | ✓ (R1) | ✓ (R2) | ✓ (R2) |

---

## Metadata

- **Debate initiated:** 2026-04-07
- **Expert selection:** Autonomous (topic: TLA+ spec vs BDD review → selected TLA+, BDD, edge-cases; excluded a11y, atomic-design, lodash, performance, continuous-delivery, ddd, tdd)
- **Round count:** 3
- **Result:** CONSENSUS_REACHED
- **Objections withdrawn in round 2:** expert-tla #3, #6, #9; expert-bdd #3, #7; expert-edge-cases #7
- **Objections withdrawn in round 3:** expert-edge-cases R2-A, R2-B
