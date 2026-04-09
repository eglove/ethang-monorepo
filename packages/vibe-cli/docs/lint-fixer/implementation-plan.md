# Implementation Plan: Lint-Fixer Agent

## Source Artifacts

| Artifact | Path |
|----------|------|
| TLA+ Specification | `packages/vibe-cli/docs/lint-fixer/tla/LintFixer.tla` |
| BDD Scenarios | `packages/vibe-cli/docs/lint-fixer/bdd.feature` |
| Requirements Briefing | `packages/vibe-cli/docs/lint-fixer/elicitor.md` |

## Revision History

### Revision 4 (2026-04-07)

Addresses 8 HIGH-priority debate objections from the implementation plan review:

| ID | Objection | Resolution |
|----|-----------|------------|
| P-1 | ManualFixNone guard requiring `attemptsLeft > 0` | Step 8: added `attemptsLeft > 0` guard matching TLA+ `\E newMin \in 0..(attemptsLeft - 1)` (empty range when attemptsLeft=0). Added guard test. When `attemptsLeft=0`, ManualFixNone is not reachable — ManualSuppressExhausted fires instead. |
| P-2 | S8 coverage audit incomplete — missing Steps 6/8/9/10 | Safety Invariants -> Steps table updated: S8 now lists Steps 1, 6, 8, 9, 10, 11. Each step's phase functions only set `result` when simultaneously setting `phase="done"`. |
| P-3 | Consecutive oscillation counter misses intermittent-clean patterns | D-3 updated: replaced consecutive counter with sliding-window detection. Window of last 5 iterations; triggers when ≥3 have both-`"fixed"`. Config: `OscillationWindowSize` (5), `OscillationThreshold` (3). Tests updated in Steps 1, 12, 13. |
| P-4 | No empty-diff guard before git commit | Step 10: added `git diff --cached --quiet` guard after staging. If staged diff is empty (all modifications reverted during processing), skip commit and return `result="clean"` with `filesModified=$false`. Added 2 tests. |
| P-5 | ~30% of test descriptions lack expected values | Steps 6, 7, 9: added concrete expected values to test assertions (specific violation counts, phase names, tracker entry counts, attempt budgets). |
| P-6 | E2E mock strategy undocumented for Step 13 | Step 13: added "Mock Strategy" section documenting the 4-layer mock architecture for integration tests. |
| P-7 | Malformed lint output not tested in Steps 6/7 | Steps 6, 7: added malformed lint output tests — truncated JSON, non-JSON stderr, violation count mismatch between summary and detail lines. |
| P-8 | Foreign-trailer crash recovery skips re-dispatch unnecessarily | Step 12 + AD4 updated: foreign trailer now triggers re-dispatch with fresh state + warning log, instead of skipping. Rationale: foreign commit tells us nothing about current lint state. |

### Revision 3 (2026-04-07)

Addresses 4 debate objections from the implementation review:

| ID | Objection | Resolution |
|----|-----------|------------|
| D-1 | Tracker merge identity collisions at same file:line with different rules | AD3 updated: explicit same-line-different-rule documentation + tests in Steps 1 and 8. Line-drift heuristic scoped to same-rule only. Suppression utility consolidates same-line directives (Step 4). |
| D-2 | Pipeline re-entry idempotency guarantee | Step 5: init phase detects lint-fixer working tree artifacts from prior crashed runs via `.lint-fixer-running` marker file. Step 11: marker cleanup on terminal + explicit re-entry idempotency test. |
| D-3 | Outer-loop oscillation test between lint-fixer and typescript-writer | Step 12: oscillation detector with sliding-window detection (updated R4 per P-3). Step 13: E2E oscillation scenario. |
| D-4 | Crash recovery should use commit trailers instead of message prefix convention | AD4 added. Step 10: commit includes `Lint-Fixer-Run-Id: <uuid>` trailer. Step 12: crash recovery uses `%(trailers:key=...)` parsing instead of prefix matching. Foreign trailer triggers re-dispatch (updated R4 per P-8). |

### Revision 2 (2026-04-07)

Addresses all 11 debate objections from the expert review:

| ID | Objection | Resolution |
|----|-----------|------------|
| H1 | ManualFixNone test must assert `filesModified` unchanged | Step 8: added explicit `filesModified` unchanged assertion to ManualFixNone test |
| H2 | Attempt tracking aggregation algorithm unspecified | Added AD3: per file:line:rule tracking with min-aggregation to TLA+ `attemptsLeft` |
| H3 | ManualSuppressExhausted (all) must assert `attemptsLeft=0` | Step 8: added `attemptsLeft=0` assertion for the all-suppressed case (TLA+ ELSE branch) |
| H4 | No test for ManualIntroducesNew with net violation INCREASE | Step 8: added test where 1 fixed + 3 new -> net increase from 2 to 4 violations |
| H5 | Step 11 conflates AutofixClean and full-lifecycle-resolve | Step 11: split into two distinct tests with separate transition sequences |
| H6 | Scope boundary scenarios entirely missing | Step 3 prompt + Step 12: added 3 scope boundary tests matching BDD "Scope and Boundaries" feature |
| H7 | Per file:line:rule attempt tracking independence not tested | Step 8: added independence test matching BDD "Attempt tracking is per file:line:rule" |
| H8 | Learned-fix false positive not tested | Step 3 prompt + Step 8: added false-positive test matching BDD scenario |
| H9 | Rollback-of-rollback not handled | Step 4: added double-fault handling with best-effort cleanup and diagnostic logging |
| H10 | Crash recovery lacks idempotency guard | Step 12: added commit-trailer idempotency guard replacing fragile git-log prefix heuristic (updated in R3 per D-4) |
| H11 | No max-retry bound on `failed_io` | Step 1 config + Step 12: added `MaxIORetries` (3) constant and exhaustion -> abort |

## Architectural Decisions

### AD1: Clone-Before-Mutate State Discipline

Every phase function receives a state hashtable and returns a **new** hashtable. The original is never mutated. This matches TLA+ semantics where each action is an atomic transition from `state` to `state'`. If a phase function fails mid-execution (e.g., I/O error after partial work), the caller still holds the pre-transition state and can reason about rollback or error reporting without partial corruption.

**Pattern:**
```powershell
function Invoke-LintFixerAutofix {
    param([hashtable]$State)
    $next = Copy-LintFixerState $State   # deep clone
    # ... mutate $next only ...
    return $next
}
```

`Copy-LintFixerState` (provided by `types.ps1`) performs a shallow clone of the flat state hashtable. The runner's dispatch loop replaces the current state only after the phase function returns successfully.

**Rationale:** TLA+ models each action as a complete atomic transition. Clone-before-mutate preserves this atomicity in the implementation. Tests can assert on both the input state (unchanged) and the output state (new values). Debugging is simpler because every intermediate state is capturable.

### AD2: Suppression Extracted to Shared Utility

Suppression (writing `eslint-disable-next-line` comments to source files) is extracted into `Invoke-LintFixerSuppress` in its own file (`suppress.ps1`). Both `VerifyCapReached` and `ManualSuppressExhausted` delegate to this utility rather than inlining suppression logic.

The utility:
1. Accepts a list of violations (file, line, rule) and a reason string.
2. Writes `eslint-disable-next-line <rule> -- <reason>` above each violation line.
3. Handles existing `eslint-disable-next-line` comments (appends rules, no duplicates).
4. **D-1 consolidation:** When multiple violations at the same file:line have different rules, produces a single `eslint-disable-next-line rule1, rule2 -- <reason>` directive, not multiple directives.
5. Wraps all file writes in try/catch -- on any failure, attempts best-effort rollback of all modifications made in this invocation (restores original file content from the cloned buffer), then re-throws. If rollback itself fails (double fault -- H9), logs the list of files left in indeterminate state to `user_notes.md` and re-throws with a composite error containing both the original write failure and the rollback failure details.

**Rationale:** Suppression is a side-effecting file mutation that both `VerifyCapReached` and `ManualSuppressExhausted` need. Inlining it in either location creates duplication and makes rollback logic harder to test. Extracting it allows independent unit testing of the write + rollback behavior.

### AD3: Per-Violation Attempt Tracking with Min-Aggregation (H2, D-1)

The TLA+ spec models attempts as a single integer `attemptsLeft` representing the **minimum** attempts remaining across all active violations. The implementation tracks attempts at the **per file:line:rule** granularity, then aggregates to produce the TLA+ `attemptsLeft` value.

**Data structure:**
```powershell
# _attemptTracker is a hashtable keyed by "file:line:rule" identity strings.
# Each value is the remaining attempt count (starts at MaxAttempts).
# Example: @{ "apps/web/src/a.ts:10:no-console" = 3; "apps/web/src/b.ts:20:no-console" = 5 }
```

**Identity uniqueness (D-1):** The key is `file:line:rule` — a 3-tuple. Two violations at the **same file:line but different rules** (e.g., `a.ts:10:no-console` and `a.ts:10:no-unused-vars`) produce **different keys** and are tracked independently. This is correct by construction: ESLint reports violations per-rule, and the same line can violate multiple rules simultaneously. The identity is always a 3-tuple; no two violations with distinct rules can collide.

**Line-drift heuristic scoped to same-rule only (D-1):** After each `pnpm lint` re-parse, violations are matched to existing tracker entries. The nearest-line heuristic (within +/- 5 lines) is applied **only within the same file + same rule**. Two violations at adjacent lines with **different rules** are never merged, even if one drifts into the other's line number. This prevents cross-rule identity pollution.

**Aggregation rules:**
1. `attemptsLeft` = `min($tracker.Values)` when `$tracker.Count > 0`, else `0`.
2. When a violation is resolved (removed from lint output), its tracker entry is deleted.
3. When a new violation appears (not in tracker), it gets a fresh `MaxAttempts` budget.
4. When a fix attempt fails for a specific violation, its entry is decremented by 1.
5. When an entry reaches 0, that violation is eligible for suppression via `ManualSuppressExhausted`.
6. After suppression removes entries, `attemptsLeft` recalculates from remaining entries. If no entries remain, `attemptsLeft = 0` (TLA+ ELSE branch in `ManualSuppressExhausted`).

**Guard interaction (P-1):** When `attemptsLeft = 0`, the TLA+ spec's `ManualFixNone` action is disabled (its existential quantifier `\E newMin \in 0..(attemptsLeft - 1)` produces an empty range). Only `ManualSuppressExhausted` is enabled. The implementation enforces this: `Invoke-LintFixerManual` checks for exhausted entries (`attemptsLeft = 0`) BEFORE attempting fixes. If any tracker entry is at 0, those violations are suppressed first, and only remaining violations (with budget > 0) proceed to fix attempts.

**Rationale:** The TLA+ spec uses a single `attemptsLeft` for model-checking efficiency (smaller state space). The implementation needs per-violation tracking for correct suppression targeting (BDD: "Attempt tracking is per file:line:rule -- independent budgets"). Min-aggregation bridges the two: the `attemptsLeft` field in the state hashtable always equals the minimum, so `Test-LintFixerTypeOK` can validate it against the spec, while individual violations track their own budgets.

### AD4: Commit Trailers for Structural Identity (D-4)

Lint-fixer commits include a git commit trailer `Lint-Fixer-Run-Id: <uuid>` instead of relying on commit message prefix conventions for crash recovery identification.

