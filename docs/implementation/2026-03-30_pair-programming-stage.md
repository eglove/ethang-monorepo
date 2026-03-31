# Implementation Plan: Pair Programming Stage (Design Pipeline Stage 6)

## Source Artifacts

| Artifact | Path |
|----------|------|
| Briefing | `docs/questioner-sessions/2026-03-30_pair-programming-stage.md` |
| Design Consensus | `docs/debate-moderator-sessions/2026-03-30_pair-programming-stage-design.md` |
| TLA+ Specification | `docs/tla-specs/pair-programming-stage/PairProgrammingStage.tla` |
| TLA+ Review Consensus | `docs/debate-moderator-sessions/2026-03-30_pair-programming-stage-tla-review.md` |

## TLA+ State Coverage Matrix

### States

**Pipeline States:**
- `CONFIRMATION_GATE` — waiting for user approval
- `TIER_EXECUTING` — dispatching and running pair sessions
- `TIER_MERGING` — serialized merge queue processing
- `INTER_TIER_VERIFICATION` — full test suite + type-check after tier merges
- `GLOBAL_REVIEW` — cross-task integration review
- `FIX_SESSION` — targeted fix session from failed global review
- `COMPLETE` — pipeline finished, terminal artifact committed
- `HALTED` — unrecoverable failure, escalated to user

**Session States (per task):**
- `IDLE` — not yet dispatched
- `HANDSHAKE` — test writer proposes increment, code writer confirms
- `RED` — test writer writing a failing test
- `TEST_VALIDATION` — quality gate on the failing test
- `GREEN` — code writer making the test pass
- `REFACTOR_REVIEW` — in-cycle refactor review
- `LOCAL_REVIEW` — 5-point checklist + mutual cross-review
- `SESSION_COMPLETE` — task done, ready for merge
- `SESSION_FAILED` — unrecoverable session error

**Merge States (per task):**
- `NOT_QUEUED` — not yet in merge pipeline
- `QUEUED` — waiting for merge queue slot
- `MERGING` — actively merging worktree to tier branch
- `POST_MERGE_TEST` — running full test suite after merge
- `MERGE_COMPLETE` — successfully merged and verified
- `MERGE_CONFLICT` — merge failed, awaiting resolution

**Halt Reasons:**
- `NONE`
- `TIER_ALL_FAILED`
- `VERIFICATION_FAILED`
- `GLOBAL_REVIEW_EXHAUSTED`
- `MERGE_CONFLICT_UNRESOLVABLE`

### Transitions

**Pipeline-level:**
- `UserConfirms` — gate approval, advance to tier 1
- `BeginTierMerging` — all sessions done, start merge queue
- `TierAllFailed` — all sessions in tier failed, halt
- `BeginInterTierVerification` — all merges done, run verification
- `VerificationPasses` — advance to next tier or global review
- `VerificationFails` — halt (cross-tier defect)
- `GlobalReviewPasses` — pipeline complete, set terminal artifact
- `GlobalReviewFails` — spawn fix session (under cap)
- `GlobalReviewExhausted` — fix cap reached, halt
- `FixSessionComplete` — return to global review

**Session-level:**
- `DispatchSession(task)` — create worktree, start session
- `CompleteHandshake(task)` — handshake done, enter RED
- `WriteFailingTest(task)` — test writer writes failing test
- `TDDCyclesExhausted(task)` — cycles exhausted with work done, go to LOCAL_REVIEW
- `TDDCyclesExhaustedNoWork(task)` — cycles exhausted with zero work, SESSION_FAILED
- `TestValidationPasses(task)` — test quality gate passes, enter GREEN
- `TestValidationFails(task)` — test quality gate fails, back to RED (bounded)
- `TestValidationExhausted(task)` — validation retries exhausted, SESSION_FAILED
- `MakeTestPass(task)` — code writer makes test pass, increment tddCycle + commitCount
- `ContinueTDD(task)` — more cycles available, back to HANDSHAKE
- `TaskComplete(task)` — task done, enter LOCAL_REVIEW
- `LocalReviewPasses(task)` — local review passes, SESSION_COMPLETE
- `LocalReviewNeedsFix(task)` — cross-review finds issues, back to HANDSHAKE (bounded)
- `LocalReviewExhausted(task)` — cross-review exhausted, SESSION_FAILED
- `SessionFails(task)` — agent crash in any active state
- `SessionFailsCorruption(task)` — filesystem corruption failure
- `ReDispatchSession(task)` — logic-error re-dispatch, inherits context
- `ReDispatchSessionCorruption(task)` — corruption re-dispatch, full reset

