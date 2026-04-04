# Implementation Plan: Questioner Stage Rewrite

## Source Artifacts

| Artifact | Path |
|----------|------|
| Briefing | `docs/questioner-sessions/2026-04-04_questioner-stage-rewrite.md` |
| Design Consensus | `docs/debate-moderator-sessions/2026-04-04_questioner-stage-rewrite.md` |
| TLA+ Specification | `docs/tla-specs/questioner-stage-rewrite/QuestionerStageRewrite.tla` |
| TLA+ Review Consensus | `docs/debate-moderator-sessions/2026-04-04_questioner-stage-rewrite-tla-review.md` |

## TLA+ State Coverage Matrix

### States

- `"questioning"` -- LLM is formulating a question or processing retry
- `"awaitingInput"` -- waiting for user response (normal answer, /summary, or SIGINT)
- `"summaryPresented"` -- summary shown, user decides to continue or sign off
- `"signingOff"` -- CLI has requested signoff from LLM, awaiting cooperation
- `"completed"` -- session finished successfully, briefing saved
- `"failed"` -- session terminated due to error, abandonment, or safety valve

### Artifact States

- `"empty"` -- no Q&A content yet
- `"partial"` -- at least one Q&A pair exists
- `"complete"` -- full briefing with signoff

### Store Status Values

- `"idle"` -- initial store state
- `"active"` -- session in progress
- `"completed"` -- session completed successfully
- `"failed"` -- session failed with error kind

### Error Kinds

