# Implementation Plan: Wire project-manager, reviewer agents, free-form user_notes

## Source Artifacts

| Artifact | Path |
|----------|------|
| Briefing | `docs/questioner-sessions/2026-04-03_wire-project-manager-reviewers-user-notes.md` |
| Design Consensus | `docs/debate-moderator-sessions/2026-04-03_wire-project-manager-reviewers-user-notes.md` |
| TLA+ Specification | `docs/tla-specs/wire-project-manager-reviewers-user-notes/` |
| TLA+ Review Consensus | `docs/debate-moderator-sessions/2026-04-03_tla-review-wire-project-manager-reviewers.md` |

## TLA+ State Coverage Matrix

### States

Task states:
- `PENDING` -- task awaiting dispatch
- `LOCAL_REVIEW` -- pair session completing local self-review
- `REVIEWING` -- all 8 reviewers dispatched and running in parallel
- `REVIEW_PASSED` -- all responded reviewers passed with quorum met
- `REVIEW_FAILED` -- at least one responded reviewer failed with quorum met
- `REVISING` -- pair session revising based on reviewer findings
- `MERGED` -- task merged to integration branch (terminal)
- `FAILED` -- task failed permanently (terminal)

Reviewer states:
- `IDLE` -- reviewer awaiting dispatch
- `RUNNING` -- reviewer executing review
- `PASS` -- reviewer completed with PASS verdict
- `FAIL` -- reviewer completed with FAIL verdict
- `UNAVAILABLE` -- reviewer exhausted retries, deemed unavailable

Reviewer verdict values:
- `PASS`
- `FAIL`
- `NONE` -- no verdict yet

Reviewer scope values:
- `SESSION_DIFF` -- reviewer evaluated session diff
- `OUT_OF_SCOPE` -- diff contained nothing relevant to reviewer domain
- `NONE` -- no scope yet

Terminal task states:
- `MERGED`
- `FAILED`

### Transitions

1. `BeginLocalReview(t)` -- PENDING -> LOCAL_REVIEW
2. `CompleteLocalReview(t)` -- LOCAL_REVIEW -> REVIEWING (resets all reviewers)
3. `DispatchReviewer(t, r)` -- reviewer IDLE -> RUNNING (task must be REVIEWING)
4. `ReviewerPass(t, r)` -- reviewer RUNNING -> PASS (verdict PASS, scope existential choice)
5. `ReviewerFail(t, r)` -- reviewer RUNNING -> FAIL (verdict FAIL, scope SESSION_DIFF)
6. `ReviewerCrashRetry(t, r)` -- reviewer RUNNING -> IDLE (retries < MaxReviewerRetries, increment retries)
7. `ReviewerExhausted(t, r)` -- reviewer RUNNING -> UNAVAILABLE (retries >= MaxReviewerRetries)
8. `ReviewGatePass(t)` -- REVIEWING -> REVIEW_PASSED (all finished, quorum met, all responded passed)
9. `ReviewGateFail(t)` -- REVIEWING -> REVIEW_FAILED (all finished, quorum met, some responded failed)
10. `ReviewGateNoQuorum(t)` -- REVIEWING -> FAILED (all finished, quorum NOT met)
11. `MergeTask(t)` -- REVIEW_PASSED -> MERGED
12. `BeginRevision(t)` -- REVIEW_FAILED -> REVISING (revisionCount < MaxReviewRevisions)
13. `RevisionExhausted(t)` -- REVIEW_FAILED -> FAILED (revisionCount >= MaxReviewRevisions)
14. `CompleteRevision(t)` -- REVISING -> REVIEWING (increment revisionCount, reset all reviewers)

### Safety Invariants

1. `TypeOK` -- all variables within declared type domains
2. `RevisionBounded` -- reviewRevisionCount[t] <= MaxReviewRevisions for all tasks
3. `ReviewerRetriesBounded` -- reviewerRetries[t][r] <= MaxReviewerRetries for all tasks and reviewers
4. `MergeOnlyAfterReviewPass` -- MERGED implies all responded reviewers have PASS verdict
5. `ReviewersOnlyDuringReviewing` -- reviewers are RUNNING only when task is REVIEWING
6. `NoQuorumBlocksMerge` -- REVIEW_PASSED implies quorum met

### Liveness Properties

1. `TaskEventuallyTerminal` -- every task eventually reaches MERGED or FAILED
2. `ReviewEventuallyResolves` -- every REVIEWING task eventually reaches REVIEW_PASSED, REVIEW_FAILED, or FAILED

### TLA+ Review Amendments (from Stage 4)

1. Add ASSUME block constraining constants
2. Fix scope/verdict inconsistency (OUT_OF_SCOPE + PASS semantic hole)
3. Add terminal-state immutability properties
4. Add monotonicity property for reviewRevisionCount
5. Document retry-reset design decision (per-round)
6. Consider early-abort when quorum impossible (deferred, non-blocking)

