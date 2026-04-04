# Questioner Session — PlantUML Enforcement, Freeform Questioner, Librarian Agent, Accessibility Expert/Reviewer

**Date:** 2026-04-03
**Status:** COMPLETE
**Dispatched to:** design-pipeline (Stage 2)

---

## Purpose
Four enhancements to the design-pipeline infrastructure:
1. Enforce PlantUML diagram updates as an explicit pipeline step instead of a conditional changeFlag that gets ignored
2. Make the questioner interview process freeform instead of following a rigid 10-branch decision tree
3. Introduce a librarian agent that maintains a dense, machine-readable codebase index to reduce token usage across all agents
4. Add accessibility expertise to the pipeline via a debate expert and a review-gate reviewer

## Artifact / Output Type
- Modified SKILL.md files (design-pipeline orchestrator, questioner)
- New AGENT.md files (librarian agent, a11y-reviewer)
- New SKILL.md file (expert-a11y)
- New docs directory (docs/librarian/)
- Modified shared conventions
- Updated TLA+ specification for the pipeline

## Trigger
Pipeline run via `/design-pipeline`

## Inputs
- Current design-pipeline SKILL.md and state machine definition
- Current questioner SKILL.md with fixed decision tree
- Current shared conventions at `.claude/skills/shared/conventions.md`
- Current reviewer roster (8 reviewers) and expert roster
- Current MinReviewQuorum constant (fixed at 5)

## Outputs

### Item 1 — PlantUML Enforcement
- PlantUML diagram update becomes unconditional explicit step
- No longer tied to COMPLETE state or changeFlag mechanism
- Runs as part of new Stage 7, parallel with librarian

### Item 2 — Freeform Questioner
- Fixed 10-branch decision tree (Purpose, Artifact type, Trigger, Inputs, Outputs, Ecosystem placement, Handoff, Error states, Naming, Scope) replaced with freeform discovery
- Retained structural rules:
  - One question per message with recommendation
  - Resolve upstream before downstream
  - Phase 1/2/3/4 lifecycle (Orient, Question, Sign-Off, Save-and-Dispatch)
- Added completeness check: before sign-off, questioner reviews accumulated answers and asks itself whether any obvious dimension was never addressed

### Item 3 — Librarian Agent
- New agent: `.claude/skills/agents/librarian/AGENT.md`
- Persistent index directory: `docs/librarian/`
  - Root file: `docs/librarian/INDEX.md` (the "index index")
  - Category sub-files (e.g., `packages.md`, `skills.md`)
- Entry schema: Markdown table with columns: Path, Kind, Summary, Updated
- Split threshold: 2,000 tokens per file — when exceeded, split into narrower sub-categories and update INDEX.md
- Consultation pattern: "consult first" — instruction added to shared conventions (`.claude/skills/shared/conventions.md`), not per-agent
- Committed to git (persistent across conversations)
- Runs as Stage 7 of the pipeline, parallel with PlantUML
- Old internal_map file deleted; zero references remain in `.claude/` artifacts

### Item 4 — Accessibility Agents
- **Expert:** `expert-a11y` at `.claude/skills/agents/expert-a11y/SKILL.md`
  - Participates in debate stages (Stage 2 design debate, Stage 4 TLA+ review)
  - Conditional selection by debate-moderator (same as all other experts — selected when topic involves UI/frontend)
- **Reviewer:** `a11y-reviewer` at `.claude/skills/reviewers/a11y-reviewer/AGENT.md`
  - Participates in Stage 6 reviewer gate
  - 9th reviewer in the roster
- Standards: WCAG 2.2 AA baseline + WAI-ARIA 1.2 for component patterns
- References WCAG success criteria by number and cites ARIA Authoring Practices Guide
- MinReviewQuorum: changed from fixed 5 to formula `ceil(2n/3)` — universal for ALL reviewers (not just a11y)

## Ecosystem Placement
Chained — these are modifications to the existing design-pipeline orchestrator and its agent ecosystem.

## Handoff
Briefing passes to Stage 2 (debate-moderator) for expert design debate, then through the full pipeline.

## Error States
- If the librarian index becomes corrupted, agents fall back to direct file reads (the "consult first" pattern is advisory, not blocking)
- If the a11y expert is unavailable during debate, the debate proceeds without it (conditional selection means it may not be relevant)
- If PlantUML generation fails at Stage 7, the pipeline can still COMPLETE — the diagram is informational, not load-bearing

## Name
PlantUML Enforcement, Freeform Questioner, Librarian Agent, Accessibility Expert/Reviewer

## Scope
- IN SCOPE: All four items as described above
- OUT OF SCOPE: Changing the pipeline's core 6-stage structure (stages 1-6 remain unchanged; Stage 7 is additive)
- OUT OF SCOPE: Making the librarian a blocking dependency (it is advisory/consult-first)
- OUT OF SCOPE: AAA conformance level (AA only)
- OUT OF SCOPE: Literal hook interception of Read tool calls (consult-first pattern instead)

## Edge Cases
- Librarian index split when a category file crosses 2,000 tokens
- Quorum formula ceil(2n/3) at edge values: ceil(2*1/3) = 1, ceil(2*2/3) = 2, ceil(2*9/3) = 6
- A11y expert selected for topics with mixed backend/frontend scope (debate-moderator decides relevance)
- PlantUML and librarian running in parallel at Stage 7 — no ordering dependency between them

## Debate Requested
Yes (pipeline run)

---

## Open Questions
None — all branches resolved.
