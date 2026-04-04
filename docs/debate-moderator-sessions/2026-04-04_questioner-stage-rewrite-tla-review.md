# Debate Session — Questioner Stage Rewrite TLA+ Review

**Date:** 2026-04-04
**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tdd, expert-ddd, expert-edge-cases, expert-tla, expert-continuous-delivery

---

## Debate Synthesis — questioner-stage-rewrite-tla-review

**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tdd, expert-ddd, expert-edge-cases, expert-tla, expert-continuous-delivery

---

### Agreed Recommendation

The TLA+ specification is a strong formal model that correctly captures the core state machine, all 6 session states from the discriminated union, and 6 of the 8 design consensus gaps. TLC passing with 5,338 states and all 9 safety invariants plus 3 liveness properties verified provides high confidence in the modeled state space. However, the review identified five concrete issues that should be addressed before implementation proceeds:

1. **Lint clean-run counter not reset on escalation.** `LintEscalateToUser` resets `lintAttempts` to 0 but does not reset `lintCleanRuns`. If `lintCleanRuns` was 1 before escalation (one clean run followed by dirty runs that exhausted attempts), the post-escalation cycle could reach `lintCleanRuns = 2` by combining a pre-escalation clean run with a post-escalation clean run. These are not truly consecutive clean runs in the repaired source — the escalation and recipe fix happened in between. The `lintCleanRuns` counter should be reset to 0 on escalation to enforce that both consecutive clean passes occur on the same version of the file.

2. **Post-escalation lint deadlock.** After `LintEscalateToUser` fires (once, due to `~lintEscalated` guard), `lintAttempts` resets to 0 and the lint retry loop restarts. If lint still fails after the second round of `MaxLintPasses` attempts, no further action is available — `LintEscalateToUser` cannot fire again, `LintRunClean` and `LintRunDirty` are disabled by `lintAttempts >= MaxLintPasses`, and `DispatchStages` is gated on `lintCleanRuns >= 2`. The system deadlocks in the lint phase. Either allow multiple escalations (remove `~lintEscalated` guard, or add an escalation counter) or add a terminal `LintFailed` transition that moves the session to a failed state with a `lint_exhausted` error kind.

3. **`NumStages` constant declared but unused.** The constant `NumStages` appears in the CONSTANTS block and `.cfg` file but is never referenced in any action, invariant, or property. It should be removed to avoid confusion, or used in a property that verifies the stage dispatch relationship.

4. **`TurnCapExceeded` fires from `awaitingInput`.** The action's guard includes `sessionState \in {"questioning", "awaitingInput"}`, which means the system can forcibly terminate while the user is in the middle of responding. The design briefing describes the turn cap as a safety valve on the LLM-driven conversation loop, not as a pre-emption of user input. The `awaitingInput` state should be removed from the guard — the turn cap should trigger only when the LLM's turn count reaches the limit (i.e., from `questioning` state only, after `AskQuestion` has incremented `turnCount`).

5. **Fairness assumption `WF_vars(LintRunClean)` is too strong.** Weak fairness on `LintRunClean` asserts that if lint can eventually pass, it will. This is an environmental assumption about ESLint behavior on arbitrary markdown content — not a system guarantee. If the briefing file has a genuine lint rule conflict (which the design explicitly calls out as an edge case requiring escalation), lint may never produce a clean run. The liveness property `StagesEventuallyDispatch` depends on this fairness, which means the proved liveness is conditional on ESLint cooperation. This should be documented as an explicit assumption in the README, or the fairness should be weakened to `SF_vars(LintRunClean)` (strong fairness — only guarantees progress if lint is infinitely often enabled, not continuously enabled).

Secondary observations (endorsed but not blocking):

- Gap #1 (dependency injection) and Gap #7 (feature flag removal plan) are correctly excluded from the TLA+ model — they are implementation-level and process-level concerns that cannot be meaningfully modeled as state transitions.
- The `briefingSaved` flag is set to TRUE on `RetryExhausted` and `UserAbandons`, correctly modeling the partial briefing save behavior from the design.
- The non-deterministic `featureFlagOn \in BOOLEAN` in `Init` is the right modeling choice — both paths produce identical state transitions since the feature flag only controls which execution backend handles stages 2-7.

---

### Expert Final Positions