---

## Implementation Steps

### Step 1: Task state constants and ReviewVerdict schema in design-pipeline SKILL.md

**Files:**
- `.claude/skills/design-pipeline/SKILL.md` (modify)

**Description:**
Add the reviewer-gate task states (REVIEWING, REVIEW_PASSED, REVIEW_FAILED, REVISING) to the design-pipeline's Stage 6 state machine documentation. Add the named constants MaxReviewRevisions (3), MaxReviewerRetries (2), and MinReviewQuorum (5). Add the structured ReviewVerdict schema (verdict, scope, findings[]) to the Stage 6 section. These are the foundational type definitions that all downstream agents reference.

**Dependencies:** None

**Test (write first):**
Write a vitest test that reads `.claude/skills/design-pipeline/SKILL.md` as text and asserts:
- The file contains the string `REVIEWING` as a task state
- The file contains the string `REVIEW_PASSED` as a task state
- The file contains the string `REVIEW_FAILED` as a task state
- The file contains the string `REVISING` as a task state
- The file contains `MaxReviewRevisions` with value `3`
- The file contains `MaxReviewerRetries` with value `2`
- The file contains `MinReviewQuorum` with value `5`
- The file contains `ReviewVerdict` with fields `verdict`, `scope`, and `findings`
- The file contains the reviewer gate transitions: REVIEWING -> REVIEW_PASSED, REVIEWING -> REVIEW_FAILED, REVIEW_FAILED -> REVISING, REVISING -> REVIEWING, REVIEW_PASSED -> MERGED, REVIEW_FAILED -> FAILED (via RevisionExhausted), REVIEWING -> FAILED (via ReviewGateNoQuorum)

**TLA+ Coverage:**
- State: `REVIEWING`, `REVIEW_PASSED`, `REVIEW_FAILED`, `REVISING`
- Constants: `MaxReviewRevisions`, `MaxReviewerRetries`, `MinReviewQuorum`
- Derived sets: `ReviewVerdict`, `ReviewScope`, `TaskStates`, `TerminalTaskStates`
- Invariant: `TypeOK` (type domain definitions)

---

### Step 2: Wire Stage 6 dispatch to project-manager in design-pipeline SKILL.md

**Files:**
- `.claude/skills/design-pipeline/SKILL.md` (modify)

**Description:**
Add an explicit dispatch instruction in the Stage 6 section (after the confirmation gate passes) to invoke the project-manager agent via the Agent tool. Currently the SKILL.md describes Stage 6 execution in detail but never names the project-manager as the dispatch target. The instruction must pass the implementation plan file path, accumulated pipeline context, and integration branch name to the project-manager. This closes the execution gap identified in the briefing.

**Dependencies:** Step 1

**Test (write first):**
Write a vitest test that reads `.claude/skills/design-pipeline/SKILL.md` and asserts:
- The Stage 6 section contains a dispatch instruction referencing `project-manager`
- The dispatch instruction references `.claude/skills/project-manager/AGENT.md`
- The dispatch passes `implementation plan file path`, `accumulated pipeline context`, and `integration branch name`
- The dispatch occurs after the confirmation gate (after `STAGE_6_CONFIRMATION_GATE` transitions to `STAGE_6_TIER_EXECUTING`)

**TLA+ Coverage:**
- Transition: `BeginLocalReview` (initiating the task lifecycle from PENDING, which the project-manager dispatch triggers)

---

### Step 3: Add reviewer integration to project-manager AGENT.md

**Files:**
- `.claude/skills/project-manager/AGENT.md` (modify)

**Description:**
Extend the project-manager's process to include the reviewer gate between task completion (LOCAL_REVIEW complete) and merge. Add the new task states (REVIEWING, REVIEW_PASSED, REVIEW_FAILED, REVISING) to the Task States section. Document the reviewer dispatch flow: after a pair session completes LOCAL_REVIEW, the project-manager dispatches all 8 reviewers in parallel, waits for all to finish, evaluates the gate (quorum + all-must-pass), and either proceeds to merge or sends findings back to the pair for revision. Document the full re-run rationale (safety over efficiency -- any revision invalidates all prior passes). Add MaxReviewRevisions (3) and MaxReviewerRetries (2) and MinReviewQuorum (5) to the constants table.

**Dependencies:** Step 1

**Test (write first):**
Write a vitest test that reads `.claude/skills/project-manager/AGENT.md` and asserts:
- The Task States section includes `REVIEWING`, `REVIEW_PASSED`, `REVIEW_FAILED`, `REVISING`
- The process includes a "Reviewer Gate" or "Review Phase" section
- The reviewer dispatch is described as parallel (all 8 reviewers)
- The gate evaluation requires quorum (MinReviewQuorum) and all responded must pass
- The revision cycle is bounded by MaxReviewRevisions (3)
- Failed reviewer retries are bounded by MaxReviewerRetries (2)
- The full re-run rationale is documented (safety over efficiency, any revision triggers full re-run)
- The handoff chain is: LOCAL_REVIEW -> Reviewers -> project-manager -> merge or revision
- The project-manager mediates between pairs and reviewers (pairs never interact with reviewers directly)