**Merge-level:**
- `BeginMerge(task)` — start merging (serialized, one at a time)
- `MergeSucceeds(task)` — merge done, run post-merge test
- `PostMergeTestPasses(task)` — post-merge test passes, MERGE_COMPLETE
- `PostMergeTestFails(task)` — post-merge test fails, MERGE_CONFLICT
- `MergeConflict(task)` — merge step itself fails
- `MergeConflictResolved(task)` — re-queue after conflict resolution (bounded)
- `MergeConflictEscalates(task)` — retries exhausted, halt

### Safety Invariants

- `TypeOK` — all variables within declared domains
- `SerializedMergeQueue` — at most one task MERGING at a time
- `TDDOrdering` — GREEN requires hasFailingTest = TRUE
- `GlobalFixBounded` — globalFixCount <= MaxGlobalFixes
- `CrossReviewBounded` — crossReviewCount <= MaxCrossReview per task
- `TierOrderingValid` — active sessions belong to currentTier only
- `ConcurrencyBounded` — active sessions <= MaxConcurrent
- `CompletionRequiresConfirmation` — COMPLETE requires confirmed = TRUE
- `NoMergeDuringExecution` — no merge activity during TIER_EXECUTING
- `ReDispatchBounded` — reDispatchCount <= MaxReDispatches per task
- `CommitCountMatchesCycles` — commitCount = tddCycle for SESSION_COMPLETE tasks
- `MergeConflictRetriesBounded` — mergeConflictRetries <= MaxMergeConflictRetries
- `TerminalArtifactOnlyOnComplete` — terminalArtifact TRUE only when COMPLETE
- `HaltReasonConsistent` — haltReason != NONE when HALTED

### Liveness Properties

- `SessionTerminates` — every dispatched session eventually reaches SESSION_COMPLETE, SESSION_FAILED, or HALTED
- `TierTerminates` — every TIER_EXECUTING eventually reaches TIER_MERGING or HALTED
- `PipelineTerminates` — confirmed pipeline eventually reaches COMPLETE or HALTED
- `MergeQueueProgress` — every QUEUED merge eventually reaches MERGE_COMPLETE, MERGE_CONFLICT, or HALTED

---

## Implementation Steps

### Step 1: Pipeline state types and constants

**Files:**
- `.claude/skills/design-pipeline/types.ts` (create)

**Description:**
Define the TypeScript type system that mirrors the TLA+ state space. This includes string literal union types for all pipeline states, session states, merge states, and halt reasons. Also define the constants (MaxConcurrent = 3, MaxGlobalFixes = 3, MaxCrossReview bounded, MaxReDispatches bounded, MaxMergeConflictRetries bounded). These types are the foundation every other step imports.

**Dependencies:** None

**Test (write first):**
Write a test that imports each type union and verifies exhaustiveness. For each state enum, assert that a switch statement over all values is exhaustive (TypeScript compiler check via a `never` default). Test that each constant is a positive integer. Test that `PipelineState` contains exactly 8 members, `SessionState` contains exactly 9, `MergeState` contains exactly 6, `HaltReason` contains exactly 5.

**TLA+ Coverage:**
- State: All `PipelineStates`, `SessionStates`, `MergeStates`, `HaltReasons`
- Invariant: `TypeOK` (type system enforces domain membership)

---

### Step 2: Task graph types and tier validation

**Files:**
- `.claude/skills/design-pipeline/task-graph.ts` (create)

**Description:**
Define the task graph types: `TaskAssignment` (task ID, tier number, agent pair, file list, TLA+ coverage), `TierPlan` (tier number, list of task assignments), and the full `ExecutionPlan` (ordered list of tier plans). Implement a `validateTaskGraph` function that checks: (a) no cycles in the dependency DAG, (b) every task has a valid tier number (1..N), (c) no tier references a dependency in a later tier, (d) file assignments across parallel tasks within a tier do not overlap. This enforces the TLA+ `TierOf` function validity and consensus item 17 (cycle detection).

**Dependencies:** Step 1

**Test (write first):**
Test `validateTaskGraph` with: (1) a valid 2-tier plan with 3 tasks — expect success. (2) A plan where tier 2 has a dependency on a tier 3 task — expect failure with "backward dependency" error. (3) A plan where two tasks in the same tier modify the same file — expect failure with "file overlap" error. (4) A plan with a cyclic dependency — expect failure with "cycle detected" error. (5) A single-task plan — expect success.

