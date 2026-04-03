# Debate Session — TLA+ Review: ReviewerGate.tla

## Metadata

- **Date:** 2026-04-03
- **Topic:** Review TLA+ specification (ReviewerGate.tla) against design consensus and original briefing
- **Experts:** expert-tla, expert-edge-cases, expert-tdd
- **Rounds:** 2
- **Result:** CONSENSUS REACHED

---

## Debate Synthesis — tla-review-wire-project-manager-reviewers

**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tla, expert-edge-cases, expert-tdd

---

### Agreed Recommendation

The ReviewerGate.tla specification is structurally sound and correctly captures the core state machine, task lifecycle, reviewer parallelism, bounded retries, quorum-based gate decisions, and the revision cycle. It is suitable for model checking with the following amendments, which all three experts agree are necessary before the spec is considered complete:

1. **Add an ASSUME block** constraining constants to sensible values: `MinReviewQuorum >= 1`, `MinReviewQuorum <= Cardinality(Reviewers)`, `Cardinality(Reviewers) >= 1`, `MaxReviewRevisions >= 1`, `MaxReviewerRetries >= 0`. Without this, the model checker will explore degenerate configurations that produce spurious results.

2. **Fix the scope/verdict inconsistency.** The ReviewerPass action allows existential choice of OUT_OF_SCOPE, but the design says reviewers scope to session diff only. Either constrain all verdicts to SESSION_DIFF scope, or add a safety property ensuring that tasks reaching REVIEW_PASSED have at least one SESSION_DIFF reviewer among those who passed. The current spec allows a task to pass review with all reviewers reporting OUT_OF_SCOPE, which contradicts the design intent.

3. **Add explicit terminal-state immutability properties.** While MERGED and FAILED are sinks by construction (no action transitions out of them), an explicit action property `[][TerminalStatesAreSinks]_vars` would serve as documentation and regression protection.

4. **Add a monotonicity property for reviewRevisionCount.** The count should never decrease. This holds by construction but should be verified explicitly.

5. **Document the retry-reset design decision.** The spec resets reviewer retry counts to zero on each revision cycle (via ResetReviewers). The design says "bounded retries per reviewer" -- clarify whether this is per-round or per-session via a spec comment. The current per-round behavior is reasonable but should be an explicit choice.

6. **Consider (non-blocking) adding early-abort when quorum becomes impossible.** If enough reviewers become UNAVAILABLE that quorum can never be met, remaining RUNNING reviewers continue pointlessly. This is a liveness optimization, not a correctness bug, and can be deferred to implementation.

---

### Expert Final Positions

**expert-tla**
Position: The spec is structurally correct and models the state machine faithfully. Two gaps require fixes: the scope/verdict inconsistency (OUT_OF_SCOPE + PASS is semantically meaningless under the design) and the missing ASSUME block.
Key reasoning: The spec correctly uses TLA+ idioms -- operator-based predicates for compound conditions, EXCEPT for state updates, existential quantification in Next. The fairness condition (WF_vars(Next)) is standard and correct. The safety and liveness properties cover the critical paths. The scope modeling is the most significant gap: it allows a state the design says should not exist. The early-abort concern is a liveness optimization that does not affect correctness.
Endorsed: expert-edge-cases (ASSUME block), expert-tdd (terminal state immutability)

**expert-edge-cases**
Position: The spec handles failure paths well but allows degenerate configurations through unconstrained constants. The retry-reset behavior is an implicit design decision that should be explicit.
Key reasoning: The most serious gap is the missing ASSUME block. Without it, configurations like empty reviewer sets or zero quorum are valid, producing meaningless model checking results. The retry-reset on revision is a design ambiguity -- per-round resets are more lenient than per-session bounds, and the design briefing does not specify which was intended. The OUT_OF_SCOPE + PASS gap (found by expert-tla) is a classic semantic hole -- the type system allows a state that has no meaningful interpretation.
Endorsed: expert-tla (scope/verdict inconsistency), expert-tdd (terminal state sinks, monotonicity)

**expert-tdd**
Position: The spec's "test suite" (safety and liveness properties) has good coverage of the critical paths but is missing several properties that would catch regressions and document intent.
Key reasoning: The existing properties cover bounds, merge-after-pass, reviewer activity during review, and quorum. Missing properties include terminal-state immutability, revision-count monotonicity, and an explicit "review failure implies at least one failing reviewer" property. The MergeOnlyAfterReviewPass property name suggests all reviewers must pass, but it actually checks only responded reviewers (excluding UNAVAILABLE ones). This is correct for the quorum design but the name should be clarified to avoid confusion.
Endorsed: expert-tla (scope/verdict inconsistency), expert-edge-cases (ASSUME block, retry-reset documentation)

---

### Endorsement Map

| Expert | Endorses |
|--------|----------|
| expert-tla | expert-edge-cases (ASSUME block), expert-tdd (terminal state immutability) |
| expert-edge-cases | expert-tla (scope/verdict gap), expert-tdd (terminal sinks, monotonicity) |
| expert-tdd | expert-tla (scope/verdict gap), expert-edge-cases (ASSUME block, retry-reset docs) |