**TLA+ Coverage:**
- State: `REVIEWING`, `REVIEW_PASSED`, `REVIEW_FAILED`, `REVISING`, `MERGED`, `FAILED`
- Transition: `CompleteLocalReview`, `DispatchReviewer`, `ReviewGatePass`, `ReviewGateFail`, `ReviewGateNoQuorum`, `MergeTask`, `BeginRevision`, `RevisionExhausted`, `CompleteRevision`
- Invariant: `RevisionBounded`, `MergeOnlyAfterReviewPass`, `NoQuorumBlocksMerge`, `ReviewersOnlyDuringReviewing`
- Property: `TaskEventuallyTerminal`, `ReviewEventuallyResolves`

---

### Step 4: Create artifact-reviewer AGENT.md

**Files:**
- `.claude/skills/reviewers/artifact-reviewer/AGENT.md` (create)

**Description:**
Create the artifact-reviewer agent definition. This reviewer checks that the session diff produces well-formed artifacts: files are in the correct directories, naming conventions are followed, no orphan files, no files created outside the task scope, and all files listed in the task assignment are present. The AGENT.md must specify: role, review criteria, self-scoping to session diff only (pre-existing issues go to user_notes), out-of-domain behavior (auto-pass with OUT_OF_SCOPE if diff contains no artifact files), structured ReviewVerdict output schema, and the rule that the reviewer never interacts with pairs directly (only with project-manager).

**Dependencies:** Step 1

**Test (write first):**
Write a vitest test that reads `.claude/skills/reviewers/artifact-reviewer/AGENT.md` and asserts:
- The file exists and is non-empty
- Contains a YAML frontmatter with `name: artifact-reviewer`
- Specifies review criteria (directory structure, naming conventions, file presence, scope boundaries)
- Contains self-scoping rule (session diff only, pre-existing issues to user_notes)
- Contains out-of-domain behavior (PASS with OUT_OF_SCOPE)
- Contains structured ReviewVerdict output (verdict, scope, findings[])
- States the reviewer never interacts with pairs directly
- Contains severity levels in findings

**TLA+ Coverage:**
- State: `RUNNING` (reviewer), `PASS`, `FAIL`, `UNAVAILABLE`
- Transition: `DispatchReviewer`, `ReviewerPass`, `ReviewerFail`, `ReviewerCrashRetry`, `ReviewerExhausted`
- Invariant: `ReviewerRetriesBounded`

---

### Step 5: Create compliance-reviewer AGENT.md

**Files:**
- `.claude/skills/reviewers/compliance-reviewer/AGENT.md` (create)

**Description:**
Create the compliance-reviewer agent definition. This reviewer checks that the session diff conforms to the upstream pipeline specifications: the briefing's scope (in-scope vs out-of-scope), the design consensus recommendations, and the TLA+ spec's states and transitions. It receives the briefing, design consensus, and TLA+ spec as context. Self-scoping to session diff. Out-of-domain auto-pass. Structured ReviewVerdict output.

**Dependencies:** Step 1

**Test (write first):**
Write a vitest test that reads `.claude/skills/reviewers/compliance-reviewer/AGENT.md` and asserts:
- The file exists and is non-empty
- Contains YAML frontmatter with `name: compliance-reviewer`
- Specifies upstream specs as required inputs (briefing, design consensus, TLA+ spec)
- Specifies review criteria (scope compliance, design consensus adherence, TLA+ state coverage)
- Contains self-scoping rule and out-of-domain behavior
- Contains structured ReviewVerdict output
- States the reviewer never interacts with pairs directly

**TLA+ Coverage:**
- State: `RUNNING` (reviewer), `PASS`, `FAIL`, `UNAVAILABLE`
- Transition: `DispatchReviewer`, `ReviewerPass`, `ReviewerFail`, `ReviewerCrashRetry`, `ReviewerExhausted`
- Invariant: `ReviewerRetriesBounded`

---

### Step 6: Create bug-reviewer AGENT.md

**Files:**
- `.claude/skills/reviewers/bug-reviewer/AGENT.md` (create)

**Description:**
Create the bug-reviewer agent definition. This reviewer analyzes the session diff for logic errors, off-by-one errors, null/undefined handling gaps, race conditions, incorrect assumptions, and behavioral bugs. It receives git history and PR context for touched files. Self-scoping to session diff. Out-of-domain auto-pass. Structured ReviewVerdict output.

**Dependencies:** Step 1