**TLA+ Coverage:**
- State: `IDLE` (task initial state), `CONFIRMATION_GATE`
- Invariant: `TierOrderingValid`
- Transition: `UserConfirms` (validates plan before confirmation)
- ASSUME: `\A t \in Tasks : TierOf[t] \in 1..NumTiers`

---

### Step 3: Session state machine

**Files:**
- `.claude/skills/design-pipeline/session-state-machine.ts` (create)

**Description:**
Implement the per-task session state machine as a pure function: `transitionSession(currentState, event) -> { newState, sideEffects }`. Events map to TLA+ transitions: `DISPATCH`, `HANDSHAKE_COMPLETE`, `WRITE_FAILING_TEST`, `TEST_VALIDATION_PASS`, `TEST_VALIDATION_FAIL`, `TEST_VALIDATION_EXHAUSTED`, `MAKE_TEST_PASS`, `CONTINUE_TDD`, `TASK_COMPLETE`, `TDD_CYCLES_EXHAUSTED`, `TDD_CYCLES_EXHAUSTED_NO_WORK`, `LOCAL_REVIEW_PASS`, `LOCAL_REVIEW_NEEDS_FIX`, `LOCAL_REVIEW_EXHAUSTED`, `SESSION_FAIL`, `SESSION_FAIL_CORRUPTION`, `RE_DISPATCH`, `RE_DISPATCH_CORRUPTION`. The function tracks tddCycle, hasFailingTest, validationRetries, crossReviewCount, commitCount, and corruptionFlag as part of session context. Guard conditions enforce all TLA+ bounds.

**Dependencies:** Step 1

**Test (write first):**
Test the happy path: IDLE -> HANDSHAKE -> RED -> TEST_VALIDATION -> GREEN -> REFACTOR_REVIEW -> HANDSHAKE -> RED -> ... -> LOCAL_REVIEW -> SESSION_COMPLETE. Verify commitCount increments with each GREEN phase. Test that GREEN is only reachable when hasFailingTest is TRUE (TDDOrdering). Test TDDCyclesExhausted with tddCycle > 0 goes to LOCAL_REVIEW. Test TDDCyclesExhaustedNoWork with tddCycle = 0 goes to SESSION_FAILED. Test TestValidationFails returns to RED and increments validationRetries. Test TestValidationExhausted goes to SESSION_FAILED. Test LocalReviewNeedsFix bounded by MaxCrossReview. Test SessionFails from each of the 6 active states (HANDSHAKE, RED, GREEN, REFACTOR_REVIEW, TEST_VALIDATION, LOCAL_REVIEW). Test ReDispatchSession inherits tddCycle, hasFailingTest, commitCount. Test ReDispatchSessionCorruption resets all counters. Test that invalid transitions throw.

**TLA+ Coverage:**
- State: `IDLE`, `HANDSHAKE`, `RED`, `TEST_VALIDATION`, `GREEN`, `REFACTOR_REVIEW`, `LOCAL_REVIEW`, `SESSION_COMPLETE`, `SESSION_FAILED`
- Transition: `DispatchSession`, `CompleteHandshake`, `WriteFailingTest`, `TestValidationPasses`, `TestValidationFails`, `TestValidationExhausted`, `MakeTestPass`, `ContinueTDD`, `TaskComplete`, `TDDCyclesExhausted`, `TDDCyclesExhaustedNoWork`, `LocalReviewPasses`, `LocalReviewNeedsFix`, `LocalReviewExhausted`, `SessionFails`, `SessionFailsCorruption`, `ReDispatchSession`, `ReDispatchSessionCorruption`
- Invariant: `TDDOrdering`, `CrossReviewBounded`, `ReDispatchBounded`, `CommitCountMatchesCycles`
- Liveness: `SessionTerminates`

---

### Step 4: Merge state machine

**Files:**
- `.claude/skills/design-pipeline/merge-state-machine.ts` (create)

**Description:**
Implement the per-task merge state machine: `transitionMerge(currentState, event, mergeQueueBusy) -> { newState, mergeQueueBusy, sideEffects }`. Events: `QUEUE`, `BEGIN_MERGE`, `MERGE_SUCCESS`, `POST_MERGE_TEST_PASS`, `POST_MERGE_TEST_FAIL`, `MERGE_CONFLICT`, `MERGE_CONFLICT_RESOLVED`, `MERGE_CONFLICT_ESCALATES`. The `mergeQueueBusy` flag enforces serialization — `BEGIN_MERGE` is only valid when the queue is not busy. Track mergeConflictRetries per task, bounded by MaxMergeConflictRetries. Escalation only fires after retries are exhausted.