**Format:**
```
fix(lint): resolve 5, suppress 2 violations from global review

Lint-Fixer-Run-Id: 7f3a2b1c-4d5e-6f7a-8b9c-0d1e2f3a4b5c
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Why trailers over prefix matching:**
1. **Survives rewording:** `git commit --amend -m "new message"` preserves trailers if not explicitly removed. Prefix matching breaks on any message edit.
2. **Machine-parseable:** `git log --format="%(trailers:key=Lint-Fixer-Run-Id,valueonly)" -1` extracts the UUID directly. No regex needed.
3. **Unique per run:** UUID distinguishes "my commit" from "someone else's lint fix commit" without heuristic string matching.
4. **Composable:** Multiple trailers can coexist (e.g., `Lint-Fixer-Run-Id` + `Co-Authored-By`). Prefix conventions compete for the first line.

**Crash recovery protocol (updated from H10, P-8):**
1. Before dispatching lint-fixer, the orchestrator receives `_runId` from the result.
2. On `CommitSuccess`, the commit includes `Lint-Fixer-Run-Id: <uuid>`.
3. If lint-fixer crashes after commit, the orchestrator checks: `git log --format="%(trailers:key=Lint-Fixer-Run-Id,valueonly)" -1`. If the trailer matches the `_runId` from the dispatched run, the commit was made — re-dispatch creates fresh state and finds clean lint output.
4. **(P-8)** If the trailer does NOT match (different UUID or no trailer): re-dispatch with fresh state. A foreign commit tells us nothing about the current lint state — the working tree may still need linting. Log warning "lint-fixer: foreign/missing trailer on latest commit, re-dispatching with fresh state" to `user_notes.md` for auditability.

**Runner integration:**
- `New-LintFixerState` initializes `_runId = [guid]::NewGuid().ToString()` (outside TLA+ state space).
- `Invoke-LintFixerCommit` includes the `_runId` as the `Lint-Fixer-Run-Id` trailer.
- The orchestrator (stage 9) stores `_runId` from the result and uses it for crash recovery matching.

---

## TLA+ State Coverage Matrix

### States (Phases)

- `init` -- Loading learned-fixes, checking working tree, recording pre-existing unstaged changes
- `autofix` -- Running `pnpm lint --fix` to resolve autofixable violations
- `verify_post_autofix` -- First `pnpm lint` after autofix (NOT counted as a VM iteration)
- `manual` -- LLM-driven per-violation fixes, consulting learned-fixes first
- `verify` -- `pnpm lint` verification (counted VM iterations, cap = MaxVMIterations)
- `learn` -- Writing multi-try solutions and unresolved patterns to `lint-fixer-learned.md`
- `commit` -- Creating a single git commit with source fixes + learned-fixes updates
- `done` -- Terminal state; agent has produced a result code

### Result Codes

- `none` -- Not yet determined (only valid while phase != done)
- `clean` -- Zero violations found, no changes made
- `fixed` -- Violations resolved/suppressed and committed
- `failed_process` -- ESLint config error, crash, segfault, or timeout
- `failed_io` -- Disk, permission, or git I/O error

### Transitions (Named Actions)

1. `Initialize` -- init -> autofix
2. `AutofixClean` -- autofix -> done (result=clean, zero violations exist)
3. `AutofixProcessError` -- autofix -> done (result=failed_process)
4. `AutofixRun` -- autofix -> verify_post_autofix (some/all violations resolved by --fix)
5. `VerifyPostAutofixClean` -- verify_post_autofix -> learn (violations=0 after autofix)
6. `VerifyPostAutofixRemaining` -- verify_post_autofix -> manual (original violations remain)
7. `VerifyPostAutofixNewViolations` -- verify_post_autofix -> manual (autofix introduced NEW violations)
8. `ManualFixAll` -- manual -> verify (all remaining violations resolved)
9. `ManualFixSome` -- manual -> verify (partial fix, some remain)
10. `ManualFixNone` -- manual -> verify (no progress, attempts decremented; requires attemptsLeft > 0 — P-1)
11. `ManualSuppressExhausted` -- manual -> verify (suppress when attemptsLeft=0)
12. `ManualIntroducesNew` -- manual -> verify (fix introduces new violations, net count may increase)
13. `ManualProcessError` -- manual -> done (result=failed_process, lint crash/timeout)
14. `VerifyClean` -- verify -> learn (violations=0)
15. `VerifyLoopBack` -- verify -> manual (violations>0, vmIteration < cap)
16. `VerifyCapReached` -- verify -> learn (violations>0, vmIteration >= cap, suppress all remaining)
17. `LearnSuccess` -- learn -> commit
18. `LearnIOFailure` -- learn -> done (result=failed_io, disk/permission error writing learned-fixes)
19. `CommitSuccess` -- commit -> done (result=fixed, filesModified=TRUE required)
20. `CommitIOFailure` -- commit -> done (result=failed_io, hook rejection or disk error)
21. `Done` -- done -> done (terminal stutter step)

### Safety Invariants

- **S1: `VMIterationBounded`** -- vmIteration <= MaxVMIterations (default 10)
- **S2: `ValidTerminalResult`** -- phase=done => result != "none"
- **S3: `NoEmptyCommit`** -- (done AND fixed) => filesModified=TRUE
- **S4: `CleanMeansNoWork`** -- (done AND clean) => resolved=0 AND suppressed=0
- **S5: `AllViolationsHandled`** -- (done AND fixed) => violations=0
- **S6: `CleanMeansNoViolations`** -- (done AND clean) => violations=0
- **S7: `CommitRequiresModification`** -- phase=commit => filesModified=TRUE
- **S8: `ResultOnlyAtTerminal`** -- phase != done => result="none"
- **S9: `VMIterationNotPremature`** -- phase in {init, autofix, verify_post_autofix} => vmIteration=0

### Liveness Properties

- **L1: `EventuallyTerminates`** -- <>(phase = "done")
- **L2: `EventuallyProducesResult`** -- <>(result != "none")
- **L3: `ViolationsEventuallyHandled`** -- [](violations > 0 => <>(violations = 0 OR phase = "done"))

---

## Implementation Steps

### Step 1: Phase/Result enums, state factory, clone utility, and configuration constants

**Files:**
- `packages/vibe-cli/utils/lint-fixer/types.ps1` (create)
- `packages/vibe-cli/utils/lint-fixer/types.Tests.ps1` (create)

**Description:**
Define the foundational types that every other file depends on. This includes:

- `$Phases` hashtable mapping phase names to themselves (PowerShell enum equivalent).
- `$Results` hashtable for result codes.
- `$LintFixerConfig` hashtable with `MaxAttempts` (5), `MaxVMIterations` (10), `MaxIORetries` (3, H11), `OscillationWindowSize` (5, P-3), `OscillationThreshold` (3, P-3), and lint command paths.
- `New-LintFixerState` factory function that returns a fresh state hashtable matching the TLA+ `Init` predicate: `phase="init"`, `violations=0`, `resolved=0`, `suppressed=0`, `vmIteration=0`, `attemptsLeft=MaxAttempts`, `result="none"`, `filesModified=$false`. Also initializes `_attemptTracker = @{}` (AD3, outside TLA+ state space) and `_runId = [guid]::NewGuid().ToString()` (AD4, outside TLA+ state space).
- `Copy-LintFixerState` clone utility that returns a new hashtable with the same key-value pairs (shallow clone of the flat state -- AD1). The `_attemptTracker` nested hashtable is also shallow-cloned (new hashtable, same scalar values). The `_runId` is copied by value (string, immutable).
- `Test-LintFixerTypeOK` validation function that checks all state fields are within their valid ranges (mirrors the TLA+ `TypeOK` predicate). Also validates that `attemptsLeft` equals `min(_attemptTracker.Values)` when tracker is non-empty (AD3 consistency check).
- `Get-ViolationKey` utility that computes the `"file:line:rule"` identity string for a violation (AD3). The key is a 3-tuple — same file:line with different rules produces different keys (D-1).

**Dependencies:** None

**Test (write first):**
- `New-LintFixerState` returns a hashtable with exactly 8 TLA+ keys plus `_attemptTracker` and `_runId` matching the TLA+ `Init` predicate.
- `New-LintFixerState` sets `phase` to `"init"`, `violations` to `0`, `resolved` to `0`, `suppressed` to `0`, `vmIteration` to `0`, `attemptsLeft` to `5`, `result` to `"none"`, `filesModified` to `$false`.
- `New-LintFixerState` initializes `_attemptTracker` as an empty hashtable.
- `New-LintFixerState` initializes `_runId` as a non-empty GUID string (AD4).
- Two calls to `New-LintFixerState` produce different `_runId` values (AD4: unique per run).
- `Copy-LintFixerState` returns a new hashtable (different reference) with identical values.
- Mutating the clone does not affect the original (AD1 verification).
- Mutating the clone's `_attemptTracker` does not affect the original's `_attemptTracker` (AD1 + AD3).
- `Copy-LintFixerState` preserves `_runId` value (AD4: same run identity across clones).
- `Test-LintFixerTypeOK` returns `$true` for a valid initial state.
- `Test-LintFixerTypeOK` returns `$false` when `phase` is not in `$Phases`.
- `Test-LintFixerTypeOK` returns `$false` when `result` is not in `$Results`.
- `Test-LintFixerTypeOK` returns `$false` when `vmIteration` exceeds `MaxVMIterations`.
- `Test-LintFixerTypeOK` returns `$false` when `attemptsLeft` exceeds `MaxAttempts`.
- `Test-LintFixerTypeOK` returns `$false` when `attemptsLeft` does not equal `min(_attemptTracker.Values)` and tracker is non-empty (AD3 consistency).
- `Get-ViolationKey` returns `"apps/web/src/a.ts:10:no-console"` for file `apps/web/src/a.ts`, line `10`, rule `no-console`.
- **D-1: Same-line different-rule produces different keys**: `Get-ViolationKey` for `a.ts:10:no-console` and `a.ts:10:no-unused-vars` returns two different strings.
- **D-1: Same-rule same-line same-file produces identical keys**: `Get-ViolationKey` for `a.ts:10:no-console` called twice returns the same string.
- `$LintFixerConfig.MaxAttempts` equals `5`.
- `$LintFixerConfig.MaxVMIterations` equals `10`.
- `$LintFixerConfig.MaxIORetries` equals `3` (H11).
- `$LintFixerConfig.OscillationWindowSize` equals `5` (P-3).
- `$LintFixerConfig.OscillationThreshold` equals `3` (P-3).
- Invariant S8: A fresh state has `result="none"` and `phase != "done"`.
- Invariant S9: A fresh state has `vmIteration=0` and `phase="init"`.

**TLA+ Coverage:**
- State: `init` (initial state construction)
- Transition: (none -- this is type infrastructure)
- Invariant: `TypeOK`, `ResultOnlyAtTerminal` (S8), `VMIterationNotPremature` (S9)

---

### Step 2: Learned-fixes knowledge base template

**Files:**
- `packages/vibe-cli/docs/lint-fixer/lint-fixer-learned.md` (create)

**Description:**
Create the seed file for the lint-fixer's knowledge base. The file uses a structured markdown format keyed by ESLint rule name + contextual pattern description. Each entry has: rule heading (H2), Pattern (description of code context), Status (RESOLVED or UNRESOLVED), Fix (the solution applied), and Attempts before solution (integer). This template starts empty (no entries) with only a header comment explaining the format. The lint-fixer reads this file during INIT and writes to it during LEARN.

**Dependencies:** None

**Test (write first):**
- The file exists at `docs/lint-fixer/lint-fixer-learned.md`.
- The file contains a header comment explaining the entry format.
- The file contains no rule entries (empty knowledge base).
- The file is valid markdown that can be parsed without errors.

**TLA+ Coverage:**
- State: `init` (file loaded during initialization), `learn` (file written during learn phase)
- Transition: `Initialize` (reads file), `LearnSuccess` (writes file)

---

### Step 3: Lint-fixer agent prompt definition

**Files:**
- `packages/vibe-cli/agents/code-writers/lint-fixer.md` (create)

**Description:**
Write the Claude Code agent prompt that defines the lint-fixer's behavioral rules. This prompt is dispatched by the orchestrator during the MANUAL phase. It instructs the LLM to: (1) consult learned-fixes entries matching by rule ID + contextual pattern before attempting fresh fixes, (2) apply fixes per-violation with re-parsing of `pnpm lint` output after each fix to handle line-number drift and cascading resolutions, (3) track per-violation attempt budgets (5 max) using file:line:rule identity (AD3), (4) suppress exhausted violations with `eslint-disable-next-line` + justification, (5) explore `@ethang/eslint-config` source files reactively to understand unfamiliar rules, (6) handle existing `eslint-disable-next-line` comments by appending rules rather than duplicating, (7) when a learned-fix is applied but fails to resolve the violation, treat it as a failed attempt (attempt 1 of 5) and continue with alternative strategies (H8).

**Identity collision prevention (D-1):** The prompt explicitly states that violation identity is the 3-tuple `file:line:rule`. Two violations at the same line with different rules are independent targets. The line-drift heuristic for re-matching after edits only operates within the same file + same rule — it never merges violations across different rules even if they drift to the same line number.

**Scope boundaries (H6):** The prompt explicitly states that the lint-fixer only runs `pnpm lint` commands. It never runs `pnpm test` or `pnpm tsc`. It operates on the entire monorepo, not scoped to pipeline-modified files.

The prompt does NOT manage phase transitions or the VM loop -- those are the orchestrator's responsibility.

**Dependencies:** None

**Test (write first):**
- The file exists at `agents/code-writers/lint-fixer.md`.
- The prompt contains a "Role" section describing the lint-fixer's purpose.
- The prompt references the fix policy: fix first, suppress only after attempt exhaustion.
- The prompt specifies 5 attempts per violation as the budget.
- The prompt describes `eslint-disable-next-line` suppression format with `-- reason` comment.
- The prompt instructs consulting learned-fixes by rule ID + contextual pattern match.
- The prompt instructs re-parsing `pnpm lint` output after each fix (line-number drift handling).
- The prompt instructs handling existing `eslint-disable-next-line` comments (append, don't duplicate).
- The prompt instructs that a learned-fix that fails to resolve the violation counts as attempt 1 and triggers fallback to fresh strategies (H8).
- The prompt does NOT contain phase transition logic or VM loop management.
- The prompt references `docs/lint-fixer/lint-fixer-learned.md` as the knowledge base path.
- The prompt specifies per file:line:rule attempt tracking identity (AD3).
- The prompt specifies lint-only scope: never runs `pnpm test` or `pnpm tsc` (H6).
- The prompt specifies monorepo-wide scope: fixes violations in ALL files, not just pipeline-modified ones (H6).
- **D-1:** The prompt explicitly states that violation identity is the 3-tuple `file:line:rule` and that same-line violations with different rules are independent.
- **D-1:** The prompt specifies the line-drift heuristic is scoped to same-file + same-rule only.

**TLA+ Coverage:**
- State: `manual` (behavioral rules for the LLM during manual fixing)
- Transition: `ManualFixAll`, `ManualFixSome`, `ManualFixNone`, `ManualSuppressExhausted`, `ManualIntroducesNew` (behavioral strategies for each outcome)

---

### Step 4: Suppression utility with rollback and double-fault handling

**Files:**
- `packages/vibe-cli/utils/lint-fixer/suppress.ps1` (create)
- `packages/vibe-cli/utils/lint-fixer/suppress.Tests.ps1` (create)

**Description:**
Implement `Invoke-LintFixerSuppress` -- a shared utility that writes `eslint-disable-next-line` comments to source files (AD2). Used by both `VerifyCapReached` (Step 7) and `ManualSuppressExhausted` (Step 8).

The function accepts:
- A list of violation objects (each with `file`, `line`, `rule` properties).
- A `reason` string (e.g., "lint-fixer: unable to resolve after 5 attempts" or "lint-fixer: VERIFY-MANUAL cap reached").

Behavior:
1. Before any writes, buffer the original content of every file that will be modified.
2. **D-1: Group violations by file:line before writing.** Multiple violations at the same file:line with different rules produce a single `// eslint-disable-next-line rule1, rule2 -- <reason>` directive, not separate directives per rule. This grouping is done before any file I/O.
3. For each grouped violation, insert `// eslint-disable-next-line <rules> -- <reason>` above the violation line.
4. If the line already has an `eslint-disable-next-line` comment for a **different** rule, append the new rule(s) to the existing directive (comma-separated).
5. If the line already has an `eslint-disable-next-line` comment for the **same** rule, skip that rule (no duplicate).
6. If any file write fails (I/O error), attempt best-effort rollback of ALL files from the buffered originals.
7. **Double-fault handling (H9):** If rollback itself fails (e.g., disk full prevents restoring original content), log the list of files left in indeterminate state (partially written, not matching original or intended content) to `user_notes.md` with the message: "CRITICAL: suppression rollback failed. Files in indeterminate state: [list]. Manual inspection required." Re-throw a composite error containing both the original write failure and the rollback failure details. Callers (verify.ps1, manual.ps1) will transition to `phase="done"`, `result="failed_io"`.

