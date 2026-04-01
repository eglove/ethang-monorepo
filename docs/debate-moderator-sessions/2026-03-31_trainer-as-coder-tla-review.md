# Debate Session -- TLA+ Spec Review: Trainer as Code Writer

**Date:** 2026-03-31
**Topic:** Review of TLA+ specification `TrainerAsCoder.tla` for the trainer-as-coder design
**Context:** Stage 4 of the design pipeline -- expert review of the TLA+ spec produced in Stage 3
**Experts:** expert-tdd, expert-ddd, expert-edge-cases, expert-continuous-delivery
**Rounds:** 2
**Result:** CONSENSUS REACHED

**Artifacts reviewed:**
- Briefing: `docs/questioner-sessions/2026-03-31_trainer-as-coder.md`
- Design consensus: `docs/debate-moderator-sessions/2026-03-31_trainer-as-coder-design.md`
- TLA+ spec: `docs/tla-specs/trainer-as-coder/TrainerAsCoder.tla`
- TLC config: `docs/tla-specs/trainer-as-coder/MC.cfg`
- Model-check wrapper: `docs/tla-specs/trainer-as-coder/MC.tla`
- README with results: `docs/tla-specs/trainer-as-coder/README.md`

---

## Round 1

### expert-tdd

Position: The TLA+ spec faithfully models the TDD ping-pong lifecycle and correctly enforces that no step completes without at least one red-green-refactor cycle. The contract validation ordering -- input then output for trainer-writer steps -- is correctly modeled. Two structural concerns with how the spec models the TDD cycle.

Reasoning:
The spec's StepStates enumeration (UNASSIGNED -> ASSIGNED -> HANDSHAKE -> RED -> CONTRACT_VALIDATE -> GREEN -> REFACTOR -> STEP_COMPLETE/STEP_FAILED) accurately captures the Stage 6 ping-pong protocol. The `CompletionRequiresTDD` invariant (S5) ensures that `tddCycle[s] >= 1` for any completed step, which is the formal statement of "no code without a failing test." The `TrainerContractRequired` invariant (S1) correctly demands both `inputContractValid` and `outputContractValid` for trainer-writer steps before reaching STEP_COMPLETE. This directly maps to the design consensus requirement for dual contracts.

However, the RED -> CONTRACT_VALIDATE transition in `RunContractValidation` is immediate -- there is no intermediate state representing "implementation written." In the real TDD cycle, RED means "failing test exists," then the developer writes the implementation, then the test is run. The spec collapses "write implementation" and "run contract validation" into one transition. This is acceptable as an abstraction -- TLA+ specs need not model every sub-step -- but it means the spec does not distinguish between "wrote a bad test that cannot be satisfied" and "wrote a good test but bad implementation." Both look like CONTRACT_VALIDATE -> FAIL -> HANDSHAKE. If the intent is to model retry semantics, this matters: a bad test should loop to RED (rewrite the test), not to HANDSHAKE (full restart).

The `AnotherCycle` action (REFACTOR -> HANDSHAKE when `tddCycle < MaxTDDCycles`) models the "refactor reveals need for another cycle" case. But notice: `WriteFailingTest` increments `tddCycle`, so re-entering from REFACTOR via HANDSHAKE will increment `tddCycle` again in the next `WriteFailingTest` call. This is correct -- each full cycle is counted. However, `ContractFails` sends the step back to HANDSHAKE without incrementing `tddCycle`, meaning a contract failure does not consume a TDD cycle. This is a design choice worth calling out: contract failures are "free" retries bounded only by `MaxContractRetries`, while TDD cycle re-entries are bounded by `MaxTDDCycles`. The spec enforces both bounds independently, which matches the design (bounded retries at contract level, bounded cycles at TDD level).

