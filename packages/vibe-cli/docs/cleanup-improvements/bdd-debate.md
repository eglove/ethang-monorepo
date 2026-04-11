# BDD Debate Session — cleanup-improvements

**Date:** 2026-04-11
**Result:** CONSENSUS_REACHED
**Rounds:** 3
**Experts:** expert-bdd, expert-edge-cases, expert-tdd, expert-continuous-delivery

---

## Synthesis

### Recommendation

The BDD feature file (~180 scenarios, 1795 lines) is **production-grade and exceptionally thorough**. All 7 briefing items are fully covered with dedicated scenario sections. All 4 error states from the elicitor are addressed. All 5 edge cases from the elicitor are represented. Prior debate-round objections (PID reuse, atomic counters, merge conflicts, fixture schema versioning, vacuous truth, coverage rounding, encoding, disk exhaustion, abort cleanup, API retries, idempotency tokens) have been incorporated.

**Before implementation, apply the 7 Tier 1 amendments below. The 10 Tier 2 amendments should follow in a prioritized pass.**

### Tier 1 Amendments (Mandatory Before Implementation)

| # | Amendment | Rationale | Expert(s) |
|---|-----------|-----------|-----------|
| 1 | **Worktree creation failure mid-tier** — Add scenario: one worktree in a multi-task tier fails while other tasks are already running. Specify whether running tasks continue or are terminated. | Current spec covers single-task failure and all-tasks-fail, but not partial-tier worktree creation failure. | edge-cases, bdd, tdd |
| 2 | **Coverage tool crash** — Add scenario: vitest/Pester process crashes or returns non-zero exit code that is not a coverage percentage. Distinct from coverage gate failure (low %). Should not consume a coverage iteration. | A test runner segfault or OOM produces no coverage data — different error handling than "95% coverage." | edge-cases, tdd, bdd |
| 3 | **Windows SIGTERM correction** — Rewrite the SIGTERM scenario (line 1458) to reflect the actual Windows signal model: `[Console]::CancelKeyPress` and `ConsoleCtrlHandler`, not POSIX SIGTERM. Acknowledge that `taskkill /F` and OOM-kill bypass all cleanup (stale lock detection on --resume is the real safety net). | PowerShell on Windows does not receive Unix SIGTERM. The current scenario asserts behavior that cannot be implemented as written. | cd, tdd, bdd |
| 4 | **Fixture directory creation** — Add scenario: `tests/fixtures/bdd/` or `tests/fixtures/tla/` directories do not exist when the parser attempts to write. Parser should create directories or fail with clear error. | Matters on fresh clones, `git clean`, or first-ever pipeline run. | edge-cases, bdd, tdd |
| 5 | **Fixture availability in worktrees** — Add scenario clarifying whether fixture files are committed to the feature branch (so worktrees created later inherit them) or explicitly copied into worktrees. If not committed, worktrees will not have fixtures. | Worktrees share `.git` but have their own working trees. Fixtures written to main repo disk paths are not automatically visible in worktrees. | tdd, cd |
| 6 | **pipeline.log write failure** — Add scenario: pipeline.log becomes unwritable mid-run (disk full, permission denied). Pipeline should halt with clear error since idempotency tokens and stage markers depend on log writes. | Every --resume depends on accurate pipeline.log. Silent log write failures corrupt resume state. | edge-cases, tdd, cd |
| 7 | **Pester branch vs line coverage** — Clarify that "branch coverage" for PowerShell/Pester means "command coverage from JaCoCo XML" or specify a supplementary branch analysis tool. Pester's `-CodeCoverage` measures line/command coverage, not true branch coverage. | This determines the actual tooling integration for vibe-cli dogfooding. Different tools produce different fixture shapes and pass/fail logic. | tdd, cd |

### Tier 2 Amendments (Prioritized Follow-Up)

