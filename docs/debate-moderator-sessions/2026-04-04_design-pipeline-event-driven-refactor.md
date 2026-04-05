# Debate Session — Design-Pipeline Event-Driven Refactor

**Date:** 2026-04-04
**Result:** CONSENSUS REACHED
**Rounds:** 3
**Experts:** expert-tdd, expert-ddd, expert-tla, expert-edge-cases, expert-performance, expert-lodash

---

## Agreed Recommendation

The store-per-stage architecture is fundamentally sound for this CLI tool. The following concrete amendments must be incorporated into the design before implementation proceeds:

1. **Add TypeScript interfaces for infrastructure stores.** Define `LlmProvider`, `GitOperations`, and `FileOperations` interfaces. `OpenRouterStore`, `GitStore`, and `FileSystemStore` implement these interfaces. Stage stores depend on the interface, not the concrete class. This restores dependency inversion, provides test seams, and keeps domain code infrastructure-agnostic -- all without bringing back the full ports/adapters directory structure.

2. **Standardize on a single error return type.** Choose either `Error | T` (lodash/attempt style) or `{ok:true, value:T} | {ok:false, error:ErrorKind, message:string}` (Result style). Do not use both. The Result type is more expressive (it carries ErrorKind and message), so the recommendation is to standardize on Result and use a thin wrapper around `lodash/attempt` and `attemptAsync` that converts `Error | T` into the Result type at the boundary.

3. **Complete the state model before scaffolding.** Every store's state machine must enumerate all reachable states and valid transitions explicitly. The following states must be added to the design:
   - **"aborting"** state for stores undergoing destroy() while a waitFor() is pending. Guards must prevent new transitions from the aborting state. AbortController rejection must transition to a terminal "aborted" state.
   - **"retrying"** as an explicit state with a bounded retry count. When retries are exhausted, the store transitions to "error."
   - **"streaming-interrupted"** as a sub-state of streaming, distinguishable from streaming-active and streaming-complete.

4. **Enforce acyclic subscription graph.** The composition root in `index.ts` must enforce that the store subscription graph is a DAG (directed acyclic graph). This can be done at wiring time with a simple topological sort check. Circular subscriptions are a deadlock hazard.

5. **Add jitter to retry backoff.** The `retryWithBackoff` utility must include jitter (e.g., full jitter: random between 0 and computed delay). Without jitter, multiple stores retrying simultaneously create thundering herd bursts against OpenRouter.

6. **Specify per-stage timeout budget.** OpenRouterStore must accept a configurable timeout per LLM call (default: 120 seconds). Timeout expiration transitions to the "error" state, not a silent hang.

7. **Declare side effect idempotency policy.** With the compensation engine eliminated, the design must explicitly state: "All stage side effects are idempotent and re-runnable. Failed runs are re-executed from scratch, not rolled back." This replaces the need for a compensation engine.

8. **Prohibit lodash/attempt on async functions.** Document and enforce (via lint rule or code review convention) that `lodash/attempt` is sync-only. Async error handling uses `attemptAsync` exclusively.

---

## Expert Final Positions

**expert-tdd**
Position: The store-per-stage architecture is testable provided interfaces are added for infrastructure stores and a single error return type is adopted. Big bang scaffolding should encode the complete state model, not an underspecified one.
Key reasoning: TDD demands test seams at infrastructure boundaries. Without interfaces, test doubles must subclass real infrastructure stores, coupling tests to implementation. Dual error types create inconsistent test assertions. The scaffolding-first approach is acceptable only if the state model is complete beforehand.
Endorsed: expert-ddd (interface layer for dependency inversion), expert-tla (state model completeness), expert-edge-cases (dual error type composition risk)

**expert-ddd**
Position: The "classes ARE the contract" decision should be amended to "classes implement typed interfaces." Infrastructure stores must be behind interfaces to maintain domain/infrastructure separation. Domain enums in util/ are acceptable as a pragmatic compromise.
Key reasoning: Port/Adapter pattern exists to separate domain intent from infrastructure delivery. OpenRouterStore is infrastructure language, not domain language. Adding interfaces (LlmProvider, GitOperations, FileOperations) restores the boundary without the full directory structure overhead. GitStore/FileSystemStore as BaseStore subclasses is minor overhead for a CLI tool.
Endorsed: expert-tdd (interfaces as test seams), expert-tla (OrchestratorStore as Saga needs complete state machine)

