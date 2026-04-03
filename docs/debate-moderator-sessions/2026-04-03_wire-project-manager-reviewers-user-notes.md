# Debate Session — Wire up project-manager, introduce reviewer agents, free-form user_notes

**Date:** 2026-04-03
**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tla, expert-ddd, expert-edge-cases, expert-tdd, expert-continuous-delivery, expert-bdd

---

## Debate Synthesis — wire-project-manager-reviewers-user-notes

**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tla, expert-ddd, expert-edge-cases, expert-tdd, expert-continuous-delivery, expert-bdd

---

### Agreed Recommendation

The design for wiring the project-manager dispatch, introducing 8 reviewer agents, and expanding user_notes is fundamentally sound. The handoff chain (design-pipeline -> project-manager -> writer pairs -> reviewers -> project-manager -> merge queue) is well-structured, and the parallel-review / all-must-pass gate is the correct safety-first choice. However, the design has six gaps that must be resolved before implementation:

1. **Add formal reviewer states to the task state machine.** The project-manager's task state machine (PENDING -> DISPATCHED -> RUNNING -> COMPLETED -> MERGED) needs new intermediate states: `REVIEWING`, `REVIEW_PASSED`, `REVIEW_FAILED`, and `REVISING`. Without these, the TypeOK invariant cannot hold during the reviewer phase, and the TLA+ spec cannot model the reviewer barrier synchronization.

2. **Name and bound the review-revision cycle constant.** Introduce `MaxReviewRevisions` (suggested value: 3) as a named constant. Each full cycle (pair revision + all 8 reviewer re-runs) counts as one revision. When exhausted, the session fails and follows existing re-dispatch logic. This is required for the `TaskEventuallyTerminal` liveness property.

3. **Define a structured ReviewVerdict schema.** The reviewer output must be a structured object, not free-form markdown. Minimum fields: `verdict` (PASS | FAIL), `scope` (SESSION_DIFF | OUT_OF_SCOPE), `findings[]` (each with file, line, issue, recommendation, severity). The project-manager consumes this programmatically to route findings to pairs and decide pass/fail.

4. **Differentiate the test-reviewer scope.** The test-reviewer must NOT duplicate LOCAL_REVIEW or Phase 3 Verification checks. Its differentiated scope is: run tests, lint, and tsc against a simulated integration merge (cherry-pick session diff into a temp branch from the integration branch) to catch cross-task integration failures before the actual merge. The AGENT.md must state this scope explicitly.

5. **Specify reviewer crash/timeout handling with a fallback.** Each reviewer has a bounded retry count (e.g., `MaxReviewerRetries = 2`). If a reviewer exhausts retries, it is deemed unavailable for this session. The review gate proceeds with N-1 reviewers. If multiple reviewers are unavailable, a minimum quorum (e.g., 5 of 8) must pass, or the session escalates to the user. This prevents a single broken reviewer from blocking all progress.

6. **Serialize user_notes writes or use agent-scoped files.** Concurrent appends from parallel agents to a single markdown file will produce write conflicts. Two options: (a) a write lock (simple but creates contention), or (b) agent-scoped files (`docs/user_notes/<agent-name>-<timestamp>.md`) that the user reads as a directory. Option (b) is simpler and avoids contention. The briefing should specify which approach.

**Additional design clarifications agreed upon:**

- **Reviewer self-scoping:** Each reviewer is responsible for scoping its findings to the session diff. Pre-existing code issues are written to user_notes, not included in the ReviewVerdict. The AGENT.md for each reviewer must state this rule.
- **Out-of-domain behavior:** When a reviewer receives a diff with nothing relevant to its domain, it returns `PASS` with `scope: OUT_OF_SCOPE`. This is a no-op that maintains the all-must-pass invariant.
- **Contradictory findings:** When reviewer findings conflict (e.g., simplicity vs. type-design), both sets are sent to the pair. If the pair cannot reconcile after `MaxReviewRevisions` cycles, the session fails with structured metadata recording which reviewers conflicted and on what, so the user has visibility.
- **Full re-run rationale:** All 8 reviewers re-run after any revision because selective re-run risks missing cross-domain regressions introduced by the revision. This trade-off (safety over efficiency) should be documented in the project-manager AGENT.md.
- **Reviewers and existing verification phases:** Reviewers are a new quality gate between LOCAL_REVIEW (session-level) and Phase 3 Verification (post-merge integration-level). They do not replace either. The sequence is: LOCAL_REVIEW (in worktree) -> Reviewers (against session diff, simulated merge for test-reviewer) -> Merge -> Phase 3 Verification (on integration branch).

