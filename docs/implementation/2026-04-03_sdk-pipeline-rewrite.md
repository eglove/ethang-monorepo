# Implementation Plan: SDK Pipeline Rewrite

## Source Artifacts

| Artifact | Path |
|----------|------|
| Briefing | `docs/questioner-sessions/2026-04-03_sdk-pipeline-rewrite.md` |
| Design Consensus | `docs/debate-moderator-sessions/2026-04-03_sdk-pipeline-rewrite.md` |
| TLA+ Specification | `docs/tla-specs/sdk-pipeline-rewrite/SdkPipeline.tla` |
| TLA+ Review Consensus | `docs/debate-moderator-sessions/2026-04-03_tla-review-sdk-pipeline.md` |

## TLA+ State Coverage Matrix

### States

**Run-level (RunStates):**
- `idle`
- `running`
- `completed`
- `failed`
- `compensating`

**Stage-level (StageStates):**
- `pending`
- `streaming_input`
- `executing`
- `validating`
- `validation_failed`
- `retrying`
- `git_operating`
- `pair_routing`
- `completed`
- `failed`
- `compensating`
- `compensated`

**Error kinds (ErrorKinds):**
- `none`
- `claude_api_timeout`
- `claude_api_rate_limit`
- `zod_validation`
- `git_failure`
- `user_abandon`
- `retry_exhausted`

**TLA+ Review Gap States (not in spec, required by implementation):**
- `compensation_failed` (Gap 2)
- `stream_limit_exceeded` error kind (Gap 3)
- `git_retrying` (Gap 1 -- git retry path)
- `git_retry_exhausted` error kind (Gap 1)
- `pair_routing_api_failed` (Gap 7)

### Transitions

1. `StartRun(r)` -- idle -> running, stage 1 enters streaming_input
2. `StreamInput(r)` -- increment streaming turn counter
3. `CompleteStreaming(r)` -- streaming_input -> executing
4. `AbandonStreaming(r)` -- streaming_input -> failed (user_abandon)
5. `BeginNonStreamingStage(r)` -- pending -> executing (or pair_routing for stage 6)
6. `CompletePairRouting(r)` -- pair_routing -> executing
7. `FinishExecution(r)` -- executing -> validating
8. `ValidationPass(r)` -- validating -> git_operating (git stages) or completed
9. `ValidationFail(r)` -- validating -> validation_failed (zod_validation)
10. `RetryAfterValidationFail(r)` -- validation_failed -> retrying (under cap)
11. `RetryToExecuting(r)` -- retrying -> executing
12. `RetryExhausted(r)` -- validation_failed -> failed (retry_exhausted, at cap)
13. `ClaudeApiFail(r)` -- executing -> retrying (under cap, timeout/rate_limit)
14. `ClaudeApiFailExhausted(r)` -- executing -> failed (retry_exhausted, at cap)
15. `AcquireGit(r)` -- acquire gitOwner lock (mutual exclusion)
16. `GitSuccess(r)` -- git_operating -> completed, release lock
17. `GitFail(r)` -- git_operating -> failed (git_failure), release lock
18. `AdvanceStage(r)` -- completed stage -> next stage (streaming_input or pending)
19. `CompleteRun(r)` -- stage 7 completed -> run completed
20. `BeginCompensation(r)` -- stage failed + checkpoint > 0 -> run compensating
21. `FailRunNoCheckpoint(r)` -- stage failed + checkpoint = 0 -> run failed
22. `CompleteCompensation(r)` -- compensating -> compensated, run failed
23. `Terminated` -- stutter step when all runs terminated

**TLA+ Review Gap Transitions (required by implementation):**
- `GitRetry(r)` (Gap 1) -- git_operating failed -> retrying git
- `GitRetryExhausted(r)` (Gap 1) -- git retry cap hit -> failed
- `StreamLimitReached(r)` (Gap 3) -- MaxStreamTurns hit -> failed with stream_limit_exceeded
- `FailCompensation(r)` (Gap 2) -- compensation itself fails -> compensation_failed
- `PairRoutingApiFail(r)` (Gap 7) -- Claude API fails during pair_routing

### Safety Invariants

1. `TypeOK` -- all variables within declared domains
2. `StageOrder` -- stages execute sequentially, prior stages completed/compensated
3. `RetryBound` -- retry count never exceeds MaxRetries
4. `GitMutualExclusion` -- at most one run holds the git adapter
5. `CompletedRunIntegrity` -- completed run has all 7 stages completed with artifacts
6. `CheckpointValidity` -- checkpoint never exceeds current stage
7. `FailedStageHasError` -- failed stage must have non-none error tag
8. `StreamingStageConstraint` -- only streaming stages can be in streaming_input
9. `PairRoutingConstraint` -- only pair stage can be in pair_routing
10. `CompensationRequiresCheckpoint` -- compensation only when prior checkpoint exists

### Liveness Properties

1. `RunTermination` -- every started run eventually completes or fails
2. `CompensationTermination` -- every compensating run eventually reaches failed
3. `RetryProgress` -- retrying stage eventually re-executes or fails

---

## Implementation Steps

### Step 1: Named Stage Constants and Configuration Types

**Files:**
- `packages/design-pipeline/src/constants.ts` (create)
- `packages/design-pipeline/src/types/config.ts` (create)

**Description:**
Define the 7 named stage constants (Questioner, DebateModerator, TlaWriter, ExpertReview, ImplementationPlanning, PairProgramming, ForkJoin) as a const enum or literal union, replacing magic numbers 1-7 from the TLA+ spec. Define stage category sets (StreamingStages, GitStages, PairStage) using these named constants. Define the pipeline configuration type with maxRetries, maxStreamTurns, and retry backoff settings. This addresses TLA+ Review Gap 4 (named constants instead of magic numbers).

**Dependencies:** None

**Test (write first):**
Write tests that verify: (a) all 7 stage constants are defined and unique, (b) StreamingStages contains exactly Questioner and ImplementationPlanning, (c) GitStages contains exactly PairProgramming and ForkJoin, (d) PairStage equals PairProgramming, (e) the config type enforces maxRetries >= 1, maxStreamTurns >= 1 via Zod parsing, (f) default config values are sensible. Use Zod parse with invalid values to test constraint violations.

**TLA+ Coverage:**
- State: `Stages = 1..7` (as named constants)
- State: `StreamingStages == {1, 5}`, `PairStage == 6`, `GitStages == {6, 7}` (as named sets)
- Constants: `MaxRetries`, `MaxStreamTurns`, `MaxRuns`
- Gap 4: Named stage constants instead of magic numbers