---

## Round 1 Transcript

### expert-tla — Round 1

Position: The specification is structurally sound and captures the core state machine correctly, but has two notable gaps and one potential correctness issue.

Reasoning: The spec correctly models the task lifecycle (PENDING -> LOCAL_REVIEW -> REVIEWING -> REVIEW_PASSED/REVIEW_FAILED/FAILED -> MERGED/REVISING/FAILED), reviewer parallelism with individual state machines (IDLE -> RUNNING -> PASS/FAIL/UNAVAILABLE), bounded retries, quorum-based gate decisions, and the revision cycle. The TypeOK invariant is well-formed and all variables are properly constrained. The safety properties form a reasonable safety envelope. The liveness properties appropriately use leads-to temporal operators.

Three issues identified: (1) No early-termination when quorum becomes impossible mid-review. (2) ReviewerPass allows OUT_OF_SCOPE via existential choice, contradicting the design's "scope to session diff only" requirement. ReviewerFail hardcodes SESSION_DIFF, creating an asymmetry. (3) WF_vars(Next) fairness is standard but worth noting.

Objections:
- OUT_OF_SCOPE with PASS verdict contradicts design
- No early abort when quorum becomes impossible

Endorsements: None

---

### expert-edge-cases — Round 1

Position: The specification handles most failure paths well but misses several edge cases in boundary conditions.

Edge Cases Found:
- [Boundary] All reviewers crash -- handled correctly via ReviewGateNoQuorum -> FAILED
- [Boundary] MinReviewQuorum = 0 -- unhandled: QuorumMet trivially true with zero respondents
- [Boundary] Reviewers = {} (empty set) -- unhandled: AllReviewersFinished vacuously true
- [Sequence] Reviewer dispatched after gate decision -- handled correctly via state guards
- [Boundary] MaxReviewRevisions = 0 -- logically correct but potentially unintended
- [Boundary] MaxReviewerRetries = 0 -- logically correct but aggressive
- [Sequence] Revision count increment timing -- correct (increments on leaving REVISING)
- [Partial failure] ResetReviewers resets retry counts on revision -- design ambiguity

Objections:
- No ASSUME block constraining constants to sensible values
- Retry count reset on revision may violate design's "bounded retries per reviewer" intent

Endorsements: None

---

### expert-tdd — Round 1

Position: The specification has good property coverage for safety but is undertested on the liveness side, and some safety properties are weaker than what the design requires.

Reasoning: Safety properties tested: RevisionBounded, ReviewerRetriesBounded, MergeOnlyAfterReviewPass, ReviewersOnlyDuringReviewing, NoQuorumBlocksMerge. Missing safety properties: terminal-state immutability (MERGED/FAILED are sinks), reviewRevisionCount monotonicity, mutual exclusion of gate decisions. Missing liveness: explicit reviewer completion property. MergeOnlyAfterReviewPass checks only responded reviewers, not all -- correct for quorum design but name is misleading.

Objections:
- Missing explicit terminal-state immutability properties
- Missing monotonicity property for reviewRevisionCount
- MergeOnlyAfterReviewPass name misleading (quorum vs. all)

Endorsements: None

---

## Round 2 Transcript

### expert-tla — Round 2

Position: Maintain prior objections. Engage with and endorse other experts' findings.

Reasoning: expert-edge-cases' ASSUME block point is critical for TLA+ practice. Recommended constraints: MinReviewQuorum >= 1, MinReviewQuorum <= Cardinality(Reviewers), Cardinality(Reviewers) >= 1, MaxReviewRevisions >= 1, MaxReviewerRetries >= 0. expert-tdd's terminal state immutability should be an explicit action property using [][...]_vars idiom. Withdrew fairness concern as observational, not an objection.

Objections (carried): scope/verdict inconsistency, early abort optimization
Endorsements: expert-edge-cases (ASSUME block), expert-tdd (terminal state immutability)

---

### expert-edge-cases — Round 2

Position: Maintain prior objections. Endorse scope/verdict finding.

Reasoning: expert-tla's OUT_OF_SCOPE + PASS finding is a semantic gap -- a type hole in the spec. If scope is OUT_OF_SCOPE, the reviewer effectively did not review the session diff. Whether this counts toward quorum is a design question the spec does not answer. Retry-reset should be documented as a conscious design decision.

Objections (carried): ASSUME block, retry-reset ambiguity
Endorsements: expert-tla (scope/verdict gap), expert-tdd (terminal state sinks)

---

### expert-tdd — Round 2

Position: Maintain prior objections. Refine and engage.

Reasoning: The scope/verdict issue affects what "all must pass" means. Suggested additional property: ReviewFailImpliesFailingReviewer. Fully agree on ASSUME block as TLA+ equivalent of input validation.

Objections (carried): terminal state immutability, monotonicity, misleading property name
Endorsements: expert-tla (scope/verdict gap), expert-edge-cases (ASSUME block, retry-reset docs)

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-03_tla-review-wire-project-manager-reviewers.md