**Dependencies:** Step 1

**Test (write first):**
Test happy path: NOT_QUEUED -> QUEUED -> MERGING -> POST_MERGE_TEST -> MERGE_COMPLETE. Verify mergeQueueBusy becomes TRUE on BEGIN_MERGE and FALSE on completion. Test that BEGIN_MERGE rejects when mergeQueueBusy is TRUE (SerializedMergeQueue). Test MERGE_CONFLICT -> MERGE_CONFLICT_RESOLVED -> QUEUED (re-queue). Test MergeConflictEscalates only fires when retries >= MaxMergeConflictRetries. Test PostMergeTestFails goes to MERGE_CONFLICT. Test MergeConflict from MERGING goes to MERGE_CONFLICT and releases queue.

**TLA+ Coverage:**
- State: `NOT_QUEUED`, `QUEUED`, `MERGING`, `POST_MERGE_TEST`, `MERGE_COMPLETE`, `MERGE_CONFLICT`
- Transition: `BeginMerge`, `MergeSucceeds`, `PostMergeTestPasses`, `PostMergeTestFails`, `MergeConflict`, `MergeConflictResolved`, `MergeConflictEscalates`
- Invariant: `SerializedMergeQueue`, `MergeConflictRetriesBounded`, `NoMergeDuringExecution`
- Liveness: `MergeQueueProgress`

---

### Step 5: Pipeline state machine (orchestrator core)

**Files:**
- `.claude/skills/design-pipeline/pipeline-state-machine.ts` (create)

**Description:**
Implement the top-level pipeline state machine that composes session and merge state machines. `transitionPipeline(state, event) -> { newState, sideEffects }`. The pipeline state includes: pipelineState, currentTier, all per-task session states, all per-task merge states, globalFixCount, mergeQueueBusy, confirmed, haltReason, terminalArtifact. Events: `USER_CONFIRMS`, `BEGIN_TIER_MERGING`, `TIER_ALL_FAILED`, `BEGIN_INTER_TIER_VERIFICATION`, `VERIFICATION_PASSES`, `VERIFICATION_FAILS`, `GLOBAL_REVIEW_PASSES`, `GLOBAL_REVIEW_FAILS`, `GLOBAL_REVIEW_EXHAUSTED`, `FIX_SESSION_COMPLETE`, plus all session and merge events scoped to a task. Implements helper predicates: `AllSessionsComplete`, `AllMergesComplete`, `ActiveSessionCount`, `AnySessionSucceeded`, `AllSessionsFailed`. ConcurrencyBounded enforced via ActiveSessionCount < MaxConcurrent guard on dispatch.

**Dependencies:** Steps 1, 2, 3, 4

**Test (write first):**
Test full pipeline lifecycle: CONFIRMATION_GATE -> (UserConfirms) -> TIER_EXECUTING -> (dispatch + TDD sessions) -> (BeginTierMerging) -> TIER_MERGING -> (merge all) -> INTER_TIER_VERIFICATION -> (VerificationPasses) -> TIER_EXECUTING (tier 2) -> ... -> GLOBAL_REVIEW -> (GlobalReviewPasses) -> COMPLETE. Verify confirmed = TRUE and terminalArtifact = TRUE at COMPLETE. Test TierAllFailed when all sessions fail — haltReason = TIER_ALL_FAILED. Test VerificationFails — haltReason = VERIFICATION_FAILED. Test GlobalReviewFails -> FIX_SESSION -> GlobalReviewPasses. Test GlobalReviewExhausted — haltReason = GLOBAL_REVIEW_EXHAUSTED. Test ConcurrencyBounded — dispatch rejects when at MaxConcurrent active sessions. Test CompletionRequiresConfirmation — cannot reach COMPLETE without UserConfirms. Test BeginTierMerging queues all SESSION_COMPLETE tasks for merge. Test that pipeline rejects session events for tasks not in currentTier.

**TLA+ Coverage:**
- State: All pipeline states (`CONFIRMATION_GATE` through `HALTED`), `COMPLETE`, `HALTED` + halt reasons
- Transition: `UserConfirms`, `BeginTierMerging`, `TierAllFailed`, `BeginInterTierVerification`, `VerificationPasses`, `VerificationFails`, `GlobalReviewPasses`, `GlobalReviewFails`, `GlobalReviewExhausted`, `FixSessionComplete`
- Invariant: `CompletionRequiresConfirmation`, `ConcurrencyBounded`, `GlobalFixBounded`, `TierOrderingValid`, `NoMergeDuringExecution`, `TerminalArtifactOnlyOnComplete`, `HaltReasonConsistent`
- Liveness: `TierTerminates`, `PipelineTerminates`

