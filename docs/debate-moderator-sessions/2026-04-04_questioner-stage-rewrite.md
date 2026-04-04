# Debate Session — Questioner Stage Rewrite

**Date:** 2026-04-04
**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tdd, expert-ddd, expert-edge-cases, expert-tla, expert-continuous-delivery

---

## Debate Synthesis — questioner-stage-rewrite

**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tdd, expert-ddd, expert-edge-cases, expert-tla, expert-continuous-delivery

---

### Agreed Recommendation

The questioner stage rewrite design is fundamentally sound. The architecture (bypassing ClaudeAdapter for a direct SDK multi-turn loop), the store integration (waitFor completion gate), and the structured JSON protocol are well-chosen. However, the design has eight concrete gaps that must be addressed before implementation:

1. **Dependency injection for Anthropic SDK client.** `runQuestionerSession()` and the lint-fixer module must accept the SDK client as an injected dependency. Without this, the core loop and lint-fixer are untestable without network calls.

2. **Programmatic liveness bound.** Add a generous turn cap (e.g., 50 turns) as a safety valve. LLM behavioral instructions are insufficient as the sole termination guarantee. The cap converts an unprovable fairness assumption into guaranteed termination.

3. **Guard the SIGNING_OFF transition.** When the CLI expects a signoff response from the LLM (after user confirms), the CLI must handle the case where the LLM produces a question instead. Options: retry the signoff instruction (limited attempts) or CLI-force a signoff from current conversation content.

4. **Use a discriminated union for session state.** Replace the `signedOff: boolean` flag inside `artifacts.Questioner` with a TypeScript discriminated union representing all session states: questioning, awaitingInput, summaryPresented, signingOff, completed, failed. This makes invalid transitions unrepresentable and separates session lifecycle from domain artifact.

5. **Exact-match "/summary" interception.** The "/summary" command must be matched as the user's exact full input, not as a keyword or substring. Otherwise, legitimate answers containing "/summary" will trigger unintended behavior.

6. **Specify retry-exhaustion store status.** When retry exhaustion aborts the session, transition the store to `failed` with error kind `retry_exhausted` and set the artifact to the incomplete briefing path.

7. **Feature flag removal plan.** Document the conditions under which the stages 2-7 feature flag will be removed (e.g., "remove after stages 2-7 are migrated to the new orchestrator"). Create a removal ticket at flag creation time.

8. **Lint-fixer non-interactive fallback.** When running in a non-interactive environment (CI, background process), the lint-fixer must not block on user escalation. Add a non-interactive mode that skips escalation and saves current state.

Secondary recommendations (endorsed but not blocking):
- Consider session resumption capability for mid-session failures (retry exhaustion, crash). Users lose all prior answers today.
- Add rate-limit awareness between questioner session and lint-fixer when they share an API key.
- Validate `claude` CLI availability at pipeline startup before reaching the stages 2-7 handoff.

---

### Expert Final Positions

**expert-tdd**
Position: Design is sound in separation of concerns but has critical testability gaps around SDK injection, lint-fixer testing, and feature flag path divergence.
Key reasoning: The multi-turn SDK loop and lint-fixer module both have external dependencies (Anthropic SDK, ESLint) that must be injectable for unit testing. The feature flag creates two code paths, and tests exercising the flag-on path do not prove the production (flag-off) path works. The unguarded SIGNING_OFF transition cannot have a failing test written for it because the expected behavior is undefined.
Endorsed: expert-edge-cases (session resumption gap as untestable recovery), expert-tla (unguarded SIGNING_OFF transition as untestable undefined behavior)

**expert-ddd**
Position: Adequate domain modeling for a CLI tool but the store shape conflates session lifecycle with domain artifact, and naming should be more domain-precise.
Key reasoning: `signedOff: boolean` inside the artifact mixes mechanical session state with the domain output (the briefing). Session lifecycle should be a discriminated union; the artifact should contain only the briefing content. "signoff" as a type name is ambiguous between session termination and content approval. The `claude` CLI dependency is correctly bounded to the orchestrator.
Endorsed: expert-tla (discriminated union as TypeScript encoding of state model), expert-continuous-delivery (correct dependency boundary for claude CLI)