---

### Step 2: Error Discriminated Union and Error Kinds

**Files:**
- `packages/design-pipeline/src/types/errors.ts` (create)

**Description:**
Define the discriminated union error type with all 7 TLA+ error kinds plus 2 gap additions: `stream_limit_exceeded` (Gap 3) and `git_retry_exhausted` (Gap 1). Each error variant carries contextual data (stage, retry count, original error message). Define a `PipelineError` branded type with a `kind` discriminant field. Include a `compensation_failed` error kind for Gap 2.

**Dependencies:** Step 1

**Test (write first):**
Write tests that: (a) verify each of the 10 error kinds can be constructed, (b) verify the discriminant field narrows correctly in switch/case, (c) verify error construction requires the correct contextual fields per kind, (d) verify `none` is not a valid error kind for PipelineError construction (it is only a sentinel in stage state). Inputs: each error kind with valid/invalid context. Expected: type-safe construction and exhaustive switch.

**TLA+ Coverage:**
- State: `ErrorKinds == {"none", "claude_api_timeout", "claude_api_rate_limit", "zod_validation", "git_failure", "user_abandon", "retry_exhausted"}`
- Gap 1: `git_retry_exhausted` error kind
- Gap 3: `stream_limit_exceeded` error kind
- Gap 2: `compensation_failed` error kind

---

### Step 3: Stage State Machine Types

**Files:**
- `packages/design-pipeline/src/types/stage.ts` (create)

