# BDD Debate Session — Code Simplify (Stage 8 Rewrite)

**Date:** 2026-04-11
**Status:** CONSENSUS_REACHED
**Rounds:** 1
**Experts:** expert-bdd, expert-edge-cases, expert-tdd, expert-continuous-delivery

---

## Synthesis

### Result: CONSENSUS_REACHED

All four experts agree: the BDD scenarios are **thorough, well-structured, and highly faithful** to the elicitor briefing. Gherkin discipline is strong, scenarios are independent, ubiquitous language is consistent, and all major flows are covered. However, all experts independently identified **missing input validation scenarios**, **missing failure recovery paths**, and **vague or untestable assertions**. No expert contradicted another — objections are complementary.

### Recommendation

The BDD scenarios should be amended with the following categories of additions:

#### 1. Missing Input Validation Scenarios (High Priority)
- **Fixture file not found** (file missing from disk, vs. empty array) — all four experts flagged this
- **implementation-plan.json missing or malformed** (missing file, zero tiers, zero tasks in a tier)
- **Reviewer returns malformed/non-JSON response** — treat like timeout, log warning, skip

#### 2. Missing Failure Recovery Scenarios (High Priority)
- **Stale lock file** (PID in lock is dead — kill -9, power loss, reboot) — pipeline permanently blocked without manual intervention
- **Resume + lock interaction** (--resume while stale lock from crashed run exists)
- **Merge conflict resolution failure** (Claude cannot resolve the conflict — no escalation path specified)
- **Worktree cleanup failure** (git worktree remove fails — locked directory, permission error on Windows)
- **Double-pass after conflict resolution fails** (error sent to Claude, currently undocumented)
- **Resume during merge phase** (T1 merged, T2 not — how does resume detect which merges completed?)

#### 3. Double-Pass Retry Cap (Medium Priority)
- No `MaxDoublePassRetries` or equivalent — "Claude's own escalation" is not observable or testable from PowerShell
- Add a PowerShell-enforced retry cap or timeout for the double-pass cycle, with user escalation

#### 4. Testability Improvements (Medium Priority)
- **Claude scenarios test internal behavior, not observable outcomes** — rewrite to assert PowerShell-observable results (worktrees exist, tests pass, branches remain unmerged)
- **Remove "e.g." from assertions** (line 356-357) — assertions must be deterministic
- **Remove "dramatically smaller"** (line 702) — replace with a concrete threshold
- **Clarify "twice consecutively" scenarios** (lines 243-246, 523-526) — the elicitor has no special rule for two consecutive failures; each failure independently goes to Claude
- **"Contains functions for..."** (line 709) — specify function names or patterns

#### 5. Safety Degradation Visibility (Low Priority)
- When all reviewers timeout and verdict is "pass", log to `user_notes.md` that no reviewer actually ran
- The "string match" mechanism for fixture coverage should be specified in glossary and scenarios

#### 6. Elicitor Ambiguity
- "Delete all other dead Stage 8 code" — either enumerate the full list or declare the four named items as the complete set

---

## Round 1 Transcripts

### expert-bdd

**Position:** The BDD scenarios are thorough, well-structured, and cover the elicitor briefing with high fidelity. Gherkin discipline is strong — scenarios are independent, use consistent ubiquitous language from the glossary, and follow proper Given/When/Then discipline. A few gaps exist where elicitor requirements lack explicit scenario coverage.

**Objections:**
1. Missing scenario: fixture JSON file does not exist (file not found vs. empty array)
2. Missing scenario: implementation-plan.json does not exist or is malformed
3. Missing scenario: "delete all other dead Stage 8 code" — only 4 items enumerated, elicitor says "all other"
4. Missing scenario: reviewer returns malformed/non-JSON response
5. Missing scenario: Claude's own escalation during double-pass — observable behavior unspecified
6. Missing scenario: partial tier completion on resume — needs more granular scenarios
7. Missing scenario: double-pass after conflict resolution fails
8. Glossary omission: "string match" mechanism for fixture coverage

### expert-edge-cases

**Position:** Scenarios cover the major happy paths and most explicitly stated error states. Missing implicit edge cases around partial failures in parallel execution, malformed inputs, filesystem errors, and race conditions inherent to the worktree-based concurrent architecture.