**expert-tla**
Position: The state model must be fully enumerated before implementation. Three missing states identified: aborting (destroy during waitFor), retrying (with bounded count), streaming-interrupted. Subscription graph must be provably acyclic.
Key reasoning: The design describes states informally but does not enumerate the complete state space. Destroy-during-waitFor creates an unnamed intermediate state that is a safety violation. Circular subscriptions between stores create deadlock. Retry without explicit state makes it impossible to reason about progress guarantees (liveness).
Endorsed: expert-edge-cases (async destroy race is the same safety violation), expert-performance (timeout exhaustion must produce explicit error state)

**expert-edge-cases**
Position: The design has identifiable failure modes that are addressable with concrete fixes: explicit aborting state, jitter in backoff, idempotency policy for side effects, and single error type to avoid conversion failures.
Key reasoning: Partial streaming responses, thundering herd on rate limits, compensation elimination, and async destroy races are all real failure modes. The briefing identified them as edge cases but provided incomplete handling. The group's recommendations (aborting state, jitter, idempotency policy, single error type) address all of them.
Endorsed: expert-tla (aborting state as safety property), expert-performance (jitter for thundering herd), expert-tdd (single error type)

**expert-performance**
Position: Performance is acceptable for a CLI tool where LLM latency dominates. The critical missing element is per-stage timeout budgets to prevent pipeline stalls from provider outages.
Key reasoning: Store subscription overhead is negligible compared to network round-trips. The real performance risk is unbounded LLM call duration. Configurable timeout per stage (default 120s) with explicit error state on expiration prevents silent hangs. Streaming callback overhead is negligible for sequential CLI stages. Jitter in backoff prevents thundering herd.
Endorsed: expert-edge-cases (thundering herd), expert-tla (timeout as explicit error state)

**expert-lodash**
Position: lodash/attempt usage is correct for sync error handling, but must be strictly sync-only. The codebase should standardize on one error return convention to avoid wrapping lodash/attempt output.
Key reasoning: lodash/attempt with async functions silently returns a Promise instead of catching -- a subtle bug. The dual error type (Error | T vs Result) requires conversion at boundaries, which is an unnecessary failure point. Standardizing on Result type with a thin attempt wrapper is the clean solution.
Endorsed: expert-tdd (single error type), expert-edge-cases (error type conversion risk)

---

## Round Transcripts

### Round 1

**expert-tdd**
Position: Store-per-stage architecture broadly sound for testability, but dual error types, missing injection seams, and big bang scaffolding introduce friction.
Reasoning: createTest factories are strong. But "classes ARE the contract" removes the seam for test doubles. Dual error return types (Error | T and Result) create inconsistent assertions. Big bang scaffolding with notImplemented errors does not produce meaningful test feedback.
Objections:
- Dual error return types create inconsistent test assertions
- Eliminating ports/adapters removes the explicit seam for test doubles
- Big bang rewrite with scaffolding-first violates TDD's incremental discipline
Endorsements: None (first round)

**expert-ddd**
Position: Store-per-stage conflates infrastructure with domain modeling. "Classes ARE the contract" is an anti-pattern.
Reasoning: OpenRouterStore, GitStore, FileSystemStore are infrastructure wrapped in domain language. The domain should depend on abstractions, not concrete infrastructure stores. GitStore and FileSystemStore add state machine overhead to stateless operations. Domain enums in util/ de-emphasizes the domain model.
Objections:
- "Classes ARE the contract" eliminates domain/infrastructure boundary
- GitStore and FileSystemStore as BaseStore subclasses add unnecessary state machine overhead
- Shared domain enums in util/ rather than domain-specific location
Endorsements: None (first round)

**expert-tla**
Position: State model is underspecified. Complete state space for OrchestratorStore and stage stores is not enumerated.
Reasoning: States mentioned informally but not fully enumerated. Destroy-during-waitFor creates unnamed intermediate state. Circular subscriptions create deadlock risk. Retry transitions unspecified.
Objections:
- OrchestratorStore state machine not fully enumerated
- Destroy-during-waitFor produces unnamed intermediate state
- No deadlock prevention for circular store-to-store subscriptions
- Retry state transitions unspecified
Endorsements: None (first round)

