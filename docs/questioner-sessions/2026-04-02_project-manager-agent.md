# Questioner Session — Project Manager Agent

**Date:** 2026-04-02
**Status:** COMPLETE
**Dispatched to:** none (pipeline run — no downstream dispatch from questioner)

---

## Purpose
Decouples task assignment and worktree management from the implementation writer. The project manager dynamically chooses agent pairs per task and manages parallel execution, instead of the implementation writer pre-selecting writers.

## Artifact / Output Type
New internal orchestrator agent: `.claude/skills/project-manager/AGENT.md` (not user-invokable)

## Trigger
Pipeline transitions to `STAGE_6_TIER_EXECUTING` after the confirmation gate passes. Dispatched by the design pipeline orchestrator.

## Inputs
- Implementation plan file (from Stage 5) — tasks, tiers, dependencies
- Accumulated pipeline context (briefing, design consensus, TLA+ spec, review consensus)
- Integration branch name (`design-pipeline/<topic-slug>`)
- Worktree base path
- Pipeline constants (MaxConcurrent, MaxReDispatches, etc.)

## Outputs
- Execution state updates to `docs/pipeline-state.md` Stage 6 section
- Git worktree/branch lifecycle management (create, merge, cleanup)
- Dispatched agent pair results via Agent tool
- Final committed code branch on `design-pipeline/<topic-slug>`

## Ecosystem Placement
Part of the pipeline chain — sits between Stage 5 (Implementation Writer) and the writer agents (typescript-writer, hono-writer, ui-writer, vitest-writer, playwright-writer, trainer-writer)

## Handoff
Dispatches writer agent pairs (code writer + test writer) per task. Returns control to the pipeline orchestrator for global review when all tiers complete. No static file output — the "output" is execution state and the committed branch.

## Error States
- **Session failure:** Re-dispatch with different pair (bounded by MaxReDispatches), inherit context on logic error, full reset on corruption
- **All sessions in tier fail:** Halt with `TIER_ALL_FAILED`
- **Merge conflict:** Spawn fix session with fresh pair (bounded retries), halt if exhausted
- **Inter-tier verification fails:** Halt with `VERIFICATION_FAILED` (task-graph defect, escalate to user)
- **Worktree creation fails:** Halt with descriptive error
- All errors update `docs/pipeline-state.md` with halt reason and timestamp

## Name
`project-manager`

## Scope
- Manages agent pair selection and dispatch per task
- Enforces and manages git worktrees in parallel
- Updates pipeline state file with execution progress
- Handles error recovery (re-dispatch, fix sessions)

## Edge Cases
- Implementation plan with no tasks
- Task with zero dependencies placed in later tier
- Agent roster changes mid-pipeline
- Integration branch already exists from prior run
- Disk space or path conflicts during worktree creation

## Debate Requested
Yes (always — pipeline run)

---

## Open Questions
_none_