**expert-tla**
Position: The specification is well-structured and correctly models the core state machine, but has a subtle state consistency bug in the lint-fixer escalation path and an unreachable-state deadlock after second lint exhaustion.
Key reasoning: The `lintCleanRuns` counter not being reset on escalation violates the intended invariant that both clean passes must be consecutive on the same source. The post-escalation deadlock is a genuine liveness violation hidden by the `WF_vars(LintRunClean)` fairness assumption — if we remove that fairness, TLC would find a deadlock trace. The `TurnCapExceeded` firing from `awaitingInput` is a guard error that allows preempting user input. The `NumStages` unused constant is a minor cleanliness issue.
Endorsed: expert-edge-cases (post-escalation deadlock is the most severe correctness issue), expert-continuous-delivery (WF fairness on lint is an environmental assumption that should be documented)

**expert-tdd**
Position: The specification is thorough and the 9+3 property set covers the safety surface well, but the untestable post-escalation deadlock means implementation tests would need to cover a path the spec cannot currently verify.
Key reasoning: The spec's power is in exhaustive state enumeration, which complements the unit test suite. However, the post-escalation deadlock means a test for "lint fails indefinitely after user provides recipe" would reveal a hanging system with no error transition. The `WF_vars(LintRunClean)` fairness assumption masks this — in a test environment, we cannot assume lint passes. The spec should model the failure path so that test cases can be written against a well-defined terminal state (`lint_exhausted`).
Endorsed: expert-tla (lint deadlock analysis and lintCleanRuns reset issue), expert-edge-cases (TurnCapExceeded from awaitingInput as a user-facing preemption bug)

**expert-edge-cases**
Position: The spec handles the most critical edge cases well (SIGNING_OFF guard, retry exhaustion, SIGINT abandonment) but misses the post-escalation lint deadlock and the TurnCapExceeded-from-awaitingInput preemption.
Key reasoning: The SIGNING_OFF guard with `LLMRefusesSignoff` / `CLIForcesSignoff` / `MaxSignoffAttempts` is exactly what was requested in Gap #3. The retry exhaustion path correctly sets `retry_exhausted` error kind. However, `TurnCapExceeded` from `awaitingInput` means the system can abort while the user is typing — this is a UX failure, not just a modeling issue. The post-escalation lint deadlock is the most severe issue: the system silently hangs with no error, no escalation, and no terminal transition. Gap #8 (non-interactive fallback) is partially modeled through `LintEscalateToUser` but the non-interactive code path (skip escalation, save state) is not represented.
Endorsed: expert-tla (lintCleanRuns reset is a subtle but real consistency bug), expert-continuous-delivery (WF_vars(LintRunClean) falsely guarantees lint cooperation)

**expert-ddd**
Position: The discriminated union modeling is correct and the domain language is precise. The session lifecycle is properly separated from the domain artifact.
Key reasoning: The 6-state `sessionState` variable correctly implements Gap #4's discriminated union. The separation of `sessionState` (lifecycle) from `artifactQuest` (domain output) is exactly what was recommended in the Stage 2 debate — the artifact tracks "empty/partial/complete" independently of the session's mechanical state. The `storeErrorKind` enumeration uses domain-precise language (`retry_exhausted`, `user_abandon`, `signoff_exhausted`, `turn_cap_exceeded`). The only naming concern is that `artifactQuest` abbreviation obscures the domain concept — `artifactQuestioner` or `questionerArtifact` would be more readable in the spec.
Endorsed: expert-tla (discriminated union correctly maps the Stage 2 design consensus), expert-edge-cases (SIGNING_OFF guard models the domain handshake precisely)

**expert-continuous-delivery**
Position: The feature flag modeling is correct and the lint double-pass gating is well-specified, but the WF fairness assumption on lint creates a false liveness guarantee that would mislead pipeline configuration.
Key reasoning: The non-deterministic `featureFlagOn` in `Init` correctly models both deployment paths without privileging one. The `DispatchStages` action correctly gates on `lintCleanRuns >= 2`, enforcing the double-pass convention. However, `WF_vars(LintRunClean)` assumes that lint will eventually pass if it can — in a CI environment with a genuinely conflicting rule, this is false. The pipeline would hang at the lint phase with no timeout, no failure transition, and no alerting. The `NumStages` constant being unused suggests the spec was intended to model stage dispatch count but that was never completed — either finish it or remove it.
Endorsed: expert-tla (post-escalation deadlock is a pipeline hang in CI), expert-tdd (failure path must exist for test coverage)

