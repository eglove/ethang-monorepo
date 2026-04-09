# Elicitor Session — Lint-Fixer Agent

**Date:** 2026-04-06
**Status:** COMPLETE
**Feature:** lint-fixer

---

## Purpose
A specialized code-writing agent that fixes ESLint violations across the monorepo during stage 9 (global review). It works alongside the typescript-writer — the lint-fixer handles lint violations while the typescript-writer handles logic, test, and type issues. Over time it builds a knowledge base of learned fixes to resolve recurring patterns faster.

## Artifact / Output Type
- Agent markdown definition: `agents/code-writers/lint-fixer.md`
- Learned fixes knowledge base: `docs/lint-fixer/lint-fixer-learned.md`
- Stage 9 integration via `globalLintFixer` variable in `9-global-review.ps1`

## Trigger
Dispatched within the stage 9 global review loop when `pnpm lint` reports violations after autofix.

## Inputs
- Raw `pnpm lint` output (after `pnpm lint --fix` has resolved autofixable violations)
- `docs/lint-fixer/lint-fixer-learned.md` — read at start of each run for known solutions
- `@ethang/eslint-config` source files — explored reactively at runtime (e.g., `packages/eslint-config/src/config.main.js`, `config.react.js`, etc.). Not hardcoded; the agent is given examples of where to look.

## Outputs
- Fixed source files across the entire monorepo (not scoped to pipeline diff)
- Single commit per round: `fix(lint): resolve N violations from global review`
- Updated `docs/lint-fixer/lint-fixer-learned.md` with any multi-try solutions or unresolved patterns
- Updated `user_notes.md` for any violations suppressed after 5 failed attempts

## Ecosystem Placement
Operates inside the stage 9 global review loop, alongside the typescript-writer:

1. Tests + tsc run first — typescript-writer fixes any failures
2. Lint runs second — lint-fixer handles violations
3. Double-pass: both steps must pass twice consecutively for the loop to exit
4. If either agent's fixes break the other's domain, the next pass catches it naturally — no special cross-agent communication

## Handoff
- Receives: raw ESLint output from stage 9 orchestrator
- Produces: clean lint pass, committed fixes on integration branch
- If lint-fixer's changes break tests/tsc, the normal loop flow handles it — typescript-writer fixes regressions in the next pass

## Error States
- **Violation unfixable after 5 per-violation attempts:** Suppress with inline `eslint-disable-next-line rule-name -- lint-fixer: unable to resolve after 5 attempts. [summary of what was tried]`, log details to `user_notes.md`, record as UNRESOLVED in learned-fixes file
- **Max global review rounds reached:** Report remaining lint violations in pipeline output
- **Lint fix causes test/tsc regression:** Caught by next double-pass iteration; typescript-writer handles the regression

## Name
`lint-fixer` — referenced as `globalLintFixer` in stage 9

## Process Flow

1. **INIT** — Read `docs/lint-fixer/lint-fixer-learned.md` for known solutions. Explore `@ethang/eslint-config` source files to orient on rules (reactive exploration, not upfront reading of all configs; ESLint resolves the nearest config for each file).
2. **AUTOFIX** — Run `pnpm lint --fix` (handles Prettier/formatting and all autofixable rules).
3. **MANUAL** — Run `pnpm lint` to capture remaining violations. Group by file. For each file:
   - Check learned-fixes for matching rule+pattern — apply known solution if found
   - Otherwise attempt fix (up to 5 attempts per violation)
   - Re-run `pnpm lint` after each file to verify and catch cascading resolutions
4. **VERIFY** — Run `pnpm lint` to confirm clean (lint only; the double-pass handles test/tsc)
5. **LEARN** — Write any multi-try solutions to `lint-fixer-learned.md`. Update existing entries if a better fix was found. Record UNRESOLVED entries for suppressed violations.
6. **COMMIT** — Single commit: `fix(lint): resolve N violations from global review`

## Fix Policy
- Always fix — never suppress as a first resort
- 5 attempts per violation (tracked per specific rule at specific file:line, not per rule globally)
- On attempt exhaustion: suppress with `eslint-disable-next-line` + justification inline, log to `user_notes.md`
- Every suppression must include a `-- reason` comment explaining why

## Learned Fixes File Structure

Location: `docs/lint-fixer/lint-fixer-learned.md`

Keyed by rule name + contextual pattern description. The LLM uses judgment to match patterns contextually.

```markdown
## @typescript-eslint/no-floating-promises
**Pattern:** Async function called without await in event handler
**Status:** RESOLVED
**Fix:** Wrap in `void` operator: `void someAsyncFn()`
**Attempts before solution:** 2

## sonarjs/cognitive-complexity
**Pattern:** Deeply nested switch inside try-catch in request handler
**Status:** UNRESOLVED
**Attempts:** suppress with justification — tried extract-method, early-return, strategy pattern, lookup table, reducer; all introduced new violations or broke tests
```

## Scope
- Fixes lint violations across the **entire monorepo**, not scoped to the pipeline diff
- The monorepo is currently lint-clean, so any violations were introduced by the pipeline run (but transitive violations in untouched files are also in scope)
- Does NOT fix test failures or type errors — those are the typescript-writer's domain
- Does NOT run `pnpm test` or `pnpm tsc` — relies on the double-pass loop for full verification
- Framework-specific ESLint configs (React, Vitest, Playwright, etc.) are explored reactively only when needed to understand a rule's intent

## Edge Cases
- **Lint fix introduces new violations:** Caught by the per-file `pnpm lint` re-run in the MANUAL phase; new violations are added to the work queue
- **Lint fix breaks tests/tsc:** Caught by the double-pass in the next loop iteration; typescript-writer handles the regression
- **Cascading resolutions:** Fixing one violation may resolve others in the same file; per-file lint re-runs detect this automatically
- **Conflicting rules:** Some ESLint rules can conflict; the agent should reference the actual config to understand rule priority and options
- **Same rule, different contexts:** Learned-fixes entries include contextual pattern descriptions; the LLM matches by judgment, not exact string matching
- **Better fix found later:** Existing learned-fixes entries are updated with the improved solution

---

## Open Questions
None — all branches resolved.
