# Questioner Session — Wire up project-manager, introduce reviewer agents, free-form user_notes

**Date:** 2026-04-03
**Status:** COMPLETE
**Dispatched to:** pending (design-pipeline Stage 2)

---

## Purpose
Close the design pipeline's execution gap. Stage 6 describes pair programming execution in detail but never dispatches the project-manager agent to orchestrate it. Adding reviewer agents creates quality gates between code writing and merging. Broadening user_notes into a shared observation log lets any agent surface non-critical observations for the user to audit later.

## Artifact / Output Type
Modified and new Claude skill/agent definition files (SKILL.md, AGENT.md). No application code or new packages. Specifically:
- **Modified:** `design-pipeline/SKILL.md` (Stage 6 dispatch), `implementation-writer/AGENT.md` (handoff), `project-manager/AGENT.md` (reviewer integration), `debate-moderator/SKILL.md` (user_notes expansion), and all existing agents (user_notes write capability)
- **New:** 8 reviewer AGENT.md files under `.claude/skills/reviewers/`

## Trigger
No new trigger. The existing `/design-pipeline` command remains the entry point. The project-manager is dispatched internally when Stage 6 transitions from `STAGE_6_CONFIRMATION_GATE` to `STAGE_6_TIER_EXECUTING`. Reviewer agents are triggered by the project-manager after each pair session completes its local self-review.

## Inputs
- **Project-manager:** Receives the implementation plan (tiers, task assignments, agent pairs) from the design-pipeline orchestrator after the confirmation gate passes. Already defined in AGENT.md — just needs the dispatch.
- **Reviewer agents:** Receive the completed pair session's diff/changeset, task assignment context, and relevant pipeline artifacts (briefing, TLA+ spec, design consensus) to review against. Specialized inputs per reviewer:
  - Compliance reviewer: upstream pipeline specs
  - Bug reviewer: git history and PR context for touched files
  - Type-design reviewer: TLA+ spec for invariant checking
  - Test reviewer: runs tests, lint, tsc — no analytical input needed
- **user_notes:** Any agent passes free-form text with agent name and timestamp. No structured schema.

## Outputs
- **Project-manager:** Merged code on integration branch, state updates to `pipeline-state.md` (unchanged from current definition).
- **Reviewer agents:** Pass/fail verdict with actionable findings (file, line, issue, recommendation). Specific enough for the pair session to act on.
- **user_notes:** Growing free-form markdown log file (`docs/user_notes.md`) with timestamped entries from any agent. User audits periodically — suggestion backlog, not action queue.

## Ecosystem Placement
All internal to the design pipeline chain. None are standalone.
- **Project-manager:** Sits between confirmation gate (Stage 6a) and merge queue (Stage 6c). Called by design-pipeline, calls writer pairs and reviewers.
- **Reviewer agents:** Post-session, pre-merge quality gate within Stage 6. Called by project-manager.
- **user_notes:** Cross-cutting shared file. Not a stage — a side channel any agent can write to at any point during execution.

## Handoff
```
design-pipeline (confirmation gate)
    → project-manager (receives implementation plan)
        → writer pairs (receive task assignments)
            → all 8 reviewers in parallel (receive session diff + pipeline context)
                → project-manager (receives verdicts, decides merge or send-back)
                    → merge queue
```
- On reviewer pass: project-manager moves session to merge queue.
- On reviewer fail: project-manager sends findings back to pair for revision, then re-runs ALL reviewers after fixes (any revision invalidates all prior passes).
- user_notes: fire-and-forget append. Any agent writes, user reads later. No handoff.
- Project-manager mediates between pairs and reviewers — pairs never interact with reviewers directly.

## Error States
1. **Test reviewer fails (tests/lint/tsc):** Send specific failures back to pair. Bounded retries.
2. **Analytical reviewer fails:** Send findings back to pair. Same bounded retry.
3. **Reviewer conflicts (e.g., simplicity vs type-design):** Not arbitrated — both sets of findings sent to pair to reconcile.
4. **Reviewer agent crashes/times out:** Transient failure — retry the reviewer, not the pair session.
5. **user_notes write fails:** Non-blocking — warn and continue. Notes are suggestions, not critical path.
6. **All reviewers fail simultaneously:** Single revision cycle — pair gets all findings at once.
7. **Reviewer findings contradict TLA+ spec or briefing:** Reviewer is right to flag — pair must reconcile.
8. **Pair can't satisfy reviewer after retry limit:** Session fails, follows existing re-dispatch logic.
- **Key design decision:** All 8 reviewers run in parallel. No ordering, no short-circuiting. All must pass. Any revision triggers full re-run of all reviewers.

## Name
- Feature: "reviewer agents" (concept within design pipeline)
- Agents: artifact-reviewer, compliance-reviewer, bug-reviewer, simplicity-reviewer, type-design-reviewer, security-reviewer, backlog-reviewer, test-reviewer
- Directory: `.claude/skills/reviewers/<name>/AGENT.md`

## Scope
**In scope:**
- Wire design-pipeline Stage 6 to dispatch project-manager
- Wire implementation-writer handoff to project-manager (already produces correct output — just needs the dispatch)
- Create 8 reviewer AGENT.md files with clear review criteria
- Integrate reviewers into project-manager's post-session flow (parallel dispatch, all-must-pass, full re-run on revision)
- Expand user_notes to free-form, writable by all agents at any time
- Update pipeline-state.md schema if needed for reviewer tracking

**Out of scope:**
- Changing Stages 1–5 (questioner, debate, TLA+, review, implementation-writer's plan generation)
- Creating new application code or packages
- Changing the TDD ping-pong protocol within pair sessions
- Making reviewers user-invokable (internal AGENT.md only)
- Automated user_notes cleanup or summarization
- Reviewing pre-existing code outside the session diff (observations go to user_notes instead)

## Edge Cases
- **Reviewer finds issue in pre-existing code:** Scopes to session diff only. Pre-existing issues go to user_notes as observations.
- **All 8 reviewers fail simultaneously:** Treated as single revision cycle, pair gets all findings at once.
- **Reviewer findings contradict TLA+ spec or briefing:** Reviewer flags it, pair reconciles.
- **user_notes grows very large:** Not a concern — user audits and trims manually.

## Debate Requested
Yes (design-pipeline — always yes)

---

## Open Questions
None — all branches resolved.
