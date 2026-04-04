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

<!-- Review gate quorum formula is now owned by project-manager/AGENT.md. See that file for the canonical quorum specification. -->

## Consult-First Pattern (Librarian Index)

Before performing broad file searches across the codebase, agents should consult `docs/librarian/INDEX.md` to locate relevant category files. The librarian index follows the **Shared Kernel** pattern: a well-defined contract (Markdown table with columns Path, Kind, Summary, Updated) owned by the librarian agent, with all other agents as read-only consumers.

**This is advisory, not blocking.** If the index is missing, corrupt, or stale, agents fall back to direct file reads. The index improves search efficiency but must never gate progress.

How to use:
1. Read `docs/librarian/INDEX.md` to discover which category files exist.
2. Read the relevant category file(s) to find file paths matching your need.
3. If no match is found in the index, fall back to standard file search (Glob, Grep).
4. If the index file does not exist or cannot be read, skip the consult step entirely and proceed with direct file search.
