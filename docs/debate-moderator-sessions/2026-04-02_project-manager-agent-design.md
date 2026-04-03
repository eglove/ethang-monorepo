# Debate Moderator Session — Project Manager Agent Design

**Date:** 2026-04-02
**Result:** CONSENSUS REACHED
**Rounds:** 3
**Experts:** expert-tdd, expert-continuous-delivery, expert-edge-cases, expert-ddd, expert-bdd

---

## Synthesis

### Agreed Recommendation

The project-manager agent design is sound in its core concept — decoupling task assignment and worktree management from the implementation writer — but the AGENT.md specification must be augmented with the following before implementation:

1. **Timeout constant:** Define an explicit timeout for agent sessions. A hung session must be detectable and trigger the failure path. This enables testing of the timeout scenario and prevents indefinite tier blocking.

2. **Input validation step:** Validate all inputs (implementation plan, pipeline context, worktree base path, constants) before Stage 6 begins. Fail fast with a clear diagnostic message rather than failing mid-execution with cryptic errors.

3. **Typed execution result model:** Replace ad-hoc status strings in pipeline-state.md with a typed domain model (e.g., `TaskCompleted`, `TaskFailed(reason)`, `TierCompleted`, `PipelineHalted(reason)`). This serves testability (expert-tdd), observability (expert-bdd), and domain correctness (expert-ddd) simultaneously.

4. **Explicit verification criteria:** Define what "verification" means for inter-tier checks — is it compilation, linting, test pass rate, or all three? Each criterion needs a pass/fail contract.

5. **Error classification criteria:** The distinction between "logic error" (recover with inherited context) and "corruption" (full reset) must have explicit classification rules. Misclassification causes incorrect recovery behavior.

6. **Merge strategy and timing:** Specify whether merges happen per-task, per-tier, or deferred until all tiers complete. Each choice has different failure-mode implications. If per-task, define a rollback strategy for partial merges.

7. **Concurrent write protection:** Multiple agents writing to pipeline-state.md concurrently risks file corruption. Define a serialization mechanism (e.g., single-writer pattern, atomic writes, or lock file).

8. **Domain service interfaces:** Git worktree operations and agent dispatch should be modeled as injectable domain service interfaces. This makes the project-manager unit-testable with fakes and enables dry-run validation.

9. **Developer-observable error states:** All error states (TIER_ALL_FAILED, VERIFICATION_FAILED, etc.) must include which tier, which tasks, and the underlying error cause — not just a technical code.

10. **Success scenario:** Define what "done" looks like from the developer's perspective. The integration branch should contain all expected changes, and the pipeline state should reflect complete tier execution.

---

### Expert Final Positions

**expert-tdd**
Position: Conditionally supportive — the design is testable if the recommended additions are incorporated.
Key reasoning: The project-manager's orchestration logic (dispatch ordering, error recovery, tier management) is testable in principle, but requires explicit test seams. Domain service interfaces for git operations and agent dispatch enable unit testing with fakes. The timeout constant, input validation step, and typed execution result model provide the test contracts needed for red-green-refactor discipline. The "logic error vs. corruption" classification gap is the most actionable missing piece — each recovery path needs its own test scenarios.
Endorsed: expert-edge-cases (timeout and concurrent write concerns), expert-bdd (input validation and success scenarios), expert-ddd (typed domain model and domain service extraction), expert-continuous-delivery (merge timing specification).

**expert-continuous-delivery**
Position: Supportive with CD-specific additions required.
Key reasoning: Parallel worktree execution is a valid approach to reducing batch size, but the integration branch becomes a long-lived feature branch — a CD anti-pattern if execution takes significant time. The merge timing question (per-task vs. per-tier vs. deferred) is the most impactful design decision for CD safety. Per-task merges need a rollback strategy; deferred merges need a holding strategy. Domain service extraction for git operations enables dry-run validation, a valuable CD safety mechanism. Concurrent state file corruption destroys the audit trail needed for rollback and diagnosis.
Endorsed: expert-edge-cases (concurrent state writes and partial merge scenarios), expert-ddd (domain service extraction for dry-run validation), expert-tdd (error classification criteria).