**expert-edge-cases**
Position: Several unhandled edge cases, most critically the absence of a programmatic liveness bound and the "/summary" keyword false-positive risk.
Key reasoning: No turn cap + LLM-only liveness creates a trap where the user's only escape is Ctrl+C. The "/summary" keyword interception must be exact-match to avoid false positives. Rate-limit coordination between questioner and lint-fixer is missing. Session resumption after retry exhaustion is absent.
Endorsed: expert-tla (unguarded SIGNING_OFF transition as most critical edge case), expert-continuous-delivery (lint-fixer non-interactive fallback)

**expert-tla**
Position: State model is mostly sound but has an unguarded transition and an unprovable liveness property.
Key reasoning: The SIGNING_OFF -> COMPLETED transition assumes the LLM will cooperate; the CLI must enforce it. Termination depends on LLM behavior (a fairness assumption), not a proved property. A programmatic bound makes termination provable. Retry-exhaustion store status must be explicitly specified as `failed` with `retry_exhausted` error kind. Session state should be a discriminated union to make invalid transitions unrepresentable.
Endorsed: expert-edge-cases (liveness concern is formally equivalent to fairness-assumption gap), expert-ddd (discriminated union is correct TypeScript encoding)

**expert-continuous-delivery**
Position: Deployable design with correct feature flag strategy, but missing flag removal plan and lint-fixer non-interactive handling.
Key reasoning: Feature flag gating stages 2-7 is textbook incremental delivery, but flags without removal plans become permanent configuration debt. The lint-fixer's user-escalation pattern blocks indefinitely in non-interactive environments. The `claude` CLI dependency boundary is correctly placed in the orchestrator.
Endorsed: expert-tdd (feature flag bifurcation is a deployment concern), expert-edge-cases (rate-limit coordination is a pipeline health concern)

---

## Round Transcripts

### Round 1

**expert-tdd**
Position: Design is sound in separation of concerns but has significant testability gaps around the multi-turn SDK loop and the lint-fixer module.

Reasoning: The decision to bypass ClaudeAdapter and use the Anthropic SDK directly creates a new, untested integration surface. The multi-turn conversation loop in `runQuestionerSession()` will be difficult to test unless the Anthropic SDK client is injected as a dependency. If the SDK client is hard-wired, unit tests cannot stub the LLM responses, making it impossible to test the Zod parsing, the "/summary" interception, the sign-off flow, or the retry logic without hitting a real API. The briefing does not mention dependency injection for the SDK client. The double-pass lint-fixer convention is good but the lint-fixer module itself needs tests with injectable dependencies. The feature flag gating creates a bifurcated test surface.

Objections:
- No mention of dependency injection for the Anthropic SDK client — core loop untestable without network calls.
- Lint-fixer module testability unaddressed (two external dependencies, stateful recipes file).
- Feature flag bifurcation means test path and production path diverge.

Endorsements: None

---

**expert-ddd**
Position: Store shape conflates session mechanics with domain outcome; naming could better reflect the domain.

Reasoning: `artifacts.Questioner` sub-object mixes session-level mechanical state (`signedOff`) with domain-level artifacts (`questions`, `summary`). In DDD terms, `signedOff` is a lifecycle flag on the session entity, not a property of the questioner's output artifact. The structured JSON protocol is clean as a wire format but "signoff" is ambiguous in domain terms. The store `waitFor()` pattern is sound but "store only notified of final outcome" means intermediate progress is invisible, with consequences for recoverability.

Objections:
- `signedOff` boolean inside artifact conflates session lifecycle with domain output. Use discriminated union.
- "signoff" as a type name is ambiguous.

Endorsements: None

---

**expert-edge-cases**
Position: Several unhandled edge cases around no-turn-cap, SIGINT timing, and lint-fixer escalation loops.

