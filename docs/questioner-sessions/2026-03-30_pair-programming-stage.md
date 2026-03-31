# Questioner Session — Pair Programming Stage

**Date:** 2026-03-30
**Status:** COMPLETE
**Dispatched to:** pending

---

## Purpose

Extend the design-pipeline with a Stage 6 that autonomously implements the plan from Stage 5 using parallel pair programming sessions. Each session is two agents doing strict ping-pong TDD. The goal is fully autonomous code generation — no human in the loop during coding — with self-review at the end. No PRs are produced; future pipeline stages (out of scope) handle what comes after.

## Artifact / Output Type

Working, uncommitted code in the repo. No documents produced. Self-review runs but writes no artifacts. The pipeline ends at Stage 6.

## Trigger

Automatically dispatched by the design-pipeline orchestrator after Stage 5 (implementation-writer) completes. A user confirmation gate sits between Stage 5 and Stage 6 — the user reviews the task breakdown, tier ordering, and agent pairings before autonomous work begins.

## Inputs

- Full accumulated pipeline context: briefing, design consensus, TLA+ spec, TLA+ review consensus, implementation plan
- The implementation plan (Stage 5 output) must now include:
  - Independent task groupings organized into execution tiers
  - Blocker dependencies between tiers (some tasks must complete before others can start)
  - Agent pair assignment per task: 1 code writer + 1 test writer, with a one-sentence rationale
- The implementation-writer must decide which tasks are blockers and which can run in parallel

## Outputs

- Uncommitted, working code in the repository
- All tests passing
- Type-check and lint passing
- No written documents or reports

## Ecosystem Placement

Internal to the design-pipeline. Not a standalone skill. Never invoked directly by users.

## Handoff

- **Receives from:** design-pipeline orchestrator (after Stage 5 + user confirmation)
- **Passes to:** Pipeline ends. Future stages (out of scope) pick up from the uncommitted code.

## Error States

### Pair session failure
- Session surfaces issue to orchestrator
- Orchestrator re-dispatches with a different agent pair
- If re-dispatch also fails, escalate to user

### Merge conflicts (worktree merge-back)
- Orchestrator attempts auto-merge first
- If auto-merge fails, orchestrator spawns a fix session with a fresh agent pair

### Global review failure
- Orchestrator spawns targeted fix sessions for the failing issues
- Re-runs global review after fix sessions complete
- Loops until all checks pass — no cap, no user intervention needed

### Local review failure
- Agents attempt to fix within the session
- If unresolvable, treated as a session failure (see above)

## Name

Stage 6: Pair Programming

## Scope

### In scope
- Modifications to design-pipeline orchestrator (SKILL.md) — add Stage 6 state machine states and transitions
- Modifications to implementation-writer (AGENT.md) — add task grouping, tier ordering, blocker identification, and agent pair assignment to output format
- Five new writer agents (AGENT.md files, internal only):
  - vitest-writer — unit/integration tests using Vitest (.test.ts files)
  - playwright-writer — E2E/browser tests using Playwright (.spec.ts files)
  - typescript-writer — general TypeScript domain logic, utilities, types (.ts files)
  - hono-writer — Hono route handlers, middleware, server-side code (.ts files)
  - ui-writer — JSX components, server-rendered or client-rendered UI (.tsx files)
- Pair session orchestration: worktree creation, ping-pong TDD protocol, local self-review, worktree merge-back
- Tier-based execution: parallel dispatch of independent tasks, sequential execution of blocker tiers
- Global self-review: full test suite, type-check, lint, cross-task integration, TLA+ coverage audit
- Fix cycle: global review → targeted fix sessions → re-review loop

### Out of scope
- Pull request creation
- Written review documents or reports
- Standalone `/pair-program` slash command
- Any pipeline stages after Stage 6
- Changes to Stages 1–4 of the pipeline

## Edge Cases

### Single-task plan
If the implementation-writer produces only one task, Stage 6 still runs — one pair session, one tier, no parallelism needed.

### Agent reuse across parallel sessions
The same agent type can appear in multiple concurrent sessions. E.g., vitest-writer can be paired with hono-writer in Task 1 and typescript-writer in Task 2, both running simultaneously. Each is an independent agent instance.

### File isolation
Parallel pair sessions run in separate git worktrees to prevent file conflicts. The implementation-writer's task breakdown should assign separate files per task, but worktrees provide hard isolation regardless.

### Pairing rules
- Always 1 code writer + 1 test writer (never 2 code writers or 2 test writers)
- Code writers: typescript-writer, hono-writer, ui-writer
- Test writers: vitest-writer, playwright-writer
- Any code writer can pair with any test writer (open 3×2 matrix)
- Implementation-writer selects the best-match pair per task

### Ping-pong TDD protocol
1. Test writer writes a failing test
2. Code writer makes it pass
3. Code writer refactors if needed
4. Back to test writer for the next failing test
5. Repeat until task is complete

### Local self-review (per session)
1. All tests pass
2. Type-check passes
3. Lint passes
4. TLA+ states/transitions assigned to this task are covered by tests
5. No files left in a broken state
6. Mutual cross-review: test writer reviews implementation, code writer reviews tests

### Global self-review (after all tiers)
1. Full test suite passes (all tasks together)
2. Type-check passes across whole project
3. Lint passes across whole project
4. Cross-task integration check (imports, shared types, API contracts)
5. TLA+ coverage audit — every state, transition, and invariant from the spec is covered

## Expert Council

### Included
- expert-tdd — TDD ping-pong is the core collaboration model; validates discipline is preserved
- expert-continuous-delivery — worktree branching, merge-back, tier batching are deployment pipeline concerns
- expert-edge-cases — parallel sessions, merge conflicts, failure cascades have many edge cases to stress-test

### Excluded
- expert-ddd — Stage 6 is orchestration infrastructure, not domain modeling
- expert-bdd — no user-facing behavior to model; internal agent choreography
- expert-atomic-design — no UI component design involved
- expert-tla — TLA+ spec was already written and reviewed in Stages 3-4; Stage 6 executes against it
- expert-performance — parallel sessions are about correctness, not performance tuning

## Debate Requested

Yes (pipeline run — mandatory)

---

## Open Questions

None — all branches resolved.