Returns the count of violations actually suppressed (excludes skipped duplicates).

Follows AD1: does not mutate any state hashtable -- only modifies source files on disk.

**Dependencies:** None

**Test (write first):**
- **Basic suppression**: Single violation at line 10 of `foo.ts` with rule `no-console` -> inserts `// eslint-disable-next-line no-console -- <reason>` above line 10.
- **Multiple violations, same file**: Two violations in `foo.ts` at lines 5 and 12 -> both get suppression comments, line numbers adjusted for insertion offset.
- **Multiple violations, different files**: Violations across `foo.ts` and `bar.ts` -> both files modified correctly.
- **Existing directive, different rule**: Line already has `// eslint-disable-next-line @typescript-eslint/no-unused-vars` and we suppress `no-console` -> becomes `// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-console -- <reason>`.
- **Existing directive, same rule**: Line already has `// eslint-disable-next-line no-console` and we suppress `no-console` -> no change, returns 0 for that violation.
- **D-1: Two different rules at same line**: Violations `foo.ts:10:no-console` and `foo.ts:10:no-unused-vars` suppressed together -> single `// eslint-disable-next-line no-console, no-unused-vars -- <reason>` inserted, NOT two separate directives.
- **D-1: Same-line consolidation with existing directive**: Line already has `// eslint-disable-next-line prefer-const`, suppressing `no-console` and `no-unused-vars` at that line -> becomes `// eslint-disable-next-line prefer-const, no-console, no-unused-vars -- <reason>`.
- **D-1: Partial duplicate at same line**: Suppressing `no-console` and `no-unused-vars` at line 10, where `no-console` already exists in directive -> only `no-unused-vars` added, returns 1 (not 2).
- **Rollback on I/O failure**: First file writes succeed, second file write fails -> first file restored to original content, error thrown.
- **Double-fault: rollback fails (H9)**: First file writes succeed, second file write fails, rollback of first file also fails -> `user_notes.md` contains "CRITICAL: suppression rollback failed" with file list, composite error thrown containing both failure details.
- **Double-fault error message (H9)**: Composite error includes original write error message AND rollback error message, enabling diagnosis of both faults.
- **Empty violation list**: Returns 0, no files modified.
- **Return count**: 3 violations, 1 is a duplicate -> returns 2.

**TLA+ Coverage:**
- Transition: `ManualSuppressExhausted` (shared), `VerifyCapReached` (shared)
- Invariant: (supports S3, S7 -- suppression sets filesModified=TRUE in callers)

---

### Step 5: Initialize phase orchestration

**Files:**
- `packages/vibe-cli/utils/lint-fixer/init.ps1` (create)
- `packages/vibe-cli/utils/lint-fixer/init.Tests.ps1` (create)

**Description:**
Implement `Invoke-LintFixerInit` which accepts a state hashtable and returns a **new** state hashtable (AD1). Performs: (1) read `docs/lint-fixer/lint-fixer-learned.md` -- parse entries into an array of hashtables, gracefully handling missing file (empty array), empty file (empty array), and malformed entries (skip with warning to `user_notes.md`), (2) snapshot pre-existing unstaged changes via `git status --porcelain` -- store file paths in the returned state (as an additional `_snapshot` key outside the TLA+ state space), log warning to `user_notes.md` if any exist, (3) **D-2: detect lint-fixer artifacts from prior crashed runs** -- check for the presence of a `.lint-fixer-running` marker file in the repo root. If found: (a) log warning "lint-fixer: detected artifacts from prior crashed run" to `user_notes.md`, (b) delete the marker file, (c) note that the working tree may contain partial fixes from the crashed run — the current run will proceed with `pnpm lint --fix` which operates on the current file state regardless. The marker file is created at the start of init and deleted at terminal state (by the runner, Step 11). (4) Create the `.lint-fixer-running` marker file containing `_runId` (AD4). (5) Transition phase from `"init"` to `"autofix"` in the new state. Guards: only runs when `phase="init"`.

The original state hashtable is not mutated (AD1).

**Dependencies:** Step 1 (T1)

**Test (write first):**
- When `phase="init"` and learned-fixes file exists with 3 RESOLVED + 1 UNRESOLVED entries, `Invoke-LintFixerInit` loads all 4 entries and transitions phase to `"autofix"`.
- When learned-fixes file is empty, transitions to `"autofix"` with zero entries loaded.
- When learned-fixes file does not exist, transitions to `"autofix"` with zero entries loaded, no error thrown.
- When learned-fixes file has a malformed entry (missing "Fix:" field) alongside 2 valid entries, loads the 2 valid entries, skips the malformed one, and logs a warning to `user_notes.md`.
- When git working tree has unstaged changes, records snapshot of modified file paths and logs warning to `user_notes.md`.
- When git working tree is clean, records empty snapshot, no warning logged.
- **D-2: No prior crash artifacts**: `.lint-fixer-running` does not exist -> creates marker file with `_runId`, transitions normally.
- **D-2: Prior crash artifacts detected**: `.lint-fixer-running` exists (from crashed prior run with different content) -> logs warning to `user_notes.md` mentioning "prior crashed run", deletes old marker, creates new marker with current `_runId`, transitions to `"autofix"`.
- **D-2: Marker file contains current run ID**: After init, `.lint-fixer-running` contains the state's `_runId` (AD4).
- Original state hashtable is unchanged after call (AD1 verification).
- Returned state has `phase="autofix"` while original still has `phase="init"`.
- State unchanged except `phase` (violations, resolved, etc. remain at initial values).
- Guard: throws or returns error when `phase != "init"`.

**TLA+ Coverage:**
- State: `init`
- Transition: `Initialize`
- Invariant: `VMIterationNotPremature` (S9) -- vmIteration remains 0 after init

---

### Step 6: Autofix phase orchestration

**Files:**
- `packages/vibe-cli/utils/lint-fixer/autofix.ps1` (create)
- `packages/vibe-cli/utils/lint-fixer/autofix.Tests.ps1` (create)

**Description:**
Implement `Invoke-LintFixerAutofix` which accepts a state hashtable and returns a **new** state hashtable (AD1). Performs: (1) run `pnpm lint --fix` and capture exit code + output, (2) branch on outcome:

- **Zero violations before autofix** (output reports 0 problems): set `phase="done"`, `result="clean"` in new state (short-circuit, no files modified).
- **Process error** (non-zero exit with config parse error, crash, or timeout indicators in stderr): set `phase="done"`, `result="failed_process"` in new state, log error to `user_notes.md`.
- **Autofix runs** (violations existed, some/all resolved): parse violation count from output, set `violations` to remaining count, `resolved` to fixed count, `filesModified` if any were fixed, reset `attemptsLeft` to `MaxAttempts`, initialize `_attemptTracker` with fresh entries for remaining violations (AD3), set `phase="verify_post_autofix"` in new state.

Also compare modified files against the pre-existing changes snapshot: if any snapshot file was modified by lint --fix, log data-loss warning to `user_notes.md`.

Original state is not mutated (AD1).

**Dependencies:** Step 1 (T1)

