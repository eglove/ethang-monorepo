# Elicitor Session — Pipeline Reviewers & Resume

**Date:** 2026-04-10
**Status:** COMPLETE
**Feature:** reviewers

---

## Purpose
Add a review gate to the vibe-cli Stage 8 coding pipeline. Eight specialized reviewer agents audit every worktree before merge and the full codebase after all merges. A review-moderator orchestrates the reviewers, triages findings into blockers (must fix) vs non-blocking notes (logged for the user to address later). This catches quality issues that TDD and the verify triple miss — security flaws, accessibility gaps, type design problems, compliance violations, etc.

Additionally, simplify the CLI to `./vibe.ps1 "seed"` (new run) and `./vibe.ps1 --resume` (continue interrupted run), removing `-Stage` and `-Feature` flags.

## Artifact / Output Type
- 8 reviewer agent `.md` files (`agents/reviewers/`)
- 1 review-moderator agent `.md` file (`agents/review-moderator.md`)
- `review-loop.ps1` utility (dispatch, collection, consolidation)
- Stage 8 integration code (pre-merge review gate + post-merge final review)
- `user_notes.md` writing logic
- Structured pipeline log enhancements
- `--resume` flag implementation
- CLI refactor (remove `-Stage`/`-Feature` flags)

## Trigger
- **Pre-merge review**: Triggered automatically after a task passes cleanup (2 consecutive clean passes of test/lint/tsc), before merge queue entry
- **Post-merge final review**: Triggered after final verification double-pass completes on the merged codebase

## Inputs

### Reviewer Inputs
- Git diff (worktree branch vs base branch for pre-merge; full feature branch vs base for final review)
- Reviewers do NOT receive the full codebase — only the diff scopes their attention (they can read surrounding files for context)

### Review-Moderator Inputs
- The diff (for pre-filter step to select relevant reviewers)
- All 8 reviewer JSON reports (after dispatch)

## Outputs

### Individual Reviewer Output (JSON schema, enforced via `--json-schema`)
```json
{
  "findings": [
    {
      "severity": "critical | high | medium | low",
      "description": "...",
      "files": ["..."],
      "suggestion": "..."
    }
  ]
}
```

### Review-Moderator Output (JSON schema, enforced via `--json-schema`)
```json
{
  "selectedReviewers": ["a11y", "security", "..."],
  "excludedReviewers": [{ "reviewer": "ai-agent", "reason": "No agent prompts in diff" }],
  "verdict": "pass | fail",
  "blockers": [{ "reviewer": "security", "severity": "critical", "description": "...", "files": ["..."], "suggestion": "..." }],
  "notes": [{ "reviewer": "simplicity", "severity": "low", "description": "...", "files": ["..."], "suggestion": "..." }]
}
```

### `user_notes.md` (`docs/<feature>/user_notes.md`)
Appended per review round. Format:
```markdown
## Review Round 1 — Pre-Merge (Task T001)
### Non-Blocking
- [simplicity] src/auth.ts: Extract duplicated validation logic (low)
- [a11y] src/components/Login.tsx: Missing aria-label on submit button (medium)

### Unresolved Blockers (escalated)
- [security] src/api/handler.ts: Unsanitized user input in query (critical)

## Review Round 2 — Final Review
...
```

## Ecosystem Placement
Sub-phase within Stage 8 of the vibe-cli pipeline. Not a separate stage.

## Handoff

### Pre-Merge Review Failure (blockers found)
1. Full blockers array passed as context to RED phase (test writer prompt)
2. Test writer writes failing tests targeting the reported issues
3. Code writer in GREEN receives same blocker context plus failing tests
4. After Cleanup passes → re-review
5. TDD counters reset fresh for each review-fix cycle

### Pre-Merge Review Pass
Task enters merge queue as normal

### Post-Merge Final Review Failure (blockers found)
Same RED → GREEN → Cleanup fix cycle directly on the feature branch, then re-review

### Escalation (MaxReviewRounds hit)
All remaining unresolved blockers appended to `user_notes.md`. User prompted via existing escalation system (Keep Going resets review round counter, Stop halts pipeline with pre-stop snapshot)

## Error States
- **Review loop cap**: `MaxReviewRounds = 3` — after 3 full review-fix cycles, escalate to user. Remaining issues go to `user_notes.md`
- **TDD failure within review-fix cycle**: Escalate via existing TDD escalation (RED/GREEN/Cleanup counters are independent per review round)
- **Reviewer agent timeout**: `ReviewerTimeout = 600s` per reviewer
- **Review-moderator timeout**: `ReviewModeratorTimeout = 300s`
- **Keep Going on escalation**: Resets `reviewRounds` counter to 0, continues
- **Pipeline crash mid-review**: `--resume` reconstructs review state from structured pipeline log + task logs

## Name
`reviewers` (feature slug)

## Scope

### In Scope
- 8 reviewer agents: a11y, ai-agent, bug, compliance, security, simplicity, test, type-design
- Review-moderator with pre-filter (selects relevant reviewers from diff, logs exclusion rationale)
- `review-loop.ps1` utility
- Pre-merge review gate (after cleanup, before merge queue)
- Post-merge final review (after final verification double-pass)
- Review-fix loop: Review → RED → GREEN → Cleanup → re-review
- `user_notes.md` accumulation
- Structured pipeline log entries (`RUN_START`, `STAGE_START`, `STAGE_COMPLETE`, `REVIEW_START`, etc.)
- `--resume` flag inferring state from log
- CLI simplification: `./vibe.ps1 "seed"` and `./vibe.ps1 --resume` only
- Remove `-Stage` and `-Feature` CLI flags
- New config values: `MaxReviewRounds`, `ReviewerTimeout`, `ReviewModeratorTimeout`
- Review phase markers in task logs for resume support

### Out of Scope
- Backlog reviewer (absorbed by review-moderator triage)
- Artifact reviewer (not in new roster)
- Dynamic reviewer generation at runtime
- Multi-feature concurrent runs
- Reviewer customization per feature

## Edge Cases

### Pre-filter excludes all reviewers
If the review-moderator determines no reviewers are relevant for a diff (unlikely but possible for trivial changes), verdict is `pass` — no review needed.

### Reviewer finds no issues
Individual reviewer returns empty `findings` array. Review-moderator handles gracefully — if all reviewers return empty, verdict is `pass`.

### Review finds blockers but TDD can't produce a test for them
TDD RED phase may escalate if it can't write a meaningful failing test for a subjective finding (e.g., "simplify this function"). Escalation goes to user who can Keep Going (skip that blocker, log to `user_notes.md`) or Stop.

### `--resume` with no prior run
Error message: no pipeline run found to resume. Prompt user to start a new run with a seed.

### `--resume` with completed run
Detect that all stages completed. Inform user the run is already complete.

### New seed clears log of interrupted run
Starting a new run with `./vibe.ps1 "new seed"` clears the pipeline log. Any interrupted prior run is lost. This is intentional (one feature at a time).

### Review-moderator disagrees with reviewer severity
The moderator owns the final severity mapping. If a reviewer flags something as `high` but the moderator determines it's actually `low` based on context, the moderator's classification wins. The raw reviewer reports are still logged for audit.

---

## Open Questions
None — all branches resolved.
