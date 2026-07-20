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

3. **100% Coverage Discipline**: Every workspace enforces 100% line/branch/function/statement coverage as a CI gate. To meet it, prefer to **extract logic into small, individually testable helper/utility functions** and **export previously unexported functions and classes** so the test suite can reach them. Reaching for `/* v8 ignore next */` [v8 ignore documentation](https://github.com/AriPerkkio/ast-v8-to-istanbul?tab=readme-ov-file#ignoring-code) is acceptable only for branches that are genuinely unreachable from any legal input (e.g. a defensive check for a node kind the parser cannot produce in that position). Before adding an ignore comment, prove the branch is unreachable by tracing all producers of that AST node kind; do not use ignores to paper over missing test cases.

4. **SWEBOK Principles**: Follow the principles of `/swebok` and reference them for everything.

5. **DDD Principles**: Follow the principles of Domain-Driven Design (DDD) and reference the `/ddd` skill for everything. **Use `/effect-ts` as the vehicle to build DDD patterns** — model aggregates, value objects, domain services, and repositories as `Effect`s, `Layer`s, `Ref`s, and `Schema`s so that bounded contexts, invariants, and side effects are expressed declaratively in the type system. Prefer Effect primitives (e.g. `Effect.gen` for domain workflows, `Layer` for dependency injection of repositories and infrastructure ports, `Ref` for aggregate state, `Schema` for value object and command/query validation, `Schedule` for retry/policy on repository calls, `Stream` for domain event publishing) over hand-rolled classes, factories, and promises. This keeps the ubiquitous language, aggregates, and anti-corruption layers composable, testable, and resource-safe by construction.

6. **Tests as Finite State Machines**: Treat every unit under test as a finite state machine and exhaustively enumerate every reachable state, transition, and edge in the test suite. Use `vitest it.each` (or equivalent parameterized tests) to table-drive inputs across the full input domain — valid, invalid, boundary, empty, max-length, unicode, null/undefined, concurrent, error, and recovery states — so that "all states covered" is a structural property of the test, not an aspiration. When a function's behavior branches on a discriminated union, exhaust the union; when it loops, cover the zero-iteration, single-iteration, and N-iteration cases; when it composes side effects, assert both happy-path state and rollback/failure state. A test suite is incomplete until every state is either explicitly asserted or proven unreachable from every legal input via reasoning about the producer of that state. Do not leave a state untested because it is "obvious" — the rule's job is to catch regressions, not to be obvious.

7. **ESLint Autofix Runs on Edits (intentional)**: When an agent (human or AI) saves a file in any workspace, ESLint autofix runs against that file before the next read. This is **intentional**, not a bug. Autofix may rewrite code in ways that look like the author "lost" something — concrete examples observed in this repo:
   - `pnpm --filter @ethang/monorepo-tools check` runs `eslint --fix`, which can silently strip explicit return type annotations (per `@ethang/eslint-config`'s `no-restricted-syntax` rules), collapse inline type assertions, or swap hand-written code for `lodash` / `effect` library equivalents (`prefer-lodash-*`, `prefer-effect-*` rules).
   - `pnpm -r lint --fix` (or any equivalent that passes `--fix`) does the same per-file before `tsc` / `vitest` re-runs.
   - Hooks wired into the IDE / editor may also trigger autofix on save (see `.github/hooks/`).

   **When you encounter this:**
   - Treat the post-autofix diff as expected, not adversarial. Do not re-introduce a removed return type or undo a `prefer-*` migration just to "match what you wrote" — the autofix is enforcing `@ethang/eslint-config`, which is the source of truth.
   - When fixing a tsc / lint / test failure, read `lint.autofix` (from the monorepo-tools checker's JSON output, or `pnpm -r lint:fix` summary) **before** re-running the script — it tells you what was already rewritten so you don't get a different fix set.
   - This is why the rules above say "examine the surrounding context and design a better solution" rather than "fix what the linter complained about" — the linter and its autofix are tools; you are responsible for the result.

---

## Hermes Hooks (Repo-Local)

This repo uses a Hermes shell hook for post-edit inspections:

- **Hook event:** `post_tool_call` (fires after patch/write_file tools)
- **Matcher:** `^(patch|write_file)$`
- **Script:** `.hermes/agent-hooks/post-tool-inspect.sh` (repo-local)
- **Behavior:** Runs ESLint --fix and WebStorm MCP inspections after file edits
- **Scope:** Only activates when cwd is inside this repo (checked in script)
- **Config:** `~/.hermes/config.yaml` (user-level, references repo-local script)

### Setup

1. Ensure `~/.hermes/config.yaml` has the hook configured:
   ```yaml
   hooks:
     post_tool_call:
       - matcher: "^(patch|write_file)$"
         command: "sh /c/Users/glove/projects/ethang-monorepo/.hermes/agent-hooks/post-tool-inspect.sh"
         timeout: 15
   ```

2. Verify with `hermes hooks list`

3. To modify hook behavior, edit:
   - `.hermes/agent-hooks/post-tool-inspect.sh` (shell wrapper)
   - `packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts` (inspection logic)

---

## CRITICAL: `.agents/` is a Generated Artifact

**Never edit files in `.agents/` directly.** The `.agents/` directory (which contains workspace rules, commands, skills,
MCP configuration, and a manifest) is compiled from TypeScript definitions and will be overwritten on the next build.
Any direct edits will be lost.

Only skills tracked in `.agents/.manifest.json` are generated by the build process. Files in `.agents/` that are not
in the manifest are left untouched.

All changes to agent rules, commands, skills, and configuration must go through the compiler package:

* **Source Path:** `packages/agents-build/`

After modifying TypeScript definitions in the builder, compile the changes with:

```bash
pnpm --filter @ethang/agents-build build
```

This compiles the configurations into the `.agents/` directory, validating rules against sizing limits, SWEBOK router
integrity, and drift checks.

---

## Skills Discovery

Skills are available in two locations:

* **`.github/skills/`** — Generated skills from the compiler
* **`.agents/skills/`** — External skills installed by skills.sh

When resolving skill references, check both locations. The `.agents/skills/` directory contains external skills (402 items), while `.github/skills/` contains repository-specific custom skills (7 items).

---

## CRITICAL: Tool Usage

AI agents must follow this tool priority order:

1. **WebStorm MCP** — use for: file reads/writes/creates/renames, refactoring, builds, database/SQL queries, code search, symbol navigation, rename refactoring
2. **PowerShell + Specialized CLIs** (fallback) — use `rg`, `jq`, `es` (Everything Search), `gh`

---

## Parallel Agent Execution & Efficiency

To optimize resource usage, latency, and token consumption:

* **Fan out work** into parallel subagents as often as possible.
* **Choose the minimum model and effort level** required for each task to minimize token usage.

## Package Dependency Conventions

When installing and using packages in this repository, **do not assume the `workspace:*` convention**. Many packages are published and installed via the registry. Always look at how other apps/packages use them before adding a new dependency.

## CRITICAL: Monorepo Quality Checks

When validating code in this monorepo, **AI agents should prefer `pnpm --filter @ethang/monorepo-tools check --` over running `pnpm -r lint` / `pnpm test` / `pnpm -r tsc` individually.** The checker's PowerShell orchestrator at `packages/monorepo-tools/src/cli/repo-ai-check.cli.ps1` discovers workspaces, applies `--file` / `--workspace` scoping, then launches a single long-lived Bun worker (`packages/monorepo-tools/src/cli/run-workspace.worker.ts`) that runs eslint, tsc, and vitest across every workspace with bounded internal concurrency (throttled to the logical CPU count by default). The worker reuses `runWorkspace` from `run-workspace.cli.ts`, so there is one `bun` process for the whole check, and emits a single combined JSON document on stdout, so you can see *all* failures (lint + tsc + test) at once instead of fixing one class of error, rerunning, and discovering the next. The orchestrator pipes the aggregated JSON to `packages/monorepo-tools/src/cli/render-check-report.cli.ts` for Markdown (the same JSON shape is also emitted directly with `--format Json`). Human-readable progress is on stderr; stdout is reserved for the report. See `packages/monorepo-tools/README.md` for usage.

To narrow scope while iterating, repeat `--workspace <name>` and/or `--file <relative-or-absolute-path>`. eslint is fully targeted to the given files; tsc still type-checks the whole workspace but only surfaces diagnostics for the targeted files; vitest runs the co-located `*.test.ts`/`*.test.tsx` siblings of each file (or the full workspace vitest if none exist). Both flags are combinable and intersect: `--file foo.ts --workspace auth --workspace store` only runs files inside the listed workspaces.

### Lint autofix telemetry

The default invocation runs `eslint --fix` so auto-fixable issues get rewritten silently. Because `lint.issues[]` only shows *unfixed* problems, the script also exposes a `lint.autofix` block on each workspace result describing what was rewritten:

- `fixedErrorCount` / `fixedWarningCount`: scalar totals for the workspace.
- `byFile[]`: `{ file, fixedErrorCount, fixedWarningCount, fixedByRule: { ruleId: count } }`.
- `byRule[]`: `{ ruleId, fixedErrorCount, fixedWarningCount, fileCount }` aggregated across the workspace.
- `unfixableButFixable[]`: pre-fix messages where the rule was `fixable:true` but the message still appears in the post-fix pass (often a rule conflict).

`lint.autofix` is `null` when `--skip-fix` is used (so the LLM can tell the difference between "no fixes applied" and "telemetry unavailable"). The checker aggregates the telemetry produced by the package ESLint CLI and diffs pre/post messages by `(ruleId, line, column, message)`.

The root-level `summary.lint.autofix` aggregates across all workspaces: `ran`, `ranInWorkspaces`, summed `fixedErrorCount` / `fixedWarningCount`, and a top-10 `byRule` list. **Read `lint.autofix` instead of re-running `eslint --fix` to discover what the script silently rewrote** — re-running risks producing a different fix set if the rules have moved on since the last invocation.

The autofix telemetry is produced by `packages/monorepo-tools/src/cli/eslint-autofix.cli.ts`, a Bun TypeScript entry point backed by the ESLint Node API (`ESLint.lintFiles({fix:true})` followed by `ESLint.outputFixes()` and a second `lintFiles` pass). If the entry point is missing, the parent checker fails fast with a clear stderr message.

### Output format

The default is **`-Format Markdown`**: the same JSON document is piped through `packages/monorepo-tools/src/cli/render-check-report.cli.ts` (a Bun TypeScript entry point that imports `@ethang/markdown-generator` via its file URL) and rendered as a tight, LLM-readable report on stdout. Pass `-Format Json` to get the raw JSON instead — useful for piping to `jq` or programmatic consumers.

The markdown shape (kept deliberately minimal so the LLM has only the information needed to make fixes):

- One-line exit-code banner with duration + workspace count.
- Summary table (check / ran / passed / failed / errors / warnings).
- Optional "Autofix applied" block listing the top rules per workspace, only when `--fix` was used.
- One "Failed: <name> (<path>)" section per failing workspace with up to three sub-headers (lint / tsc / test).
  - lint: numbered list of unfixed issues as `file:line:col  ruleId [severity]  message`. An alert notes when autofix already ran.
  - tsc: numbered list of diagnostics as `file:line:col  TScode  message`.
  - test: failing test names + first error line; falls back to a parse-error / exit-code note when no test-level detail is available.
- "Passed (N)" bullet list of the workspaces that ran clean.

Excluded from the markdown (still in `--format Json`): per-issue `fix: { range, text }` payloads, vitest's per-test `testResults[]`, every `durationMs`, `cwd`/`configPath` from the shim, `parseError` stacks. For a typical 4-workspace failure, the JSON is ~40 KB / ~10K tokens and the markdown is ~3 KB / ~700 tokens. Use `--format Json` whenever you need to drill in (e.g. `jq '.workspaces[].lint.autofix.byFile'`); use the markdown default whenever you just need to see "what to fix next".