**expert-edge-cases**
Position: The briefing covers obvious failure modes but has significant gaps in concurrent execution and state consistency.
Key reasoning: The error state taxonomy is a good start but incomplete. Missing: timeout for agent sessions (blocks tier indefinitely), concurrent writes to pipeline-state.md (file corruption), partial merge with no rollback (branch in partially-applied state), pipeline interruption between worktree creation and merge (orphaned directories), empty/malformed output from "successful" sessions (ambiguous success), and error classification ambiguity (incorrect recovery path). All are addressable in the AGENT.md specification.
Endorsed: expert-tdd (error classification criteria), expert-bdd (developer-observable error states), expert-continuous-delivery (merge timing has direct failure-mode implications).

**expert-ddd**
Position: Domain boundaries are reasonably clear but need refinement in responsibility split and state modeling.
Key reasoning: The project-manager is an application service — it coordinates work but should contain no domain logic. Git worktree operations and agent dispatch should be domain service interfaces, making the project-manager a pure coordination layer testable with fakes. The responsibility split with the pipeline orchestrator needs clarification: who owns the integration branch state? The merge timing question determines this. The pipeline-state.md file should be a projection from a typed domain model, not ad-hoc status strings. The name "project-manager" is a generic technical-layer name; the pipeline's ubiquitous language should produce a more descriptive name.
Endorsed: expert-tdd (domain service extraction enables testability), expert-continuous-delivery (merge timing is a bounded context ownership question), expert-bdd (typed domain model produces observable behavior naturally).

**expert-bdd**
Position: The briefing describes internal mechanics well but lacks user-observable behavior specifications.
Key reasoning: The project-manager has no direct user interaction, but its behavior is observable through the pipeline state file and the resulting code branch. The briefing needs Given/When/Then scenarios for: input validation (malformed plan fails fast), successful execution (all tiers complete, branch contains expected changes), tier failure (descriptive error with tier/task/cause), and partial failure (some tasks succeed, others fail). Error states must include developer-readable information, not just technical codes. The intervention model (pause/inspect/abort during Stage 6) is a consideration but may be out of scope for an automated pipeline.
Endorsed: expert-tdd (input validation enables fast failure), expert-edge-cases (partial failure handling is essential for developer trust), expert-ddd (typed domain model makes the state file a behavior log).

---

### Unresolved Dissents
_none — consensus reached_

---

## Round Transcripts

### Round 1

**expert-tdd**

Position: Conditionally supportive, with significant concerns about testability of the agent dispatch and verification model.

Reasoning: The project-manager agent is fundamentally an orchestrator — it dispatches other agents, manages git worktrees, and tracks state. From a TDD perspective, the critical question is: how do we verify this agent behaves correctly without running the full pipeline? The briefing mentions "inter-tier verification" but does not specify what that verification looks like as a testable contract. If verification means "did the writer agents produce code that compiles and passes their own tests," that is an integration-level check, not a unit-level guarantee. The design needs a clear test boundary: the project-manager's own behavior (pair selection, dispatch ordering, error recovery) must be testable in isolation with mocked agent dispatch.

The error recovery model is the most testable part of this design — bounded retries (MaxReDispatches) give us clear test scenarios: dispatch fails N times, succeeds on N+1; all dispatches fail, halt with TIER_ALL_FAILED. These are excellent red-green-refactor candidates. However, the briefing does not mention how the project-manager itself is tested before being trusted in the pipeline. An AGENT.md file is documentation, not executable behavior. The actual orchestration logic lives in the pipeline orchestrator or in the project-manager's execution — and that logic needs a test suite.