The `WF_vars(Next)` fairness condition in the Spec ensures liveness -- every enabled action eventually fires. Combined with the bounded counters (`MaxTDDCycles`, `MaxContractRetries`), this guarantees termination. The liveness properties L1 (StepTerminates), L2 (PhasesComplete), and L3 (PipelineTerminates) all passed TLC with 7.8M states. This is solid.

Objections:
- The spec does not model the distinction between "test failure" (bad implementation) and "test defect" (bad test). Both route through CONTRACT_VALIDATE -> FAIL -> HANDSHAKE. In the real TDD cycle, a defective test should be corrected at the RED phase, not restart the full handshake. This is a modeling simplification that may mask a real failure mode: an infinite loop where a bad test keeps failing and retrying without fixing the test itself. The `MaxContractRetries` bound prevents true infinite loops, but the retry semantics are imprecise.
- `ContractFails` routes to HANDSHAKE but `contractRetries` is only reset in `WriteFailingTest`. This means if a contract fails, the step goes to HANDSHAKE, then to RED (where `contractRetries` is reset to 0), then back to CONTRACT_VALIDATE. The retries counter effectively resets on every TDD cycle. Is this intentional? It means a step could have `MaxTDDCycles * MaxContractRetries` total contract validation attempts, not just `MaxContractRetries`. With MC.cfg values (MaxTDDCycles=2, MaxContractRetries=1), that is 2 total attempts per cycle, 4 total across all cycles. This is likely fine, but the README does not document this interaction.

Endorsements:
None (first round)

---

### expert-ddd