---

### Expert Final Positions

**expert-tla**
Position: Support with required state machine amendments.
Key reasoning: The reviewer phase introduces barrier synchronization over 8 parallel processes. Without formal state definitions (REVIEWING, REVIEW_PASSED, REVIEW_FAILED, REVISING) and a named revision bound (MaxReviewRevisions), the TypeOK invariant is violated and the TaskEventuallyTerminal liveness property cannot be verified. The reviewer crash fallback (proceed with N-1 after retry exhaustion) is essential for liveness.
Endorsed: expert-edge-cases (reviewer crash fallback), expert-tdd (test-reviewer scope clarification)

**expert-ddd**
Position: Support with structured verdict schema and user_notes write serialization.
Key reasoning: The 8 reviewers form a clean aggregate with the project-manager as root. The ReviewVerdict must be a structured value object for the project-manager to consume programmatically. user_notes as a single shared file with concurrent uncoordinated appends violates consistency boundaries -- needs either a lock or agent-scoped files. Reviewer self-scoping is the correct enforcement point for the session-diff boundary.
Endorsed: expert-bdd (scoping enforcement), expert-tla (formal state definitions)

**expert-edge-cases**
Position: Support with bounded revision cycles and reviewer crash fallback.
Key reasoning: The all-re-run design is the safe default but is expensive per cycle. Bounding the revision cycle (MaxReviewRevisions) and providing a reviewer crash fallback (proceed with quorum) prevents both cost explosion and liveness violations. The test-reviewer should differentiate by running against a simulated integration merge. Contradictory reviewer findings need structured metadata so the user can diagnose session failures.
Endorsed: expert-continuous-delivery (acknowledge trade-off), expert-tdd (differentiate test-reviewer), expert-tla (named bounds)

**expert-tdd**
Position: Support, contingent on test-reviewer differentiation.
Key reasoning: The test-reviewer as described in the briefing ("runs tests, lint, tsc") is a strict subset of LOCAL_REVIEW + Phase 3 Verification. If the test-reviewer's AGENT.md specifies a differentiated scope (simulated integration merge to catch cross-task failures before actual merge), the redundancy objection is resolved. The other 7 reviewers add genuine analytical value beyond what pair sessions already check.
Endorsed: expert-edge-cases (simulated-merge scope), expert-tla (formal state definitions), expert-ddd (structured verdict schema)

**expert-continuous-delivery**
Position: Support, with documented trade-off rationale.
Key reasoning: The all-must-pass + full-re-run design contradicts the fast-feedback principle but is justified by safety (selective re-run risks missing cross-domain regressions). This trade-off should be explicitly documented in the project-manager AGENT.md so future maintainers understand the design choice. The revision cycle must be bounded (MaxReviewRevisions) to prevent an unbounded pipeline.
Endorsed: expert-tla (named revision bound), expert-edge-cases (safety argument for full re-run), expert-ddd (structured verdict schema)

**expert-bdd**
Position: Support, with specified behaviors for out-of-domain and scoping scenarios.
Key reasoning: The reviewer agents need defined behavior for two under-specified scenarios: (1) diff contains nothing relevant to the reviewer's domain (auto-pass with OUT_OF_SCOPE), and (2) reviewer finds issues in pre-existing code (self-scope to session diff, route pre-existing findings to user_notes). The project-manager should consume structured ReviewVerdict objects, not free-form markdown.
Endorsed: expert-ddd (reviewer self-scopes, structured verdict), expert-tla (formal state definitions), expert-edge-cases (reviewer crash fallback)

---

### Endorsement Map

| Expert | Endorsed by |
|---|---|
| expert-tla (formal states, named bounds) | expert-ddd, expert-edge-cases, expert-tdd, expert-continuous-delivery, expert-bdd |
| expert-ddd (structured verdict, user_notes serialization) | expert-tdd, expert-continuous-delivery, expert-bdd |
| expert-edge-cases (reviewer crash fallback, test-reviewer differentiation) | expert-tla, expert-tdd, expert-bdd |
| expert-tdd (test-reviewer redundancy) | expert-edge-cases |
| expert-continuous-delivery (trade-off documentation) | expert-edge-cases |
| expert-bdd (scoping enforcement, out-of-domain behavior) | expert-ddd |

---

## Per-Round Transcripts

### Round 1

