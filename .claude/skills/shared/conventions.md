---
name: shared-conventions
description: Global rules that every agent and expert must follow regardless of specialization. Read this file at the start of every task.
---

# Shared Conventions

## Line Endings

All files in this repository use LF (`\n`) line endings. This is enforced by `.gitattributes` (`* text=lf`), `.editorconfig` (`end_of_line = lf`), and Prettier defaults. Never write files with CRLF line endings.

## ESLint Config

Do not modify any ESLint configuration files (`eslint.config.*`, `.eslintrc.*`, `.eslintignore`, or any file that configures ESLint rules, plugins, or parsers) without explicit user permission. If a lint error seems to require a config change to resolve, stop and ask the user first.

## Vitest Coverage Thresholds

Do not manually lower coverage threshold values in any `vitest.config.*` file. Thresholds are managed automatically by `autoUpdate: true`, which only raises them. If coverage drops below a threshold, find and add tests that cover the missing lines. Stop and ask the user before lowering any threshold value.

## CSpell

When a `cspell/spellchecker` error appears for a legitimate technical term, add the word to the shared list in `packages/eslint-config/src/setup/cspell.ts` and **notify the user** that `@ethang/eslint-config` needs to be published before the word will be recognized.

Until the updated package is published, suppress the specific error inline with a `// cspell:ignore <word>` comment at the top of the affected file. Remove the inline suppress once the package is published and the dependency is updated.

## Prefer Lodash Over Vanilla Methods

Use lodash utilities instead of hand-rolling array/object operations. This applies to both production code and test utilities.

Use per-method imports from the base `lodash` package for tree-shaking:

```ts
import groupBy from "lodash/groupBy.js";
import sortBy from "lodash/sortBy.js";
```

Use `lodash/get` for any property access more than one level deep. Always use the array-path form.

## No Repeated String Literals

Any string literal that appears 3 or more times in any file must be extracted to a named constant at the top of the file. This applies to URLs, content-type values, test description strings, and any other repeated literal.

```ts
// good
const COURSES_URL = "https://ethang.dev/courses";
const TEXT_HTML = "text/html";

// bad — same string scattered across multiple test cases
await app.request("https://ethang.dev/courses");
await app.request("https://ethang.dev/courses");
await app.request("https://ethang.dev/courses");
```

## Feature Development Agents

This guidance applies to any agent, subagent, or skill currently running. The `feature-dev` skill provides three specialized agents whose methods should supplement your own:

- **`feature-dev:code-architect`** — designs feature architectures by analyzing existing codebase patterns, providing implementation blueprints with specific files to create/modify, component designs, data flows, and build sequences.
- **`feature-dev:code-explorer`** — deeply analyzes existing features by tracing execution paths, mapping architecture layers, understanding abstractions, and documenting dependencies.
- **`feature-dev:code-reviewer`** — reviews code for bugs, logic errors, security vulnerabilities, and adherence to project conventions using confidence-based filtering.

When architecting, exploring, or reviewing code, use the methods from these agents in addition to your own. They can also be invoked directly via the Agent tool.

## Opportunistic Code Improvement

When touching existing code, take the opportunity to improve it. Do not make changes for their own sake, but if you notice something in or near code you are already modifying, fix it:

- Simplify verbose or redundant expressions
- Improve naming to better reflect domain language
- Replace hand-rolled array/object operations with lodash
- Extract repeated logic into well-named functions
- Remove dead code or unnecessary comments
- Align structure with the patterns described in this file

Scope improvements to the code you are already reading or modifying. Do not refactor entire files unprompted.

## User Notes

All agents may write free-form observations to `docs/user_notes/` at any time during execution. These are non-critical suggestions the user audits periodically — not an action queue.

**File naming:** `docs/user_notes/<agent-name>-<YYYY-MM-DD>-<HH-MM-SS>.md`

Each file is agent-scoped to avoid concurrent write conflicts from parallel agents. Never write to a shared single file.

**Entry format:**
- Agent name and timestamp in the file header
- Free-form markdown body with observations, suggestions, or flagged items
- No structured schema required — write whatever is worth noting

**Rules:**
- Any agent can write at any time (fire-and-forget)
- Write failures are non-blocking: warn and continue, never halt the pipeline
- Create the `docs/user_notes/` directory if it does not exist
- Entries are append-only per file; never overwrite or delete other agents' notes
- The user audits and trims manually — no automated cleanup or summarization

## Review Gate Quorum Formula

The review gate quorum is computed as `ceil(2n/3)` where `n` is the number of non-UNAVAILABLE reviewers that responded. The full specification is at `.claude/skills/shared/quorum.md`.

Key behaviors:
- **Floor guard:** `n >= 1` is a hard precondition. If fewer than 1 reviewer responds, the gate cannot produce a valid verdict.
- **At n=2, unanimity is required:** `ceil(4/3) = 2`. Both reviewers must pass. This is an intentional design decision, not a bug.
- **Current roster:** 9 reviewers (including a11y-reviewer). At full availability, quorum = `ceil(18/3) = 6`.

The formula is owned by the review gate specification. Individual reviewers do not need to know it.