- `"none"` -- no error
- `"retry_exhausted"` -- inline retries exhausted
- `"user_abandon"` -- SIGINT / Ctrl+C
- `"signoff_exhausted"` -- signoff attempts exhausted (CLIForcesSignoff path)
- `"turn_cap_exceeded"` -- safety valve turn cap hit
- `"lint_exhausted"` -- lint-fixer exhausted after escalation (TLA+ review fix #2)

### Transitions

- `AskQuestion` -- LLM asks question, state: questioning -> awaitingInput, turnCount increments
- `UserAnswer` -- user provides normal answer, state: awaitingInput -> questioning
- `UserRequestsSummary` -- user types exact "/summary", state: awaitingInput -> summaryPresented
- `UserContinuesAfterSummary` -- user says "keep going" after summary, state: summaryPresented -> questioning
- `UserConfirmsSignoff` -- user confirms sign-off after summary, state: summaryPresented -> signingOff
- `LLMInitiatesSignoff` -- LLM naturally initiates signoff, state: questioning -> signingOff
- `LLMProducesSignoff` -- LLM cooperates with signoff, state: signingOff -> completed
- `LLMRefusesSignoff` -- LLM produces question instead of signoff, increments signoffAttempts
- `CLIForcesSignoff` -- signoff attempts exhausted, CLI forces completion, state: signingOff -> completed
- `TurnCapExceeded` -- turn cap hit from "questioning" only (TLA+ review fix #4), state: questioning -> failed
- `LLMMalformedResponse` -- malformed JSON from LLM, retryCount increments
- `RetryExhausted` -- retries exhausted, state: questioning -> failed
- `RetrySucceeds` -- retry produces valid response, retryCount resets to 0
- `UserAbandons` -- SIGINT from any non-terminal state, state: * -> failed
- `LintRunClean` -- lint pass is clean, lintCleanRuns increments
- `LintRunDirty` -- lint pass is dirty, lintCleanRuns resets to 0
- `LintEscalateToUser` -- lint attempts exhausted, escalate to user, reset lintCleanRuns to 0 (TLA+ review fix #1), reset lintAttempts to 0
- `LintFailed` -- post-escalation lint exhaustion, terminal transition (TLA+ review fix #2), state: completed -> failed with lint_exhausted
- `DispatchStages` -- lint double-pass achieved, dispatch stages 2-7

### Safety Invariants

- `TypeOK` -- all variables stay within declared domains
- `StoreCompletedOnlyAfterSignoff` -- store "completed" requires session completed, artifact complete, briefing saved
- `RetryBounded` -- retryCount <= MaxRetries
- `SignoffAttemptsBounded` -- signoffAttempts <= MaxSignoffAttempts
- `TurnsBounded` -- turnCount <= MaxTurns
- `LintDoublePassRequired` -- stagesRun implies lintCleanRuns >= 2
- `CompletedRequiresBriefing` -- store "completed" implies briefingSaved
- `FailedHasErrorKind` -- store "failed" implies storeErrorKind != "none"
- `WaitForOnlyOnTerminal` -- waitForResolved only in completed or failed states
- `StagesOnlyAfterLintPass` -- stagesRun implies completed session with lint double-pass

### Liveness Properties

- `SessionTerminates` -- every session eventually reaches completed or failed
- `WaitForResolves` -- the store waitFor completion gate always resolves
- `StagesEventuallyDispatch` -- if completed and lint passes, stages eventually dispatch (conditional on ESLint cooperation per TLA+ review fix #5)

---

## Implementation Steps

### Step 1: Questioner Session State Types and Zod Schemas

**Files:**
- `packages/design-pipeline/src/types/questioner-session.ts` (create)
- `packages/design-pipeline/src/schemas/questioner-session.ts` (create)

**Description:**
Define the discriminated union session state type (Gap #4) and all supporting types for the questioner session: the 6-state `SessionState` union, the `QuestionerArtifact` type with Q&A pairs, summary, and session state, the structured JSON protocol schema (`QuestionerMessage` with `type: "question" | "summary" | "signoff"`), and error kind extensions (`signoff_exhausted`, `turn_cap_exceeded`, `lint_exhausted`). Also define the session configuration type with injectable constants (`maxRetries`, `maxTurns`, `maxSignoffAttempts`, `maxLintPasses`).

**Dependencies:** None

**Test (write first):**
- Test that the `SessionState` discriminated union accepts exactly the 6 valid states and rejects invalid strings via Zod parsing.
- Test that `QuestionerMessageSchema` parses valid `{ type: "question", content: "..." }` objects and rejects malformed inputs (missing type, wrong type value, missing content).
- Test that `QuestionerArtifactSchema` validates the artifact shape: `{ questions: QA[], summary: string | null, sessionState: SessionState }`.
- Test that the session config defaults match the TLA+ constants: `maxRetries=3`, `maxTurns=50`, `maxSignoffAttempts=3`.

**TLA+ Coverage:**
- State: all 6 session states (`"questioning"`, `"awaitingInput"`, `"summaryPresented"`, `"signingOff"`, `"completed"`, `"failed"`)
- State: all 3 artifact states (`"empty"`, `"partial"`, `"complete"`)
- State: all 5 error kinds (`"none"`, `"retry_exhausted"`, `"user_abandon"`, `"signoff_exhausted"`, `"turn_cap_exceeded"`, `"lint_exhausted"`)
- Invariant: `TypeOK` (type-level enforcement)

---

### Step 2: Questioner Session Constants

**Files:**
- `packages/design-pipeline/src/config/questioner-config.ts` (create)

**Description:**
Define the questioner session configuration constants as a typed object with defaults matching the TLA+ specification. Safety valve turn cap at 50 (Gap #2), max retries at 3, max signoff attempts at 3, max lint passes configurable. Expose a factory function that accepts partial overrides for testing. This is the single source of truth for all session bounds.

**Dependencies:** Step 1

**Test (write first):**
- Test that `createQuestionerConfig()` returns defaults: `{ maxRetries: 3, maxTurns: 50, maxSignoffAttempts: 3, maxLintPasses: 10 }`.
- Test that `createQuestionerConfig({ maxTurns: 5 })` overrides only the specified field and preserves other defaults.
- Test that all numeric fields are positive integers (Zod validation rejects 0, -1, non-integers).

**TLA+ Coverage:**
- Constants: `MaxRetries`, `MaxTurns`, `MaxSignoffAttempts`, `MaxLintPasses`
- Invariant: `RetryBounded`, `SignoffAttemptsBounded`, `TurnsBounded` (bounds defined here)

---

### Step 3: Rich Questioner System Prompt

**Files:**
- `packages/design-pipeline/src/prompts/questioner.ts` (modify -- replace existing `buildQuestionerPrompt`)

**Description:**
Replace the 1-line prompt with a rich system prompt that encodes: (a) one question per turn, (b) structured JSON output protocol (`{ type: "question" | "summary" | "signoff", content: string }`), (c) freeform discovery behavioral rules, (d) completeness check before signoff, (e) recommendation-making authority. The prompt instructs the LLM to naturally move toward signoff when branches are exhausted. This is the behavioral encoding of the liveness property -- the LLM's prompt instructions are the mechanism by which the session terminates naturally.

**Dependencies:** Step 1

**Test (write first):**
- Test that `buildQuestionerPrompt(context)` returns a string containing the JSON output protocol instruction.
- Test that the prompt mentions all three message types: "question", "summary", "signoff".
- Test that the prompt contains the one-question-per-turn instruction.
- Test that the prompt contains the completeness check instruction.
- Test that the prompt includes the user-provided context string.

**TLA+ Coverage:**
- Transition: `AskQuestion` (prompt instructs one-question-per-turn behavior)
- Transition: `LLMInitiatesSignoff` (prompt instructs natural signoff when branches exhausted)
- Property: `SessionTerminates` (behavioral encoding of liveness via prompt instructions)

---

### Step 4: Questioner Session Core Loop

**Files:**
- `packages/design-pipeline/src/stages/questioner-session.ts` (create)

**Description:**
Implement `runQuestionerSession()` -- the multi-turn Anthropic SDK conversation loop. Accepts injected dependencies: SDK client (Gap #1), store, config, readline interface. The loop: (1) sends messages to LLM, (2) parses JSON response with Zod, (3) dispatches based on message type (question/summary/signoff), (4) updates store synchronously, (5) reads user input, (6) intercepts exact-match "/summary" (Gap #5), (7) enforces turn cap (Gap #2, from "questioning" state only per TLA+ review fix #4), (8) handles inline retries with exponential backoff, (9) handles SIGINT for clean abort. The session state transitions are driven by a switch on the discriminated union state.

**Dependencies:** Steps 1, 2, 3

**Test (write first):**
- Test happy path: stub SDK to return 2 questions then signoff. Assert session completes, artifact is "complete", briefing saved, store status "completed".
- Test exact-match "/summary" interception: input "/summary" triggers summary injection to LLM. Input "I said /summary in my answer" does NOT trigger interception.
- Test turn cap at limit: stub SDK to always return questions. Assert session fails with `turn_cap_exceeded` when turnCount reaches maxTurns. Assert failure only from "questioning" state (TLA+ review fix #4).
- Test malformed JSON retry: stub SDK to return invalid JSON once then valid JSON. Assert retryCount increments then resets. Assert exponential backoff delay was applied.
- Test retry exhaustion: stub SDK to return invalid JSON maxRetries+1 times. Assert session fails with `retry_exhausted`, partial briefing saved.
- Test SIGINT handling: simulate SIGINT signal. Assert session fails with `user_abandon`, partial briefing saved.
- Test signoff guard: stub SDK to return question instead of signoff. Assert signoffAttempts increments, retry instruction sent. After maxSignoffAttempts, assert CLI forces signoff from conversation content.
- Test summary flow: user requests summary, LLM provides summary, user says "keep going", session continues in questioning state.
- Test summary-to-signoff: user requests summary, user confirms signoff, LLM produces signoff response.
- Test LLM-initiated signoff (no /summary): stub SDK to return signoff from questioning state. Assert session completes normally.
- Test artifact progression: assert artifact transitions from "empty" -> "partial" (after first question) -> "complete" (after signoff).
- Test store `waitForResolved` is set to true only on terminal states (completed or failed).

**TLA+ Coverage:**
- Transition: `AskQuestion`, `UserAnswer`, `UserRequestsSummary`, `UserContinuesAfterSummary`, `UserConfirmsSignoff`, `LLMInitiatesSignoff`, `LLMProducesSignoff`, `LLMRefusesSignoff`, `CLIForcesSignoff`, `TurnCapExceeded`, `LLMMalformedResponse`, `RetryExhausted`, `RetrySucceeds`, `UserAbandons`
- State: all 6 session states, all 3 artifact states
- Invariant: `StoreCompletedOnlyAfterSignoff`, `RetryBounded`, `SignoffAttemptsBounded`, `TurnsBounded`, `CompletedRequiresBriefing`, `FailedHasErrorKind`, `WaitForOnlyOnTerminal`
- Property: `SessionTerminates`, `WaitForResolves`

---

### Step 5: Briefing File Writer

**Files:**
- `packages/design-pipeline/src/stages/briefing-writer.ts` (create)

**Description:**
Implement `writeBriefingFile()` -- extracts Q&A transcript and summary from the questioner artifact, formats as markdown, writes to `docs/questioner-sessions/YYYY-MM-DD_<slug>.md`. Handles both complete briefings (signoff path) and partial briefings (failure path, marked [INCOMPLETE]). This function is called by the session loop on all terminal transitions (both completed and failed), satisfying the `briefingSaved` variable from the TLA+ spec.

**Dependencies:** Step 1

**Test (write first):**
- Test complete briefing: given a complete artifact with 3 Q&A pairs and summary, assert file is written with correct markdown structure and no [INCOMPLETE] marker.
- Test partial briefing (retry exhaustion): given a partial artifact with 1 Q&A pair and no summary, assert file is written with [INCOMPLETE] marker.
- Test partial briefing (user abandon): same as above, assert [INCOMPLETE] marker and error kind noted.
- Test file path: assert the file path follows `docs/questioner-sessions/YYYY-MM-DD_<slug>.md` convention.
- Test idempotency: calling writeBriefingFile twice with the same content produces the same file.

**TLA+ Coverage:**
- Variable: `briefingSaved` (set to TRUE on all terminal transitions)
- Invariant: `CompletedRequiresBriefing`

---

### Step 6: Lint-Fixer Module

**Files:**
- `packages/design-pipeline/src/stages/lint-fixer.ts` (create)

**Description:**
Implement the lint-fixer TypeScript module using the Anthropic SDK (injected). Runs ESLint on the briefing file in a double-pass retry loop: requires 2 consecutive clean runs before success. On dirty run, resets `lintCleanRuns` to 0. When lint attempts are exhausted, escalates to user (interactive mode) or skips escalation (non-interactive mode, Gap #8). On escalation, resets both `lintCleanRuns` to 0 (TLA+ review fix #1) and `lintAttempts` to 0. Allows multiple escalations or has a `LintFailed` terminal transition when post-escalation lint attempts are also exhausted (TLA+ review fix #2). User escalation responses feed into a colocated recipes file for institutional memory.

**Dependencies:** Steps 1, 2

**Test (write first):**
- Test double-pass happy path: mock ESLint to return clean twice consecutively. Assert `lintCleanRuns` reaches 2, function returns success.
- Test dirty run resets counter: mock ESLint to return clean, dirty, clean, clean. Assert the first clean run is discarded after the dirty run, and the final two consecutive cleans succeed.
- Test escalation resets lintCleanRuns: mock ESLint to fail `maxLintPasses` times. Assert escalation fires, `lintCleanRuns` resets to 0 (TLA+ review fix #1), `lintAttempts` resets to 0.
- Test post-escalation success: after escalation, mock ESLint to return clean twice. Assert success.
- Test post-escalation exhaustion (LintFailed terminal): after escalation, mock ESLint to fail another `maxLintPasses` times. Assert `lint_exhausted` error (TLA+ review fix #2).
- Test non-interactive mode: when `interactive: false`, assert escalation is skipped and current state is saved (Gap #8).
- Test recipes file: on user escalation, assert the user's response is appended to the recipes file.
- Test SDK injection: verify lint-fixer accepts Anthropic client as parameter (Gap #1).

**TLA+ Coverage:**
- Transition: `LintRunClean`, `LintRunDirty`, `LintEscalateToUser`, `LintFailed` (new terminal, TLA+ review fix #2)
- Variable: `lintCleanRuns`, `lintAttempts`, `lintEscalated`
- Invariant: `LintDoublePassRequired`
- Property: `StagesEventuallyDispatch` (lint is the gate before dispatch)

---

### Step 7: Orchestrator Feature Flag Branch

**Files:**
- `packages/design-pipeline/src/engine/orchestrator.ts` (modify)
- `packages/design-pipeline/src/config/feature-flags.ts` (modify)

**Description:**
Modify the orchestrator to branch at the Questioner stage: always use the new `runQuestionerSession()` path (the questioner is never behind a feature flag). After the questioner completes and lint passes, check the feature flag for stages 2-7: if `sdkEnabled` is off (production), shell out to `claude` CLI subprocess with briefing path; if `sdkEnabled` is on (tests/legacy), run the existing orchestrator loop. Add the `waitFor()` completion gate in the orchestrator that resolves when the questioner session reaches a terminal state. Document the feature flag removal conditions (Gap #7): "Remove after stages 2-7 are migrated to SDK-based orchestration."

**Dependencies:** Steps 4, 5, 6

**Test (write first):**
- Test questioner always runs new path: with both flag states, assert `runQuestionerSession()` is called, not `executeQuestioner()`.
- Test feature flag off (production): mock `claude` CLI subprocess. Assert it is called with the briefing file path after questioner completes and lint passes.
- Test feature flag on (legacy/tests): assert existing orchestrator loop runs for stages 2-7.
- Test `waitFor()` gate: assert orchestrator blocks until session state is "completed" or "failed".
- Test lint must pass before stage dispatch: assert stages 2-7 are not dispatched until `lintCleanRuns >= 2`.
- Test failed questioner does not dispatch stages 2-7: assert early return on questioner failure.

**TLA+ Coverage:**
- Transition: `DispatchStages`
- Variable: `featureFlagOn`, `stagesRun`, `waitForResolved`
- Invariant: `StagesOnlyAfterLintPass`, `WaitForOnlyOnTerminal`
- Property: `StagesEventuallyDispatch`, `WaitForResolves`

---

### Step 8: Delete Old Questioner Code

**Files:**
- `packages/design-pipeline/src/stages/questioner.ts` (modify -- delete `executeQuestioner` and `executeStreaming` functions)
- `packages/design-pipeline/src/prompts/questioner.ts` (already modified in Step 3 -- old `buildQuestionerPrompt` replaced)
- `packages/design-pipeline/src/engine/orchestrator.ts` (modify -- remove imports of deleted functions)

**Description:**
Remove the old questioner implementation: `executeQuestioner()`, `executeStreaming()`, and the old `buildQuestionerPrompt()` (already replaced in Step 3). Update all imports in the orchestrator and any other files that reference the deleted functions. The old code used `ClaudeAdapter` and the streaming/validation pipeline; the new code uses the Anthropic SDK directly. Existing shared infrastructure (base-coordinator, compensation, retry) remains untouched.

**Dependencies:** Step 7

**Test (write first):**
- Test that the old function names (`executeQuestioner`, `executeStreaming`) are no longer exported from the questioner module.
- Test that the orchestrator no longer imports from the old questioner path for Questioner stage execution.
- Test that all existing non-questioner stage tests still pass (regression test -- ensure no shared code was broken).

**TLA+ Coverage:**
- (Cleanup step -- no new TLA+ coverage, ensures old code paths are removed)

---

### Step 9: Error Kind Extensions

**Files:**
- `packages/design-pipeline/src/types/errors.ts` (modify)

**Description:**
Add the new error kinds required by the questioner session to the `ERROR_KINDS` array: `signoff_exhausted`, `turn_cap_exceeded`, and `lint_exhausted`. These are used by the session loop (Step 4) and lint-fixer (Step 6) when transitioning to the failed state. The existing error kinds remain unchanged.

**Dependencies:** None

**Test (write first):**
- Test that `ERROR_KINDS` includes `signoff_exhausted`, `turn_cap_exceeded`, and `lint_exhausted`.
- Test that `ErrorKind` type accepts the new error kind strings.
- Test that `createPipelineError()` works with the new error kinds.

**TLA+ Coverage:**
- State: error kinds `"signoff_exhausted"`, `"turn_cap_exceeded"`, `"lint_exhausted"`
- Invariant: `FailedHasErrorKind`

---

### Step 10: End-to-End Session Integration Test

**Files:**
- `packages/design-pipeline/src/stages/questioner-session.integration.test.ts` (create)

**Description:**
End-to-end integration test that wires together all components: the session loop, store, briefing writer, lint-fixer, and orchestrator completion gate. Uses a fully stubbed Anthropic SDK client and a mock readline interface. Exercises the complete lifecycle: questioning -> summary -> signoff -> briefing write -> lint double-pass -> stage dispatch. Verifies all liveness properties are satisfied in the integrated system. Also tests the failure paths: retry exhaustion, user abandon, turn cap, signoff exhaustion, and lint exhaustion.

**Dependencies:** Steps 4, 5, 6, 7

**Test (write first):**
- Test full happy path: 3 questions -> /summary -> confirm signoff -> briefing saved -> lint clean x2 -> stages dispatched. Assert final store state matches all safety invariants.
- Test retry exhaustion end-to-end: malformed responses exhaust retries. Assert store status "failed", error kind "retry_exhausted", partial briefing saved, waitFor resolved.
- Test user abandon end-to-end: SIGINT during questioning. Assert store status "failed", error kind "user_abandon", partial briefing saved, waitFor resolved.
- Test turn cap end-to-end: 50 questions without signoff. Assert store status "failed", error kind "turn_cap_exceeded", from "questioning" state only.
- Test signoff exhaustion end-to-end: LLM refuses signoff 3 times, CLI forces. Assert store status "completed" (CLIForcesSignoff is a success path).
- Test lint exhaustion end-to-end: lint fails after escalation. Assert appropriate terminal state with "lint_exhausted".
- Test waitFor resolves on every terminal path: assert `waitForResolved` is true for every test case above.

**TLA+ Coverage:**
- Property: `SessionTerminates`, `WaitForResolves`, `StagesEventuallyDispatch`
- Invariant: all 9 safety invariants verified in integrated context
- (This step verifies liveness properties end-to-end, complementing the unit tests in Steps 4/6/7)

---

## State Coverage Audit

### States
- `"questioning"` -- Steps 4, 10
- `"awaitingInput"` -- Steps 4, 10
- `"summaryPresented"` -- Steps 4, 10
- `"signingOff"` -- Steps 4, 10
- `"completed"` -- Steps 4, 5, 6, 7, 10
- `"failed"` -- Steps 4, 5, 6, 9, 10
- `"empty"` (artifact) -- Steps 1, 4
- `"partial"` (artifact) -- Steps 1, 4, 5
- `"complete"` (artifact) -- Steps 1, 4, 5
- Store statuses (`"idle"`, `"active"`, `"completed"`, `"failed"`) -- Steps 1, 4, 7, 10
- Error kinds (`"none"`, `"retry_exhausted"`, `"user_abandon"`, `"signoff_exhausted"`, `"turn_cap_exceeded"`, `"lint_exhausted"`) -- Steps 1, 4, 6, 9

### Transitions
- `AskQuestion` -- Step 4
- `UserAnswer` -- Step 4
- `UserRequestsSummary` -- Step 4
- `UserContinuesAfterSummary` -- Step 4
- `UserConfirmsSignoff` -- Step 4
- `LLMInitiatesSignoff` -- Steps 3, 4
- `LLMProducesSignoff` -- Step 4
- `LLMRefusesSignoff` -- Step 4
- `CLIForcesSignoff` -- Step 4
- `TurnCapExceeded` -- Step 4
- `LLMMalformedResponse` -- Step 4
- `RetryExhausted` -- Step 4
- `RetrySucceeds` -- Step 4
- `UserAbandons` -- Step 4
- `LintRunClean` -- Step 6
- `LintRunDirty` -- Step 6
- `LintEscalateToUser` -- Step 6
- `LintFailed` -- Step 6 (TLA+ review fix #2 -- new terminal transition)
- `DispatchStages` -- Step 7

### Safety Invariants
- `TypeOK` -- Step 1
- `StoreCompletedOnlyAfterSignoff` -- Steps 4, 10
- `RetryBounded` -- Steps 2, 4
- `SignoffAttemptsBounded` -- Steps 2, 4
- `TurnsBounded` -- Steps 2, 4
- `LintDoublePassRequired` -- Steps 6, 7
- `CompletedRequiresBriefing` -- Steps 4, 5
- `FailedHasErrorKind` -- Steps 4, 9
- `WaitForOnlyOnTerminal` -- Steps 4, 7
- `StagesOnlyAfterLintPass` -- Step 7

### Liveness Properties
- `SessionTerminates` -- Steps 3, 4, 10
- `WaitForResolves` -- Steps 4, 7, 10
- `StagesEventuallyDispatch` -- Steps 6, 7, 10

### TLA+ Review Fixes
- Fix #1 (lintCleanRuns reset on escalation) -- Step 6
- Fix #2 (LintFailed terminal / multiple escalations) -- Step 6
- Fix #3 (remove unused NumStages constant) -- N/A (implementation does not use NumStages; it was spec-only)
- Fix #4 (TurnCapExceeded only from "questioning") -- Step 4
- Fix #5 (WF_vars(LintRunClean) documented as assumption) -- Step 6 (non-interactive fallback), Step 10 (documented in integration tests)

All TLA+ states, transitions, and properties are covered by the implementation plan.

---

## Execution Tiers

### Tier 1: Foundation Types and Constants (all independent, no shared files)

These steps define the type system, constants, and error kinds that all subsequent steps depend on. They touch completely independent files and can be implemented in parallel.

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Questioner Session State Types and Zod Schemas |
| T2 | Step 9 | Error Kind Extensions |

### Tier 2: Configuration, Prompt, and Briefing Writer (depend on Tier 1 types)

These steps use the types from Tier 1 to build the configuration, prompt, and file writer. They touch independent files and can run in parallel.

| Task ID | Step | Title |
|---------|------|-------|
| T3 | Step 2 | Questioner Session Constants |
| T4 | Step 3 | Rich Questioner System Prompt |
| T5 | Step 5 | Briefing File Writer |

### Tier 3: Core Session Loop and Lint-Fixer (depend on Tier 2 outputs)

The session loop depends on types, config, and prompt. The lint-fixer depends on types and config. They touch independent files and can run in parallel.

| Task ID | Step | Title |
|---------|------|-------|
| T6 | Step 4 | Questioner Session Core Loop |
| T7 | Step 6 | Lint-Fixer Module |

### Tier 4: Orchestrator Wiring (depends on session loop and lint-fixer)

The orchestrator modification depends on both the session loop and lint-fixer being complete, as it wires them together and adds the feature flag branch. This is a blocker for the cleanup and integration test steps.

| Task ID | Step | Title |
|---------|------|-------|
| T8 | Step 7 | Orchestrator Feature Flag Branch |

### Tier 5: Cleanup and Integration (depends on orchestrator wiring)

Delete old code and run end-to-end integration tests. These can run in parallel since they touch different files (old questioner code vs. new integration test file).

| Task ID | Step | Title |
|---------|------|-------|
| T9 | Step 8 | Delete Old Questioner Code |
| T10 | Step 10 | End-to-End Session Integration Test |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Questioner Session State Types and Zod Schemas | 1 | typescript-writer | vitest-writer | None | Pure TypeScript types and Zod schemas -- domain logic with unit tests. |
| T2 | Error Kind Extensions | 1 | typescript-writer | vitest-writer | None | Extending existing type constants -- straightforward TS with unit tests. |
| T3 | Questioner Session Constants | 2 | typescript-writer | vitest-writer | T1 | Configuration factory with Zod validation -- pure TypeScript. |
| T4 | Rich Questioner System Prompt | 2 | typescript-writer | vitest-writer | T1 | String template construction -- pure function with content assertions. |
| T5 | Briefing File Writer | 2 | typescript-writer | vitest-writer | T1 | File I/O utility with markdown formatting -- TypeScript module with unit tests. |
| T6 | Questioner Session Core Loop | 3 | typescript-writer | vitest-writer | T3, T4 | Core state machine loop with injected SDK -- complex TypeScript logic needing thorough unit tests. |
| T7 | Lint-Fixer Module | 3 | typescript-writer | vitest-writer | T1, T3 | Retry loop with SDK injection and ESLint integration -- TypeScript module with mock-heavy unit tests. |
| T8 | Orchestrator Feature Flag Branch | 4 | typescript-writer | vitest-writer | T6, T7 | Modifying existing orchestrator wiring -- TypeScript with integration-level vitest tests. |
| T9 | Delete Old Questioner Code | 5 | typescript-writer | vitest-writer | T8 | Code removal and import cleanup -- TypeScript refactoring with regression tests. |
| T10 | End-to-End Session Integration Test | 5 | typescript-writer | vitest-writer | T8 | Full lifecycle integration test -- vitest with comprehensive stubbing across all components. |

### Blocker Analysis

- **T1** is a blocker: T3, T4, T5, T6, T7 all depend on it.
- **T3** is a blocker: T6, T7 depend on it.
- **T6** is a blocker: T8 depends on it.
- **T7** is a blocker: T8 depends on it.
- **T8** is a blocker: T9, T10 depend on it.

### File Overlap Validation

- Tier 1: `types/questioner-session.ts`, `schemas/questioner-session.ts`, `types/errors.ts` -- no overlap.
- Tier 2: `config/questioner-config.ts`, `prompts/questioner.ts`, `stages/briefing-writer.ts` -- no overlap.
- Tier 3: `stages/questioner-session.ts`, `stages/lint-fixer.ts` -- no overlap.
- Tier 4: `engine/orchestrator.ts`, `config/feature-flags.ts` -- no overlap with Tier 3.
- Tier 5: `stages/questioner.ts` (deletion), `stages/questioner-session.integration.test.ts` -- no overlap.

No file conflicts within any tier.
