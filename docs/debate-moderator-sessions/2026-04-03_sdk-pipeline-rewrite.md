# Debate Session — SDK Pipeline Rewrite

**Date:** 2026-04-03
**Result:** CONSENSUS REACHED
**Rounds:** 4
**Experts:** expert-tdd, expert-ddd, expert-edge-cases, expert-continuous-delivery, expert-tla

---

## Debate Synthesis — sdk-pipeline-rewrite

**Result:** CONSENSUS REACHED
**Rounds:** 4
**Experts:** expert-tdd, expert-ddd, expert-edge-cases, expert-continuous-delivery, expert-tla

---

### Agreed Recommendation

The SDK pipeline rewrite concept is sound in principle — TypeScript as the state machine, Zod-validated stage boundaries, agents as pure domain instructions — but the proposed implementation has five critical architectural flaws that must be resolved before proceeding:

1. **Replace singleton in-memory state with instance-scoped pipeline state.** Each pipeline run must own its own state object, passed through the pipeline as an explicit parameter. This eliminates concurrent corruption, restores test isolation, and enables crash recovery via optional serialization. The singleton is the root cause of safety, testability, deployment, and domain modeling failures identified by all five experts.

2. **Decompose the god object orchestrator into stage-scoped coordinators.** Each pipeline stage should be an independent module with its own coordinator, testable in isolation. The top-level orchestrator composes these stages but does not contain their logic. This restores the test pyramid, respects bounded context boundaries, and enables incremental migration.

3. **Migrate incrementally, not big-bang.** Start with one or two stages (e.g., questioner + debate) behind a feature flag. Old agent files coexist with new SDK stages until each stage is proven in production. Delete old files only after the replacement is validated. Each stage migration is an independently deployable, independently rollbackable change.

4. **Isolate git operations behind a repository port/adapter.** Git child_process calls must be behind an interface that can be substituted with a test double. Domain logic must never directly spawn child processes. This restores fast unit test capability and separates infrastructure from domain.

5. **Model explicit transaction boundaries per stage with compensation patterns.** Each stage must define its own consistency guarantees. When stage N fails after stage N-1 succeeded, the system must either compensate (undo side effects) or checkpoint (resume from last good state). The current design has no recovery strategy for partial pipeline completion.

Additionally, the state model must explicitly enumerate retry states, streaming input states, and validation failure recovery paths as first-class states in the type system — not implicit runtime conditions.

---

### Expert Final Positions

**expert-tdd**
Position: Strongly opposed to the design as proposed.
Key reasoning: The singleton in-memory state breaks test isolation, making tests order-dependent and non-deterministic. Git child_process operations force most meaningful tests to the slow integration level, inverting the test pyramid. The god object orchestrator centralizes logic that should be independently unit-testable. The 7-stage big-bang approach prevents incremental test-driven development. Streaming input and async operations introduce timing dependencies that create flaky tests.
Endorsed: expert-edge-cases (concurrent corruption destroys test isolation), expert-ddd (god object makes unit testing impossible), expert-continuous-delivery (batch size prevents incremental testing), expert-tla (retry state explosion creates exponential test scenarios).

**expert-ddd**
Position: Strongly opposed to the design as proposed.
Key reasoning: The singleton state violates aggregate boundaries — each pipeline run should be its own aggregate with encapsulated state. The "thin agents" design creates anemic domain models where agents are data carriers without behavior, pushing business logic into the orchestrator god object. Technical terms (stages, pipelines, state managers) violate Ubiquitous Language — the code should speak the language of design evaluation, not software plumbing. Pipeline stages lack explicit transaction boundaries and compensation patterns, violating DDD consistency principles.
Endorsed: expert-edge-cases (singleton corrupts domain model integrity), expert-tdd (infrastructure bleeding into domain layer), expert-continuous-delivery (coupling prevents bounded context evolution), expert-tla (aggregate boundary violations map to invariant preservation failures).