---

### Step 6: Vitest-writer agent definition

**Files:**
- `.claude/skills/vitest-writer/AGENT.md` (create)

**Description:**
Create the AGENT.md for the vitest-writer agent. This agent is the test-side half of a pair programming session. It writes Vitest test files (.test.ts) following TDD discipline: writes a failing test, validates it compiles and fails for a behavioral reason (not syntax), proposes the next increment to the code writer via handshake, and reviews the code writer's implementation after each GREEN phase. It receives: task assignment with files to create/modify, TLA+ states/transitions to cover, accumulated pipeline context, and (on re-dispatch) prior passing commits + failing test. It follows the project's test conventions (Vitest, alongside test files, lodash for utilities, BDD for UI).

**Dependencies:** None

**Test (write first):**
No runtime test — this is a markdown agent definition. Validate by reading the file and confirming it contains: (1) role description, (2) when-to-dispatch trigger, (3) expected inputs section, (4) ping-pong protocol section referencing RED/TEST_VALIDATION/REFACTOR_REVIEW states, (5) test quality gate criteria (compiles, fails for behavioral reason, non-trivial inputs), (6) handshake protocol (propose next increment), (7) local review checklist, (8) re-dispatch context inheritance, (9) handoff section.

**TLA+ Coverage:**
- State: `RED`, `TEST_VALIDATION`
- Transition: `WriteFailingTest`, `TestValidationPasses`, `TestValidationFails`

---

### Step 7: Playwright-writer agent definition

**Files:**
- `.claude/skills/playwright-writer/AGENT.md` (create)

**Description:**
Create the AGENT.md for the playwright-writer agent. Same role as vitest-writer but for E2E/browser tests using Playwright (.spec.ts files). Emphasizes: isolated browser state per worktree, no shared browser state across parallel sessions, user-perspective BDD assertions (given/when/then), and the same ping-pong protocol. Receives the same inputs as vitest-writer.

**Dependencies:** None

**Test (write first):**
No runtime test — markdown agent definition. Validate contains: (1) role, (2) trigger, (3) inputs, (4) ping-pong protocol, (5) test quality gate, (6) browser isolation requirement, (7) BDD assertion style, (8) handshake protocol, (9) local review checklist, (10) re-dispatch context inheritance.

**TLA+ Coverage:**
- State: `RED`, `TEST_VALIDATION`
- Transition: `WriteFailingTest`, `TestValidationPasses`, `TestValidationFails`

---

### Step 8: Typescript-writer agent definition

**Files:**
- `.claude/skills/typescript-writer/AGENT.md` (create)

**Description:**
Create the AGENT.md for the typescript-writer agent. This is a code-side agent for general TypeScript domain logic, utilities, and types. It receives a failing test from the test writer, writes the minimum implementation to make it pass, then proposes refactoring. It follows project conventions: lodash for array/object operations, DDD for domain logic, state machine mindset, no repeated string literals. On re-dispatch, it receives accumulated passing commits and the failing test.

**Dependencies:** None

**Test (write first):**
No runtime test — markdown agent definition. Validate contains: (1) role, (2) trigger, (3) inputs including failing test, (4) GREEN phase protocol (minimum implementation), (5) REFACTOR_REVIEW protocol, (6) project conventions (lodash, DDD, state machine), (7) commit-per-cycle requirement, (8) local review checklist, (9) re-dispatch context inheritance.

**TLA+ Coverage:**
- State: `GREEN`, `REFACTOR_REVIEW`
- Transition: `MakeTestPass`, `ContinueTDD`, `TaskComplete`

---

### Step 9: Hono-writer agent definition

**Files:**
- `.claude/skills/hono-writer/AGENT.md` (create)

**Description:**
Create the AGENT.md for the hono-writer agent. Code-side agent for Hono route handlers, middleware, and server-side code. Same protocol as typescript-writer but specialized for HTTP route patterns, middleware composition, and Hono-specific APIs. Follows thin-handler principle from DDD (handlers delegate to domain functions).

**Dependencies:** None

**Test (write first):**
No runtime test — markdown agent definition. Validate contains same structure as typescript-writer plus Hono-specific guidance (thin handlers, middleware, route patterns).