| # | Amendment | Expert(s) |
|---|-----------|-----------|
| 8 | Merge serialization mutex timeout — what happens if the merge mutex is held indefinitely (hung git process)? | edge-cases, tdd |
| 9 | `pnpm install --frozen-lockfile` failure in worktree silently degrades task execution (errors piped to `$null`). Should fail fast. | cd |
| 10 | `Reset-MergeQueue` destroys in-flight merge state between tiers. Add scenario for tier transition during merge drain. | cd, edge-cases |
| 11 | Windows MAX_PATH limit (260 chars) on worktree paths with deep monorepo paths + long feature names. | edge-cases |
| 12 | Pipeline definition version changes between abort and --resume (stage renumbered or added). | cd |
| 13 | pipeline.log with multiple completed runs — --resume disambiguation when log is preserved across runs. | bdd, edge-cases |
| 14 | Playwright detection mechanism — how does the pipeline determine Playwright availability (package.json check? npx version check?). | bdd, tdd |
| 15 | File manifest tag validation — untagged files (coverage blind spot), nonexistent files at coverage gate time. | tdd, edge-cases |
| 16 | Compound Then clauses — split multi-assertion Then blocks for independent failure diagnosis (Gherkin style). | bdd, tdd |
| 17 | TLC exit code scenarios → Scenario Outline with Examples table (maintainability improvement). | bdd, tdd |

---

## Per-Round Transcripts

### Round 1

#### expert-bdd

**Position:** The BDD scenarios are thorough and well-structured, covering all 7 briefing items with significant depth. However, there are a few gaps, some Gherkin quality issues, and a small number of scenarios that leak implementation details.

**Reasoning:**
- Completeness against the briefing is strong — all 7 items have dedicated sections
- Debate-driven objections (PID reuse, atomic writes, merge conflicts, etc.) add real value
- All 4 briefing error states are fully covered
- Glossary establishes ubiquitous language well

**Objections:**
1. Compound Then clauses (3-5+ assertions per scenario)
2. vibe-cli dogfooding mechanics underspecified
3. Missing `-Stage`/`-Feature` removal validation scenario
4. Missing Playwright detection mechanism
5. Implementation leakage (Move-Item internals, mutex name)
6. Missing CI/CD scope boundary negative scenario
7. Missing non-English Gherkin keywords exclusion scenario
8. TLC exit codes should use Scenario Outline
9. Fixture generation step targeting on --resume

**Endorsements:** Edge case coverage excellent, consistent ubiquitous language, good separation of concerns, abort cleanup section particularly strong, idempotency token section addresses real operational risk.

#### expert-edge-cases

**Position:** The BDD feature file is remarkably comprehensive at ~180 scenarios with strong coverage of the briefing's error states and edge cases. However, several genuinely missing failure modes remain around partial/intermediate state corruption, cross-item interaction failures, and untested boundaries.

**Objections:**
1. Worktree creation failure mid-tier with some tasks already running
2. Warden configuration race window
3. pipeline.log write failure during operation
4. Fixture directory does not exist
5. --resume after abort where worktree cleaned but branch state unclear
6. Merge serialization mutex timeout/deadlock
7. Coverage tool crash (not coverage failure)
8. Pre-existing .tmp file when parser starts
9. Multiple PIPELINE START markers
10. TDD/coverage cap boundary values (0 or 1)

**Endorsements:** PID reuse detection, atomic task completion counters, merge conflict cascade, dual-cap interaction, abort cleanup best-effort semantics, idempotency tokens, encoding normalization.

#### expert-tdd

**Position:** The 300% coverage model is architecturally sound and the BDD scenarios are remarkably thorough. Three specification gaps would block clean TDD implementation: file manifest tagging, GREEN phase re-entry semantics, and Pester branch coverage tooling.

**Objections:**
1. File manifest tag assignment unspecified (untagged files, multiple tags, validation)
2. Pester branch coverage doesn't exist natively
3. PBT/Contract/E2E test generation quality not mechanically verifiable
4. Shared TLC fixture file modification hazard
5. Coverage gate failure context prompt contract unspecified

**Endorsements:** Dual-cap interaction scenarios exemplary, fixture schema definitions precise and versioned, atomic write specification thorough, vacuous truth prevention critical and correct, parser completeness well-specified, floor rounding mode eliminates ambiguity.

#### expert-continuous-delivery

**Position:** The BDD scenarios for pipeline operations are exceptionally comprehensive, with 170+ scenarios covering critical paths well. However, safety gaps in lock management, resume state reconstruction, and Windows-specific signal handling could lead to data loss or undefined behavior.

**Objections:**
1. Old-format lock file without startTime (forward compatibility)
2. Existing Lock-Pipeline lacks system mutex
3. No scenario for missing artifacts during --resume state reconstruction
4. Windows SIGTERM is a no-op in PowerShell
5. Lock file non-atomic write window
6. Multiple PIPELINE START markers
7. Partial TDD state discarded without warning
8. Merge queue cleanup on abort
9. Concurrent fixture reads during parallel tasks

