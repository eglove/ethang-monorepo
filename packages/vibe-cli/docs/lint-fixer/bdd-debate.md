# BDD Debate — Lint-Fixer Agent (Revision 3 Review)

**Date:** 2026-04-07
**Status:** CONSENSUS_REACHED
**Rounds:** 2
**Experts:** expert-bdd, expert-tdd, expert-edge-cases, expert-continuous-delivery

---

## Synthesis

### Result: CONSENSUS REACHED

All four experts agree that Revision 3 is a **strong, well-structured BDD suite** that successfully addressed all 10 prior debate objections. The remaining gaps are refinements, not structural defects. The experts converged on **7 actionable issues** ranked by severity.

### Agreed Recommendation

Address the following 7 issues in priority order before finalizing the BDD scenarios:

#### 1. ⬆️ HIGH — Autofix introducing NEW violations (unanimous, all 4 experts)

The suite assumes `pnpm lint --fix` monotonically reduces violations. ESLint autofixes can introduce new violations (e.g., fixing `indent` can violate `max-len`). **Add a scenario:**

```gherkin
@edge_case
Scenario: Autofix introduces new violations not present before
  Given the monorepo has 5 ESLint violations, all autofixable
  When the lint-fixer runs "pnpm lint --fix"
  And "pnpm lint" reveals 2 new violations not present before autofix
  Then the 2 new violations are treated as manual-fix candidates
  And the lint-fixer proceeds to the MANUAL phase with those 2 violations
```

#### 2. ⬆️ HIGH — `failed:config` misclassification for crash/timeout (3 experts: BDD, TDD, CD)

Scenarios at lines 260-277 classify lint crashes, segfaults, and timeouts as `failed:config`. The briefing defines `failed:config` as "config parse error." A segfault or OOM is qualitatively different — it may succeed on retry, while a config error never will. **Options:**
- (a) Split into `failed:config` (parse errors) and `failed:runtime` (crash/timeout/OOM) with distinct retry semantics
- (b) Keep two codes but explicitly justify in the scenarios WHY crashes map to `failed:config` (non-retryable environment problem)
- (c) Reclassify crashes/timeouts as `failed:io` (retry-eligible)

#### 3. ⬆️ HIGH — Missing AUTOFIX → VERIFY direct transition (3 experts: BDD, TDD, CD)

When autofix resolves ALL violations, the scenario at line 89 says "it proceeds to LEARN and COMMIT (skipping the MANUAL phase)" — but it also skips VERIFY. The briefing's VERIFY phase is what confirms cleanliness. **Fix:** The "all resolved" scenario should include an explicit VERIFY step:

```gherkin
@primary
Scenario: Autofix resolves all violations
  Given the monorepo has 12 ESLint violations, all autofixable
  When the lint-fixer runs "pnpm lint --fix"
  Then all 12 violations are resolved
  And the lint-fixer runs "pnpm lint" in the VERIFY phase to confirm zero violations
  And it proceeds to LEARN and COMMIT (skipping the MANUAL phase)
```

