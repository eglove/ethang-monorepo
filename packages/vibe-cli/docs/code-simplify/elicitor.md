# Elicitor Session — Stage 8 Code Simplify

**Date:** 2026-04-11
**Status:** COMPLETE
**Feature:** code-simplify

---

## Purpose
Gut and rewrite Stage 8 (coding) to remove complex PowerShell orchestration. The current ~28KB `8-coding.ps1` manages TDD phases, blame assignment, language-specific writers, and a TLA+-backed state machine — most of which fights Claude rather than helping it. The rewrite lets Claude handle implementation dispatch, TDD, and tier sequencing natively, while PowerShell handles only mechanical verification gates. Also creates the 8 reviewer agents and review-moderator that were specified in the reviewers feature but never implemented.

## Artifact / Output Type
- Rewritten `stages/8-coding.ps1` (dramatically smaller)
- 8 reviewer agent `.md` files in `agents/reviewers/` (a11y, ai-agent, bug, compliance, security, simplicity, test, type-design)
- `agents/review-moderator.md`
- `utils/review-loop.ps1` (dispatch, consolidation, `user_notes.md` writing)
- Deletion of `code-writers/` and `test-writers/` directories
- Deletion of `utils/pipeline-state.ps1`, `utils/tdd-cleanup.ps1`, and other dead Stage 8 code

## Trigger
Stage 8 is invoked by the pipeline after Stage 7 (implementation debate) completes.

## Inputs
- `docs/<feature>/implementation-plan.json` — tier structure and task definitions
- `docs/<feature>/` — full feature docs directory (elicitor, BDD, TLA+ specs)
- `tests/fixtures/bdd/fixture.json` — BDD test fixtures
- `tests/fixtures/tla/fixture.json` — TLA+ test fixtures

## Outputs
1. Implemented code in worktrees (by Claude)
2. Tests covering all BDD and TLA+ fixtures
3. `docs/<feature>/user_notes.md` — non-blocking reviewer notes and unresolved escalated blockers
4. `pipeline.log` — verbose progress logging with `>>> MARKER` resume markers

## Ecosystem Placement
Stage 8 of the vibe-cli pipeline. Replaces the existing Stage 8 entirely.

## Handoff
Stage 8 is the final stage. Output is the implemented, reviewed, and merged feature on the feature branch.

## Error States

### Pre-coding gate
User declines to commit uncommitted changes → pipeline halts with clear message.

### Fixture coverage check
Missing fixture coverage → uncovered fixture list sent back to Claude to write tests. Empty fixture files → skip check with warning logged.

### Double-pass failure
`pnpm test` → `pnpm lint` fails to pass twice consecutively → error output sent back to Claude to fix. Claude's own escalation handles if it gets stuck.

### Reviewer blockers
Blockers found → sent back to Claude for TDD fix → re-run double-pass + reviewers. `MaxReviewRounds = 3` per gate (per-worktree and global). After cap → escalate to user. "Keep Going" logs remaining issues to `user_notes.md` and continues. "Stop" halts pipeline.

### Merge conflicts
Conflict during sequential merge → sent to Claude to resolve → double-pass on feature branch before continuing next merge.

### Reviewer/moderator timeout
`ReviewerTimeout = 600s`, `ReviewModeratorTimeout = 300s`. Timeout → log warning and proceed without that reviewer's input. Moderator timeout → treat as pass with warning.

### Pipeline crash
`--resume` picks up from last `>>> MARKER` in pipeline log. Claude can inspect worktree state and figure out partially complete work.

### Pipeline lock
`pipeline.lock` acquired at Stage 8 start, released at end (or in `finally` on crash). Prevents concurrent runs.

## Name
`code-simplify`

## Scope

### In Scope
- Full rewrite of `stages/8-coding.ps1`
- Inline Claude prompt for implementation dispatch (no separate agent `.md` file)
- Claude handles: reading `implementation-plan.json`, tier sequencing, parallel agent dispatch per tier in worktrees, TDD, not merging
- PowerShell handles: pre-coding commit gate, fixture coverage check (string match), per-worktree double-pass (`pnpm test` → `pnpm lint` × 2), per-worktree reviewer dispatch, sequential merge in task order, bulk worktree cleanup, global double-pass, global reviewer dispatch
- 8 reviewer agents: a11y, ai-agent, bug, compliance, security, simplicity, test, type-design (in `agents/reviewers/`)
- Review-moderator agent (`agents/review-moderator.md`) with pre-filter and consolidation
- `utils/review-loop.ps1` utility
- `user_notes.md` writing (inside `review-loop.ps1`)
- Verbose logging to console and `pipeline.log` simultaneously
- `>>> MARKER` format resume markers in log
- `--resume` support via log marker detection
- Escalation model (Keep Going / Stop) carried over as-is
- Delete `code-writers/` directory
- Delete `test-writers/` directory
- Delete `utils/pipeline-state.ps1`
- Delete `utils/tdd-cleanup.ps1`
- Delete all other dead Stage 8 code

### Out of Scope
- CLI flag changes (`--resume` flag implementation, removing `-Stage`/`-Feature`)
- `doc-writers/` — kept, used by stages 1-7
- `experts/` — kept
- Changes to stages 1-7
- Dynamic reviewer generation at runtime
- Multi-feature concurrent runs

## Edge Cases

### Claude produces no worktrees
If Claude works directly on the feature branch (e.g., single small task), PowerShell checks for worktrees after coding completes. If none exist, skip per-worktree gates and go directly to global double-pass + reviewers.

### Empty fixture files
If BDD and/or TLA+ fixture JSON files contain empty arrays, skip the fixture coverage check for those files. Log a warning.

### Merge conflict during sequential merge
Claude resolves the conflict. Double-pass runs on the feature branch after resolution before continuing to the next merge. No full re-review of the conflict resolution — per-worktree review already passed.

### Reviewer pre-filter excludes all reviewers
Moderator determines no reviewers are relevant for the diff → verdict is `pass`. No review needed.

### All reviewers return empty findings
Moderator consolidates → verdict is `pass`.

### Reviewer timeout
Log warning, proceed without that reviewer's report. Moderator consolidates whatever came back.

### Moderator timeout
Treat as pass with warning logged. Don't block pipeline.

---

## Open Questions
None — all branches resolved.
