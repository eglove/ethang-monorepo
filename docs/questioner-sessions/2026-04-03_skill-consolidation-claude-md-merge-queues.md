# Questioner Session — Skill Consolidation, CLAUDE.md Dissolution, Merge Queues

**Date:** 2026-04-03
**Status:** COMPLETE
**Dispatched to:** design-pipeline (Stage 2 — Debate Moderator)

---

## Purpose

One-time consolidation to eliminate indirection in the skill/agent infrastructure. User-scoped skills and the project CLAUDE.md are dissolved — their content is inlined into the project-scoped agents/experts that consume it. CI is updated to support merge queues.

## Artifact / Output Type

Modified `.md` skill/agent files, one new shared conventions file, deleted `CLAUDE.md`, and updated `ci.yml`. No new skills or agents are created. No pipeline logic changes.

## Trigger

One-time housekeeping effort invoked via `/design-pipeline`.

## Inputs

- 4 user-scoped skills: `tla-specification`, `atomic-design-planning`, `ddd-architect`, `doc-bdd` (from `~/.claude/skills/`)
- Project `CLAUDE.md` (all sections)
- Project-scoped agent/expert files that will absorb content
- Current `.github/workflows/ci.yml`

## Outputs

1. Modified expert/agent `.md` files with inlined content from user-scoped skills (only what's missing)
2. New shared conventions file: `.claude/skills/shared/conventions.md` for global rules
3. Deleted `CLAUDE.md` from project root
4. Updated `.github/workflows/ci.yml` with `merge_group` trigger
5. Updated references anywhere that pointed to user-scoped skill paths or CLAUDE.md

## Ecosystem Placement

Touches skill/agent infrastructure but does not change pipeline behavior. The debate-moderator, questioner, design-pipeline orchestrator — none of their logic changes, just the content their agents carry.

## Handoff

Modified agent/expert files are consumed by:
- debate-moderator (dispatches experts)
- tla-writer (currently references user-scoped TLA+ skill)
- design-pipeline orchestrator (chains all stages)
- All agents (CLAUDE.md auto-loaded content moves to shared conventions + individual files)

Any reference to `@~/.claude/skills/...` paths or reliance on CLAUDE.md auto-loading must be identified and updated. The shared conventions file is referenced by agents that depend on global rules.

## Error States

Primary risk: a CLAUDE.md rule gets lost during dissolution — not placed into any agent or shared conventions file. Mitigation: implementation plan includes a checklist mapping every CLAUDE.md section to its destination, verified before deletion.

## Name

Skill Consolidation & CLAUDE.md Dissolution

## Scope

- No new skills or agents created
- No pipeline logic changes
- User-scoped files at `~/.claude/skills/` left in place (user manages separately)
- `.skillfish.json` metadata in user-scoped skills is irrelevant to this work
- Merge queue enablement in GitHub repo settings UI is done separately by user
- Branch protection is already configured

## Edge Cases

- TLA+ content is split by perspective: evaluation/review → expert-tla, syntax/patterns/TLC → tla-writer
- Global CLAUDE.md rules (LF, lodash, no repeated strings, etc.) that don't belong to any single agent → `.claude/skills/shared/conventions.md`
- Upstream updates to user-scoped skills via skillfish become irrelevant for inlined content — acceptable trade-off

## Debate Requested

Yes (pipeline — always yes)

---

## Work Streams

### Work Stream 1: Inline User-Scoped Skills

Audit each user-scoped skill against its project-scoped counterpart. Add only what's missing.

| User-Scoped Skill | Absorbing Project Files | Split Strategy |
|---|---|---|
| `tla-specification` | `expert-tla/SKILL.md` + `tla-writer/AGENT.md` | Evaluation perspective → expert-tla; syntax/patterns/TLC → tla-writer |
| `atomic-design-planning` | `expert-atomic-design/SKILL.md` | Full absorption |
| `ddd-architect` | `expert-ddd/SKILL.md` | Full absorption |
| `doc-bdd` | `expert-bdd/SKILL.md` | Full absorption |

### Work Stream 2: Dissolve CLAUDE.md

Distribute each section to relevant skill/agent files. Global rules → shared conventions.

CLAUDE.md sections to distribute:
- Line Endings (LF Only) → shared conventions
- ESLint Config constraints → shared conventions
- Vitest Coverage Thresholds → shared conventions
- CSpell Unknown Words → shared conventions
- Test-Driven Development → expert-tdd / vitest-writer
- Domain-Driven Design → expert-ddd
- Atomic & Component-Driven Design → expert-atomic-design
- Behavior-Driven Development → expert-bdd
- Prefer Lodash → shared conventions + expert-lodash
- State Machine Mindset → expert-tla / tla-writer
- No Repeated String Literals → shared conventions
- Feature Development Agents → relevant writer agents
- Opportunistic Code Improvement → shared conventions
- Progressive Mapping → progressive-mapper.md (already exists)

### Work Stream 3: Merge Queue CI

- Add `merge_group` trigger to `.github/workflows/ci.yml`
- Existing checks (lint, test, build, codeql, sonar) remain required
- User enables merge queue in GitHub repo settings UI separately

## Open Questions

None — all branches resolved.