**Test (write first):**
Write a vitest test that reads `.claude/skills/reviewers/bug-reviewer/AGENT.md` and asserts:
- The file exists and is non-empty
- Contains YAML frontmatter with `name: bug-reviewer`
- Specifies review criteria (logic errors, off-by-one, null handling, race conditions, incorrect assumptions)
- Specifies git history / PR context as input
- Contains self-scoping rule and out-of-domain behavior
- Contains structured ReviewVerdict output
- States the reviewer never interacts with pairs directly

**TLA+ Coverage:**
- State: `RUNNING` (reviewer), `PASS`, `FAIL`, `UNAVAILABLE`
- Transition: `DispatchReviewer`, `ReviewerPass`, `ReviewerFail`, `ReviewerCrashRetry`, `ReviewerExhausted`
- Invariant: `ReviewerRetriesBounded`

---

### Step 7: Create simplicity-reviewer AGENT.md

**Files:**
- `.claude/skills/reviewers/simplicity-reviewer/AGENT.md` (create)

**Description:**
Create the simplicity-reviewer agent definition. This reviewer checks that the session diff does not introduce unnecessary complexity: over-abstraction, premature generalization, dead code, redundant logic, overly nested structures, or violations of YAGNI. Self-scoping to session diff. Out-of-domain auto-pass. Structured ReviewVerdict output.

**Dependencies:** Step 1

**Test (write first):**
Write a vitest test that reads `.claude/skills/reviewers/simplicity-reviewer/AGENT.md` and asserts:
- The file exists and is non-empty
- Contains YAML frontmatter with `name: simplicity-reviewer`
- Specifies review criteria (over-abstraction, premature generalization, dead code, redundant logic, YAGNI)
- Contains self-scoping rule and out-of-domain behavior
- Contains structured ReviewVerdict output
- States the reviewer never interacts with pairs directly

**TLA+ Coverage:**
- State: `RUNNING` (reviewer), `PASS`, `FAIL`, `UNAVAILABLE`
- Transition: `DispatchReviewer`, `ReviewerPass`, `ReviewerFail`, `ReviewerCrashRetry`, `ReviewerExhausted`
- Invariant: `ReviewerRetriesBounded`

---

### Step 8: Create type-design-reviewer AGENT.md

**Files:**
- `.claude/skills/reviewers/type-design-reviewer/AGENT.md` (create)

**Description:**
Create the type-design-reviewer agent definition. This reviewer checks that the session diff uses types correctly: proper use of discriminated unions, avoiding `any`/`unknown` escape hatches, type narrowing, consistent type naming, alignment with TLA+ spec type definitions. Receives the TLA+ spec as context for invariant checking. Self-scoping to session diff. Out-of-domain auto-pass. Structured ReviewVerdict output.

**Dependencies:** Step 1

**Test (write first):**
Write a vitest test that reads `.claude/skills/reviewers/type-design-reviewer/AGENT.md` and asserts:
- The file exists and is non-empty
- Contains YAML frontmatter with `name: type-design-reviewer`
- Specifies TLA+ spec as required input for invariant checking
- Specifies review criteria (discriminated unions, any/unknown avoidance, type narrowing, naming, TLA+ alignment)
- Contains self-scoping rule and out-of-domain behavior
- Contains structured ReviewVerdict output
- States the reviewer never interacts with pairs directly

**TLA+ Coverage:**
- State: `RUNNING` (reviewer), `PASS`, `FAIL`, `UNAVAILABLE`
- Transition: `DispatchReviewer`, `ReviewerPass`, `ReviewerFail`, `ReviewerCrashRetry`, `ReviewerExhausted`
- Invariant: `ReviewerRetriesBounded`, `TypeOK` (type design aligns with spec type domains)

---

### Step 9: Create security-reviewer AGENT.md

**Files:**
- `.claude/skills/reviewers/security-reviewer/AGENT.md` (create)

**Description:**
Create the security-reviewer agent definition. This reviewer checks the session diff for security issues: hardcoded secrets, path traversal vulnerabilities, injection risks, improper input validation, insecure defaults, and sensitive data exposure. Self-scoping to session diff. Out-of-domain auto-pass. Structured ReviewVerdict output.

**Dependencies:** Step 1

**Test (write first):**
Write a vitest test that reads `.claude/skills/reviewers/security-reviewer/AGENT.md` and asserts:
- The file exists and is non-empty
- Contains YAML frontmatter with `name: security-reviewer`
- Specifies review criteria (secrets, path traversal, injection, input validation, insecure defaults, data exposure)
- Contains self-scoping rule and out-of-domain behavior
- Contains structured ReviewVerdict output
- States the reviewer never interacts with pairs directly

