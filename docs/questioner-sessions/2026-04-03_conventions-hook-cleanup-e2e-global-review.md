# Questioner Session — Conventions Hook, Pipeline Cleanup, E2E Test, Global Review Double-Pass

**Date:** 2026-04-03
**Status:** COMPLETE
**Dispatched to:** pending (pipeline run — debate-moderator is next)

---

## Purpose
Six related improvements to the design pipeline infrastructure: (1) enforce conventions.md reading via hook injection instead of per-agent instructions, (2) move quorum formula ownership to the project-manager, (3) remove stale feature-dev references, (4) create a pipeline e2e test that validates cross-agent wiring, (5) update the global review to use a full-sequence double-pass protocol, (6) clean up 27 agent files that have redundant conventions.md instructions.

## Artifact / Output Type
- One PreToolUse hook entry in settings.json
- Edits to conventions.md (two section removals)
- Edits to 27 agent .md files (instruction removal)
- Updates to project-manager/AGENT.md (quorum injection + double-pass protocol)
- Updates to design-pipeline/SKILL.md (global review double-pass documentation)
- New test file: packages/design-pipeline/src/skill-tests/pipeline-e2e.test.ts

## Trigger
Manual invocation via /design-pipeline

## Inputs
- Seed from next.md with 5 improvement items
- Current codebase state (27 agent files with conventions.md references, conventions.md with Feature Dev and Quorum sections, existing skill tests as pattern reference)

## Outputs
All artifacts listed above, committed on a named branch.

## Ecosystem Placement
Infrastructure improvement — affects all pipeline agents and the pipeline orchestrator itself.

## Handoff
Briefing passes to debate-moderator (Stage 2) for expert design debate.

## Error States
- Hook injection fails silently: agents would not read conventions.md (mitigated by e2e test validating hook exists)
- Quorum formula missing from PM prompt: review gate would have no pass/fail criteria (mitigated by e2e test validating handoff contracts)

## Name
conventions-hook-cleanup-e2e-global-review

## Scope
**In scope:**
- PreToolUse hook with Agent matcher injecting additionalContext for conventions.md (full path: .claude/skills/shared/conventions.md)
- Atomic removal of old conventions.md read instructions from all 27 agent files
- Remove "Feature Development Agents" section from conventions.md only (not from next.md or debate session docs)
- Remove "Review Gate Quorum Formula" section from conventions.md; project-manager injects quorum at dispatch time
- Pipeline e2e test at packages/design-pipeline/src/skill-tests/pipeline-e2e.test.ts validating: stage ordering, agent file existence, cross-agent handoff contracts, state transition completeness, reviewer roster completeness (9 reviewers), stage-to-agent mapping
- Global review double-pass: full-sequence (test→fix→lint→fix→tsc→fix) where two consecutive clean passes with zero fixes = success. Fixes within a pass handled inline by project-manager. STAGE_6_FIX_SESSION and MaxGlobalFixes (3) cap the outer loop (full restart of double-pass sequence).

**Out of scope:**
- TLA+ spec updates (specs are historical records, not living documents)
- Moving conventions.md to a different location
- Editing next.md or debate session docs
- Changes to any agent's core behavior beyond the conventions.md instruction removal

## Edge Cases
- Agent launched outside pipeline context: hook still fires, agent still reads conventions.md (desired behavior — conventions are global)
- All 27 files have slightly different instruction text: removal must handle each variant
- E2e test must break if any agent file is renamed, moved, or has its handoff contract changed
- Global review double-pass: if MaxGlobalFixes (3) is exhausted without achieving two consecutive clean passes, pipeline halts with GLOBAL_REVIEW_EXHAUSTED

## Debate Requested
Yes

---

## Resolved Questions

1. **Hook mechanism:** PreToolUse hook with Agent matcher, additionalContext injection
2. **File location:** Keep at .claude/skills/shared/conventions.md, use full path
3. **Agent file cleanup:** Atomic with hook addition, all 27 files, no fallback
4. **Quorum ownership:** Project-manager sole owner, injects at dispatch time
5. **Feature-dev removal scope:** conventions.md only
6. **E2e test location and dimensions:** packages/design-pipeline/src/skill-tests/pipeline-e2e.test.ts with 6 validation dimensions
7. **Double-pass semantics:** Full-sequence (Option A), reset-on-fix, two clean passes required
8. **TLA+ specs:** Historical, no update
9. **Fix session semantics:** Inline by PM within a pass, MaxGlobalFixes caps outer loop