Objections:
- [testability] The briefing describes behavior but no test strategy. Who writes the tests for the project-manager agent itself? If the project-manager is "just an AGENT.md," the orchestration logic is in the pipeline orchestrator, which means the pipeline orchestrator's test surface grows significantly.
- [verification gap] "Inter-tier verification fails" halts with VERIFICATION_FAILED, but the verification criteria are undefined. Is it compilation? Linting? Test pass rate? Without explicit verification contracts, each task's "success" is ambiguous and untestable.
- [mocking risk] Agent dispatch via the Agent tool is inherently side-effectful. Testing the project-manager requires either mocking the Agent tool (risking over-mocking) or running expensive integration tests. The design should specify a test seam.

Endorsements:
- None

---

**expert-continuous-delivery**

Position: Supportive of the concept, concerned about git worktree lifecycle and integration risk.

Reasoning: The project-manager introduces parallel worktree execution into the pipeline. From a CD perspective, this is both a benefit and a risk. The benefit: parallel worktrees mean tasks can be developed independently and merged incrementally, reducing batch size. The risk: worktree management is a coordination problem that can easily produce integration hell if merge order, conflict resolution, and branch state are not carefully managed. The briefing mentions merge conflict handling with "bounded retries" and a "fresh pair," but does not specify the merge strategy (squash, rebase, merge-commit) or what happens when multiple worktrees modify the same files.

The integration branch (`design-pipeline/<topic-slug>`) is a single branch accumulating all task results. This is effectively a long-lived feature branch — a CD anti-pattern if the tier execution takes significant time. Each task should ideally integrate back to the integration branch atomically, so that if task 3 of 5 fails, tasks 1 and 2 are already safely merged and the branch is in a known-good state. The briefing does not clarify whether merges happen per-task or per-tier.

Additionally, the pipeline has no mention of rollback. If Stage 6 produces a broken branch, can the pipeline reset to the pre-execution state? The "integration branch already exists from prior run" edge case is noted, but the resolution strategy (overwrite, append, error) is not specified.

Objections:
- [integration branch risk] A single integration branch accumulating all tier results is a long-lived feature branch. If execution takes time, this becomes integration debt. Per-task atomic merges would be safer.
- [no rollback strategy] If Stage 6 produces a broken branch, there is no defined rollback path. The pipeline should be able to reset to the pre-execution commit.
- [merge strategy unspecified] No merge strategy (squash/rebase/merge-commit) is defined. Different strategies have different implications for history, bisectability, and conflict resolution.

Endorsements:
- None

---

**expert-edge-cases**

Position: The briefing covers the obvious failure modes but has significant gaps in concurrent execution and state consistency.

Reasoning: Let me systematically hunt for edge cases across the briefing's claims.

The error states cover session failure, tier failure, merge conflict, verification failure, and worktree creation failure. These are good but incomplete. What about: (1) a task session succeeds but produces no output — the agent returns empty or malformed results; (2) a task session hangs or times out — the briefing has no timeout constant; (3) partial worktree creation — the worktree directory is created but branch checkout fails, leaving a dangling directory; (4) concurrent worktrees competing for disk I/O or hitting file descriptor limits; (5) the pipeline-state.md file being written to concurrently by multiple agent sessions, causing write conflicts.

The edge case "task with zero dependencies placed in later tier" is listed but the handling is not specified. Should the project-manager reassign it to an earlier tier? Ignore it? Treat it as a task-graph defect?

The "agent roster changes mid-pipeline" edge case is noted but the impact is unclear. If a writer agent is removed from the roster between rounds, does the project-manager need a fallback? What if the only available pair for a task type is no longer available?