**TLA+ Coverage:**
- State: `RUNNING` (reviewer), `PASS`, `FAIL`, `UNAVAILABLE`
- Transition: `DispatchReviewer`, `ReviewerPass`, `ReviewerFail`, `ReviewerCrashRetry`, `ReviewerExhausted`
- Invariant: `ReviewerRetriesBounded`

---

### Step 10: Create backlog-reviewer AGENT.md

**Files:**
- `.claude/skills/reviewers/backlog-reviewer/AGENT.md` (create)

**Description:**
Create the backlog-reviewer agent definition. This reviewer identifies non-blocking improvement opportunities in the session diff: potential refactoring targets, performance concerns, accessibility gaps, documentation gaps, and test coverage gaps. Unlike other reviewers, the backlog-reviewer never returns FAIL -- it always returns PASS but writes findings to user_notes as observations for the user to audit later. Self-scoping to session diff. Out-of-domain auto-pass. Structured ReviewVerdict output (always PASS).

**Dependencies:** Step 1

**Test (write first):**
Write a vitest test that reads `.claude/skills/reviewers/backlog-reviewer/AGENT.md` and asserts:
- The file exists and is non-empty
- Contains YAML frontmatter with `name: backlog-reviewer`
- Specifies that verdict is always PASS (findings go to user_notes, not the pair)
- Specifies review scope (refactoring opportunities, performance, accessibility, documentation, test coverage)
- Contains self-scoping rule and out-of-domain behavior
- Contains structured ReviewVerdict output
- Specifies user_notes as the output destination for observations
- States the reviewer never interacts with pairs directly

**TLA+ Coverage:**
- State: `RUNNING` (reviewer), `PASS`, `UNAVAILABLE`
- Transition: `DispatchReviewer`, `ReviewerPass`, `ReviewerCrashRetry`, `ReviewerExhausted`
- Invariant: `ReviewerRetriesBounded`

---

### Step 11: Create test-reviewer AGENT.md with simulated integration merge scope

**Files:**
- `.claude/skills/reviewers/test-reviewer/AGENT.md` (create)

**Description:**
Create the test-reviewer agent definition. This reviewer is differentiated from LOCAL_REVIEW and Phase 3 Verification by running tests, lint, and tsc against a simulated integration merge (cherry-pick session diff into a temp branch from the integration branch) to catch cross-task integration failures before the actual merge. This is the only reviewer that executes code -- all others are analytical. The AGENT.md must explicitly state this differentiated scope. Self-scoping to session diff. Out-of-domain auto-pass. Structured ReviewVerdict output.

**Dependencies:** Step 1

**Test (write first):**
Write a vitest test that reads `.claude/skills/reviewers/test-reviewer/AGENT.md` and asserts:
- The file exists and is non-empty
- Contains YAML frontmatter with `name: test-reviewer`
- Specifies simulated integration merge as the differentiated scope (cherry-pick into temp branch)
- Explicitly states this is NOT a duplication of LOCAL_REVIEW or Phase 3 Verification
- Specifies running tests, lint, and tsc against the simulated merge
- Contains self-scoping rule and out-of-domain behavior
- Contains structured ReviewVerdict output
- States the reviewer never interacts with pairs directly

**TLA+ Coverage:**
- State: `RUNNING` (reviewer), `PASS`, `FAIL`, `UNAVAILABLE`
- Transition: `DispatchReviewer`, `ReviewerPass`, `ReviewerFail`, `ReviewerCrashRetry`, `ReviewerExhausted`
- Invariant: `ReviewerRetriesBounded`

---

### Step 12: Agent-scoped user_notes with write convention for all agents

**Files:**
- `.claude/skills/shared/conventions.md` (modify)

**Description:**
Add a user_notes convention to the shared conventions file that all agents read. The convention specifies: (1) user_notes uses agent-scoped files in `docs/user_notes/` directory (not a single shared file) to avoid concurrent write conflicts, (2) file naming: `docs/user_notes/<agent-name>-<YYYY-MM-DD>-<HH-MM-SS>.md`, (3) any agent can write at any time (fire-and-forget append), (4) entries include agent name, timestamp, and free-form observation, (5) user audits and trims manually -- no automated cleanup, (6) non-blocking: write failure warns and continues, never halts the pipeline. This replaces the prior single-file `docs/user_notes.md` design per the design consensus recommendation (option b -- agent-scoped files).

**Dependencies:** None

**Test (write first):**
Write a vitest test that reads `.claude/skills/shared/conventions.md` and asserts:
- Contains a user_notes section
- Specifies `docs/user_notes/` as the directory (not a single file)
- Specifies agent-scoped file naming pattern
- States any agent can write at any time
- States write failures are non-blocking (warn and continue)
- States user audits and trims manually

**TLA+ Coverage:**
- This step covers the user_notes design decision from the design consensus (item 6: agent-scoped files). The TLA+ spec does not model user_notes (it is a side channel, not part of the reviewer gate state machine), but this is an explicit requirement from the briefing and design consensus.