**expert-edge-cases**
Position: Strong opposition to the design as proposed.
Key reasoning: The design has critical blind spots in concurrent execution (multiple pipelines corrupting singleton state), resource management (unbounded memory growth from retained intermediate outputs), crash recovery (process termination loses all state with no checkpoint/resume), child process management (zombie processes, git lock contention), and streaming input (no backpressure or buffer overflow protection). Agent timeout cascades can permanently block the singleton pipeline with no circuit breaker. Cross-stage error propagation lacks transactional rollback to last known good state.
Endorsed: expert-tdd (child_process untestable at unit level), expert-ddd (singleton violates aggregate boundaries), expert-continuous-delivery (poor rollback compounds crash recovery), expert-tla (missing streaming states in formal model).

**expert-continuous-delivery**
Position: Strongly opposed to the design as proposed.
Key reasoning: The migration is a textbook big-bang deployment — all 7 stages, state management rewrite, and dependency changes in a single batch. Deployment risk scales with change size. In-memory state eliminates the implicit rollback capability that file persistence provided. Deleting old agent files creates an irreversible deployment dependency. The singleton prevents A/B testing pipeline stages or canary deployments. Operational runbook complexity is extreme (debugging requires git + memory + streaming + filesystem state simultaneously). The design violates twelve-factor app principles for environment parity.
Endorsed: expert-edge-cases (concurrent corruption validates deployment dependencies), expert-tdd (child_process makes deployment testing impossible), expert-ddd (transaction boundaries compound rollback complexity), expert-tla (state explosion makes deployment validation intractable).

**expert-tla**
Position: Strongly opposed to the design as proposed.
Key reasoning: The proposed state model is dangerously incomplete. The actual state space is the Cartesian product of pipeline states, retry states, streaming states, and validation states — not a simple linear sequence. The singleton lacks concurrency control, violating safety properties. Streaming input creates async wait states not represented in stage transitions. Retry logic multiplies the state space by retry count times backoff states. Stage transitions assume atomic validation success, but Zod failures create multi-step error recovery paths that can leave partial state. Temporal ordering violations are possible when streaming input and async git operations create stale state. Invariant composition fails when multiple agents interact through shared state.
Endorsed: expert-edge-cases (concurrent corruption validates safety property concerns), expert-ddd (aggregate boundary violations map to invariant preservation failures), expert-tdd (system dependencies make state model unverifiable), expert-continuous-delivery (state explosion makes deployment validation intractable).

---

### Endorsement Map

| Expert | Endorsed by |
|--------|------------|
| expert-edge-cases | expert-tdd, expert-ddd, expert-continuous-delivery, expert-tla |
| expert-ddd | expert-tdd, expert-edge-cases, expert-continuous-delivery, expert-tla |
| expert-tdd | expert-ddd, expert-edge-cases, expert-continuous-delivery, expert-tla |
| expert-continuous-delivery | expert-tdd, expert-ddd, expert-edge-cases, expert-tla |
| expert-tla | expert-tdd, expert-ddd, expert-edge-cases, expert-continuous-delivery |

All experts endorsed all other experts' key points — full cross-endorsement achieved.

---

## Per-Round Transcripts

### Round 1

**expert-tdd (Round 1)**
Position: Cautiously supportive with major reservations about testability violations.
Reasoning: The design has excellent structural elements for TDD — Zod validation at boundaries and mocked Claude API calls create a highly testable foundation. Pure domain instructions for agents are brilliant for testing. However, in-memory singleton state breaks test isolation, git operations via child_process make fast unit tests impossible, 7-stage pipeline complexity is not justified by failing tests, and streaming input adds test setup complexity.
Objections: Singleton breaks test isolation; git child_process prevents fast unit tests; 7-stage complexity unjustified; streaming adds unnecessary test complexity.
Endorsements: None (Round 1).

