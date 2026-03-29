# Claude Code Instructions

## ESLint Config — Never Modify Without Permission

Do not modify any ESLint configuration files (`eslint.config.*`, `.eslintrc.*`, `.eslintignore`, or any file that configures ESLint rules, plugins, or parsers) without explicit user permission. If a lint error seems to require a config change to resolve, stop and ask the user first.

## Vitest Coverage Thresholds — Never Lower Without Permission

Do not manually lower coverage threshold values in any `vitest.config.*` file. Thresholds are managed automatically by `autoUpdate: true`, which only raises them. If coverage drops below a threshold, find and add tests that cover the missing lines. Stop and ask the user before lowering any threshold value.

## CSpell — Unknown Words

When a `cspell/spellchecker` error appears for a legitimate technical term, add the word to the shared list in `packages/eslint-config/src/setup/cspell.ts` and **notify the user** that `@ethang/eslint-config` needs to be published before the word will be recognized.

Until the updated package is published, suppress the specific error inline with a `// cspell:ignore <word>` comment at the top of the affected file. Remove the inline suppress once the package is published and the dependency is updated.

## Test-Driven Development (TDD) — All Code

Write the test first. No implementation code without a failing test that demands it.

Cycle:
1. Write a failing test that describes the desired behavior
2. Write the minimum implementation to make it pass
3. Refactor — then lint, type-check, and re-run tests

Tests live alongside the code they cover. Use Vitest for all packages in this monorepo.

## Domain-Driven Design (DDD) — Business Logic

Apply to all backend/domain logic, regardless of what framework delivers it.

- Organize around domain concepts, not technical layers
- Keep domain logic in pure functions/classes free of framework concerns
- Entry points (route handlers, server actions, etc.) are thin — they delegate to domain functions
- Name things after the domain: use ubiquitous language from the problem space, not generic CRUD terms

## Atomic & Component-Driven Design — UI

See @.claude/skills/atomic-design-planning/SKILL.md for the full methodology, hierarchy, and rules.

## Behavior-Driven Development (BDD) — UI

Apply to all UI code, regardless of whether it is delivered by a dedicated frontend app or server-rendered.

- Describe behavior from the user's perspective: `given / when / then`
- Tests describe what the user can do and what they see, not implementation details
- Avoid testing internal component state; test observable behavior

## Prefer Lodash Over Vanilla Methods

Use lodash utilities instead of hand-rolling array/object operations. This applies to both production code and test utilities.

Use per-method imports from the base `lodash` package for tree-shaking:

```ts
import groupBy from "lodash/groupBy.js";
import sortBy from "lodash/sortBy.js";
```

### Use `lodash/get` for Deep Property Access

Use `get` from lodash whenever property access is more than one level deep. This provides safe traversal of nested structures without manually guarding each level.

```ts
import get from "lodash/get.js";

// good
get(object, ["user", "address", "city"]);

// bad — chained access throws on null/undefined intermediates
object.user.address.city;
```

Always use the **array path** form over dot-string notation:

```ts
// good — unambiguous, no parsing required
get(object, ["items", 0, "name"]);

// bad — dot-string with numeric index
get(object, "items.0.name");
```

The array form avoids ambiguity when keys contain dots and makes numeric indices explicit.

## State Machine Mindset — Enumerate All States

Before implementing any feature, enumerate the possible states explicitly. You do not need to use XState or TLA+ tooling, but reason as if you were modeling a state machine:

- What are all the states this can be in? (idle, loading, success, error, partial, stale, etc.)
- What are the valid transitions between states?
- What inputs are valid in each state?
- What happens on invalid transitions — is that even possible?

This applies to:
- UI components (loading/error/empty/populated)
- API handlers (unauthenticated/authorized/forbidden/not found/conflict)
- Domain entities (valid state transitions, guard conditions)
- Async flows (pending/settled/retrying/cancelled)

If a branch of a conditional is "impossible," document why rather than leaving it implicit. Impossible states should be made unrepresentable in the type system where practical.

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

## WebStorm MCP Server — Prefer Over Built-in Tools

When the WebStorm MCP server (`mcp__webstorm__*`) is available, prefer its tools over the built-in equivalents for all file and project operations:

- **File search** — use `mcp__webstorm__find_files_by_glob` or `mcp__webstorm__find_files_by_name_keyword` instead of Glob
- **Content search** — use `mcp__webstorm__search_in_files_by_text` or `mcp__webstorm__search_in_files_by_regex` instead of Grep
- **File reading** — use `mcp__webstorm__read_file` or `mcp__webstorm__get_file_text_by_path` instead of Read; the MCP server can read any file in the project, so always prefer it over the built-in Read tool
- **File editing** — use `mcp__webstorm__replace_text_in_file` instead of Edit or Write
- **Terminal commands** — use `mcp__webstorm__execute_terminal_command` instead of Bash
- **Run configurations** — use `mcp__webstorm__execute_run_configuration` to run builds, tests, and scripts
- **Symbol lookup** — use `mcp__webstorm__get_symbol_info` or `mcp__webstorm__search_symbol` for navigating code
- **Diagnostics** — use `mcp__webstorm__get_file_problems` for lint and type errors

Use any other `mcp__webstorm__*` tool it exposes when it is the most direct way to accomplish the task. Fall back to built-in tools only when the MCP server does not expose the needed capability.

## Opportunistic Code Improvement

When touching existing code, take the opportunity to improve it. Do not make changes for their own sake, but if you notice something in or near code you are already modifying, fix it:

- Simplify verbose or redundant expressions
- Improve naming to better reflect domain language (see DDD above)
- Replace hand-rolled array/object operations with lodash (see Lodash above)
- Extract repeated logic into well-named functions
- Remove dead code or unnecessary comments
- Align structure with the patterns described in this file

Scope improvements to the code you are already reading or modifying. Do not refactor entire files unprompted.