---

### Step 13: Update implementation-writer AGENT.md user_notes convention

**Files:**
- `.claude/skills/implementation-writer/AGENT.md` (modify)

**Description:**
Update the implementation-writer's Process step 7 (Check for Needed Code Writer Types) to use the agent-scoped user_notes convention from Step 12. Change the output destination from `docs/user_notes.md` (single file) to `docs/user_notes/<agent-name>-<timestamp>.md` (agent-scoped file in the user_notes directory). Update the creation logic: if the `docs/user_notes/` directory does not exist, create it. Remove the single-file header creation logic. The entry format stays the same.

**Dependencies:** Step 12

**Test (write first):**
Write a vitest test that reads `.claude/skills/implementation-writer/AGENT.md` and asserts:
- The Process step 7 references `docs/user_notes/` directory (not `docs/user_notes.md` single file)
- The file naming pattern includes agent name and timestamp
- The creation logic creates the directory if absent (not a file with a header)
- The entry format includes `requested_by`, `expert_needed`, `rationale`, `source_session`

**TLA+ Coverage:**
- No direct TLA+ coverage. This is a supporting design decision from the briefing (user_notes expansion) implemented in the implementation-writer agent definition.

---

### Step 14: Reviewer crash/timeout handling and quorum fallback documentation

**Files:**
- `.claude/skills/project-manager/AGENT.md` (modify)

**Description:**
Add explicit documentation to the project-manager's reviewer gate section for crash/timeout handling: each reviewer has MaxReviewerRetries (2) retries on crash/timeout. If a reviewer exhausts retries, it is marked UNAVAILABLE. The review gate proceeds with N-1 reviewers. If multiple reviewers become unavailable and the remaining responded reviewers are fewer than MinReviewQuorum (5), the task FAILS (escalate to user). Document the per-round retry reset (retries reset to zero on each revision cycle) as an explicit design decision per TLA+ review amendment 5.

**Dependencies:** Step 3

**Test (write first):**
Write a vitest test that reads `.claude/skills/project-manager/AGENT.md` and asserts:
- Contains crash/timeout handling documentation for reviewers
- Specifies MaxReviewerRetries (2) for retry bounds
- Specifies UNAVAILABLE state when retries exhausted
- Specifies MinReviewQuorum (5) for quorum fallback
- Specifies that if quorum is not met, task FAILS
- Documents the per-round retry reset as an explicit design decision

**TLA+ Coverage:**
- Transition: `ReviewerCrashRetry`, `ReviewerExhausted`, `ReviewGateNoQuorum`
- Invariant: `ReviewerRetriesBounded`, `NoQuorumBlocksMerge`
- Property: `TaskEventuallyTerminal` (bounded retries ensure liveness)
- TLA+ Review Amendment: 5 (retry-reset design decision documented)

---

### Step 15: Contradictory reviewer findings and structured failure metadata

**Files:**
- `.claude/skills/project-manager/AGENT.md` (modify)

**Description:**
Add documentation to the project-manager for handling contradictory reviewer findings: when reviewer findings conflict (e.g., simplicity-reviewer vs type-design-reviewer), both sets of findings are sent to the pair to reconcile. If the pair cannot reconcile after MaxReviewRevisions cycles, the session fails with structured metadata recording which reviewers conflicted and on what, so the user has visibility. Add the structured failure metadata format to the output section.

**Dependencies:** Step 3

**Test (write first):**
Write a vitest test that reads `.claude/skills/project-manager/AGENT.md` and asserts:
- Contains documentation for contradictory reviewer findings
- Specifies that conflicting findings are sent to the pair (not arbitrated by project-manager)
- Specifies that after MaxReviewRevisions, session fails with structured metadata
- The structured metadata includes which reviewers conflicted and on what

**TLA+ Coverage:**
- Transition: `ReviewGateFail`, `BeginRevision`, `RevisionExhausted`
- Invariant: `RevisionBounded`
- Property: `TaskEventuallyTerminal` (bounded revision cycles ensure termination)

---

### Step 16: Scope/verdict consistency documentation (TLA+ review amendment 2)

**Files:**
- `.claude/skills/project-manager/AGENT.md` (modify)

**Description:**
Address TLA+ review amendment 2 (scope/verdict inconsistency). Document in the project-manager that an OUT_OF_SCOPE + PASS verdict means the reviewer's domain was not applicable to this diff. Such verdicts count toward quorum (they responded) but the review gate must require at least one SESSION_DIFF-scoped PASS among responded reviewers for the gate to pass. This prevents a task from passing review when all reviewers report OUT_OF_SCOPE (which would mean no one actually reviewed the session diff). This resolves the semantic hole identified by expert-tla.

**Dependencies:** Step 3