**expert-tla**
- Position: The design introduces a significant state space expansion without formal state definitions for the reviewer phase.
- Reasoning: The task state machine needs REVIEWING, REVIEW_PASSED, REVIEW_FAILED, REVISING states. The review-revision cycle needs a named bound for liveness. The relationship between reviewers and existing Verification phase is unclear.
- Objections: (1) Missing formal reviewer states. (2) No named bound for review-revision cycle. (3) Unclear relationship between reviewers and existing Verification.
- Endorsed: None.

**expert-ddd**
- Position: Reviewer agents are a clean aggregate but user_notes violates boundary discipline.
- Reasoning: 8 reviewers with project-manager as aggregate root is sound DDD. user_notes as unstructured cross-cutting shared file with no coordination is problematic. Reviewer verdict needs structured schema.
- Objections: (1) user_notes lacks owning aggregate and write serialization. (2) Reviewer verdict needs formal schema.
- Endorsed: None.

**expert-edge-cases**
- Position: The all-re-run rule has combinatorial cost and under-specified failure modes.
- Reasoning: Each revision cycle costs 8 reviewer dispatches + pair work. Bound is unspecified. Contradictory findings have no resolution protocol. Reviewer crash handling is incomplete.
- Objections: (1) No bound on review-revision cycle. (2) No conflict resolution for contradictory findings. (3) No fallback for persistently crashing reviewers.
- Endorsed: None.

**expert-tdd**
- Position: Test-reviewer is redundant with LOCAL_REVIEW + Phase 3 Verification.
- Reasoning: The test-reviewer runs the same checks already covered. Needs differentiated scope or removal.
- Objections: (1) Test-reviewer scope is undifferentiated.
- Endorsed: None.

**expert-continuous-delivery**
- Position: Full re-run on any revision is an expensive feedback loop.
- Reasoning: The trade-off (safety over efficiency) is valid but not documented. The revision cycle must be bounded.
- Objections: (1) Trade-off not acknowledged; cost not quantified.
- Endorsed: None.

**expert-bdd**
- Position: Reviewer behavior is procedurally described but observable outcomes are under-specified.
- Reasoning: Session-diff scoping enforcement point is undefined. Out-of-domain reviewer behavior is undefined.
- Objections: (1) Scoping enforcement point unspecified. (2) Out-of-domain behavior undefined.
- Endorsed: None.

---

### Round 2

**expert-tla**
- Position: Unchanged. State machine gap is foundational. Reviewer crash fallback is a liveness requirement.
- Reasoning: Endorses expert-edge-cases' crash fallback. Notes test-reviewer redundancy is a cost issue, not a correctness issue. All prior objections stand.
- Objections: No new objections.
- Endorsed: expert-edge-cases (crash fallback), expert-tdd (scope clarification).

**expert-ddd**
- Position: Refined. Reviewer self-scoping with structured verdict is the clean design.
- Reasoning: Engages with expert-bdd's scoping question. Proposes reviewer self-scopes and ReviewVerdict includes scope field. user_notes is the destination for pre-existing observations. Structured verdict is essential for project-manager.
- Objections: No new objections.
- Endorsed: expert-bdd (scoping enforcement), expert-tla (formal states).

**expert-edge-cases**
- Position: Supports all-re-run as safe default. Differentiates test-reviewer via simulated merge.
- Reasoning: Selective re-run introduces risk. Test-reviewer running against simulated integration merge is genuinely useful. Contradictory findings need structured metadata.
- Objections: No new objections.
- Endorsed: expert-continuous-delivery (trade-off), expert-tdd (differentiation), expert-tla (bounds).

**expert-tdd**
- Position: Redundancy objection conditionally resolved by simulated-merge scope.
- Reasoning: Accepts expert-edge-cases' proposal. Test-reviewer AGENT.md must state differentiated scope explicitly.
- Objections: No new objections.
- Endorsed: expert-edge-cases (simulated merge), expert-tla (states), expert-ddd (schema).

**expert-continuous-delivery**
- Position: Accepts safety argument for full re-run. Trade-off should be documented.
- Reasoning: Expert-edge-cases' safety argument is valid. Bound must be named. Trade-off documentation resolves objection.
- Objections: No new objections.
- Endorsed: expert-tla (bound), expert-edge-cases (safety), expert-ddd (schema).

**expert-bdd**
- Position: Satisfied with reviewer self-scoping and structured verdict convergence.
- Reasoning: Proposes out-of-domain auto-pass with OUT_OF_SCOPE scope. Minimum quorum for reviewer availability.
- Objections: No new objections.
- Endorsed: expert-ddd (self-scoping, verdict), expert-tla (states), expert-edge-cases (fallback).

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-03_wire-project-manager-reviewers-user-notes.md
