# Debate Session — TLA+ Review: SDK Pipeline Rewrite

**Date:** 2026-04-03
**Result:** CONSENSUS REACHED
**Rounds:** 3
**Experts:** expert-tla, expert-edge-cases, expert-tdd, expert-ddd

---

## Debate Synthesis — tla-review-sdk-pipeline

**Result:** CONSENSUS REACHED
**Rounds:** 3
**Experts:** expert-tla, expert-edge-cases, expert-tdd, expert-ddd

---

### Agreed Recommendation

The TLA+ specification (SdkPipeline.tla) is a strong formal model that correctly captures the 5 critical design consensus fixes and passes TLC model checking with 1,092,596 states explored. The spec is sound as-is for guiding implementation, but has 7 concrete gaps that should be addressed before the specification is considered final:

1. **Git operations lack retry paths.** The design consensus specifies "config-driven retry caps" for all transient failures, but `GitFail` transitions directly to `failed` with no retry mechanism. Claude API failures get retry logic; git failures should too. Add `GitRetry` and `GitRetryExhausted` actions mirroring the Claude API retry pattern.

2. **Compensation modeled as atomic and infallible.** `CompleteCompensation` is a single step that always succeeds. In reality, compensation (undoing git commits, cleaning up artifacts) can itself fail. Add a `compensation_failed` state to model this path, even if the implementation treats it as a terminal error requiring manual intervention.

3. **MaxStreamTurns boundary creates incorrect semantics.** When `turns = MaxStreamTurns`, the only enabled action is `AbandonStreaming`, which sets `error = "user_abandon"`. But the user did not abandon -- they hit a system-imposed limit. Add a distinct `StreamLimitReached` action with a dedicated error kind (e.g., `"stream_limit_exceeded"`).

4. **Numeric stage identifiers instead of named constants.** Stages are `1..7` with `StreamingStages == {1, 5}`, `PairStage == 6`, `GitStages == {6, 7}` as magic number sets. If stages are reordered or a stage is added, these sets silently break. Use named constants (e.g., `Questioner`, `PairProgramming`) to make the spec self-documenting and resilient.

5. **Git lock acquisition is a two-step process.** A stage enters `git_operating` status via `ValidationPass` before acquiring `gitOwner` via `AcquireGit`. Between these two steps, multiple runs can be in `git_operating` status simultaneously (though only one holds the lock). Consider making the lock acquisition atomic with the status transition to eliminate this semantic gap.

6. **Missing fairness for failure paths.** `ValidationFail` and `GitFail` have no fairness assumptions (neither WF nor SF). This is likely intentional but should be documented explicitly: the spec assumes failures are not guaranteed to resolve, and liveness depends on `RetryExhausted` eventually firing.

7. **Claude API failures only modeled during "executing" state.** The design includes pair programming (synchronous message routing) which involves active Claude API calls during `pair_routing` state. API failures during pair routing are not modeled.

None of these gaps invalidate the current TLC results. The spec is correct for the states and transitions it models. These are *missing* states and transitions that the implementation will need to handle, and which should ideally be added to the spec before implementation begins.

---

### Expert Final Positions

**expert-tla**
Position: Specification is sound but has concrete gaps in git retry, fairness assumptions, and pair-routing API failures.
Key reasoning: The spec correctly models all 5 consensus fixes and the core state machine is well-designed. The 10 safety invariants and 3 liveness properties cover the critical properties. However, git operations lack the retry mechanism that the design consensus requires, and the fairness assumptions do not cover all failure paths. The pair_routing state involves Claude API calls that can fail, but no failure transition exists from that state.
Endorsed: expert-edge-cases (git lock leak, compensation atomicity), expert-ddd (numeric stage IDs), expert-tdd (duplicated retry paths)

**expert-edge-cases**
Position: The spec handles common cases well but has blind spots around git lock leaks, streaming turn limits, compensation failures, and the git acquisition TOCTOU window.
Key reasoning: The git lock (`gitOwner`) is correctly released on `GitSuccess` and `GitFail`, but no force-release mechanism exists for catastrophic failures. MaxStreamTurns boundary forces users into "abandon" semantics when they hit a system limit. Compensation is modeled as infallible when it clearly can fail in practice. The two-step git acquisition (status change then lock) creates a window of semantic inconsistency.
Endorsed: expert-tla (git retry gap, fairness), expert-tdd (two-step git TOCTOU), expert-ddd (magic number stages)

**expert-tdd**
Position: The spec provides a good blueprint for implementation testing, with concerns about global mutable state (gitOwner), duplicated retry paths, and missing test-double seams.
Key reasoning: Instance-scoped state per run enables excellent test isolation. However, gitOwner as global mutable state requires integration-level tests for mutual exclusion. The two separate retry code paths (ClaudeApiFail vs RetryAfterValidationFail) should be unified into a single parameterized retry mechanism for testability. The git port/adapter pattern from the design consensus is modeled as direct state transitions rather than port/adapter calls, which obscures the test-double seam.
Endorsed: expert-tla (git retry gap, ValidationFail fairness), expert-edge-cases (compensation failure, streaming turn limit), expert-ddd (named stages)