**Test (write first):**
Write a vitest test that reads `.claude/skills/project-manager/AGENT.md` and asserts:
- Documents the OUT_OF_SCOPE + PASS semantics
- Requires at least one SESSION_DIFF-scoped PASS for gate pass
- Explains that OUT_OF_SCOPE verdicts count toward quorum but do not satisfy the review requirement alone

**TLA+ Coverage:**
- Transition: `ReviewerPass` (scope existential choice), `ReviewGatePass`
- TLA+ Review Amendment: 2 (scope/verdict inconsistency fix)

---

## State Coverage Audit

### Task States

| State | Covered by Step(s) |
|-------|-------------------|
| `PENDING` | Step 1, Step 3 |
| `LOCAL_REVIEW` | Step 1, Step 2, Step 3 |
| `REVIEWING` | Step 1, Step 3, Steps 4-11 |
| `REVIEW_PASSED` | Step 1, Step 3, Step 16 |
| `REVIEW_FAILED` | Step 1, Step 3, Step 15 |
| `REVISING` | Step 1, Step 3, Step 15 |
| `MERGED` | Step 1, Step 3 |
| `FAILED` | Step 1, Step 3, Step 14 |

### Reviewer States

| State | Covered by Step(s) |
|-------|-------------------|
| `IDLE` | Steps 4-11 |
| `RUNNING` | Steps 4-11 |
| `PASS` | Steps 4-11 |
| `FAIL` | Steps 4-11 (except Step 10 -- backlog-reviewer always PASS) |
| `UNAVAILABLE` | Step 14 |

### Transitions

| Transition | Covered by Step(s) |
|------------|-------------------|
| `BeginLocalReview` | Step 2 |
| `CompleteLocalReview` | Step 3 |
| `DispatchReviewer` | Step 3, Steps 4-11 |
| `ReviewerPass` | Steps 4-11, Step 16 |
| `ReviewerFail` | Steps 4-11 |
| `ReviewerCrashRetry` | Step 14 |
| `ReviewerExhausted` | Step 14 |
| `ReviewGatePass` | Step 3, Step 16 |
| `ReviewGateFail` | Step 3, Step 15 |
| `ReviewGateNoQuorum` | Step 3, Step 14 |
| `MergeTask` | Step 3 |
| `BeginRevision` | Step 3, Step 15 |
| `RevisionExhausted` | Step 3, Step 15 |
| `CompleteRevision` | Step 3 |

### Safety Invariants

| Invariant | Verified by Step(s) |
|-----------|-------------------|
| `TypeOK` | Step 1 (type domain definitions) |
| `RevisionBounded` | Step 3, Step 15 |
| `ReviewerRetriesBounded` | Steps 4-11, Step 14 |
| `MergeOnlyAfterReviewPass` | Step 3, Step 16 |
| `ReviewersOnlyDuringReviewing` | Step 3 |
| `NoQuorumBlocksMerge` | Step 3, Step 14 |

### Liveness Properties

| Property | Verified by Step(s) |
|----------|-------------------|
| `TaskEventuallyTerminal` | Step 3 (bounded revision), Step 14 (bounded retries), Step 15 (revision exhaustion) |
| `ReviewEventuallyResolves` | Step 3 (gate evaluation), Step 14 (reviewer exhaustion path) |

### TLA+ Review Amendments

| Amendment | Addressed by Step(s) |
|-----------|---------------------|
| 1. ASSUME block | Implementation-time concern; the AGENT.md files document the valid constant ranges (Step 1, Step 3) |
| 2. Scope/verdict inconsistency | Step 16 |
| 3. Terminal-state immutability | Step 3 (MERGED and FAILED documented as terminal, no transitions out) |
| 4. Monotonicity of reviewRevisionCount | Step 3 (revision count only increments in CompleteRevision) |
| 5. Retry-reset design decision | Step 14 (per-round reset documented as explicit design decision) |
| 6. Early-abort when quorum impossible | Deferred per TLA+ review consensus (non-blocking, liveness optimization only) |

All TLA+ states, transitions, and properties are covered by the implementation plan.

---

## Execution Tiers

### Tier 1: Foundation (independent type and convention definitions)

These steps define the foundational constants, schemas, and conventions that all downstream steps reference. Step 1 establishes type definitions in the pipeline orchestrator. Step 12 establishes the user_notes convention in shared conventions. Neither depends on the other and they modify different files.

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Task state constants and ReviewVerdict schema in design-pipeline SKILL.md |
| T12 | Step 12 | Agent-scoped user_notes with write convention for all agents |

### Tier 2: Core wiring and all 8 reviewer agents (depends on Tier 1 -- type definitions must exist)

These steps all depend on Step 1 (the type definitions) but are independent of each other. The reviewer AGENT.md files (Steps 4-11) each create a new file in a unique directory. Steps 2 and 3 modify different files (SKILL.md vs project-manager AGENT.md). Step 13 depends on Step 12 (Tier 1). All can execute in parallel.