Edge Cases Found:
- [boundary] Zero tasks in implementation plan — listed as edge case but handling not specified (no-op? skip Stage 6?)
- [boundary] Task with zero deps in later tier — listed but resolution strategy absent
- [concurrency] Multiple agents writing to pipeline-state.md simultaneously — file corruption or lost updates
- [concurrency] Worktree disk I/O contention under MaxConcurrent — degraded performance or failures
- [partial failure] Worktree created but branch checkout fails — orphaned directory
- [partial failure] Agent session succeeds but returns empty/malformed output — is this a "success" or "failure"?
- [timeout] No timeout constant defined for agent sessions — a hung session blocks the tier indefinitely
- [sequence] Agent dispatch order within a tier — does order matter if tasks are independent?
- [scale] MaxConcurrent set higher than available CPU/memory — resource exhaustion

Objections:
- [missing timeout] No timeout for agent sessions. A hung session blocks tier completion indefinitely.
- [concurrent state writes] Multiple agents updating pipeline-state.md concurrently risks file corruption.
- [ambiguous success criteria] A session that "succeeds" but produces no code or invalid output is not addressed.

Endorsements:
- None

---

**expert-ddd**

Position: The domain boundaries are reasonably clear, but the "project-manager" naming and responsibility scope need refinement.

Reasoning: From a DDD perspective, the project-manager agent occupies the application service layer — it coordinates work but contains no domain logic. This is appropriate: it dispatches, tracks state, and manages git operations. The briefing correctly places design decisions, code writing, and TLA+ specification out of scope. However, the name "project-manager" is a generic technical-layer name, not a domain concept. In the domain of this pipeline, this agent is a "Task Dispatcher" or "Execution Coordinator" — names that reflect what it actually does in the pipeline's ubiquitous language.

More importantly, the boundary between the project-manager and the pipeline orchestrator is ambiguous. The briefing says the project-manager is "dispatched by the design pipeline orchestrator" and "returns control to the pipeline orchestrator." But the project-manager also "manages git worktrees" and "updates pipeline state." These are responsibilities that overlap with what a pipeline orchestrator would naturally do. Either the project-manager is a sub-orchestrator (in which case the git worktree management is a domain service it delegates to), or the pipeline orchestrator should retain git management and the project-manager should only handle agent dispatch.

The error state taxonomy is a good domain model: TIER_ALL_FAILED, VERIFICATION_FAILED, and descriptive worktree errors are distinct failure modes with different recovery paths. This suggests a proper Result/Either type for execution outcomes.

Objections:
- [naming] "project-manager" is a generic technical name. The pipeline's ubiquitous language should produce a name like "task-dispatcher" or "execution-coordinator."
- [boundary ambiguity] The split between project-manager and pipeline orchestrator responsibilities is unclear. Git worktree management overlaps with orchestration concerns.
- [missing domain service] Git operations (worktree create, merge, cleanup) should be modeled as a domain service interface, not inline behavior. This makes the project-manager testable and the git operations replaceable.

Endorsements:
- None

---

**expert-bdd**

Position: The briefing describes internal mechanics well but lacks user-observable behavior specifications.

Reasoning: From a BDD perspective, the project-manager agent has no direct user interaction — it is an internal orchestrator. However, its behavior is observable through the pipeline state file and the resulting code branch. The question is: can a stakeholder (the developer running the pipeline) verify that the project-manager behaved correctly without reading its internal state?

The answer is partially yes: the developer can check that all tasks were dispatched, that the integration branch contains the expected code, and that the pipeline state file reflects accurate progress. But the briefing does not define what "correct" looks like from the outside. For example: "Given an implementation plan with 3 tasks in 2 tiers, when Stage 6 executes, then the integration branch contains code changes for all 3 tasks and the pipeline state shows all tiers complete." This is the kind of scenario that makes the project-manager's behavior verifiable.

The error states are described in technical terms (TIER_ALL_FAILED, VERIFICATION_FAILED) rather than observable outcomes. A developer seeing TIER_ALL_FAILED needs to know: what tier? Which tasks failed? What was the error? The briefing says "halt with descriptive error" for worktree failures but does not extend this descriptiveness to all error states.