---

## Round Transcripts

### Round 1

**expert-tla**
Position: The specification correctly models 6 of 8 design gaps and the core state machine is sound, but has a lintCleanRuns counter bug and a post-escalation deadlock.

Reasoning: The spec models all 6 session states from the discriminated union (questioning, awaitingInput, summaryPresented, signingOff, completed, failed). The SIGNING_OFF guard is correctly implemented with LLMRefusesSignoff/CLIForcesSignoff and bounded by MaxSignoffAttempts. The turn cap safety valve, retry exhaustion with error kind, and exact-match /summary interception are all correctly modeled.

However, `LintEscalateToUser` resets `lintAttempts` to 0 but not `lintCleanRuns`. If the counter was 1 before escalation, a single clean run post-escalation would reach 2, combining a pre-fix clean run with a post-fix clean run. These are not genuinely consecutive on the same source. Additionally, after escalation fires once, if lint still fails after MaxLintPasses more attempts, the system deadlocks — no action is enabled. The `TurnCapExceeded` guard includes `awaitingInput`, which preempts user input. `NumStages` is declared but unused.

Objections:
- lintCleanRuns not reset on escalation allows false double-pass
- Post-escalation lint deadlock: no terminal transition after second exhaustion
- TurnCapExceeded fires from awaitingInput, preempting user
- NumStages constant unused
- WF_vars(LintRunClean) is an environmental assumption, not a system guarantee

Endorsements: None

---

**expert-tdd**
Position: The spec's property set is comprehensive for the modeled state space, but the post-escalation deadlock represents an untestable failure mode.

Reasoning: The 9 safety invariants cover the critical boundaries: store consistency (S1, S6, S7), boundedness (S2, S3, S4), lint double-pass (S5, S9), and waitFor terminal gate (S8). The 3 liveness properties verify termination, waitFor resolution, and stage dispatch. This is a solid property set for implementation test design.

However, the post-escalation lint deadlock means there is a system state that is neither terminal nor has enabled transitions. A test for "lint fails after user recipe" would hang indefinitely with no assertion to check. The spec should add a `LintFailed` terminal transition so test cases can assert on the `lint_exhausted` error kind. Without this, the test suite has a gap that mirrors the spec's gap.

The `TurnCapExceeded` from `awaitingInput` is also a testability concern — the test would need to simulate preempting user input mid-entry, which is an unusual test scenario and likely not the intended design.

Objections:
- Post-escalation deadlock creates untestable system state
- TurnCapExceeded from awaitingInput is likely a guard error, not intentional design

Endorsements: None

---

**expert-edge-cases**
Position: Critical edge cases (SIGNING_OFF guard, retry exhaustion, SIGINT) are well-modeled. Post-escalation lint deadlock and TurnCapExceeded preemption are the primary gaps.

