# Questioner Session — SDK Pipeline Rewrite

**Date:** 2026-04-03
**Status:** COMPLETE
**Dispatched to:** debate-moderator (via pipeline)

---

## Purpose
Replace the current agent-file-based design pipeline with a full TypeScript SDK where TypeScript is the real state machine. Agents become thin, pure domain instructions with no pipeline awareness or state tracking. Claude is used for what it is good at (reasoning, drafting) while TypeScript handles orchestration, state, error handling, and control flow.

## Artifact / Output Type
A TypeScript SDK in `packages/design-pipeline` that orchestrates the full 7-stage pipeline programmatically, with Zod-validated structured outputs at every stage boundary.

## Trigger
User invokes `/design-pipeline` which calls `runPipeline()` from the SDK.

## Inputs
- User seed topic (passed to questioner stage)
- Streaming user input for multi-turn questioner and confirmation gates
- Codebase context gathered by individual stage prompts

## Outputs
- Stage artifacts as typed Zod-validated objects: BriefingResult, DebateSynthesis, TlaResult, ImplementationPlan, PairSessionResult, ReviewVerdict, ForkJoinResult
- Git commits and branches created via child_process (branch names and commit messages provided by agents via Zod output)
- Final implementation code committed to the repository

## Ecosystem Placement
Chained. The `/design-pipeline` SKILL.md (~30-50 lines) is the thin entry point that calls `runPipeline()`. All agent prompts live in `packages/design-pipeline/src/prompts/` as TypeScript template literal functions (e.g., `getQuestionerPrompt(context): string`). Old standalone `.claude/skills/` agent files are deleted once migrated.

## Handoff
Each stage hands off its Zod-validated result to the next stage via in-memory state. The orchestrator mediates all inter-stage communication. Pair programming uses synchronous message routing where the orchestrator mediates ping-pong between agents.

## Error States
- Typed discriminated union errors at every stage boundary
- Config-driven retry caps for transient failures
- User choices surfaced via streaming input when human intervention is needed
- Claude API boundary is the primary failure surface; all Claude calls are mocked in tests

## Name
design-pipeline SDK (`packages/design-pipeline`)

## Scope
**In scope:**
- All 7 pipeline stages in first implementation (full end-to-end)
- In-memory singleton state (no file persistence; `docs/pipeline-state.md` eliminated)
- Zod and Anthropic SDK as new dependencies
- Unit + mocked integration tests at 100% coverage
- Streaming input for questioner multi-turn and confirmation gates
- Git execution via TypeScript child_process
- Extended Zod output schemas with branchName/commitMessage fields (no new git-naming agent)
- Project-manager and debate-moderator thinned to selection + mediation only

**Out of scope:**
- TLA+ historical specs (irrelevant to this work)
- File-based pipeline state persistence
- Any agent having pipeline awareness or state tracking logic
- New git-naming agent (handled by extending existing agent Zod outputs)

## Edge Cases
- Claude API timeouts or rate limits: config-driven retry with caps, then discriminated union error surfaced to user
- User abandons mid-questioner: partial briefing saved as INCOMPLETE
- Zod validation failure on agent output: retry with feedback, then error if retry cap exceeded
- Streaming input unavailable: graceful degradation with single-shot prompts

## Debate Requested
Yes

---

## Open Questions
None. All 28 questions resolved.