**TLA+ Coverage:**
- State: `GREEN`, `REFACTOR_REVIEW`
- Transition: `MakeTestPass`, `ContinueTDD`, `TaskComplete`

---

### Step 10: UI-writer agent definition

**Files:**
- `.claude/skills/ui-writer/AGENT.md` (create)

**Description:**
Create the AGENT.md for the ui-writer agent. Code-side agent for JSX components (.tsx files), both server-rendered and client-rendered. Follows Atomic Design methodology (atoms, molecules, organisms). Uses BDD test assertions from the user's perspective. Paired with either vitest-writer (component tests) or playwright-writer (E2E browser tests).

**Dependencies:** None

**Test (write first):**
No runtime test — markdown agent definition. Validate contains same structure as typescript-writer plus UI-specific guidance (Atomic Design, component hierarchy, BDD assertions, JSX patterns).

**TLA+ Coverage:**
- State: `GREEN`, `REFACTOR_REVIEW`
- Transition: `MakeTestPass`, `ContinueTDD`, `TaskComplete`

---

### Step 11: Update implementation-writer agent with task grouping output

**Files:**
- `.claude/skills/implementation-writer/AGENT.md` (modify)

**Description:**
Extend the implementation-writer's output format to include: (a) task grouping into parallelizable tiers with blocker dependencies, (b) agent pair assignment per task (1 code writer + 1 test writer from the 3x2 matrix), (c) one-sentence rationale per pairing, (d) a Task Assignment Table at the end of the plan. This makes the Stage 5 output directly consumable by the Stage 6 orchestrator. The existing step format is preserved; the additions are a new "Execution Tiers" section and a "Task Assignment Table" section appended after the coverage audit.

**Dependencies:** None

**Test (write first):**
No runtime test — markdown modification. Validate the AGENT.md contains: (1) updated output format section with Execution Tiers, (2) Task Assignment Table template with columns: task ID, title, tier, agent pair, dependencies, rationale, (3) agent pair selection guidance (code writers: typescript-writer, hono-writer, ui-writer; test writers: vitest-writer, playwright-writer), (4) pairing rules (always 1 code + 1 test writer).

**TLA+ Coverage:**
- State: `CONFIRMATION_GATE` (plan is what the user confirms)
- Transition: `UserConfirms` (plan must be complete before confirmation)

---

### Step 12: Update design-pipeline SKILL.md with Stage 6

**Files:**
- `.claude/skills/design-pipeline/SKILL.md` (modify)

**Description:**
Add Stage 6 (Pair Programming) to the design pipeline orchestrator definition. This includes: (a) adding Stage 6 to the pipeline stages diagram, (b) adding new state machine states for Stage 6 (STAGE_6_CONFIRMATION_GATE, STAGE_6_TIER_EXECUTING, STAGE_6_TIER_MERGING, STAGE_6_INTER_TIER_VERIFICATION, STAGE_6_GLOBAL_REVIEW, STAGE_6_FIX_SESSION, STAGE_6_COMPLETE, STAGE_6_HALTED), (c) documenting the confirmation gate between Stage 5 and Stage 6, (d) describing worktree creation and cleanup, (e) documenting the serialized merge queue, (f) documenting the commit-per-TDD-cycle and no-squash merge strategy, (g) documenting tier execution (parallel dispatch, inter-tier verification), (h) documenting error handling (re-dispatch with context inheritance, corruption flag, bounded retries, halt reasons), (i) documenting global review and fix session loop with hard cap of 3, (j) documenting terminal artifact (commit on named branch), (k) documenting Windows parallelism cap of 3 concurrent worktrees.

**Dependencies:** Steps 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11

**Test (write first):**
No runtime test — markdown modification. Validate the SKILL.md contains: (1) Stage 6 in pipeline diagram, (2) all 8 pipeline sub-states for Stage 6, (3) confirmation gate documentation, (4) worktree management, (5) merge queue serialization, (6) commit strategy (per-cycle, no-squash, --no-ff), (7) tier execution, (8) error handling with re-dispatch semantics, (9) global review loop with cap, (10) terminal artifact, (11) Windows cap of 3.

**TLA+ Coverage:**
- State: All pipeline states, all session states, all merge states, all halt reasons
- Transition: All transitions
- Invariant: All 14 invariants
- Liveness: All 4 liveness properties

---

## State Coverage Audit

### States