**Objections:**
1. Missing fixture file entirely (file not found)
2. Malformed fixture JSON (invalid syntax, wrong structure)
3. Missing implementation-plan.json
4. Malformed implementation-plan.json structure (zero tiers, zero tasks)
5. Claude implementation failure / crash (API error, context overflow, timeout)
6. Partial tier completion on crash
7. Stale lock file from a dead process
8. Merge conflict resolution failure
9. Worktree cleanup failure (locked directory, permission error on Windows)
10. Double-pass infinite loop — no PowerShell-enforced cap
11. Race condition: worktree branch divergence during parallel execution
12. Resume + lock interaction
13. user_notes.md write failure (disk full, permission denied)
14. pipeline.log write failure (silently degrades resume capability)
15. Reviewer returns malformed JSON
16. Concurrent worktree pnpm test interference (port conflicts, shared state)
17. "Delete all other dead Stage 8 code" is unspecified

### expert-tdd

**Position:** Scenarios are comprehensive and cover every elicitor path. However, several scenarios test implementation mechanisms rather than observable behavior, and assertions are too vague to be falsifiable in automated tests.

**Objections:**
1. "Claude handles tier sequencing" — asserts Claude internals, not PowerShell-observable results
2. "Claude dispatches parallel agents per tier in worktrees" — tests Claude's decisions, not PowerShell's behavior
3. "Claude handles TDD natively" — not falsifiable without inspecting Claude's output
4. "Claude does not merge worktrees" — "PowerShell takes over" is architecture description, not assertion
5. "Claude receives implementation plan and feature docs" — tests prompt construction internals
6. "Double-pass fails twice consecutively" — implies non-existent rule (elicitor has no "two failures" threshold)
7. "Global double-pass fails twice consecutively" — same issue as #6
8. "8-coding.ps1 is rewritten" — "dramatically smaller" is untestable; needs concrete threshold
9. "review-loop.ps1 is created" — "contains functions for..." is too vague
10. "Claude inspects worktree state on resume" — "Claude determines" is untestable
11. "Moderator pre-filters reviewers" — uses "e.g." in assertions; not deterministic
12. "Delete all other dead Stage 8 code" — elicitor gap, BDD should declare if 4 items is complete set

### expert-continuous-delivery

**Position:** Scenarios cover the full pipeline lifecycle faithfully. Pipeline safety gaps exist around crash recovery edge cases, stale lock detection, idempotent resume behavior, and missing negative-path scenarios for merge and cleanup failures.

**Objections:**
1. No stale lock recovery scenario — pipeline permanently blocked after unclean termination
2. No resume-during-merge scenario — risk of re-merging already-merged branches
3. No merge conflict resolution failure scenario — pipeline hangs or produces corrupt state
4. No cap on double-pass retry cycles — risk of infinite loop
5. No missing fixture files scenario (file not found vs. empty)
6. No worktree cleanup failure scenario
7. No resume + lock interaction scenario
8. "All reviewers timeout = pass" safety degradation not surfaced in user_notes.md

---

## Endorsement Map

| Point | Raised By | Endorsed By |
|---|---|---|
| Missing fixture file (not found) | expert-bdd | expert-edge-cases, expert-continuous-delivery |
| Missing implementation-plan.json | expert-bdd | expert-edge-cases |
| Stale lock recovery | expert-edge-cases | expert-continuous-delivery |
| Merge conflict resolution failure | expert-edge-cases | expert-continuous-delivery |
| No double-pass retry cap | expert-continuous-delivery | expert-edge-cases |
| Claude scenarios test internals | expert-tdd | (unique to TDD) |
| Vague/untestable assertions | expert-tdd | (unique to TDD) |
| Resume + lock interaction | expert-edge-cases | expert-continuous-delivery |
| Worktree cleanup failure | expert-edge-cases | expert-continuous-delivery |
| "Delete all other dead code" ambiguity | expert-bdd | expert-edge-cases, expert-tdd |
| Reviewer malformed JSON | expert-bdd | expert-edge-cases |

---

## Unresolved Dissents

None — consensus reached.
