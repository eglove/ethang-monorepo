# `@ethang/monorepo-tools`

TypeScript/Bun tooling for monorepo validation and Copilot hooks.

## Why

The legacy root PowerShell checker delegated lint/tsc/vitest parsing to
inline helpers and to three loose `.mjs` shims under
`scripts/`. This package consolidates every parsing decision into
one TypeScript codebase organised along DDD layers:

- `src/domain/` — pure analyzers (no IO).
- `src/infrastructure/` — IO wrappers (fs, ESLint Node API, MCP SSE,
  vitest spawn, dynamic markdown-generator import).
- `src/application/` — orchestrators that wire domain + infrastructure.
- `src/cli/` — Bun entry points invoked by pnpm or by the Copilot
  PostToolUse hook.

## CLI entry points

- `src/cli/eslint-autofix.cli.ts` provides ESLint autofix telemetry.
- `src/cli/render-check-report.cli.ts` renders aggregate reports.
- `src/cli/post-tool-inspect.cli.ts` implements the active PostToolUse hook.
- `src/cli/run-workspace.cli.ts` runs selected lint, TypeScript, and Vitest
  checks for one workspace on behalf of the checker, including scoped files
  and per-check timing.
- `src/cli/repo-ai-check.cli.ts` discovers workspaces, applies file scopes,
  throttles workspace checks, and emits the aggregate JSON or Markdown report.
- `src/cli/vitest-coverage.cli.ts` wraps `vitest run --coverage` for the
  parent checker.

## Scripts

```bash
pnpm -F @ethang/monorepo-tools test         # vitest with 100/100/100/100 gate
pnpm -F @ethang/monorepo-tools lint         # eslint + tsc
pnpm -F @ethang/monorepo-tools check        # invoke the Bun checker
```

## Checker runtime

`src/cli/repo-ai-check.cli.ts` is the checker implementation. It delegates
per-workspace checks to `run-workspace.cli.ts` and report rendering to
`render-check-report.cli.ts`.

Run the checker through its package script:

```bash
pnpm --filter @ethang/monorepo-tools check -- --workspace monorepo-tools --skip-fix --format Json
```

The Bun CLI accepts `--workspace` and `--file` repeatedly, plus `--throttle`,
`--timeout-seconds`, `--skip-fix`, and `--format Json|Markdown`.

## Coverage

`vitest.config.ts` enforces 100% line/branch/function/statement
coverage on `src/**/*.ts` with `autoUpdate: false`. Any drop below
100% fails CI.

## Hook status

`.github/hooks/post-tool-inspect.json` invokes the Bun TypeScript
entry point at `src/cli/post-tool-inspect.cli.ts`.