| State | Covered By |
|-------|-----------|
| `CONFIRMATION_GATE` | Steps 2, 5, 11, 12 |
| `TIER_EXECUTING` | Steps 5, 12 |
| `TIER_MERGING` | Steps 4, 5, 12 |
| `INTER_TIER_VERIFICATION` | Steps 5, 12 |
| `GLOBAL_REVIEW` | Steps 5, 12 |
| `FIX_SESSION` | Steps 5, 12 |
| `COMPLETE` | Steps 5, 12 |
| `HALTED` | Steps 5, 12 |
| `IDLE` | Steps 2, 3, 5 |
| `HANDSHAKE` | Steps 3, 5, 12 |
| `RED` | Steps 3, 6, 7, 12 |
| `TEST_VALIDATION` | Steps 3, 6, 7, 12 |
| `GREEN` | Steps 3, 8, 9, 10, 12 |
| `REFACTOR_REVIEW` | Steps 3, 8, 9, 10, 12 |
| `LOCAL_REVIEW` | Steps 3, 5, 12 |
| `SESSION_COMPLETE` | Steps 3, 5, 12 |
| `SESSION_FAILED` | Steps 3, 5, 12 |
| `NOT_QUEUED` | Steps 4, 5, 12 |
| `QUEUED` | Steps 4, 5, 12 |
| `MERGING` | Steps 4, 5, 12 |
| `POST_MERGE_TEST` | Steps 4, 5, 12 |
| `MERGE_COMPLETE` | Steps 4, 5, 12 |
| `MERGE_CONFLICT` | Steps 4, 5, 12 |
| `NONE` (halt reason) | Steps 1, 5, 12 |
| `TIER_ALL_FAILED` | Steps 5, 12 |
| `VERIFICATION_FAILED` | Steps 5, 12 |
| `GLOBAL_REVIEW_EXHAUSTED` | Steps 5, 12 |
| `MERGE_CONFLICT_UNRESOLVABLE` | Steps 4, 5, 12 |

### Transitions

| Transition | Covered By |
|-----------|-----------|
| `UserConfirms` | Steps 2, 5, 11, 12 |
| `BeginTierMerging` | Steps 5, 12 |
| `TierAllFailed` | Steps 5, 12 |
| `BeginInterTierVerification` | Steps 5, 12 |
| `VerificationPasses` | Steps 5, 12 |
| `VerificationFails` | Steps 5, 12 |
| `GlobalReviewPasses` | Steps 5, 12 |
| `GlobalReviewFails` | Steps 5, 12 |
| `GlobalReviewExhausted` | Steps 5, 12 |
| `FixSessionComplete` | Steps 5, 12 |
| `DispatchSession` | Steps 3, 5, 12 |
| `CompleteHandshake` | Steps 3, 12 |
| `WriteFailingTest` | Steps 3, 6, 7, 12 |
| `TDDCyclesExhausted` | Steps 3, 12 |
| `TDDCyclesExhaustedNoWork` | Steps 3, 12 |
| `TestValidationPasses` | Steps 3, 6, 7, 12 |
| `TestValidationFails` | Steps 3, 6, 7, 12 |
| `TestValidationExhausted` | Steps 3, 12 |
| `MakeTestPass` | Steps 3, 8, 9, 10, 12 |
| `ContinueTDD` | Steps 3, 8, 9, 10, 12 |
| `TaskComplete` | Steps 3, 8, 9, 10, 12 |
| `LocalReviewPasses` | Steps 3, 12 |
| `LocalReviewNeedsFix` | Steps 3, 12 |
| `LocalReviewExhausted` | Steps 3, 12 |
| `SessionFails` | Steps 3, 12 |
| `SessionFailsCorruption` | Steps 3, 12 |
| `ReDispatchSession` | Steps 3, 12 |
| `ReDispatchSessionCorruption` | Steps 3, 12 |
| `BeginMerge` | Steps 4, 12 |
| `MergeSucceeds` | Steps 4, 12 |
| `PostMergeTestPasses` | Steps 4, 12 |
| `PostMergeTestFails` | Steps 4, 12 |
| `MergeConflict` | Steps 4, 12 |
| `MergeConflictResolved` | Steps 4, 12 |
| `MergeConflictEscalates` | Steps 4, 12 |

### Safety Invariants

| Invariant | Verified By |
|-----------|------------|
| `TypeOK` | Step 1 (type system) |
| `SerializedMergeQueue` | Step 4 |
| `TDDOrdering` | Step 3 |
| `GlobalFixBounded` | Step 5 |
| `CrossReviewBounded` | Step 3 |
| `TierOrderingValid` | Steps 2, 5 |
| `ConcurrencyBounded` | Step 5 |
| `CompletionRequiresConfirmation` | Step 5 |
| `NoMergeDuringExecution` | Steps 4, 5 |
| `ReDispatchBounded` | Step 3 |
| `CommitCountMatchesCycles` | Step 3 |
| `MergeConflictRetriesBounded` | Step 4 |
| `TerminalArtifactOnlyOnComplete` | Step 5 |
| `HaltReasonConsistent` | Step 5 |