Additionally, the BDD lens asks: what is the "given" state before Stage 6? The briefing says it requires the implementation plan, pipeline context, integration branch name, worktree base path, and constants. But are these validated before execution? A scenario where the implementation plan is malformed should produce a clear error, not a cryptic failure mid-execution.

Objections:
- [observability gap] Error states use technical codes (TIER_ALL_FAILED) without specifying what information is surfaced to the developer. Error reports should include which tier, which tasks, and the underlying error.
- [missing preconditions] No validation scenario for inputs before Stage 6 begins. A malformed implementation plan should fail fast with a clear message.
- [no success scenario] The briefing defines failure modes but not the observable success criteria. What does "done" look like from the developer's perspective?

Endorsements:
- None

---

### Round 2

**expert-tdd**

Position: Maintaining conditional support. Endorse expert-edge-cases on timeout and concurrent writes; endorse expert-bdd on input validation.

Reasoning: After reviewing other experts' positions, several concerns reinforce my original testability objection. expert-edge-cases identified the missing timeout — this is directly testable: a session exceeding the timeout should be detectable and trigger the failure path. expert-bdd's point about input validation before execution aligns with my concern about verification criteria: both are asking for explicit contracts at the boundaries. The project-manager needs a "validate inputs" step that can be tested independently of dispatch logic.

I also endorse expert-ddd's point about git operations as a domain service. If git worktree management is extracted behind an interface, the project-manager can be unit-tested with a fake git service. This directly addresses my mocking concern — instead of mocking the Agent tool and git commands, we inject test doubles.

New objection: The briefing mentions "inherit context on logic error, full reset on corruption" for session failure recovery. This distinction between "logic error" and "corruption" is undefined. How does the project-manager classify an error as one vs. the other? This classification needs explicit criteria, and each path needs its own test scenarios.

Objections:
- [testability] No test strategy for the project-manager itself (maintained from Round 1)
- [verification gap] Verification criteria undefined (maintained from Round 1)
- [error classification] "Logic error" vs. "corruption" distinction is undefined — no criteria for choosing recovery path

Endorsements:
- expert-edge-cases: Missing timeout is a critical gap that makes the system untestable for the timeout failure path. Adding a timeout constant enables red-green testing of the timeout scenario.
- expert-bdd: Input validation before execution is essential. Without it, the project-manager fails mid-execution with cryptic errors instead of failing fast with clear diagnostics.
- expert-ddd: Extracting git operations behind a domain service interface makes the project-manager unit-testable without mocking infrastructure.

---

**expert-continuous-delivery**

Position: Maintaining concerns. Endorse expert-edge-cases on concurrent state writes and expert-ddd on domain service extraction.

Reasoning: Round 2 reinforces my original concerns. expert-edge-cases' point about concurrent writes to pipeline-state.md is a direct CD concern — if the state file is corrupted, the pipeline loses its execution record, making rollback and diagnosis impossible. This compounds my rollback objection: without a reliable state file, you cannot even determine what state to roll back to.

expert-ddd's suggestion to extract git operations as a domain service is also a CD win. If git operations are behind an interface, the pipeline can use a dry-run mode for validation before actual execution — a common CD pattern for risky operations.

I maintain my original objections. The integration branch risk is the most serious: if the project-manager runs 5 tiers sequentially and tier 3 fails, tiers 1 and 2 have already merged their changes. The integration branch is now in a partially-applied state. The briefing should specify whether merges are deferred until all tiers succeed (safer but slower) or applied per-tier (faster but leaves partial state on failure).

New objection: Merge timing — unclear whether merges happen per-task, per-tier, or deferred until all tiers complete.

Objections:
- [integration branch risk] Single branch accumulating all results is a long-lived feature branch (maintained)
- [no rollback strategy] No defined path to reset to pre-execution state (maintained)
- [merge strategy unspecified] No merge strategy defined (maintained)
- [merge timing] Unclear whether merges happen per-task, per-tier, or deferred until all tiers complete

