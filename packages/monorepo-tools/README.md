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
  and per-check timing. It exports `runWorkspace`, which the worker reuses.
- `src/cli/run-workspace.worker.ts` is the long-lived Bun worker. The
  PowerShell orchestrator launches it once with a `--jobs <path>` file holding
  every workspace job (each `{ id, args }`); the worker reads the file, runs
  the jobs with bounded internal concurrency (the `--throttle` value, or the
  `CHECK_WORKER_THROTTLE` env var) and reuses `runWorkspace`, so there is only
  one `bun` process for the whole check instead of one per workspace. Because
  it is a single persistent process, it is also the natural home for a future
  shared WebStorm MCP connection (one SSE session reused across every
  workspace) — the check stays lint/tsc/test only for now.
- `src/cli/repo-ai-check.cli.ps1` is the PowerShell orchestrator: it discovers
  workspaces, applies file/workspace scopes, launches the single worker, and
  emits the aggregate JSON or Markdown report.
- `src/cli/vitest-coverage.cli.ts` wraps `vitest run --coverage` for the
  parent checker.

## Scripts

```bash
pnpm -F @ethang/monorepo-tools test         # vitest with 100/100/100/100 gate
pnpm -F @ethang/monorepo-tools lint         # eslint + tsc
pnpm -F @ethang/monorepo-tools check        # invoke the PowerShell orchestrator
```

## Checker runtime

`src/cli/repo-ai-check.cli.ps1` is the checker orchestrator. It owns workspace
discovery, file/workspace scoping, and launches a single long-lived Bun worker
(`run-workspace.worker.ts`) that runs every workspace's checks with bounded
internal concurrency (the `--throttle` value). The worker reuses `runWorkspace`
from `run-workspace.cli.ts`, so the JSON report shape and ESLint autofix
telemetry are unchanged. The orchestrator pipes the aggregated JSON to
`render-check-report.cli.ts` for Markdown (or emits the JSON directly with
`--format Json`). The orchestrator requires PowerShell 7+ and `bun` on PATH.

Run the checker through its package script:

```bash
pnpm --filter @ethang/monorepo-tools check -- --workspace monorepo-tools --skip-fix --format Json
```

The PowerShell CLI accepts `--workspace` and `--file` repeatedly, plus
`--throttle`, `--timeout-seconds`, `--skip-fix`, and `--format Json|Markdown`.
The default format is Markdown and the default throttle is the logical CPU
count (`$env:NUMBER_OF_PROCESSORS`).

## Coverage

`vitest.config.ts` enforces 100% line/branch/function/statement
coverage on `src/**/*.ts` with `autoUpdate: false`. Any drop below
100% fails CI.

## Hook status

`.github/hooks/post-tool-inspect.json` invokes the Bun TypeScript
entry point at `src/cli/post-tool-inspect.cli.ts`.