Reasoning: No turn cap + LLM behavioral liveness only creates a trap. SIGINT during store write could produce inconsistent partial state. Malformed JSON retry exhaustion mid-session loses all prior answers with no resume path. Anthropic SDK rate limit could cascade from questioner to lint-fixer. Empty user input not validated. "/summary" keyword interception risks false positives.

Objections:
- No programmatic liveness safety valve.
- "/summary" interception via keyword matching risks false positives.
- No session resumption after retry exhaustion.
- No rate-limit coordination between questioner and lint-fixer.

Endorsements: None

---

**expert-tla**
Position: State model is mostly sound but has underspecified SIGNING_OFF transition and unprovable liveness.

Reasoning: State model enumerated as IDLE, QUESTIONING, AWAITING_USER_INPUT, SUMMARY_PRESENTED, SIGNING_OFF, COMPLETED, FAILED. The SIGNING_OFF -> COMPLETED transition assumes LLM cooperation. LLM behavioral instructions are a fairness assumption, not a proved termination property. Retry-exhaustion store status is not specified.

Objections:
- SIGNING_OFF -> COMPLETED transition is unguarded.
- Liveness (session termination) is a fairness assumption, not a proved property.
- Store status for retry-exhaustion abort is not specified.

Endorsements: None

---

**expert-continuous-delivery**
Position: Deployable with correct feature flag strategy but missing removal plan and lint-fixer non-interactive handling.

Reasoning: Feature flag gating is textbook incremental delivery but needs a removal plan. Lint-fixer user-escalation blocks in non-interactive environments. Double-pass convention is sound but doubles pipeline time. Shell-out to `claude` CLI is a deployment coupling that should be validated at startup.

Objections:
- No feature flag removal plan.
- Lint-fixer user-escalation blocks in non-interactive environments.

Endorsements: None

---

### Round 2

**expert-tdd**
Position: Maintains all Round 1 objections. Session resumption gap is also a testability concern — cannot write recovery tests without a resumption mechanism. Unguarded SIGNING_OFF transition cannot have a failing test written for undefined behavior.

Objections: (All reiterated from Round 1)

Endorsements:
- expert-edge-cases: Session resumption gap is an untestable recovery path.
- expert-tla: Unguarded SIGNING_OFF transition means undefined behavior that cannot be test-first driven.

---

**expert-ddd**
Position: Maintains Round 1 objections. expert-tla's state enumeration should map to a TypeScript discriminated union. Confirmed `claude` CLI dependency boundary is correctly placed in orchestrator.

Objections: (All reiterated from Round 1)

Endorsements:
- expert-tla: Discriminated union for session state is the correct TypeScript encoding of the state model.
- expert-continuous-delivery: `claude` CLI dependency boundary correctly placed in orchestrator.

---

**expert-edge-cases**
Position: Maintains all Round 1 objections. Sharpened "/summary" to require exact full-input match. expert-tla's unguarded SIGNING_OFF transition is the strongest edge case.

Objections: (All reiterated/sharpened from Round 1)

Endorsements:
- expert-tla: Unguarded SIGNING_OFF transition is the most critical edge case in the design.
- expert-continuous-delivery: Lint-fixer non-interactive fallback is an edge case that must be addressed.

---

**expert-tla**
Position: Maintains all Round 1 objections. Refined retry-exhaustion to require explicit `failed` status with `retry_exhausted` error kind.

Objections: (All reiterated/refined from Round 1)

Endorsements:
- expert-edge-cases: Liveness concern is formally equivalent to fairness-assumption objection.
- expert-ddd: Discriminated union is the correct TypeScript encoding of the state model.

---

**expert-continuous-delivery**
Position: Maintains Round 1 objections. Dropped `claude` CLI concern per expert-ddd clarification.

Objections: (Reiterated from Round 1, minus claude CLI concern which was resolved)

Endorsements:
- expert-tdd: Feature flag bifurcation is also a deployment concern.
- expert-edge-cases: Rate-limit coordination is a pipeline health concern.

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-04_questioner-stage-rewrite.md