**Test (write first):**
- **AutofixClean**: When `pnpm lint --fix` reports 0 violations, returns new state with `phase="done"`, `result="clean"`, `violations=0`, `resolved=0`, `suppressed=0`, `filesModified=$false`.
- **AutofixProcessError**: When `pnpm lint --fix` exits with code 2 and "Parsing error: Unexpected token" in stderr, returns new state with `phase="done"`, `result="failed_process"`, `violations=0` (unchanged from input).
- **AutofixProcessError (timeout)**: When `pnpm lint --fix` exceeds 120s timeout, returns new state with `phase="done"`, `result="failed_process"`.
- **AutofixRun (all resolved)**: When lint reports 12 violations and autofix resolves all 12 -> new state has `violations=0`, `resolved=12`, `filesModified=$true`, `phase="verify_post_autofix"`, `attemptsLeft=5`, `_attemptTracker` is empty hashtable with `.Count=0`.
- **AutofixRun (partial)**: When lint reports 12 violations, 8 autofixable -> new state has `violations=4`, `resolved=8`, `filesModified=$true`, `phase="verify_post_autofix"`, `_attemptTracker.Count=4`, each tracker entry value equals `5` (MaxAttempts).
- **AutofixRun resets attemptsLeft**: After autofix with 4 remaining violations, new state has `attemptsLeft` equal to `5` (min of all tracker entries, which are all `MaxAttempts=5`).
- **D-1: Tracker keys for same-line violations**: When autofix leaves violations `a.ts:10:no-console` and `a.ts:10:no-unused-vars` remaining, `_attemptTracker` has 2 distinct entries (different keys despite same file:line).
- **Data-loss warning**: When snapshot contains "page.tsx" and autofix modified "page.tsx", warning logged to `user_notes.md`.
- **No data-loss warning**: When snapshot contains "server.ts" but autofix did not modify it, no warning logged.
- **P-7: Malformed lint output (truncated JSON)**: `pnpm lint --fix` outputs truncated JSON (incomplete violation array) -> returns new state with `phase="done"`, `result="failed_process"`, error logged to `user_notes.md` containing "malformed lint output".
- **P-7: Malformed lint output (non-JSON stderr)**: `pnpm lint --fix` exits non-zero with unstructured text "Segmentation fault" in stderr -> returns new state with `phase="done"`, `result="failed_process"`.
- **P-7: Malformed lint output (count mismatch)**: `pnpm lint --fix` summary line reports "5 problems" but violation detail lines list only 3 entries -> logs "violation count mismatch: summary=5, parsed=3" warning to `user_notes.md`, uses parsed count (3) as the authoritative count.
- **Original state unchanged** (AD1): Input state still has `phase="autofix"` after call returns.
- Invariant S4: When result is "clean", `resolved=0` and `suppressed=0`.
- Invariant S6: When result is "clean", `violations=0`.
- Invariant S8: When result is "clean" or "failed_process", `phase="done"` (result only set at terminal).
- Guard: throws or returns error when `phase != "autofix"`.

**TLA+ Coverage:**
- State: `autofix`
- Transition: `AutofixClean`, `AutofixProcessError`, `AutofixRun`
- Invariant: `CleanMeansNoWork` (S4), `CleanMeansNoViolations` (S6), `ResultOnlyAtTerminal` (S8)

---

### Step 7: Verify phases (post-autofix and counted)

**Files:**
- `packages/vibe-cli/utils/lint-fixer/verify.ps1` (create)
- `packages/vibe-cli/utils/lint-fixer/verify.Tests.ps1` (create)

**Description:**
Implement two functions, both following AD1 (clone-before-mutate, return new state):

**`Invoke-LintFixerVerifyPostAutofix`** -- Runs `pnpm lint` after the autofix phase. NOT counted as a VM iteration. Three outcomes:
- Zero violations remain -> set `phase="learn"` in new state (skip MANUAL entirely).
- Original violations remain (violations > 0) -> set `phase="manual"` in new state.
- Original violations resolved BUT new violations introduced -> set `violations` to new count, initialize `_attemptTracker` for new violations (AD3), set `phase="manual"` in new state.