Endorsements:
- expert-edge-cases: Concurrent state writes to pipeline-state.md risk corruption, which destroys the execution audit trail needed for rollback and diagnosis.
- expert-ddd: Git operations as a domain service enables dry-run validation, a valuable CD safety mechanism.

---

**expert-edge-cases**

Position: Maintaining all original concerns. Endorse expert-tdd on error classification ambiguity and expert-bdd on observability.

Reasoning: Round 2 reveals convergence on several points. expert-tdd identified the "logic error vs. corruption" classification gap — this is a critical edge case I missed. The recovery behavior diverges significantly (inherit context vs. full reset), so misclassification leads to either lost context or carrying forward corrupted state.

expert-bdd's observability concern maps directly to my "ambiguous success criteria" objection. If a developer cannot tell what succeeded and what failed from the error output, the error handling is functionally absent regardless of the internal state machine.

I also note that expert-continuous-delivery's merge timing question (per-task vs. per-tier vs. deferred) is an edge case I should have flagged: if merges are per-task and a later task fails verification, the earlier merged tasks are already on the integration branch. This is a partial failure scenario with no recovery path.

New edge case: [sequence] If the pipeline is interrupted (process crash, agent session timeout) between worktree creation and merge, the worktree directory persists but the pipeline state may not reflect it. On restart, the project-manager may try to recreate an existing worktree or skip a needed one.

Objections:
- [missing timeout] No timeout for agent sessions (maintained)
- [concurrent state writes] Multiple agents writing to pipeline-state.md risks corruption (maintained)
- [ambiguous success criteria] Session "success" with empty/malformed output not addressed (maintained)
- [error classification] "Logic error" vs. "corruption" recovery paths lack classification criteria (endorsed from expert-tdd)
- [partial merge] Per-task merges with no rollback on later failure leave the branch in a partially-applied state

Endorsements:
- expert-tdd: The "logic error vs. corruption" distinction needs explicit criteria. Misclassification causes incorrect recovery behavior.
- expert-bdd: Error states must be developer-observable. Technical error codes without context are useless for diagnosis.
- expert-continuous-delivery: Merge timing (per-task vs. per-tier vs. deferred) is a critical design decision with failure-mode implications.

---

**expert-ddd**

Position: Maintaining boundary concerns. Endorse expert-tdd on testability through domain service extraction and expert-continuous-delivery on merge timing.

Reasoning: Round 2 strengthens my original position. The domain service extraction I proposed directly enables expert-tdd's testability requirement — if git operations and agent dispatch are behind interfaces, the project-manager becomes a pure coordination layer that can be tested with fakes. This is the DDD application service pattern: the application service coordinates, domain services perform the work.

expert-continuous-delivery's merge timing question reveals a deeper boundary issue: who decides when to merge? If the project-manager merges per-task, it owns the integration branch state. If merges are deferred, the pipeline orchestrator owns it. This is not just a CD concern — it is a DDD bounded context question. The integration branch state belongs to one context, and the decision about merge timing determines which context owns it.

I also endorse expert-bdd's observability concern from a DDD angle: the pipeline-state.md file is the project-manager's published state. It should be a projection of the project-manager's internal domain model, not an ad-hoc collection of status strings. A proper domain model for execution state (e.g., `ExecutionResult` with typed outcomes) would naturally produce the observability that expert-bdd wants.

New objection: pipeline-state.md updates should be projections from a typed domain model, not ad-hoc strings.

Objections:
- [naming] "project-manager" is generic; should reflect pipeline ubiquitous language (maintained)
- [boundary ambiguity] Project-manager vs. pipeline orchestrator responsibility split unclear (maintained)
- [missing domain service] Git operations should be a domain service interface (maintained)
- [state model] pipeline-state.md updates should be projections from a typed domain model, not ad-hoc strings