### Liveness Properties

| Property | Verified By |
|----------|------------|
| `SessionTerminates` | Step 3 (bounded loops guarantee termination) |
| `TierTerminates` | Step 5 (all sessions terminate + all merges terminate) |
| `PipelineTerminates` | Step 5 (all tiers terminate + global review bounded) |
| `MergeQueueProgress` | Step 4 (bounded conflict retries guarantee progress) |

All TLA+ states, transitions, and properties are covered by the implementation plan.

---

## Execution Tiers

### Tier 1: Foundation Types and Agent Definitions (no dependencies, fully parallel)

Tasks in this tier have zero dependencies on each other. All agent definitions are standalone markdown files. The types module is the only runtime code, but it has no dependencies.

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Pipeline state types and constants |
| T6 | Step 6 | Vitest-writer agent definition |
| T7 | Step 7 | Playwright-writer agent definition |
| T8 | Step 8 | Typescript-writer agent definition |
| T9 | Step 9 | Hono-writer agent definition |
| T10 | Step 10 | UI-writer agent definition |
| T11 | Step 11 | Update implementation-writer output format |

### Tier 2: State Machines (depends on Tier 1 — needs types from T1)

Session and merge state machines import types from Step 1. Task graph validation also imports types. These three are independent of each other.

| Task ID | Step | Title |
|---------|------|-------|
| T2 | Step 2 | Task graph types and tier validation |
| T3 | Step 3 | Session state machine |
| T4 | Step 4 | Merge state machine |

### Tier 3: Pipeline Orchestrator (depends on Tier 2 — composes state machines)

The pipeline state machine composes session and merge state machines, so it requires T2, T3, and T4 to be complete and merged.

| Task ID | Step | Title |
|---------|------|-------|
| T5 | Step 5 | Pipeline state machine (orchestrator core) |

### Tier 4: Pipeline Integration (depends on Tier 3 — needs full orchestrator)

The SKILL.md update documents the full Stage 6 behavior, which requires the orchestrator to be implemented so the documentation is accurate.

| Task ID | Step | Title |
|---------|------|-------|
| T12 | Step 12 | Update design-pipeline SKILL.md with Stage 6 |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Pipeline state types and constants | 1 | typescript-writer | vitest-writer | None | Pure TypeScript types and constants — domain logic with unit tests. |
| T6 | Vitest-writer agent definition | 1 | typescript-writer | vitest-writer | None | Markdown agent file — typescript-writer handles general .md/.ts files; vitest-writer validates the content structure. |
| T7 | Playwright-writer agent definition | 1 | typescript-writer | vitest-writer | None | Markdown agent file — same rationale as T6; no browser involvement despite the agent's purpose. |
| T8 | Typescript-writer agent definition | 1 | typescript-writer | vitest-writer | None | Markdown agent file — general TypeScript file creation with structural validation. |
| T9 | Hono-writer agent definition | 1 | typescript-writer | vitest-writer | None | Markdown agent file — no Hono runtime code, just an agent definition document. |
| T10 | UI-writer agent definition | 1 | typescript-writer | vitest-writer | None | Markdown agent file — no JSX involved, just an agent definition document. |
| T11 | Update implementation-writer output format | 1 | typescript-writer | vitest-writer | None | Markdown modification — extends existing AGENT.md with new output sections. |
| T2 | Task graph types and tier validation | 2 | typescript-writer | vitest-writer | T1 | Pure function validation logic with exhaustive unit test scenarios. |
| T3 | Session state machine | 2 | typescript-writer | vitest-writer | T1 | State machine as pure functions — vitest is ideal for exhaustive transition testing. |
| T4 | Merge state machine | 2 | typescript-writer | vitest-writer | T1 | State machine as pure functions — same rationale as T3. |
| T5 | Pipeline state machine | 3 | typescript-writer | vitest-writer | T2, T3, T4 | Composes the sub-state-machines — integration-level unit tests with vitest. |
| T12 | Update design-pipeline SKILL.md | 4 | typescript-writer | vitest-writer | T5 | Documentation update — typescript-writer modifies existing markdown; vitest-writer validates structural completeness. |