**`Invoke-LintFixerVerify`** -- Runs `pnpm lint` during the counted VERIFY-MANUAL loop. vmIteration was already incremented when entering VERIFY from MANUAL. Three outcomes:
- Zero violations -> set `phase="learn"` in new state.
- Violations remain AND vmIteration < MaxVMIterations -> set `phase="manual"` in new state (loop back).
- Violations remain AND vmIteration >= MaxVMIterations -> delegate to `Invoke-LintFixerSuppress` (AD2) with reason "lint-fixer: VERIFY-MANUAL cap reached", then set `suppressed += count`, `violations=0`, `filesModified=$true`, clear `_attemptTracker`, `phase="learn"` in new state. If suppression fails (I/O error from the utility's rollback, including double-fault from H9), set `phase="done"`, `result="failed_io"` instead.

**Dependencies:** Step 1 (T1), Step 4 (T4)

**Test (write first):**
- **VerifyPostAutofixClean**: Input state has `violations=0`, `pnpm lint` reports 0 problems -> new state has `phase="learn"`, `violations=0`, `vmIteration=0`.
- **VerifyPostAutofixRemaining**: Input state has `violations=4`, `pnpm lint` confirms 4 violations -> new state has `phase="manual"`, `violations=4`.
- **VerifyPostAutofixNewViolations**: Input state has `violations=0` but `pnpm lint` reports 2 new violations at `b.ts:5:prefer-const` and `b.ts:12:no-console` -> new state has `violations=2`, `phase="manual"`, `_attemptTracker.Count=2`, each entry value equals `5` (MaxAttempts).
- **VerifyPostAutofix does not increment vmIteration**: Input vmIteration=0, output vmIteration=0 regardless of outcome.
- **VerifyClean**: Input `violations=0`, `vmIteration=3` -> new state has `phase="learn"`, `vmIteration=3` (unchanged).
- **VerifyLoopBack**: Input `violations=2`, `vmIteration=3`, `MaxVMIterations=10` -> new state has `phase="manual"`, `violations=2`, `vmIteration=3`.
- **VerifyCapReached**: Input `violations=2`, `vmIteration=10`, `MaxVMIterations=10` -> calls `Invoke-LintFixerSuppress`, new state has `suppressed` increased by 2, `violations=0`, `filesModified=$true`, `_attemptTracker.Count=0`, `phase="learn"`.
- **VerifyCapReached suppression delegates to utility**: Verify that `Invoke-LintFixerSuppress` is called with reason containing "VERIFY-MANUAL cap reached" (AD2 verification).
- **VerifyCapReached I/O failure**: When `Invoke-LintFixerSuppress` throws (rollback triggered), new state has `phase="done"`, `result="failed_io"`.
- **VerifyCapReached double-fault (H9)**: When `Invoke-LintFixerSuppress` throws composite error (rollback also failed), new state has `phase="done"`, `result="failed_io"`, error propagated to runner for logging.
- **P-7: Malformed lint output in verify**: `pnpm lint` returns truncated JSON during verify phase -> new state has `phase="done"`, `result="failed_process"`.
- **P-7: Violation count mismatch in verify**: `pnpm lint` summary says "3 problems" but detail has 2 entries -> logs warning, uses parsed count 2 as authoritative, new state has `violations=2`.
- **Original state unchanged** (AD1): Input state unmodified after either function returns.
- Invariant S1: After any verify call, `vmIteration <= MaxVMIterations` (value 10).
- Invariant S8: When verify transitions to `"done"` (I/O failure), `result="failed_io"` is set simultaneously.
- Invariant S9: `Invoke-LintFixerVerifyPostAutofix` guard: `phase="verify_post_autofix"`, vmIteration remains 0.
- Guard: `Invoke-LintFixerVerifyPostAutofix` only runs when `phase="verify_post_autofix"`.
- Guard: `Invoke-LintFixerVerify` only runs when `phase="verify"`.

**TLA+ Coverage:**
- State: `verify_post_autofix`, `verify`
- Transition: `VerifyPostAutofixClean`, `VerifyPostAutofixRemaining`, `VerifyPostAutofixNewViolations`, `VerifyClean`, `VerifyLoopBack`, `VerifyCapReached`
- Invariant: `VMIterationBounded` (S1), `ResultOnlyAtTerminal` (S8), `VMIterationNotPremature` (S9)

---

### Step 8: Manual fix phase orchestration

**Files:**
- `packages/vibe-cli/utils/lint-fixer/manual.ps1` (create)
- `packages/vibe-cli/utils/lint-fixer/manual.Tests.ps1` (create)

**Description:**
Implement `Invoke-LintFixerManual` which accepts a state hashtable and the loaded learned-fixes entries, returns a **new** state hashtable (AD1). Dispatches the lint-fixer agent (via `Invoke-Claude` with the `lint-fixer.md` prompt) to fix remaining violations. After the agent returns, parse `pnpm lint` output to determine the outcome:

- **ManualFixAll**: All violations resolved -> `resolved += violations`, `violations=0`, `filesModified=$true`, clear `_attemptTracker`.
- **ManualFixSome**: Some fixed, some remain -> update `resolved`, `violations`, decrement relevant `_attemptTracker` entries (AD3), recompute `attemptsLeft = min(tracker.Values)`, `filesModified=$true`.
- **ManualFixNone**: No progress -> decrement `_attemptTracker` entries for all violations (AD3), recompute `attemptsLeft`, violations unchanged, `filesModified` unchanged (H1: TLA+ `UNCHANGED <<..., filesModified>>`). **Guard (P-1): requires `attemptsLeft > 0`**. When `attemptsLeft = 0`, ManualFixNone is unreachable — the TLA+ spec's existential quantifier `\E newMin \in 0..(attemptsLeft - 1)` produces an empty range. In the implementation, exhausted entries are suppressed via ManualSuppressExhausted before fix attempts begin.
- **ManualSuppressExhausted**: Any `_attemptTracker` entry reaches 0 -> delegate to `Invoke-LintFixerSuppress` (AD2) with reason "lint-fixer: unable to resolve after N attempts. [strategy summary]" for those specific violations. Remove their tracker entries. Update `suppressed`, reduce `violations`. If violations remain, `attemptsLeft = min(remaining tracker.Values)`. If no violations remain, `attemptsLeft = 0` (H3: TLA+ ELSE branch). `filesModified=$true`. If suppression fails (I/O error from the utility's rollback, including double-fault from H9), set `phase="done"`, `result="failed_io"` instead.
- **ManualIntroducesNew**: Fixing violations introduces new ones -> update `resolved`, add new entries to `_attemptTracker` with `MaxAttempts` budget (AD3), set `violations` to remaining + new count, recompute `attemptsLeft`, `filesModified=$true`.
- **ManualProcessError**: `pnpm lint` crash/timeout during manual phase -> set `phase="done"`, `result="failed_process"`, log error.

**Suppression-before-fix ordering (P-1):** The implementation processes each manual iteration in two phases: (1) Check `_attemptTracker` for any entries at 0 — if found, suppress them via ManualSuppressExhausted FIRST. (2) Only then dispatch the LLM agent to attempt fixes on remaining violations (which all have budget > 0). This ensures ManualFixNone's `attemptsLeft > 0` guard is always satisfied when the "no progress" path executes.

In all non-error outcomes: increment `vmIteration` by 1, set `phase="verify"`.

**D-1: Same-line different-rule tracking in manual:** When re-parsing `pnpm lint` output after a fix, violations are matched to `_attemptTracker` entries using the full `file:line:rule` key. The line-drift heuristic (+/- 5 lines) operates only within the same file + same rule. Two violations at `a.ts:10:no-console` and `a.ts:10:prefer-const` are tracked, decremented, and potentially suppressed independently even though they share a file:line.

Original state is not mutated (AD1).

**Dependencies:** Step 1 (T1), Step 3 (T3), Step 4 (T4)

**Test (write first):**
- **ManualFixAll**: 4 violations, all resolved -> new state has `resolved` increased by 4, `violations=0`, `filesModified=$true`, `vmIteration` incremented, `phase="verify"`, `_attemptTracker` empty.
- **ManualFixSome**: 4 violations, 2 resolved -> new state has `resolved` increased by 2, `violations=2`, `filesModified=$true`, `vmIteration` incremented, `phase="verify"`, `_attemptTracker` has 2 remaining entries with decremented budgets.
- **ManualFixNone**: 4 violations, 0 resolved -> `violations` unchanged at 4, `attemptsLeft` decremented, `vmIteration` incremented, `phase="verify"`, **`filesModified` unchanged from input state** (H1: explicit assertion that `filesModified` is NOT set to `$true`).
- **ManualFixNone preserves filesModified=false (H1)**: Input state has `filesModified=$false`, ManualFixNone returns state with `filesModified=$false` (TLA+ `UNCHANGED <<..., filesModified>>`).
- **ManualFixNone preserves filesModified=true (H1)**: Input state has `filesModified=$true` (from prior autofix), ManualFixNone returns state with `filesModified=$true` (still unchanged, not reset).
- **P-1: ManualFixNone guard requires attemptsLeft > 0**: Input state has `_attemptTracker` with all entries at `attemptsLeft=0`. ManualFixNone path is NOT taken — ManualSuppressExhausted fires instead. Verify that when `attemptsLeft=0`, the suppression path executes, not the no-progress path.
- **P-1: Suppression-before-fix ordering**: Input has 3 violations: `a.ts:10:no-console` (budget=0), `b.ts:20:prefer-const` (budget=3), `c.ts:30:no-unused-vars` (budget=3). Step 1: `a.ts:10` suppressed. Step 2: LLM agent dispatched for remaining 2 violations only. Verify `Invoke-LintFixerSuppress` called BEFORE `Invoke-Claude`.
- **ManualSuppressExhausted (partial)**: `_attemptTracker` has entries `a.ts:10:no-console=0` and `b.ts:20:no-console=3` -> calls `Invoke-LintFixerSuppress` (AD2) for `a.ts:10:no-console` only, new state has `suppressed` increased by 1, `violations` decreased by 1, `attemptsLeft=3` (min of remaining), `filesModified=$true`, `vmIteration` incremented, `phase="verify"`.
- **ManualSuppressExhausted (all) (H3)**: `_attemptTracker` has entries `a.ts:10:no-console=0` and `b.ts:20:prefer-const=0` -> all 2 suppressed, `suppressed` increased by 2, `violations=0`, **`attemptsLeft=0`** (H3: TLA+ ELSE branch -- no violations remain so attemptsLeft is 0, not reset to MaxAttempts), `_attemptTracker` empty, `filesModified=$true`, `vmIteration` incremented, `phase="verify"`.
- **ManualSuppressExhausted I/O failure**: When `Invoke-LintFixerSuppress` throws -> new state has `phase="done"`, `result="failed_io"`.
- **ManualIntroducesNew (net decrease)**: 2 violations, 2 fixed, 1 new introduced -> `resolved` increased by 2, `violations=1`, `filesModified=$true`, `vmIteration` incremented, `phase="verify"`, `_attemptTracker` has 1 new entry with `MaxAttempts` budget.
- **ManualIntroducesNew (net increase) (H4)**: 2 violations, 1 fixed, 3 new introduced -> `resolved` increased by 1, `violations=4` (1 original remaining + 3 new), `filesModified=$true`, `vmIteration` incremented, `phase="verify"`, `_attemptTracker` has 4 entries (1 original with decremented budget, 3 new with `MaxAttempts`), `attemptsLeft` = min of those values.
- **ManualProcessError**: lint crashes during manual -> `phase="done"`, `result="failed_process"`, vmIteration NOT incremented.
- **Per file:line:rule independence (H7, AD3)**: Two violations with same rule `no-console` but different file:line identities (`a.ts:10` and `b.ts:20`). Exhaust attempts on `a.ts:10` (5 failures) -> only `a.ts:10` is suppressed, `b.ts:20` retains full 5-attempt budget. Matches BDD: "Attempt tracking is per file:line:rule -- independent budgets".
- **D-1: Same-line different-rule independence**: Two violations at same file:line: `a.ts:10:no-console` (budget=0) and `a.ts:10:prefer-const` (budget=3). Only `no-console` is suppressed. `prefer-const` retains budget=3 and continues to receive fix attempts. Tracker keys are distinct, tracker entries are managed independently.
- **D-1: Line-drift does not merge across rules**: Violation `a.ts:10:no-console` drifts to line 12 after edits. New violation `a.ts:12:prefer-const` appears. These are NOT merged — `no-console` is re-matched to its original entry via same-rule heuristic, `prefer-const` is treated as new with fresh budget.
- **Learned-fix false positive (H8)**: Learned-fixes has RESOLVED entry for `@typescript-eslint/no-floating-promises` with matching pattern. Agent applies the learned fix. `pnpm lint` still reports the violation. The attempt is counted as attempt 1 (budget decremented from 5 to 4). Agent continues with fresh strategies using remaining 4 attempts. Matches BDD: "Learned-fix false positive -- applied fix does not resolve violation".
- **Suppression delegates to utility**: Verify `Invoke-LintFixerSuppress` is called (not inlined) with violation list and reason string (AD2 verification).
- **Original state unchanged** (AD1): Input state unmodified after call returns.
- Invariant S8: When ManualProcessError transitions to `"done"`, `result="failed_process"` is set simultaneously.
- Guard: throws when `phase != "manual"`.
- Guard: throws when `violations = 0` (nothing to fix).

**TLA+ Coverage:**
- State: `manual`
- Transition: `ManualFixAll`, `ManualFixSome`, `ManualFixNone`, `ManualSuppressExhausted`, `ManualIntroducesNew`, `ManualProcessError`
- Invariant: `ResultOnlyAtTerminal` (S8)

---

### Step 9: Learn phase orchestration

**Files:**
- `packages/vibe-cli/utils/lint-fixer/learn.ps1` (create)
- `packages/vibe-cli/utils/lint-fixer/learn.Tests.ps1` (create)

**Description:**
Implement `Invoke-LintFixerLearn` which accepts a state hashtable and the session's fix history, returns a **new** state hashtable (AD1). Writes to `docs/lint-fixer/lint-fixer-learned.md`:

- **Multi-try solutions** (resolved after >1 attempt): Write a RESOLVED entry with rule, pattern, fix description, attempt count.
- **Unresolved patterns** (suppressed after exhaustion): Write an UNRESOLVED entry with rule, pattern, all attempted strategies.
- **Cap-triggered suppressions**: Write UNRESOLVED entries noting "VERIFY-MANUAL cap reached" as the reason.
- **Update existing entries**: If rule+pattern matches an existing entry and the new attempt count is lower (or status upgrades from UNRESOLVED to RESOLVED), update the entry. Do NOT update if the current count is higher or equal with same status.
- **Single-try solutions**: Not recorded (no entry written).

On success: set `phase="commit"` in new state. On I/O failure (disk full, permission error): log error to `user_notes.md` including entries that failed to persist, set `phase="done"`, `result="failed_io"` in new state, skip commit (fixes in working tree are preserved).

If the file does not exist, create it.

Original state is not mutated (AD1).

**Dependencies:** Step 1 (T1), Step 2 (T2)

**Test (write first):**
- **LearnSuccess (multi-try)**: Resolved `@typescript-eslint/no-floating-promises` after 3 attempts -> RESOLVED entry written with rule `@typescript-eslint/no-floating-promises`, pattern description, fix description, "Attempts before solution: 3", new state has `phase="commit"`, `result="none"` (not yet terminal).
- **LearnSuccess (unresolved)**: Suppressed `sonarjs/cognitive-complexity` after 5 attempts -> UNRESOLVED entry written with all 5 attempted strategies listed, new state has `phase="commit"`.
- **LearnSuccess (cap-triggered)**: Suppressed via VERIFY-MANUAL cap -> UNRESOLVED entry with reason containing "VERIFY-MANUAL cap reached", new state has `phase="commit"`.
- **Update existing (fewer attempts)**: Existing RESOLVED entry has "Attempts: 3", new resolution in 2 -> entry updated to "Attempts: 2".
- **Update existing (UNRESOLVED->RESOLVED)**: Existing UNRESOLVED entry for `@typescript-eslint/no-explicit-any`, now resolved in 4 -> status updated to RESOLVED, "Attempts: 4".
- **No update (same or higher attempts)**: Existing RESOLVED with "Attempts: 2", new resolution in 3 -> entry NOT modified, file content unchanged.
- **No update (equal attempts, same status)**: Existing RESOLVED with "Attempts: 3", new resolution in 3 -> entry NOT modified.
- **Single-try not recorded**: Resolved `no-console` in 1 attempt -> no entry written for that rule, file content unchanged.
- **Multiple entries in one session**: Session resolves 2 multi-try violations and suppresses 1 -> 3 entries written (2 RESOLVED, 1 UNRESOLVED).
- **File creation**: When `lint-fixer-learned.md` does not exist, creates it with header comment + new entries.
- **LearnIOFailure**: Simulated write failure -> new state has `phase="done"`, `result="failed_io"`, error logged to `user_notes.md` containing the entry data that failed to persist.
- **LearnIOFailure preserves fixes**: On I/O failure, source file fixes in working tree are not rolled back.
- **Original state unchanged** (AD1): Input state unmodified after call returns.
- Invariant S8: On success, `result` remains `"none"` (phase transitions to `"commit"`, not `"done"`). On I/O failure, `result="failed_io"` set simultaneously with `phase="done"`.
- Guard: throws when `phase != "learn"`.

**TLA+ Coverage:**
- State: `learn`
- Transition: `LearnSuccess`, `LearnIOFailure`
- Invariant: `ResultOnlyAtTerminal` (S8)

---

### Step 10: Commit phase orchestration

**Files:**
- `packages/vibe-cli/utils/lint-fixer/commit.ps1` (create)
- `packages/vibe-cli/utils/lint-fixer/commit.Tests.ps1` (create)

**Description:**
Implement `Invoke-LintFixerCommit` which accepts a state hashtable and the list of files modified by the lint-fixer (source files + learned-fixes file, but NOT `user_notes.md`), returns a **new** state hashtable (AD1). Creates a single git commit:

- **CommitSuccess**: Stage only lint-fixer-modified files (never `user_notes.md`, never pre-existing unstaged files), then run `git diff --cached --quiet` to verify staged diff is non-empty (P-4). If staged diff IS empty (all modifications were reverted during processing or learned-fixes was the only change and it's unchanged), skip commit: set `phase="done"`, `result="clean"`, `filesModified=$false` in new state — this is a no-op run that produced no net changes. Otherwise, create commit with message format:
  - Resolved only: `fix(lint): resolve N violations from global review`
  - Resolved + suppressed: `fix(lint): resolve N, suppress M violations from global review`
  - Suppressed only: `fix(lint): suppress N violations from global review`
  - **AD4: Commit trailer**: Every commit includes `Lint-Fixer-Run-Id: <_runId>` as a git commit trailer. The trailer is appended after a blank line following the commit message subject. Format:
    ```
    fix(lint): resolve N violations from global review

    Lint-Fixer-Run-Id: <uuid from state._runId>
    Co-Authored-By: Claude <noreply@anthropic.com>
    ```
  - Set `phase="done"`, `result="fixed"` in new state.
- **CommitIOFailure**: Hook rejection, disk full, or I/O error -> log details to `user_notes.md`, set `phase="done"`, `result="failed_io"` in new state, working tree retains applied fixes.

Guard: `filesModified` must be `$true` (enforces S7). Guard: `phase` must be `"commit"`.

Original state is not mutated (AD1).

**Dependencies:** Step 1 (T1)

**Test (write first):**
- **CommitSuccess (resolve only)**: 7 resolved, 0 suppressed -> commit message is `"fix(lint): resolve 7 violations from global review"`, new state has `result="fixed"`, `phase="done"`.
- **CommitSuccess (resolve + suppress)**: 5 resolved, 2 suppressed -> commit message is `"fix(lint): resolve 5, suppress 2 violations from global review"`.
- **CommitSuccess (suppress only)**: 0 resolved, 3 suppressed -> commit message is `"fix(lint): suppress 3 violations from global review"`.
- **AD4: Commit includes run ID trailer**: Commit message body includes `Lint-Fixer-Run-Id: <_runId>` as a trailer, verifiable via `git log --format="%(trailers:key=Lint-Fixer-Run-Id)" -1`.
- **AD4: Trailer uses state's _runId**: The trailer value matches the `_runId` from the state hashtable, not a newly generated UUID.
- **AD4: Trailer is machine-parseable**: `git log --format="%(trailers:key=Lint-Fixer-Run-Id,valueonly)" -1` returns exactly the UUID with no surrounding whitespace.
- **Commit includes source files + learned-fixes**: Modified source files and `lint-fixer-learned.md` are staged.
- **Commit excludes user_notes.md**: `user_notes.md` is NOT included in the commit.
- **Commit excludes pre-existing unstaged files**: Files in the pre-existing snapshot that were not modified by lint-fixer are NOT staged.
- **P-4: Empty staged diff skips commit**: `filesModified=$true` in state but `git diff --cached --quiet` exits 0 (all staged files have no net changes) -> new state has `phase="done"`, `result="clean"`, `filesModified=$false`. No git commit created.
- **P-4: Empty diff after revert**: Source file modified by autofix, then reverted to original by manual phase (net zero change) -> `git diff --cached --quiet` exits 0 -> commit skipped, `result="clean"`.
- **CommitIOFailure (hook rejection)**: Pre-commit hook rejects -> new state has `result="failed_io"`, `phase="done"`, error logged.
- **CommitIOFailure (disk error)**: Git commit fails with I/O error -> `result="failed_io"`, working tree retains fixes.
- **Original state unchanged** (AD1): Input state unmodified after call returns.
- Invariant S3: `result="fixed"` only when `filesModified=$true`.
- Invariant S5: `result="fixed"` only when `violations=0`.
- Invariant S7: Guard enforces `filesModified=$true` before commit phase runs.
- Invariant S8: `result` only set when `phase` transitions to `"done"`.
- Guard: throws when `phase != "commit"`.
- Guard: throws when `filesModified=$false`.

**TLA+ Coverage:**
- State: `commit`
- Transition: `CommitSuccess`, `CommitIOFailure`
- Invariant: `NoEmptyCommit` (S3), `AllViolationsHandled` (S5), `CommitRequiresModification` (S7), `ResultOnlyAtTerminal` (S8)

---

### Step 11: Main lifecycle runner (phase dispatch loop)

**Files:**
- `packages/vibe-cli/utils/lint-fixer/runner.ps1` (create)
- `packages/vibe-cli/utils/lint-fixer/runner.Tests.ps1` (create)

**Description:**
Implement `Invoke-LintFixer` -- the top-level entry point that orchestrates the full lifecycle. It:

1. Creates a fresh state via `New-LintFixerState`.
2. Enters a phase-dispatch loop that calls the appropriate phase function based on `state.phase`. Each phase function receives the current state and returns a new state (AD1). The runner replaces its `$state` variable with the returned value:
   - `"init"` -> `$state = Invoke-LintFixerInit $state`
   - `"autofix"` -> `$state = Invoke-LintFixerAutofix $state`
   - `"verify_post_autofix"` -> `$state = Invoke-LintFixerVerifyPostAutofix $state`
   - `"manual"` -> `$state = Invoke-LintFixerManual $state`
   - `"verify"` -> `$state = Invoke-LintFixerVerify $state`
   - `"learn"` -> `$state = Invoke-LintFixerLearn $state`
   - `"commit"` -> `$state = Invoke-LintFixerCommit $state`
   - `"done"` -> exit loop, delete `.lint-fixer-running` marker file (D-2 cleanup)
3. After each phase call, validates `Test-LintFixerTypeOK` on the new state (catches implementation bugs early, including AD3 consistency). If validation fails, logs the invalid state to `user_notes.md` and sets `result="failed_process"` (implementation bug treated as process failure).
4. On loop exit, validates terminal invariants:
   - S2: `result != "none"`
   - S4: If `result="clean"` then `resolved=0 AND suppressed=0`
   - S5: If `result="fixed"` then `violations=0`
   - S6: If `result="clean"` then `violations=0`
5. Deletes `.lint-fixer-running` marker file regardless of result (D-2: always cleanup, even on failure).
6. Returns a result hashtable with `result`, `resolved`, `suppressed`, `filesModified`, `_runId` (AD4: callers need the run ID for crash recovery).

The dispatch loop itself ensures L1 (eventually terminates) because:
- Every phase function advances the state (no infinite loops within phases).
- The VM loop is bounded by `MaxVMIterations` (S1, enforced in Step 7).
- Attempt exhaustion leads to suppression (ManualSuppressExhausted, Step 8).

**Dependencies:** Step 5 (T5), Step 6 (T6), Step 7 (T7), Step 8 (T8), Step 9 (T9), Step 10 (T10)

**Test (write first):**
- **AutofixClean short-circuit (H5)**: Mock `pnpm lint --fix` reporting zero violations -> result=`"clean"`, transition sequence is exactly `init -> autofix -> done`, MANUAL/VERIFY/LEARN/COMMIT phases never entered. Verify phase history log shows only 3 phases.
- **Full lifecycle resolve (H5)**: Mock autofix partial (8 of 12 fixed) -> verify_post_autofix finds 4 remaining -> manual fixes all 4 -> verify clean -> learn -> commit -> result=`"fixed"`. Distinct from AutofixClean: transition sequence is `init -> autofix -> verify_post_autofix -> manual -> verify -> learn -> commit -> done`. Verify phase history shows all 8 phases.
- **Process error in autofix**: Mock lint crash -> result=`"failed_process"`, phase=`"done"`.
- **Process error in manual**: Mock lint crash during manual -> result=`"failed_process"`.
- **I/O error in learn**: Mock write failure -> result=`"failed_io"`.
- **I/O error in commit**: Mock commit failure -> result=`"failed_io"`.
- **VM loop cap**: Mock violations that never fully resolve -> after 10 iterations, all suppressed, result=`"fixed"`.
- **TypeOK validation failure**: Mock a phase function returning invalid state (e.g., `phase="bogus"`) -> runner catches via `Test-LintFixerTypeOK`, sets `result="failed_process"`.
- **AD3 consistency failure**: Mock a phase function returning state where `attemptsLeft` does not match `min(_attemptTracker.Values)` -> `Test-LintFixerTypeOK` catches, sets `result="failed_process"`.
- **State replacement**: Verify that after each phase call, the runner holds the new state (not the old one) -- confirmed by checking `phase` progresses.
- **D-2: Marker file cleanup on success**: After runner completes with `"fixed"`, `.lint-fixer-running` marker file does not exist.
- **D-2: Marker file cleanup on failure**: After runner completes with `"failed_process"`, `.lint-fixer-running` marker file does not exist.
- **D-2: Marker file cleanup on exception**: If a phase function throws an unhandled exception, runner deletes `.lint-fixer-running` in the finally block before re-throwing.
- **D-2: Re-entry idempotency**: Call `Invoke-LintFixer` with zero violations -> returns `"clean"`. Call again immediately -> also returns `"clean"`. No state leakage between runs. Fresh `_runId` per invocation (AD4). No `.lint-fixer-running` marker file between runs.
- **AD4: Result includes _runId**: Return value includes the `_runId` from the run's state.
- Invariant S2: Every terminal state has `result != "none"`.
- Invariant S4: `result="clean"` -> `resolved=0 AND suppressed=0`.
- Invariant S5: `result="fixed"` -> `violations=0`.
- Invariant S6: `result="clean"` -> `violations=0`.
- `Test-LintFixerTypeOK` called after each phase transition (verified by spy/mock).
- Guard: throws when `phase` is an unknown value.

**TLA+ Coverage:**
- State: `done`
- Transition: `Done` (terminal stutter -- loop exits)
- Invariant: `ValidTerminalResult` (S2), `CleanMeansNoWork` (S4), `AllViolationsHandled` (S5), `CleanMeansNoViolations` (S6)

---

### Step 12: Stage 9 global review integration

**Files:**
- `packages/vibe-cli/stages/9-global-review.ps1` (modify)
- `packages/vibe-cli/stages/9-global-review.Tests.ps1` (modify)

**Description:**
Integrate the lint-fixer into the stage 9 global review loop. Modify the existing script to:

1. Dot-source the lint-fixer runner: `. $PSScriptRoot/../utils/lint-fixer/runner.ps1`
2. After the typescript-writer handles test/tsc failures, dispatch the lint-fixer: `$lintResult = Invoke-LintFixer`
3. Handle result codes:
   - `"clean"` -> lint phase passed, continue to next double-pass check.
   - `"fixed"` -> lint violations committed, require a fresh double-pass (reset pass counter).
   - `"failed_process"` -> non-retryable, log and abort the global review loop.
   - `"failed_io"` -> retry-eligible, increment `$ioRetryCount`, retry in next iteration (up to `$LintFixerConfig.MaxIORetries` = 3). If `$ioRetryCount >= MaxIORetries`, abort the global review loop with `"failed_io"` and log "lint-fixer: I/O retry limit (3) exhausted" to `user_notes.md` (H11).
4. **Crash recovery with trailer-based idempotency guard (D-4, P-8):** If lint-fixer does not report (agent crash after commit), use the `_runId` from the dispatched result to check `git log --format="%(trailers:key=Lint-Fixer-Run-Id,valueonly)" -1`. Three cases:
   - **Trailer matches `_runId`**: The lint-fixer committed successfully before crashing. Re-dispatch creates a fresh `New-LintFixerState` (new `_runId`) which will find clean lint state.
   - **Trailer does NOT match and no `Lint-Fixer-Run-Id` trailer present**: Lint-fixer crashed before committing. Re-dispatch is safe — working tree may have partial fixes but `pnpm lint --fix` will operate on the current state.
   - **(P-8) Trailer present but different UUID**: Another process (or a different pipeline run) committed a lint fix. Log warning "lint-fixer: foreign lint commit detected (run ID mismatch), re-dispatching with fresh state" to `user_notes.md`. Re-dispatch with fresh state — the foreign commit tells us nothing about the current lint state, so we must lint to discover the actual state. (Changed from R3 behavior which skipped re-dispatch.)
5. **D-3: Outer-loop oscillation detection between lint-fixer and typescript-writer (P-3: sliding-window):** Track oscillation using a sliding window of the last `OscillationWindowSize` (5) iterations instead of a consecutive counter.
   - Maintain a circular buffer of the last 5 iteration results, each recording the pair `(lintResult, tscResult)`.
   - After each global review iteration, append the current pair to the buffer.
   - Count the number of entries in the window where BOTH lint-fixer=`"fixed"` AND typescript-writer=`"fixed"`.
   - If the count >= `OscillationThreshold` (3), abort the global review loop with a diagnostic message: "lint-fixer: lint/tsc oscillation detected. N of last M iterations had both agents producing fixes. Manual intervention required." logged to `user_notes.md`. Exit with `"failed_process"`.
   - **Why sliding-window over consecutive (P-3):** A consecutive counter misses oscillation patterns like fixed-fixed-clean-fixed-fixed where an intermittent `"clean"` result (from a temporary resolution) resets the counter. The sliding-window catches these: 4 of last 5 iterations had both-`"fixed"`, exceeding the threshold of 3.
   - **Why this detects oscillation:** If lint-fixer produces `"fixed"` (modified files) and typescript-writer also produces `"fixed"` (modified files) in the same iteration, AND this pattern persists across a majority of recent iterations, it means each agent is creating work for the other. A healthy convergence sees one or both agents eventually return `"clean"`.
6. **Scope boundaries (H6):** The lint-fixer operates on the entire monorepo (`pnpm lint` runs globally), NOT scoped to pipeline-modified files. It only runs lint commands -- never `pnpm test` or `pnpm tsc`. Test failures and type errors are handled by the typescript-writer independently.

**Dependencies:** Step 11 (T11)

**Test (write first):**
- **Clean result**: Lint-fixer returns `"clean"` -> global review loop continues without resetting pass counter.
- **Fixed result**: Lint-fixer returns `"fixed"` -> pass counter resets (need fresh double-pass to verify all clean).
- **Failed process**: Lint-fixer returns `"failed_process"` -> global review loop aborts with error.
- **Failed I/O (first retry)**: Lint-fixer returns `"failed_io"` -> `ioRetryCount` incremented to 1, loop retries in next iteration.
- **Failed I/O (retry exhaustion) (H11)**: Lint-fixer returns `"failed_io"` 3 consecutive times -> `ioRetryCount` reaches `MaxIORetries` (3), global review loop aborts with `"failed_io"`, `user_notes.md` contains "I/O retry limit (3) exhausted".
- **Failed I/O counter resets on success (H11)**: `"failed_io"` followed by `"fixed"` -> `ioRetryCount` resets to 0.
- **D-4: Crash recovery via trailer match**: Lint-fixer times out -> orchestrator reads `git log --format="%(trailers:key=Lint-Fixer-Run-Id,valueonly)" -1` -> matches dispatched `_runId` -> re-dispatches fresh state -> lint-fixer finds clean state -> returns `"clean"`, no duplicate commit.
- **D-4: Crash recovery, no trailer**: Lint-fixer crashes before commit -> no `Lint-Fixer-Run-Id` trailer in latest commit -> re-dispatch proceeds safely.
- **P-8: Crash recovery, foreign trailer**: Between crash and re-dispatch, a different process creates a commit with `Lint-Fixer-Run-Id: <different-uuid>` -> orchestrator logs "foreign lint commit detected (run ID mismatch), re-dispatching with fresh state" to `user_notes.md`, **re-dispatches** with fresh state (not skip). New run discovers actual lint state via `pnpm lint --fix`.
- **P-3: No oscillation (one-sided)**: Lint-fixer returns `"fixed"` in 5 iterations but typescript-writer returns `"clean"` each time -> window has 0 both-`"fixed"` entries -> no oscillation detected.
- **P-3: Oscillation detected via sliding window**: Iterations 1-3: both `"fixed"`. Iteration 4: lint `"clean"`, tsc `"clean"`. Iteration 5: both `"fixed"`. Window=[both, both, both, neither, both] -> count=4 >= threshold=3 -> oscillation detected, loop aborts.
- **P-3: Intermittent clean does NOT reset window**: Iterations 1-2: both `"fixed"`. Iteration 3: lint `"clean"` (intermittent). Iterations 4-5: both `"fixed"`. Window=[both, both, neither, both, both] -> count=4 >= 3 -> oscillation detected. (Consecutive counter would have reset at iteration 3 and missed this.)
- **P-3: Below threshold, no abort**: Iterations 1-2: both `"fixed"`. Iterations 3-5: various clean results. Window has count=2 < threshold=3 -> no oscillation, loop continues.
- **P-3: Window slides**: 7 iterations total. First 2: both `"fixed"`. Next 3: clean. Last 2: both `"fixed"`. Window (last 5): [clean, clean, clean, both, both] -> count=2 < 3 -> no oscillation (early both-fixed entries fell out of window).
- **Ordering**: Lint-fixer runs AFTER typescript-writer in each iteration.
- **Double-pass**: Both lint-fixer and typescript-writer must pass twice consecutively to exit loop.
- **Max rounds**: If global review max rounds reached, remaining lint violations reported in output.
- **Scope: fixes outside pipeline diff (H6)**: Lint-fixer fixes violations in files NOT modified by the pipeline (e.g., `packages/utils/src/helper.ts` when pipeline only modified `apps/web/src/page.tsx`). Matches BDD: "Fix violations in files outside the pipeline diff".
- **Scope: lint-only, no tests/tsc (H6)**: Lint-fixer never invokes `pnpm test` or `pnpm tsc` during any phase. Verified by asserting no test/tsc commands appear in the lint-fixer's command history. Matches BDD: "Lint-fixer does not run tests or type checking".
- **Scope: does not fix test failures (H6)**: When `pnpm lint` is clean but `pnpm test` fails, lint-fixer returns `"clean"` and does not attempt to fix test failures. Matches BDD: "Lint-fixer does not fix test failures".

**TLA+ Coverage:**
- State: `done` (result code interpretation by orchestrator)
- Transition: (integration -- no new state transitions, consumes terminal result)

---

### Step 13: End-to-end lifecycle integration tests

**Files:**
- `packages/vibe-cli/utils/lint-fixer/lifecycle.Tests.ps1` (create)

**Description:**
Integration tests that exercise the full `Invoke-LintFixer` lifecycle with realistic mocks, verifying the three liveness properties and key end-to-end scenarios:

- **L1 (EventuallyTerminates)**: Every test case reaches `phase="done"` -- no hang, no infinite loop.
- **L2 (EventuallyProducesResult)**: Every test case produces a non-"none" result.
- **L3 (ViolationsEventuallyHandled)**: Whenever violations are introduced (by autofix or manual fixes), they are eventually resolved, suppressed, or the agent terminates with an error.

**Mock Strategy (P-6):**

The E2E tests use a 4-layer mock architecture that isolates the lint-fixer from real I/O while exercising the full state machine:

1. **`pnpm lint` process mock** (`Mock-LintCommand`): Replaces `pnpm lint --fix` and `pnpm lint` with a scriptblock that returns pre-configured exit codes and JSON stdout/stderr. Configured per-test with a sequence of responses (one per invocation). Tracks invocation count for assertion. Supports configuring: violation lists, exit codes (0, 1, 2), timeout simulation, truncated output (P-7), and count mismatches (P-7).

2. **`Invoke-Claude` agent mock** (`Mock-ClaudeAgent`): Replaces the LLM dispatch with a deterministic function. Configured per-test with fix outcomes: which violations get resolved, which remain, whether new violations are introduced. Simulates: full resolution, partial resolution, no progress, cascade introduction. Does NOT modify real files — instead, updates the mocked `pnpm lint` response queue so the next lint invocation reflects the agent's "work".

3. **File system mock** (`Mock-FileSystem`): In-memory file system for `Invoke-LintFixerSuppress`, `Invoke-LintFixerLearn`, and git operations. Supports injecting I/O failures at specific write operations (for `failed_io` scenarios). Supports injecting double-faults (write fails, then rollback also fails — H9). Tracks file states for assertion (original, modified, rolled-back, indeterminate).

4. **Git mock** (`Mock-GitOperations`): Replaces `git status`, `git add`, `git commit`, `git diff --cached`, and `git log --format="%(trailers:...)"`. Maintains an in-memory staging area and commit log. Supports injecting hook rejections and I/O errors. Supports trailer queries for crash recovery testing (D-4). Supports `git diff --cached --quiet` for empty-diff detection (P-4).

**Configuration pattern:** Each test declares its mock configuration as a hashtable at the top, making the test's scenario immediately readable:
```powershell
$mockConfig = @{
    LintResponses = @(
        @{ ExitCode = 1; Violations = @(...) },  # autofix run
        @{ ExitCode = 1; Violations = @(...) },  # verify: remaining
        @{ ExitCode = 0; Violations = @() }       # verify: clean
    )
    AgentOutcomes = @(
        @{ Resolved = @("a.ts:10:no-console"); New = @() }
    )
    FileSystemFaults = @{}
    GitFaults = @{}
}
```

Test scenarios:
1. **Clean codebase** (idempotency): Zero violations -> `"clean"`, no files modified, no commit.
2. **All autofixed**: 12 violations, all autofixable -> autofix -> verify -> learn -> commit -> `"fixed"`.
3. **Partial autofix + manual**: 12 violations, 8 autofixed, 4 manual -> full lifecycle -> `"fixed"`.
4. **Manual introduces cascading violations**: Fix in file A introduces violation in file B -> detected and resolved -> `"fixed"`.
5. **Attempt exhaustion + suppression**: 1 violation, never fixable -> 5 attempts -> suppress -> learn -> commit -> `"fixed"`.
6. **VM cap reached**: Violations persist through 10 iterations -> all suppressed -> learn -> commit -> `"fixed"`.
7. **Cross-file ping-pong**: Fix A->B->A cycle -> bounded by VM cap -> suppressed -> `"fixed"`.
8. **Process error early**: Config parse error on first lint -> `"failed_process"`, no commit.
9. **I/O error in learn**: Write failure -> `"failed_io"`, fixes preserved in working tree.
10. **Mixed resolved + suppressed**: Some fixed, some suppressed -> commit message reflects both counts.
11. **Suppression rollback on I/O failure**: `Invoke-LintFixerSuppress` fails mid-write -> files restored, state transitions to `"failed_io"`.
12. **State immutability throughout lifecycle**: Capture state before each phase call, verify it's unchanged after (AD1 end-to-end verification).
13. **ManualIntroducesNew with net increase (H4)**: 3 violations, fix 1, introduce 4 new -> violations rises from 3 to 6 -> eventually resolved or suppressed by VM cap -> `"fixed"`.
14. **Per-violation attempt independence (H7)**: Two violations with same rule, different file:line. Exhaust one (5 failures -> suppressed), other resolved on attempt 2. Both handled independently.
15. **Learned-fix false positive lifecycle (H8)**: Learned-fix applied to matching violation, fails, treated as attempt 1, agent finds correct fix on attempt 3 -> RESOLVED entry written with "Attempts: 3".
16. **Double-fault suppression (H9)**: `Invoke-LintFixerSuppress` write fails AND rollback fails -> `"failed_io"`, `user_notes.md` contains "CRITICAL: suppression rollback failed" with indeterminate file list.
17. **AD3 consistency throughout lifecycle**: After every phase transition in a full run, verify `attemptsLeft == min(_attemptTracker.Values)` (or 0 when tracker empty).
18. **D-1: Same-line multi-rule lifecycle**: Two violations at `a.ts:10:no-console` and `a.ts:10:prefer-const`. `no-console` resolved on attempt 1, `prefer-const` suppressed after 5 attempts. Single suppression directive created for `prefer-const` only. `no-console` counted as resolved. Commit message: "resolve 1, suppress 1". Tracker maintained independent budgets throughout.
19. **D-2: Pipeline re-entry after clean run**: Run 1: zero violations, returns `"clean"`. Run 2: invoked immediately after, also returns `"clean"`. No `.lint-fixer-running` marker file exists between runs. Fresh `_runId` per run (AD4).
20. **D-2: Pipeline re-entry after crash**: Run 1: crashes mid-manual (simulated — marker file left behind). Run 2: detects `.lint-fixer-running` marker, logs "prior crashed run" warning, removes marker, proceeds with fresh state. Returns correct result. Marker cleaned up.
21. **P-3: Outer-loop oscillation lifecycle (sliding-window)**: Mock stage 9 integration. Iterations 1-3: both `"fixed"`. Iteration 4: lint `"clean"`. Iteration 5: both `"fixed"`. Window=[both, both, both, neither, both] -> count=4 >= threshold=3 -> oscillation detected, loop aborts with "lint/tsc oscillation detected" diagnostic in `user_notes.md`. Verify the abort is `"failed_process"` result.
22. **D-4: Commit trailer survives amend**: After `CommitSuccess`, `git log --format="%(trailers:key=Lint-Fixer-Run-Id,valueonly)" -1` returns the exact `_runId`. After `git commit --amend -m "reworded"`, trailer is still present and retrievable with the same command.
23. **D-4: Multiple runs produce different trailers**: Run 1 commits with trailer UUID-A. Run 2 commits with trailer UUID-B. `git log --format="%(trailers:key=Lint-Fixer-Run-Id,valueonly)"` on the two most recent commits returns UUID-B then UUID-A (different values, distinguishable).
24. **P-1: ManualFixNone unreachable at attemptsLeft=0**: Full lifecycle where violation budget reaches 0 -> ManualSuppressExhausted fires (not ManualFixNone). Verify via phase history that no "manual-no-progress" event is logged when attemptsLeft=0.
25. **P-4: Empty diff after net-zero changes**: Autofix modifies file, manual reverts it to original content -> commit phase detects empty staged diff -> result=`"clean"`, no commit created.
26. **P-7: Malformed lint output recovery**: `pnpm lint` returns truncated JSON on first invocation -> `"failed_process"` early termination, no files modified.
27. **P-8: Foreign trailer triggers re-dispatch**: Crash recovery with foreign trailer -> re-dispatch with fresh state, not skip. New run lints and returns correct result.

**Dependencies:** Step 12 (T12)

**Test (write first):**
(This step IS the tests -- the test descriptions above are the implementation.)

**TLA+ Coverage:**
- Liveness: `EventuallyTerminates` (L1), `EventuallyProducesResult` (L2), `ViolationsEventuallyHandled` (L3)
- Invariant: All safety invariants (S1-S9) are implicitly verified in full lifecycle runs

---

## State Coverage Audit

All TLA+ states, transitions, and properties are covered by the implementation plan.

### States -> Steps

| State | Step(s) |
|-------|---------|
| `init` | 1, 2, 5 |
| `autofix` | 6 |
| `verify_post_autofix` | 7 |
| `manual` | 3, 8 |
| `verify` | 7 |
| `learn` | 2, 9 |
| `commit` | 10 |
| `done` | 6, 8, 9, 10, 11 |

### Transitions -> Steps

| Transition | Step |
|------------|------|
| `Initialize` | 5 |
| `AutofixClean` | 6 |
| `AutofixProcessError` | 6 |
| `AutofixRun` | 6 |
| `VerifyPostAutofixClean` | 7 |
| `VerifyPostAutofixRemaining` | 7 |
| `VerifyPostAutofixNewViolations` | 7 |
| `ManualFixAll` | 8 |
| `ManualFixSome` | 8 |
| `ManualFixNone` | 8 |
| `ManualSuppressExhausted` | 4, 8 |
| `ManualIntroducesNew` | 8 |
| `ManualProcessError` | 8 |
| `VerifyClean` | 7 |
| `VerifyLoopBack` | 7 |
| `VerifyCapReached` | 4, 7 |
| `LearnSuccess` | 9 |
| `LearnIOFailure` | 9 |
| `CommitSuccess` | 10 |
| `CommitIOFailure` | 10 |
| `Done` | 11 |

### Safety Invariants -> Steps (P-2: updated)

| Invariant | Step(s) |
|-----------|---------|
| S1: `VMIterationBounded` | 7 |
| S2: `ValidTerminalResult` | 11 |
| S3: `NoEmptyCommit` | 10 |
| S4: `CleanMeansNoWork` | 6, 11 |
| S5: `AllViolationsHandled` | 10, 11 |
| S6: `CleanMeansNoViolations` | 6, 11 |
| S7: `CommitRequiresModification` | 10 |
| S8: `ResultOnlyAtTerminal` | 1, 6, 7, 8, 9, 10, 11 |
| S9: `VMIterationNotPremature` | 1, 5, 7 |

### Liveness Properties -> Steps

| Property | Step |
|----------|------|
| L1: `EventuallyTerminates` | 13 |
| L2: `EventuallyProducesResult` | 13 |
| L3: `ViolationsEventuallyHandled` | 13 |

### Debate Objections -> Steps

| Objection | Step(s) | Test(s) |
|-----------|---------|---------|
| H1: `filesModified` unchanged in ManualFixNone | 8 | ManualFixNone preserves filesModified=false, ManualFixNone preserves filesModified=true |
| H2: Attempt tracking aggregation | 1, 6, 7, 8 | AD3 consistency in TypeOK, tracker initialization in autofix, min-aggregation in manual |
| H3: `attemptsLeft=0` when all suppressed | 8 | ManualSuppressExhausted (all) asserts `attemptsLeft=0` |
| H4: ManualIntroducesNew net increase | 8, 13 | ManualIntroducesNew (net increase), E2E scenario 13 |
| H5: AutofixClean vs full lifecycle | 11 | Two distinct tests with explicit transition sequences |
| H6: Scope boundary scenarios | 3, 12 | Prompt lint-only scope, 3 scope boundary integration tests |
| H7: Per-violation independence | 8, 13 | Per file:line:rule independence test, E2E scenario 14 |
| H8: Learned-fix false positive | 3, 8, 13 | Prompt false-positive instruction, unit test, E2E scenario 15 |
| H9: Rollback-of-rollback | 4, 7, 13 | Double-fault test in suppress, double-fault propagation in verify, E2E scenario 16 |
| H10: Crash recovery idempotency | 12 | Trailer-based guard tests: matching UUID, missing trailer, foreign UUID re-dispatch (P-8) |
| H11: Max I/O retry bound | 1, 12 | MaxIORetries constant, retry exhaustion test, counter reset test |
| D-1: Tracker identity collisions | 1, 3, 4, 6, 8, 13 | Same-line different-rule key tests, line-drift scoping tests, suppression consolidation, E2E scenario 18 |
| D-2: Re-entry idempotency | 5, 11, 13 | Marker file create/detect/cleanup, runner re-entry test, E2E scenarios 19-20 |
| D-3: Outer-loop oscillation | 1, 12, 13 | Oscillation config constants, sliding-window detection/threshold tests (P-3), E2E scenario 21 |
| D-4: Commit trailers | 1, 10, 11, 12, 13 | _runId generation/uniqueness, trailer in commit, trailer parsing in crash recovery, E2E scenarios 22-23 |
| P-1: ManualFixNone guard | 8, 13 | Guard test requiring attemptsLeft>0, suppression-before-fix ordering test, E2E scenario 24 |
| P-2: S8 audit completeness | 6, 7, 8, 9, 10 | S8 assertions added to Steps 6, 7, 8, 9, 10 tests |
| P-3: Sliding-window oscillation | 1, 12, 13 | OscillationWindowSize/Threshold config, sliding-window tests (intermittent clean, below threshold, window slides), E2E scenario 21 |
| P-4: Empty-diff commit guard | 10, 13 | Empty staged diff test, net-zero revert test, E2E scenario 25 |
| P-5: Test expected values | 6, 7, 9 | Concrete expected values added to ~30% of test descriptions |
| P-6: E2E mock strategy | 13 | Mock Strategy section documenting 4-layer architecture |
| P-7: Malformed lint output | 6, 7, 13 | Truncated JSON, non-JSON stderr, count mismatch tests, E2E scenario 26 |
| P-8: Foreign trailer re-dispatch | 12, 13 | Foreign trailer triggers re-dispatch (not skip), E2E scenario 27 |

### Unmapped States

None -- all states, transitions, invariants, liveness properties, and debate objections are covered.

---

## Execution Tiers

### Tier 1: Foundation -- Types, Templates, Agent Prompt, and Suppression Utility

| Task ID | Step | Title | Files |
|---------|------|-------|-------|
| T1 | Step 1 | Phase/Result enums, state factory, clone utility, config constants | `utils/lint-fixer/types.ps1` |
| T2 | Step 2 | Learned-fixes knowledge base template | `docs/lint-fixer/lint-fixer-learned.md` |
| T3 | Step 3 | Lint-fixer agent prompt definition | `agents/code-writers/lint-fixer.md` |
| T4 | Step 4 | Suppression utility with rollback | `utils/lint-fixer/suppress.ps1` |

### Tier 2: Phase Implementations (depends on Tier 1)

| Task ID | Step | Title | Files |
|---------|------|-------|-------|
| T5 | Step 5 | Initialize phase orchestration | `utils/lint-fixer/init.ps1` |
| T6 | Step 6 | Autofix phase orchestration | `utils/lint-fixer/autofix.ps1` |
| T7 | Step 7 | Verify phases (post-autofix + counted) | `utils/lint-fixer/verify.ps1` |
| T8 | Step 8 | Manual fix phase orchestration | `utils/lint-fixer/manual.ps1` |
| T9 | Step 9 | Learn phase orchestration | `utils/lint-fixer/learn.ps1` |
| T10 | Step 10 | Commit phase orchestration | `utils/lint-fixer/commit.ps1` |

### Tier 3: Orchestrator (depends on Tier 2)

| Task ID | Step | Title | Files |
|---------|------|-------|-------|
| T11 | Step 11 | Main lifecycle runner | `utils/lint-fixer/runner.ps1` |

### Tier 4: Integration (depends on Tier 3)

| Task ID | Step | Title | Files |
|---------|------|-------|-------|
| T12 | Step 12 | Stage 9 global review integration | `stages/9-global-review.ps1` |

### Tier 5: End-to-End Validation (depends on Tier 4)

| Task ID | Step | Title | Files |
|---------|------|-------|-------|
| T13 | Step 13 | End-to-end lifecycle integration tests | `utils/lint-fixer/lifecycle.Tests.ps1` |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Phase/Result enums, state factory, clone utility, config | 1 | `typescript-writer` | `vitest-writer` | None | Domain type definitions, clone utility, AD3 tracker, AD4 runId, and validation logic -- pure logic, no I/O |
| T2 | Learned-fixes template | 1 | `trainer-writer` | `vitest-writer` | None | Knowledge base artifact with structured markdown format |
| T3 | Agent prompt definition | 1 | `trainer-writer` | `vitest-writer` | None | Claude Code agent prompt -- trainer-writer specializes in agent artifacts; includes D-1 identity, H6 scope, H8 false-positive |
| T4 | Suppression utility with rollback | 1 | `typescript-writer` | `vitest-writer` | None | File mutation utility with atomic rollback + H9 double-fault + D-1 same-line consolidation -- independently testable (AD2) |
| T5 | Initialize phase | 2 | `typescript-writer` | `vitest-writer` | T1 | File I/O + git operations + D-2 marker file -- general logic with mocked externals |
| T6 | Autofix phase | 2 | `typescript-writer` | `vitest-writer` | T1 | Process execution + output parsing + AD3 tracker init + D-1 same-line keys + P-7 malformed output -- pure orchestration logic |
| T7 | Verify phases | 2 | `typescript-writer` | `vitest-writer` | T1, T4 | Lint verification + VM loop control -- depends on suppression utility for VerifyCapReached (AD2); H9 double-fault propagation; P-7 malformed output |
| T8 | Manual fix phase | 2 | `typescript-writer` | `vitest-writer` | T1, T3, T4 | Agent dispatch + AD3 attempt tracking + D-1 same-line independence + P-1 guard -- H1/H3/H4/H7/H8 tests; depends on prompt and suppression utility |
| T9 | Learn phase | 2 | `typescript-writer` | `vitest-writer` | T1, T2 | Knowledge base mutation -- depends on template for file format |
| T10 | Commit phase | 2 | `typescript-writer` | `vitest-writer` | T1 | Git operations + message formatting + AD4 trailer + P-4 empty-diff guard -- deterministic logic |
| T11 | Main lifecycle runner | 3 | `typescript-writer` | `vitest-writer` | T5-T10 | Phase dispatch loop + D-2 marker cleanup -- H5 split tests; AD3 consistency validation; D-2 re-entry idempotency test |
| T12 | Stage 9 integration | 4 | `typescript-writer` | `vitest-writer` | T11 | Orchestrator wiring -- P-3 sliding-window oscillation, D-4/P-8 trailer-based crash recovery with re-dispatch, H6 scope tests, H11 retry cap |
| T13 | E2E lifecycle tests | 5 | `typescript-writer` | `vitest-writer` | T12 | Full lifecycle validation -- exercises entire state machine including AD1-AD4; P-1/P-3/P-4/P-6/P-7/P-8 scenarios; 4-layer mock architecture |