Endorsements:
- expert-tdd: Domain service extraction enables unit testing with fakes, directly addressing the testability gap.
- expert-continuous-delivery: Merge timing determines which bounded context owns the integration branch state — this is a domain boundary question, not just a CD concern.
- expert-bdd: A typed domain model for execution results naturally produces the developer-observable error states BDD requires.

---

**expert-bdd**

Position: Maintaining observability concerns. Endorse expert-edge-cases on partial failure and expert-tdd on input validation.

Reasoning: Round 2 reveals strong convergence. The project-manager's behavior can now be described more precisely through the lens of other experts' contributions.

Given an implementation plan with N tasks across M tiers, when Stage 6 executes, then each task is dispatched to an agent pair, worktrees are created and managed, and the integration branch contains all successfully merged changes. If any task fails beyond the retry limit, then the pipeline halts with a descriptive error that identifies the failed tier, the failed tasks, and the underlying cause.

This scenario incorporates expert-edge-cases' partial failure concern (what happens when some tasks succeed and others fail) and expert-tdd's input validation concern (the "given" must be validated before "when").

I also endorse expert-ddd's domain model suggestion: a typed `ExecutionResult` with outcomes like `TaskCompleted`, `TaskFailed(reason)`, `TierCompleted`, `PipelineHalted(reason)` would make the pipeline-state.md file a readable behavior log rather than a technical dump. This satisfies both the BDD need for observable behavior and the DDD need for a proper domain model.

New objection: The briefing does not specify what happens when the developer intervenes mid-execution. The pipeline has a "confirmation gate" before Stage 6, but what about during Stage 6? Can the developer pause, inspect a worktree, or abort? These are user-visible behaviors that need scenarios.

Objections:
- [observability gap] Error states need developer-readable information, not just technical codes (maintained)
- [missing preconditions] No input validation before execution (maintained)
- [no success scenario] Observable success criteria not defined (maintained)
- [no intervention model] No scenarios for developer pause/inspect/abort during Stage 6

Endorsements:
- expert-edge-cases: Partial failure (some tasks succeed, others fail) needs explicit handling. The current briefing only covers "all tasks in tier fail," not "some tasks in tier fail."
- expert-tdd: Input validation before execution is essential for fast failure with clear diagnostics.
- expert-ddd: A typed domain model for execution results would naturally produce observable, developer-friendly state output.

---

### Round 3

**expert-tdd**

Position: Converging. The core gaps are now well-understood and actionable.

Reasoning: Round 3 shows strong convergence. The key gaps are: (1) no test strategy, (2) undefined verification criteria, (3) error classification ambiguity, (4) missing timeout, (5) concurrent state writes, (6) merge timing unspecified, (7) no input validation, (8) no success/observability scenarios. All of these are addressable in the AGENT.md specification.

I no longer have new objections. The existing ones are sufficient to guide the AGENT.md author. The most critical additions to the briefing are: a timeout constant, input validation step, typed execution result model, and explicit verification criteria. These are all specifiable in the AGENT.md without changing the fundamental design.

Objections: (no new objections — maintaining Round 2 list)
- [testability] No test strategy for the project-manager itself
- [verification gap] Verification criteria undefined
- [error classification] "Logic error" vs. "corruption" distinction undefined

Endorsements:
- expert-edge-cases: Timeout and concurrent write concerns are essential additions to the briefing.
- expert-bdd: Input validation and success scenarios make the project-manager's behavior verifiable.
- expert-ddd: Typed domain model for execution results serves both testability and observability.
- expert-continuous-delivery: Merge timing needs explicit specification for CD safety.

---

**expert-continuous-delivery**

Position: Converging. Core gaps identified and actionable.

Reasoning: The convergence is clear. The briefing needs: timeout constant, merge strategy and timing specification, rollback capability, concurrent write protection for pipeline-state.md, and input validation. These are all specifiable additions.