**expert-ddd (Round 1)**
Position: Cautiously opposed.
Reasoning: The explicit domain modeling (BriefingResult, DebateSynthesis, etc.) and typed discriminated unions are exemplary DDD. However, singleton state violates aggregate boundaries, "thin agents" create anemic domain models, and the orchestrator is a god object that centralizes all pipeline logic.
Objections: Singleton violates aggregate boundaries; anemic agent models; god object orchestrator.
Endorsements: None (Round 1).

**expert-edge-cases (Round 1)**
Position: Critical blind spots in state consistency, resource management, and concurrent execution.
Reasoning: The designer focused on Claude API resilience but ignored fundamental systems engineering concerns. In-memory singleton is a critical vulnerability. Streaming lacks backpressure. Concurrent execution unaddressed. Git child_process assumes clean single-user repository.
Edge Cases Found: Concurrent pipeline corruption, OOM from unbounded memory, process crash state loss, git lock contention, streaming buffer overflow, child process zombies, Zod semantic drift, error handler recursion.
Objections: No crash recovery; concurrent execution unaddressed; child process cleanup missing; no backpressure.
Endorsements: None (Round 1).

**expert-continuous-delivery (Round 1)**
Position: Strong opposition.
Reasoning: Textbook big-bang migration. File-based persistence provided implicit rollback; in-memory eliminates this. Deleting agent files creates irreversible deployment dependency. 100% coverage target signals scope creep that delays feedback.
Objections: Excessive batch size; poor rollback story; deployment dependencies.
Endorsements: None (Round 1).

**expert-tla (Round 1)**
Position: Partially sound but dangerously incomplete state model.
State Model: Pipeline states x Retry states x Streaming states x Validation states (Cartesian product).
Reasoning: The design treats the pipeline as a simple linear state machine, but each stage requires multiple orthogonal state dimensions. Singleton assumes exclusive access with no enforcement. Streaming creates async wait states. Retry logic creates temporal states not explicitly modeled.
Objections: Singleton without concurrency control; unmodeled streaming states; retry state explosion; atomic handoff assumption.
Endorsements: None (Round 1).

### Round 2

**expert-tdd (Round 2)**
Position: Opposed (moved from cautiously supportive).
New objections: Test pyramid violation (architecture forces most tests to integration level); flaky tests from timing dependencies.
Endorsements: expert-edge-cases, expert-continuous-delivery, expert-ddd, expert-tla.

**expert-ddd (Round 2)**
Position: Strongly opposed.
New objection: Ubiquitous Language violation — technical terms don't reflect domain concepts.
Endorsements: expert-edge-cases, expert-tdd, expert-continuous-delivery, expert-tla.

**expert-edge-cases (Round 2)**
Position: Strong opposition.
New objections: Agent timeout cascade failures (no circuit breaker); cross-stage error propagation (no transactional rollback).
Endorsements: expert-tdd, expert-ddd, expert-continuous-delivery, expert-tla.

**expert-continuous-delivery (Round 2)**
Position: Strong opposition.
New objections: Operational runbook complexity; environment parity violations (twelve-factor).
Endorsements: expert-edge-cases, expert-tdd, expert-tla.

**expert-tla (Round 2)**
Position: Strongly opposed.
New objections: Temporal ordering violations; invariant composition failure.
Endorsements: expert-edge-cases, expert-ddd, expert-tdd.

### Round 3

**expert-tdd (Round 3):** No new objections. Ready for synthesis.
**expert-ddd (Round 3):** New objection: Transaction boundary violations — no compensation patterns for partial failures.
**expert-edge-cases (Round 3):** No new objections. Ready for synthesis.
**expert-continuous-delivery (Round 3):** New objection: Feature flag impossibility — singleton prevents canary deployments.
**expert-tla (Round 3):** No new objections. Ready for synthesis.

### Round 4

All 5 experts: No new objections. Ready for synthesis. Consensus reached.

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-03_sdk-pipeline-rewrite.md