Reasoning: The SIGNING_OFF guard (Gap #3) is the most critical edge case from the Stage 2 debate, and it is modeled precisely: LLMRefusesSignoff increments attempts, CLIForcesSignoff fires when attempts are exhausted, and the signoff_exhausted error kind is available in storeErrorKind (though CLIForcesSignoff actually completes successfully rather than failing — which matches the design's "CLI-force a signoff from current conversation content" option). The UserAbandons action correctly fires from all non-terminal states.

The `TurnCapExceeded` from `awaitingInput` means the system can abort while the user is responding. In practice: user is typing their answer, turn cap fires, session fails, partial briefing saved, user's input is lost. The design says the turn cap is a safety valve on the LLM loop, not a preemption of human input.

Gap #8 (non-interactive fallback) is partially addressed — LintEscalateToUser models the interactive path, but there is no action modeling the non-interactive path where escalation is skipped and current state is saved.

Objections:
- TurnCapExceeded from awaitingInput preempts user mid-response
- Post-escalation lint deadlock with no terminal transition
- Non-interactive lint fallback path (Gap #8) not modeled

Endorsements: None

---

**expert-ddd**
Position: Domain modeling in the spec is precise and correctly separates session lifecycle from domain artifact.

Reasoning: The 6-state sessionState discriminated union maps exactly to the Stage 2 consensus. The separation of sessionState (lifecycle) from artifactQuest (domain output) resolves the original design's conflation of signedOff boolean with artifact content. The storeErrorKind enumeration uses domain-appropriate language. The artifact progression (empty -> partial -> complete) correctly models the domain truth that a questioner session's output accumulates.

Minor naming concern: `artifactQuest` is an abbreviation that obscures the domain concept. The TLA+ spec should use the full domain name `artifactQuestioner` or `questionerArtifact` for readability by non-TLA+ experts reviewing the spec.

Objections:
- `artifactQuest` naming is unnecessarily abbreviated

Endorsements: None

---

**expert-continuous-delivery**
Position: Feature flag and lint double-pass modeling are correct, but WF_vars(LintRunClean) creates a false liveness guarantee for pipeline planning.

Reasoning: The non-deterministic featureFlagOn is the correct modeling choice — it proves that state transitions are identical regardless of which backend runs stages 2-7. The DispatchStages gating on lintCleanRuns >= 2 correctly enforces the double-pass convention. The pipeline-relevant invariant StagesOnlyAfterLintPass (S9) correctly proves that stages cannot dispatch without lint passing.

However, WF_vars(LintRunClean) in the fairness condition asserts that if LintRunClean is continuously enabled, it will eventually fire. This is an environmental assumption about ESLint — in a CI environment with a genuinely unresolvable lint rule conflict, this assumption is false and the pipeline hangs. The liveness property StagesEventuallyDispatch depends on this fairness. Pipeline operators would read "stages eventually dispatch" as a guarantee, when it is actually conditional on lint cooperation. This should be explicitly documented.

The NumStages constant being unused suggests incomplete modeling of the stage dispatch phase.

Objections:
- WF_vars(LintRunClean) is an environmental assumption that should be documented or weakened
- NumStages constant unused

Endorsements: None

---

### Round 2

**expert-tla**
Position: Maintains all Round 1 objections. The post-escalation deadlock is the highest-severity issue — it represents a reachable state with no enabled transitions, which TLC does not flag as a deadlock because the Spec formula includes stuttering (`[][Next]_vars`). A separate `PROPERTY Terminates == <>[](Done)` would catch it, but `Done` currently excludes the lint-deadlocked state.

Objections: (All reiterated from Round 1)

Endorsements:
- expert-edge-cases: Post-escalation deadlock is the most severe correctness issue — it is a reachable non-terminal state with no progress possible.
- expert-continuous-delivery: WF_vars(LintRunClean) masks the deadlock. Without it, TLC would find a trace to the deadlocked state.

---

**expert-tdd**
Position: Maintains all Round 1 objections. Agrees with expert-tla that the stuttering acceptance masks the deadlock.

Objections: (All reiterated from Round 1)

Endorsements:
- expert-tla: Deadlock analysis is precise — stuttering masks the issue. A `Terminates` property would catch it.
- expert-edge-cases: TurnCapExceeded from awaitingInput is a user-facing preemption bug, not just a modeling issue.

---

**expert-edge-cases**
Position: Maintains all Round 1 objections. Notes that the non-interactive fallback gap is lower severity since TLA+ cannot meaningfully distinguish interactive vs non-interactive environments — this is an implementation-level concern.

Objections: (Reiterated from Round 1, with non-interactive fallback downgraded to secondary observation)

Endorsements:
- expert-tla: lintCleanRuns not reset on escalation is a subtle but real consistency bug that would cause false double-pass acceptance.
- expert-continuous-delivery: WF_vars(LintRunClean) falsely guarantees lint cooperation — the liveness property is conditional, not absolute.

---

**expert-ddd**
Position: Maintains Round 1 naming observation. No new objections. The domain modeling is sound.

Objections: (Naming concern reiterated from Round 1)

Endorsements:
- expert-tla: Discriminated union correctly maps the Stage 2 design consensus to a formal state model.
- expert-edge-cases: SIGNING_OFF guard models the domain handshake precisely as designed.

---

**expert-continuous-delivery**
Position: Maintains all Round 1 objections. Agrees with expert-tla that the deadlock would manifest as a pipeline hang in CI with no error reporting.

Objections: (All reiterated from Round 1)

Endorsements:
- expert-tla: Post-escalation deadlock is a pipeline hang in CI — no timeout, no failure transition, no alerting.
- expert-tdd: Failure path must exist so tests can assert on the terminal state.

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-04_questioner-stage-rewrite-tla-review.md
