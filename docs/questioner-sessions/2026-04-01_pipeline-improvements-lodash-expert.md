# Questioner Session — Pipeline Improvements: Autonomous Expert Selection, user_notes Signaling, Lodash Expert, and .puml Diagram

**Date:** 2026-04-01
**Status:** COMPLETE
**Dispatched to:** debate-moderator

---

## Purpose
Reduce user friction by delegating expert selection from the questioner to the debate-moderator (fully autonomous — zero confirmation prompts ever). Give internal agents a signaling mechanism via `docs/user_notes.md` for requesting non-existent agents so the user can act on those requests asynchronously. Introduce a lodash expert to the fixed 8-expert roster. Keep a static PlantUML diagram at the repo root reflecting the current pipeline structure, updated at pipeline completion when the pipeline itself changed.

## Artifact / Output Type
- Updated `questioner/SKILL.md` — remove branch 11 (expert council selection); questioner no longer curates the council
- Updated `debate-moderator/SKILL.md` — autonomous expert selection from fixed 8-expert roster at invocation before round 1; post-hoc `user_notes.md` annotation after primary output is complete
- Updated `implementation-writer/AGENT.md` — post-hoc `user_notes.md` annotation after full plan is written (requests new non-existent agents only)
- New `expert-lodash/SKILL.md` — follows identical SKILL.md structure as all 8 existing experts
- `design-pipeline.puml` at repo root — updated at pipeline completion if the pipeline itself changed during that run

## Trigger
- **Expert selection:** debate-moderator maps the incoming topic to the fixed 8-expert roster once at invocation, before round 1 begins; no user confirmation at any point
- **user_notes.md annotation:** agents (debate-moderator, implementation-writer) append entries post-hoc after their primary output is delivered; never blocks or interrupts primary work
- **.puml update:** triggered at pipeline completion (Stage 6 wrap-up), only when the pipeline structure itself changed during the run

## Inputs
- debate-moderator reads the topic/briefing and autonomously selects experts from the 8-person roster (expert-tdd, expert-ddd, expert-tla, expert-bdd, expert-atomic-design, expert-edge-cases, expert-performance, expert-continuous-delivery, expert-lodash after this session)
- `user_notes.md` entries contain four fields: `requested_by` (agent name), `expert_needed` (requested agent name), `rationale` (why this agent is needed), `source_session` (session filename or identifier)
- `design-pipeline.puml` updated from accumulated pipeline context at Stage 6 completion

## Outputs
- Updated skill/agent files as listed under Artifact / Output Type
- `docs/user_notes.md` — append-only log; only the user may delete entries; created with a standard header if the file does not yet exist
- `design-pipeline.puml` at repo root — static PlantUML diagram; user has PlantUML plugin for rendering

## Ecosystem Placement
- `expert-lodash` is added to the fixed 8-expert roster (making it 9 total), following the identical SKILL.md structure used by all existing experts; tensions are written only where genuine disagreement exists between expert perspectives
- `user_notes.md` is a new file in `docs/`; it is append-only by agents, owned exclusively by the user for deletions
- `design-pipeline.puml` lives at the repo root alongside existing config files; it is a static artifact updated in-place, not generated on demand

## Handoff
- debate-moderator proceeds directly from topic intake to expert selection to round 1 — no intermediate user confirmation step exists anywhere in this flow
- `user_notes.md` entries are written after the agent's primary output is complete; the user reviews them asynchronously and decides whether to commission new agents
- `design-pipeline.puml` is committed as part of the pipeline run's final commit when the pipeline changed; the user opens it with their PlantUML plugin

## Error States
1. **`user_notes.md` missing** — agent creates the file with a standard header (e.g., `# User Notes — Agent Requests`) before appending; never fails silently
2. **Append conflict** — always append to end of file; never overwrite existing entries; no merge conflict possible since only one agent writes at a time
3. **Request for existing agent** — `user_notes.md` entries are for NEW non-existent agents only; agents must check the current roster before writing a request
4. **`.puml` update when pipeline unchanged** — skip the update entirely; do not create spurious diffs on unchanged pipeline runs

## Name
`expert-lodash`

## Scope
**In scope:**
- Remove branch 11 (expert council selection) from `questioner/SKILL.md`
- Add autonomous expert-selection logic to `debate-moderator/SKILL.md` (pre-round-1, zero user prompts, always fully autonomous)
- Add post-hoc `user_notes.md` annotation step to `debate-moderator/SKILL.md`
- Add post-hoc `user_notes.md` annotation step to `implementation-writer/AGENT.md`
- Create `expert-lodash/SKILL.md` using the identical structure as existing expert SKILLs
- Add `expert-lodash` to the debate-moderator's fixed roster
- Create `design-pipeline.puml` at repo root with current pipeline structure
- Define the update rule for `.puml` at pipeline completion

**Out of scope:**
- Any user-facing confirmation prompt anywhere in the autonomous selection flow — none, ever
- Changes to how existing experts (tdd, ddd, tla, bdd, atomic-design, edge-cases, performance, continuous-delivery) operate internally
- Changes to Stage 6 merge or verification process
- New test writer type or new monorepo package
- Deleting or archiving old `user_notes.md` entries — that is the user's sole responsibility

## Edge Cases
- **Pipeline run that adds a new expert mid-run:** The roster update and the `.puml` update both land in the same final commit; no ordering conflict since `.puml` is written last at Stage 6 wrap-up.
- **Agent requests an expert that is already in the roster:** The check-before-write rule in `user_notes.md` prevents duplicate requests. If a request was written in a prior session and the expert has since been created, the user is responsible for deleting the stale entry.
- **debate-moderator selects fewer than 8 experts:** Fully valid — the roster is a maximum, not a minimum; topic scope determines which experts are genuinely relevant.
- **`user_notes.md` grows unboundedly:** Agents only append; the user curates. No automated pruning.

## Expert Council
### Included
- expert-tdd — The user_notes.md signaling mechanism and autonomous selection flow affect how TDD cycles are triggered; test-first validation of the new skill/agent files needs TDD scrutiny
- expert-ddd — Expert selection and agent signaling define bounded context boundaries between pipeline stages; domain boundary design question
- expert-tla — Autonomous state machine (idle → selecting → round-1 → … → done) with no user confirmation gates; formal state enumeration needed to verify no invalid transitions exist
- expert-edge-cases — Append-only file creation, missing-file error handling, request-for-existing-agent guard, and mid-run roster mutation all need edge-case scrutiny

### Excluded
- expert-bdd — No UI behavior being defined; this is agent orchestration logic
- expert-atomic-design — No UI components involved
- expert-performance — Appending a few lines to a markdown file and selecting from a 9-item list are trivially cheap; no performance concern
- expert-continuous-delivery — No new monorepo packages, no publish pipeline changes, no CI configuration changes

## Debate Requested
Yes

---

## Open Questions
None — all branches resolved.