Position: The spec correctly separates the two bounded contexts -- the step lifecycle (TDD ping-pong within a single code writer's work) and the implementation phase ordering (the deployment sequence across the codebase). The variable partitioning reflects proper aggregate boundaries. One naming concern and one missing domain concept.

Reasoning:
The spec partitions its variables into two clean groups: per-step state (`stepState`, `assignedWriter`, `tddCycle`, `contractRetries`, `inputContractValid`, `outputContractValid`) and pipeline-wide state (`implPhase`, `questionerCanDispatchTrainer`, `pipelineComplete`). This directly mirrors the DDD structure from the design consensus: each step is an Aggregate with its own lifecycle, while the implementation phases are a separate Aggregate governing the deployment sequence. The UNCHANGED clauses in every action respect these boundaries -- step actions never touch `implPhase`, and phase actions never touch step variables. This is correct aggregate isolation.

The `WriterTypes` enumeration uses the ubiquitous language from the pipeline: `hono_writer`, `typescript_writer`, `vitest_writer`, `trainer_writer`. These match the names used in the design consensus and the implementation-writer's task assignment table. The `ImplPhases` enumeration maps directly to the four-step deployment order from the debate synthesis refinement #5. This is good domain modeling -- the spec speaks the language of the pipeline.

However, `QuestionerTargets == {"debate_moderator", "tla_writer", "trainer"}` is declared as a constant set but never used in any action or invariant. It appears to be documentation-as-code (showing what the questioner's dispatch table contains), but it is dead code in the spec. Either it should be removed, or it should be used in an invariant that checks the questioner's dispatch behavior. Dead constants in a TLA+ spec are misleading -- they suggest a property is being verified when it is not.

The `inputContractValid` and `outputContractValid` flags are set atomically in `ContractPasses` (both flip to TRUE in the same action for trainer-writer steps). In the design consensus, these are described as separate Zod schemas -- the input contract and the output contract. The spec does not model the possibility that input validation passes but output validation fails (or vice versa). This is a missing domain distinction. If the real implementation runs `InputSchema.parse()` and `OutputSchema.parse()` sequentially, and the first passes but the second fails, the system is in a state the spec cannot represent. The spec treats dual contract validation as atomic. This may be an acceptable abstraction, but it elides a real intermediate state.

Objections:
- `QuestionerTargets` is declared but never referenced in any action, guard, or invariant. It is dead code. Either use it (e.g., in an invariant asserting that trainer is absent from the set after phase D) or remove it. Dead constants in a formal spec are worse than dead code in production -- they imply a property is being checked when it is not.
- The dual contract validation (input + output) is modeled as atomic in `ContractPasses`. The spec cannot represent a state where one contract passes and the other fails. If the implementation validates them sequentially, this is a missing intermediate state. Either model them as two separate validation steps or document explicitly that atomic validation is an intentional abstraction.

Endorsements:
None (first round)

---

### expert-edge-cases

Position: The spec handles the major failure modes (contract failure with bounded retries, TDD cycle exhaustion, step failure) but has several edge cases in state transitions that are either missing or underspecified.

Edge Cases Found:
- [Sequence] All steps assigned to non-trainer writers. The spec allows all steps to be assigned to `hono_writer`, `typescript_writer`, or `vitest_writer` with no trainer-writer steps. In this case, `inputContractValid` and `outputContractValid` remain FALSE for all steps, and no contract validation logic is exercised. The pipeline completes successfully (all steps reach STEP_COMPLETE, phases reach ALL_DONE), but the agent-contracts package (phase A) was created for nothing. This is a valid scenario (a pipeline run that happens to need no agent artifacts), but the spec does not distinguish it from a run where contracts were needed but never validated.
- [Sequence] Steps and phases are completely independent. The spec allows all steps to complete before any phase begins, or all phases to complete before any step is assigned. There is no ordering constraint between the step lifecycle and the implementation phases. Is this intentional? In the real pipeline, the phases represent deploying changes to agent definitions -- those changes should logically precede the steps that use the new trainer-writer capability. A step assigned to `trainer_writer` before phase B (which adds trainer-writer to the implementation-writer's assignment table) would be assigning a writer that does not yet exist in the system. The spec does not enforce this ordering.
- [Boundary] `MaxTDDCycles = 0`. The ASSUME guard (`MaxTDDCycles >= 1`) prevents this in TLC, but the spec does not handle it gracefully -- `WriteFailingTest` would be permanently disabled (guard `tddCycle[s] < MaxTDDCycles` is false when MaxTDDCycles=0 and tddCycle starts at 0), so steps would be stuck in HANDSHAKE. The ASSUME is the correct fix, but it is worth noting that the liveness property `StepTerminates` would fail without it.
- [Partial failure] A step fails (`STEP_FAILED`) while the implementation phases are still in progress. The spec allows `CompletePipeline` only when `AllStepsTerminal /\ implPhase = "ALL_DONE"`. If a step fails early, the pipeline waits for phases to complete before marking `pipelineComplete`. But the liveness property `PipelineTerminates` (eventually `pipelineComplete`) requires both all steps to terminate AND all phases to complete. If the model checker is running with `WF_vars(Next)`, phases will always eventually progress (fairness guarantees it). But in the real system, a step failure might cause the pipeline to abort early rather than waiting for all phases to deploy. The spec models "run everything to completion even on failure," which may not match the real abort-on-failure behavior.
- [Concurrency] Multiple steps in CONTRACT_VALIDATE simultaneously. The spec allows this -- step s1 can be in CONTRACT_VALIDATE while s2 is in RED and s3 is in REFACTOR. Each step's contract validation is independent. This is correct for the pipeline (steps are in different git worktrees), but the spec does not model any shared resource contention (e.g., both steps trying to write to the same file in `.claude/skills/`). This is acceptable as an abstraction -- file conflicts are a merge concern, not a contract validation concern.

Reasoning:
The most significant edge case is the independence of steps and phases. In the real system, phase B (adding trainer-writer to the implementation-writer) must happen before any step can be assigned to `trainer_writer`. The spec allows assigning `trainer_writer` to a step even when `implPhase = "NOT_STARTED"`. The TLC model checker will explore this path. Since there is no invariant preventing it, the spec certifies this as a valid execution. This is either a deliberate abstraction (the spec models "what happens at the code level" separately from "what happens at the deployment level") or a missing guard.

The all-non-trainer-steps case is benign but worth documenting: the pipeline works correctly even when no trainer-writer steps exist. The contract package is created (phase A) regardless, which is correct -- the package exists as infrastructure whether or not it is used in a given pipeline run.

The abort-on-failure behavior is a real gap. If any step fails, the current pipeline machinery (Stage 6) enters SESSION_FAILED and may re-dispatch. The spec models `STEP_FAILED` as a terminal state with no recovery, which is correct for a single pipeline run. Re-dispatch would be a new Init. This is acceptable but should be documented.

Objections:
- The spec does not enforce that trainer-writer assignment requires phase B to have been reached. A step can be assigned to `trainer_writer` when `implPhase = "NOT_STARTED"`. This is either a missing guard (`AssignWriter` should check `implPhase >= "PHASE_B"` for trainer-writer assignments) or a deliberate abstraction that should be documented.
- The spec models steps and phases as fully independent concurrent processes. The real system has a logical dependency: the trainer-writer capability does not exist until phases A-C are deployed. The spec should either enforce this ordering or explicitly document that it is abstracting over the deployment-time dependency.

Endorsements:
None (first round)

---

### expert-continuous-delivery

Position: The spec correctly models the ordered deployment sequence (A -> B -> C -> D) and correctly identifies phase D as the only removal. The phase ordering invariants are sound. One concern about the phasing granularity and one about the relationship between spec verification and real deployment safety.

Reasoning:
The implementation phase actions (`BeginPhaseA` through `CompletePhases`) enforce a strict linear order through their guards: each phase requires the previous phase to have been reached. The `RemovalOnlyInPhaseD` invariant (S10) correctly verifies that `questionerCanDispatchTrainer` remains TRUE in all phases before D. The `QuestionerTrainerRemoved` invariant (S3) verifies that it becomes FALSE at phase D. These two invariants together prove the deployment safety property from the design consensus: the breaking change (removing trainer from questioner dispatch) only happens after all additive changes (A, B, C) are in place.

The phase model treats each phase as a single atomic transition. In reality, each phase involves multiple file changes, a PR, CI passing, and a merge. The spec abstracts this correctly -- the spec is about the ordering of phases, not the internal mechanics of each phase. However, this means the spec does not model partial phase completion. If phase B (modifying implementation-writer AGENT.md) is merged but the CI run for phase C (modifying trainer AGENT.md) fails, the system is in a state between phases B and C. The spec jumps atomically from PHASE_B to PHASE_C. This is fine as a spec-level abstraction, but implementers should know that the real system can be in these intermediate states.

The TLC results are reassuring: 7.8M states, depth 40, no errors. With 3 steps, 4 writer types, MaxTDDCycles=2, and MaxContractRetries=1, the state space is non-trivial. The fact that all 11 invariants and 3 liveness properties pass gives high confidence in the design's correctness.

The `CHECK_DEADLOCK FALSE` in MC.cfg is noteworthy. This disables TLC's built-in deadlock detection. The spec has `WF_vars(Next)` fairness, so deadlock-freedom is implied by the liveness properties (if the system deadlocks, `PipelineTerminates` would fail). Disabling the separate deadlock check is redundant but not harmful. It avoids false positives from terminal states (once `pipelineComplete = TRUE`, no further actions are enabled, which TLC would flag as deadlock without this setting).

Objections:
- The spec does not model rollback of phases. If phase D is deployed and causes a regression in standalone questioner sessions, the rollback is: revert phase D (re-add trainer to questioner dispatch). But reverting phase D does not revert phases A-C, so the system is in a state the spec does not represent (phases A-C deployed, phase D reverted). The spec models phases as a one-way progression. If rollback is a realistic scenario, the spec should model it or document that rollback is out of scope.

Endorsements:
None (first round)

---

## Round 1 Analysis

New objections raised:
1. **expert-tdd:** Contract failure retry semantics are imprecise -- does not distinguish bad test from bad implementation. Retry counter resets per TDD cycle, allowing MaxTDDCycles * MaxContractRetries total attempts (undocumented interaction).
2. **expert-ddd:** `QuestionerTargets` constant is dead code (declared but never used in any invariant or action). Dual contract validation is modeled as atomic, eliding a real intermediate state.
3. **expert-edge-cases:** No ordering constraint between step assignment and implementation phases -- trainer-writer can be assigned before phase B. Steps and phases are fully independent, missing a real deployment-time dependency.
4. **expert-continuous-delivery:** No rollback modeling for phases. Partial phase deployment not represented.

Proceeding to Round 2 since there are new objections.

---

## Round 2

### expert-tdd

Position: Maintain support. Round 1 objections from other experts are complementary and strengthen the review. The most substantive finding is expert-edge-cases' observation about missing phase-step ordering.

Reasoning:
expert-edge-cases correctly identifies that the spec allows `AssignWriter(s, "trainer_writer")` when `implPhase = "NOT_STARTED"`. This is a real modeling gap. In TDD terms, this is like running a test that imports a module before the module exists -- the test would fail for an environmental reason (missing dependency), not a behavioral reason. The spec should either add a guard to `AssignWriter` that prevents trainer-writer assignment before phase B, or it should add a new invariant: "if any step is assigned to trainer_writer, then implPhase is not in {NOT_STARTED, PHASE_A}." This is a testable property.

expert-ddd's point about `QuestionerTargets` being dead code is valid but minor. The constant serves as documentation. In a TLA+ spec, unused constants are not harmful to verification -- TLC ignores them. However, the fix is simple: either remove it or use it in an invariant like `implPhase \in {"PHASE_D", "ALL_DONE"} => "trainer" \notin ActiveQuestionerTargets` (which would require introducing an `ActiveQuestionerTargets` variable that changes at phase D). Given the spec already has `questionerCanDispatchTrainer` as a boolean, the constant is redundant. Remove it.

expert-ddd's second point about atomic dual contract validation is an acceptable abstraction. In practice, if `InputSchema.parse()` passes and `OutputSchema.parse()` fails, the step goes back to HANDSHAKE regardless -- both must pass for the step to proceed. Modeling them as two separate validation steps would double the state space without adding new safety properties. The spec should document this as an intentional abstraction in the README.

My own Round 1 concern about the retry counter resetting per TDD cycle is a documentation issue, not a spec defect. The behavior (MaxTDDCycles * MaxContractRetries total attempts) is correct -- each TDD cycle gets a fresh set of contract retries. This should be documented in the README.

Objections:
None new. Prior objection about retry semantics is reclassified as a documentation request (add to README), not a spec defect.

Endorsements:
- expert-edge-cases: The missing phase-step ordering constraint is the most important finding. A guard on `AssignWriter` preventing trainer-writer assignment before phase B would close this gap cleanly.
- expert-ddd: `QuestionerTargets` should be removed. It is dead code that implies verification where none exists.
- expert-continuous-delivery: Rollback is legitimately out of scope for this spec. The spec models a single forward pipeline run. Rollback is a deployment concern, not a design correctness concern. Documenting this scoping decision in the README is sufficient.

---

### expert-ddd

Position: Maintain support. The most substantive finding is the missing ordering constraint between step assignment and implementation phases, identified by expert-edge-cases. This is a bounded context boundary violation in the spec.

Reasoning:
In DDD terms, the step lifecycle and the implementation phases are two aggregates that should communicate through a domain event. Phase B completing ("trainer-writer is now available") is a domain event that unlocks the ability to assign trainer-writer to steps. The spec currently has no such coupling -- the two aggregates are fully independent. expert-edge-cases correctly identifies this as a gap.

The fix should be minimal: add a guard to `AssignWriter` that checks `implPhase \notin {"NOT_STARTED", "PHASE_A"}` when `w = "trainer_writer"`. This preserves the spec's clean separation between step actions and phase actions while adding the single necessary cross-aggregate constraint. In DDD terms, this is a domain rule: "trainer-writer assignment requires the trainer-writer capability to exist."

expert-tdd's endorsement of removing `QuestionerTargets` is correct. The constant was an attempt to model the questioner's dispatch table, but the spec already captures the relevant property through the `questionerCanDispatchTrainer` boolean. The constant adds nothing.

expert-continuous-delivery's point about rollback is well-taken. The spec models a single pipeline execution. Rollback semantics belong in a separate spec (if needed) or in operational runbooks. Overloading this spec with rollback modeling would violate the Single Responsibility principle at the spec level.

On my own Round 1 point about atomic dual validation: expert-tdd's response is persuasive. Modeling input and output validation as separate steps would double the state space (from 7.8M to potentially 15M+) without surfacing new safety properties. Both must pass for the step to proceed. The atomicity is an acceptable abstraction. I withdraw this as an objection and recommend documenting it in the README instead.

Objections:
None new. Prior objection about `QuestionerTargets` stands as a cleanup recommendation. Prior objection about atomic dual validation is withdrawn (reclassified as a documentation recommendation).

Endorsements:
- expert-edge-cases: The phase-step ordering constraint is the most important gap in the spec. Adding a guard to `AssignWriter` is the correct fix.
- expert-tdd: Removing `QuestionerTargets` and documenting the retry counter interaction are both correct cleanup actions.
- expert-continuous-delivery: Rollback is out of scope for this spec. Agree completely.

---

### expert-edge-cases

Position: Maintain support. The responses from other experts in Round 1 are satisfactory. The phase-step ordering gap is acknowledged as the primary finding. The other edge cases (all-non-trainer, abort-on-failure) are acceptable abstractions.

Reasoning:
expert-tdd and expert-ddd both endorse the phase-step ordering finding and propose the same fix: a guard on `AssignWriter` checking that `implPhase` has reached at least PHASE_B before allowing trainer-writer assignment. This is the correct minimal fix. It adds one guard condition to one action, does not change the state space significantly, and closes the most important gap.

expert-tdd's point about retry counter semantics (MaxTDDCycles * MaxContractRetries total attempts) is a valid documentation concern. The interaction is not obvious from reading the spec. Adding a comment in the spec and a note in the README would prevent future confusion.

expert-continuous-delivery's point about rollback being out of scope is reasonable. The spec models forward progress of a single pipeline run. Rollback is an operational concern. However, I would add one recommendation: the README should state explicitly that the spec does not model rollback, phase revert, or partial deployment states. This prevents a future reader from assuming these properties have been verified.

The all-non-trainer-steps case (my Round 1 finding) is benign. The spec correctly handles it -- all steps complete, phases complete, pipeline completes. The contract package exists but is unused. This is fine.

The abort-on-failure case (my Round 1 finding) is an acceptable abstraction. The spec models `STEP_FAILED` as terminal. In the real system, SESSION_FAILED triggers re-dispatch, which is a new pipeline run (new Init). This is correct modeling.

Objections:
None new. Prior objections resolved by Round 2 responses.

Endorsements:
- expert-tdd: Retry counter documentation is a valid cleanup action. The MaxTDDCycles * MaxContractRetries interaction should be documented.
- expert-ddd: Removing `QuestionerTargets` is correct. Withdrawing the atomic dual validation objection is appropriate -- the abstraction is acceptable.
- expert-continuous-delivery: Explicit statement in README that rollback is out of scope is the right approach.

---

### expert-continuous-delivery

Position: Maintain support. All Round 1 concerns are addressed or accepted. The phase-step ordering fix is the primary actionable item.

Reasoning:
The emerging consensus is clean: one spec fix (guard on `AssignWriter` for trainer-writer requiring phase B) and several documentation improvements (retry counter interaction, atomic dual validation abstraction, rollback out of scope). From a CD perspective, the phase-step ordering fix is critical because it prevents a real deployment failure: assigning a step to trainer-writer before the trainer-writer capability has been deployed. In deployment terms, this is a dependency ordering violation -- you cannot use a capability before deploying it.

expert-tdd's analysis of the retry counter semantics is informative. The MaxTDDCycles * MaxContractRetries interaction is correct behavior but non-obvious. Documenting it prevents an implementer from setting MaxContractRetries=1 thinking there will be only 1 total retry, when in fact there will be 1 retry per TDD cycle.

expert-ddd's withdrawal of the atomic dual validation objection is appropriate. The implementation will run both Zod parses sequentially, but from the spec's perspective, they are a single validation gate. The spec verifies the property that matters: "both must pass before the step completes."

My own Round 1 point about rollback is correctly scoped as out-of-scope. The spec is a design verification tool, not an operational runbook. Documenting this boundary in the README is sufficient.

The `CHECK_DEADLOCK FALSE` setting in MC.cfg is correct given the terminal state design (`pipelineComplete = TRUE` disables all actions). Without this setting, TLC would report a false-positive deadlock at every terminal state. The liveness properties (`PipelineTerminates`) verify that the system reaches the terminal state, which is the meaningful liveness guarantee.

Objections:
None new. Prior objection (rollback modeling) is reclassified as a documentation recommendation.

Endorsements:
- expert-tdd: The phase-step ordering guard on `AssignWriter` is the correct fix. Retry counter documentation is a valid cleanup.
- expert-ddd: Removing `QuestionerTargets` is housekeeping that improves spec clarity.
- expert-edge-cases: Explicit README statement about rollback and abort-on-failure being out of scope is the right approach.

---

## Round 2 Analysis

New objections raised: **None.** All experts reiterated prior positions, endorsed each other's findings, or reclassified prior objections as documentation recommendations. No novel objections were introduced in Round 2.

**Consensus reached after Round 2.**

---

## Debate Synthesis -- trainer-as-coder-tla-review

**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tdd, expert-ddd, expert-edge-cases, expert-continuous-delivery

---

### Agreed Recommendation

The TLA+ specification `TrainerAsCoder.tla` is sound and the TLC model-check results (7.8M states, all 11 invariants and 3 liveness properties passing) provide high confidence in the design. One spec fix and four documentation improvements are recommended before proceeding to Stage 5:

1. **Spec fix -- Phase-step ordering guard:** Add a guard to `AssignWriter` that prevents assigning `trainer_writer` to a step unless `implPhase` has reached at least `PHASE_B`. Without this guard, the spec certifies an impossible real-world execution: assigning a step to a writer capability that has not yet been deployed. The fix is one additional conjunct in `AssignWriter`:
   ```
   /\ (w = "trainer_writer" => implPhase \notin {"NOT_STARTED", "PHASE_A"})
   ```

2. **Remove dead constant:** Delete the `QuestionerTargets` constant. It is declared but never used in any action, guard, or invariant. The `questionerCanDispatchTrainer` boolean already captures the relevant property. The dead constant implies verification that does not exist.

3. **Document retry interaction:** Add a note in the README and a comment in the spec explaining that the total contract validation attempts per step are `MaxTDDCycles * MaxContractRetries` (not just `MaxContractRetries`), because `contractRetries` resets to 0 at each TDD cycle entry (`WriteFailingTest`).

4. **Document atomic dual validation:** Add a note in the README that `ContractPasses` sets both `inputContractValid` and `outputContractValid` atomically. This is an intentional abstraction -- the real implementation may validate them sequentially, but from the spec's perspective, both must pass as a single gate. Modeling them separately would double the state space without surfacing new safety properties.

5. **Document out-of-scope items:** Add a section to the README explicitly stating that the spec does not model: (a) phase rollback or revert, (b) partial phase deployment, (c) pipeline abort-on-step-failure (re-dispatch is modeled as a new Init). This prevents future readers from assuming these properties have been verified.

After applying fix #1 and re-running TLC, the spec is ready for Stage 5 (implementation planning).

---

### Expert Final Positions

**expert-tdd**
Position: Strong support. The spec faithfully models the TDD ping-pong lifecycle and correctly enforces the red-green-refactor discipline through invariants and bounded counters.
Key reasoning: The `CompletionRequiresTDD` invariant is the formal statement of "no code without a failing test." The `TrainerContractRequired` invariant enforces dual contract validation for trainer-writer steps. The retry counter interaction (MaxTDDCycles * MaxContractRetries total attempts) is correct behavior that needs documentation. The missing phase-step ordering guard is the primary actionable fix.
Endorsed: expert-edge-cases (phase-step ordering guard), expert-ddd (remove `QuestionerTargets`), expert-continuous-delivery (rollback out of scope)

**expert-ddd**
Position: Strong support. The spec correctly separates step lifecycle and implementation phase ordering as distinct aggregates with clean variable boundaries.
Key reasoning: The per-step variables and pipeline-wide variables form clean aggregate boundaries. UNCHANGED clauses correctly isolate the two aggregates. The `WriterTypes` and `ImplPhases` enumerations use the pipeline's ubiquitous language. The missing phase-step ordering is a cross-aggregate domain rule that should be a guard on `AssignWriter`. `QuestionerTargets` is dead code. Atomic dual validation is an acceptable abstraction.
Endorsed: expert-edge-cases (phase-step ordering guard), expert-tdd (remove `QuestionerTargets`, document retry interaction), expert-continuous-delivery (rollback out of scope)

**expert-edge-cases**
Position: Support with all findings addressed. The spec handles major failure modes correctly. The phase-step ordering gap is the primary finding; all other edge cases are acceptable abstractions.
Key reasoning: The most significant finding is that `AssignWriter` allows trainer-writer assignment regardless of implementation phase. All-non-trainer-steps and abort-on-failure are benign cases handled by the spec's design. Concurrent contract validation across steps is correctly independent. The retry counter interaction needs documentation.
Endorsed: expert-tdd (retry counter documentation), expert-ddd (withdraw atomic validation objection), expert-continuous-delivery (rollback and abort-on-failure out of scope in README)

**expert-continuous-delivery**
Position: Strong support. The ordered phase model correctly proves deployment safety -- the breaking change (phase D) only happens after all additive changes (A-C).
Key reasoning: The `RemovalOnlyInPhaseD` and `QuestionerTrainerRemoved` invariants together prove the deployment safety property. The phase-step ordering guard prevents assigning a capability before deploying it. `CHECK_DEADLOCK FALSE` is correct for terminal-state specs. TLC results (7.8M states, depth 40) provide strong confidence.
Endorsed: expert-tdd (phase-step ordering guard, retry documentation), expert-ddd (remove `QuestionerTargets`), expert-edge-cases (document out-of-scope items in README)

---

### Endorsement Map

| Expert | Endorsed Points From |
|--------|---------------------|
| expert-tdd | expert-edge-cases (phase-step ordering guard), expert-ddd (remove QuestionerTargets), expert-continuous-delivery (rollback out of scope) |
| expert-ddd | expert-edge-cases (phase-step ordering guard), expert-tdd (remove QuestionerTargets, document retries), expert-continuous-delivery (rollback out of scope) |
| expert-edge-cases | expert-tdd (retry documentation), expert-ddd (withdraw atomic objection), expert-continuous-delivery (document out-of-scope in README) |
| expert-continuous-delivery | expert-tdd (phase-step ordering guard, retry documentation), expert-ddd (remove QuestionerTargets), expert-edge-cases (document out-of-scope items) |

All experts endorsed all other experts' key points. Full cross-endorsement achieved.

---

**Session saved to:** docs/debate-moderator-sessions/2026-03-31_trainer-as-coder-tla-review.md