**Description:**
Define the StageState union type with all 12 TLA+ states plus `compensation_failed` (Gap 2). Define the StageRecord type matching the TLA+ EmptyStageRecord: status, retries, error, turns, artifact (typed per stage rather than boolean -- addressing expert-ddd's feedback on stage-specific artifact types). Define typed artifact types: BriefingResult, DebateSynthesis, TlaResult, TlaReviewSynthesis, ImplementationPlan, PairSessionResult, ForkJoinResult. Define the RunState union type with all 5 states.

**Dependencies:** Steps 1, 2

**Test (write first):**
Write tests that: (a) verify all 13 stage states (12 TLA+ + compensation_failed) are in the union, (b) verify StageRecord can be initialized to the empty state (pending, 0 retries, none error, 0 turns, no artifact), (c) verify each artifact type has the correct shape via Zod parsing, (d) verify RunState union contains exactly idle/running/completed/failed/compensating, (e) verify stage record status transitions are typed (not arbitrary string assignment). Inputs: valid and invalid stage record constructions.

**TLA+ Coverage:**
- State: all 12 `StageStates` members
- State: all 5 `RunStates` members
- State: `EmptyStageRecord` structure
- Gap 2: `compensation_failed` state

---

### Step 4: Run Record -- Instance-Scoped Pipeline State

**Files:**
- `packages/design-pipeline/src/types/run.ts` (create)

**Description:**
Define the RunRecord type matching TLA+ InitRunRecord: state (RunState), currentStage (named stage constant), stages (record mapping stage name to StageRecord), checkpoint (named stage or 0). This is the core instance-scoped state object -- each pipeline run owns exactly one. The run record is passed as an explicit parameter to all stage coordinators. No global mutable state.

**Dependencies:** Steps 1, 2, 3

**Test (write first):**
Write tests that: (a) a new RunRecord initializes with state="idle", currentStage=0, all stages pending, checkpoint=0, (b) two RunRecords are independent objects (mutating one does not affect the other -- instance isolation), (c) the Zod schema validates the full RunRecord structure, (d) currentStage and checkpoint can only be valid named stage values or 0. Inputs: construct two run records, mutate one, verify the other is unchanged.

**TLA+ Coverage:**
- State: `InitRunRecord` structure
- Transition: `StartRun` precondition (state = "idle")
- Invariant: `TypeOK` (variable domains)
- Invariant: `InstanceIsolation` (S1 -- distinct runs never alias state)

---

### Step 5: Zod Schemas for Stage Boundary Validation

**Files:**
- `packages/design-pipeline/src/schemas/index.ts` (create)
- `packages/design-pipeline/src/schemas/briefing.ts` (create)
- `packages/design-pipeline/src/schemas/debate-synthesis.ts` (create)
- `packages/design-pipeline/src/schemas/tla-result.ts` (create)
- `packages/design-pipeline/src/schemas/tla-review.ts` (create)
- `packages/design-pipeline/src/schemas/implementation-plan.ts` (create)
- `packages/design-pipeline/src/schemas/pair-session.ts` (create)
- `packages/design-pipeline/src/schemas/fork-join.ts` (create)

**Description:**
Define Zod schemas for each stage's structured output. Each schema includes the domain-specific fields plus git metadata fields (branchName, commitMessage) for stages that perform git operations (stages 6 and 7). These schemas are the Zod validation boundary from the TLA+ spec -- every stage output passes through its schema before being accepted. Invalid output triggers the ValidationFail path.

**Dependencies:** Steps 1, 3

**Test (write first):**
Write tests for each schema that: (a) accept a valid complete output object, (b) reject an object missing required fields, (c) reject an object with wrong field types, (d) verify git metadata fields are present on pair-session and fork-join schemas but absent on others, (e) verify the schema error messages are descriptive enough for retry feedback. Inputs: valid objects, objects with missing fields, objects with wrong types, boundary-length strings.

**TLA+ Coverage:**
- Transition: `ValidationPass` (Zod parse succeeds)
- Transition: `ValidationFail` (Zod parse fails -> zod_validation error)
- Invariant: `TypeOK` (artifact typing)

---

### Step 6: Git Port/Adapter Interface

**Files:**
- `packages/design-pipeline/src/ports/git-adapter.ts` (create)

**Description:**
Define the GitAdapter interface (port) with methods: createBranch, commit, push, checkout, getCurrentBranch, acquireLock, releaseLock. The lock methods model the TLA+ gitOwner mutual exclusion. Include retry configuration on the interface. This is the seam for test doubles -- production implementation uses execFileNoThrow, tests use a mock. Addresses design consensus Fix 4 and TLA+ Review Gap 5 (atomic lock acquisition -- acquireLock atomically transitions status and acquires ownership).

**Dependencies:** Steps 1, 2

**Test (write first):**
Write tests using a mock GitAdapter that: (a) verify acquireLock returns true when no lock held, (b) verify acquireLock returns false when another run holds the lock, (c) verify releaseLock releases the lock, (d) verify lock is released on git failure (not leaked), (e) verify methods have correct signatures. Create a TestGitAdapter class implementing the interface for use in later steps. Inputs: sequential lock/unlock calls, concurrent lock attempts.

**TLA+ Coverage:**
- Transition: `AcquireGit` (lock acquisition)
- Transition: `GitSuccess` (release lock on success)
- Transition: `GitFail` (release lock on failure)
- Invariant: `GitMutualExclusion` (at most one holder)
- Gap 5: Atomic lock acquisition (no two-step TOCTOU)
- Gap 1: Git retry support on the interface

---

### Step 7: Claude API Port/Adapter Interface

**Files:**
- `packages/design-pipeline/src/ports/claude-adapter.ts` (create)

**Description:**
Define the ClaudeAdapter interface (port) with methods: executePrompt (returns structured output or error), streamPrompt (for streaming input stages), routePairMessage (for synchronous pair programming routing). All methods return a discriminated union Result type (success with typed data or error with ErrorKind). This is the test-double seam for all Claude API calls.

**Dependencies:** Steps 1, 2

**Test (write first):**
Write tests using a mock ClaudeAdapter that: (a) executePrompt returns a success result with typed data, (b) executePrompt returns a claude_api_timeout error, (c) executePrompt returns a claude_api_rate_limit error, (d) streamPrompt supports multi-turn streaming, (e) routePairMessage returns a response. Create a TestClaudeAdapter for use in later steps. Inputs: mock responses and error scenarios.

**TLA+ Coverage:**
- Transition: `ClaudeApiFail` (API timeout/rate limit during executing)
- Transition: `ClaudeApiFailExhausted` (retries exhausted)
- Gap 7: Claude API failures during pair_routing state

---

### Step 8: Stage Transition Engine

**Files:**
- `packages/design-pipeline/src/engine/transitions.ts` (create)

**Description:**
Implement the pure state transition functions that take a RunRecord and an action, and return a new RunRecord (immutable updates). Each function corresponds to a TLA+ named action. Functions enforce all preconditions from the spec (e.g., StartRun requires state="idle", StreamInput requires stage in StreamingStages and status="streaming_input"). Invalid transitions return an error result. This is the heart of the state machine -- pure functions with no side effects.

**Dependencies:** Steps 1, 2, 3, 4

**Test (write first):**
Write exhaustive tests for each of the 22 TLA+ transitions plus 5 gap transitions:
- `startRun`: idle -> running, stage 1 streaming_input. Reject if not idle.
- `streamInput`: increment turns. Reject if not streaming stage, not streaming_input, turns at max.
- `completeStreaming`: streaming_input -> executing. Reject if turns < 1.
- `abandonStreaming`: streaming_input -> failed with user_abandon. Run fails.
- `streamLimitReached`: turns = MaxStreamTurns -> failed with stream_limit_exceeded (Gap 3).
- `beginNonStreamingStage`: pending -> executing (or pair_routing). Reject if streaming stage.
- `completePairRouting`: pair_routing -> executing. Reject if not pair stage.
- `finishExecution`: executing -> validating.
- `validationPass`: validating -> git_operating (git stages) or completed.
- `validationFail`: validating -> validation_failed with zod_validation error.
- `retryAfterValidationFail`: validation_failed -> retrying (under cap). Increment retries.
- `retryToExecuting`: retrying -> executing.
- `retryExhausted`: validation_failed -> failed with retry_exhausted (at cap).
- `claudeApiFail`: executing -> retrying (under cap). Set error kind.
- `claudeApiFailExhausted`: executing -> failed with retry_exhausted (at cap).
- `acquireGit`: set gitOwner. Reject if lock held by another.
- `gitSuccess`: git_operating -> completed, release lock, set artifact.
- `gitFail`: git_operating -> failed with git_failure, release lock.
- `gitRetry`: git_operating failed -> retrying (Gap 1).
- `gitRetryExhausted`: git retry cap hit -> failed (Gap 1).
- `advanceStage`: completed -> next stage. Streaming stages get streaming_input, others get pending.
- `completeRun`: stage 7 completed -> run completed.
- `beginCompensation`: stage failed + checkpoint > 0 -> run compensating.
- `failRunNoCheckpoint`: stage failed + checkpoint = 0 -> run failed.
- `completeCompensation`: compensating -> compensated, run failed.
- `failCompensation`: compensation fails -> compensation_failed (Gap 2).
- `pairRoutingApiFail`: pair_routing -> retrying on API failure (Gap 7).

For each: test valid preconditions (happy path), test rejected preconditions (wrong state), verify postconditions match TLA+ spec exactly.

**TLA+ Coverage:**
- Transition: ALL 22 named actions from the spec
- Transition: ALL 5 gap transitions
- Invariant: `StageOrder` (enforced by transition preconditions)
- Invariant: `RetryBound` (enforced by retry cap checks)
- Invariant: `CheckpointValidity` (enforced by advance/complete logic)
- Invariant: `FailedStageHasError` (enforced by all failure transitions setting error)
- Invariant: `StreamingStageConstraint` (enforced by streaming preconditions)
- Invariant: `PairRoutingConstraint` (enforced by pair routing preconditions)
- Invariant: `CompensationRequiresCheckpoint` (enforced by beginCompensation precondition)

---

### Step 9: Retry Coordinator

**Files:**
- `packages/design-pipeline/src/engine/retry.ts` (create)

**Description:**
Implement a unified retry coordinator that handles all retry paths: Claude API transient failures, Zod validation failures, and git operation failures (Gap 1). Uses config-driven retry caps and exponential backoff. Unifies the duplicated retry paths identified in expert-tdd's review (ClaudeApiFail vs RetryAfterValidationFail should share a single parameterized mechanism). The coordinator is a pure function that takes the current stage record, failure kind, and config, and returns the next stage record state (retrying or failed with retry_exhausted).

**Dependencies:** Steps 1, 2, 3, 8

**Test (write first):**
Write tests that: (a) first retry attempt returns retrying state with retries=1, (b) retry at cap returns failed with retry_exhausted, (c) backoff delay increases with each retry, (d) different error kinds (claude_api_timeout, zod_validation, git_failure) all flow through the same mechanism, (e) git failures use the retry path (Gap 1) instead of failing directly, (f) config with maxRetries=0 means no retries allowed. Inputs: stage records at various retry counts, config objects with different caps.

**TLA+ Coverage:**
- Transition: `RetryAfterValidationFail`
- Transition: `RetryExhausted`
- Transition: `ClaudeApiFail`
- Transition: `ClaudeApiFailExhausted`
- Transition: `RetryToExecuting`
- Gap 1: `GitRetry`, `GitRetryExhausted`
- Invariant: `RetryBound` (cap enforcement)
- Gap 6: Fairness for failure paths (documented: failures are not guaranteed to resolve; the system relies on RetryExhausted eventually firing)

---

### Step 10: Questioner Stage Coordinator

**Files:**
- `packages/design-pipeline/src/stages/questioner.ts` (create)
- `packages/design-pipeline/src/prompts/questioner.ts` (create)

**Description:**
Implement the stage-scoped coordinator for Stage 1 (Questioner). Handles streaming input multi-turn conversation, tracks turn count, enforces MaxStreamTurns limit with stream_limit_exceeded error (Gap 3) instead of user_abandon. Calls ClaudeAdapter.streamPrompt for each turn. On completion, transitions to executing, runs the Claude prompt, validates output through the BriefingResult Zod schema. The prompt function is a pure template literal function that generates the system prompt from pipeline context.

**Dependencies:** Steps 1-9

**Test (write first):**
Write tests that: (a) streaming input increments turn counter, (b) completing streaming with >= 1 turn succeeds, (c) completing streaming with 0 turns fails, (d) reaching MaxStreamTurns triggers stream_limit_exceeded (not user_abandon -- Gap 3), (e) user abandon during streaming sets user_abandon error, (f) execution produces a BriefingResult that passes Zod validation, (g) invalid Claude output triggers validation_failed and retry, (h) retry exhaustion transitions to failed. Use TestClaudeAdapter mock. Inputs: mock streaming turns, mock Claude responses (valid and invalid).

**TLA+ Coverage:**
- State: `streaming_input` for stage 1
- Transition: `StartRun` (stage 1 enters streaming_input)
- Transition: `StreamInput`
- Transition: `CompleteStreaming`
- Transition: `AbandonStreaming`
- Transition: `FinishExecution`
- Transition: `ValidationPass` / `ValidationFail`
- Gap 3: `StreamLimitReached` with `stream_limit_exceeded`

---

### Step 11: Debate Moderator Stage Coordinator

**Files:**
- `packages/design-pipeline/src/stages/debate-moderator.ts` (create)
- `packages/design-pipeline/src/prompts/debate-moderator.ts` (create)

**Description:**
Implement the stage-scoped coordinator for Stage 2 (Debate Moderator). Non-streaming stage that enters directly as executing. Thinned to selection + mediation only (per briefing). Receives the BriefingResult from stage 1, runs multi-round expert debate via ClaudeAdapter.executePrompt, validates output through DebateSynthesis Zod schema. The coordinator manages expert selection and round mediation but contains no pipeline awareness.

**Dependencies:** Steps 1-9

**Test (write first):**
Write tests that: (a) stage begins from pending -> executing, (b) Claude execution produces a valid DebateSynthesis, (c) invalid output triggers validation retry, (d) retry exhaustion transitions to failed, (e) Claude API timeout during execution triggers retry, (f) the prompt function generates correct system prompt from BriefingResult input. Use TestClaudeAdapter mock.

**TLA+ Coverage:**
- State: `pending`, `executing`, `validating` for non-streaming stage
- Transition: `BeginNonStreamingStage`
- Transition: `FinishExecution`
- Transition: `ValidationPass` / `ValidationFail`
- Transition: `ClaudeApiFail` / `ClaudeApiFailExhausted`

---

### Step 12: TLA+ Writer Stage Coordinator

**Files:**
- `packages/design-pipeline/src/stages/tla-writer.ts` (create)
- `packages/design-pipeline/src/prompts/tla-writer.ts` (create)

**Description:**
Implement the stage-scoped coordinator for Stage 3 (TLA+ Writer). Non-streaming stage. Receives DebateSynthesis, generates TLA+ specification via Claude, validates output through TlaResult Zod schema. Output includes the .tla file content, .cfg file content, and TLC verification results.

**Dependencies:** Steps 1-9

**Test (write first):**
Write tests that: (a) stage begins from pending -> executing, (b) valid TlaResult passes validation, (c) invalid output triggers retry path, (d) API failures trigger retry, (e) prompt incorporates DebateSynthesis content correctly. Use TestClaudeAdapter mock.

**TLA+ Coverage:**
- State: `pending`, `executing`, `validating` for non-streaming stage
- Transition: `BeginNonStreamingStage`, `FinishExecution`, `ValidationPass`, `ValidationFail`

---

### Step 13: Expert Review Stage Coordinator

**Files:**
- `packages/design-pipeline/src/stages/expert-review.ts` (create)
- `packages/design-pipeline/src/prompts/expert-review.ts` (create)

**Description:**
Implement the stage-scoped coordinator for Stage 4 (Expert Review). Non-streaming stage. Receives TlaResult, runs expert review debate via Claude, validates output through TlaReviewSynthesis Zod schema.

**Dependencies:** Steps 1-9

**Test (write first):**
Write tests that: (a) stage begins from pending -> executing, (b) valid TlaReviewSynthesis passes validation, (c) invalid output triggers retry, (d) API failures trigger retry, (e) prompt incorporates TlaResult correctly. Use TestClaudeAdapter mock.

**TLA+ Coverage:**
- State: `pending`, `executing`, `validating` for non-streaming stage
- Transition: `BeginNonStreamingStage`, `FinishExecution`, `ValidationPass`, `ValidationFail`

---

### Step 14: Implementation Planning Stage Coordinator

**Files:**
- `packages/design-pipeline/src/stages/implementation-planning.ts` (create)
- `packages/design-pipeline/src/prompts/implementation-planning.ts` (create)

**Description:**
Implement the stage-scoped coordinator for Stage 5 (Implementation Planning). This is a streaming stage (confirmation gate). Receives all prior stage artifacts, generates implementation plan via Claude, validates output through ImplementationPlan Zod schema. Streaming input allows user to confirm or request changes to the plan.

**Dependencies:** Steps 1-9

**Test (write first):**
Write tests that: (a) stage begins in streaming_input, (b) streaming confirmation works with >= 1 turn, (c) MaxStreamTurns triggers stream_limit_exceeded (Gap 3), (d) valid ImplementationPlan passes validation, (e) invalid output triggers retry, (f) prompt incorporates all prior artifacts. Use TestClaudeAdapter mock.

**TLA+ Coverage:**
- State: `streaming_input` for stage 5
- Transition: `StreamInput`, `CompleteStreaming`, `AbandonStreaming`
- Gap 3: `StreamLimitReached` for confirmation gate

---

### Step 15: Pair Programming Stage Coordinator

**Files:**
- `packages/design-pipeline/src/stages/pair-programming.ts` (create)
- `packages/design-pipeline/src/prompts/pair-programming.ts` (create)

**Description:**
Implement the stage-scoped coordinator for Stage 6 (Pair Programming). Enters as pair_routing (synchronous message routing). Manages ping-pong between code writer and test writer agents via ClaudeAdapter.routePairMessage. After pair routing completes, transitions to executing for final output, then git_operating for commit. Handles Claude API failures during pair_routing (Gap 7). Uses GitAdapter for commit operations.

**Dependencies:** Steps 1-9, 6 (GitAdapter)

**Test (write first):**
Write tests that: (a) stage begins from pending -> pair_routing, (b) pair routing completes -> executing, (c) Claude API failure during pair_routing triggers retry (Gap 7), (d) execution produces a PairSessionResult, (e) validation passes -> git_operating, (f) git lock acquisition succeeds, (g) git commit succeeds -> completed with artifact, (h) git failure triggers retry (Gap 1), (i) git retry exhausted -> failed, (j) git lock is released on both success and failure. Use TestClaudeAdapter and TestGitAdapter mocks.

**TLA+ Coverage:**
- State: `pair_routing`
- Transition: `BeginNonStreamingStage` (pending -> pair_routing for PairStage)
- Transition: `CompletePairRouting`
- Transition: `ValidationPass` (-> git_operating for git stage)
- Transition: `AcquireGit`, `GitSuccess`, `GitFail`
- Invariant: `PairRoutingConstraint`
- Invariant: `GitMutualExclusion`
- Gap 1: Git retry path
- Gap 7: Claude API failures during pair_routing

---

### Step 16: Fork-Join Stage Coordinator

**Files:**
- `packages/design-pipeline/src/stages/fork-join.ts` (create)
- `packages/design-pipeline/src/prompts/fork-join.ts` (create)

**Description:**
Implement the stage-scoped coordinator for Stage 7 (Fork-Join). Non-streaming git stage. Receives PairSessionResult, generates final artifacts (PlantUML diagrams, final review), validates through ForkJoinResult Zod schema, then performs git operations. On completion, the run transitions to completed.

**Dependencies:** Steps 1-9, 6 (GitAdapter)

**Test (write first):**
Write tests that: (a) stage begins from pending -> executing, (b) valid ForkJoinResult passes validation, (c) validation passes -> git_operating, (d) git operations succeed -> stage completed with artifact, (e) git failure triggers retry (Gap 1), (f) stage 7 completion triggers run completion. Use TestClaudeAdapter and TestGitAdapter mocks.

**TLA+ Coverage:**
- Transition: `ValidationPass` (-> git_operating for stage 7)
- Transition: `AcquireGit`, `GitSuccess`, `GitFail`
- Transition: `CompleteRun` (stage 7 completed -> run completed)
- Invariant: `CompletedRunIntegrity` (all 7 stages completed with artifacts)

---

### Step 17: Compensation Coordinator

**Files:**
- `packages/design-pipeline/src/engine/compensation.ts` (create)

**Description:**
Implement the compensation coordinator that handles partial failure recovery. When a stage fails and there is a prior checkpoint (checkpoint > 0), the coordinator begins compensation: undoing git side effects for completed stages, cleaning up artifacts. Models compensation failure (Gap 2) -- if compensation itself fails (e.g., git revert fails), the run enters compensation_failed state as a terminal error requiring manual intervention. Uses GitAdapter for git reversals.

**Dependencies:** Steps 1-4, 6, 8

**Test (write first):**
Write tests that: (a) stage failure with checkpoint > 0 begins compensation, (b) stage failure with checkpoint = 0 fails run directly (no compensation), (c) compensation completes successfully -> compensated stage, run failed, (d) compensation failure -> compensation_failed state (Gap 2), (e) compensation uses GitAdapter to revert commits, (f) compensation releases git lock if held, (g) completed run is never compensated. Use TestGitAdapter mock.

**TLA+ Coverage:**
- State: `compensating`, `compensated`
- Transition: `BeginCompensation`
- Transition: `FailRunNoCheckpoint`
- Transition: `CompleteCompensation`
- Invariant: `CompensationRequiresCheckpoint`
- Gap 2: `compensation_failed` state and `FailCompensation` transition
- Liveness: `CompensationTermination`

---

### Step 18: Pipeline Orchestrator

**Files:**
- `packages/design-pipeline/src/engine/orchestrator.ts` (create)

**Description:**
Implement the top-level pipeline orchestrator that composes stage coordinators. Creates an instance-scoped RunRecord, executes stages sequentially (advancing via the transition engine), delegates to the appropriate stage coordinator per stage. Handles stage advancement (AdvanceStage transition), run completion (CompleteRun), and failure/compensation routing. Accepts GitAdapter and ClaudeAdapter as constructor parameters (dependency injection). Does NOT contain stage logic -- it only sequences coordinators.

**Dependencies:** Steps 1-17

**Test (write first):**
Write tests that: (a) a full happy-path run executes all 7 stages in order and completes, (b) failure at stage 3 with checkpoint=2 triggers compensation, (c) failure at stage 1 with checkpoint=0 fails without compensation, (d) stage advancement respects streaming vs non-streaming entry states, (e) the orchestrator creates a new RunRecord per invocation (instance-scoped), (f) two concurrent orchestrator invocations have fully independent state, (g) git mutual exclusion is enforced across concurrent runs. Use TestClaudeAdapter and TestGitAdapter mocks throughout.

**TLA+ Coverage:**
- Transition: `StartRun`, `AdvanceStage`, `CompleteRun`
- Transition: `BeginCompensation`, `FailRunNoCheckpoint`
- Invariant: `StageOrder` (sequential execution)
- Invariant: `CompletedRunIntegrity` (all stages completed)
- Invariant: `CheckpointValidity` (monotonically increasing)
- Invariant: `InstanceIsolation` (per-invocation state)
- Liveness: `RunTermination` (every run completes or fails)

---

### Step 19: Production Git Adapter Implementation

**Files:**
- `packages/design-pipeline/src/adapters/git-child-process.ts` (create)

**Description:**
Implement the production GitAdapter using execFileNoThrow (from src/utils/execFileNoThrow.ts) for git operations (createBranch, commit, push, checkout). Lock acquisition uses a mutex (in-process lock with atomic compare-and-swap). Includes retry logic for transient git failures (lock contention, network issues). Gap 5: lock acquisition is atomic -- a single method call that either succeeds and sets the owner, or fails. No two-step TOCTOU window.

**Dependencies:** Step 6

**Test (write first):**
Write tests that: (a) createBranch spawns correct git command, (b) commit spawns correct git command with message, (c) acquireLock atomically sets owner and returns true, (d) acquireLock returns false when already held, (e) releaseLock clears the owner, (f) git command failure returns a Result error (not thrown exception), (g) retry logic retries on lock contention. Use vi.mock to mock execFileNoThrow to avoid actual git operations.

**TLA+ Coverage:**
- Transition: `AcquireGit` (atomic lock)
- Transition: `GitSuccess`, `GitFail`
- Invariant: `GitMutualExclusion`
- Gap 5: Atomic lock acquisition (no TOCTOU)
- Gap 1: Git retry on transient failure

---

### Step 20: Production Claude Adapter Implementation

**Files:**
- `packages/design-pipeline/src/adapters/claude-sdk.ts` (create)

**Description:**
Implement the production ClaudeAdapter using @anthropic-ai/claude-agent-sdk. Maps SDK responses to the typed Result union. Handles timeout and rate limit errors by mapping them to the appropriate ErrorKind. Streaming is implemented via the SDK's streaming API. Pair routing uses sequential message exchanges through the SDK.

**Dependencies:** Step 7

**Test (write first):**
Write tests that: (a) executePrompt maps a successful SDK response to a success Result, (b) SDK timeout maps to claude_api_timeout error, (c) SDK rate limit maps to claude_api_rate_limit error, (d) streamPrompt handles multi-turn streaming correctly, (e) routePairMessage sends and receives messages correctly, (f) unknown SDK errors map to a generic error kind. Use vi.mock to mock the Anthropic SDK.

**TLA+ Coverage:**
- Transition: `ClaudeApiFail` (timeout/rate limit mapping)
- Transition: `ClaudeApiFailExhausted` (error propagation)
- Gap 7: pair_routing API failure handling

---

### Step 21: Public API -- runPipeline Entry Point

**Files:**
- `packages/design-pipeline/src/index.ts` (create)

**Description:**
Implement the public `runPipeline(config, adapters)` function that creates an orchestrator with the provided adapters (or production defaults) and executes the pipeline. This is what the `/design-pipeline` SKILL.md calls. Accepts optional adapter overrides for testing. Returns a typed PipelineResult (success with all artifacts or failure with error details and checkpoint).

**Dependencies:** Steps 18, 19, 20

**Test (write first):**
Write tests that: (a) runPipeline with default config creates a production orchestrator, (b) runPipeline with mock adapters uses the mocks, (c) successful pipeline returns all 7 stage artifacts, (d) failed pipeline returns error details and checkpoint for recovery, (e) the function is the single entry point (no other exports needed for SKILL.md). Use TestClaudeAdapter and TestGitAdapter.

**TLA+ Coverage:**
- Transition: `StartRun` (entry point)
- Transition: `CompleteRun` (successful return)
- Invariant: `CompletedRunIntegrity` (return value has all artifacts)

---

### Step 22: Feature Flag for Incremental Migration

**Files:**
- `packages/design-pipeline/src/config/feature-flags.ts` (create)
- `packages/design-pipeline/src/engine/orchestrator.ts` (modify)

**Description:**
Implement feature flags that allow individual stages to use the new SDK coordinator or fall back to the old agent-file approach. This addresses design consensus Fix 3 (incremental migration). The orchestrator checks the feature flag before each stage and delegates accordingly. Old agent files coexist with new SDK stages until proven.

**Dependencies:** Steps 1, 18

**Test (write first):**
Write tests that: (a) feature flag enabled for stage 1 uses the new questioner coordinator, (b) feature flag disabled for stage 1 falls back to legacy, (c) mixed flags (some stages new, some legacy) work correctly, (d) all flags enabled is equivalent to full SDK pipeline, (e) all flags disabled is equivalent to legacy pipeline. Use mocks for both new coordinators and legacy fallback.

**TLA+ Coverage:**
- Design consensus Fix 3: Incremental migration with feature flags
- Gap 6: Documented fairness assumption -- failures may not resolve, system relies on retry exhaustion

---

### Step 23: End-to-End Integration Test -- Full Pipeline Lifecycle

**Files:**
- `packages/design-pipeline/src/tests/pipeline-lifecycle.test.ts` (create)

**Description:**
Write integration tests that exercise the full pipeline lifecycle with mock adapters, verifying all TLA+ liveness properties. These tests verify that the system as a whole satisfies the temporal guarantees from the spec: every run terminates, compensation terminates, and retries make progress.

**Dependencies:** Steps 1-22

**Test (write first):**
This step IS the test. Write tests that:
- (a) Happy path: all 7 stages complete, run completes with all artifacts (RunTermination, CompletedRunIntegrity)
- (b) Failure at stage 4 with checkpoint=3: compensation runs and completes (CompensationTermination)
- (c) Failure at stage 1 with no checkpoint: run fails without compensation (FailRunNoCheckpoint)
- (d) Claude API timeout at stage 2 with retries: retries succeed on second attempt (RetryProgress)
- (e) Claude API timeout with retries exhausted: stage fails, run compensates or fails (RetryProgress -> RunTermination)
- (f) Zod validation failure: retry succeeds on second attempt (RetryProgress)
- (g) Git failure at stage 6: retry succeeds on second attempt (GitRetry from Gap 1)
- (h) Git failure with retries exhausted: stage fails (GitRetryExhausted from Gap 1)
- (i) Streaming input at stage 1: multi-turn conversation, complete, execute (StreamInput -> CompleteStreaming -> FinishExecution)
- (j) Stream limit reached at stage 5: stream_limit_exceeded error (Gap 3)
- (k) Compensation failure: compensation_failed terminal state (Gap 2)
- (l) Pair routing API failure: retry during pair_routing (Gap 7)
- (m) Git mutual exclusion: two concurrent runs, only one holds git lock at a time (GitMutualExclusion)

**TLA+ Coverage:**
- Liveness: `RunTermination`, `CompensationTermination`, `RetryProgress`
- Invariant: All 10 safety invariants verified via assertions in each test
- Gap 1-7: All gaps covered by specific test cases

---

### Step 24: SKILL.md Thin Wrapper Update

**Files:**
- `.claude/skills/design-pipeline/SKILL.md` (modify)

**Description:**
Update the design-pipeline SKILL.md to be a thin wrapper (~30-50 lines) that calls `runPipeline()` from the SDK package. Remove all orchestration logic, state tracking, and agent dispatching from the skill file. The skill file becomes purely an entry point that imports and invokes the SDK.

**Dependencies:** Step 21

**Test (write first):**
Write tests that: (a) SKILL.md references the correct import path for runPipeline, (b) SKILL.md is under 50 lines, (c) SKILL.md contains no state management logic, (d) SKILL.md contains no agent dispatching logic. These are structural/content tests reading the file.

**TLA+ Coverage:**
- Design consensus: agents have zero pipeline awareness
- Briefing: SKILL.md becomes thin wrapper calling runPipeline()

---

## State Coverage Audit

### States -- All Covered

| State | Covered By |
|-------|-----------|
| `idle` (run) | Step 4, 8, 18 |
| `running` (run) | Step 8, 18 |
| `completed` (run) | Step 8, 18, 23 |
| `failed` (run) | Step 8, 17, 18, 23 |
| `compensating` (run) | Step 8, 17, 18, 23 |
| `pending` (stage) | Step 3, 8 |
| `streaming_input` (stage) | Step 3, 8, 10, 14 |
| `executing` (stage) | Step 3, 8, 10-16 |
| `validating` (stage) | Step 3, 8, 10-16 |
| `validation_failed` (stage) | Step 3, 8, 9 |
| `retrying` (stage) | Step 3, 8, 9 |
| `git_operating` (stage) | Step 3, 8, 15, 16 |
| `pair_routing` (stage) | Step 3, 8, 15 |
| `completed` (stage) | Step 3, 8, 10-16 |
| `failed` (stage) | Step 3, 8, 10-17 |
| `compensating` (stage) | Step 3, 8, 17 |
| `compensated` (stage) | Step 3, 8, 17 |
| `compensation_failed` (Gap 2) | Step 3, 17 |
| `none` (error) | Step 2, 3 |
| `claude_api_timeout` (error) | Step 2, 7, 9 |
| `claude_api_rate_limit` (error) | Step 2, 7, 9 |
| `zod_validation` (error) | Step 2, 5, 8, 9 |
| `git_failure` (error) | Step 2, 6, 8, 9 |
| `user_abandon` (error) | Step 2, 8, 10 |
| `retry_exhausted` (error) | Step 2, 8, 9 |
| `stream_limit_exceeded` (Gap 3) | Step 2, 10, 14 |
| `git_retry_exhausted` (Gap 1) | Step 2, 9, 15, 16 |

### Transitions -- All Covered

| Transition | Covered By |
|-----------|-----------|
| `StartRun` | Step 8, 18 |
| `StreamInput` | Step 8, 10, 14 |
| `CompleteStreaming` | Step 8, 10, 14 |
| `AbandonStreaming` | Step 8, 10 |
| `BeginNonStreamingStage` | Step 8, 11-13, 15, 16 |
| `CompletePairRouting` | Step 8, 15 |
| `FinishExecution` | Step 8, 10-16 |
| `ValidationPass` | Step 8, 10-16 |
| `ValidationFail` | Step 8, 10-16 |
| `RetryAfterValidationFail` | Step 8, 9 |
| `RetryToExecuting` | Step 8, 9 |
| `RetryExhausted` | Step 8, 9 |
| `ClaudeApiFail` | Step 8, 9, 11-16 |
| `ClaudeApiFailExhausted` | Step 8, 9 |
| `AcquireGit` | Step 8, 6, 15, 16 |
| `GitSuccess` | Step 8, 6, 15, 16 |
| `GitFail` | Step 8, 6, 15, 16 |
| `AdvanceStage` | Step 8, 18 |
| `CompleteRun` | Step 8, 16, 18 |
| `BeginCompensation` | Step 8, 17, 18 |
| `FailRunNoCheckpoint` | Step 8, 17, 18 |
| `CompleteCompensation` | Step 8, 17 |
| `Terminated` | Step 18 (orchestrator shutdown) |
| `GitRetry` (Gap 1) | Step 8, 9, 15, 16 |
| `GitRetryExhausted` (Gap 1) | Step 8, 9, 15, 16 |
| `StreamLimitReached` (Gap 3) | Step 8, 10, 14 |
| `FailCompensation` (Gap 2) | Step 8, 17 |
| `PairRoutingApiFail` (Gap 7) | Step 8, 15 |

### Safety Invariants -- All Covered

| Invariant | Verified By |
|----------|-----------|
| `TypeOK` | Step 4 (type definitions), Step 5 (Zod schemas) |
| `StageOrder` | Step 8 (transition preconditions), Step 18 (orchestrator sequencing) |
| `RetryBound` | Step 8, 9 (cap enforcement in retry coordinator) |
| `GitMutualExclusion` | Step 6 (port interface), Step 19 (production adapter), Step 23 (integration test) |
| `CompletedRunIntegrity` | Step 18 (orchestrator), Step 23 (integration test) |
| `CheckpointValidity` | Step 8 (transition logic), Step 18 (orchestrator) |
| `FailedStageHasError` | Step 8 (all failure transitions set error kind) |
| `StreamingStageConstraint` | Step 8 (streaming preconditions), Step 1 (StreamingStages set) |
| `PairRoutingConstraint` | Step 8 (pair routing preconditions), Step 1 (PairStage constant) |
| `CompensationRequiresCheckpoint` | Step 8, 17 (compensation precondition) |

### Liveness Properties -- All Covered

| Property | Verified By |
|---------|-----------|
| `RunTermination` | Step 23 (tests a-e: every run completes or fails) |
| `CompensationTermination` | Step 23 (test b: compensation completes), Step 17 |
| `RetryProgress` | Step 23 (tests d-h: retries resolve to execution or failure) |

### TLA+ Review Gaps -- All Covered

| Gap | Covered By |
|-----|-----------|
| Gap 1: Git retry paths | Steps 2, 8, 9, 15, 16, 19, 23 |
| Gap 2: Compensation failure | Steps 2, 3, 8, 17, 23 |
| Gap 3: Stream limit distinct error | Steps 2, 8, 10, 14, 23 |
| Gap 4: Named stage constants | Step 1 |
| Gap 5: Atomic git lock | Steps 6, 19 |
| Gap 6: Failure path fairness | Step 9 (documented), Step 22 |
| Gap 7: Pair routing API failures | Steps 7, 8, 15, 20, 23 |

All TLA+ states, transitions, and properties are covered by the implementation plan.

---

## Execution Tiers

### Tier 1: Foundation Types and Constants (all independent, no shared files)

These steps define the base type system. They have no dependencies on each other and touch distinct files.

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Named Stage Constants and Configuration Types |
| T2 | Step 2 | Error Discriminated Union and Error Kinds |

### Tier 2: Domain Model Types (depend on Tier 1 types)

These steps build on the foundation types to define the stage and run record structures. T3-T6 are independent of each other.

| Task ID | Step | Title |
|---------|------|-------|
| T3 | Step 3 | Stage State Machine Types |
| T4 | Step 5 | Zod Schemas for Stage Boundary Validation |
| T5 | Step 6 | Git Port/Adapter Interface |
| T6 | Step 7 | Claude API Port/Adapter Interface |

### Tier 3: Run Record (depends on Tier 2 stage types)

| Task ID | Step | Title |
|---------|------|-------|
| T7 | Step 4 | Run Record -- Instance-Scoped Pipeline State |

### Tier 4: Core Engine (depends on Tier 3 run record)

The transition engine and retry coordinator are independent of each other but both need the run record.

| Task ID | Step | Title |
|---------|------|-------|
| T8 | Step 8 | Stage Transition Engine |
| T9 | Step 9 | Retry Coordinator |

### Tier 5: Stage Coordinators (depend on Tier 4 engine, independent of each other)

All 7 stage coordinators plus compensation coordinator can run in parallel since they touch distinct files and depend only on the shared engine.

| Task ID | Step | Title |
|---------|------|-------|
| T10 | Step 10 | Questioner Stage Coordinator |
| T11 | Step 11 | Debate Moderator Stage Coordinator |
| T12 | Step 12 | TLA+ Writer Stage Coordinator |
| T13 | Step 13 | Expert Review Stage Coordinator |
| T14 | Step 14 | Implementation Planning Stage Coordinator |
| T15 | Step 15 | Pair Programming Stage Coordinator |
| T16 | Step 16 | Fork-Join Stage Coordinator |
| T17 | Step 17 | Compensation Coordinator |

### Tier 6: Orchestrator and Production Adapters (depend on Tier 5 coordinators)

The orchestrator composes all coordinators. Production adapters are independent of the orchestrator but logically ship together.

| Task ID | Step | Title |
|---------|------|-------|
| T18 | Step 18 | Pipeline Orchestrator |
| T19 | Step 19 | Production Git Adapter Implementation |
| T20 | Step 20 | Production Claude Adapter Implementation |

### Tier 7: Public API and Migration (depend on Tier 6)

| Task ID | Step | Title |
|---------|------|-------|
| T21 | Step 21 | Public API -- runPipeline Entry Point |
| T22 | Step 22 | Feature Flag for Incremental Migration |

### Tier 8: Integration Tests and Skill Update (depend on Tier 7)

| Task ID | Step | Title |
|---------|------|-------|
| T23 | Step 23 | End-to-End Integration Test -- Full Pipeline Lifecycle |
| T24 | Step 24 | SKILL.md Thin Wrapper Update |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Named Stage Constants and Configuration Types | 1 | typescript-writer | vitest-writer | None | Pure TypeScript constants and Zod config schema -- domain types with unit tests. |
| T2 | Error Discriminated Union and Error Kinds | 1 | typescript-writer | vitest-writer | None | Pure TypeScript discriminated union types with exhaustiveness tests. |
| T3 | Stage State Machine Types | 2 | typescript-writer | vitest-writer | T1, T2 | Domain model types with Zod schema validation tests. |
| T4 | Zod Schemas for Stage Boundary Validation | 2 | typescript-writer | vitest-writer | T1, T3 | Zod schema definitions are pure TypeScript with parse/reject tests. |
| T5 | Git Port/Adapter Interface | 2 | typescript-writer | vitest-writer | T1, T2 | TypeScript interface definition with mock-based contract tests. |
| T6 | Claude API Port/Adapter Interface | 2 | typescript-writer | vitest-writer | T1, T2 | TypeScript interface definition with mock-based contract tests. |
| T7 | Run Record -- Instance-Scoped Pipeline State | 3 | typescript-writer | vitest-writer | T3 | Pure domain type with isolation and Zod validation tests. |
| T8 | Stage Transition Engine | 4 | typescript-writer | vitest-writer | T7 | Pure state transition functions -- the core state machine logic with exhaustive unit tests. |
| T9 | Retry Coordinator | 4 | typescript-writer | vitest-writer | T7 | Pure retry logic with parameterized unit tests across error kinds. |
| T10 | Questioner Stage Coordinator | 5 | typescript-writer | vitest-writer | T8, T9 | Stage coordinator with streaming input -- pure domain logic with mocked adapter tests. |
| T11 | Debate Moderator Stage Coordinator | 5 | typescript-writer | vitest-writer | T8, T9 | Non-streaming stage coordinator with mocked adapter tests. |
| T12 | TLA+ Writer Stage Coordinator | 5 | typescript-writer | vitest-writer | T8, T9 | Non-streaming stage coordinator with mocked adapter tests. |
| T13 | Expert Review Stage Coordinator | 5 | typescript-writer | vitest-writer | T8, T9 | Non-streaming stage coordinator with mocked adapter tests. |
| T14 | Implementation Planning Stage Coordinator | 5 | typescript-writer | vitest-writer | T8, T9 | Streaming confirmation gate coordinator with mocked adapter tests. |
| T15 | Pair Programming Stage Coordinator | 5 | typescript-writer | vitest-writer | T8, T9 | Pair routing + git operations coordinator with mocked adapter tests. |
| T16 | Fork-Join Stage Coordinator | 5 | typescript-writer | vitest-writer | T8, T9 | Git stage coordinator with mocked adapter tests. |
| T17 | Compensation Coordinator | 5 | typescript-writer | vitest-writer | T8, T9 | Compensation logic with git reversal and failure path tests. |
| T18 | Pipeline Orchestrator | 6 | typescript-writer | vitest-writer | T10-T17 | Composition orchestrator with full lifecycle mocked integration tests. |
| T19 | Production Git Adapter Implementation | 6 | typescript-writer | vitest-writer | T5 | execFileNoThrow wrapper with vi.mock tests -- no actual git operations in tests. |
| T20 | Production Claude Adapter Implementation | 6 | typescript-writer | vitest-writer | T6 | Anthropic SDK wrapper with vi.mock tests -- no actual API calls in tests. |
| T21 | Public API -- runPipeline Entry Point | 7 | typescript-writer | vitest-writer | T18-T20 | Public entry point with dependency injection tests. |
| T22 | Feature Flag for Incremental Migration | 7 | typescript-writer | vitest-writer | T18 | Feature flag config with orchestrator integration tests. |
| T23 | End-to-End Integration Test -- Full Pipeline Lifecycle | 8 | typescript-writer | vitest-writer | T21, T22 | Full lifecycle integration tests covering all TLA+ liveness properties. |
| T24 | SKILL.md Thin Wrapper Update | 8 | trainer-writer | vitest-writer | T21 | Agent artifact update with structural validation tests. |