I no longer have new objections. The merge timing question is the most impactful for CD: if merges are per-task, the pipeline needs a rollback strategy for partial merges. If deferred, the pipeline needs a strategy for holding changes without integration. The AGENT.md should specify which approach is chosen and why.

Objections: (no new — maintaining Round 2)
- [integration branch risk] Long-lived feature branch pattern
- [no rollback strategy] No reset to pre-execution state
- [merge strategy unspecified] No merge strategy defined
- [merge timing] Per-task vs. per-tier vs. deferred unspecified

Endorsements:
- expert-tdd: Error classification criteria are needed for correct recovery behavior.
- expert-edge-cases: Concurrent state writes and partial merge scenarios are real risks.
- expert-ddd: Domain service extraction for git operations enables dry-run validation.

---

**expert-edge-cases**

Position: Converging. The edge case landscape is well-mapped.

Reasoning: Round 3 confirms the edge case landscape. The briefing's error states are a good start but need expansion: timeout, concurrent writes, partial merge, pipeline interruption, error classification, and empty/malformed output handling. All are addressable.

No new edge cases of significance. The existing list is comprehensive enough to guide the AGENT.md author.

Objections: (no new — maintaining Round 2)
- [missing timeout] No timeout for agent sessions
- [concurrent state writes] Multiple agents writing to pipeline-state.md
- [ambiguous success criteria] Session success with empty/malformed output
- [error classification] "Logic error" vs. "corruption" undefined
- [partial merge] Per-task merges with no rollback on later failure

Endorsements:
- expert-tdd: Error classification criteria are essential for correct recovery.
- expert-continuous-delivery: Merge timing has direct failure-mode implications.
- expert-bdd: Developer-observable error states are non-negotiable.

---

**expert-ddd**

Position: Converging. Domain boundaries and model needs are clear.

Reasoning: The convergence across all experts points to a clear set of AGENT.md additions: typed execution result model, domain service interfaces for git and agent dispatch, input validation step, and explicit responsibility split with the pipeline orchestrator.

No new objections. The naming concern ("project-manager" vs. a domain-specific name) is a stylistic preference that the AGENT.md author can decide. The structural concerns (domain services, typed state model) are the substantive ones.

Objections: (no new — maintaining Round 2)
- [naming] "project-manager" is generic
- [boundary ambiguity] Project-manager vs. pipeline orchestrator split unclear
- [missing domain service] Git operations should be a domain service interface
- [state model] pipeline-state.md should be projections from typed domain model

Endorsements:
- expert-tdd: Domain service extraction enables testability.
- expert-continuous-delivery: Merge timing is a bounded context ownership question.
- expert-bdd: Typed domain model produces observable behavior naturally.

---

**expert-bdd**

Position: Converging. Behavior scenarios are well-defined.

Reasoning: Round 3 confirms the behavior gaps. The project-manager needs: input validation scenario, success scenario, failure scenarios with developer-readable output, and intervention scenarios (pause/inspect/abort). These can all be written as Given/When/Then scenarios in the AGENT.md.

No new objections. The intervention model (pause/inspect/abort) is a nice-to-have that may be out of scope for an automated pipeline. I will note it as a consideration but not a blocker.

Objections: (no new — maintaining Round 2)
- [observability gap] Error states need developer-readable information
- [missing preconditions] No input validation before execution
- [no success scenario] Observable success criteria not defined
- [no intervention model] No pause/inspect/abort scenarios (downgraded to consideration)

Endorsements:
- expert-tdd: Input validation enables fast failure with clear diagnostics.
- expert-edge-cases: Partial failure handling is essential for developer trust.
- expert-ddd: Typed domain model makes the state file a behavior log.

---

## Metadata

- **Date:** 2026-04-02
- **Topic:** project-manager-agent-design
- **Experts selected:** expert-tdd, expert-continuous-delivery, expert-edge-cases, expert-ddd, expert-bdd
- **Round count:** 3
- **Result status:** CONSENSUS REACHED