**expert-ddd**
Position: The spec correctly models instance-scoped aggregates but uses technical language (numeric IDs, magic number sets) instead of domain language.
Key reasoning: Each run is effectively an Aggregate Root with stage sub-entities, which is good DDD modeling. The checkpoint acts as a consistency marker for transaction boundaries. However, numeric stage identifiers violate Ubiquitous Language -- the domain names (Questioner, DebateModerator, etc.) should be used directly. Stage-specific artifact types are not modeled -- all stages share the same record structure with a boolean `artifact` flag, when the design specifies typed artifacts (BriefingResult, DebateSynthesis, TlaResult, etc.).
Endorsed: expert-tla (comprehensive gap analysis), expert-edge-cases (practical failure hunting), expert-tdd (retry path duplication)

---

### Endorsement Map

| Expert | Endorsed by |
|--------|------------|
| expert-tla | expert-edge-cases, expert-tdd, expert-ddd |
| expert-edge-cases | expert-tla, expert-tdd, expert-ddd |
| expert-tdd | expert-tla, expert-edge-cases, expert-ddd |
| expert-ddd | expert-tla, expert-edge-cases, expert-tdd |

Full cross-endorsement achieved.

---

## Per-Round Transcripts

### Round 1

**expert-tla (Round 1)**
Position: Specification is well-structured and captures the core state machine correctly, but has gaps in git retry, fairness, and pair-routing API failures.
Reasoning: The spec correctly addresses all 5 consensus fixes. Instance-scoped state via the `runs` function (Fix 1). Stage-scoped coordinators implicit in stage-local records (Fix 2). Incremental migration (Fix 3) correctly excluded from formal model. Git port/adapter (Fix 4) modeled via `gitOwner` mutual exclusion. Compensation/checkpoint (Fix 5) explicitly modeled. However: git failures have no retry path contradicting the design's config-driven retry caps; ValidationFail has no fairness assumption; Claude API failures during pair_routing are not modeled.
Objections: Git failures have no retry path; no fairness on ValidationFail or GitFail; Claude API failures during pair_routing not modeled.
Endorsements: None (Round 1).

**expert-edge-cases (Round 1)**
Position: Specification handles common cases well but has blind spots around concurrent failure interactions, streaming edge cases, and git lock leaks.
Reasoning: Git lock leak possible on catastrophic run failure (no force-release). MaxStreamTurns boundary creates incorrect "abandon" semantics. Stage 7 git compensation semantics unclear. Compensation modeled as single atomic infallible step. Two-step git acquisition creates TOCTOU-like semantic window.
Objections: Git lock leak on catastrophic failure; MaxStreamTurns boundary incorrect semantics; compensation modeled as atomic with no failure path; git_operating status set before lock acquisition.
Endorsements: None (Round 1).

**expert-tdd (Round 1)**
Position: Specification is thorough as formal model but several design elements will create testing challenges in TypeScript implementation.
Reasoning: Instance-scoped state enables test isolation (good). gitOwner as global mutable state requires integration tests (bad). Duplicated retry paths (API fail vs validation fail) should be unified. No explicit test-double seam in git port/adapter model.
Objections: gitOwner requires integration-level tests; duplicated retry paths; no test-double seam for git.
Endorsements: None (Round 1).

**expert-ddd (Round 1)**
Position: Correctly models instance-scoped aggregates but uses technical language throughout.
Reasoning: Run record is effectively an Aggregate Root with stage sub-entities. gitOwner is an appropriate domain-level resource lock. Numeric stage identifiers violate Ubiquitous Language. StreamingStages/PairStage/GitStages are magic number sets. All stages share identical record structure rather than stage-specific typed artifacts.
Objections: Numeric stage IDs violate Ubiquitous Language; magic number sets break silently on reorder; no stage-specific artifact types.
Endorsements: None (Round 1).

### Round 2

**expert-tla (Round 2):** No new objections. Endorsed expert-edge-cases (git lock leak, compensation atomicity), expert-ddd (numeric stage IDs), expert-tdd (duplicated retry paths).

**expert-edge-cases (Round 2):** No new objections. Endorsed expert-tla (missing git retry), expert-tdd (two-step git TOCTOU), expert-ddd (magic number stages).

**expert-tdd (Round 2):** No new objections. Endorsed expert-tla (git retry gap, ValidationFail fairness), expert-edge-cases (compensation failure, streaming turn limit), expert-ddd (named stages).

**expert-ddd (Round 2):** No new objections. Endorsed expert-tla (git retry, fairness gaps), expert-edge-cases (git lock leak, compensation atomicity), expert-tdd (retry path duplication).

### Round 3

All 4 experts: No new objections. Consensus reached.

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-03_tla-review-sdk-pipeline.md