**Endorsements:** PID + start time process identity, system mutex for lock acquisition, atomic task completion counters, merge serialization with tiebreaker, idempotency with artifact verification, orphaned worktree detection, coverage floor truncation, dual-cap interaction, best-effort abort cleanup, corrupt lock as stale.

---

### Round 2

All experts reviewed each other's Round 1 objections and provided endorsements/dismissals.

#### Cross-Expert Endorsement Map

| Objection | Endorsed By | Dismissed By |
|-----------|------------|-------------|
| Worktree failure mid-tier (EC#1) | bdd, tdd, cd | — |
| Warden race window (EC#2) | — | bdd, tdd |
| pipeline.log write failure (EC#3) | tdd, cd | — |
| Fixture directory missing (EC#4) | bdd, tdd | — |
| Branch state on resume (EC#5) | — | bdd, tdd |
| Merge mutex timeout (EC#6) | bdd, tdd | — |
| Coverage tool crash (EC#7) | bdd, tdd | — |
| Pre-existing .tmp (EC#8) | — | bdd, ec |
| Multiple PIPELINE START (EC#9) | cd | bdd, tdd |
| Cap boundary values (EC#10) | bdd (partial) | tdd, ec |
| Compound Then clauses (BDD#1) | tdd | — |
| Dogfooding mechanics (BDD#2) | — | — |
| -Stage/-Feature removal (BDD#3) | — | tdd |
| Playwright detection (BDD#4) | tdd (partial) | — |
| Implementation leakage (BDD#5) | — | tdd |
| Non-English Gherkin (BDD#7) | — | all |
| Scenario Outline for exit codes (BDD#8) | tdd | — |
| File manifest tags (TDD#1) | bdd, ec | — |
| Pester branch coverage (TDD#2) | bdd, cd | — |
| Test generation quality (TDD#3) | — | tdd (withdrawn) |
| Shared fixture hazard (TDD#4) | bdd (partial) | tdd (resolved) |
| Windows SIGTERM (CD#4) | bdd, tdd | — |
| Partial TDD warning (CD#7) | bdd (partial) | tdd |
| Concurrent fixture reads (CD#9) | bdd | tdd |

#### New Round 2 Objections

- **expert-bdd:** Pipeline.log with multiple completed runs; fixture directory creation (restated); Playwright detection (restated)
- **expert-edge-cases:** Artifact-filesystem mismatch on resume; log format fragility on stage rename; Windows MAX_PATH limit
- **expert-tdd:** File manifest tag validation at coverage time (nonexistent files); fixture availability in worktrees (not committed to branch)
- **expert-cd:** Reset-MergeQueue destroys in-flight state; pnpm install failure silently degrades; pipeline definition version changes on resume

---

### Round 3

All four experts confirmed: **"No new objections — consensus reached on the amendment list."**

- **expert-bdd:** Tier 1 items address genuine gaps in observable behavior specification. Tier 2 items are correctly classified as refinements.
- **expert-edge-cases:** Tier 1 items 1, 2, 5, 6 are highest-value edge cases. Tier 2 items 8-11 represent Windows/concurrency edges that compound under load.
- **expert-tdd:** Tier 1 item 3 (SIGTERM correction) critical for test accuracy. Tier 2 item 16 (compound Then) worth addressing early.
- **expert-continuous-delivery:** Tier 1 item 7 (Pester coverage) must be resolved before implementation to determine tooling integration. Tier 2 items safe to implement in follow-up.

---

## Metadata

- **Session date:** 2026-04-11
- **Experts selected:** expert-bdd, expert-edge-cases, expert-tdd, expert-continuous-delivery
- **Expert selection rationale:** Backend CLI pipeline tool with BDD scenarios, parallel execution, test coverage models, and pipeline resumability. No UI components (excluded expert-a11y, expert-atomic-design). No domain modeling focus (excluded expert-ddd). No performance focus (excluded expert-performance). No Lodash usage (excluded expert-lodash). TLA+ is an input artifact, not being specified (excluded expert-tla).
- **Round count:** 3
- **Result:** CONSENSUS_REACHED
- **Unresolved dissents:** None
