# Questioner Session — Trainer as Code Writer with Agent Contracts

**Date:** 2026-03-31
**Status:** COMPLETE
**Dispatched to:** debate-moderator

---

## Purpose
Make the trainer accessible as a code writer (`trainer-writer`) through the implementation-writer's task assignment system, replacing its current direct dispatch from the questioner. Introduces Zod-based contract validation as the testing mechanism for agent artifacts, and as the foundation for inter-agent contract testing across the pipeline.

## Artifact / Output Type
Modifications to implementation-writer AGENT.md, trainer AGENT.md, questioner SKILL.md, plus a new `packages/agent-contracts/` monorepo package containing Zod schemas and vitest contract tests.

## Trigger
Implementation-writer selects `trainer-writer` when a step's output is Claude Code artifacts (files in `.claude/skills/`, `.claude/hooks/`, agent/skill definitions, shell scripts) rather than application code.

## Inputs
Standard code writer inputs — implementation step description, file list, dependencies, test-first mandate, TLA+ coverage mapping, and all accumulated pipeline context (briefing, design consensus, TLA+ spec, TLA+ review consensus).

## Outputs
Agent/skill artifacts (SKILL.md, AGENT.md, .sh hook files in `.claude/`), validated against Zod contract schemas. The trainer-writer also produces a manifest of all created files.

## Ecosystem Placement
Integrated into the existing Stage 6 pair programming protocol. No special casing — same TDD ping-pong cycle, same git worktree merge process, same verification suite (vitest + tsc + ESLint all handle markdown and TypeScript).

## Handoff
- Questioner no longer dispatches to trainer directly. The trainer-writer is only reachable through the implementation-writer's task assignment table in Stage 6.
- Trainer-writer output merges via the same git worktree flow as all other code writers.
- Contract validation runs as part of the standard vitest test suite — no separate validation step needed.

## Error States
All handled by existing pipeline mechanisms:
1. **Contract validation fails** — standard TDD fix cycle (back to HANDSHAKE, bounded retries)
2. **Artifacts conflict with existing skills** — trainer's orient phase scans existing artifacts (context comes from accumulated pipeline artifacts)
3. **Wrong code writer assigned** — caught at Stage 6a confirmation gate when user reviews task assignments

## Name
`trainer-writer` (code writer role label in the implementation-writer's assignment table). The trainer agent itself retains the name "trainer."

## Scope
**In scope:**
- Add `trainer-writer` as fourth code writer option in implementation-writer AGENT.md
- Modify trainer AGENT.md to accept implementation step input shape (not just questioner briefing)
- Remove trainer from questioner's dispatch target scanning
- Create `packages/agent-contracts/` monorepo package
- Trainer-writer output contract (Zod schema) as the first contract
- Contract tests with in-memory fixtures (no filesystem reads/writes)

**Out of scope:**
- Contracts for other agent handoffs (questioner → debate, debate → TLA-writer, etc.) — future work
- Changes to the ping-pong TDD protocol
- Changes to Stage 6 merge/verification process
- New test writer type — vitest-writer handles contract tests

## Edge Cases
- **Mixed pipeline runs:** A feature requiring both application code and new agents (e.g., Hono route + new skill). The implementation-writer assigns some steps to `hono-writer` and others to `trainer-writer` within the same pipeline run. The tier system handles this naturally — different steps, different writers, same pipeline.
- **Contract schema evolution:** As agent output shapes change, contract schemas must be updated. Standard version control handles this — breaking changes are caught by failing tests.

## Expert Council
### Included
- expert-tdd — Core question is how to TDD agent artifacts; contract testing pattern needs TDD expert validation
- expert-ddd — Contracts define bounded context boundaries between agents; this is domain boundary design
- expert-edge-cases — Agent handoff failures, wrong writer assignment, mixed code+agent pipelines need scrutiny
- expert-continuous-delivery — New package in monorepo affects build/publish pipeline, contract tests need CI integration

### Excluded
- expert-tla — Pipeline TLA+ spec update is mechanical, no formal verification design question
- expert-bdd — No UI behavior being defined; contracts are programmatic validation
- expert-atomic-design — No UI components involved
- expert-performance — Contract validation is trivial parse calls, no performance concern

## Debate Requested
Yes

---

## Open Questions
None — all branches resolved.