**expert-edge-cases**
Position: Multiple unhandled failure modes around store lifecycle, concurrent operations, and external dependencies.
Reasoning: Partial streaming, thundering herd, compensation elimination, async destroy race, and input validation gaps identified.
Objections:
- Partial streaming response creates unnamed intermediate state
- Thundering herd on independent backoff without jitter
- Compensation elimination with no replacement rollback policy
- Async destroy race with stage advancement
- No validation gate on store inputs
Endorsements: None (first round)

**expert-performance**
Position: Subscription overhead acceptable for CLI tool. OpenRouter integration needs explicit timeout budgets.
Reasoning: LLM latency dominates. No timeout budget per stage. Backoff without jitter causes thundering herd. Streaming callbacks may fire excessively with token-by-token updates.
Objections:
- No per-stage timeout budget for OpenRouter calls
- Retry backoff without jitter causes thundering herd
- Token-by-token streaming fires excessive subscriber callbacks
Endorsements: None (first round)

**expert-lodash**
Position: lodash/attempt usage correct for sync, but must be prohibited for async. Prompts/schemas should consider lodash utilities.
Reasoning: attempt with async functions silently returns Promise instead of catching. Dual error types require conversion layer.
Objections:
- lodash/attempt must not be used with async functions
- No mention of lodash for data transformation in prompts/schemas
Endorsements: None (first round)

### Round 2

**expert-tdd**
Position: Maintaining core objections. Interface seam and single error type are primary concerns.
Objections:
- (Reiterated) Dual error types remain unresolved
- (New) Test doubles require abstract interface/type as seam, not just constructor injection
Endorsements: expert-ddd (classes-as-contract merges domain/infrastructure), expert-tla (state model before scaffolding), expert-edge-cases (partial streaming state for test coverage)

**expert-ddd**
Position: Maintaining core objection on infrastructure/domain confusion. Withdrawing GitStore/FileSystemStore overhead as minor.
Objections:
- (Reiterated) Infrastructure stores need interface layer with correct dependency direction
- (Dropped) GitStore/FileSystemStore overhead -- minor, withdrawing
Endorsements: expert-tdd (interfaces as test seams = dependency inversion), expert-tla (OrchestratorStore as Saga needs full state machine)

**expert-tla**
Position: Maintaining state completeness objections. Group agreement strengthens the case.
Objections:
- (Reiterated) Destroy-during-waitFor needs explicit aborting state
- (Reiterated) Circular subscription deadlock prevention
- (Reiterated) Retry as explicit state
Endorsements: expert-edge-cases (async destroy race is same safety violation), expert-performance (streaming sub-states may be needed)

**expert-edge-cases**
Position: Maintaining core objections. Dual error type conversion is new composition risk.
Objections:
- (Reiterated) Partial streaming needs explicit state
- (Reiterated) Thundering herd -- jitter required
- (Reiterated) Compensation elimination needs idempotency policy
- (New) Dual error type conversion is a composition failure point
- (Dropped) Input validation -- Zod schemas handle this
Endorsements: expert-tla (aborting state as safety requirement), expert-performance (jitter for thundering herd), expert-tdd (dual error types as composition risk)

**expert-performance**
Position: Maintaining timeout budget objection. Withdrawing streaming callback concern as speculative.
Objections:
- (Reiterated) Per-stage timeout budget must be specified
- (Dropped) Streaming callback overhead -- speculative for CLI
Endorsements: expert-edge-cases (thundering herd), expert-tla (timeout as explicit error state)

**expert-lodash**
Position: Maintaining async/attempt prohibition. Withdrawing prompts/schemas concern.
Objections:
- (Reiterated) lodash/attempt sync-only
- (New) Standardize on one error return convention
- (Dropped) lodash in prompts/schemas -- minor
Endorsements: expert-tdd (single error type), expert-edge-cases (error type conversion risk)

### Round 3

All experts converged. No new objections raised. Consensus reached on the 8-point recommendation.

**expert-tdd**: No new objections. Endorsed group consensus on interfaces, single error type, and complete state model.
**expert-ddd**: No new objections. Endorsed interface layer as pragmatic compromise.
**expert-tla**: No new objections. Endorsed group agreement on state completeness.
**expert-edge-cases**: No new objections. Proposed idempotency policy as compensation replacement. Endorsed group consensus.
**expert-performance**: No new objections. Endorsed timeout budget.
**expert-lodash**: No new objections. Endorsed single error convention.

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-04_design-pipeline-event-driven-refactor.md
