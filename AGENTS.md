# AGENTS.md

This document outlines the global rules, development principles, and tool-usage hierarchies for AI agents operating in
`ethang-monorepo`.

---

## CRITICAL: Read the README First

Before starting any task, AI agents **must** read [`README.md`](README.md) to understand the layout of the monorepo —
the active apps, packages, technologies, and tooling. The README is the source of truth for *what* exists in this
repo; this `AGENTS.md` focuses on *how* to work within it. Re-read the README after pulling if you are unsure which
workspaces, frameworks, or scripts are current.

---

## CRITICAL: Agent Operational Notes

**These notes are non-negotiable and MUST always be followed for every task:**

1. **ESLint Issue Resolution**: When fixing eslint issues, never take error messages or suggestions literally unless using autofix. Instead, examine the surrounding context and design a better solution that addresses the root cause.

2. **Write Tests First — No Exceptions (Red -> Green -> Refactor)**:
   Every change begins with a failing test. **Never write or modify implementation/production code before a failing test exists that captures the desired behavior or exposes the bug.** This applies to all changes without exception — including docs, generated code, configuration, and trivial formatting edits (write the smallest test that proves the change is correct).
   - **Red**: Write a failing test that captures the desired behavior or exposes a bug (hypothesis). For bugs, the bug itself is the hypothesis — write the test to prove it exists. For new features, the hypothesis is that X results in Y. Use `vitest it.each` liberally to consider all possible states (treat it like a state machine).
   - **Green**: Implement the minimum code to make the test pass. This directly addresses the hypothesis and fixes the identified issue.
   - **Refactor**: Simplify the implementation, run ESLint to ensure code quality, optimize performance, and enforce codebase standards without changing behavior.

3. **100% Coverage Discipline**: Every workspace targets 100% line/branch/function/statement coverage as a quality goal. The CI gate is set to 80%. To meet 100%, prefer to **extract logic into small, individually testable helper/utility functions** and **export previously unexported functions and classes** so the test suite can reach them.

4. **SWEBOK Principles**: Follow the principles of `/swebok` and reference them for everything.

5. **DDD Principles**: Follow the principles of Domain-Driven Design (DDD) for everything. **Use the `effect` MCP server as the vehicle to build DDD patterns** — model aggregates, value objects, domain services, and repositories as `Effect`s, `Layer`s, `Ref`s, and `Schema`s so that bounded contexts, invariants, and side effects are expressed declaratively in the type system. Prefer Effect primitives (e.g. `Effect.gen` for domain workflows, `Layer` for dependency injection of repositories and infrastructure ports, `Ref` for aggregate state, `Schema` for value object and command/query validation, `Schedule` for retry/policy on repository calls, `Stream` for domain event publishing) over hand-rolled classes, factories, and promises. This keeps the ubiquitous language, aggregates, and anti-corruption layers composable, testable, and resource-safe by construction.

6. **Tests as Finite State Machines**: Treat every unit under test as a finite state machine and exhaustively enumerate every reachable state, transition, and edge in the test suite. Use `vitest it.each` (or equivalent parameterized tests) to table-drive inputs across the full input domain — valid, invalid, boundary, empty, max-length, unicode, null/undefined, concurrent, error, and recovery states — so that "all states covered" is a structural property of the test, not an aspiration. When a function's behavior branches on a discriminated union, exhaust the union; when it loops, cover the zero-iteration, single-iteration, and N-iteration cases; when it composes side effects, assert both happy-path state and rollback/failure state. A test suite is incomplete until every state is either explicitly asserted or proven unreachable from every legal input via reasoning about the producer of that state. Do not leave a state untested because it is "obvious" — the rule's job is to catch regressions, not to be obvious.

7. **ESLint Autofix Runs on Edits (intentional)**: When an agent (human or AI) saves a file in any workspace, ESLint autofix runs against that file before the next read. This is **intentional**, not a bug. Autofix may rewrite code in ways that look like the author "lost" something — concrete examples observed in this repo:
   - `pnpm --filter @ethang/monorepo-tools check` runs `eslint --fix`, which can silently strip explicit return type annotations (per `@ethang/eslint-config`'s `no-restricted-syntax` rules), collapse inline type assertions, or swap hand-written code for `lodash` / `effect` library equivalents (`prefer-lodash-*`, `prefer-effect-*` rules).
   - `pnpm -r lint --fix` (or any equivalent that passes `--fix`) does the same per-file before `tsc` / `vitest` re-runs.
   - Hooks wired into the IDE / editor may also trigger autofix on save (see `.github/hooks/`).

   **When you encounter this:**
   - Treat the post-autofix diff as expected, not adversarial. Do not re-introduce a removed return type or undo a `prefer-*` migration just to "match what you wrote" — the autofix is enforcing `@ethang/eslint-config`, which is the source of truth.
   - When fixing a tsc / lint / test failure, read `lint.autofix` (from the monorepo-tools checker's JSON output, or `pnpm -r lint:fix` summary) **before** re-running the script — it tells you what was already rewritten so you don't get a different fix set.
   - This is why the rules above say "examine the surrounding context and design a better solution" rather than "fix what the linter complained about" — the linter and its autofix are tools; you are responsible for the result.

8. **Refactor When Touching Existing Code**: When modifying existing code — whether for a feature, bugfix, or test — scan the surrounding module for structural improvements. Look for: duplicated logic extractable into a shared utility, functions that have grown too large and should be split, conditionals simplifiable via polymorphism or pattern matching, and test gaps that can be filled. Scope refactoring to the module being changed; do not expand into unrelated files. Run the test suite before and after to confirm no behavior change.

---

## MCP Servers

The following MCP servers are available. Use them when the task matches their purpose rather than relying on pre-trained knowledge — they provide accurate, up-to-date documentation.

| Server | Tools | When to Use |
| -------- | ------- | ------------- |
| **effect** | 7 | Effect-ts library questions: search docs, read guides/READMEs for `@effect/cli`, `@effect/platform`, `@effect/rpc`, `@effect/sql` |
| **mdn** | 3 | JavaScript, CSS, HTML, Web API documentation — use instead of general knowledge for web platform features |
| **astro** | 1 | Astro framework questions — search official Astro docs |
| **chrome-devtools** | 29 | Browser debugging: inspect elements, network analysis, performance profiling, LCP/INP/CLS audits, accessibility debugging |
| **playwright** | 23 | Browser automation and testing — interact with web pages programmatically |

Usage:

```typescript
// List tools from a server
mcp({ server: "effect" })

// Search for documentation
mcp({ search: "query" })

// Call a specific tool
mcp({ tool: "tool_name", args: { key: "value" } })
```

---

## TanStack CLI Documentation

When working with TanStack libraries, use the CLI to access documentation directly rather than relying on pre-trained knowledge:

```bash
# List available libraries and their docs
pnpx @tanstack/cli libraries

# Search documentation for a specific topic
pnpx @tanstack/cli@latest search-docs --help
```

---

## Package Dependency Conventions

When installing and using packages in this repository, **do not assume the `workspace:*` convention**. Many packages are published and installed via the registry. Always look at how other apps/packages use them before adding a new dependency.