*(Note: the existing scenario text already includes the VERIFY step — the issue is that it's embedded in a Then-step rather than being an explicit phase transition. Consider restructuring for clarity.)*

#### 4. 🔶 MEDIUM — Pre-existing changes: "continue" vs briefing's "abort" (2 experts: BDD, CD)

The briefing summary says "abort if lint --fix overwrites pre-existing changes." The scenario at line 125-132 says the lint-fixer "continues processing" after detecting the overwrite, noting changes are "unrecoverable." **This is a contract contradiction.** The scenarios must pick one:
- (a) **Abort:** Report `failed:io`, do not proceed, let orchestrator decide
- (b) **Warn and continue:** Accept data loss, log warning (current scenario behavior)

Recommendation: Reconcile with the elicitor briefing author. If the briefing is authoritative, change the scenario to abort.

#### 5. 🔶 MEDIUM — VERIFY-MANUAL iteration counting ambiguity (3 experts: BDD, TDD, CD)

The scenarios describe "10 VERIFY-MANUAL cycles" but do not define what constitutes iteration 1. **Clarify:**
- Does the first MANUAL pass after AUTOFIX count as iteration 1?
- Does a VERIFY that finds zero violations increment the counter?
- Is the count VERIFY entries, MANUAL entries, or VERIFY+MANUAL pairs?

**Add a clarifying note** in the Feature description or an explicit scenario asserting iteration 1 boundaries.

#### 6. 🔶 MEDIUM — Cap-triggered suppressions not flowing to LEARN phase (2 experts: TDD, CD)

When the VERIFY-MANUAL cap triggers at iteration 10, remaining violations are bulk-suppressed. No scenario verifies these suppressions generate UNRESOLVED entries in `lint-fixer-learned.md`. The 5-attempt-exhaustion path has LEARN coverage, but the cap path does not. **Add:**

```gherkin
@boundary
Scenario: Cap-triggered suppressions recorded as UNRESOLVED in learned-fixes
  Given the lint-fixer reached the 10th VERIFY-MANUAL cycle
  And it suppressed 2 remaining violations due to the cap
  When the LEARN phase executes
  Then "docs/lint-fixer/lint-fixer-learned.md" contains 2 new UNRESOLVED entries
  And each entry notes "VERIFY-MANUAL cap reached" as the reason
```

#### 7. 🔽 LOW — Commit message format inconsistency with briefing (2 experts: BDD, TDD)

The briefing says `fix(lint): resolve N violations from global review`. The scenarios use `fix(lint): fix N violations from global review` with variants for suppressions. The scenarios' format is arguably better (distinguishes fixes from suppressions), but it deviates from the briefing. **Reconcile** — either update the briefing or align the scenarios.

### Additional Recommendations (not blocking)

These were raised by individual experts and endorsed but not elevated to the top 7:

| Issue | Source | Priority |
|---|---|---|
| TOCTOU: file deleted between lint scan and fix attempt | BDD, TDD | Low |
| Two learned-fixes entries for same rule, different patterns | BDD | Low |
| Partial autofix/staging rollback on mid-operation failure | BDD, CD | Low |
| Suppression in JSX/template literal syntax contexts | Edge | Low |
| CRLF/LF line-ending concerns on Windows | Edge, TDD | Low (precondition) |
| pnpm install after dependency changes by prior stage | CD | Low (orchestrator concern) |
| Learned-fixes file unbounded growth over many runs | Edge | Low |
| LLM semantic regressions (valid code, wrong behavior) | Edge, TDD | Out of scope (caught by double-pass) |

---

## Per-Round Transcripts

### Round 1

#### expert-bdd

**Position:** Revision 3 is a strong, well-structured BDD suite that addresses all 10 debate objections. A few residual gaps remain but none are blockers.

**Objections:**
1. Pre-existing changes: "continue" vs briefing's "abort" — contradiction
2. Config exploration timing never explicitly tested
3. Missing scenario: learned-fixes-only commit (no source changes)
4. Missing scenario: TOCTOU (file deleted between scan and fix)
5. VERIFY-MANUAL cap scenarios somewhat redundant
6. `failed:config` misclassification for crash/timeout
7. Max global review rounds — underspecified status code
8. Commit message "resolve" vs "fix" inconsistency with briefing
9. Missing: two entries same rule, different patterns
10. Tagging: context-differs scenario should be @boundary

**Endorsements:** Revision notes traceability, suppression directive interaction, crash recovery design, learning phase no-update boundary, cross-file side effect scenario.

---

#### expert-tdd

**Position:** Thorough after three revisions, but six testability or boundary gaps remain.

**Objections:**
1. VERIFY-MANUAL loop iteration counting ambiguous
2. Commit message format inconsistency with briefing
3. Missing AUTOFIX → VERIFY direct transition (skipping MANUAL)
4. Missing LEARN phase for cap-triggered suppressions
5. Missing concurrent violations on same line
6. `failed:config` vs `failed:io` classification for crash/timeout

**Endorsements:** Pre-existing changes protection, learned-fixes false positive, crash recovery, line-number drift, better-fix criteria, eslint-disable append scenarios.

---

#### expert-edge-cases

**Position:** Scenarios model a sequential single-threaded actor on well-formed files in a stable environment. Infrastructure-level hazards are systematically neglected.

**Objections (20):**
1. LLM semantic regressions (valid but wrong fixes)
2. LLM hallucinated file paths/line numbers
3. Concurrent pipeline dispatch / data races
4. File encoding beyond UTF-8
5. Symlinks and hardlinks
6. Binary/generated files
7. Context window overflow from many violations
8. Very large individual files
9. Violations in ESLint config files themselves (feedback loop)
10. Network/registry failures during pnpm lint
11. Git index corruption / submodules
12. Partial git staging capturing unintended changes
13. Learned-fixes file growing without bound
14. Suppression in JSX/template literal contexts (syntax error)
15. CRLF/LF line-ending mutation on Windows
16. Attempt counter misidentifying violations after drift
17. Autofix introducing NEW violations
18. Commit hooks modifying staged files
19. Pipeline state file desynchronization
20. PowerShell string escaping in Invoke-Claude

**Endorsements:** 5-attempt escalation model, VERIFY-MANUAL cap with ping-pong, cascading fix handling, fresh-state re-dispatch, pre-existing changes detection.

---

#### expert-continuous-delivery

**Position:** Strong internal specification, but meaningful gaps at the pipeline integration boundary.

**Objections:**
1. Branch drift between dispatches
2. No pnpm install after dependency changes
3. Lock file conflicts
4. Commit signing requirements
5. `failed:config` too broad
6. Pre-existing changes protection incomplete
7. No retry budget for `failed:io`
8. user_notes.md concurrency
9. Concurrent push conflicts
10. Orchestrator code doesn't match assumed contract

**Endorsements:** Crash recovery via git log, fresh state on re-dispatch, status code taxonomy, single commit atomicity, VERIFY-MANUAL cap, scope boundaries, idempotency, line-number drift.

---

### Round 2

#### expert-bdd

**Position:** Prioritizes issues that cause silent incorrect behavior over underspecified items.

**Endorsements:** TDD #3 (AUTOFIX→VERIFY), TDD #1 (iteration counting), Edge #17 (autofix new violations), Edge #1 (LLM regressions), Edge #15 (CRLF), CD #1 (branch drift), CD #2 (pnpm install), CD #7 (retry budget).

**Dropped:** #5 (cap redundancy → iteration ambiguity is the real issue), #9 (two entries same rule), #10 (tagging).

**New objections:** Partial staging rollback (narrow refinement), pipeline re-run idempotency (already covered by existing scenario).

**Final Top 5:** (1) Autofix new violations, (2) failed:config misclassification, (3) AUTOFIX→VERIFY transition, (4) Pre-existing changes contradiction, (5) Idempotency.

---

#### expert-tdd

**Position:** Biggest risks are runtime failures causing silent corruption or infinite loops.

**Endorsements:** Edge #17 (autofix new violations), Edge #1 (LLM regressions), Edge #15 (CRLF), CD #2 (pnpm install), BDD #4 (TOCTOU), BDD #1 (pre-existing changes), all experts on failed:config.

**Dropped:** #1 (iteration counting → subsumed by autofix loop), #4 (LEARN for cap → feature request), #5 (same-line → subsumed by JSX suppression).

**New objections:** None. ("Raising new objections would be gold-plating.")

**Final Top 5:** (1) Autofix new violations / infinite loop, (2) CRLF/LF on Windows, (3) TOCTOU file deleted, (4) Pre-existing changes contradiction, (5) failed:config too broad.

---

#### expert-edge-cases

**Position:** Refined to focus on behavioral gaps expressible as BDD scenarios, not infrastructure audits.

**Downgraded to preconditions:** #3 (concurrency), #4 (encoding), #5 (symlinks), #6 (binary files), #8 (large files), #10 (network), #11 (git corruption), #12 (partial staging), #15 (CRLF), #20 (PowerShell escaping).

**Endorsements:** BDD AUTOFIX→VERIFY, BDD failed:config, TDD iteration counting, TDD cap→LEARN.

**New objections:** None. ("The other experts surfaced the gaps.")

**Final Top 5:** (1) Autofix new violations, (2) Attempt counter misidentification, (3) LLM hallucinated paths, (4) Learned-fixes growth + cap→LEARN, (5) Suppression in JSX contexts + failed:config.

---

#### expert-continuous-delivery

**Position:** Narrowed to lint-fixer BDD scope; reclassified orchestrator concerns.

**Reclassified as orchestrator:** #1 (branch drift), #3 (lock files), #4 (signing), #8 (user_notes concurrency), #9 (concurrent push), #10 (orchestrator code).

**Endorsements:** BDD AUTOFIX→VERIFY, BDD commit message, TDD iteration counting, TDD cap→LEARN, Edge autofix new violations, Edge CRLF.

**New objections:** Partial autofix rollback (narrow), suppression rule-ID validation (already covered).

**Final Top 5:** (1) AUTOFIX→VERIFY re-lint gap, (2) VERIFY-MANUAL iteration cap ambiguity, (3) Partial autofix rollback, (4) Suppression placement validation, (5) pnpm install after deps.

---

## Endorsement Map

| Point | Endorsed By |
|---|---|
| Autofix introducing new violations | expert-bdd ✓, expert-tdd ✓, expert-edge-cases ✓, expert-continuous-delivery ✓ |
| `failed:config` misclassification | expert-bdd ✓, expert-tdd ✓, expert-continuous-delivery ✓ |
| Missing AUTOFIX → VERIFY transition | expert-bdd ✓, expert-tdd ✓, expert-continuous-delivery ✓ |
| VERIFY-MANUAL iteration counting | expert-bdd ✓, expert-tdd ✓, expert-continuous-delivery ✓ |
| Pre-existing changes contradiction | expert-bdd ✓, expert-tdd ✓, expert-continuous-delivery ✓ |
| Cap-triggered suppressions → LEARN | expert-tdd ✓, expert-edge-cases ✓, expert-continuous-delivery ✓ |
| Commit message format inconsistency | expert-bdd ✓, expert-tdd ✓ |

---

## Metadata

- **Date:** 2026-04-07
- **Artifact:** `packages/vibe-cli/docs/lint-fixer/bdd-scenarios.md` (Revision 3)
- **Source briefing:** `packages/vibe-cli/docs/lint-fixer/elicitor.md`
- **Experts selected:** expert-bdd, expert-tdd, expert-edge-cases, expert-continuous-delivery
- **Rounds completed:** 2
- **Result:** CONSENSUS_REACHED
- **Total unique objections (Round 1):** 46
- **Converged actionable issues:** 7
- **New objections in Round 2:** 2 genuinely new (partial rollback scenarios), 2 already covered by existing scenarios