| Task ID | Step | Title |
|---------|------|-------|
| T2 | Step 2 | Wire Stage 6 dispatch to project-manager |
| T3 | Step 3 | Add reviewer integration to project-manager AGENT.md |
| T4 | Step 4 | Create artifact-reviewer AGENT.md |
| T5 | Step 5 | Create compliance-reviewer AGENT.md |
| T6 | Step 6 | Create bug-reviewer AGENT.md |
| T7 | Step 7 | Create simplicity-reviewer AGENT.md |
| T8 | Step 8 | Create type-design-reviewer AGENT.md |
| T9 | Step 9 | Create security-reviewer AGENT.md |
| T10 | Step 10 | Create backlog-reviewer AGENT.md |
| T11 | Step 11 | Create test-reviewer AGENT.md |
| T13 | Step 13 | Update implementation-writer AGENT.md user_notes convention |

### Tier 3: Project-manager refinements (depends on Tier 2 -- reviewer integration must exist)

These steps all modify the project-manager AGENT.md, so they cannot run in parallel. They add specific behavioral documentation on top of the reviewer integration added in Step 3. They are ordered by dependency: Step 14 (crash handling), Step 15 (contradictory findings), Step 16 (scope/verdict) each add a different section to the project-manager.

| Task ID | Step | Title |
|---------|------|-------|
| T14 | Step 14 | Reviewer crash/timeout handling and quorum fallback |
| T15 | Step 15 | Contradictory reviewer findings and structured failure metadata |
| T16 | Step 16 | Scope/verdict consistency documentation |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Blocker | Rationale |
|---------|-------|------|-------------|-------------|--------------|---------|-----------|
| T1 | Task state constants and ReviewVerdict schema | 1 | trainer-writer | vitest-writer | None | Yes | SKILL.md artifact in .claude/ directory; vitest validates structure via file content assertions |
| T12 | Agent-scoped user_notes convention | 1 | trainer-writer | vitest-writer | None | Yes | Shared conventions file in .claude/ directory; vitest validates convention presence |
| T2 | Wire Stage 6 dispatch to project-manager | 2 | trainer-writer | vitest-writer | T1 | No | SKILL.md dispatch wiring in .claude/ directory; vitest validates dispatch instruction presence |
| T3 | Add reviewer integration to project-manager | 2 | trainer-writer | vitest-writer | T1 | Yes | AGENT.md artifact in .claude/ directory; vitest validates reviewer gate documentation |
| T4 | Create artifact-reviewer AGENT.md | 2 | trainer-writer | vitest-writer | T1 | No | New AGENT.md in .claude/skills/reviewers/; vitest validates structure and content |
| T5 | Create compliance-reviewer AGENT.md | 2 | trainer-writer | vitest-writer | T1 | No | New AGENT.md in .claude/skills/reviewers/; vitest validates structure and content |
| T6 | Create bug-reviewer AGENT.md | 2 | trainer-writer | vitest-writer | T1 | No | New AGENT.md in .claude/skills/reviewers/; vitest validates structure and content |
| T7 | Create simplicity-reviewer AGENT.md | 2 | trainer-writer | vitest-writer | T1 | No | New AGENT.md in .claude/skills/reviewers/; vitest validates structure and content |
| T8 | Create type-design-reviewer AGENT.md | 2 | trainer-writer | vitest-writer | T1 | No | New AGENT.md in .claude/skills/reviewers/; vitest validates structure and content |
| T9 | Create security-reviewer AGENT.md | 2 | trainer-writer | vitest-writer | T1 | No | New AGENT.md in .claude/skills/reviewers/; vitest validates structure and content |
| T10 | Create backlog-reviewer AGENT.md | 2 | trainer-writer | vitest-writer | T1 | No | New AGENT.md in .claude/skills/reviewers/; vitest validates structure and content |
| T11 | Create test-reviewer AGENT.md | 2 | trainer-writer | vitest-writer | T1 | No | New AGENT.md in .claude/skills/reviewers/; vitest validates structure and content |
| T13 | Update implementation-writer user_notes convention | 2 | trainer-writer | vitest-writer | T12 | No | AGENT.md artifact in .claude/ directory; vitest validates user_notes path convention |
| T14 | Reviewer crash/timeout handling and quorum fallback | 3 | trainer-writer | vitest-writer | T3 | No | AGENT.md refinement in .claude/ directory; vitest validates crash handling documentation |
| T15 | Contradictory reviewer findings and failure metadata | 3 | trainer-writer | vitest-writer | T3 | No | AGENT.md refinement in .claude/ directory; vitest validates contradiction handling documentation |
| T16 | Scope/verdict consistency documentation | 3 | trainer-writer | vitest-writer | T3 | No | AGENT.md refinement in .claude/ directory; vitest validates scope/verdict semantics documentation |
